import { describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useToolApprovals } from "./useToolApprovals"
import type { ToolApprovalRequest } from "../types"

describe("useToolApprovals", () => {
  const req1: ToolApprovalRequest = {
    id: "req-1",
    toolCallId: "tc-1",
    toolName: "execute_sql",
    args: { query: "DROP TABLE users;" },
    createdAt: 1000,
  }

  const req2: ToolApprovalRequest = {
    id: "req-2",
    toolCallId: "tc-2",
    toolName: "send_email",
    args: { to: "alice@example.com" },
    createdAt: 2000,
  }

  it("enqueues unique approval requests", () => {
    const { result } = renderHook(() => useToolApprovals())

    act(() => {
      result.current.enqueue(req1)
      result.current.enqueue(req2)
      // duplicate should be ignored
      result.current.enqueue(req1)
    })

    expect(result.current.records).toHaveLength(2)
    expect(result.current.pending).toHaveLength(2)
    expect(result.current.pending[0]?.id).toBe("req-1")
    expect(result.current.getRecord("req-1")?.status).toBe("pending")
  })

  it("approves a request with optional edited args and triggers onApprove callback", () => {
    const onApprove = vi.fn()
    const { result } = renderHook(() => useToolApprovals({ onApprove }))

    act(() => {
      result.current.enqueue(req1)
    })

    const updatedArgs = { query: "SELECT * FROM users;" }
    act(() => {
      result.current.approve("req-1", updatedArgs)
    })

    expect(result.current.pending).toHaveLength(0)
    const rec = result.current.getRecord("req-1")
    expect(rec?.status).toBe("approved")
    expect(rec?.decision).toEqual({
      type: "approve",
      requestId: "req-1",
      updatedArgs,
    })
    expect(onApprove).toHaveBeenCalledWith(req1, updatedArgs)
  })

  it("denies a request with an optional reason and triggers onDeny callback", () => {
    const onDeny = vi.fn()
    const { result } = renderHook(() => useToolApprovals({ onDeny }))

    act(() => {
      result.current.enqueue(req1)
    })

    act(() => {
      result.current.deny("req-1", "Destructive query not allowed")
    })

    expect(result.current.pending).toHaveLength(0)
    const rec = result.current.getRecord("req-1")
    expect(rec?.status).toBe("denied")
    expect(rec?.decision).toEqual({
      type: "deny",
      requestId: "req-1",
      reason: "Destructive query not allowed",
    })
    expect(onDeny).toHaveBeenCalledWith(req1, "Destructive query not allowed")
  })

  it("clears records and pending list", () => {
    const { result } = renderHook(() => useToolApprovals())
    act(() => {
      result.current.enqueue(req1)
      result.current.clear()
    })
    expect(result.current.records).toHaveLength(0)
    expect(result.current.pending).toHaveLength(0)
  })
})
