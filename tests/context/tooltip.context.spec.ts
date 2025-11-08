import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { initToggle } from "../../src/patterns/toggle/toggle";

const baseTemplate = `
  <button id="trigger" data-automagica11y-toggle="#tip" data-automagica11y-context="tooltip">
    Hover me
  </button>
  <div id="tip" hidden>Tooltip text</div>
`;

function pointer(type: string, pointerType = "mouse") {
  const event = new Event(type, { bubbles: true, cancelable: true });
  try {
    Object.defineProperty(event, "pointerType", { value: pointerType });
  } catch {
    // noop for environments that freeze event properties
  }
  return event as PointerEvent;
}

describe("tooltip context", () => {
  beforeEach(() => {
    document.body.innerHTML = baseTemplate;
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds tooltip semantics and aria relationships", () => {
    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    initToggle(trigger);

    const describedby = trigger.getAttribute("aria-describedby") ?? "";
    expect(describedby.split(/\s+/)).toContain(tooltip.id);
    expect(tooltip.getAttribute("role")).toBe("tooltip");
    expect(tooltip.hidden).toBe(true);
  });

  it("shows on focus/pointer and hides with delays and Escape", () => {
    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    vi.useFakeTimers();
    initToggle(trigger);

    trigger.dispatchEvent(new Event("focus"));
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(100);
    expect(tooltip.hidden).toBe(true);

    trigger.dispatchEvent(pointer("pointerenter"));
    vi.advanceTimersByTime(0);
    expect(tooltip.hidden).toBe(false);
    trigger.dispatchEvent(pointer("pointerleave"));
    vi.advanceTimersByTime(100);
    expect(tooltip.hidden).toBe(true);

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(tooltip.hidden).toBe(true);
    vi.useRealTimers();
  });

  it("honors semantics-only mode by skipping interactive show/hide", () => {
    const trigger = document.getElementById("trigger") as HTMLElement;
    trigger.setAttribute("data-automagica11y-context-mode", "semantics-only");
    const tooltip = document.getElementById("tip") as HTMLElement;

    initToggle(trigger);
    trigger.dispatchEvent(new Event("focus"));

    expect(tooltip.hidden).toBe(true);
  });
});
