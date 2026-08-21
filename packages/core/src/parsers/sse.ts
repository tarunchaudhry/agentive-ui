import type { AgentEvent } from "../types"

const decoder = new TextDecoder()

/** Type guard: a parsed payload is at least shaped like an `AgentEvent`. */
export function isAgentEvent(value: unknown): value is AgentEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { type?: unknown }).type === "string"
  )
}

/**
 * Parse a Server-Sent Events byte/string stream into `AgentEvent`s.
 * Handles multi-line `data:` frames and ignores `[DONE]` sentinels.
 */
export async function* parseSSE(
  source: AsyncIterable<Uint8Array | string>
): AsyncGenerator<AgentEvent> {
  let buffer = ""
  for await (const chunk of source) {
    buffer +=
      typeof chunk === "string"
        ? chunk
        : decoder.decode(chunk, { stream: true })

    let separator: number
    while ((separator = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, separator)
      buffer = buffer.slice(separator + 2)
      const event = parseSSEFrame(frame)
      if (event) yield event
    }
  }

  if (buffer.trim().length > 0) {
    const event = parseSSEFrame(buffer)
    if (event) yield event
  }
}

function parseSSEFrame(frame: string): AgentEvent | null {
  const dataLines: string[] = []
  for (const line of frame.split("\n")) {
    const trimmed = line.replace(/\r$/, "")
    if (trimmed.startsWith("data:")) {
      dataLines.push(trimmed.slice("data:".length).trimStart())
    }
  }
  if (dataLines.length === 0) return null
  const data = dataLines.join("\n")
  if (data === "[DONE]") return null
  try {
    const parsed: unknown = JSON.parse(data)
    return isAgentEvent(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Parse a newline-delimited JSON (NDJSON) stream into `AgentEvent`s.
 */
export async function* parseNDJSON(
  source: AsyncIterable<Uint8Array | string>
): AsyncGenerator<AgentEvent> {
  let buffer = ""
  for await (const chunk of source) {
    buffer +=
      typeof chunk === "string"
        ? chunk
        : decoder.decode(chunk, { stream: true })

    let newline: number
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line.length === 0) continue
      try {
        const parsed: unknown = JSON.parse(line)
        if (isAgentEvent(parsed)) yield parsed
      } catch {
        // Skip malformed lines.
      }
    }
  }

  if (buffer.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(buffer.trim())
      if (isAgentEvent(parsed)) yield parsed
    } catch {
      // Ignore trailing garbage.
    }
  }
}
