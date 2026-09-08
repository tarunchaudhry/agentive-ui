"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { docs } from "@/lib/docs"
import { staggerChild, staggerParent } from "@/components/motion-primitives"

export function DocsGrid() {
  return (
    <motion.ul
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-64px" }}
      className="grid gap-3 sm:grid-cols-2"
    >
      {docs.map((doc) => (
        <motion.li key={doc.slug} variants={staggerChild}>
          <Link
            href={`/docs/${doc.slug}`}
            className="group flex h-full flex-col gap-1.5 rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium">{doc.title}</span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </span>
            <span className="text-sm text-muted-foreground">
              {doc.description}
            </span>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  )
}
