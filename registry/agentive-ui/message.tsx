"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { MessagePart, MessageRole, StreamStatus } from "@agentive-ui/core"
import {
  Check,
  Copy,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react"

import { TypingDots } from "./typing-dots"
import { renderMessagePart } from "./message-part"

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

export interface MessageContextValue {
  role: MessageRole
  status: StreamStatus
  textContent: string
  onCopy?: () => void
  onRegenerate?: () => void
  onFeedback?: (feedback: "up" | "down") => void
}

const MessageContext = React.createContext<MessageContextValue>({
  role: "assistant",
  status: "complete",
  textContent: "",
})

function useMessageContext(): MessageContextValue {
  return React.useContext(MessageContext)
}

/* ------------------------------------------------------------------ *
 * Sub-components
 * ------------------------------------------------------------------ */

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

function MessageAvatar({ className, children, ...props }: MessageAvatarProps) {
  const { role } = useMessageContext()
  const isUser = role === "user"
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        isUser
          ? "bg-(--agentive-user-bubble) text-(--agentive-user-bubble-fg)"
          : "bg-(--agentive-assistant-bubble) text-(--agentive-assistant-bubble-fg)",
        className
      )}
      {...props}
    >
      {children ??
        (isUser ? (
          <User className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        ))}
    </div>
  )
}

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function MessageContent({
  className,
  children,
  ...props
}: MessageContentProps) {
  const { role } = useMessageContext()
  const isUser = role === "user"
  return (
    <div
      className={cn(
        "max-w-full rounded-(--agentive-bubble-radius) px-3.5 py-2.5",
        isUser
          ? "bg-(--agentive-user-bubble) text-(--agentive-user-bubble-fg)"
          : "bg-(--agentive-assistant-bubble) text-(--agentive-assistant-bubble-fg)",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface MessageActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

function MessageActions({
  className,
  children,
  ...props
}: MessageActionsProps) {
  const { textContent, onCopy, onRegenerate, onFeedback } = useMessageContext()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (onCopy) {
      onCopy()
      return
    }
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  if (children) {
    return (
      <div className={cn("flex items-center gap-1", className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        className
      )}
      {...props}
    >
      <ActionIconButton label="Copy" onClick={handleCopy}>
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </ActionIconButton>
      {onRegenerate ? (
        <ActionIconButton label="Regenerate" onClick={onRegenerate}>
          <RefreshCw className="size-3.5" />
        </ActionIconButton>
      ) : null}
      {onFeedback ? (
        <>
          <ActionIconButton
            label="Good response"
            onClick={() => onFeedback("up")}
          >
            <ThumbsUp className="size-3.5" />
          </ActionIconButton>
          <ActionIconButton
            label="Bad response"
            onClick={() => onFeedback("down")}
          >
            <ThumbsDown className="size-3.5" />
          </ActionIconButton>
        </>
      ) : null}
    </div>
  )
}

function ActionIconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      {...props}
    >
      {children}
    </button>
  )
}

export interface MessageTimestampProps extends React.TimeHTMLAttributes<HTMLTimeElement> {}

function MessageTimestamp({
  className,
  children,
  ...props
}: MessageTimestampProps) {
  return (
    <time className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </time>
  )
}

/* ------------------------------------------------------------------ *
 * Message
 * ------------------------------------------------------------------ */

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: MessageRole
  status?: StreamStatus
  parts?: MessagePart[]
  /** Override per-part rendering. */
  renderPart?: (part: MessagePart) => React.ReactNode
  onCopy?: () => void
  onRegenerate?: () => void
  onFeedback?: (feedback: "up" | "down") => void
}

function MessageRoot({
  role = "assistant",
  status = "complete",
  parts,
  children,
  renderPart,
  onCopy,
  onRegenerate,
  onFeedback,
  className,
  ...props
}: MessageProps) {
  const isUser = role === "user"
  const textContent = React.useMemo(
    () =>
      (parts ?? [])
        .filter(
          (p): p is Extract<MessagePart, { type: "text" }> => p.type === "text"
        )
        .map((p) => p.text)
        .join(""),
    [parts]
  )

  const ctx: MessageContextValue = React.useMemo(
    () => ({ role, status, textContent, onCopy, onRegenerate, onFeedback }),
    [role, status, textContent, onCopy, onRegenerate, onFeedback]
  )

  return (
    <MessageContext.Provider value={ctx}>
      <div
        data-role={role}
        data-status={status}
        className={cn(
          "group flex w-full gap-3",
          isUser && "flex-row-reverse",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <MessageAvatar />
            <div
              className={cn(
                "flex min-w-0 max-w-[85%] flex-col gap-1",
                isUser && "items-end"
              )}
            >
              <MessageContent>
                {parts?.map((part) =>
                  renderPart ? renderPart(part) : renderMessagePart(part)
                )}
                {status === "streaming" && (!parts || parts.length === 0) ? (
                  <TypingDots />
                ) : null}
                {status === "streaming" && parts && parts.length > 0 ? (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] bg-(--agentive-streaming-caret) animate-agentive-caret motion-reduce:animate-none"
                  />
                ) : null}
              </MessageContent>
              <MessageActions />
            </div>
          </>
        )}
      </div>
    </MessageContext.Provider>
  )
}

export const Message = Object.assign(MessageRoot, {
  Avatar: MessageAvatar,
  Content: MessageContent,
  Actions: MessageActions,
  Timestamp: MessageTimestamp,
})

export { MessageAvatar, MessageContent, MessageActions, MessageTimestamp }
