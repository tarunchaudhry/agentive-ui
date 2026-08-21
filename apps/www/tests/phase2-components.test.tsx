import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ToolApproval } from "@/registry/agentive-ui/tool-approval"
import { ToolCall } from "@/registry/agentive-ui/tool-call"
import { Reasoning } from "@/registry/agentive-ui/reasoning"
import { UsageMeter } from "@/registry/agentive-ui/usage-meter"
import { ErrorState } from "@/registry/agentive-ui/error-state"

describe("ToolApproval Component", () => {
  const sampleRequest = {
    id: "req-1",
    toolCallId: "tc-1",
    toolName: "delete_database",
    args: { dbName: "legacy_staging" },
    rationale: "Clean up orphaned disk resources.",
    createdAt: Date.now(),
  }

  it("renders the tool name and rationale", () => {
    render(
      <ToolApproval
        request={sampleRequest}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    )
    expect(screen.getByText("delete_database")).toBeInTheDocument()
    expect(
      screen.getByText("Clean up orphaned disk resources.")
    ).toBeInTheDocument()
  })

  it("approves with unmodified args", () => {
    const onApprove = vi.fn()
    render(
      <ToolApproval
        request={sampleRequest}
        onApprove={onApprove}
        onDeny={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    expect(onApprove).toHaveBeenCalledWith({ dbName: "legacy_staging" })
  })

  it("denies the tool invocation", () => {
    const onDeny = vi.fn()
    render(
      <ToolApproval
        request={sampleRequest}
        onApprove={vi.fn()}
        onDeny={onDeny}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Deny" }))
    expect(onDeny).toHaveBeenCalled()
  })
})

describe("ToolCall Component", () => {
  it("renders tool lifecycle badge and collapsible details", () => {
    render(
      <ToolCall
        name="web_search"
        args={{ query: "shadcn AI" }}
        result={{ matches: 5 }}
        status="success"
      />
    )
    expect(screen.getByText("web_search")).toBeInTheDocument()
    expect(screen.getByText("success")).toBeInTheDocument()

    // Toggle details
    const toggle = screen.getByRole("button", {
      name: "Toggle tool call details",
    })
    fireEvent.click(toggle)
    expect(screen.getByText("Arguments:")).toBeInTheDocument()
    expect(screen.getByText("Output:")).toBeInTheDocument()
  })
})

describe("Reasoning Component", () => {
  it("renders thinking state and toggles expansion", () => {
    const { rerender } = render(
      <Reasoning text="Exploring algorithmic paths." status="streaming" />
    )
    expect(screen.getByText("Thinking…")).toBeInTheDocument()

    rerender(
      <Reasoning
        text="Exploring algorithmic paths."
        status="complete"
        durationMs={1500}
      />
    )
    expect(screen.getByText("Thought process")).toBeInTheDocument()
    expect(screen.getByText("(1.5s)")).toBeInTheDocument()
  })
})

describe("UsageMeter Component", () => {
  it("displays formatted tokens and cost", () => {
    render(<UsageMeter tokens={250000} maxTokens={1000000} costUsd={0.05} />)
    expect(screen.getByText("250.0k / 1.0M")).toBeInTheDocument()
    expect(screen.getByText("$0.0500")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25"
    )
  })
})

describe("ErrorState Component", () => {
  it("renders error message, code and triggers retry", () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        message="Model rate limit exceeded"
        code="RATE_LIMIT_429"
        onRetry={onRetry}
      />
    )
    expect(screen.getByText("Model rate limit exceeded")).toBeInTheDocument()
    expect(screen.getByText("Code: RATE_LIMIT_429")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(onRetry).toHaveBeenCalled()
  })
})
