# AGENTS.md — Extending the Agentive UI registry

Guidelines for AI coding agents (Claude Code, Cursor, v0) extending this kit.
Follow these conventions so new components are consistent, installable, and
themeable. When in doubt, match the existing pattern in `registry/agentive-ui/`.

## Naming

- The brand is **Agentive UI**. Scope: `@agentive-ui`. Core package:
  `@agentive-ui/core`.
- **Never** abbreviate to "AGUI" / "AG-UI" (an unrelated CopilotKit protocol).
  Use `Agentive UI` in prose and the `agentive` prefix in code/tokens.
- Match shadcn's ecosystem naming where it exists: `Message`, `MessageContent`,
  `MessageAvatar`, `PromptInput`, `Spinner`, etc. Do not invent synonyms.

## Component conventions

- One component per file under `registry/agentive-ui/<name>.tsx`.
- Every component: forwards `className`, forwards refs where relevant, uses
  `cn()` for class merging, `cva` for variants, and **no inline hex colors**.
- All colors/motion come from CSS variables: reference the `--agentive-*`
  token layer plus shadcn base tokens. In Tailwind v4, use the `(--var)`
  syntax, e.g. `bg-(--agentive-assistant-bubble)`.
- Compound components are preferred over mega-prop monoliths:
  `<Message><Message.Avatar /></Message>`.
- Keep files under ~300 lines. Split before they grow.
- Streaming regions: `aria-live="polite"` (announce on settle). Tool approval
  flows must be keyboard-operable. Respect `prefers-reduced-motion`
  (`motion-reduce:` variants) for all loaders/shimmer.
- Exported prop types on every component. Discriminated unions for parts/events.
  No `any` in public APIs.

## Registry wiring

Add every component to `registry/registry.json` with:

```json
{
  "name": "my-component",
  "type": "registry:component",
  "title": "My Component",
  "description": "One or two sentences. LLMs read this — be precise.",
  "registryDependencies": ["@agentive-ui/theme", "button", "card"],
  "dependencies": ["@agentive-ui/core"],
  "files": [
    {
      "path": "registry/agentive-ui/my-component.tsx",
      "type": "registry:component",
      "target": "@components/agentive/my-component.tsx"
    }
  ]
}
```

- `registryDependencies` uses **bare names** for shadcn primitives (`button`,
  `card`, `dialog`) and `@agentive-ui/<name>` for our own items.
- `dependencies` lists npm packages. `@agentive-ui/core` is the only versioned
  dependency a component should ever require beyond shadcn's allowed set
  (radix primitives, `cva`, `clsx`/`tailwind-merge`, `lucide-react`, markdown).
- `target` uses the `@components/agentive/<name>.tsx` placeholder so files
  install into the consumer's configured `components/` directory.
- Component source imports `cn` from `@/lib/utils` and other components from
  `@/components/agentive/<name>` — the shadcn CLI rewrites these on install.
- Ship a demo file alongside (`registry/agentive-ui/<name>-demo.tsx`) driven by
  mock streams from `@agentive-ui/core/mock` — never a live API key.

## Theming

- Components reference **only** `--agentive-*` tokens plus shadcn base tokens.
- Defaults live in the `theme` item's `cssVars` (in `registry/registry.json`).
  New tokens: add to `theme` (light + dark) and to `apps/www/app/globals.css`.
- Consuming projects override by redefining variables — never by editing
  component internals.

## Verification

1. `pnpm registry:build` — builds `apps/www/public/r/`.
2. `pnpm --filter @agentive-ui/core build` — builds the core package.
3. `pnpm --filter @agentive-ui/core test` — run parser/reducer tests.
4. Test install in a scratch app:
   `npx shadcn@latest registry add @agentive-ui=<url>/r/{name}.json`
   then `npx shadcn@latest add @agentive-ui/<component>`.
5. `pnpm typecheck && pnpm lint && pnpm test` must stay green.

## Commits

Conventional commits, one per component: `feat(spinner): add token-driven spinner`.
