import Link from "next/link"

import { SpinnerDemo } from "@/components/spinner-demo"

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-24">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          @agentive-ui
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">Agentive UI</h1>
        <p className="text-lg text-muted-foreground">
          A shadcn-based UI development kit for building AI agent interfaces —
          chat, streaming, tool calls, research agents, and browser-use agents.
        </p>
        <Link
          href="/docs"
          className="text-sm font-medium text-(--agentive-citation) underline underline-offset-2"
        >
          Browse the component docs →
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Spinner</h2>
        <SpinnerDemo />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Install a component</p>
        <code className="text-muted-foreground">
          npx shadcn@latest registry add @agentive-ui=http://localhost:3000/r/
          {"{name}"}.json
        </code>
        <code className="text-muted-foreground">
          npx shadcn@latest add @agentive-ui/spinner
        </code>
        <p className="text-xs text-muted-foreground">
          Registry endpoint: <code>/r/registry.json</code>
        </p>
      </section>
    </main>
  )
}
