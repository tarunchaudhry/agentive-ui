"use client"

import * as React from "react"

import { motion } from "motion/react"
import { ArrowRight, Terminal } from "lucide-react"
import Link from "next/link"

import { CopyButton } from "@/components/copy-button"

const INSTALL_CMD = "npx shadcn@latest add @agentive-ui/conversation"

/**
 * Landing hero. React choreography runs on Motion; the ambient background
 * orbs run on GSAP (independent DOM tween loop). If the user prefers reduced
 * motion, orbs stay static and text renders instantly.
 */
export function Hero() {
  const orbA = React.useRef<HTMLDivElement>(null)
  const orbB = React.useRef<HTMLDivElement>(null)
  const orbC = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let ctx: { revert: () => void } | null = null
    let cancelled = false

    async function start() {
      try {
        const { gsap } = await import("gsap")
        if (cancelled) return
        ctx = gsap.context(() => {
          const drift = (
            target: HTMLDivElement | null,
            x: number,
            y: number,
            duration: number
          ) => {
            if (!target) return
            gsap.to(target, {
              x,
              y,
              duration,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            })
          }
          drift(orbA.current, 60, -40, 9)
          drift(orbB.current, -70, 50, 11)
          drift(orbC.current, 40, 60, 13)
          gsap.to([orbA.current, orbB.current, orbC.current], {
            scale: 1.15,
            duration: 7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            stagger: 1.2,
          })
        })
      } catch {
        // GSAP unavailable: orbs remain as static gradient washes.
      }
    }

    void start()
    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <section className="relative overflow-hidden">
      {/* Ambient background: dotted grid + GSAP-driven orbs */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_35%,black,transparent)]"
      />
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div
          ref={orbA}
          className="absolute -top-24 left-[8%] size-72 rounded-full bg-(--agentive-streaming-caret) opacity-15 blur-3xl dark:opacity-25"
        />
        <div
          ref={orbB}
          className="absolute top-10 right-[6%] size-80 rounded-full bg-(--agentive-tool-success) opacity-10 blur-3xl dark:opacity-20"
        />
        <div
          ref={orbC}
          className="absolute top-56 left-[42%] size-64 rounded-full bg-(--agentive-approval-accent) opacity-10 blur-3xl dark:opacity-15"
        />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--agentive-tool-success) opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-(--agentive-tool-success)" />
          </span>
          shadcn-native · MIT · 16 components
        </motion.div>

        <h1 className="max-w-3xl text-5xl font-semibold tracking-tighter text-balance sm:text-6xl">
          {["Interfaces for agents", "that do things."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.1 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {i === 1 ? (
                  <>
                    that{" "}
                    <span className="bg-gradient-to-r from-(--agentive-streaming-caret) via-(--agentive-tool-success) to-(--agentive-approval-accent) bg-clip-text text-transparent">
                      do things.
                    </span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-xl text-lg text-pretty text-muted-foreground"
        >
          Chat, streaming, tool calls, approvals, research, and browser-use —
          as source code you own, themed with CSS variables.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/docs"
            className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform duration-300 hover:scale-[1.03] active:scale-95"
          >
            Browse components
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 py-2 pr-2 pl-4 font-mono text-xs text-muted-foreground backdrop-blur">
            <Terminal className="size-3.5" />
            {INSTALL_CMD}
            <CopyButton text={INSTALL_CMD} />
          </span>
        </motion.div>
      </div>
    </section>
  )
}
