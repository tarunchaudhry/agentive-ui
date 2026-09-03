import type {
  AgentEvent,
  AgentMessage,
  MessagePart,
  StreamStatus,
  ToolCall,
} from "../types"

/**
 * Minimal duck-typed shape of a Vercel AI SDK UI message.
 *
 * Supports both generations:
 * - v4 (`@ai-sdk/react@1.x`): `content` + `toolInvocations` + `reasoning`.
 * - v5+ (`@ai-sdk/react@4.x`, `ai@5+`): `parts` array with typed
 *   `text` / `reasoning` / `tool-<name>` / `dynamic-tool` / `step-start` parts.
 */
export interface AISDKUIPart {
  type: string
  text?: string
  toolCallId?: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

export interface AISDKMessageLike {
  id: string
  role: string
  content?: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    args: unknown
    result?: unknown
    state?: "call" | "result" | "partial-call"
  }>
  createdAt?: Date | number
  reasoning?: string
  /** v5+ message parts (takes precedence over v4 fields when present). */
  parts?: AISDKUIPart[]
  /** v5+ per-message status. */
  status?: "submitted" | "streaming" | "ready" | "error"
}

function mapV5MessageStatus(
  status: AISDKMessageLike["status"]
): StreamStatus | undefined {
  switch (status) {
    case "streaming":
    case "submitted":
      return "streaming"
    case "ready":
      return "complete"
    case "error":
      return "error"
    default:
      return undefined
  }
}

/**
 * Map a v5+ `parts` array onto `MessagePart[]`.
 * Unknown part types (`step-start`, `data-*`, `file`, …) are skipped.
 */
