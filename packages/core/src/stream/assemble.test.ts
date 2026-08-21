import { describe, expect, it } from "vitest"

import { applyAgentEvent, createInitialState } from "./assemble"

function fold(events: Parameters<typeof applyAgentEvent>[1][]) {
  return events.reduce(applyAgentEvent, createInitialState())
}

describe("applyAgentEvent", () => {
  it("assembles a streamed text message", () => {
    const state = fold([
      { type: "message-start", messageId: "m1", role: "assistant" },
      { type: "text-delta", messageId: "m1", delta: "Hello" },
      { type: "text-delta", messageId: "m1", delta: " world" },
      { type: "message-end", messageId: "m1" },
    ])

    expect(state.messages).toHaveLength(1)
    const message = state.messages[0]
    expect(message?.status).toBe("complete")
    expect(message?.parts).toHaveLength(1)
    expect(message?.parts[0]).toEqual({
      type: "text",
      id: "m1:text:0",
      text: "Hello world",
    })
  })

  it("starts a message implicitly when the first event is a text delta", () => {
    const state = fold([{ type: "text-delta", messageId: "m1", delta: "hi" }])
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0]?.role).toBe("assistant")
    expect(state.messages[0]?.parts[0]).toMatchObject({
      type: "text",
      text: "hi",
    })
  })

  it("streams reasoning deltas into a single reasoning part", () => {
    const state = fold([
      { type: "message-start", messageId: "m1", role: "assistant" },
      { type: "reasoning-start", messageId: "m1", partId: "r1" },
      {
        type: "reasoning-delta",
        messageId: "m1",
        partId: "r1",
        delta: "Let me ",
      },
      {
        type: "reasoning-delta",
        messageId: "m1",
        partId: "r1",
        delta: "think.",
      },
      { type: "reasoning-end", messageId: "m1", partId: "r1" },
    ])

    const part = state.messages[0]?.parts[0]
    expect(part).toMatchObject({
      type: "reasoning",
      text: "Let me think.",
      status: "complete",
    })
  })

  it("assembles a tool call with streamed args and a result", () => {
    const state = fold([
      { type: "message-start", messageId: "m1", role: "assistant" },
      {
        type: "tool-call-start",
        messageId: "m1",
        partId: "p1",
        toolCallId: "tc1",
        toolName: "search_web",
      },
      { type: "tool-call-delta", toolCallId: "tc1", argsDelta: '{"query"' },
      { type: "tool-call-delta", toolCallId: "tc1", argsDelta: ':"agents"}' },
      { type: "tool-call-end", toolCallId: "tc1" },
      {
        type: "tool-result",
        messageId: "m1",
        toolCallId: "tc1",
        result: { hits: 2 },
        status: "success",
      },
    ])

    const message = state.messages[0]
    expect(message?.parts).toHaveLength(2)

    const callPart = message?.parts[0]
    expect(callPart).toMatchObject({
      type: "tool-call",
      call: { id: "tc1", name: "search_web", status: "success" },
    })
    expect(callPart?.type === "tool-call" && callPart.call.args).toEqual({
      query: "agents",
    })

    expect(message?.parts[1]).toMatchObject({
      type: "tool-result",
      toolCallId: "tc1",
      status: "success",
    })
  })

  it("keeps unrelated message references stable while streaming", () => {
    const first = fold([
      { type: "message-start", messageId: "m1", role: "user" },
      { type: "text-delta", messageId: "m1", delta: "hello" },
      { type: "message-end", messageId: "m1" },
    ])
    const completed = first.messages[0]

    const second = applyAgentEvent(first, {
      type: "message-start",
      messageId: "m2",
      role: "assistant",
    })

    expect(second.messages[0]).toBe(completed)
    expect(second.messages[1]?.id).toBe("m2")
  })

  it("attaches an error part and marks the message errored", () => {
    const state = fold([
      { type: "message-start", messageId: "m1", role: "assistant" },
      { type: "text-delta", messageId: "m1", delta: "partial" },
      {
        type: "error",
        messageId: "m1",
        message: "network down",
        code: "E_NETWORK",
        recoverable: true,
      },
    ])

    expect(state.status).toBe("error")
    expect(state.error).toEqual({ message: "network down", code: "E_NETWORK" })
    const message = state.messages[0]
    expect(message?.status).toBe("error")
    expect(message?.parts.at(-1)).toMatchObject({
      type: "error",
      recoverable: true,
    })
  })

  it("appends sources into a single source part", () => {
    const state = fold([
      { type: "message-start", messageId: "m1", role: "assistant" },
      {
        type: "source",
        messageId: "m1",
        source: { id: "s1", title: "A", url: "https://a.com" },
      },
      {
        type: "source",
        messageId: "m1",
        source: { id: "s2", title: "B", url: "https://b.com" },
      },
    ])

    const part = state.messages[0]?.parts[0]
    expect(part?.type).toBe("source")
    expect(part?.type === "source" && part.sources).toHaveLength(2)
  })
})
