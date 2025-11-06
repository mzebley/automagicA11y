import { getClassConfig, applyClasses } from "@core/classes";

/**
 * Hydrates a toggle trigger so it controls its target element with accessible defaults.
 * Expects the trigger to provide a `data-automagica11y-toggle` selector that resolves to a target.
 */
export function initToggle(trigger: Element) {
  // Guard early: patterns only run against real HTMLElements.
  if (!(trigger instanceof HTMLElement)) return;

  // Read the selector for the companion target and resolve it in the document.
  const targetSel = trigger.getAttribute("data-automagica11y-toggle");
  if (!targetSel) return;
  const target = document.querySelector<HTMLElement>(targetSel);
  if (!target) return;

  // Snapshot all class configuration from data attributes up front.
  const cfg = getClassConfig(trigger);

  // Ensure both trigger and target have IDs so ARIA relationships can be wired reliably.
  if (!trigger.id) trigger.id = `automagica11y-t-${crypto.randomUUID()}`;
  if (!target.id) target.id = `automagica11y-p-${crypto.randomUUID()}`;

  // Establish the baseline ARIA contract and initial collapsed state.
  trigger.setAttribute("aria-controls", target.id);
  trigger.setAttribute("aria-expanded", "false");
  target.setAttribute("aria-labelledby", trigger.id);
  target.hidden = true;

  // Non-button triggers need button semantics and keyboard focusability.
  if (trigger.tagName !== "BUTTON") {
    trigger.setAttribute("role", "button");
    if (!trigger.hasAttribute("tabindex")) (trigger as HTMLElement).tabIndex = 0;
    if (!(trigger as HTMLElement).style.cursor) (trigger as HTMLElement).style.cursor = "pointer";
  }

  // Apply the initial class state so author-defined hooks reflect "closed".
  applyClasses(cfg, false, trigger, target);

  // Centralized state setter keeps ARIA, classes, DOM visibility, and events in sync.
  const setState = (open: boolean) => {
    trigger.setAttribute("aria-expanded", String(open));
    target.hidden = !open;
    applyClasses(cfg, open, trigger, target);
    trigger.dispatchEvent(new CustomEvent("automagica11y:toggle", { detail: { expanded: open, trigger, target } }));
  };

  // Basic toggle helper reads existing ARIA state and flips it.
  const toggle = () => setState(trigger.getAttribute("aria-expanded") !== "true");

  // Click activates the toggle for mouse and touch interactions.
  trigger.addEventListener("click", toggle);

  // Space/Enter support classic button semantics when the trigger is not a native button.
  trigger.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
  });

  // Announce readiness so plugins or host applications can hook into initialized toggles.
  trigger.dispatchEvent(new CustomEvent("automagica11y:ready", { detail: { trigger, target } }));
}
