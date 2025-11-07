import { describe, it, expect, beforeEach, vi } from "vitest";

const setupPlugin = async () => {
  const originalMatchMedia = globalThis.matchMedia;
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));

  const originalGetComputedStyle = globalThis.getComputedStyle;
  vi.stubGlobal(
    "getComputedStyle",
    () =>
      ({
        transitionDuration: "0.1s",
        transitionDelay: "0s",
        transitionProperty: "opacity",
        animationDuration: "0s",
        animationDelay: "0s",
        animationIterationCount: "1",
      }) as CSSStyleDeclaration
  );

  const mod = await import("../../src/plugins/animate");
  mod.registerAnimatePlugin();

  return () => {
    vi.stubGlobal("matchMedia", originalMatchMedia);
    vi.stubGlobal("getComputedStyle", originalGetComputedStyle);
  };
};

describe("animate plugin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  it("delays closing until transition ends", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-animate="target"></button>
      <div id="panel"></div>
    `;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const panel = document.getElementById("panel") as HTMLElement;

    const toggleSpy = vi.fn();
    trigger.addEventListener("automagica11y:toggle", toggleSpy);

    trigger.dispatchEvent(
      new CustomEvent("automagica11y:toggle", {
        detail: { expanded: false, trigger, target: panel },
        bubbles: true
      })
    );

    // Allow the plugin's requestAnimationFrame to run so it attaches listeners.
    vi.runOnlyPendingTimers();

    expect(toggleSpy).toHaveBeenCalledTimes(0);

    panel.dispatchEvent(new Event("transitionend"));
    vi.advanceTimersByTime(200);

    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(toggleSpy.mock.calls[0][0].detail.expanded).toBe(false);

    restore();
  });
  it("hides the target after transition end", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel },
      bubbles: true, cancelable: true
    }));

    // Let rAF attach listeners
    vi.runOnlyPendingTimers();

    // Simulate the end of the transition on the watched element (target)
    panel.dispatchEvent(new Event("transitionend"));
    vi.runAllTimers();

    expect(panel.hidden).toBe(true);
    expect(panel.getAttribute("aria-hidden")).toBe("true");

    restore();
  });

  it("uses computed fallback timing when no events fire", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    // Arm watchers (plugin uses double rAF before starting the fallback)
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    // Advance beyond the stubbed 100ms duration (plus padding)
    vi.advanceTimersByTime(200);

    expect(panel.hidden).toBe(true);
    restore();
  });

  it("short-circuits when prefers-reduced-motion is on", async () => {
    const original = globalThis.matchMedia;
    const restore = await setupPlugin();
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    // Process the scheduled frame so the short-circuit can execute
    vi.runOnlyPendingTimers();

    // Should hide immediately (no wait)
    expect(panel.hidden).toBe(true);

    restore();
    vi.stubGlobal("matchMedia", original as typeof globalThis.matchMedia);
  });

  it("waits on getAnimations().finished when available", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p") as HTMLElement & { getAnimations: (options?: GetAnimationsOptions) => Animation[] };

    let resolveAnim!: () => void;
    const finished = new Promise<void>((res) => { resolveAnim = res; });
    type AnimStub = Partial<Animation> & { finished: Promise<void> };
    panel.getAnimations = () => ([{ finished } as AnimStub] as unknown as Animation[]);

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    vi.runOnlyPendingTimers(); // arm watchers
    expect(panel.hidden).toBe(false);
    resolveAnim();
    // Let the promise microtask and any timers flush
    await Promise.resolve();
    vi.runAllTimers();

    expect(panel.hidden).toBe(true);
    restore();
  });

  it("can watch a specified element via selector", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate=".watched"></button>
      <div id="p"><div class="watched" id="w"></div></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;
    const watched = document.getElementById("w")!;

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    vi.runOnlyPendingTimers();
    watched.dispatchEvent(new Event("transitionend"));
    vi.runAllTimers();

    expect(panel.hidden).toBe(true);
    restore();
  });

  it("cancels pending close when re-open happens mid-flight", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    // Start closing
    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));
    vi.runOnlyPendingTimers();

    // Interrupt with open
    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: true, trigger, target: panel }, bubbles: true
    }));

    // Even if a transitionend fires later, close should have been canceled
    panel.dispatchEvent(new Event("transitionend"));
    vi.runAllTimers();

    expect(panel.hidden).toBe(false);
    restore();
  });

  it("emits animation-done with expected detail", async () => {
    const restore = await setupPlugin();

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    const done = vi.fn();
    trigger.addEventListener("automagica11y:animation-done", done);

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    vi.runOnlyPendingTimers();
    panel.dispatchEvent(new Event("transitionend"));
    vi.runAllTimers();

    expect(done).toHaveBeenCalledTimes(1);
    const event = done.mock.calls[0][0] as CustomEvent<{ trigger: HTMLElement; target: HTMLElement; watched?: HTMLElement; phase: "close" | "open" }>;
    const { trigger: eventTrigger, target: eventTarget, phase } = event.detail;
    expect(eventTrigger).toBe(trigger);
    expect(eventTarget).toBe(panel);
    expect(phase).toBe("close");

    restore();
  });

  it("treats zero durations as instant even if events fire", async () => {
    const restore = await setupPlugin();

    const prior = globalThis.getComputedStyle;
    vi.stubGlobal(
      "getComputedStyle",
      () =>
        ({
          transitionDuration: "0s",
          transitionDelay: "0s",
          transitionProperty: "opacity",
          animationDuration: "0s",
          animationDelay: "0s",
          animationIterationCount: "1",
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `
      <button id="t" data-automagica11y-animate="target"></button>
      <div id="p"></div>
    `;
    const trigger = document.getElementById("t")!;
    const panel = document.getElementById("p")!;

    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", {
      detail: { expanded: false, trigger, target: panel }, bubbles: true
    }));

    vi.runOnlyPendingTimers();
    expect(panel.hidden).toBe(true);

    // restore per-test override so later tests see the normal stub
    vi.stubGlobal("getComputedStyle", prior as typeof globalThis.getComputedStyle);
    restore();
  });
});
