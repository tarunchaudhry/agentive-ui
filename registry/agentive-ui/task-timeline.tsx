"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock, ChevronDown, XCircle } from "lucide-react"

export type StepStatus = "pending" | "active" | "done" | "error"

export interface TaskStep {
  id: string
  title: string
  description?: string
  status: StepStatus
  details?: React.ReactNode | string
}

export interface TaskTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: TaskStep[]
  /** Allow clicking a step to toggle its details pane. */
  collapsible?: boolean
  defaultExpandedIds?: string[]
}

export function TaskTimeline({
  steps,
  collapsible = true,
  defaultExpandedIds = [],
  className,
  ...props
}: TaskTimelineProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(defaultExpandedIds)
  )

  const toggle = (id: string) => {
    if (!collapsible) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={cn("my-3 flex flex-col gap-0", className)} {...props}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isExpanded = expandedIds.has(step.id)

        return (
          <div key={step.id} className="relative flex gap-3 text-sm">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                aria-hidden="true"
                className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border"
              />
            )}

            {/* Step status icon */}
            <div className="relative z-10 mt-1 flex shrink-0 items-center justify-center">
              {step.status === "done" && (
                <CheckCircle2 className="size-6 text-(--agentive-tool-success)" />
              )}
              {step.status === "active" && (
                <Clock className="size-6 animate-spin text-(--agentive-tool-running)" />
              )}
              {step.status === "error" && (
                <XCircle className="size-6 text-(--agentive-tool-error)" />
              )}
              {step.status === "pending" && (
                <Circle className="size-6 text-(--agentive-tool-pending)" />
              )}
            </div>

            {/* Step header and content */}
            <div className="min-w-0 flex-1 pb-4">
              <button
                type="button"
                onClick={() => toggle(step.id)}
                disabled={!collapsible || !step.details}
                className={cn(
                  "flex w-full items-center justify-between text-left",
                  collapsible &&
                    step.details &&
                    "cursor-pointer hover:underline"
                )}
              >
                <div>
                  <span
                    className={cn(
                      "font-medium",
                      step.status === "active" &&
                        "text-foreground font-semibold",
                      step.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
                {collapsible && step.details && (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-(--agentive-motion-duration)",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
              </button>

              {isExpanded && step.details && (
                <div className="mt-2 rounded-md border bg-(--agentive-assistant-bubble) p-2.5 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                  {step.details}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

TaskTimeline.displayName = "TaskTimeline"
