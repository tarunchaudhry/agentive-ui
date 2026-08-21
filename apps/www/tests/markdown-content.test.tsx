import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MarkdownContent } from "@/registry/agentive-ui/markdown-content"

describe("MarkdownContent", () => {
  it("renders inline code without throwing", () => {
    const { container } = render(
      <MarkdownContent>use `cn()` here</MarkdownContent>
    )
    expect(container.querySelector("code")).toBeTruthy()
  })

  it("survives incomplete markdown (unclosed code fence)", () => {
    const { container } = render(
      <MarkdownContent>{"# Title\n\n```ts\nconst x = 1"}</MarkdownContent>
    )
    // Should render without crashing; the unclosed fence becomes a code block.
    expect(container.textContent).toContain("const x = 1")
  })

  it("renders a table", () => {
    const { container } = render(
      <MarkdownContent>{"| a | b |\n|---|---|\n| 1 | 2 |"}</MarkdownContent>
    )
    expect(container.querySelector("table")).toBeTruthy()
  })

  it("renders links with the citation token styling", () => {
    const { container } = render(
      <MarkdownContent>{"see [example](https://example.com)"}</MarkdownContent>
    )
    const link = container.querySelector("a")
    expect(link).toHaveAttribute("href", "https://example.com")
    expect(link).toHaveAttribute("target", "_blank")
  })
})
