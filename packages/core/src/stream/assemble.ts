import type {
  AgentEvent,
  AgentMessage,
  MessagePart,
  MessageRole,
  StreamStatus,
} from "../types"

/**
 * Mutable-free accumulator produced by folding `AgentEvent`s together.
 *
 * The reducer is *referentially* smart: only the message (and its parts
 * array) affected by an event gets a new object identity. All other messages
 * keep their previous reference so memoized message rows skip re-rendering
 * while a single message streams.
 */
export interface AgentStreamState {
  messages: AgentMessage[]
  status: StreamStatus
  error?: { message: string; code?: string }
}

export function createInitialState(): AgentStreamState {
  return { messages: [], status: "idle" }
}

function messageById(
  state: AgentStreamState,
  id: string
): AgentMessage | undefined {
  return state.messages.find((m) => m.id === id)
}

/**
 * Apply `updater` to the message with `id`, creating it first if absent.
 * Returns a new state; unrelated messages keep their identity.
 */
function updateMessage(
  state: AgentStreamState,
  id: string,
  role: MessageRole,
  updater: (message: AgentMessage) => AgentMessage
): AgentStreamState {
  const index = state.messages.findIndex((m) => m.id === id)
  if (index === -1) {
    const created = updater({
      id,
      role,
      parts: [],
      status: "streaming",
      createdAt: Date.now(),
    })
    return {
      ...state,
      status: "streaming",
      messages: [...state.messages, created],
    }
  }
  const existing = state.messages[index]
  if (existing === undefined) return state
  const messages = state.messages.slice()
  messages[index] = updater(existing)
  return { ...state, messages }
}

/**
 * Apply `updater` to the tool-call part identified by `toolCallId`, searching
 * across all messages (tool deltas may not carry a message id). Returns a new
 * state only when a matching part was found.
 */
function updateToolCall(
  state: AgentStreamState,
  toolCallId: string,
  updater: (part: Extract<MessagePart, { type: "tool-call" }>) => MessagePart
): AgentStreamState {
  let changed = false
  const messages = state.messages.map((message) => {
    const has = message.parts.some(
      (p) => p.type === "tool-call" && p.call.id === toolCallId
    )
    if (!has) return message
    changed = true
    return {
      ...message,
      parts: message.parts.map((p) =>
        p.type === "tool-call" && p.call.id === toolCallId ? updater(p) : p
      ),
    }
  })
  return changed ? { ...state, messages } : state
}

function appendText(message: AgentMessage, text: string): AgentMessage {
  const parts = message.parts.slice()
  const last = parts[parts.length - 1]
  if (last && last.type === "text") {
    parts[parts.length - 1] = { ...last, text: last.text + text }
  } else {
    parts.push({
      type: "text",
      id: `${message.id}:text:${parts.length}`,
      text,
    })
  }
  return { ...message, parts }
}

function updatePart(
  message: AgentMessage,
  partId: string,
  updater: (part: MessagePart) => MessagePart
): AgentMessage {
  const index = message.parts.findIndex((p) => p.id === partId)
  if (index === -1) return message
  const existing = message.parts[index]
  if (existing === undefined) return message
  const parts = message.parts.slice()
  parts[index] = updater(existing)
  return { ...message, parts }
}

/** Attempt to parse a JSON args payload, falling back to the raw value. */
function parseArgs(argsText: string | undefined, fallback: unknown): unknown {
  if (argsText === undefined || argsText.trim() === "") return fallback
  try {
    return JSON.parse(argsText)
  } catch {
    return fallback ?? argsText
  }
}

/**
 * Fold a single `AgentEvent` into the accumulated stream state. Pure aside
 * from wall-clock timestamps. This is the canonical event → message assembly
 * logic shared by all transports and exported for direct testing.
 */
