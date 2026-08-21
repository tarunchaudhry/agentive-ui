import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Agentive UI — Mock Playground",
  description: "A no-backend chat demo driven by scripted mock event streams.",
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
