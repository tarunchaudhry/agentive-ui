import type { ComponentType } from "react"

import {
  AgentStatusDemo,
  ConversationDemo,
  ErrorStateDemo,
  LoadersDemo,
  MarkdownDemo,
  MessageDemo,
  PromptInputDemo,
  ReasoningDemo,
  SpinnerDemo,
  StreamingTextDemo,
  TaskTimelineDemo,
  ToolApprovalDemo,
  ToolCallDemo,
  UsageMeterDemo,
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
    registryDependencies: [
      "markdown-content",
      "typing-dots",
      "reasoning",
      "tool-call",
      "error-state",
    ],
    source: "registry/agentive-ui/message.tsx",
    Demo: MessageDemo,
    a11y: "Action buttons are labelled; the streaming caret is aria-hidden so it is not read by screen readers.",
  },
  {
    slug: "reasoning",
    title: "Reasoning",
    description:
      "Collapsible thinking panel with duration metrics. Auto-opens while reasoning is streaming and auto-collapses on finish.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/reasoning.tsx",
    Demo: ReasoningDemo,
    a11y: "Toggle button exposes `aria-expanded` and keyboard navigation.",
  },
  {
    slug: "task-timeline",
    title: "Task Timeline",
    description:
      "Ordered agent plan and step execution tracker with status indicators and collapsible detail rows.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/task-timeline.tsx",
    Demo: TaskTimelineDemo,
    a11y: "Step list uses clear semantic status indicators.",
  },
  {
    slug: "tool-call",
    title: "Tool Call",
    description:
      "Interactive card showing tool name, lifecycle badge, formatted input arguments, collapsible output JSON, and retry slot.",
    dependencies: ["@agentive-ui/core", "lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/tool-call.tsx",
    Demo: ToolCallDemo,
    a11y: "Expandable outputs and action retry buttons are accessible via keyboard.",
  },
  {
    slug: "tool-approval",
    title: "Tool Approval",
    description:
      "Human-in-the-loop approval card for sensitive actions with Approve / Deny and parameter editing controls.",
    dependencies: ["@agentive-ui/core", "lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/tool-approval.tsx",
    Demo: ToolApprovalDemo,
    a11y: 'Announced with `role="alert"` to alert assistive technology to pending approval interruptions.',
  },
  {
    slug: "agent-status",
    title: "Agent Status",
    description:
      "Compact live agent status line with animated spinner icon and elapsed execution timer.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/agent-status.tsx",
    Demo: AgentStatusDemo,
    a11y: 'Exposed as `role="status"` with `aria-live="polite"`.',
  },
  {
    slug: "usage-meter",
    title: "Usage Meter",
    description:
      "Context window token capacity and estimated cost monitor with dynamic warning and danger thresholds.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/usage-meter.tsx",
    Demo: UsageMeterDemo,
    a11y: 'Includes accessible `role="progressbar"` with min, max, and now attributes.',
  },
  {
    slug: "error-state",
    title: "Error State",
    description:
      "Inline recoverable error block with error codes and retry action.",
    dependencies: ["lucide-react"],
    registryDependencies: ["theme"],
    source: "registry/agentive-ui/error-state.tsx",
    Demo: ErrorStateDemo,
    a11y: 'Uses `role="alert"` with accessible action buttons.',
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
