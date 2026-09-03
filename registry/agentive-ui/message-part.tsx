import * as React from "react"

import type { MessagePart } from "@agentive-ui/core"

import { MarkdownContent } from "./markdown-content"
import { Reasoning } from "./reasoning"
import { ToolCall } from "./tool-call"
import { ErrorState } from "./error-state"

/**
 * Default renderer mapping each `MessagePart` onto its component.
 * Standalone `tool-result` parts are merged into their `ToolCall` card,
 * so they render nothing on their own.
 */
export function renderMessagePart(part: MessagePart): React.ReactNode {
  switch (part.type) {
    case "text":
      return <MarkdownContent key={part.id}>{part.text}</MarkdownContent>
    case "reasoning":
      return (
        <Reasoning
          key={part.id}
          text={part.text}
          status={part.status}
          durationMs={part.durationMs}
        />
      )
    case "tool-call":
      return (
        <ToolCall
          key={part.id}
          name={part.call.name}
          args={part.call.args}
          result={part.call.result}
          status={part.call.status}
        />
      )
    case "tool-result":
      return null
    case "error":
      return (
        <ErrorState
          key={part.id}
          message={part.message}
          code={part.code}
          recoverable={part.recoverable}
        />
      )
    default:
      return (
        <div
          key={part.id}
          className="rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground"
        >
          {part.type}
        </div>
      )
  }
}
