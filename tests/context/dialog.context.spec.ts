import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { initToggle } from "../../src/patterns/toggle/toggle";

const template = `
  <div id="shell">
    <button
      id="open"
      data-automagica11y-toggle="#dialog"
      data-automagica11y-context="dialog"
    >
      Launch dialog
    </button>
    <div id="dialog" hidden data-automagica11y-dialog-dismissable>
      <button id="close">Close</button>
      <a href="#" id="other">Second</a>
    </div>
    <a id="background" href="#">Background link</a>
  </div>
`;

describe("dialog context", () => {
  beforeEach(() => {
    document.body.innerHTML = template;
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies dialog semantics when context is present", () => {
    const trigger = document.getElementById("open") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;

    initToggle(trigger);

    expect(trigger.getAttribute("aria-controls")).toContain(dialog.id);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("tabindex")).toBe("-1");
  });

  it("enables modal behaviors including focus trap, escape to close, and inert siblings", async () => {
    const trigger = document.getElementById("open") as HTMLElement;
    const dialog = document.getElementById("dialog") as HTMLElement;
    const closeButton = document.getElementById("close") as HTMLElement;
    const background = document.getElementById("background") as HTMLElement;

    vi.useFakeTimers();
    initToggle(trigger);

    trigger.click();
    await Promise.resolve();

    expect(document.activeElement).toBe(closeButton);
    expect(background.getAttribute("aria-hidden")).toBe("true");
    expect(background.hasAttribute("inert")).toBe(true);

    (document.activeElement as HTMLElement | null)?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
    );
    expect(document.activeElement).toBe(document.getElementById("other"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(dialog.hidden).toBe(true);
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    expect(background.hasAttribute("inert")).toBe(false);
    expect(background.getAttribute("aria-hidden")).not.toBe("true");
    vi.useRealTimers();
  });

  it("respects semantics-only mode by skipping behavioral helpers", async () => {
    const trigger = document.getElementById("open") as HTMLElement;
    trigger.setAttribute("data-automagica11y-context-mode", "semantics-only");
    const dialog = document.getElementById("dialog") as HTMLElement;
    const background = document.getElementById("background") as HTMLElement;

    initToggle(trigger);
    trigger.click();
    await Promise.resolve();

    expect(background.hasAttribute("inert")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(dialog.hidden).toBe(false);
  });
});
