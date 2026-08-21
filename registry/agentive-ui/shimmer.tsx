import * as React from "react"

import { cn } from "@/lib/utils"

export interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A skeleton placeholder with a sweeping gradient, used for a pending
 * assistant turn or loading content. Colors follow `--agentive-shimmer-from`
 * and `--agentive-shimmer-to`; animation respects `prefers-reduced-motion`.
 */
export function Shimmer({ className, ...props }: ShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-(--agentive-shimmer-from)",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-agentive-shimmer motion-reduce:animate-none bg-linear-to-r from-transparent via-(--agentive-shimmer-to) to-transparent bg-[length:200%_100%]"
      />
    </div>
  )
}

Shimmer.displayName = "Shimmer"
