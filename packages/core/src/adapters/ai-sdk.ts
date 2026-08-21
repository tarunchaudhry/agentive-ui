import type {
  AgentEvent,
  AgentMessage,
  MessagePart,
  StreamStatus,
  ToolCall,
} from "../types"

/**
 * Minimal duck-typed shape of an AI SDK v4 / v5 UI message
 * (compatible with `Message` from `@ai-sdk/react` or `ai`).
 */
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
    const status: StreamStatus = isLast ? streamStatus : "complete"
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
