import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Agentive UI — Vercel AI SDK Integration",
  description:
    "End-to-end AI SDK adapter demo showcasing tool approvals and streaming agent lifecycle states.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
