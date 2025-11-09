import { describe, it, expect, beforeEach } from "vitest";
import { initFocusTrap } from "../../src/patterns/focus/focus-trap";

function waitForMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

describe("data-automagica11y-focus-trap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("auto-activates when the container becomes visible and restores focus on hide", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "open";
    const container = document.createElement("div");
    container.setAttribute("data-automagica11y-focus-trap", "");
    container.setAttribute("hidden", "");
    const first = document.createElement("button");
    first.textContent = "inside";
    container.append(first);
    document.body.append(trigger, container);

    trigger.focus();
    initFocusTrap(container);

    container.removeAttribute("hidden");
    await waitForMicrotasks();
    expect(document.activeElement).toBe(first);

    container.setAttribute("hidden", "");
    await waitForMicrotasks();
    expect(document.activeElement).toBe(trigger);
  });

  it("responds to automagica11y:toggle events when auto mode is off", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "open";
    const container = document.createElement("div");
    container.setAttribute("data-automagica11y-focus-trap", "");
    container.setAttribute("data-automagica11y-focus-trap-auto", "false");
    const first = document.createElement("button");
    first.textContent = "first";
    container.append(first);
    document.body.append(trigger, container);

    initFocusTrap(container);

    trigger.focus();
    const openEvent = new CustomEvent("automagica11y:toggle", {
      bubbles: true,
      detail: { target: container, expanded: true },
    });
    document.dispatchEvent(openEvent);
    await waitForMicrotasks();
    expect(document.activeElement).toBe(first);

    const closeEvent = new CustomEvent("automagica11y:toggle", {
      bubbles: true,
      detail: { target: container, expanded: false },
    });
    document.dispatchEvent(closeEvent);
    await waitForMicrotasks();
    expect(document.activeElement).toBe(trigger);
  });

  it("honors escape-dismiss attribute for declarative traps", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "open";
    const container = document.createElement("div");
    container.setAttribute("data-automagica11y-focus-trap", "");
    container.setAttribute("data-automagica11y-focus-trap-escape-dismiss", "true");
    const first = document.createElement("button");
    first.textContent = "inside";
    container.append(first);
    document.body.append(trigger, container);

    trigger.focus();
    initFocusTrap(container);

    container.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      bubbles: true,
      detail: { target: container, expanded: true },
    }));

    await waitForMicrotasks();
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitForMicrotasks();
    expect(document.activeElement).toBe(trigger);
  });
});
