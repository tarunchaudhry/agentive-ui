import { describe, expect, it } from "vitest"
import {
  fromAISDKMessages,
  parseAISDKDataStreamChunk,
  partsFromAISDKUIMessage,
} from "./ai-sdk"

describe("fromAISDKMessages", () => {
  it("converts standard text messages", () => {
    const aiMessages = [
      { id: "1", role: "user", content: "What is 2+2?" },
      { id: "2", role: "assistant", content: "It is 4." },
    ]

    const agentMessages = fromAISDKMessages(aiMessages)
    expect(agentMessages).toHaveLength(2)
    expect(agentMessages[0]?.role).toBe("user")
    expect(agentMessages[0]?.parts[0]).toEqual({
      type: "text",
      id: "1:text",
      text: "What is 2+2?",
    })
    expect(agentMessages[1]?.parts[0]).toEqual({
      type: "text",
      id: "2:text",
      text: "It is 4.",
    })
  })

  it("converts reasoning and tool invocations", () => {
    const aiMessages = [
      {
        id: "msg-1",
        role: "assistant",
        reasoning: "Let me check the database.",
        toolInvocations: [
          {
            toolCallId: "call-1",
            toolName: "query_db",
            args: { sql: "SELECT 1" },
            result: { rows: [1] },
            state: "result" as const,
          },
        ],
        content: "Here are the query results.",
      },
    ]

    const [agentMsg] = fromAISDKMessages(aiMessages, "complete")
    expect(agentMsg).toBeDefined()
    expect(agentMsg?.parts).toHaveLength(4)

    // 1. Reasoning part
    expect(agentMsg?.parts[0]).toEqual({
      type: "reasoning",
      id: "msg-1:reasoning",
      text: "Let me check the database.",
      status: "complete",
    })

    // 2. ToolCall part
    expect(agentMsg?.parts[1]).toMatchObject({
      type: "tool-call",
      call: {
        id: "call-1",
        name: "query_db",
        args: { sql: "SELECT 1" },
        status: "success",
      },
    })

    // 3. ToolResult part
    expect(agentMsg?.parts[2]).toEqual({
      type: "tool-result",
      id: "call-1:result",
      toolCallId: "call-1",
      result: { rows: [1] },
      status: "success",
    })

    // 4. Text part
    expect(agentMsg?.parts[3]).toEqual({
      type: "text",
      id: "msg-1:text",
      text: "Here are the query results.",
    })
  })
})

describe("fromAISDKMessages (v5 parts shape)", () => {
  it("maps text, reasoning and tool parts", () => {
    const [agentMsg] = fromAISDKMessages([
      {
        id: "m1",
        role: "assistant",
        status: "ready",
        parts: [
          { type: "step-start" },
          { type: "reasoning", text: "Checking the cluster." },
          { type: "text", text: "Cluster looks **healthy**." },
          {
            type: "tool-vacuum_table",
            toolCallId: "tc-9",
            state: "input-available",
            input: { table: "order_events" },
          },
        ],
      },
    ])

    expect(agentMsg?.status).toBe("complete")
    expect(agentMsg?.parts).toHaveLength(3)
    expect(agentMsg?.parts[0]).toEqual({
      type: "reasoning",
      id: "m1:reasoning:0",
      text: "Checking the cluster.",
      status: "complete",
    })
    expect(agentMsg?.parts[1]).toMatchObject({
      type: "text",
      text: "Cluster looks **healthy**.",
    })
    expect(agentMsg?.parts[2]).toMatchObject({
      type: "tool-call",
      call: {
        id: "tc-9",
        name: "vacuum_table",
        args: { table: "order_events" },
        status: "running",
      },
    })
  })

  it("maps completed tool outputs and message status", () => {
    const [agentMsg] = fromAISDKMessages([
      {
        id: "m2",
        role: "assistant",
        status: "streaming",
        parts: [
          {
            type: "tool-check_cluster_health",
            toolCallId: "tc-1",
            state: "output-available",
            input: { clusterId: "prod" },
            output: { status: "healthy" },
          },
        ],
      },
    ])

    expect(agentMsg?.status).toBe("streaming")
    expect(agentMsg?.parts).toHaveLength(2)
    expect(agentMsg?.parts[0]).toMatchObject({
      type: "tool-call",
      call: { id: "tc-1", name: "check_cluster_health", status: "success" },
    })
    expect(agentMsg?.parts[1]).toEqual({
      type: "tool-result",
      id: "tc-1:result",
      toolCallId: "tc-1",
      result: { status: "healthy" },
      status: "success",
    })
  })

  it("skips step-start and data parts", () => {
    const parts = partsFromAISDKUIMessage("m3", [
      { type: "step-start" },
      { type: "data-weather", text: undefined },
      { type: "text", text: "hi" },
    ])
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ type: "text", text: "hi" })
  })
})

describe("parseAISDKDataStreamChunk", () => {
  it("parses text and reasoning stream lines", () => {
    const chunk = '0:"Hello "\n0:"world"\ng:"Thinking deeply..."\n'
    const events = parseAISDKDataStreamChunk(chunk, "msg-test")

    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({
      type: "text-delta",
      messageId: "msg-test",
      delta: "Hello ",
    })
    expect(events[1]).toEqual({
      type: "text-delta",
      messageId: "msg-test",
      delta: "world",
    })
    expect(events[2]).toEqual({
      type: "reasoning-delta",
      messageId: "msg-test",
      partId: "msg-test:reasoning",
      delta: "Thinking deeply...",
    })
  })

  it("parses tool call start and result chunks", () => {
    const chunk =
      '9:{"toolCallId":"tc1","toolName":"search","args":{"q":"ai"}}\n' +
      'a:{"toolCallId":"tc1","result":{"found":10}}\n'

    const events = parseAISDKDataStreamChunk(chunk, "msg-test")
    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({
      type: "tool-call-start",
      messageId: "msg-test",
      partId: "tc1:part",
      toolCallId: "tc1",
      toolName: "search",
      args: { q: "ai" },
    })
    expect(events[1]).toEqual({
      type: "tool-result",
      messageId: "msg-test",
      toolCallId: "tc1",
      result: { found: 10 },
      status: "success",
    })
  })
})
