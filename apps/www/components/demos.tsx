"use client"

import * as React from "react"

import { useAgentStream } from "@agentive-ui/core"
import { createChatMockStream } from "@agentive-ui/core/mock"
import { Spinner } from "@/registry/agentive-ui/spinner"
import { TypingDots } from "@/registry/agentive-ui/typing-dots"
import { Shimmer } from "@/registry/agentive-ui/shimmer"
import { StreamingText } from "@/registry/agentive-ui/streaming-text"
import { MarkdownContent } from "@/registry/agentive-ui/markdown-content"
import { Message } from "@/registry/agentive-ui/message"
import { Conversation } from "@/registry/agentive-ui/conversation"
import { PromptInput } from "@/registry/agentive-ui/prompt-input"

export function SpinnerDemo() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg">("md")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["sm", "md", "lg"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={
              "rounded-md border px-2.5 py-1 text-xs " +
              (size === s
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex h-20 items-center justify-center rounded-lg border bg-card">
        <Spinner size={size} />
      </div>
    </div>
  )
}

export function LoadersDemo() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <span className="w-24 text-sm text-muted-foreground">TypingDots</span>
        <TypingDots />
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <span className="w-24 text-sm text-muted-foreground">Spinner</span>
        <Spinner size="sm" />
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <span className="text-sm text-muted-foreground">Shimmer</span>
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function StreamingTextDemo() {
  const [text, setText] = React.useState("Streaming ")
  React.useEffect(() => {
    const full = "Streaming text with a caret that blinks while tokens arrive."
    let i = text.length
    const id = window.setInterval(() => {
      i += 1
      setText(full.slice(0, i))
      if (i >= full.length) window.clearInterval(id)
    }, 60)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="rounded-lg border bg-card p-4">
      <StreamingText text={text} />
    </div>
  )
}

export function MarkdownDemo() {
  const source = `# Hello

This renders **bold**, *italic*, and \`inline code\`.

| Feature | Status |
| ------- | ------ |
| GFM     | done   |
| Code    | done   |

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}!\`
}
\`\`\`
`
  return (
    <div className="rounded-lg border bg-card p-4">
      <MarkdownContent>{source}</MarkdownContent>
    </div>
  )
}

export function MessageDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-lg border bg-card p-4">
      <Message
        role="user"
        parts={[
          {
            type: "text",
            id: "u1",
            text: "What can you build with Agentive UI?",
          },
        ]}
      />
      <Message
        role="assistant"
        status="complete"
        parts={[
          {
            type: "text",
            id: "a1",
            text: "Chat, streaming, **tool calls**, research agents, and browser agents — all as shadcn-style source.",
          },
        ]}
      />
      <Message role="assistant" status="streaming" parts={[]} />
    </div>
  )
}

export function ConversationDemo() {
  const { messages, isStreaming, start, append } = useAgentStream()

  const submit = async (text: string) => {
    append({
      id: `u-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", id: `u-${Date.now()}:t`, text }],
      status: "complete",
    })
    await start(
      createChatMockStream({
        text: "Here is a streamed **reply** with a list:\n\n1. one\n2. two",
        delayMs: 18,
      })
    )
  }

  return (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
      <Conversation
        messages={messages}
        isStreaming={isStreaming}
        className="min-h-0 flex-1"
        emptyState={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Send a message to start a scripted conversation.
          </div>
        }
      />
      <div className="border-t p-3">
        <PromptInput onSubmit={submit} isGenerating={isStreaming} />
      </div>
    </div>
  )
}

export function PromptInputDemo() {
  const [generating, setGenerating] = React.useState(false)
  const [log, setLog] = React.useState("")
  return (
    <div className="flex flex-col gap-3">
      <PromptInput
        onSubmit={(value) => {
          setLog(value)
          setGenerating(true)
          window.setTimeout(() => setGenerating(false), 1500)
        }}
        onStop={() => setGenerating(false)}
        isGenerating={generating}
      />
      {log ? (
        <p className="text-sm text-muted-foreground">Submitted: {log}</p>
      ) : null}
    </div>
  )
}
