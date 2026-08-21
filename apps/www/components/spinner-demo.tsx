"use client"

import { useState } from "react"

import { Spinner } from "@/registry/agentive-ui/spinner"

const sizes = ["sm", "md", "lg"] as const

export function SpinnerDemo() {
  const [size, setSize] = useState<(typeof sizes)[number]>("md")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={
              "rounded-md border px-3 py-1 text-sm transition-colors " +
              (size === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex h-24 items-center justify-center rounded-lg border bg-card">
        <Spinner size={size} />
      </div>

      <p className="text-sm text-muted-foreground">
        The ring color follows{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          --agentive-streaming-caret
        </code>{" "}
        and respects <code>prefers-reduced-motion</code>.
      </p>
    </div>
  )
}
