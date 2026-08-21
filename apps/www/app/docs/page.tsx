import Link from "next/link"

import { docs } from "@/lib/docs"

export default function DocsIndexPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-muted-foreground">
          Chat primitives for building AI agent interfaces. Each component is
          installed as source you own via{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            npx shadcn add @agentive-ui/&lt;name&gt;
          </code>
          .
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={`/docs/${doc.slug}`}
              className="flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:border-foreground"
            >
              <span className="font-medium">{doc.title}</span>
              <span className="text-sm text-muted-foreground">
                {doc.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
