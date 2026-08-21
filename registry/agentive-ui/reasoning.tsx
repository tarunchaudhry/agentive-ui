"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Brain, ChevronDown } from "lucide-react"

export interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The model's internal thought chain / reasoning content. */
  text?: string
  /** Whether the reasoning part is actively streaming or complete. */
  status?: "streaming" | "complete"
  /** Duration in milliseconds of the reasoning step, if available. */
  durationMs?: number
  /** Default collapsed state. Defaults to open when streaming, collapsed when complete. */
  defaultOpen?: boolean
  /** Controlled open state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Collapsible "thinking" panel. Auto-opens while reasoning is streaming,
 * auto-collapses on finish by default, and exposes duration metrics.
 */
export function Reasoning({
  text,
  status = "complete",
  durationMs,
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  ...props
}: ReasoningProps) {
  const isStreaming = status === "streaming"
  const [internalOpen, setInternalOpen] = React.useState(
    defaultOpen ?? isStreaming
  )

  const isOpen = controlledOpen ?? internalOpen

  // Auto-manage open state transitions if uncontrolled
  const prevStreamingRef = React.useRef(isStreaming)
  React.useEffect(() => {
    if (controlledOpen === undefined && defaultOpen === undefined) {
      if (isStreaming && !prevStreamingRef.current) {
        setInternalOpen(true)
      } else if (!isStreaming && prevStreamingRef.current) {
        setInternalOpen(false)
      }
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, controlledOpen, defaultOpen])

  const toggle = () => {
    const next = !isOpen
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const durationLabel = React.useMemo(() => {
    if (!durationMs || durationMs <= 0) return null
    if (durationMs < 1000) return `${durationMs}ms`
    return `${(durationMs / 1000).toFixed(1)}s`
  }, [durationMs])

  return (
    <div
      className={cn(
        "my-2 rounded-lg border bg-(--agentive-assistant-bubble) text-sm transition-colors",
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-(--agentive-thinking) transition-colors hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <Brain
            className={cn(
              "size-4 shrink-0",
              isStreaming && "animate-pulse text-(--agentive-streaming-caret)"
            )}
          />
          <span>{isStreaming ? "Thinking…" : "Thought process"}</span>
          {durationLabel && !isStreaming ? (
            <span className="text-xs text-muted-foreground font-normal">
              ({durationLabel})
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-(--agentive-motion-duration)",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t px-3 py-2.5 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {children ?? text}
        </div>
      )}
    </div>
  )
}

Reasoning.displayName = "Reasoning"
