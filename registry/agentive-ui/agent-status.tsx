"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface AgentStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The human-readable message, e.g. "Searching the web..." */
  statusText: string
  /** Optional icon to override the default rotating loader */
  icon?: React.ReactNode
  /** Timestamp when this status phase began, for elapsed time calculation. */
  startedAt?: number
}

/**
 * Compact live status indicator ("Searching the web...", "Reading page 3/10")
 * with subtle elapsed timer and spinner icon.
 */
export function AgentStatus({
  statusText,
  icon,
  startedAt,
  className,
  ...props
}: AgentStatusProps) {
  const [elapsed, setElapsed] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!startedAt) {
      setElapsed(null)
      return
    }

    const update = () => {
      const sec = Math.floor((Date.now() - startedAt) / 1000)
      if (sec < 60) {
        setElapsed(`${sec}s`)
      } else {
        const min = Math.floor(sec / 60)
        setElapsed(`${min}m ${sec % 60}s`)
      }
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-xs backdrop-blur-xs",
        className
      )}
      {...props}
    >
      {icon ?? (
        <Loader2 className="size-3.5 animate-spin text-(--agentive-streaming-caret)" />
      )}
      <span className="font-medium text-foreground">{statusText}</span>
      {elapsed && (
        <span className="text-[11px] text-muted-foreground/80">
          ({elapsed})
        </span>
      )}
    </div>
  )
}

AgentStatus.displayName = "AgentStatus"
