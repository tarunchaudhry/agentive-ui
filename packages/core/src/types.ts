/**
 * Core type definitions for Agentive UI.
 *
 * These types describe the canonical shape of an agent conversation:
 * messages composed of typed parts, plus the stream event schema that
 * transports (SSE, WebSocket, AI SDK, LangGraph) map onto.
 */

/** A stable identifier for a message or part. */
export type ID = string

/** The role of a message within a conversation. */
export type MessageRole = "user" | "assistant" | "system" | "tool"

/** Lifecycle status of a message or part. */
export type StreamStatus = "idle" | "streaming" | "complete" | "error"

/** Lifecycle status of a tool call. */
export type ToolCallStatus =
  "pending" | "running" | "success" | "error" | "cancelled"

/** A single result source (search hit, page, document, etc.). */
export interface Source {
  id: string
  title: string
  url: string
  domain?: string
  snippet?: string
  favicon?: string
  /** Whether this source was actually cited in the final answer. */
  usedInAnswer?: boolean
  /** Optional metadata, e.g. publish date, score, author. */
  metadata?: Record<string, unknown>
}

/** A file attachment rendered inside a message. */
export interface FileAttachment {
  id: string
  name: string
  mimeType: string
  /** Data URL or remote URL to the file content / preview. */
  url?: string
  size?: number
}

/** A browser/computer-use action with normalized coordinate space (0-1). */
export interface BrowserAction {
  id: string
  kind:
    "navigate" | "click" | "type" | "scroll" | "extract" | "screenshot" | "wait"
  /** Human label for the action, e.g. "Click the 'Sign in' button". */
  label: string
  /** Value used by the action, e.g. typed text or a URL. */
  value?: string
  /** Normalized viewport coordinates for click/type targets (0-1). */
  coords?: { x: number; y: number }
  /** Optional screenshot frame associated with this action. */
  screenshotUrl?: string
  status?: ToolCallStatus
  timestamp?: number
}

/** A single tool call. */
export interface ToolCall {
  id: string
  name: string
  args: unknown
  /** Serializable string form of the arguments (used for delta assembly). */
  argsText?: string
  result?: unknown
  status: ToolCallStatus
  createdAt?: number
  completedAt?: number
}

/** A request for human approval of a tool call (human-in-the-loop). */
export interface ToolApprovalRequest {
  id: string
  toolCallId: string
  toolName: string
  args: unknown
  messageId?: string
  /** Optional rationale the agent provided for the request. */
  rationale?: string
  createdAt: number
}

/* ------------------------------------------------------------------ *
 * Message parts (discriminated union)
 * ------------------------------------------------------------------ */

export interface TextPart {
  type: "text"
  id: ID
  text: string
}

export interface ReasoningPart {
  type: "reasoning"
  id: ID
  text: string
  status: "streaming" | "complete"
  /** Elapsed time in milliseconds, if known. */
  durationMs?: number
}

export interface ToolCallPart {
  type: "tool-call"
  id: ID
  call: ToolCall
}

export interface ToolResultPart {
  type: "tool-result"
  id: ID
  toolCallId: ID
  result: unknown
  status: "success" | "error"
  /** Optional structured text for display. */
  resultText?: string
}

export interface SourcePart {
  type: "source"
  id: ID
  sources: Source[]
}

/** Inline citation marker pointing at a source, rendered as a superscript. */
export interface CitationPart {
  type: "citation"
  id: ID
  sourceId: ID
  index: number
}

export interface BrowserActionPart {
  type: "browser-action"
  id: ID
  action: BrowserAction
}

export interface FilePart {
  type: "file"
  id: ID
  files: FileAttachment[]
}

export interface ErrorPart {
  type: "error"
  id: ID
  message: string
  /** Optional machine-readable error code. */
  code?: string
  /** Whether the error is recoverable (retryable). */
  recoverable?: boolean
}

/** The full discriminated union of message parts. */
export type MessagePart =
  | TextPart
  | ReasoningPart
  | ToolCallPart
  | ToolResultPart
  | SourcePart
  | CitationPart
  | BrowserActionPart
  | FilePart
  | ErrorPart

/** A message in an agent conversation. */
export interface AgentMessage {
  id: ID
  role: MessageRole
  parts: MessagePart[]
  createdAt?: number
  status: StreamStatus
  /** Optional metadata: model name, latency, token usage, etc. */
  metadata?: Record<string, unknown>
}

/* ------------------------------------------------------------------ *
 * Stream events (transport-neutral)
 * ------------------------------------------------------------------ */

export interface MessageStartEvent {
  type: "message-start"
  messageId: ID
  role: MessageRole
}

export interface TextDeltaEvent {
  type: "text-delta"
  messageId: ID
  delta: string
}

export interface ReasoningStartEvent {
  type: "reasoning-start"
  messageId: ID
  partId: ID
}

export interface ReasoningDeltaEvent {
  type: "reasoning-delta"
  messageId: ID
  partId: ID
  delta: string
}

export interface ReasoningEndEvent {
  type: "reasoning-end"
  messageId: ID
  partId: ID
}

export interface ToolCallStartEvent {
  type: "tool-call-start"
  messageId: ID
  partId: ID
  toolCallId: ID
  toolName: string
  args?: unknown
}

export interface ToolCallDeltaEvent {
  type: "tool-call-delta"
  toolCallId: ID
  argsDelta: string
}

export interface ToolCallEndEvent {
  type: "tool-call-end"
  toolCallId: ID
  args?: unknown
  status?: Extract<ToolCallStatus, "success" | "error" | "cancelled">
}

export interface ToolResultEvent {
  type: "tool-result"
  messageId: ID
  toolCallId: ID
  result: unknown
  status?: "success" | "error"
  resultText?: string
}

export interface SourceEvent {
  type: "source"
  messageId: ID
  source: Source
}

export interface SourceListEvent {
  type: "source-list"
  messageId: ID
  sources: Source[]
}

export interface ApprovalRequiredEvent {
  type: "approval-required"
  messageId: ID
  request: ToolApprovalRequest
}

export interface MessageEndEvent {
  type: "message-end"
  messageId: ID
}

export interface ErrorEvent {
  type: "error"
  messageId?: ID
  message: string
  code?: string
  recoverable?: boolean
}

/** The full discriminated union of stream events. */
export type AgentEvent =
  | MessageStartEvent
  | TextDeltaEvent
  | ReasoningStartEvent
  | ReasoningDeltaEvent
  | ReasoningEndEvent
  | ToolCallStartEvent
  | ToolCallDeltaEvent
  | ToolCallEndEvent
  | ToolResultEvent
  | SourceEvent
  | SourceListEvent
  | ApprovalRequiredEvent
  | MessageEndEvent
  | ErrorEvent

/** Convenience: all event `type` string literals. */
export type AgentEventType = AgentEvent["type"]
