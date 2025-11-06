import { describe, expect, it, beforeEach, vi } from "vitest";
import { initToggle } from "../../src/patterns/toggle/toggle";

describe("toggle pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes ARIA relationships and default classes", () => {
    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-toggle="#panel"></button>
      <div id="panel">Hidden content</div>
    `;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    initToggle(trigger);

    expect(trigger.getAttribute("aria-controls")).toBe(target.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(target.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(target.hidden).toBe(true);
    expect(trigger.classList.contains("automagic-toggle-closed")).toBe(true);
  });

  it("toggles state on click and dispatches automagica11y events", () => {
    document.body.innerHTML = `
      <button data-automagica11y-toggle="#panel"></button>
      <div id="panel">Hidden content</div>
    `;

    const trigger = document.querySelector("[data-automagica11y-toggle]") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    const listener = vi.fn();
    trigger.addEventListener("automagica11y:toggle", listener);

    initToggle(trigger);

    trigger.click();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(target.hidden).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    const eventDetail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(eventDetail.expanded).toBe(true);
    expect(eventDetail.trigger).toBe(trigger);
    expect(eventDetail.target).toBe(target);
  });

  it("adds button semantics for non-button triggers", () => {
    document.body.innerHTML = `
      <div id="toggle" data-automagica11y-toggle="#panel"></div>
      <div id="panel">Hidden content</div>
    `;

    const trigger = document.getElementById("toggle") as HTMLElement;

    initToggle(trigger);

    expect(trigger.getAttribute("role")).toBe("button");
    expect(trigger.getAttribute("tabindex")).toBe("0");
    expect((trigger as HTMLElement).style.cursor).toBe("pointer");
  });
});
