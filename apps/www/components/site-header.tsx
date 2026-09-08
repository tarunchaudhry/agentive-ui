"use client"

import * as React from "react"

import { AnimatePresence, motion } from "motion/react"
import { Github, Moon, Sparkles, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { cn } from "@/lib/utils"

const links = [
  { href: "/docs", label: "Components" },
  { href: "/r/registry.json", label: "Registry" },
  { href: "https://github.com/tarunchaudhry/agentive-ui", label: "GitHub" },
]

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const dark = (theme === "system" ? resolvedTheme : theme) === "dark"

  // Render a layout-stable placeholder until mounted so server HTML and the
  // first client render always match (avoids hydration mismatch).
  if (!mounted) {
    return <span aria-hidden="true" className="size-9" />
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border bg-background transition-colors hover:bg-accent"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
        >
          {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-(--agentive-streaming-caret) text-(--agentive-user-bubble-fg) transition-transform duration-300 group-hover:rotate-12">
            <Sparkles className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">Agentive UI</span>
          <span className="hidden rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
            v0.1
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Github className="size-3.5" />
                  {link.label}
                </span>
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            )
          )}
          <span className="mx-1 h-4 w-px bg-border" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
