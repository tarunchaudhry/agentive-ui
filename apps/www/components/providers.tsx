"use client"

import * as React from "react"

import { ThemeProvider } from "next-themes"
import { MotionConfig } from "motion/react"

/**
 * App-wide providers. Motion respects the OS reduced-motion setting globally;
 * CSS keyframe animations pair with `motion-reduce:` variants for the same.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  )
}
