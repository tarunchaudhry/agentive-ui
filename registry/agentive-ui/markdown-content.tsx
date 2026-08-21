"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { CodeBlock } from "./code-block"

export interface MarkdownContentProps {
  /** The markdown source string. */
  children: string
  className?: string
  /**
   * Enable math rendering. Requires `remark-math` + `rehype-katex` and KaTeX
   * styles in the consuming project. Off by default to keep deps minimal.
   */
  math?: boolean
  /** Additional react-markdown component overrides. */
  components?: Components
}

/**
 * Streaming-safe GFM markdown renderer. Incomplete markdown (an unclosed code
 * fence, half-written table, etc.) renders without throwing. Code blocks are
 * syntax-highlighted via {@link CodeBlock}; everything else is memoized so
 * completed blocks skip re-rendering while another message streams.
 */
export const MarkdownContent = React.memo(function MarkdownContent({
  children,
  className,
  components,
}: MarkdownContentProps) {
  const remarkPlugins = React.useMemo(() => [remarkGfm], [])

  return (
    <div className={cn("min-w-0 text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={{
          pre: ({ children: preChildren }) => <>{preChildren}</>,
          code: ({ className: codeClassName, children: codeChildren }) => {
            const match = /language-(\w+)/.exec(codeClassName ?? "")
            const text = String(codeChildren).replace(/\n$/, "")
            const isBlock =
              Boolean(match) || String(codeChildren).includes("\n")
            if (!isBlock) {
              return (
                <code
                  className={cn(
                    "rounded bg-(--agentive-assistant-bubble) px-1.5 py-0.5 font-mono text-[0.85em]",
                    codeClassName
                  )}
                >
                  {codeChildren}
                </code>
              )
            }
            return <CodeBlock code={text} language={match?.[1]} />
          },
          a: ({ children: linkChildren, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--agentive-citation) underline underline-offset-2"
            >
              {linkChildren}
            </a>
          ),
          ...components,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
})

MarkdownContent.displayName = "MarkdownContent"
