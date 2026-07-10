import { describe, expect, test } from "bun:test"
import {
  createTextFragment,
  getCursorPosition,
  getEditorSelection,
  getNodeLength,
  getTextLength,
  setCursorPosition,
  setEditorSelection,
} from "./editor-dom"

describe("prompt-input editor dom", () => {
  test("createTextFragment preserves newlines with consecutive br nodes", () => {
    const fragment = createTextFragment("foo\n\nbar")
    const container = document.createElement("div")
    container.appendChild(fragment)

    expect(container.childNodes.length).toBe(4)
    expect(container.childNodes[0]?.textContent).toBe("foo")
    expect((container.childNodes[1] as HTMLElement).tagName).toBe("BR")
    expect((container.childNodes[2] as HTMLElement).tagName).toBe("BR")
    expect(container.childNodes[3]?.textContent).toBe("bar")
  })

  test("createTextFragment keeps trailing newline as terminal break", () => {
    const fragment = createTextFragment("foo\n")
    const container = document.createElement("div")
    container.appendChild(fragment)

    expect(container.childNodes.length).toBe(2)
    expect(container.childNodes[0]?.textContent).toBe("foo")
    expect((container.childNodes[1] as HTMLElement).tagName).toBe("BR")
  })

  test("createTextFragment avoids break-node explosion for large multiline content", () => {
    const content = Array.from({ length: 220 }, () => "line").join("\n")
    const fragment = createTextFragment(content)
    const container = document.createElement("div")
    container.appendChild(fragment)

    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE)
    expect(container.textContent).toBe(content)
  })

  test("createTextFragment keeps terminal break in large multiline fallback", () => {
    const content = `${Array.from({ length: 220 }, () => "line").join("\n")}\n`
    const fragment = createTextFragment(content)
    const container = document.createElement("div")
    container.appendChild(fragment)

    expect(container.childNodes.length).toBe(2)
    expect(container.childNodes[0]?.textContent).toBe(content.slice(0, -1))
    expect((container.childNodes[1] as HTMLElement).tagName).toBe("BR")
  })

  test("length helpers treat breaks as one char and ignore zero-width chars", () => {
    const container = document.createElement("div")
    container.appendChild(document.createTextNode("ab\u200B"))
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createTextNode("cd"))

    expect(getNodeLength(container.childNodes[0]!)).toBe(2)
    expect(getNodeLength(container.childNodes[1]!)).toBe(1)
    expect(getTextLength(container)).toBe(5)
  })

  test("setCursorPosition and getCursorPosition round-trip with pills and breaks", () => {
    const container = document.createElement("div")
    const pill = document.createElement("span")
    pill.dataset.type = "file"
    pill.textContent = "@file"
    container.appendChild(document.createTextNode("ab"))
    container.appendChild(pill)
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createTextNode("cd"))
    document.body.appendChild(container)

    setCursorPosition(container, 2)
    expect(getCursorPosition(container)).toBe(2)

    setCursorPosition(container, 7)
    expect(getCursorPosition(container)).toBe(7)

    setCursorPosition(container, 8)
    expect(getCursorPosition(container)).toBe(8)

    container.remove()
  })

  test("setCursorPosition and getCursorPosition round-trip across blank lines", () => {
    const container = document.createElement("div")
    container.appendChild(document.createTextNode("a"))
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createTextNode("b"))
    document.body.appendChild(container)

    setCursorPosition(container, 2)
    expect(getCursorPosition(container)).toBe(2)

    setCursorPosition(container, 3)
    expect(getCursorPosition(container)).toBe(3)

    container.remove()
  })

  test("captures and restores collapsed and forward selections", () => {
    const container = document.createElement("div")
    container.textContent = "abcdef"
    document.body.appendChild(container)

    setEditorSelection(container, { anchor: 3, focus: 3 })
    expect(getEditorSelection(container)).toEqual({ anchor: 3, focus: 3 })

    setEditorSelection(container, { anchor: 1, focus: 5 })
    expect(getEditorSelection(container)).toEqual({ anchor: 1, focus: 5 })

    container.remove()
  })

  test("preserves backward selection direction", () => {
    const container = document.createElement("div")
    container.textContent = "abcdef"
    document.body.appendChild(container)

    setEditorSelection(container, { anchor: 5, focus: 1 })

    expect(getEditorSelection(container)).toEqual({ anchor: 5, focus: 1 })
    container.remove()
  })

  test("restores selection across breaks and blank lines", () => {
    const container = document.createElement("div")
    container.appendChild(document.createTextNode("ab"))
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createElement("br"))
    container.appendChild(document.createTextNode("cd"))
    document.body.appendChild(container)

    setEditorSelection(container, { anchor: 1, focus: 5 })

    expect(getEditorSelection(container)).toEqual({ anchor: 1, focus: 5 })
    container.remove()
  })

  test("restores selection at pill boundaries", () => {
    const container = document.createElement("div")
    const pill = document.createElement("span")
    pill.dataset.type = "file"
    pill.textContent = "@file"
    container.appendChild(document.createTextNode("ab"))
    container.appendChild(pill)
    container.appendChild(document.createTextNode("cd"))
    document.body.appendChild(container)

    setEditorSelection(container, { anchor: 2, focus: 7 })

    expect(getEditorSelection(container)).toEqual({ anchor: 2, focus: 7 })
    container.remove()
  })

  test("clamps selection offsets to the editor bounds", () => {
    const container = document.createElement("div")
    container.textContent = "abc"
    document.body.appendChild(container)

    setEditorSelection(container, { anchor: -10, focus: 20 })

    expect(getEditorSelection(container)).toEqual({ anchor: 0, focus: 3 })
    container.remove()
  })

  test("does not capture a selection with an endpoint outside the editor", () => {
    const container = document.createElement("div")
    const outside = document.createElement("div")
    container.textContent = "inside"
    outside.textContent = "outside"
    document.body.append(container, outside)
    const selection = window.getSelection()!

    selection.setBaseAndExtent(container.firstChild!, 1, outside.firstChild!, 2)

    expect(getEditorSelection(container)).toBeUndefined()
    container.remove()
    outside.remove()
  })
})
