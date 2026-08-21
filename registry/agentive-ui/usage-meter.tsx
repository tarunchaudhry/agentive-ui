"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Gauge } from "lucide-react"

export interface UsageMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tokens currently used in context. */
  tokens: number
  /** Maximum context window size in tokens. */
  maxTokens?: number
  /** Estimated cost in USD if known. */
  costUsd?: number
  /** Threshold percentage (0-1) where warning color activates. @default 0.8 */
  warningThreshold?: number
  /** Threshold percentage (0-1) where danger/error color activates. @default 0.95 */
  dangerThreshold?: number
}

/**
 * Visual context window / cost meter. Warns when context limits approach capacity.
 */
export function UsageMeter({
  tokens,
  maxTokens,
  costUsd,
  warningThreshold = 0.8,
  dangerThreshold = 0.95,
  className,
  ...props
}: UsageMeterProps) {
  const ratio =
    maxTokens && maxTokens > 0 ? Math.min(tokens / maxTokens, 1) : null
  const percent = ratio !== null ? Math.round(ratio * 100) : null

  const isDanger = ratio !== null && ratio >= dangerThreshold
  const isWarning = ratio !== null && ratio >= warningThreshold && !isDanger

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toLocaleString()
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card p-2.5 text-xs text-muted-foreground",
        isDanger && "border-(--agentive-tool-error)/50",
        isWarning && "border-(--agentive-approval-accent)/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <Gauge
            className={cn(
              "size-3.5",
              isDanger && "text-(--agentive-tool-error)",
              isWarning && "text-(--agentive-approval-accent)"
            )}
          />
          <span>Tokens:</span>
          <span className="font-semibold text-foreground">
            {formatTokens(tokens)}
            {maxTokens ? ` / ${formatTokens(maxTokens)}` : ""}
          </span>
        </div>

        {costUsd !== undefined && (
          <span className="text-[11px] text-muted-foreground">
            ${costUsd.toFixed(4)}
          </span>
        )}
      </div>

      {ratio !== null && (
        <div
          role="progressbar"
          aria-valuenow={percent ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isDanger && "bg-(--agentive-tool-error)",
              isWarning && "bg-(--agentive-approval-accent)",
              !isDanger && !isWarning && "bg-(--agentive-tool-success)"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  )
}

UsageMeter.displayName = "UsageMeter"
