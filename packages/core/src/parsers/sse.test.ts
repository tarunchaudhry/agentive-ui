import { describe, expect, it } from "vitest"

import { parseNDJSON, parseSSE } from "./sse"

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = []
  for await (const item of iter) out.push(item)
  return out
}

async function* strings(chunks: string[]): AsyncGenerator<Uint8Array | string> {
  for (const chunk of chunks) yield chunk
}

describe("parseSSE", () => {
  it("parses single-line data frames", async () => {
    const events = await collect(
      parseSSE(
        strings([
          'data: {"type":"message-start","messageId":"m1","role":"assistant"}\n\n',
          'data: {"type":"text-delta","messageId":"m1","delta":"hi"}\n\n',
          "data: [DONE]\n\n",
        ])
      )
    )
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ type: "message-start", messageId: "m1" })
  })

  it("joins multi-line data frames", async () => {
    const events = await collect(
      parseSSE(
        strings([
          "data: {\n",
          'data: "type":"message-start","messageId":"m1","role":"assistant"\n',
          "data: }\n\n",
        ])
      )
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: "message-start" })
  })

  it("survives frames split across chunk boundaries", async () => {
    const frame = 'data: {"type":"text-delta","messageId":"m1","delta":"x"}\n\n'
    const events = await collect(
      parseSSE(strings([frame.slice(0, 10), frame.slice(10)]))
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ delta: "x" })
  })

  it("ignores malformed JSON frames", async () => {
    const events = await collect(
      parseSSE(
        strings([
          "data: not-json\n\n",
          'data: {"type":"message-end","messageId":"m1"}\n\n',
        ])
      )
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: "message-end" })
  })
})

describe("parseNDJSON", () => {
  it("parses newline-delimited events", async () => {
    const events = await collect(
      parseNDJSON(
        strings([
          '{"type":"message-start","messageId":"m1","role":"user"}\n',
          '{"type":"text-delta","messageId":"m1","delta":"a"}\n',
          "\n",
          '{"type":"message-end","messageId":"m1"}\n',
        ])
      )
    )
    expect(events).toHaveLength(3)
    expect(events[0]).toMatchObject({ role: "user" })
  })
})
