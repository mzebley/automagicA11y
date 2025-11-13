import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initPopover } from "../../src/patterns/popover/popover";

const template = `
  <button id="trigger" data-automagica11y-popover="#panel">Actions</button>
  <div id="panel">
    <button data-automagica11y-popover-dismiss>Close</button>
    <p>Content</p>
  </div>
`;

describe("popover pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("initializes aria semantics, hides the panel, and emits ready/hidden events", () => {
    document.body.innerHTML = template;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    const readyListener = vi.fn();
    const hiddenListener = vi.fn();
    trigger.addEventListener("automagica11y:popover:ready", readyListener);
    trigger.addEventListener("automagica11y:popover:hidden", hiddenListener);

    initPopover(trigger);

    expect(trigger.getAttribute("aria-controls")?.split(/\s+/).includes(panel.id)).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(panel.hidden).toBe(true);
    expect(panel.getAttribute("aria-hidden")).toBe("true");

    expect(readyListener).toHaveBeenCalledTimes(1);
    const readyEvent = readyListener.mock.calls[0][0] as CustomEvent;
    expect(readyEvent.detail.trigger).toBe(trigger);
    expect(readyEvent.detail.target).toBe(panel);

    expect(hiddenListener).toHaveBeenCalledTimes(1);
    const hiddenEvent = hiddenListener.mock.calls[0][0] as CustomEvent;
    expect(hiddenEvent.detail.reason).toBe("initial");
  });

  it("respects author-provided panel roles without forcing aria-haspopup dialog", () => {
    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-popover="#panel" aria-haspopup="dialog">Actions</button>
      <div id="panel" role="menu"></div>
    `;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    initPopover(trigger);

    expect(panel.getAttribute("role")).toBe("menu");
    expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
    expect(trigger.getAttribute("aria-controls")?.split(/\s+/).includes(panel.id)).toBe(true);
  });

  it("toggles visibility on click and emits lifecycle events", () => {
    document.body.innerHTML = template;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    const toggleListener = vi.fn();
    const shownListener = vi.fn();
    const hiddenListener = vi.fn();
    const dismissedListener = vi.fn();

    trigger.addEventListener("automagica11y:popover:toggle", toggleListener);
    trigger.addEventListener("automagica11y:popover:shown", shownListener);
    trigger.addEventListener("automagica11y:popover:hidden", hiddenListener);
    trigger.addEventListener("automagica11y:popover:dismissed", dismissedListener);

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    expect(toggleListener).toHaveBeenCalledTimes(2);
    const [openEvt, closeEvt] = toggleListener.mock.calls.map((call) => call[0] as CustomEvent);
    expect(openEvt.detail.expanded).toBe(true);
    expect(openEvt.detail.reason).toBe("trigger");
    expect(closeEvt.detail.expanded).toBe(false);
    expect(closeEvt.detail.reason).toBe("trigger");

    expect(shownListener).toHaveBeenCalledTimes(1);
    const shownEvent = shownListener.mock.calls[0][0] as CustomEvent;
    expect(shownEvent.detail.reason).toBe("trigger");

    expect(hiddenListener).toHaveBeenCalledTimes(2);
    const closeHiddenEvent = hiddenListener.mock.calls[1][0] as CustomEvent;
    expect(closeHiddenEvent.detail.reason).toBe("trigger");

    expect(dismissedListener).toHaveBeenCalledTimes(1);
    const dismissedEvent = dismissedListener.mock.calls[0][0] as CustomEvent;
    expect(dismissedEvent.detail.reason).toBe("trigger");
  });

  it("dismisses when clicking outside if enabled", () => {
    document.body.innerHTML = template;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    const dismissedListener = vi.fn();
    trigger.addEventListener("automagica11y:popover:dismissed", dismissedListener);

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.hidden).toBe(false);

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(panel.hidden).toBe(true);
    const dismissedEvent = dismissedListener.mock.calls[0][0] as CustomEvent;
    expect(dismissedEvent.detail.reason).toBe("outside");
  });

  it("respects disabled outside dismissal", () => {
    document.body.innerHTML = template;
    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    trigger.setAttribute("data-automagica11y-popover-outside-dismiss", "false");

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.hidden).toBe(false);

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(panel.hidden).toBe(false);
  });

  it("dismisses after scrolling past the configured threshold", () => {
    document.body.innerHTML = template;
    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    trigger.setAttribute("data-automagica11y-popover-scroll-distance", "50");

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.hidden).toBe(false);

    const originalScrollX = Object.getOwnPropertyDescriptor(window, "scrollX");
    const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
    Object.defineProperty(window, "scrollX", { configurable: true, writable: true, value: 0 });
    Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });

    window.scrollY = 40;
    window.dispatchEvent(new Event("scroll"));
    expect(panel.hidden).toBe(false);

    window.scrollY = 60;
    window.dispatchEvent(new Event("scroll"));
    expect(panel.hidden).toBe(true);

    if (originalScrollX) {
      Object.defineProperty(window, "scrollX", originalScrollX);
    }
    if (originalScrollY) {
      Object.defineProperty(window, "scrollY", originalScrollY);
    }
  });

  it("closes when a dismiss control is activated", () => {
    document.body.innerHTML = template;
    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;
    const dismissButton = panel.querySelector("[data-automagica11y-popover-dismiss]") as HTMLElement;

    const dismissedListener = vi.fn();
    trigger.addEventListener("automagica11y:popover:dismissed", dismissedListener);

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.hidden).toBe(false);

    // Place focus inside, then activate the dismiss control
    dismissButton.focus();
    expect(document.activeElement).toBe(dismissButton);
    dismissButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(panel.hidden).toBe(true);
    // Focus should be restored to the trigger to avoid aria-hidden warnings
    expect(document.activeElement).toBe(trigger);
    const dismissedEvent = dismissedListener.mock.calls[0][0] as CustomEvent;
    expect(dismissedEvent.detail.reason).toBe("dismiss-control");
  });

  it("publishes placement changes", () => {
    document.body.innerHTML = template;
    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    trigger.setAttribute("data-automagica11y-popover-position", "top");

    trigger.getBoundingClientRect = () =>
      ({
        width: 120,
        height: 40,
        top: 220,
        left: 10,
        right: 130,
        bottom: 260,
        x: 10,
        y: 220,
        toJSON() {
          return this;
        },
      } as DOMRect);

    panel.getBoundingClientRect = () =>
      ({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON() {
          return this;
        },
      } as DOMRect);

    const placementListener = vi.fn();
    trigger.addEventListener("automagica11y:popover:placement", placementListener);

    initPopover(trigger);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(panel.getAttribute("data-automagica11y-popover-placement")).toBe("top");
    expect(placementListener).toHaveBeenCalledTimes(1);
    const placementEvent = placementListener.mock.calls[0][0] as CustomEvent;
    expect(placementEvent.detail.placement).toBe("top");
  });
});
