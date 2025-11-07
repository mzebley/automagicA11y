import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { initTooltip } from "../../src/patterns/tooltip/tooltip";

const triggerTemplate = `
  <button id="trigger" data-automagica11y-tooltip="#tip">Hover me</button>
  <div id="tip">Tooltip text</div>
`;

const touchTemplate = `
  <button
    id="trigger"
    data-automagica11y-tooltip="#tip"
    data-automagica11y-tooltip-open-delay="75"
    data-automagica11y-tooltip-close-delay="150"
  >
    Info
  </button>
  <div id="tip">
    Tooltip text
    <button data-automagica11y-tooltip-dismiss>Dismiss</button>
  </div>
`;

function createPointerEvent(type: string, pointerType: string = "mouse") {
  const event = new Event(type, { bubbles: true, cancelable: true });
  (event as PointerEvent).pointerType = pointerType;
  return event as PointerEvent;
}

describe("tooltip pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  afterEach(() => {
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

    trigger.dispatchEvent(createPointerEvent("pointerenter"));
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(createPointerEvent("pointerleave"));
    tooltip.dispatchEvent(createPointerEvent("pointerenter"));
    vi.advanceTimersByTime(150);

    expect(tooltip.hidden).toBe(false);

    tooltip.dispatchEvent(createPointerEvent("pointerleave"));
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

  it("respects configurable open and close delays", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    trigger.setAttribute("data-automagica11y-tooltip-open-delay", "120");
    trigger.setAttribute("data-automagica11y-tooltip-close-delay", "240");

    initTooltip(trigger);
    vi.useFakeTimers();

    trigger.dispatchEvent(createPointerEvent("pointerenter"));
    expect(tooltip.hidden).toBe(true);

    vi.advanceTimersByTime(119);
    expect(tooltip.hidden).toBe(true);

    vi.advanceTimersByTime(1);
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(createPointerEvent("pointerleave"));
    vi.advanceTimersByTime(239);
    expect(tooltip.hidden).toBe(false);

    vi.advanceTimersByTime(1);
    expect(tooltip.hidden).toBe(true);
  });

  it("flips placement when the preferred side overflows", () => {
    document.body.innerHTML = triggerTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;

    const innerHeightSpy = vi.spyOn(window, "innerHeight", "get").mockReturnValue(600);

    trigger.getBoundingClientRect = () =>
      ({
        width: 120,
        height: 40,
        top: 580,
        left: 40,
        right: 160,
        bottom: 620,
        x: 40,
        y: 580,
        toJSON() {
          return this;
        },
      } as DOMRect);

    tooltip.getBoundingClientRect = () =>
      ({
        width: 160,
        height: 80,
        top: 0,
        left: 0,
        right: 160,
        bottom: 80,
        x: 0,
        y: 0,
        toJSON() {
          return this;
        },
      } as DOMRect);

    initTooltip(trigger);

    trigger.dispatchEvent(new Event("focus"));

    expect(tooltip.getAttribute("data-automagica11y-tooltip-placement")).toBe("top");

    innerHeightSpy.mockRestore();
  });

  it("supports long-press interaction and dismiss controls for touch", () => {
    document.body.innerHTML = touchTemplate;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const tooltip = document.getElementById("tip") as HTMLElement;
    const dismiss = tooltip.querySelector(
      "[data-automagica11y-tooltip-dismiss]",
    ) as HTMLElement;

    initTooltip(trigger);
    vi.useFakeTimers();

    trigger.dispatchEvent(createPointerEvent("pointerdown", "touch"));
    vi.advanceTimersByTime(551);
    expect(tooltip.hidden).toBe(false);

    trigger.dispatchEvent(createPointerEvent("pointerup", "touch"));
    expect(tooltip.hidden).toBe(false);

    dismiss.dispatchEvent(new Event("click", { bubbles: true }));
    expect(tooltip.hidden).toBe(true);
  });
});
