import { describe, expect, it, beforeEach, vi } from "vitest";
import { initTooltip } from "../../src/patterns/tooltip/tooltip";

const triggerTemplate = `
  <button id="trigger" data-automagica11y-tooltip="#tip">Hover me</button>
  <div id="tip">Tooltip text</div>
`;

describe("tooltip pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes tooltip semantics and aria relationships", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    const ready = vi.fn();
    const legacyReady = vi.fn();
    trigger.addEventListener("automagica11y:tooltip:ready", ready);
    trigger.addEventListener("automagica11y:ready", legacyReady);

    initTooltip(trigger);

    expect(trigger.getAttribute("aria-describedby")?.split(/\s+/).includes(tooltip.id)).toBe(true);
    expect(tooltip.getAttribute("role")).toBe("tooltip");
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");
    expect(tooltip.hidden).toBe(true);
    expect(ready).toHaveBeenCalledTimes(1);
    const readyEvent = ready.mock.calls[0][0] as CustomEvent;
    expect(readyEvent.detail.trigger).toBe(trigger);
    expect(readyEvent.detail.target).toBe(tooltip);
    expect(legacyReady).toHaveBeenCalledTimes(1);
  });

  it("shows on focus and hides on blur while emitting lifecycle events", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;
    const toggleListener = vi.fn();
    const legacyToggleListener = vi.fn();
    const shownListener = vi.fn();
    const hiddenListener = vi.fn();
    trigger.addEventListener("automagica11y:tooltip:toggle", toggleListener);
    trigger.addEventListener("automagica11y:toggle", legacyToggleListener);
    trigger.addEventListener("automagica11y:tooltip:shown", shownListener);
    trigger.addEventListener("automagica11y:tooltip:hidden", hiddenListener);

    vi.useFakeTimers();
    initTooltip(trigger);

    trigger.dispatchEvent(new Event("focus"));
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(150);
    expect(tooltip.hidden).toBe(true);

    expect(toggleListener).toHaveBeenCalledTimes(2);
    expect(legacyToggleListener).toHaveBeenCalledTimes(2);
    const [showEvt, hideEvt] = toggleListener.mock.calls.map(call => call[0] as CustomEvent);
    expect(showEvt.detail.expanded).toBe(true);
    expect(hideEvt.detail.expanded).toBe(false);
    expect(shownListener).toHaveBeenCalledTimes(1);
    expect(hiddenListener).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("keeps the tooltip visible while the pointer rests on trigger or tooltip", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    initTooltip(trigger);
    vi.useFakeTimers();

    trigger.dispatchEvent(new Event("pointerenter"));
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(new Event("pointerleave"));
    tooltip.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(150);

    expect(tooltip.hidden).toBe(false);

    tooltip.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(150);
    expect(tooltip.hidden).toBe(true);
  });

  it("hides when Escape is pressed", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    initTooltip(trigger);

    trigger.dispatchEvent(new Event("focus"));
    expect(tooltip.hidden).toBe(false);

    const esc = new KeyboardEvent("keydown", { key: "Escape" });
    trigger.dispatchEvent(esc);

    expect(tooltip.hidden).toBe(true);
  });
});
