# Agentive UI

A shadcn-based UI development kit for building **AI agent interfaces** — chat,
streaming, tool calls, search/research agents, browser-use agents, and
human-in-the-loop flows — on top of the [shadcn/ui](https://ui.shadcn.com)
model (Tailwind CSS v4, CSS variables, Radix primitives, `cn` utility).

## What it is

- **Registry-first.** Components are distributed through a self-hosted shadcn
  registry. Consumers run `npx shadcn add @agentive-ui/<component>` and receive
  source code copied into their project that they fully own and can modify.
- **One small dependency.** A single headless, zero-UI package
  `@agentive-ui/core` provides types, streaming/state hooks, message-part
  parsers, and transport adapters. Registry components import from it.
- **Transport-agnostic.** Every component renders from plain, well-typed props.
  Adapters map external state (Vercel AI SDK, LangGraph, raw SSE/WebSocket) to
  Agentive UI props.
- **Fully themeable.** All visual decisions flow through an `--agentive-*`
  CSS-variable layer layered on top of shadcn's tokens.

## Repository layout

```
agentive-ui/
├─ packages/core/          # @agentive-ui/core — headless layer (types, hooks, parsers, adapters)
├─ registry/               # source of truth for all UI components
│  ├─ agentive-ui/         # component .tsx files + demo files
│  └─ registry.json        # shadcn registry manifest
├─ apps/www/               # Next.js docs site + hosts built registry at /r/{name}.json
├─ examples/               # adapter + playground demos
└─ .github/workflows/      # CI
```

## Quickstart

```bash
# 1. Initialize shadcn in your project (if you haven't)
npx shadcn@latest init

# 2. Register the Agentive UI namespace
npx shadcn@latest registry add @agentive-ui=https://agentive-ui.dev/r/{name}.json

# 3. Add a component
npx shadcn@latest add @agentive-ui/spinner
```

## Components

| Component | Description                                                                      |
| --------- | -------------------------------------------------------------------------------- |
| `spinner` | Token-driven loading spinner (ring color follows `--agentive-streaming-caret`).  |
| `theme`   | The `--agentive-*` CSS variable layer (installed automatically as a dependency). |

> Full component inventory lands with each phase: chat primitives, agent
> state/tool use, research agents, and browser/computer-use agents.

## Development

```bash
pnpm install
pnpm --filter @agentive-ui/core test      # run core tests
pnpm --filter @agentive-ui/core build     # build core
pnpm registry:build                       # build registry JSON into apps/www/public/r
pnpm --filter @agentive-ui/www dev        # serve docs + registry at :3000
```

To test registry installs locally, start the bundled Verdaccio registry,
publish `@agentive-ui/core` to it, and point a scratch app at it (see
`CONTRIBUTING.md`).

## Comparison

|           | Agentive UI                                      | assistant-ui    | AI Elements   | CopilotKit         |
| --------- | ------------------------------------------------ | --------------- | ------------- | ------------------ |
| Model     | shadcn (registry + copy-into-project)            | npm packages    | npm packages  | npm packages       |
| Coupling  | none (props + adapters)                          | some            | AI SDK        | CopilotKit runtime |
| Ownership | full source, editable                            | library         | library       | library            |
| Focus     | agent workflows (tools, research, browser, HITL) | chat primitives | AI primitives | agent runtime      |

An honest take: if you need a chat widget quickly and don't mind a library
dependency, assistant-ui is excellent. If you want shadcn-style source
ownership and deep agent-workflow components (tool approval, research fan-out,
browser sessions), Agentive UI is the fit. AI Elements and CopilotKit target
different layers (primitive building blocks and a hosted agent runtime,
respectively).

## License

MIT
