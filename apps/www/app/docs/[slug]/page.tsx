import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { FadeUp } from "@/components/motion-primitives"
import { docs, getDoc } from "@/lib/docs"

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = getDoc(slug)
  return { title: doc ? `${doc.title} — Agentive UI` : "Not found" }
}

export default async function ComponentDocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()

  const index = docs.findIndex((d) => d.slug === slug)
  const prev = index > 0 ? docs[index - 1] : undefined
  const next = index < docs.length - 1 ? docs[index + 1] : undefined
  const { Demo } = doc
  const installCmd = `npx shadcn@latest add @agentive-ui/${doc.slug}`

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <FadeUp>
        <div className="flex flex-col gap-3">
          <Link
            href="/docs"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Components
          </Link>
          <h1 className="text-4xl font-semibold tracking-tighter">
            {doc.title}
          </h1>
          <p className="text-lg text-muted-foreground">{doc.description}</p>
        </div>
      </FadeUp>

      <FadeUp>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Preview
          </h2>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-(--agentive-tool-error)/70" />
              <span className="size-2.5 rounded-full bg-(--agentive-approval-accent)/70" />
              <span className="size-2.5 rounded-full bg-(--agentive-tool-success)/70" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                @agentive-ui/{doc.slug}
              </span>
            </div>
            <div className="p-4 sm:p-6">
              <Demo />
            </div>
          </div>
        </section>
      </FadeUp>

      <FadeUp>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Install
          </h2>
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <pre className="overflow-x-auto text-sm">
              <code>{installCmd}</code>
            </pre>
            <CopyButton text={installCmd} />
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {doc.dependencies.length > 0 ? (
              <p>
                Installs npm deps:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {doc.dependencies.join(", ")}
                </code>
              </p>
            ) : null}
            {doc.registryDependencies.length > 0 ? (
              <p>
                Composes:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {doc.registryDependencies
                    .map((d) => `@agentive-ui/${d}`)
                    .join(", ")}
                </code>
              </p>
            ) : null}
          </div>
        </section>
      </FadeUp>

      <FadeUp>
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Source
            </h2>
            <p className="text-sm text-muted-foreground">
              Copied into your project on install:
            </p>
            <code className="font-mono text-xs">{doc.source}</code>
          </section>
          <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Accessibility
            </h2>
            <p className="text-sm text-muted-foreground">{doc.a11y}</p>
          </section>
        </div>
      </FadeUp>

      <nav className="grid gap-3 border-t pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex items-center gap-2 rounded-xl border p-4 transition-colors hover:border-foreground/30"
          >
            <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            <span>
              <span className="block text-xs text-muted-foreground">
                Previous
              </span>
              <span className="font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex items-center justify-end gap-2 rounded-xl border p-4 text-right transition-colors hover:border-foreground/30"
          >
            <span>
              <span className="block text-xs text-muted-foreground">Next</span>
              <span className="font-medium">{next.title}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </nav>
    </main>
  )
}
