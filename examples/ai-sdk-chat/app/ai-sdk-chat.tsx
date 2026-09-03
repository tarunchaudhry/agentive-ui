"use client"

import * as React from "react"

import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { useToolApprovals, type AgentMessage } from "@agentive-ui/core"
import { fromAISDKMessages } from "@agentive-ui/core/ai-sdk"
import { Conversation } from "@/registry/agentive-ui/conversation"
import { PromptInput } from "@/registry/agentive-ui/prompt-input"
import { ToolApproval } from "@/registry/agentive-ui/tool-approval"
import { AgentStatus } from "@/registry/agentive-ui/agent-status"
import { UsageMeter } from "@/registry/agentive-ui/usage-meter"
import { ErrorState } from "@/registry/agentive-ui/error-state"
import {
  TaskTimeline,
  type TaskStep,
} from "@/registry/agentive-ui/task-timeline"

interface PendingVacuumCall {
  messageId: string
  toolCallId: string
  input: unknown
}

/** Extract vacuum_table calls awaiting human approval from raw UI messages. */
function collectPendingVacuumCalls(
  messages: Array<{
    id: string
    parts?: Array<{ type: string } & Record<string, unknown>>
  }>
): PendingVacuumCall[] {
  const out: PendingVacuumCall[] = []
  for (const m of messages) {
    for (const p of m.parts ?? []) {
      if (
        p.type === "tool-vacuum_table" &&
        (p["state"] as string) === "input-available" &&
        typeof p["toolCallId"] === "string"
      ) {
        out.push({
          messageId: m.id,
          toolCallId: p["toolCallId"] as string,
          input: p["input"],
        })
      }
    }
  }
  return out
}

function hasToolOutput(
  messages: Array<{
    parts?: Array<{ type: string } & Record<string, unknown>>
  }>,
  toolType: string
): boolean {
  return messages.some((m) =>
    (m.parts ?? []).some(
      (p) =>
        p.type === toolType && (p["state"] as string) === "output-available"
    )
  )
}

export function AISDKChat() {
  const [tokensUsed, setTokensUsed] = React.useState(0)

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolOutput,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: () => setTokensUsed((prev) => prev + 340),
    onError: (err) => console.error("chat error", err),
  })

  const isGenerating = status === "streaming" || status === "submitted"

  // Render Vercel AI SDK messages through the Agentive UI adapter.
  const agentMessages: AgentMessage[] = React.useMemo(
    () => fromAISDKMessages(messages, isGenerating ? "streaming" : "complete"),
    [messages, isGenerating]
  )

  // Bridge AI SDK tool calls awaiting approval into the approval queue.
  const approvals = useToolApprovals()
  const pendingVacuum = React.useMemo(
    () => collectPendingVacuumCalls(messages),
    [messages]
  )

  const enqueueApproval = approvals.enqueue
  React.useEffect(() => {
    for (const call of pendingVacuum) {
      enqueueApproval({
        id: `approval-${call.toolCallId}`,
        toolCallId: call.toolCallId,
        toolName: "vacuum_table",
        args: call.input,
        rationale:
          "Requires an ACCESS EXCLUSIVE lock on a production table. Human authorization needed.",
        createdAt: Date.now(),
      })
    }
  }, [pendingVacuum, enqueueApproval])

  const handleSubmit = (text: string) => {
    setTokensUsed((prev) => prev + 120)
    void sendMessage({ text })
  }

  const healthDone = hasToolOutput(messages, "tool-check_cluster_health")
  const vacuumDone = hasToolOutput(messages, "tool-vacuum_table")

  const sampleSteps: TaskStep[] = [
    {
      id: "s1",
      title: "Cluster diagnostic",
      description: "Ping all database replicas and check replication lag",
      status: healthDone ? "done" : isGenerating ? "active" : "pending",
      details: healthDone
        ? "Replicas responding in 14ms average latency."
        : undefined,
    },
    {
      id: "s2",
      title: "Exclusive lock operation",
      description: "Vacuum and reindex table under operator supervision",
      status: vacuumDone
        ? "done"
        : approvals.pending.length > 0
          ? "active"
          : "pending",
      details: vacuumDone
        ? "Reclaimed 1.2 GB and rebuilt 3 indexes."
        : "Awaiting approval token from admin.",
    },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <AgentStatus
              statusText={
                status === "submitted" ? "Sending…" : "Agent is working…"
              }
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Send any message to run the scripted maintenance flow (no API key
              needed).
            </span>
          )}
        </div>

        <div className="w-56 shrink-0">
          <UsageMeter
            tokens={tokensUsed}
            maxTokens={4000}
            costUsd={tokensUsed * 0.00002}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation
            messages={agentMessages}
            isStreaming={isGenerating}
            className="min-h-0 flex-1"
            emptyState={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Ask the agent to check the database cluster.
              </div>
            }
          />

          {error ? (
            <div className="border-t px-4 py-2">
              <ErrorState
                message={error.message}
                recoverable
                onRetry={() => regenerate()}
              />
            </div>
          ) : null}

          {approvals.pending.length > 0 && (
            <div className="border-t bg-muted/20 px-4 py-2">
              {approvals.pending.map((req) => (
                <ToolApproval
                  key={req.id}
                  request={req}
                  onApprove={(updatedArgs) => {
                    approvals.approve(req.id, updatedArgs)
                    addToolOutput({
                      tool: "vacuum_table",
                      toolCallId: req.toolCallId,
                      output: {
                        approved: true,
                        args: updatedArgs ?? req.args,
                      },
                    })
                  }}
                  onDeny={(reason) => {
                    approvals.deny(req.id, reason)
                    addToolOutput({
                      tool: "vacuum_table",
                      toolCallId: req.toolCallId,
                      output: { approved: false, reason },
                    })
                  }}
                />
              ))}
            </div>
          )}

          <div className="border-t p-3">
            <PromptInput
              onSubmit={handleSubmit}
              isGenerating={isGenerating}
              onStop={() => stop()}
            />
          </div>
        </div>

        <aside className="hidden w-80 flex-col gap-4 overflow-y-auto border-l bg-card p-4 md:flex">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Agent Execution Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time task timeline
            </p>
          </div>
          <TaskTimeline steps={sampleSteps} defaultExpandedIds={["s1"]} />
        </aside>
      </div>
    </div>
  )
}
