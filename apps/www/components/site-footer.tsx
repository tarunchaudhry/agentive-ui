import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-foreground">Agentive UI</span> ·
          MIT · shadcn-native agent interfaces
        </p>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Components
          </Link>
          <Link
            href="/r/registry.json"
            className="transition-colors hover:text-foreground"
          >
            Registry
          </Link>
          <a
            href="https://github.com/tarunchaudhry/agentive-ui"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
