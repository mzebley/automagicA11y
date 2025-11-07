import { createClassToggler } from "@core/classes";
import { ensureId, appendToken } from "@core/attributes";
import { dispatch } from "@core/events";
import { setHiddenState } from "@core/styles";
import { resolvePlacement, PreferredPlacement, TooltipPlacement } from "./placement";

const DEFAULT_CLOSE_DELAY_MS = 100;
const LONG_PRESS_DELAY_MS = 550;
const PLACEMENT_ATTRIBUTE = "data-automagica11y-tooltip-placement";

function parseDelay(trigger: HTMLElement, attribute: string, fallback: number) {
  const value = trigger.getAttribute(attribute);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePreferredPlacement(value: string | null): PreferredPlacement {
  if (!value) return "auto";
  if (value === "auto") return value;
  const normalized = value.toLowerCase();
  if (normalized === "top" || normalized === "bottom" || normalized === "left" || normalized === "right") {
    return normalized;
  }
  return "auto";
}

function setPlacementAttribute(target: HTMLElement, placement: TooltipPlacement) {
  target.setAttribute(PLACEMENT_ATTRIBUTE, placement);
}

/**
 * Hydrates a tooltip trigger so hover/focus displays the referenced tooltip target.
 * Expects `data-automagica11y-tooltip` to resolve to the tooltip element.
 * Supports configurable open/close delays, responsive placement, and touch affordances.
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

  const openDelay = parseDelay(trigger, "data-automagica11y-tooltip-open-delay", 0);
  const closeDelay = parseDelay(trigger, "data-automagica11y-tooltip-close-delay", DEFAULT_CLOSE_DELAY_MS);
  const preferredPlacement = parsePreferredPlacement(
    trigger.getAttribute("data-automagica11y-tooltip-position"),
  );

  const initialPlacement = preferredPlacement === "auto" ? "bottom" : preferredPlacement;
  setPlacementAttribute(target, initialPlacement);

  const dismissControls = Array.from(
    target.querySelectorAll<HTMLElement>("[data-automagica11y-tooltip-dismiss]"),
  );

  let expanded = false;
  let pointerActive = false;
  let focusActive = false;
  let hideTimer: number | null = null;
  let showTimer: number | null = null;
  let longPressTimer: number | null = null;
  let touchHoldActive = false;
  let touchDismissHandler: ((event: PointerEvent) => void) | null = null;

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const clearShowTimer = () => {
    if (showTimer !== null) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const detachTouchDismiss = () => {
    if (touchDismissHandler) {
      document.removeEventListener("pointerdown", touchDismissHandler, true);
      touchDismissHandler = null;
    }
  };

  const setTouchHold = (active: boolean) => {
    if (touchHoldActive === active) return;
    touchHoldActive = active;
    if (!active) {
      detachTouchDismiss();
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
    if (open) {
      const placement = resolvePlacement(trigger, target, preferredPlacement);
      setPlacementAttribute(target, placement);
    } else {
      setTouchHold(false);
    }
    toggleClasses(open, target);
    emitToggle(open);
    emitVisibility(open);
  };

  const showNow = () => {
    clearShowTimer();
    clearHideTimer();
    setState(true);
  };

  const scheduleHide = () => {
    clearHideTimer();
    clearShowTimer();
    if (pointerActive || focusActive || touchHoldActive) return;
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      if (!pointerActive && !focusActive && !touchHoldActive) setState(false);
    }, closeDelay);
  };

  const scheduleShow = () => {
    clearShowTimer();
    clearHideTimer();
    if (openDelay <= 0) {
      showNow();
      return;
    }

    showTimer = window.setTimeout(() => {
      showTimer = null;
      setState(true);
    }, openDelay);
  };

  const pointerEnter = (event: PointerEvent) => {
    if ((event as PointerEvent).pointerType === "touch") return;
    pointerActive = true;
    scheduleShow();
  };

  const pointerLeave = (event: PointerEvent) => {
    if ((event as PointerEvent).pointerType === "touch") return;
    pointerActive = false;
    scheduleHide();
  };

  trigger.addEventListener("pointerenter", pointerEnter);
  trigger.addEventListener("pointerleave", pointerLeave);
  target.addEventListener("pointerenter", pointerEnter);
  target.addEventListener("pointerleave", pointerLeave);

  trigger.addEventListener("focus", () => {
    focusActive = true;
    showNow();
  });

  trigger.addEventListener("blur", () => {
    focusActive = false;
    scheduleHide();
  });

  const close = () => {
    pointerActive = false;
    focusActive = false;
    setTouchHold(false);
    clearLongPressTimer();
    clearShowTimer();
    clearHideTimer();
    setState(false);
  };

  const attachTouchDismiss = () => {
    if (touchDismissHandler) return;
    touchDismissHandler = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (targetNode && (trigger.contains(targetNode) || target.contains(targetNode))) {
        return;
      }
      setTouchHold(false);
      scheduleHide();
    };
    document.addEventListener("pointerdown", touchDismissHandler, true);
  };

  const beginLongPress = () => {
    setTouchHold(true);
    showNow();
    attachTouchDismiss();
  };

  trigger.addEventListener("pointerdown", (event) => {
    if ((event as PointerEvent).pointerType !== "touch") return;
    pointerActive = true;
    clearLongPressTimer();
    longPressTimer = window.setTimeout(() => {
      longPressTimer = null;
      beginLongPress();
    }, LONG_PRESS_DELAY_MS);
  });

  const endTouchPointer = (event: PointerEvent) => {
    if ((event as PointerEvent).pointerType !== "touch") return;
    pointerActive = false;
    if (longPressTimer !== null) {
      clearLongPressTimer();
      scheduleHide();
      return;
    }

    if (!touchHoldActive) {
      scheduleHide();
    }
  };

  trigger.addEventListener("pointerup", endTouchPointer);
  trigger.addEventListener("pointercancel", endTouchPointer);

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });

  dismissControls.forEach((dismiss) => {
    if (dismiss instanceof HTMLButtonElement && !dismiss.hasAttribute("type")) {
      dismiss.setAttribute("type", "button");
    }

    const requestClose = () => {
      close();
    };

    dismiss.addEventListener("click", requestClose);
    dismiss.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestClose();
      }
    });
  });

  dispatch(trigger, "automagica11y:tooltip:ready", readyDetail);
  // Emit the legacy ready event to avoid breaking consumers on older namespaces.
  dispatch(trigger, "automagica11y:ready", readyDetail);
}
