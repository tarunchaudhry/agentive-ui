import type { AgentEvent, MessageRole, Source, ToolCallStatus } from "../types"

/** Common options for mock event-stream generators. */
export interface MockStreamOptions {
  /** Base delay between emitted events, in milliseconds. */
  delayMs?: number
  /** Random extra delay added to each event, in milliseconds. */
  jitterMs?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tick(options: MockStreamOptions | undefined): Promise<void> {
  const base = options?.delayMs ?? 0
  const jitter = options?.jitterMs ?? 0
  if (base <= 0 && jitter <= 0) return
  const delay = base + (jitter > 0 ? Math.random() * jitter : 0)
  await sleep(delay)
}

function chunkString(text: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size))
  }
  return out
}

let mockCounter = 0
function nextId(prefix: string): string {
  mockCounter += 1
  return `${prefix}-${mockCounter}`
}

/* ------------------------------------------------------------------ *
 * Chat
 * ------------------------------------------------------------------ */

export interface ChatMockOptions extends MockStreamOptions {
  messageId?: string
  role?: MessageRole
  text?: string
  /** Emit deltas as words instead of characters (fewer events). */
  unit?: "char" | "word"
}

/** A single assistant turn streaming text token by token. */
export async function* createChatMockStream(
  options: ChatMockOptions = {}
): AsyncGenerator<AgentEvent> {
  const messageId = options.messageId ?? nextId("msg")
  const role = options.role ?? "assistant"
  const text =
    options.text ??
    "This is a mocked assistant response, streamed one token at a time."
  const chunks =
    options.unit === "word" ? text.split(/(?<=\s)/) : Array.from(text)

  yield { type: "message-start", messageId, role }
  for (const chunk of chunks) {
    await tick(options)
    yield { type: "text-delta", messageId, delta: chunk }
  }
  await tick(options)
  yield { type: "message-end", messageId }
}

/* ------------------------------------------------------------------ *
 * Tool calls
 * ------------------------------------------------------------------ */

export interface ToolCallMockOptions extends MockStreamOptions {
  messageId?: string
  toolName?: string
  args?: Record<string, unknown>
  result?: unknown
  resultText?: string
  status?: Extract<ToolCallStatus, "success" | "error">
}

/** A single assistant turn that makes one tool call and reports its result. */
export async function* createToolCallMockStream(
  options: ToolCallMockOptions = {}
): AsyncGenerator<AgentEvent> {
  const messageId = options.messageId ?? nextId("msg")
  const toolName = options.toolName ?? "search_web"
  const args = options.args ?? { query: "shadcn agent ui" }
  const result = options.result ?? { title: "Sample result", hits: 3 }
  const toolCallId = nextId("tc")
  const partId = `${toolCallId}:part`
  const argsText = JSON.stringify(args)

  yield { type: "message-start", messageId, role: "assistant" }
  yield { type: "tool-call-start", messageId, partId, toolCallId, toolName }

  for (const chunk of chunkString(argsText, 6)) {
    await tick(options)
    yield { type: "tool-call-delta", toolCallId, argsDelta: chunk }
  }

  await tick(options)
  yield { type: "tool-call-end", toolCallId, args }

  await tick(options)
  yield {
    type: "tool-result",
    messageId,
    toolCallId,
    result,
    status: options.status ?? "success",
    resultText: options.resultText,
  }

  await tick(options)
  yield { type: "message-end", messageId }
}

/* ------------------------------------------------------------------ *
 * Sources
 * ------------------------------------------------------------------ */

export interface SourceMockOptions extends MockStreamOptions {
  messageId?: string
  sources?: Source[]
}

/** A message that surfaces a list of search result sources. */
export async function* createSourceMockStream(
  options: SourceMockOptions = {}
): AsyncGenerator<AgentEvent> {
  const messageId = options.messageId ?? nextId("msg")
  const sources: Source[] =
    options.sources ??
    Array.from({ length: 3 }, (_, i) => ({
      id: `src-${i + 1}`,
      title: `Example source ${i + 1}`,
      url: `https://example.com/result-${i + 1}`,
      domain: "example.com",
      snippet: `A short snippet summarizing result ${i + 1}.`,
    }))

  yield { type: "message-start", messageId, role: "assistant" }
  await tick(options)
  yield { type: "source-list", messageId, sources }
  await tick(options)
  yield { type: "message-end", messageId }
}
