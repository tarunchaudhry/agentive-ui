# AGENTS.md — Agentive UI

Monorepo for a shadcn-based AI agent UI kit. Brand rule: never abbreviate to
"AGUI"/"AG-UI" — use "Agentive UI" or the `agentive` prefix.

## Layout

- `packages/core/` — `@agentive-ui/core`: headless types, hooks
  (`useAgentStream`, `useAutoScroll`, `useToolApprovals`), SSE/NDJSON parsers,
  adapters (`/sse`, `/ai-sdk`), mock streams (`/mock`).
- `registry/agentive-ui/` — component sources (one component per file, <300 lines).
- `registry/registry.json` — shadcn registry manifest; see `registry/AGENTS.md`
  for component conventions and wiring.
- `apps/www/` — docs site; serves built registry at `/r/{name}.json`.
- `examples/mock-playground/`, `examples/ai-sdk-chat/` — runnable demos.

## Commands

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
pnpm --filter @agentive-ui/core build
pnpm registry:build        # rebuild apps/www/public/r/*.json
pnpm --filter @agentive-ui/www dev   # docs + registry at :3000
```

## Conventions

- TypeScript strict, no `any` in public APIs; discriminated unions for parts/events.
- Tailwind v4 + CSS variables only; no inline hex colors; `cn()` for merging.
- `aria-live="polite"` on streaming regions; `prefers-reduced-motion` respected.
- Commit per component with conventional commits.
