import * as React from "react"

import { cn } from "@/lib/utils"

export interface StreamingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The streamed text content. */
  text: string
  /** Show a blinking caret while streaming. @default true */
  caret?: boolean
}

/**
 * Plain-text token rendering with an optional streaming caret. A faster
 * alternative to {@link MarkdownContent} when no markdown processing is
 * needed; the caret color follows `--agentive-streaming-caret`.
 */
export function StreamingText({
  text,
  caret = true,
  className,
  ...props
}: StreamingTextProps) {
  return (
    <span
      className={cn("whitespace-pre-wrap break-words", className)}
      {...props}
    >
      {text}
      {caret ? (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] bg-(--agentive-streaming-caret) animate-agentive-caret motion-reduce:animate-none"
        />
      ) : null}
    </span>
  )
}

StreamingText.displayName = "StreamingText"
