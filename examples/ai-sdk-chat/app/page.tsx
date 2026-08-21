import { AISDKChat } from "./ai-sdk-chat"

export default function HomePage() {
  return (
    <main className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            Agentive UI + Vercel AI SDK
          </span>
          <span className="text-xs text-muted-foreground">
            Tool lifecycle, approval queue, and reasoning stream adapter
          </span>
        </div>
      </header>
      <AISDKChat />
    </main>
  )
}
