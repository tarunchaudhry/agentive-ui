"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AlertTriangle, RotateCcw } from "lucide-react"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string
  code?: string
  recoverable?: boolean
  onRetry?: () => void
}

/**
 * Inline recoverable error block with retry capability, distinct from tool execution errors.
 */
export function ErrorState({
  message,
  code,
  recoverable = true,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "my-2.5 flex items-start justify-between gap-3 rounded-lg border border-(--agentive-tool-error)/30 bg-(--agentive-tool-error)/10 p-3 text-sm text-(--agentive-tool-error)",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{message}</span>
          {code && (
            <span className="font-mono text-xs text-(--agentive-tool-error)/80">
              Code: {code}
            </span>
          )}
        </div>
      </div>

      {recoverable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1 rounded-md bg-(--agentive-tool-error) px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <RotateCcw className="size-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}

ErrorState.displayName = "ErrorState"
