import { describe, expect, it, beforeEach, vi } from "vitest";
import { initToggle, isToggleOpen, getToggleTarget } from "../../src/patterns/toggle/toggle";

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
  it("closes on second click and emits event with expanded:false", () => {
    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-toggle="#panel"></button>
      <div id="panel">Hidden content</div>
    `;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    const listener = vi.fn();
    trigger.addEventListener("automagica11y:toggle", listener);

    initToggle(trigger);

    // open
    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(target.hidden).toBe(false);

    // close
    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(target.hidden).toBe(true);

    // last event detail should be expanded:false
    const last = listener.mock.calls[listener.mock.calls.length - 1][0] as CustomEvent;
    expect(last.detail.expanded).toBe(false);
    expect(last.detail.trigger).toBe(trigger);
    expect(last.detail.target).toBe(target);
  });

  it("activates via keyboard on non-button (Enter and Space)", () => {
    document.body.innerHTML = `
      <div id="toggle" data-automagica11y-toggle="#panel"></div>
      <div id="panel">Hidden content</div>
    `;
    const trigger = document.getElementById("toggle") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    initToggle(trigger);

    // Enter
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    trigger.dispatchEvent(enter);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(target.hidden).toBe(false);

    // Space (should prevent default and toggle once)
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(space, "preventDefault");
    trigger.dispatchEvent(space);
    expect(preventSpy).toHaveBeenCalled();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(target.hidden).toBe(true);
  });

  it("is idempotent on init and supports destroy()", () => {
    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-toggle="#panel"></button>
      <div id="panel">Hidden content</div>
    `;
    const trigger = document.getElementById("trigger") as HTMLElement & { __automagica11yInitialized?: boolean };

    const destroy1 = initToggle(trigger)!;
    // second init should be a no-op
    const destroy2 = initToggle(trigger);

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // destroy should unhook listeners
    destroy1?.();
    destroy2?.();

    trigger.click();
    // state should not change after destroy
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // flag should reset
    expect(trigger.__automagica11yInitialized).toBe(false);
  });

  it("dispatches automagica11y:ready once with trigger/target detail", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p"></button>
      <div id="p">Panel</div>
    `;
    const trigger = document.getElementById("t") as HTMLElement;
    const target = document.getElementById("p") as HTMLElement;

    const ready = vi.fn();
    trigger.addEventListener("automagica11y:ready", ready);

    initToggle(trigger);

    expect(ready).toHaveBeenCalledTimes(1);
    const evt = ready.mock.calls[0][0] as CustomEvent;
    expect(evt.detail.trigger).toBe(trigger);
    expect(evt.detail.target).toBe(target);
  });

  it("respects prevented close (plugins may cancel hiding)", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p"></button>
      <div id="p">Panel</div>
    `;
    const trigger = document.getElementById("t") as HTMLElement;
    const target = document.getElementById("p") as HTMLElement;

    initToggle(trigger);

    // Open first
    trigger.click();
    expect(target.hidden).toBe(false);

    // Prevent close hide
    trigger.addEventListener("automagica11y:toggle", (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail.expanded === false) {
        e.preventDefault();
      }
    });

    // Attempt to close
    trigger.click();
    // Toggle should respect cancelation and not hide
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(target.hidden).toBe(false);
  });

  it("hydrates alias-prefixed toggle attributes", () => {
    document.body.innerHTML = `
      <button data-ama-toggle="#panel"></button>
      <div id="panel">Alias content</div>
    `;

    const trigger = document.querySelector("[data-ama-toggle]") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    initToggle(trigger);

    expect(trigger.getAttribute("aria-controls")).toBe(target.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(target.hidden).toBe(true);

    trigger.click();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(target.hidden).toBe(false);
  });

  it("applies open classes after double rAF when motion is allowed; immediate when reduced motion", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p"
        data-automagica11y-trigger-class-open="is-open"
        data-automagica11y-trigger-class-closed="is-closed"></button>
      <div id="p">Panel</div>
    `;
    const trigger = document.getElementById("t") as HTMLElement;

    const originalMatch = globalThis.matchMedia;
    const originalRAF = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;

    try {
      // Motion allowed: expect two rAF ticks before class flips
      vi.stubGlobal("matchMedia", ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof globalThis.matchMedia);

      let callbacks: FrameRequestCallback[] = [];
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { callbacks.push(cb); return callbacks.length; });
      vi.stubGlobal("cancelAnimationFrame", () => {});

      initToggle(trigger);
      expect(trigger.classList.contains("is-closed")).toBe(true);
      trigger.click();
      // Before flushing rAFs, still closed
      expect(trigger.classList.contains("is-open")).toBe(false);
      // Flush two frames
      callbacks.shift()?.(0);
      callbacks.shift()?.(0);
      expect(trigger.classList.contains("is-open")).toBe(true);

      // Reduced motion: immediate class flip, no rAF dependency
      callbacks = [];
      vi.stubGlobal("matchMedia", ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof globalThis.matchMedia);

      // Close to reset
      trigger.click();
      expect(trigger.classList.contains("is-open")).toBe(false);
      // Open again
      trigger.click();
      expect(trigger.classList.contains("is-open")).toBe(true);
      expect(callbacks.length).toBe(0);
    } finally {
      vi.stubGlobal("matchMedia", originalMatch as typeof globalThis.matchMedia);
      vi.stubGlobal("requestAnimationFrame", originalRAF as typeof globalThis.requestAnimationFrame);
      vi.stubGlobal("cancelAnimationFrame", originalCancel as typeof globalThis.cancelAnimationFrame);
    }
  });

  it("applies author-provided open/closed classes without duplication", () => {
    const originalMatch = globalThis.matchMedia;
    try {
      // Force reduced motion so open classes apply immediately (no double-rAF)
      vi.stubGlobal(
        "matchMedia",
        ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof globalThis.matchMedia
      );

      document.body.innerHTML = `
        <button id="t" data-automagica11y-toggle="#p"
          data-automagica11y-trigger-class-open="is-open"
          data-automagica11y-trigger-class-closed="is-closed"
          data-automagica11y-target-class-open="panel-open"
          data-automagica11y-target-class-closed="panel-closed"></button>
        <div id="p" class="panel-closed">Panel</div>
      `;

      const trigger = document.getElementById("t") as HTMLElement;
      const target = document.getElementById("p") as HTMLElement;

      initToggle(trigger);

      // Open
      trigger.click();
      expect(trigger.classList.contains("is-open")).toBe(true);
      expect(trigger.classList.contains("is-closed")).toBe(false);
      expect(target.classList.contains("panel-open")).toBe(true);
      expect(target.classList.contains("panel-closed")).toBe(false);

      // Close
      trigger.click();
      expect(trigger.classList.contains("is-open")).toBe(false);
      expect(trigger.classList.contains("is-closed")).toBe(true);
      expect(target.classList.contains("panel-open")).toBe(false);
      expect(target.classList.contains("panel-closed")).toBe(true);

      // No duplicates
      const closedCount = Array.from(trigger.classList).filter(c => c === "is-closed").length;
      expect(closedCount).toBe(1);
    } finally {
      vi.stubGlobal("matchMedia", originalMatch as typeof globalThis.matchMedia);
    }
  });

  it("preserves author-provided role/tabindex and avoids adding extras to native buttons", () => {
    // Non-button with author attrs
    document.body.innerHTML = `
      <div id="a" role="link" tabindex="5" data-automagica11y-toggle="#p1"></div>
      <div id="p1"></div>
    `;
    const a = document.getElementById("a") as HTMLElement;
    initToggle(a);
    expect(a.getAttribute("role")).toBe("link");
    expect(a.getAttribute("tabindex")).toBe("5");

    // Native button should keep native semantics (no role/tabindex added)
    document.body.innerHTML = `
      <button id="b" data-automagica11y-toggle="#p2"></button>
      <div id="p2"></div>
    `;
    const b = document.getElementById("b") as HTMLButtonElement;
    initToggle(b);
    expect(b.hasAttribute("role")).toBe(false);
    expect(b.hasAttribute("tabindex")).toBe(false);
  });

  it("handles bad selector by no-op without throwing", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#nope"></button>
    `;
    const t = document.getElementById("t") as HTMLElement;
    expect(() => initToggle(t)).not.toThrow();
  });

  it("exposes helpers to check state and resolve target", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p"></button>
      <div id="p">Panel</div>
    `;
    const t = document.getElementById("t") as HTMLElement;
    const p = document.getElementById("p") as HTMLElement;
    initToggle(t);
    expect(isToggleOpen(t)).toBe(false);
    expect(getToggleTarget(t)).toBe(p);
    t.click();
    expect(isToggleOpen(t)).toBe(true);
  });

  it("emits opened/closed events when state changes locally", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p"></button>
      <div id="p">Panel</div>
    `;
    const t = document.getElementById("t") as HTMLElement;
    const opened = vi.fn();
    const closed = vi.fn();
    t.addEventListener("automagica11y:toggle:opened", opened);
    t.addEventListener("automagica11y:toggle:closed", closed);
    initToggle(t);
    t.click(); // open
    t.click(); // close (no plugin cancelling)
    expect(opened).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it("supports multiple targets from a single trigger", () => {
    document.body.innerHTML = `
      <button id="t" data-automagica11y-toggle="#p1, #p2"></button>
      <div id="p1"></div>
      <div id="p2"></div>
    `;
    const t = document.getElementById("t") as HTMLElement;
    const p1 = document.getElementById("p1") as HTMLElement;
    const p2 = document.getElementById("p2") as HTMLElement;
    initToggle(t);
    // aria-controls should list both ids
    const controls = t.getAttribute("aria-controls")!;
    expect(controls.split(/\s+/).sort()).toEqual(["p1", "p2"].sort());
    // open
    t.click();
    expect(p1.hidden).toBe(false);
    expect(p2.hidden).toBe(false);
    // close
    t.click();
    expect(p1.hidden).toBe(true);
    expect(p2.hidden).toBe(true);
  });

  it("closes siblings within the same data-automagica11y-group on open (accordion)", () => {
    document.body.innerHTML = `
      <button id="a" data-automagica11y-group="g" data-automagica11y-toggle="#pa"></button>
      <div id="pa"></div>
      <button id="b" data-automagica11y-group="g" data-automagica11y-toggle="#pb"></button>
      <div id="pb"></div>
    `;
    const a = document.getElementById("a") as HTMLElement;
    const b = document.getElementById("b") as HTMLElement;
    const pa = document.getElementById("pa") as HTMLElement;
    const pb = document.getElementById("pb") as HTMLElement;
    initToggle(a);
    initToggle(b);

    // open A
    a.click();
    expect(a.getAttribute("aria-expanded")).toBe("true");
    expect(pa.hidden).toBe(false);

    // open B, should close A
    b.click();
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(pb.hidden).toBe(false);
    expect(a.getAttribute("aria-expanded")).toBe("false");
    expect(pa.hidden).toBe(true);
  });
});
