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
import { Reasoning } from "@/registry/agentive-ui/reasoning"
import {
  TaskTimeline,
  type TaskStep,
} from "@/registry/agentive-ui/task-timeline"
import { ToolCall } from "@/registry/agentive-ui/tool-call"
import { ToolApproval } from "@/registry/agentive-ui/tool-approval"
import { AgentStatus } from "@/registry/agentive-ui/agent-status"
import { UsageMeter } from "@/registry/agentive-ui/usage-meter"
import { ErrorState } from "@/registry/agentive-ui/error-state"

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

export function ReasoningDemo() {
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <Reasoning
        text="Evaluating search indices for relevant customer schema definitions.\nChecking foreign keys and indexes on `accounts` table."
        durationMs={1850}
        defaultOpen={true}
      />
      <Reasoning text="Thinking in background..." status="streaming" />
    </div>
  )
}

export function TaskTimelineDemo() {
  const steps: TaskStep[] = [
    {
      id: "step-1",
      title: "Query index health",
      description: "Analyze fragmentation across primary keys",
      status: "done",
      details: "Scan completed in 45ms. 0 fragments detected.",
    },
    {
      id: "step-2",
      title: "Optimize partition layout",
      description: "Moving archived records to cold storage",
      status: "active",
      details: "Streaming chunks 4/10...",
    },
    {
      id: "step-3",
      title: "Notify subscribers",
      status: "pending",
    },
  ]
  return (
    <div className="max-w-xl rounded-lg border bg-card p-4">
      <TaskTimeline steps={steps} defaultExpandedIds={["step-1"]} />
    </div>
  )
}

export function ToolCallDemo() {
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <ToolCall
        name="fetch_weather"
        args={{ city: "San Francisco", units: "celsius" }}
        result={{ temp: 18, condition: "Partly Cloudy", humidity: 68 }}
        status="success"
        defaultOpen={true}
      />
      <ToolCall
        name="deploy_service"
        args={{ cluster: "us-east-1", replicas: 4 }}
        status="running"
      />
    </div>
  )
}

export function ToolApprovalDemo() {
  const [status, setStatus] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <ToolApproval
        request={{
          id: "req-demo",
          toolCallId: "tc-demo",
          toolName: "purge_cache_records",
          args: { zone: "production", invalidateAll: true },
          rationale:
            "Requires operator confirmation before flushing edge nodes.",
          createdAt: Date.now(),
        }}
        onApprove={(args) =>
          setStatus(`Approved with: ${JSON.stringify(args)}`)
        }
        onDeny={(reason) => setStatus(`Denied: ${reason}`)}
      />
      {status && (
        <p className="text-xs text-muted-foreground font-mono">{status}</p>
      )}
    </div>
  )
}

export function AgentStatusDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AgentStatus
        statusText="Scanning GitHub issues..."
        startedAt={Date.now() - 14000}
      />
      <AgentStatus statusText="Analyzing stack trace" />
    </div>
  )
}

export function UsageMeterDemo() {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <UsageMeter tokens={45000} maxTokens={128000} costUsd={0.0084} />
      <UsageMeter
        tokens={121000}
        maxTokens={128000}
        costUsd={0.034}
        warningThreshold={0.8}
        dangerThreshold={0.95}
      />
    </div>
  )
}

export function ErrorStateDemo() {
  const [retried, setRetried] = React.useState(false)
  return (
    <div className="max-w-xl">
      <ErrorState
        message="Failed to connect to LangGraph streaming orchestrator."
        code="ERR_NETWORK_DISCONNECT"
        recoverable={true}
        onRetry={() => {
          setRetried(true)
          setTimeout(() => setRetried(false), 2000)
        }}
      />
      {retried && (
        <span className="text-xs text-(--agentive-tool-success)">
          Re-triggering connection...
        </span>
      )}
    </div>
  )
}
