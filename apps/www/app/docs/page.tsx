import { DocsGrid } from "@/components/docs-grid"
import { FadeUp } from "@/components/motion-primitives"

export default function DocsIndexPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <FadeUp>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tighter">Components</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Chat primitives, agent state, and tool-use building blocks. Each
            component installs as source you own via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              npx shadcn add @agentive-ui/&lt;name&gt;
            </code>
            .
          </p>
        </div>
      </FadeUp>
      <DocsGrid />
    </main>
  )
}
