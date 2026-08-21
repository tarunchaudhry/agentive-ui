import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/mock/index.ts", "src/adapters/sse.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  outDir: "dist",
})
