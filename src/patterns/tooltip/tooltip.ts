import { initToggle } from "../toggle/toggle";
import { dispatch } from "@core/events";

/**
 * Legacy tooltip initializer preserved for back-compat. Delegates to toggle + context="tooltip".
 */
export function initTooltip(trigger: Element) {
  if (!(trigger instanceof HTMLElement)) return;
  const selector = trigger.getAttribute("data-automagica11y-tooltip");
  if (!selector) return;
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;

  if (!trigger.hasAttribute("data-automagica11y-toggle")) {
    trigger.setAttribute("data-automagica11y-toggle", selector);
  }
  if (!trigger.hasAttribute("data-automagica11y-context")) {
    trigger.setAttribute("data-automagica11y-context", "tooltip");
  }

  initToggle(trigger);

  const readyDetail = { trigger, target };
  dispatch(trigger, "automagica11y:tooltip:ready", readyDetail);
}
