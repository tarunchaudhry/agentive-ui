import * as React from "react"

import { cn } from "@/lib/utils"

const dotSizes = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
} as const

export interface TypingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof dotSizes
}

/**
 * An animated "agent is typing" indicator: three dots bouncing with a
 * stagger. Color follows `--agentive-streaming-caret` and animation timing
 * is token-driven. Respects `prefers-reduced-motion`.
 */
export function TypingDots({
  size = "md",
  className,
  ...props
}: TypingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Typing"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-(--agentive-streaming-caret) animate-agentive-typing motion-reduce:animate-none",
            dotSizes[size]
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <span className="sr-only">Typing</span>
    </div>
  )
}

TypingDots.displayName = "TypingDots"
