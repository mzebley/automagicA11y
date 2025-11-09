import { getDataAttribute, hasDataAttribute, setDataAttribute } from "@core/attributes";
import { initToggle } from "../toggle/toggle";
import { dispatch } from "@core/events";

/**
 * Legacy tooltip initializer preserved for back-compat. Delegates to toggle + context="tooltip".
 */
export function initTooltip(trigger: Element) {
  if (!(trigger instanceof HTMLElement)) return;
  const selector = getDataAttribute(trigger, "tooltip");
  if (!selector) return;
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;

  if (!hasDataAttribute(trigger, "toggle")) {
    setDataAttribute(trigger, "toggle", selector);
  }
  if (!hasDataAttribute(trigger, "context")) {
    setDataAttribute(trigger, "context", "tooltip");
  }

  initToggle(trigger);

  const readyDetail = { trigger, target };
  dispatch(trigger, "automagica11y:tooltip:ready", readyDetail);
}
