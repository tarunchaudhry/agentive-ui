import { AISDKChat } from "./ai-sdk-chat"

export default function HomePage() {
  return (
    <main className="flex h-svh flex-col">
      <header className="relative flex items-center justify-between overflow-hidden border-b px-4 py-3">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-(--agentive-tool-success)/10 via-transparent to-(--agentive-approval-accent)/10"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--agentive-streaming-caret) font-mono text-sm font-bold text-(--agentive-user-bubble-fg)">
            AI
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              Agentive UI + Vercel AI SDK
            </span>
            <span className="text-xs text-muted-foreground">
              Tool lifecycle, approval queue, and reasoning stream adapter
            </span>
          </div>
        </div>
        <span className="relative hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--agentive-tool-success) opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-(--agentive-tool-success)" />
          </span>
          live transport · no API key
        </span>
      </header>
      <AISDKChat />
    </main>
  )
}
