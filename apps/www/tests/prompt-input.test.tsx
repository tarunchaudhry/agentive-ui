import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PromptInput } from "@/registry/agentive-ui/prompt-input"

describe("PromptInput", () => {
  it("submits on Enter and clears the textarea", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)

    await user.type(screen.getByRole("textbox"), "hello world{Enter}")

    expect(onSubmit).toHaveBeenCalledWith("hello world", [])
    expect(screen.getByRole("textbox")).toHaveValue("")
  })

  it("does not submit on Shift+Enter", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)

    await user.type(screen.getByRole("textbox"), "hello{Shift>}{Enter}{/Shift}")

    expect(onSubmit).not.toHaveBeenCalled()
    const value = (screen.getByRole("textbox") as HTMLTextAreaElement).value
    expect(value).toContain("hello")
  })

  it("shows a stop button instead of send while generating", () => {
    const onStop = vi.fn()
    render(<PromptInput value="hello" isGenerating onStop={onStop} />)

    expect(
      screen.getByRole("button", { name: "Stop generating" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Send message" })
    ).not.toBeInTheDocument()
  })

  it("disables the send button when the input is empty", () => {
    render(<PromptInput />)
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
  })
})
