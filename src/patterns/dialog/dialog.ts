import { initToggle } from "../toggle/toggle";

/**
 * Legacy dialog initializer preserved for back-compat. Delegates to toggle + context="dialog".
 */
export function initDialog(trigger: Element) {
  if (!(trigger instanceof HTMLElement)) return;
  const selector = trigger.getAttribute("data-automagica11y-dialog");
  if (!selector) return;

  if (!trigger.hasAttribute("data-automagica11y-toggle")) {
    trigger.setAttribute("data-automagica11y-toggle", selector);
  }
  if (!trigger.hasAttribute("data-automagica11y-context")) {
    trigger.setAttribute("data-automagica11y-context", "dialog");
  }

  initToggle(trigger);
}
