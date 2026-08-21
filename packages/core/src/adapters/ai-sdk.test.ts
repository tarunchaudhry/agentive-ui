import { describe, expect, it } from "vitest"
import { fromAISDKMessages, parseAISDKDataStreamChunk } from "./ai-sdk"

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
