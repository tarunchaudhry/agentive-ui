import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    globals: false,
  },
  resolve: {
    alias: {
      "@/registry": path.resolve(__dirname, "../../registry"),
      "@": path.resolve(__dirname, "."),
    },
  },
})
