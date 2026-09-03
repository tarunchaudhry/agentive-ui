import {
  convertToModelMessages,
  simulateReadableStream,
  streamText,
  tool,
  toUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai"
import { MockLanguageModelV4 } from "ai/test"
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider"
import { z } from "zod"

export const maxDuration = 30

function hasToolOutput(messages: UIMessage[], toolType: string): boolean {
  return messages.some((m) =>
    m.parts?.some(
      (p) =>
        typeof p.type === "string" &&
        p.type === toolType &&
        "state" in p &&
        (p.state === "output-available" || p.state === "output-denied")
    )
  )
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Script the demo deterministically: health check → vacuum proposal → completion.
  const script: "health" | "vacuum" | "done" = hasToolOutput(
    messages,
    "tool-vacuum_table"
  )
    ? "done"
    : hasToolOutput(messages, "tool-check_cluster_health")
      ? "vacuum"
      : "health"

  const chunks: LanguageModelV4StreamPart[] =
    script === "done"
      ? [
          { type: "text-start", id: "t3" },
          {
            type: "text-delta",
            id: "t3",
            delta:
              "Vacuum complete — reclaimed 1.2 GB and rebuilt 3 indexes on `order_events`.",
          },
          { type: "text-end", id: "t3" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: {
              inputTokens: {
                total: 340,
                noCache: 340,
                cacheRead: undefined,
                cacheWrite: undefined,
              },
              outputTokens: { total: 60, text: 60, reasoning: undefined },
            },
          },
        ]
      : script === "vacuum"
        ? [
            { type: "text-start", id: "t2" },
            {
              type: "text-delta",
              id: "t2",
              delta:
                "Found 24% dead tuples on `order_events`. This needs an exclusive lock — requesting approval:",
            },
            { type: "text-end", id: "t2" },
            {
              type: "tool-call",
              toolCallId: "tc-vacuum",
              toolName: "vacuum_table",
              input: '{"table":"order_events","lockMode":"ACCESS_EXCLUSIVE"}',
            },
            {
              type: "finish",
              finishReason: { unified: "tool-calls", raw: "tool-calls" },
              usage: {
                inputTokens: {
                  total: 200,
                  noCache: 200,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 120, text: 120, reasoning: undefined },
              },
            },
          ]
        : [
            { type: "text-start", id: "t1" },
            { type: "text-delta", id: "t1", delta: "Pinged all replicas — " },
            {
              type: "text-delta",
              id: "t1",
              delta: "cluster is **healthy** (14ms avg). ",
            },
            { type: "text-end", id: "t1" },
            {
              type: "tool-call",
              toolCallId: "tc-health",
              toolName: "check_cluster_health",
              input: '{"clusterId":"prod-db-cluster"}',
            },
            {
              type: "finish",
              finishReason: { unified: "tool-calls", raw: "tool-calls" },
              usage: {
                inputTokens: {
                  total: 120,
                  noCache: 120,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 80, text: 80, reasoning: undefined },
              },
            },
          ]

  const result = streamText({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({ chunks }),
      }),
    }),
    messages: await convertToModelMessages(messages),
    tools: {
      check_cluster_health: tool({
        description: "Check database cluster health",
        inputSchema: z.object({ clusterId: z.string() }),
        execute: async ({ clusterId }) => ({
          status: "healthy",
          clusterId,
          latencyMs: 14,
          replicaLagSec: 0,
        }),
      }),
      vacuum_table: tool({
        description:
          "Vacuum and reindex a table under an exclusive lock (requires human approval)",
        inputSchema: z.object({
          table: z.string(),
          lockMode: z.string(),
        }),
      }),
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
