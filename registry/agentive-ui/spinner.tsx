import * as React from "react"

import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
} as const

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual size of the spinner.
   * @default "md"
   */
  size?: keyof typeof sizeClasses
}

/**
 * A token-driven loading spinner. The ring color follows
 * `--agentive-streaming-caret` and respects `prefers-reduced-motion`.
 */
export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full motion-reduce:animate-none",
        "border-(--agentive-streaming-caret) border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

Spinner.displayName = "Spinner"