export function partsFromAISDKUIMessage(
  messageId: string,
  parts: AISDKUIPart[]
): MessagePart[] {
  const out: MessagePart[] = []
  let textIndex = 0
  let reasoningIndex = 0

  for (const part of parts) {
    if (part.type === "text" && typeof part.text === "string") {
      out.push({
        type: "text",
        id: `${messageId}:text:${textIndex++}`,
        text: part.text,
      })
    } else if (part.type === "reasoning" && typeof part.text === "string") {
      out.push({
        type: "reasoning",
        id: `${messageId}:reasoning:${reasoningIndex++}`,
        text: part.text,
        status: part.state === "streaming" ? "streaming" : "complete",
      })
    } else if (
      (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
      part.toolCallId
    ) {
      const toolName =
        part.type === "dynamic-tool"
          ? "dynamic-tool"
          : part.type.slice("tool-".length)
      const callStatus: ToolCall["status"] =
        part.state === "output-available"
          ? "success"
          : part.state === "output-error" || part.state === "output-denied"
            ? part.state === "output-denied"
              ? "cancelled"
              : "error"
            : "running"
      out.push({
        type: "tool-call",
        id: `${part.toolCallId}:call`,
        call: {
          id: part.toolCallId,
          name: toolName,
          args: part.input,
          result: part.state === "output-available" ? part.output : undefined,
          status: callStatus,
        },
      })
      if (part.state === "output-available") {
        out.push({
          type: "tool-result",
          id: `${part.toolCallId}:result`,
          toolCallId: part.toolCallId,
          result: part.output,
          status: "success",
        })
      }
    }
    // step-start, data-*, file and other parts are intentionally skipped.
  }

  return out
}

/**
 * Maps a list of Vercel AI SDK `useChat` messages into `AgentMessage[]`.
 * Pure and synchronous; suitable for `useMemo(() => fromAISDKMessages(messages), [messages])`.
 */
export function fromAISDKMessages(
  messages: AISDKMessageLike[],
  streamStatus: StreamStatus = "complete"
): AgentMessage[] {
  return messages.map((msg, index) => {
    const isLast = index === messages.length - 1
    const status: StreamStatus =
      mapV5MessageStatus(msg.status) ?? (isLast ? streamStatus : "complete")

    // v5+ shape: derive parts directly from the typed parts array.
    if (msg.parts) {
      return {
        id: msg.id,
        role: (msg.role === "user" ||
        msg.role === "assistant" ||
        msg.role === "system"
          ? msg.role
          : "assistant") as AgentMessage["role"],
        parts: partsFromAISDKUIMessage(msg.id, msg.parts),
        createdAt:
          typeof msg.createdAt === "number"
            ? msg.createdAt
            : msg.createdAt instanceof Date
              ? msg.createdAt.getTime()
              : undefined,
        status,
      }
    }

    const parts: MessagePart[] = []

    // 1. Reasoning part if present
    if (msg.reasoning) {
      parts.push({
        type: "reasoning",
        id: `${msg.id}:reasoning`,
        text: msg.reasoning,
        status: status === "streaming" && isLast ? "streaming" : "complete",
      })
    }

    // 2. Tool calls / invocations
    if (msg.toolInvocations && msg.toolInvocations.length > 0) {
      for (const inv of msg.toolInvocations) {
        const hasResult = inv.state === "result" || inv.result !== undefined
        const toolCall: ToolCall = {
          id: inv.toolCallId,
          name: inv.toolName,
          args: inv.args,
          result: inv.result,
          status: hasResult ? "success" : "running",
        }

        parts.push({
          type: "tool-call",
          id: `${inv.toolCallId}:call`,
          call: toolCall,
        })

        if (hasResult) {
          parts.push({
            type: "tool-result",
            id: `${inv.toolCallId}:result`,
            toolCallId: inv.toolCallId,
            result: inv.result,
            status: "success",
          })
        }
      }
    }

    // 3. Text content if present
    if (msg.content) {
      parts.push({
        type: "text",
        id: `${msg.id}:text`,
        text: msg.content,
      })
    }

    return {
      id: msg.id,
      role: (msg.role === "user" ||
      msg.role === "assistant" ||
      msg.role === "system"
        ? msg.role
        : "assistant") as AgentMessage["role"],
      parts,
      createdAt:
        typeof msg.createdAt === "number"
          ? msg.createdAt
          : msg.createdAt instanceof Date
            ? msg.createdAt.getTime()
            : undefined,
      status,
    }
  })
}

/**
 * Transforms an AI SDK Data Stream protocol chunk (e.g. 0:"text", 9:{"toolCallId"...})
 * into transport-neutral `AgentEvent`s.
 */
export function parseAISDKDataStreamChunk(
  chunk: string,
  currentMessageId: string
): AgentEvent[] {
  const events: AgentEvent[] = []
  const lines = chunk.split("\n")

  for (const line of lines) {
    if (!line || line.length < 3) continue
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const prefix = line.slice(0, colonIndex)
    const rawData = line.slice(colonIndex + 1)

    try {
      if (prefix === "0") {
        // Text delta: JSON encoded string
        const text = JSON.parse(rawData) as string
        events.push({
          type: "text-delta",
          messageId: currentMessageId,
          delta: text,
        })
      } else if (prefix === "g" || prefix === "b") {
        // Reasoning delta (AI SDK v4.1+)
        const text = JSON.parse(rawData) as string
        events.push({
          type: "reasoning-delta",
          messageId: currentMessageId,
          partId: `${currentMessageId}:reasoning`,
          delta: text,
        })
      } else if (prefix === "9") {
        // Tool call start / definition
        const call = JSON.parse(rawData) as {
          toolCallId: string
          toolName: string
          args: unknown
        }
        events.push({
          type: "tool-call-start",
          messageId: currentMessageId,
          partId: `${call.toolCallId}:part`,
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          args: call.args,
        })
      } else if (prefix === "a") {
        // Tool result
        const result = JSON.parse(rawData) as {
          toolCallId: string
          result: unknown
        }
        events.push({
          type: "tool-result",
          messageId: currentMessageId,
          toolCallId: result.toolCallId,
          result: result.result,
          status: "success",
        })
      } else if (prefix === "e" || prefix === "3") {
        // Error
        const error = JSON.parse(rawData)
        events.push({
          type: "error",
          messageId: currentMessageId,
          message:
            typeof error === "string"
              ? error
              : (error.message ?? "Unknown stream error"),
        })
      }
    } catch {
      // Ignore unparseable control chunks
    }
  }

  return events
}
