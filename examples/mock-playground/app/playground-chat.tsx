"use client"

import * as React from "react"

import { useAgentStream, type AgentMessage } from "@agentive-ui/core"
import { createChatMockStream } from "@agentive-ui/core/mock"
import { Conversation } from "@/registry/agentive-ui/conversation"
import { PromptInput } from "@/registry/agentive-ui/prompt-input"

const RESPONSES = [
  "Here is a **markdown** reply with a list:\n\n1. First item\n2. Second item\n\n```ts\nconst value: number = 42\n```",
  "Streaming works because only the *active* message re-renders. Completed rows stay memoized.",
  "Try **Stream 200 messages** above to see the perf behavior on a long thread.",
]

export function PlaygroundChat() {
  const { messages, status, isStreaming, start, append, setMessages, clear } =
    useAgentStream()
  const [loading200, setLoading200] = React.useState(false)
  const turnRef = React.useRef(0)

  const handleSubmit = async (text: string) => {
    append({
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", id: `user-${Date.now()}:text`, text }],
      status: "complete",
    })
    await start(
      createChatMockStream({
        text: RESPONSES[turnRef.current++ % RESPONSES.length] ?? "…",
        delayMs: 14,
      })
    )
  }

  const stream200 = async () => {
    setLoading200(true)
    try {
      const seeded: AgentMessage[] = Array.from({ length: 199 }, (_, i) => ({
        id: `seed-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        parts: [
          { type: "text", id: `seed-${i}:text`, text: `Seed message ${i + 1}` },
        ],
        status: "complete",
      }))
      setMessages(seeded)
      await start(
        createChatMockStream({
          text: "This is the 200th message, streaming token by token while the first 199 rows stay memoized.",
          delayMs: 2,
        })
      )
    } finally {
      setLoading200(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <button
          type="button"
          onClick={stream200}
          disabled={loading200 || isStreaming}
          className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-50"
        >
          Stream 200 messages
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={isStreaming}
          className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-50"
        >
          Clear
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          status: {status}
        </span>
      </div>

      <Conversation
        messages={messages}
        isStreaming={isStreaming}
        className="min-h-0 flex-1"
        emptyState={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Send a message, or stream 200 messages to test long-thread
            performance.
          </div>
        }
      />

      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit} isGenerating={isStreaming} />
      </div>
    </div>
  )
}
