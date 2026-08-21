"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useAutoScroll, type AgentMessage } from "@agentive-ui/core"
import { ArrowDown } from "lucide-react"

import { Message, type MessageProps } from "./message"

export interface ConversationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  messages: AgentMessage[]
  /** Whether an assistant turn is currently streaming. */
  isStreaming?: boolean
  /** Override rendering of an entire message row. */
  renderMessage?: (message: AgentMessage) => React.ReactNode
  /** Override per-part rendering inside the default message row. */
  renderPart?: MessageProps["renderPart"]
  /** Rendered when there are no messages. */
  emptyState?: React.ReactNode
  /** Distance (px) from the bottom that counts as "at bottom". */
  autoScrollThreshold?: number
  /** Label for the jump-to-latest pill. */
  jumpLabel?: string
}

interface MessageRowProps {
  message: AgentMessage
  renderMessage?: ConversationProps["renderMessage"]
  renderPart?: ConversationProps["renderPart"]
}

const MessageRow = React.memo(function MessageRow({
  message,
  renderMessage,
  renderPart,
}: MessageRowProps) {
  if (renderMessage) return <>{renderMessage(message)}</>
  return (
    <Message
      role={message.role}
      status={message.status}
      parts={message.parts}
      renderPart={renderPart}
    />
  )
})

/**
 * The chat transcript scroll container. Sticks to the bottom while streaming
 * (only if the reader is already there), preserves position when older
 * history is prepended, and shows a "jump to latest" pill when the reader
 * scrolls away.
 */
export function Conversation({
  messages,
  isStreaming = false,
  renderMessage,
  renderPart,
  emptyState,
  autoScrollThreshold = 80,
  jumpLabel = "Jump to latest",
  className,
  ...props
}: ConversationProps) {
  const { containerRef, isAtBottom, scrollToBottom } = useAutoScroll({
    threshold: autoScrollThreshold,
  })

  // Stick to bottom as new content arrives while the reader is at the edge.
  const last = messages[messages.length - 1]
  const lastPart = last?.parts[last.parts.length - 1]
  const streamKey = `${messages.length}:${last?.parts.length ?? 0}:${
    lastPart?.type === "text" ? lastPart.text.length : ""
  }`
  const prevStreamKeyRef = React.useRef(streamKey)
  React.useLayoutEffect(() => {
    if (streamKey !== prevStreamKeyRef.current) {
      prevStreamKeyRef.current = streamKey
      if (isAtBottom) scrollToBottom("auto")
    }
  }, [streamKey, isAtBottom, scrollToBottom])

  // Preserve the reader's place when history is prepended above.
  const prevScrollHeightRef = React.useRef(0)
  const prevFirstIdRef = React.useRef<string | undefined>(messages[0]?.id)
  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const firstId = messages[0]?.id
    if (
      prevFirstIdRef.current !== undefined &&
      firstId !== prevFirstIdRef.current
    ) {
      el.scrollTop += el.scrollHeight - prevScrollHeightRef.current
    }
    prevFirstIdRef.current = firstId
    prevScrollHeightRef.current = el.scrollHeight
  }, [messages, containerRef])

  // Land at the bottom on first mount.
  React.useEffect(() => {
    scrollToBottom("auto")
  }, [scrollToBottom])

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div
        ref={containerRef}
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions"
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div
          className="flex flex-col gap-4 px-4 py-4"
          aria-busy={isStreaming || undefined}
        >
          {messages.length === 0 && emptyState ? emptyState : null}
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              renderMessage={renderMessage}
              renderPart={renderPart}
            />
          ))}
        </div>
      </div>

      {!isAtBottom && messages.length > 0 ? (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent"
        >
          <ArrowDown className="size-4" />
          {jumpLabel}
        </button>
      ) : null}
    </div>
  )
}

Conversation.displayName = "Conversation"
