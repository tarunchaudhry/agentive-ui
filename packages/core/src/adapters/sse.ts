import type { AgentEvent } from "../types"
import { parseSSE } from "../parsers/sse"

/** Convert a web `ReadableStream` into an async iterable of byte chunks. */
async function* streamToAsyncIterable(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

export interface SSEStreamOptions {
  /** HTTP method. Defaults to GET. */
  method?: "GET" | "POST"
  /** Request body for POST requests. */
  body?: BodyInit
  /** Additional headers merged with the Accept header. */
  headers?: Record<string, string>
  /** Abort signal to cancel the underlying fetch. */
  signal?: AbortSignal
}

/**
 * Open a raw SSE endpoint and yield its events as `AgentEvent`s.
 *
 * This is the lowest-level transport adapter: it assumes the server emits
 * JSON-encoded `AgentEvent` objects in SSE `data:` frames (or NDJSON lines).
 * For AI SDK / LangGraph streams, use their dedicated adapters instead.
 */
export async function* createSSEStream(
  url: string,
  options: SSEStreamOptions = {}
): AsyncGenerator<AgentEvent> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    body: options.body,
    signal: options.signal,
    headers: {
      Accept: "text/event-stream",
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(
      `SSE request failed: ${response.status} ${response.statusText}`
    )
  }
  if (!response.body) {
    throw new Error("SSE response has no readable body")
  }

  yield* parseSSE(streamToAsyncIterable(response.body))
}
