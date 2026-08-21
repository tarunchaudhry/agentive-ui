"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { createHighlighter, type Highlighter } from "shiki"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import { Check, Copy } from "lucide-react"

const LANGUAGES = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "json",
  "bash",
  "python",
  "css",
  "html",
  "markdown",
  "sql",
  "yaml",
  "rust",
  "go",
]

// A single shared highlighter, lazily created. Uses the JavaScript regex
// engine (no WASM) and is browser/streaming friendly.
let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: LANGUAGES,
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    })
  }
  return highlighterPromise
}

function useColorScheme(): "light" | "dark" {
  const [scheme, setScheme] = React.useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light"
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  })

  React.useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setScheme(root.classList.contains("dark") ? "dark" : "light")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return scheme
}

export interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

/**
 * A syntax-highlighted code block with a language label and copy button.
 * Highlights asynchronously (memoized per block) and degrades to a plain
 * `<pre>` while highlighting or when a language is unsupported.
 */
export const CodeBlock = React.memo(function CodeBlock({
  code,
  language,
  className,
}: CodeBlockProps) {
  const scheme = useColorScheme()
  const [html, setHtml] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((highlighter) => {
        const lang =
          language && highlighter.getLoadedLanguages().includes(language)
            ? language
            : "text"
        return highlighter.codeToHtml(code, { lang, theme: `github-${scheme}` })
      })
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [code, language, scheme])

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard unavailable; ignore.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }, [code])

  return (
    <div
      className={cn(
        "group/code my-3 overflow-hidden rounded-lg border",
        className
      )}
    >
      <div className="flex items-center justify-between border-b bg-(--agentive-assistant-bubble) px-3 py-1.5">
        <span className="font-mono text-xs text-(--agentive-thinking)">
          {language ?? "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="rounded p-1 text-(--agentive-thinking) transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      {html ? (
        <div
          className="overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto bg-(--agentive-assistant-bubble) p-4 text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
})

CodeBlock.displayName = "CodeBlock"
