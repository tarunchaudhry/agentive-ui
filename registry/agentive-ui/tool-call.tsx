"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { ToolCallStatus } from "@agentive-ui/core"
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  RotateCcw,
  Wrench,
  XCircle,
} from "lucide-react"

export interface ToolCallProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  args: unknown
  result?: unknown
  status?: ToolCallStatus
  /** Optional error message if status is error. */
  error?: string
  /** Retry slot callback. */
  onRetry?: () => void
  defaultOpen?: boolean
}

/**
 * Renders a structured tool call: tool name, lifecycle badge, input args,
 * collapsible result JSON, and error/retry slots.
 */
export function ToolCall({
  name,
  args,
  result,
  status = "running",
  error,
  onRetry,
  defaultOpen = false,
  className,
  ...props
}: ToolCallProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const isRunning = status === "running"
  const isSuccess = status === "success"
  const isError = status === "error"

  const formatPayload = (data: unknown) => {
    if (data === undefined) return "undefined"
    if (typeof data === "string") return data
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <div
      className={cn(
        "my-2.5 overflow-hidden rounded-lg border bg-(--agentive-assistant-bubble) text-sm shadow-xs transition-colors",
        isError && "border-(--agentive-tool-error)/40",
        isRunning && "border-(--agentive-tool-running)/40",
        isSuccess && "border-(--agentive-tool-success)/40",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b px-3 py-2 bg-background/50">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Wrench className="size-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{name}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
              isRunning &&
                "bg-(--agentive-tool-running)/10 text-(--agentive-tool-running)",
              isSuccess &&
                "bg-(--agentive-tool-success)/10 text-(--agentive-tool-success)",
              isError &&
                "bg-(--agentive-tool-error)/10 text-(--agentive-tool-error)",
              status === "pending" &&
                "bg-(--agentive-tool-pending)/10 text-(--agentive-tool-pending)"
            )}
          >
            {isRunning && <Clock className="size-2.5 animate-spin" />}
            {isSuccess && <CheckCircle2 className="size-2.5" />}
            {isError && <XCircle className="size-2.5" />}
            {status}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 rounded p-1 text-xs text-(--agentive-tool-error) hover:bg-accent"
              aria-label="Retry tool call"
            >
              <RotateCcw className="size-3.5" />
              <span className="text-[11px]">Retry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle tool call details"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-(--agentive-motion-duration)",
                open && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col divide-y border-t bg-background/30 font-mono text-xs">
          <div className="p-3">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Arguments:
            </span>
            <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-foreground">
              <code>{formatPayload(args)}</code>
            </pre>
          </div>

          {result !== undefined && (
            <div className="p-3">
              <span className="text-[11px] font-semibold text-(--agentive-tool-success)">
                Output:
              </span>
              <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-foreground">
                <code>{formatPayload(result)}</code>
              </pre>
            </div>
          )}

          {error && (
            <div className="p-3">
              <span className="text-[11px] font-semibold text-(--agentive-tool-error)">
                Error:
              </span>
              <p className="mt-1 text-(--agentive-tool-error)">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

ToolCall.displayName = "ToolCall"
