import { expect, test } from "bun:test"
import { ServerConnection } from "@/context/server"
import { createPromptState, selectPromptTab } from "@/context/prompt"
import type { Tab } from "@/context/tabs"

test("selects the explicitly scoped session tab instead of the active tab", () => {
  const server = ServerConnection.Key.make("local")
  const tabs: Tab[] = [
    { type: "session", server, sessionId: "A" },
    { type: "session", server, sessionId: "B" },
  ]

  expect(selectPromptTab(tabs, { dir: "repo", id: "B" }, server)).toBe(tabs[1])
})

test("keeps selection and scroll outside the persisted prompt value", () => {
  const prompt = createPromptState()

  prompt.view.selection = { anchor: 8, focus: 3 }
  prompt.view.scrollTop = 42

  expect(prompt.view.selection).toEqual({ anchor: 8, focus: 3 })
  expect(prompt.view.scrollTop).toBe(42)
  expect(prompt.current()).toEqual([{ type: "text", content: "", start: 0, end: 0 }])
})
