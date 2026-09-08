import { Hero } from "@/components/hero"
import { DocsGrid } from "@/components/docs-grid"
import { CopyButton } from "@/components/copy-button"
import { FadeUp } from "@/components/motion-primitives"

const tokenSwatches = [
  { name: "user bubble", className: "bg-(--agentive-user-bubble)" },
  { name: "assistant", className: "bg-(--agentive-assistant-bubble)" },
  { name: "caret", className: "bg-(--agentive-streaming-caret)" },
  { name: "running", className: "bg-(--agentive-tool-running)" },
  { name: "success", className: "bg-(--agentive-tool-success)" },
  { name: "error", className: "bg-(--agentive-tool-error)" },
  { name: "approval", className: "bg-(--agentive-approval-accent)" },
]

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <Hero />

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-16">
        <FadeUp>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Components
              </h2>
              <p className="mt-1 text-muted-foreground">
                Install any piece as source you own. No black boxes.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground sm:inline">
              16 components
            </span>
          </div>
        </FadeUp>
        <DocsGrid />
      </section>

      <section className="border-y bg-card/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-semibold tracking-tight">
              Themed with variables, not hex codes
            </h2>
            <p className="mt-1 text-muted-foreground">
              Every component reads the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                --agentive-*
              </code>{" "}
              layer. Redefine a variable and the whole kit follows — light and
              dark included.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="flex flex-wrap gap-2.5">
              {tokenSwatches.map((swatch) => (
                <span
                  key={swatch.name}
                  title={swatch.name}
                  className={`flex h-16 w-24 flex-col justify-end rounded-xl border p-2 ${swatch.className}`}
                >
                  <span className="rounded bg-background/70 px-1.5 py-0.5 text-[11px] backdrop-blur">
                    {swatch.name}
                  </span>
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-16">
        <FadeUp>
          <h2 className="text-2xl font-semibold tracking-tight">Install</h2>
          <p className="mt-1 text-muted-foreground">
            Register the namespace once, then add anything.
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="flex flex-col gap-2 rounded-xl border bg-card p-5 font-mono text-sm">
            {[
              "npx shadcn@latest registry add @agentive-ui=https://agentive-ui.dev/r/{name}.json",
              "npx shadcn@latest add @agentive-ui/conversation @agentive-ui/prompt-input",
            ].map((cmd) => (
              <div
                key={cmd}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"
              >
                <code className="truncate text-muted-foreground">{cmd}</code>
                <CopyButton text={cmd} className="shrink-0" />
              </div>
            ))}
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
