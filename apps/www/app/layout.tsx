import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Agentive UI",
  description:
    "A shadcn-based UI development kit for building AI agent interfaces.",
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
