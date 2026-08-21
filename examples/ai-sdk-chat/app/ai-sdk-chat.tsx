"use client"

import * as React from "react"

import {
  useToolApprovals,
  type AgentMessage,
  type ToolApprovalRequest,
} from "@agentive-ui/core"
import {
  fromAISDKMessages,
  type AISDKMessageLike,
} from "@agentive-ui/core/ai-sdk"
import { Conversation } from "@/registry/agentive-ui/conversation"
import { PromptInput } from "@/registry/agentive-ui/prompt-input"
import { ToolApproval } from "@/registry/agentive-ui/tool-approval"
import { AgentStatus } from "@/registry/agentive-ui/agent-status"
import { UsageMeter } from "@/registry/agentive-ui/usage-meter"
import {
  TaskTimeline,
  type TaskStep,
} from "@/registry/agentive-ui/task-timeline"

export function AISDKChat() {
  const [tokensUsed, setTokensUsed] = React.useState(1840)
  const [activeStatus, setActiveStatus] = React.useState<string | null>(null)
  const [statusStartedAt, setStatusStartedAt] = React.useState<
    number | undefined
  >()

  const approvals = useToolApprovals({
    onApprove: (req, updatedArgs) => {
      // Simulate resuming the agent workflow after human approval
      setActiveStatus(`Executing approved action: ${req.toolName}...`)
      setStatusStartedAt(Date.now())
      setTimeout(() => {
        setRawMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: "assistant",
            toolInvocations: [
              {
                toolCallId: req.toolCallId,
                toolName: req.toolName,
                args: updatedArgs ?? req.args,
                result: { status: "executed", modifiedRecords: 1 },
                state: "result",
              },
            ],
            content: `Operation **${req.toolName}** executed successfully with parameters \`${JSON.stringify(updatedArgs ?? req.args)}\`.`,
          },
        ])
        setActiveStatus(null)
        setTokensUsed((prev) => prev + 340)
      }, 1200)
    },
    onDeny: (req, reason) => {
      setRawMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Action **${req.toolName}** was denied by the user. Reason: *${reason ?? "None"}*`,
        },
      ])
    },
  })

  // Simulated AI SDK raw messages state
  const [rawMessages, setRawMessages] = React.useState<AISDKMessageLike[]>([
    {
      id: "m-init-1",
      role: "assistant",
      reasoning: "Reviewing database maintenance requests.",
      toolInvocations: [
        {
          toolCallId: "tc-0",
          toolName: "check_cluster_health",
          args: { clusterId: "prod-db-cluster" },
          result: { latencyMs: 14, replicaLagSec: 0, status: "healthy" },
          state: "result",
        },
      ],
      content: "Database cluster is healthy. Ready for maintenance actions.",
    },
  ])

  // Convert raw AI SDK format -> AgentMessage[] seamlessly via adapter
  const agentMessages: AgentMessage[] = React.useMemo(
    () => fromAISDKMessages(rawMessages),
    [rawMessages]
  )

  const triggerDestructiveAction = () => {
    const req: ToolApprovalRequest = {
      id: `req-${Date.now()}`,
      toolCallId: `tc-${Date.now()}`,
      toolName: "vacuum_and_reindex_table",
      args: { table: "order_events", lockMode: "ACCESS_EXCLUSIVE" },
      rationale:
        "Requires high-stakes exclusive lock. Requires operator authorization.",
      createdAt: Date.now(),
    }
    approvals.enqueue(req)
  }

  const sampleSteps: TaskStep[] = [
    {
      id: "s1",
      title: "Cluster diagnostic",
      description: "Ping all database replicas and check replication lag",
      status: "done",
      details: "Replicas responding in 14ms average latency.",
    },
    {
      id: "s2",
      title: "Index optimization",
      description: "Analyze index bloat on high-traffic tables",
      status: "done",
      details: "Found 24% dead tuples on table 'order_events'.",
    },
    {
      id: "s3",
      title: "Exclusive lock operation",
      description: "Vacuum and reindex table under operator supervision",
      status: approvals.pending.length > 0 ? "active" : "pending",
      details: "Awaiting approval token from admin.",
    },
  ]

  const handleSubmit = (text: string) => {
    setRawMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      },
    ])
    setTokensUsed((prev) => prev + 120)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerDestructiveAction}
            className="rounded-md bg-(--agentive-approval-accent) px-2.5 py-1 text-xs font-semibold text-black hover:opacity-90"
          >
            Trigger Protected Tool Call
          </button>
          {activeStatus && (
            <AgentStatus
              statusText={activeStatus}
              startedAt={statusStartedAt}
            />
          )}
        </div>

        <div className="w-56">
          <UsageMeter
            tokens={tokensUsed}
            maxTokens={4000}
            costUsd={tokensUsed * 0.00002}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation messages={agentMessages} className="min-h-0 flex-1" />

          {approvals.pending.length > 0 && (
            <div className="border-t bg-muted/20 px-4 py-2">
              {approvals.pending.map((req) => (
                <ToolApproval
                  key={req.id}
                  request={req}
                  onApprove={(args) => approvals.approve(req.id, args)}
                  onDeny={(reason) => approvals.deny(req.id, reason)}
                />
              ))}
            </div>
          )}

          <div className="border-t p-3">
            <PromptInput onSubmit={handleSubmit} />
          </div>
        </div>

        <aside className="w-80 border-l bg-card p-4 hidden md:flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Agent Execution Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time task timeline
            </p>
          </div>
          <TaskTimeline steps={sampleSteps} defaultExpandedIds={["s2"]} />
        </aside>
      </div>
    </div>
  )
}
