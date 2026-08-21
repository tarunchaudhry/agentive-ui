import type { ComponentType } from "react"

import {
  ConversationDemo,
  LoadersDemo,
  MarkdownDemo,
  MessageDemo,
  PromptInputDemo,
  SpinnerDemo,
  StreamingTextDemo,
} from "@/components/demos"

export interface ComponentDoc {
  slug: string
  title: string
  description: string
  /** npm dependencies the component installs. */
  dependencies: string[]
  /** shadcn primitives / registry items the component composes. */
  registryDependencies: string[]
  source: string
  Demo: ComponentType
  a11y: string
}

export const docs: ComponentDoc[] = [
  {
    slug: "conversation",
    title: "Conversation",
    description:
      "The chat transcript scroll container. Sticks to the bottom while streaming, preserves position when history loads, and offers a jump-to-latest pill.",
    dependencies: ["@agentive-ui/core", "lucide-react"],
    registryDependencies: ["message"],
    source: "registry/agentive-ui/conversation.tsx",
    Demo: ConversationDemo,
    a11y: 'The viewport is a polite live region (`role="log"`, `aria-relevant="additions"`) and marks `aria-busy` while streaming so tokens are not announced individually.',
  },
  {
    slug: "message",
    title: "Message",
    description:
      "A chat message with compound Avatar, Content, Actions, and Timestamp slots. Renders a typed MessagePart array.",
    dependencies: ["@agentive-ui/core", "lucide-react"],
    registryDependencies: ["markdown-content", "typing-dots"],
    source: "registry/agentive-ui/message.tsx",
    Demo: MessageDemo,
    a11y: "Action buttons are labelled; the streaming caret is aria-hidden so it is not read by screen readers.",
  },
  {
    slug: "markdown-content",
    title: "Markdown Content",
    description:
      "Streaming-safe GFM markdown renderer with syntax-highlighted code blocks, tables, and optional math.",
    dependencies: ["react-markdown", "remark-gfm", "shiki", "lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/markdown-content.tsx",
    Demo: MarkdownDemo,
    a11y: 'Code blocks expose a labelled copy button; links open in a new tab with `rel="noopener noreferrer"`.',
  },
  {
    slug: "streaming-text",
    title: "Streaming Text",
    description:
      "Plain-text token rendering with an optional blinking caret, a faster alternative to markdown while streaming.",
    dependencies: [],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/streaming-text.tsx",
    Demo: StreamingTextDemo,
    a11y: "The caret is `aria-hidden`; reduced-motion is respected via `motion-reduce:`.",
  },
  {
    slug: "prompt-input",
    title: "Prompt Input",
    description:
      "Auto-growing composer with Enter-to-send, a stop-generation button, and attachment chips.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/prompt-input.tsx",
    Demo: PromptInputDemo,
    a11y: "The textarea is labelled, the send/stop actions are real buttons with aria-labels, and Enter/Shift+Enter are handled explicitly.",
  },
  {
    slug: "spinner",
    title: "Spinner",
    description:
      "A token-driven loading spinner whose ring color follows --agentive-streaming-caret.",
    dependencies: [],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/spinner.tsx",
    Demo: SpinnerDemo,
    a11y: 'Rendered with `role="status"` and a screen-reader-only label.',
  },
  {
    slug: "typing-dots",
    title: "Typing Dots",
    description: "An animated 'agent is typing' indicator with staggered dots.",
    dependencies: [],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/typing-dots.tsx",
    Demo: LoadersDemo,
    a11y: 'Rendered with `role="status"` and a screen-reader-only label.',
  },
  {
    slug: "shimmer",
    title: "Shimmer",
    description: "A skeleton placeholder with a sweeping gradient.",
    dependencies: [],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/shimmer.tsx",
    Demo: LoadersDemo,
    a11y: 'Decorative (`aria-hidden`); pair with text or `role="status"` for screen readers.',
  },
]

export function getDoc(slug: string): ComponentDoc | undefined {
  return docs.find((d) => d.slug === slug)
}
