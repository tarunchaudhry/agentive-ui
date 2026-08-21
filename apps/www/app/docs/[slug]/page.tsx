import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

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

  const { Demo } = doc

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Components
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="text-muted-foreground">{doc.description}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Preview</h2>
        <Demo />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Install</h2>
        <pre className="overflow-x-auto rounded-lg bg-card p-4 text-sm">
          <code>npx shadcn@latest add @agentive-ui/{doc.slug}</code>
        </pre>
        {doc.dependencies.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Installs npm deps: <code>{doc.dependencies.join(", ")}</code>
          </p>
        ) : null}
        {doc.registryDependencies.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Composes:{" "}
            <code>
              {doc.registryDependencies
                .map((d) => `@agentive-ui/${d}`)
                .join(", ")}
            </code>
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Source</h2>
        <p className="text-sm text-muted-foreground">
          Source is copied into your project on install:{" "}
          <code>{doc.source}</code>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Accessibility</h2>
        <p className="text-sm text-muted-foreground">{doc.a11y}</p>
      </section>
    </main>
  )
}
