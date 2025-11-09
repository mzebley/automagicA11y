import { getDataAttribute, hasDataAttribute, setDataAttribute } from "../../core/attributes";
import { initToggle } from "../toggle/toggle";

/**
 * Legacy dialog initializer preserved for back-compat. Delegates to toggle + context="dialog".
 */
export function initDialog(trigger: Element) {
  if (!(trigger instanceof HTMLElement)) return;
  const selector = getDataAttribute(trigger, "dialog");
  if (!selector) return;

  if (!hasDataAttribute(trigger, "toggle")) {
    setDataAttribute(trigger, "toggle", selector);
  }
  if (!hasDataAttribute(trigger, "context")) {
    setDataAttribute(trigger, "context", "dialog");
  }

  initToggle(trigger);
}
