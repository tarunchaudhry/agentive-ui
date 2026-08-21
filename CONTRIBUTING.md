# Contributing

## Prerequisites

- Node.js >= 20
- pnpm 10

## Setup

```bash
pnpm install
```

## Workspaces

- `packages/core` — `@agentive-ui/core`, the headless npm package.
- `registry/` — component sources + `registry.json` (registry manifest).
- `apps/www` — Next.js docs site; also serves the built registry.
- `examples/` — adapter and playground demos.

## Common tasks

```bash
pnpm typecheck                        # typecheck all packages
pnpm lint                             # lint all packages
pnpm test                             # run all tests (Vitest)
pnpm format                           # prettier
pnpm --filter @agentive-ui/core build # build core
pnpm registry:build                   # build registry JSON into apps/www/public/r
pnpm --filter @agentive-ui/www dev    # serve docs + registry at :3000
```

## Testing registry installs locally

Because `@agentive-ui/core` is not published to the public npm registry during
development, installs that reference it need a local registry. We use Verdaccio.

1. Start the local registry (port 4873):

   ```bash
   pnpm dev:registry
   ```

2. Build and publish `@agentive-ui/core` to it:

   ```bash
   pnpm publish:local
   ```

3. Start the docs app, which serves the registry JSON:

   ```bash
   pnpm --filter @agentive-ui/www dev
   ```

4. In a scratch app, point npm at Verdaccio and install:

   ```bash
   printf 'registry=http://localhost:4873/\n' > .npmrc
   npx shadcn@latest registry add @agentive-ui=http://localhost:3000/r/{name}.json
   npx shadcn@latest add @agentive-ui/spinner
   ```

Verdaccio proxies the public npm registry for everything except
`@agentive-ui/*`, so all other dependencies resolve normally.

## Adding a component

See `registry/AGENTS.md` for the component conventions and registry wiring.
Commit per component with a conventional commit
(`feat(spinner): add token-driven spinner`).

## Release

`@agentive-ui/core` is versioned with [changesets](https://github.com/changesets/changesets).
Create a changeset with `pnpm changeset`, and the publish workflow (gated on
green CI) will version and publish.
