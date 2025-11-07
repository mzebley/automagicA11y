import { createClassToggler } from "@core/classes";
import { ensureId, appendToken } from "@core/attributes";
import { dispatch } from "@core/events";
import { setHiddenState } from "@core/styles";

const HIDE_DELAY_MS = 100;

/**
 * Hydrates a tooltip trigger so hover/focus displays the referenced tooltip target.
 * Expects `data-automagica11y-tooltip` to resolve to the tooltip element.
 */
export function initTooltip(trigger: Element) {
  if (!(trigger instanceof HTMLElement)) return;

  const selector = trigger.getAttribute("data-automagica11y-tooltip");
  if (!selector) return;

  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;

  // Ensure tooltip has a stable ID so aria-describedby can reference it.
  ensureId(target, "automagica11y-tip");

  // Preserve any existing aria-describedby values and append the tooltip ID.
  appendToken(trigger, "aria-describedby", target.id);

  // Baseline tooltip semantics.
  if (!target.hasAttribute("role")) target.setAttribute("role", "tooltip");
  setHiddenState(target, true);

  // Snapshot class mappings. Tooltip does not apply default toggle classes.
  const toggleClasses = createClassToggler(trigger, { applyTriggerFallback: false });

  const readyDetail = { trigger, target };

  let expanded = false;
  let pointerActive = false;
  let focusActive = false;
  let hideTimer: number | null = null;

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const emitToggle = (open: boolean) => {
    const detail = { expanded: open, trigger, target };
    dispatch(trigger, "automagica11y:tooltip:toggle", detail);
    // Legacy event for backwards compatibility with early adopters and shared plugins.
    dispatch(trigger, "automagica11y:toggle", detail);
  };

  const emitVisibility = (open: boolean) => {
    const detail = { trigger, target };
    const type = open
      ? "automagica11y:tooltip:shown"
      : "automagica11y:tooltip:hidden";
    dispatch(trigger, type, detail);
  };

  const setState = (open: boolean) => {
    if (expanded === open) return;
    expanded = open;
    setHiddenState(target, !open);
    toggleClasses(open, target);
    emitToggle(open);
    emitVisibility(open);
  };

  const show = () => {
    clearHideTimer();
    setState(true);
  };

  const scheduleHide = () => {
    clearHideTimer();
    if (pointerActive || focusActive) return;
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      if (!pointerActive && !focusActive) setState(false);
    }, HIDE_DELAY_MS);
  };

  const pointerEnter = () => {
    pointerActive = true;
    show();
  };

  const pointerLeave = () => {
    pointerActive = false;
    scheduleHide();
  };

  trigger.addEventListener("pointerenter", pointerEnter);
  trigger.addEventListener("pointerleave", pointerLeave);
  target.addEventListener("pointerenter", pointerEnter);
  target.addEventListener("pointerleave", pointerLeave);

  trigger.addEventListener("focus", () => {
    focusActive = true;
    show();
  });

  trigger.addEventListener("blur", () => {
    focusActive = false;
    scheduleHide();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      focusActive = false;
      pointerActive = false;
      clearHideTimer();
      setState(false);
    }
  });

  dispatch(trigger, "automagica11y:tooltip:ready", readyDetail);
  // Emit the legacy ready event to avoid breaking consumers on older namespaces.
  dispatch(trigger, "automagica11y:ready", readyDetail);
}
