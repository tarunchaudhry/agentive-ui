import { useCallback, useEffect, useRef, useState } from "react"

import type { AgentEvent, AgentMessage, ToolApprovalRequest } from "../types"
import {
  applyAgentEvent,
  createInitialState,
  type AgentStreamState,
} from "../stream/assemble"

export interface UseAgentStreamOptions {
  /** Invoked when a stream emits an `approval-required` event. */
  onApprovalRequired?: (request: ToolApprovalRequest) => void
  /** Invoked when the stream errors or is aborted. */
  onError?: (error: Error) => void
}

export interface AgentStreamController {
  /** The assembled messages, newest last. */
  messages: AgentMessage[]
  status: AgentStreamState["status"]
  error?: { message: string; code?: string }
  /** Whether a stream is currently being consumed. */
  isStreaming: boolean
  /** Consume an async iterable of events, resetting any prior messages. */
  start: (
    stream: AsyncIterable<AgentEvent> | Iterable<AgentEvent>
  ) => Promise<void>
  /** Abort the in-flight stream. */
  stop: () => void
  /** Replace the message list (e.g. when loading history). */
  setMessages: (messages: AgentMessage[]) => void
  /** Append a fully-formed message (e.g. an optimistic user turn). */
  append: (message: AgentMessage) => void
  /** Clear all messages. */
  clear: () => void
}

/**
 * Consume a transport-neutral stream of `AgentEvent`s and assemble them into
 * `AgentMessage[]`. Transport adapters (AI SDK, LangGraph, raw SSE) produce
 * the event iterable; this hook is the single place state is derived.
 */
export function useAgentStream(
  options: UseAgentStreamOptions = {}
): AgentStreamController {
  const [state, setState] = useState<AgentStreamState>(createInitialState)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Abort any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const start = useCallback(
    async (stream: AsyncIterable<AgentEvent> | Iterable<AgentEvent>) => {
      // Abort a previous stream and start fresh.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const accumulator = createInitialState()
      setState(accumulator)
      setIsStreaming(true)

      try {
        for await (const event of stream) {
          if (controller.signal.aborted) break
          if (event.type === "approval-required") {
            optionsRef.current.onApprovalRequired?.(event.request)
          }
          const next = applyAgentEvent(accumulator, event)
          setState(next)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const err = error instanceof Error ? error : new Error(String(error))
          optionsRef.current.onError?.(err)
          setState((prev) => ({ ...prev, status: "error" }))
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setIsStreaming(false)
        }
      }
    },
    []
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const setMessages = useCallback((messages: AgentMessage[]) => {
    setState({ messages, status: "complete" })
  }, [])

  const append = useCallback((message: AgentMessage) => {
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }))
  }, [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setState(createInitialState())
  }, [])

  return {
    messages: state.messages,
    status: state.status,
    error: state.error,
    isStreaming,
    start,
    stop,
    setMessages,
    append,
    clear,
  }
}
