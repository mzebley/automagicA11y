import { describe, expect, it, beforeEach, vi } from "vitest";

const loadAnnounce = async () => import("../../src/patterns/announce/announce");

const dispatchToggle = (trigger: HTMLElement, detail: Record<string, unknown>) => {
  trigger.dispatchEvent(
    new CustomEvent("automagica11y:toggle", {
      bubbles: true,
      detail
    })
  );
};

describe("announce pattern", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    document.body.innerHTML = "";
    const liveRegion = document.getElementById("automagica11y-live");
    liveRegion?.remove();
  });

  it("creates a singleton live region on registration", async () => {
    const { registerAnnouncePlugin } = await loadAnnounce();
    expect(document.getElementById("automagica11y-live")).toBeNull();

    registerAnnouncePlugin();

    const region = document.getElementById("automagica11y-live");
    expect(region).toBeTruthy();
    expect(region?.getAttribute("role")).toBe("status");
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });

  it("announces custom open text when provided", async () => {
    document.body.innerHTML = `
      <button
        data-automagica11y-toggle="#panel"
        data-automagica11y-announce="polite"
        data-automagica11y-announce-open="FAQ expanded"
        data-automagica11y-announce-closed="FAQ collapsed">
        FAQ
      </button>
      <div id="panel"></div>
    `;

    const { registerAnnouncePlugin } = await loadAnnounce();
    registerAnnouncePlugin();

    const trigger = document.querySelector("[data-automagica11y-announce]") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    vi.useFakeTimers();
    dispatchToggle(trigger, { expanded: true, trigger, target });
    vi.advanceTimersByTime(50);

    const region = document.getElementById("automagica11y-live");
    expect(region?.textContent).toBe("FAQ expanded");
  });

  it("falls back to accessible name when custom text is absent", async () => {
    document.body.innerHTML = `
      <button
        aria-label="Primary panel"
        data-automagica11y-toggle="#panel"
        data-automagica11y-announce="assertive">
        Hidden text
      </button>
      <div id="panel"></div>
    `;

    const { registerAnnouncePlugin } = await loadAnnounce();
    registerAnnouncePlugin();

    const trigger = document.querySelector("[data-automagica11y-announce]") as HTMLElement;
    const target = document.getElementById("panel") as HTMLElement;

    vi.useFakeTimers();
    dispatchToggle(trigger, { expanded: false, trigger, target });
    vi.advanceTimersByTime(50);

    const region = document.getElementById("automagica11y-live");
    expect(region?.textContent).toBe("Primary panel collapsed");
    expect(region?.getAttribute("aria-live")).toBe("assertive");
    expect(region?.getAttribute("role")).toBe("alert");
  });

  it("skips announcements when the trigger retains focus", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Focusable";
    trigger.setAttribute("data-automagica11y-announce", "polite");
    trigger.setAttribute("data-automagica11y-toggle", "#panel");
    document.body.appendChild(trigger);
    const target = document.createElement("div");
    target.id = "panel";
    document.body.appendChild(target);

    const { registerAnnouncePlugin } = await loadAnnounce();
    registerAnnouncePlugin();

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    vi.useFakeTimers();
    dispatchToggle(trigger, { expanded: true, trigger, target });
    vi.advanceTimersByTime(50);

    const region = document.getElementById("automagica11y-live");
    expect(region?.textContent).toBe("");
  });
});
