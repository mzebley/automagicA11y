import { describe, it, expect, beforeEach } from "vitest";
import { enableFocusTrap } from "@core/focus-trap";

describe("enableFocusTrap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the first tabbable and cycles within the container", async () => {
    const invoker = document.createElement("button");
    invoker.textContent = "open";
    const container = document.createElement("div");
    const first = document.createElement("button");
    first.textContent = "first";
    const second = document.createElement("button");
    second.textContent = "second";
    container.append(first, second);
    document.body.append(invoker, container);

    invoker.focus();
    const dispose = enableFocusTrap(container);

    await Promise.resolve();
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(second);

    second.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(second);

    dispose();
    expect(document.activeElement).toBe(invoker);
  });

  it("focuses the container when no tabbables exist", async () => {
    const invoker = document.createElement("button");
    const container = document.createElement("div");
    document.body.append(invoker, container);

    invoker.focus();
    const dispose = enableFocusTrap(container);

    await Promise.resolve();
    expect(document.activeElement).toBe(container);

    container.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(container);

    dispose();
    expect(document.activeElement).toBe(invoker);
  });

  it("skips tabbables that become disabled while tabbing", async () => {
    const container = document.createElement("div");
    const first = document.createElement("button");
    first.textContent = "first";
    const second = document.createElement("button");
    second.textContent = "second";
    const third = document.createElement("button");
    third.textContent = "third";
    container.append(first, second, third);
    document.body.append(container);

    const dispose = enableFocusTrap(container);
    await Promise.resolve();
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(second);

    second.disabled = true;
    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(third);

    dispose();
  });

  it("resumes the parent trap after a nested trap releases", async () => {
    const parent = document.createElement("div");
    const parentFirst = document.createElement("button");
    parentFirst.textContent = "parent first";
    const parentLast = document.createElement("button");
    parentLast.textContent = "parent last";
    const child = document.createElement("div");
    const childFirst = document.createElement("button");
    childFirst.textContent = "child first";
    const childLast = document.createElement("button");
    childLast.textContent = "child last";
    child.append(childFirst, childLast);
    parent.append(parentFirst, child, parentLast);
    document.body.append(parent);

    const disposeParent = enableFocusTrap(parent);
    await Promise.resolve();
    expect(document.activeElement).toBe(parentFirst);

    const disposeChild = enableFocusTrap(child);
    await Promise.resolve();
    expect(document.activeElement).toBe(childFirst);

    childFirst.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(childLast);

    disposeChild();
    await Promise.resolve();

    childLast.focus();
    childLast.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(parentLast);

    parentLast.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(parentFirst);

    disposeParent();
  });

  it("releases when Escape is pressed if escapeDismiss is true", async () => {
    const invoker = document.createElement("button");
    const container = document.createElement("div");
    const child = document.createElement("button");
    container.append(child);
    document.body.append(invoker, container);

    invoker.focus();
    const dispose = enableFocusTrap(container, { escapeDismiss: true });
    await Promise.resolve();
    expect(document.activeElement).toBe(child);

    child.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.activeElement).toBe(invoker);

    dispose();
  });

  it("releases gracefully when the container is removed", async () => {
    const invoker = document.createElement("button");
    const container = document.createElement("div");
    const child = document.createElement("button");
    container.append(child);
    document.body.append(invoker, container);

    invoker.focus();
    const dispose = enableFocusTrap(container);
    await Promise.resolve();
    expect(document.activeElement).toBe(child);

    container.remove();
    await Promise.resolve();

    expect(document.activeElement).toBe(invoker);

    dispose();
  });
});
