# Agentive UI

A shadcn-based UI development kit for building **AI agent interfaces** — chat,
streaming, tool calls, search/research agents, browser-use agents, and
human-in-the-loop flows — on top of the [shadcn/ui](https://ui.shadcn.com)
model (Tailwind CSS v4, CSS variables, Radix primitives, `cn` utility).

## What it is

- **Registry-first.** Distributed via a self-hosted shadcn registry. Run
  `npx shadcn add @agentive-ui/<component>` to copy components directly into your
  project. You own the code completely.
- **One small npm package.** Backed by `@agentive-ui/core` — headless, zero-UI:
  types, streaming hooks (`useAgentStream`, `useAutoScroll`), parsers (SSE/NDJSON),
  and transport adapters.
- **Transport-agnostic.** Components render from plain, well-typed props. Adapters
  map external state (Vercel AI SDK, LangGraph, raw SSE/WebSocket) to Agentive UI props.
- **Fully themeable.** Styled via an `--agentive-*` CSS variable layer on top of
  shadcn's existing token system. Override colors, motion, and radii without editing
  component internals.

## Repository layout

```
agentive-ui/
├─ packages/core/          # @agentive-ui/core — headless layer (types, hooks, parsers, adapters)
├─ registry/               # source of truth for all UI components
│  ├─ agentive-ui/         # component .tsx files + demo files
│  └─ registry.json        # shadcn registry manifest
├─ apps/www/               # Next.js docs site + hosts built registry at /r/{name}.json
├─ examples/               # adapter + playground demos (e.g. mock-playground)
└─ .github/workflows/      # CI
```

## Quickstart

### 1. Initialize shadcn (if needed)

```bash
npx shadcn@latest init
```

### 2. Register the Agentive UI namespace

```bash
npx shadcn@latest registry add @agentive-ui=https://agentive-ui.dev/r/{name}.json
```

_(For local development, use `http://localhost:3000/r/{name}.json`)_

### 3. Add components

```bash
npx shadcn@latest add @agentive-ui/conversation @agentive-ui/prompt-input
```

### 4. Use in your app

```tsx
"use client"

import { useAgentStream } from "@agentive-ui/core"
import { createChatMockStream } from "@agentive-ui/core/mock"
import { Conversation } from "@/components/agentive/conversation"
import { PromptInput } from "@/components/agentive/prompt-input"

export function AgentChat() {
  const { messages, isStreaming, start, append } = useAgentStream()

  const handleSubmit = async (text: string) => {
    append({
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", id: `part-${Date.now()}`, text }],
      status: "complete",
    })

    await start(
      createChatMockStream({
        text: "Hello from **Agentive UI**!",
        delayMs: 15,
      })
    )
  }

  return (
    <div className="flex h-svh flex-col">
      <Conversation
        messages={messages}
        isStreaming={isStreaming}
        className="min-h-0 flex-1"
      />
      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit} isGenerating={isStreaming} />
      </div>
    </div>
  )
}
```

## Component Inventory

### Phase 1 — Chat Primitives (Current)

| Component          | Description                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `conversation`     | Chat transcript scroll container with stick-to-bottom streaming, prepended history preservation, and jump-to-latest pill.             |
| `message`          | Compound message row (`Message.Avatar`, `Message.Content`, `Message.Actions`, `Message.Timestamp`) rendering typed `MessagePart`s.    |
| `markdown-content` | Streaming-safe GFM markdown renderer with Shiki syntax-highlighted code blocks (JavaScript engine, no WASM), copy button, and tables. |
| `streaming-text`   | Token-append plain text renderer with an animated blinking caret.                                                                     |
| `prompt-input`     | Auto-growing composer with Enter/Shift+Enter handling, stop button state, and attachment chips.                                       |
| `typing-dots`      | Animated 3-dot typing indicator driven by `--agentive-streaming-caret`.                                                               |
| `shimmer`          | Skeleton placeholder with sweeping gradient driven by `--agentive-shimmer-*`.                                                         |
| `spinner`          | Token-driven loading spinner with `prefers-reduced-motion` support.                                                                   |
| `theme`            | Core `--agentive-*` CSS variables + keyframes layer.                                                                                  |

### Phase 2 — Agent State & Tool Use (Current)

| Component       | Description                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `reasoning`     | Collapsible thinking panel with duration metrics; auto-opens while streaming, auto-collapses on finish.       |
| `task-timeline` | Ordered agent plan/step tracker with pending/active/done/error states and collapsible detail rows.            |
| `tool-call`     | Tool execution card with lifecycle badge, formatted args, collapsible output, error display, and retry slot.  |
| `tool-approval` | Human-in-the-loop approval card with Approve/Deny and editable JSON arguments; pairs with `useToolApprovals`. |
| `agent-status`  | Compact live status line (“Searching the web…”) with spinner icon and elapsed timer.                          |
| `usage-meter`   | Token/cost context-window meter with configurable warning and danger thresholds.                              |
| `error-state`   | Inline recoverable error block with error code and retry action.                                              |

Core additions: `useToolApprovals` queue hook and the `@agentive-ui/core/ai-sdk` adapter mapping Vercel AI SDK v4 (`content`/`toolInvocations`) and v5+ (`parts`) messages onto `AgentMessage[]`. See `examples/ai-sdk-chat` for a keyless end-to-end demo (mock model + real `useChat` transport + approval flow).

### Roadmap

- **Phase 3 — Search & Research:** `SourceChip` / `InlineCitation`, `SourceCard` & `SourceList`, `SearchActivity`, `ResearchPlan`, `DeepResearchProgress` parallel fan-out, `ReportView`.
- **Phase 4 — Browser / Computer Use & Workspace:** `BrowserView` action overlay viewport, `ActionLog`, `AgentWorkspace` resizable split-pane, `ThreadList`, `Suggestions`, LangGraph adapter.

## Theming System

Agentive UI layers dedicated variables on top of standard shadcn tokens. Overrides can be defined in your `globals.css`:

```css
:root {
  /* Roles */
  --agentive-user-bubble: var(--primary);
  --agentive-user-bubble-fg: var(--primary-foreground);
  --agentive-assistant-bubble: var(--muted);
  --agentive-assistant-bubble-fg: var(--foreground);

  /* Agent state */
  --agentive-thinking: var(--muted-foreground);
  --agentive-streaming-caret: var(--primary);
  --agentive-shimmer-from: var(--muted);
  --agentive-shimmer-to: var(--accent);

  /* Tool lifecycle */
  --agentive-tool-pending: var(--muted-foreground);
  --agentive-tool-running: var(--primary);
  --agentive-tool-success: oklch(0.596 0.145 163.225);
  --agentive-tool-error: var(--destructive);
  --agentive-approval-accent: oklch(0.769 0.188 70.08);

  /* Research / Citations */
  --agentive-citation: var(--primary);
  --agentive-source-card-border: var(--border);

  /* Browser Agent */
  --agentive-action-highlight: var(--ring);
  --agentive-viewport-border: var(--border);

  /* Motion & Shape */
  --agentive-motion-duration: 0.2s;
  --agentive-bubble-radius: var(--radius);
}
```

## Development & Testing

```bash
pnpm install
pnpm build                             # build core package
pnpm test                              # run all unit and integration tests
pnpm typecheck                         # verify TypeScript across packages
pnpm lint                              # run ESLint
pnpm registry:build                    # compile registry into apps/www/public/r
pnpm --filter @agentive-ui/www dev     # start documentation app at localhost:3000
```

### Local Registry Testing

Installs that reference unpublished packages use the local Verdaccio dev registry:

```bash
pnpm dev:registry                      # start local Verdaccio registry (:4873)
pnpm publish:local                     # publish @agentive-ui/core locally
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## Comparison

|                  | Agentive UI                                           | assistant-ui           | AI Elements            | CopilotKit             |
| ---------------- | ----------------------------------------------------- | ---------------------- | ---------------------- | ---------------------- |
| **Distribution** | shadcn (registry + copy-into-project)                 | npm packages           | npm packages           | npm packages           |
| **Coupling**     | None (pure props + adapters)                          | Some runtime coupling  | AI SDK                 | CopilotKit runtime     |
| **Ownership**    | Full source ownership, zero black box                 | Library component tree | Library component tree | Managed framework      |
| **Focus**        | Deep agent workflows (tools, HITL, research, browser) | Chat UI primitives     | AI UI primitives       | Agent runtime platform |

## License

[MIT](./LICENSE)
