"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ArrowUp, Paperclip, Square, X } from "lucide-react"

export interface PromptAttachment {
  id: string
  name: string
  type: string
  url?: string
  previewUrl?: string
}

export interface PromptInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSubmit" | "onChange"
> {
  /** Controlled value. If omitted, the input manages its own text state. */
  value?: string
  onChange?: (value: string) => void
  /** Called with the submitted text and current attachments. */
  onSubmit?: (value: string, attachments: PromptAttachment[]) => void
  /** Called when the stop-generation button is pressed. */
  onStop?: () => void
  /** Whether the assistant is currently generating (shows a stop button). */
  isGenerating?: boolean
  disabled?: boolean
  placeholder?: string
  attachments?: PromptAttachment[]
  /** Called when attachments change (add or remove). */
  onAttachmentsChange?: (attachments: PromptAttachment[]) => void
  /** Called with files selected via the paperclip button. */
  onFileSelect?: (files: FileList) => void
  autoFocus?: boolean
  /** Maximum number of rows before the textarea scrolls. */
  maxRows?: number
}

/**
 * Auto-growing composer with Enter-to-send, a stop-generation button, and
 * attachment chips. Keyboard operable; the textarea is labelled and the send
 * action is exposed as a real button.
 */
export function PromptInput({
  value: controlledValue,
  onChange,
  onSubmit,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = "Send a message…",
  attachments = [],
  onAttachmentsChange,
  onFileSelect,
  autoFocus = false,
  maxRows = 8,
  className,
  ...props
}: PromptInputProps) {
  const [internalValue, setInternalValue] = React.useState("")
  const value = controlledValue ?? internalValue
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const setValue = React.useCallback(
    (next: string) => {
      onChange ? onChange(next) : setInternalValue(next)
    },
    [onChange]
  )

  const resize = React.useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const lineHeight = 24
    const maxHeight = lineHeight * maxRows
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden"
  }, [maxRows])

  React.useLayoutEffect(() => {
    resize()
  }, [value, resize])

  const submit = React.useCallback(() => {
    const text = value.trim()
    if (!text || disabled || isGenerating) return
    onSubmit?.(text, attachments)
    setValue("")
  }, [value, disabled, isGenerating, onSubmit, attachments, setValue])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  const removeAttachment = (id: string) => {
    onAttachmentsChange?.(attachments.filter((a) => a.id !== id))
  }

  const pickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && onFileSelect) {
      onFileSelect(event.target.files)
    }
    event.target.value = ""
  }

  const canSubmit = value.trim().length > 0 && !disabled && !isGenerating

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-2 transition-colors focus-within:border-ring",
        className
      )}
      {...props}
    >
      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5 px-1">
          {attachments.map((attachment) => (
            <span
              key={attachment.id}
              className="inline-flex items-center gap-1.5 rounded-md border bg-muted px-2 py-1 text-xs"
            >
              {attachment.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.previewUrl}
                  alt=""
                  className="size-4 rounded object-cover"
                />
              ) : (
                <Paperclip className="size-3" />
              )}
              <span className="max-w-40 truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                aria-label={`Remove ${attachment.name}`}
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {onFileSelect ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-label="Attach files"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={pickFiles}
            />
          </>
        ) : null}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          rows={1}
          aria-label="Message"
          className="max-h-48 min-h-[24px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="rounded-lg bg-foreground p-2 text-background transition-colors hover:opacity-90"
          >
            <Square className="size-4" fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            aria-label="Send message"
            className="rounded-lg bg-foreground p-2 text-background transition-colors hover:opacity-90 disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

PromptInput.displayName = "PromptInput"