export function applyAgentEvent(
  state: AgentStreamState,
  event: AgentEvent
): AgentStreamState {
  switch (event.type) {
    case "message-start": {
      const existing = messageById(state, event.messageId)
      if (existing) {
        return state.status === "streaming"
          ? state
          : { ...state, status: "streaming" }
      }
      return {
        status: "streaming",
        messages: [
          ...state.messages,
          {
            id: event.messageId,
            role: event.role,
            parts: [],
            status: "streaming",
            createdAt: Date.now(),
          },
        ],
      }
    }

    case "text-delta": {
      return updateMessage(state, event.messageId, "assistant", (m) =>
        appendText(m, event.delta)
      )
    }

    case "reasoning-start": {
      return updateMessage(state, event.messageId, "assistant", (m) => ({
        ...m,
        parts: [
          ...m.parts,
          {
            type: "reasoning",
            id: event.partId,
            text: "",
            status: "streaming",
          },
        ],
      }))
    }

    case "reasoning-delta": {
      return updateMessage(state, event.messageId, "assistant", (m) =>
        updatePart(m, event.partId, (p) =>
          p.type === "reasoning" ? { ...p, text: p.text + event.delta } : p
        )
      )
    }

    case "reasoning-end": {
      return updateMessage(state, event.messageId, "assistant", (m) =>
        updatePart(m, event.partId, (p) =>
          p.type === "reasoning" ? { ...p, status: "complete" } : p
        )
      )
    }

    case "tool-call-start": {
      return updateMessage(state, event.messageId, "assistant", (m) => ({
        ...m,
        parts: [
          ...m.parts,
          {
            type: "tool-call",
            id: event.partId,
            call: {
              id: event.toolCallId,
              name: event.toolName,
              args: event.args,
              argsText: undefined,
              status: "running",
              createdAt: Date.now(),
            },
          },
        ],
      }))
    }

    case "tool-call-delta": {
      return updateToolCall(state, event.toolCallId, (p) => ({
        ...p,
        call: {
          ...p.call,
          argsText: (p.call.argsText ?? "") + event.argsDelta,
        },
      }))
    }

    case "tool-call-end": {
      return updateToolCall(state, event.toolCallId, (p) => ({
        ...p,
        call: {
          ...p.call,
          args: parseArgs(p.call.argsText, event.args ?? p.call.args),
          status: event.status ?? "success",
          completedAt: Date.now(),
        },
      }))
    }

    case "tool-result": {
      return updateMessage(state, event.messageId, "assistant", (m) => {
        const parts = m.parts.map((p) =>
          p.type === "tool-call" && p.call.id === event.toolCallId
            ? {
                ...p,
                call: {
                  ...p.call,
                  result: event.result,
                  status: event.status ?? "success",
                },
              }
            : p
        )
        parts.push({
          type: "tool-result",
          id: `${event.toolCallId}:result`,
          toolCallId: event.toolCallId,
          result: event.result,
          status: event.status ?? "success",
          resultText: event.resultText,
        })
        return { ...m, parts }
      })
    }

    case "source": {
      return updateMessage(state, event.messageId, "assistant", (m) => {
        const parts = m.parts.slice()
        const last = parts[parts.length - 1]
        if (last && last.type === "source") {
          parts[parts.length - 1] = {
            ...last,
            sources: [...last.sources, event.source],
          }
        } else {
          parts.push({
            type: "source",
            id: `${m.id}:source:${parts.length}`,
            sources: [event.source],
          })
        }
        return { ...m, parts }
      })
    }

    case "source-list": {
      return updateMessage(state, event.messageId, "assistant", (m) => ({
        ...m,
        parts: [
          ...m.parts,
          {
            type: "source",
            id: `${m.id}:source:${m.parts.length}`,
            sources: event.sources,
          },
        ],
      }))
    }

    case "approval-required": {
      // Approvals are handled by useToolApprovals; no message part is added.
      return state
    }

    case "message-end": {
      return updateMessage(state, event.messageId, "assistant", (m) => ({
        ...m,
        status: "complete",
      }))
    }

    case "error": {
      let next: AgentStreamState = {
        ...state,
        error: { message: event.message, code: event.code },
        status: "error",
      }
      if (event.messageId) {
        next = updateMessage(next, event.messageId, "assistant", (m) => ({
          ...m,
          status: "error",
          parts: [
            ...m.parts,
            {
              type: "error",
              id: `${event.messageId}:error:${m.parts.length}`,
              message: event.message,
              code: event.code,
              recoverable: event.recoverable,
            },
          ],
        }))
      }
      return next
    }

    default: {
      // Exhaustiveness guard: unknown events are ignored.
      const _exhaustive: never = event
      void _exhaustive
      return state
    }
  }
}
