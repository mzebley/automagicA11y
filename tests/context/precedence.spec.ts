import { describe, expect, it } from "vitest";
import { initToggle } from "../../src/patterns/toggle/toggle";
import { initDialog } from "../../src/patterns/dialog/dialog";

function getDialogSnapshot(trigger: HTMLElement, target: HTMLElement) {
  return {
    triggerRole: trigger.getAttribute("role"),
    triggerAriaControls: trigger.getAttribute("aria-controls"),
    triggerExpanded: trigger.getAttribute("aria-expanded"),
    triggerHaspopup: trigger.getAttribute("aria-haspopup"),
    targetRole: target.getAttribute("role"),
    targetTabindex: target.getAttribute("tabindex"),
    targetAriaModal: target.getAttribute("aria-modal"),
    targetLabelledby: target.getAttribute("aria-labelledby"),
  };
}

describe("context precedence", () => {
  it("does not overwrite explicit author roles", () => {
    document.body.innerHTML = `
      <button id="trigger" data-automagica11y-toggle="#dlg" data-automagica11y-context="dialog">Open</button>
      <div id="dlg" role="alertdialog" hidden></div>
    `;

    const trigger = document.getElementById("trigger") as HTMLElement;
    const dialog = document.getElementById("dlg") as HTMLElement;

    initToggle(trigger);

    expect(dialog.getAttribute("role")).toBe("alertdialog");
  });

  it("keeps legacy dialog alias in sync with context", () => {
    document.body.innerHTML = `
      <button id="legacy" data-automagica11y-dialog="#legacy-dialog">Legacy</button>
      <div id="legacy-dialog" hidden></div>
      <button
        id="modern"
        data-automagica11y-toggle="#modern-dialog"
        data-automagica11y-context="dialog"
      >
        Modern
      </button>
      <div id="modern-dialog" hidden></div>
    `;

    const legacyTrigger = document.getElementById("legacy") as HTMLElement;
    const legacyDialog = document.getElementById("legacy-dialog") as HTMLElement;
    const modernTrigger = document.getElementById("modern") as HTMLElement;
    const modernDialog = document.getElementById("modern-dialog") as HTMLElement;

    initDialog(legacyTrigger);
    initToggle(modernTrigger);

    const legacy = getDialogSnapshot(legacyTrigger, legacyDialog);
    const modern = getDialogSnapshot(modernTrigger, modernDialog);

    expect(legacy.triggerHaspopup).toBe("dialog");
    expect(modern.triggerHaspopup).toBe("dialog");
    expect(legacy.targetRole).toBe("dialog");
    expect(modern.targetRole).toBe("dialog");
    expect(legacy.targetAriaModal).toBe("true");
    expect(modern.targetAriaModal).toBe("true");
    expect(legacy.targetTabindex).toBe("-1");
    expect(modern.targetTabindex).toBe("-1");
    expect(legacy.triggerExpanded).toBe("false");
    expect(modern.triggerExpanded).toBe("false");
    expect(legacy.targetLabelledby?.split(/\s+/)).toContain(legacyTrigger.id);
    expect(modern.targetLabelledby?.split(/\s+/)).toContain(modernTrigger.id);
  });
});
