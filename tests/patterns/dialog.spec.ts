import { describe, expect, it, beforeEach, vi } from "vitest";
import { initDialog } from "../../src/patterns/dialog/dialog";

const template = `
  <div id="page-shell">
    <button id="open-dialog" data-automagica11y-dialog="#dialog">Launch dialog</button>
    <div id="dialog" hidden>
      <div role="document">
        <h2 id="dialog-title">Session timeout</h2>
        <p id="dialog-desc">Your session is about to expire. Would you like to stay signed in?</p>
        <div class="actions">
          <button id="stay" data-automagica11y-dialog-close>Stay signed in</button>
          <button id="logout">Log out</button>
        </div>
      </div>
    </div>
    <a id="background-link" href="#">Background link</a>
  </div>
`;

describe("dialog pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = template;
    vi.useRealTimers();
  });

  it("initializes dialog semantics and trigger wiring", () => {
    const trigger = document.getElementById("open-dialog") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;

    initDialog(trigger);

    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.hidden).toBe(true);
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
  });

  it("opens on click, traps focus, and dispatches lifecycle events", async () => {
    const trigger = document.getElementById("open-dialog") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;
    const closeBtn = document.getElementById("stay") as HTMLElement;

    const ready = vi.fn();
    const toggles: CustomEvent[] = [];

    trigger.addEventListener("automagica11y:ready", ready);
    trigger.addEventListener("automagica11y:toggle", (event) => {
      toggles.push(event as CustomEvent);
    });

    vi.useFakeTimers();
    initDialog(trigger);
    expect(ready).toHaveBeenCalledTimes(1);

    trigger.click();
    await Promise.resolve();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.hidden).toBe(false);
    expect(dialog.getAttribute("aria-hidden")).toBe("false");
    expect(document.activeElement).toBe(closeBtn);
    expect(toggles[0].detail.expanded).toBe(true);

    // Tab should loop within dialog.
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    (document.activeElement as HTMLElement | null)?.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(document.getElementById("logout"));

    const shiftTab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    (document.activeElement as HTMLElement | null)?.dispatchEvent(shiftTab);
    expect(document.activeElement).toBe(closeBtn);
    vi.useRealTimers();
  });

  it("closes via data-automagica11y-dialog-close and restores focus/background state", async () => {
    const trigger = document.getElementById("open-dialog") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;
    const closeBtn = document.getElementById("stay") as HTMLElement;
    const backgroundLink = document.getElementById("background-link") as HTMLElement;

    vi.useFakeTimers();
    initDialog(trigger);
    trigger.click();
    await Promise.resolve();

    expect(backgroundLink.getAttribute("aria-hidden")).toBe("true");
    expect(backgroundLink.hasAttribute("inert")).toBe(true);

    closeBtn.click();

    expect(dialog.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(backgroundLink.hasAttribute("aria-hidden")).toBe(false);
    expect(backgroundLink.hasAttribute("inert")).toBe(false);

    // Focus returns to trigger.
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    vi.useRealTimers();
  });

  it("closes when escape is pressed", () => {
    const trigger = document.getElementById("open-dialog") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;

    initDialog(trigger);
    trigger.click();
    expect(dialog.hidden).toBe(false);

    const escape = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(escape);

    expect(dialog.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
