import * as React from "react"

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Conversation } from "@/registry/agentive-ui/conversation"
import type { AgentMessage } from "@agentive-ui/core"

function buildMessages(n: number): AgentMessage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${i}`,
    role: i % 2 === 0 ? "user" : "assistant",
    parts: [{ type: "text", id: `m${i}:text:0`, text: `message ${i}` }],
    status: "complete",
  }))
}

describe("Conversation", () => {
  it("exposes the transcript as a polite live region", () => {
    render(<Conversation messages={buildMessages(3)} />)
    const log = screen.getByRole("log")
    expect(log).toHaveAttribute("aria-live", "polite")
    expect(log).toHaveAttribute("aria-relevant", "additions")
  })

  it("marks the transcript busy while streaming", () => {
    render(<Conversation messages={buildMessages(3)} isStreaming />)
    const content = screen.getByRole("log").firstElementChild
    expect(content).toHaveAttribute("aria-busy", "true")
  })

  it("does not re-render unrelated rows while one message streams", () => {
    const renderCounts = new Map<string, number>()

    function CountingRow({ id }: { id: string }) {
      renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1)
      return <div data-testid={`row-${id}`} />
    }

    function Harness() {
      const [messages, setMessages] = React.useState(() => buildMessages(200))
      const renderMessage = React.useCallback(
        (m: AgentMessage) => <CountingRow id={m.id} />,
        []
      )

      return (
        <div>
          <Conversation messages={messages} renderMessage={renderMessage} />
          <button
            type="button"
            onClick={() =>
              setMessages((prev) => {
                const last = prev[prev.length - 1]
                if (!last) return prev
                const textPart = last.parts[0]
                const text = textPart?.type === "text" ? textPart.text : ""
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    status: "streaming" as const,
                    parts: [
                      {
                        type: "text",
                        id: `${last.id}:text:0`,
                        text: `${text}x`,
                      },
                    ],
                  },
                ]
              })
            }
          >
            stream
          </button>
        </div>
      )
    }

    render(<Harness />)

    // Initial render: every row rendered exactly once.
    expect(renderCounts.size).toBe(200)
    expect(renderCounts.get("m0")).toBe(1)
    expect(renderCounts.get("m199")).toBe(1)

    // Stream several tokens into the last message only.
    fireEvent.click(screen.getByText("stream"))
    fireEvent.click(screen.getByText("stream"))
    fireEvent.click(screen.getByText("stream"))

    // Only the streaming row re-rendered; the other 199 stayed stable.
    expect(renderCounts.get("m0")).toBe(1)
    expect(renderCounts.get("m198")).toBe(1)
    expect(renderCounts.get("m199")).toBe(4)
  })
})
