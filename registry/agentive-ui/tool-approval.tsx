"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { ToolApprovalRequest } from "@agentive-ui/core"
import { Check, Edit3, ShieldAlert, X } from "lucide-react"

export interface ToolApprovalProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSubmit"
> {
  request: ToolApprovalRequest
  /** Invoked when the user approves, with optional updated JSON arguments. */
  onApprove: (updatedArgs?: unknown) => void
  /** Invoked when the user denies the tool invocation. */
  onDeny: (reason?: string) => void
  /** Allow in-place JSON argument editing before approval. */
  allowEditArgs?: boolean
  disabled?: boolean
}

/**
 * Human-in-the-loop approval card. Renders high-stakes proposed tool calls
 * with Approve / Deny / Edit-args controls and keyboard accessibility.
 */
export function ToolApproval({
  request,
  onApprove,
  onDeny,
  allowEditArgs = true,
  disabled = false,
  className,
  ...props
}: ToolApprovalProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedArgsText, setEditedArgsText] = React.useState(() =>
    JSON.stringify(request.args, null, 2)
  )
  const [parseError, setParseError] = React.useState<string | null>(null)

  const handleApprove = () => {
    if (isEditing) {
      try {
        const parsed = JSON.parse(editedArgsText)
        onApprove(parsed)
      } catch (err) {
        setParseError("Invalid JSON payload")
        return
      }
    } else {
      onApprove(request.args)
    }
  }

  return (
    <div
      role="alert"
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-(--agentive-approval-accent)/40 bg-card p-4 shadow-sm animate-agentive-message-in motion-reduce:animate-none",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-(--agentive-approval-accent)/15 p-2 text-(--agentive-approval-accent)">
          <ShieldAlert className="size-5 shrink-0" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Action Requires Approval
            </h4>
            <span className="font-mono text-xs text-muted-foreground">
              {request.toolName}
            </span>
          </div>

          {request.rationale && (
            <p className="mt-1 text-xs text-muted-foreground">
              {request.rationale}
            </p>
          )}

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Proposed Parameters:</span>
              {allowEditArgs && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-(--agentive-citation) hover:underline"
                >
                  <Edit3 className="size-3" /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-1.5 flex flex-col gap-1">
                <textarea
                  value={editedArgsText}
                  onChange={(e) => {
                    setEditedArgsText(e.target.value)
                    setParseError(null)
                  }}
                  rows={4}
                  className="w-full rounded-md border bg-muted/50 p-2 font-mono text-xs outline-none focus:border-ring"
                />
                {parseError && (
                  <span className="text-[11px] text-(--agentive-tool-error)">
                    {parseError}
                  </span>
                )}
              </div>
            ) : (
              <pre className="mt-1.5 max-h-36 overflow-x-auto rounded-md bg-muted/50 p-2 font-mono text-xs text-foreground">
                <code>{JSON.stringify(request.args, null, 2)}</code>
              </pre>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDeny("User rejected action")}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3.5" />
              Deny
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-lg bg-(--agentive-approval-accent) px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-3.5" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ToolApproval.displayName = "ToolApproval"
