import { useCallback, useReducer } from "react"

import type { ToolApprovalRequest } from "../types"

export type ToolApprovalDecision =
  | { type: "approve"; requestId: string; updatedArgs?: unknown }
  | { type: "deny"; requestId: string; reason?: string }

export interface ToolApprovalRecord {
  request: ToolApprovalRequest
  status: "pending" | "approved" | "denied"
  decision?: ToolApprovalDecision
  resolvedAt?: number
}

export interface ToolApprovalsState {
  /** All recorded approval requests in order of arrival. */
  records: ToolApprovalRecord[]
  /** Subset of requests still waiting for user action. */
  pending: ToolApprovalRequest[]
}

type Action =
  | { type: "enqueue"; request: ToolApprovalRequest }
  | { type: "approve"; requestId: string; updatedArgs?: unknown }
  | { type: "deny"; requestId: string; reason?: string }
  | { type: "clear" }

function reducer(
  state: ToolApprovalsState,
  action: Action
): ToolApprovalsState {
  switch (action.type) {
    case "enqueue": {
      if (state.records.some((r) => r.request.id === action.request.id)) {
        return state
      }
      const record: ToolApprovalRecord = {
        request: action.request,
        status: "pending",
      }
      return {
        records: [...state.records, record],
        pending: [...state.pending, action.request],
      }
    }
    case "approve": {
      const records = state.records.map((r) =>
        r.request.id === action.requestId
          ? {
              ...r,
              status: "approved" as const,
              decision: {
                type: "approve" as const,
                requestId: action.requestId,
                updatedArgs: action.updatedArgs,
              },
              resolvedAt: Date.now(),
            }
          : r
      )
      return {
        records,
        pending: state.pending.filter((p) => p.id !== action.requestId),
      }
    }
    case "deny": {
      const records = state.records.map((r) =>
        r.request.id === action.requestId
          ? {
              ...r,
              status: "denied" as const,
              decision: {
                type: "deny" as const,
                requestId: action.requestId,
                reason: action.reason,
              },
              resolvedAt: Date.now(),
            }
          : r
      )
      return {
        records,
        pending: state.pending.filter((p) => p.id !== action.requestId),
      }
    }
    case "clear":
      return { records: [], pending: [] }
    default:
      return state
  }
}

export interface UseToolApprovalsOptions {
  /** Called when a user approves an action, passing updated args if edited. */
  onApprove?: (request: ToolApprovalRequest, updatedArgs?: unknown) => void
  /** Called when a user denies an action. */
  onDeny?: (request: ToolApprovalRequest, reason?: string) => void
}

export interface UseToolApprovalsReturn {
  records: ToolApprovalRecord[]
  pending: ToolApprovalRequest[]
  /** Enqueue an incoming approval request (e.g. from `useAgentStream` onApprovalRequired). */
  enqueue: (request: ToolApprovalRequest) => void
  /** Approve a pending request with optional edited arguments. */
  approve: (requestId: string, updatedArgs?: unknown) => void
  /** Deny a pending request with an optional human reason. */
  deny: (requestId: string, reason?: string) => void
  /** Clear all history and pending queue. */
  clear: () => void
  /** Get record by request ID. */
  getRecord: (requestId: string) => ToolApprovalRecord | undefined
}

export function useToolApprovals(
  options: UseToolApprovalsOptions = {}
): UseToolApprovalsReturn {
  const [state, dispatch] = useReducer(reducer, { records: [], pending: [] })

  const enqueue = useCallback((request: ToolApprovalRequest) => {
    dispatch({ type: "enqueue", request })
  }, [])

  const approve = useCallback(
    (requestId: string, updatedArgs?: unknown) => {
      const target = state.records.find((r) => r.request.id === requestId)
      dispatch({ type: "approve", requestId, updatedArgs })
      if (target) {
        options.onApprove?.(target.request, updatedArgs)
      }
    },
    [state.records, options]
  )

  const deny = useCallback(
    (requestId: string, reason?: string) => {
      const target = state.records.find((r) => r.request.id === requestId)
      dispatch({ type: "deny", requestId, reason })
      if (target) {
        options.onDeny?.(target.request, reason)
      }
    },
    [state.records, options]
  )

  const clear = useCallback(() => {
    dispatch({ type: "clear" })
  }, [])

  const getRecord = useCallback(
    (requestId: string) =>
      state.records.find((r) => r.request.id === requestId),
    [state.records]
  )

  return {
    records: state.records,
    pending: state.pending,
    enqueue,
    approve,
    deny,
    clear,
    getRecord,
  }
}
