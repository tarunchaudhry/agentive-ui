import { PlaygroundChat } from "./playground-chat"

export default function HomePage() {
  return (
    <main className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Agentive UI</span>
          <span className="text-xs text-muted-foreground">
            Mock playground — scripted streams, no backend
          </span>
        </div>
      </header>
      <PlaygroundChat />
    </main>
  )
}
