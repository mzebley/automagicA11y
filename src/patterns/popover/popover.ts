import { createClassToggler } from "@core/classes";
import { ensureId, appendToken } from "@core/attributes";
import { dispatch } from "@core/events";
import { setHiddenState } from "@core/styles";
import { resolveAnchoredPlacement, PreferredAnchoredPlacement } from "@core/placement";

const PLACEMENT_ATTRIBUTE = "data-automagica11y-popover-placement";
const OUTSIDE_DISMISS_ATTRIBUTE = "data-automagica11y-popover-outside-dismiss";
const SCROLL_DISMISS_ATTRIBUTE = "data-automagica11y-popover-scroll-dismiss";
const SCROLL_DISTANCE_ATTRIBUTE = "data-automagica11y-popover-scroll-distance";
const POSITION_ATTRIBUTE = "data-automagica11y-popover-position";

const DEFAULT_SCROLL_DISTANCE = 0;

const TRUTHY = new Set(["", "true", "1", "yes", "on"]);
const FALSY = new Set(["false", "0", "no", "off"]);

const DISMISS_QUERY = "[data-automagica11y-popover-dismiss]";

const DEFAULT_OUTSIDE_DISMISS = true;
const DEFAULT_SCROLL_DISMISS = true;

type PopoverReason = "trigger" | "outside" | "escape" | "scroll" | "dismiss-control" | "programmatic";

type PopoverVisibilityReason = PopoverReason | "initial";

type PreferredPopoverPlacement = PreferredAnchoredPlacement;

function parseBooleanAttribute(element: HTMLElement, attribute: string, fallback: boolean): boolean {
  const value = element.getAttribute(attribute);
  if (value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (TRUTHY.has(normalized)) return true;
  if (FALSY.has(normalized)) return false;
  return fallback;
}

function parsePreferredPlacement(value: string | null): PreferredPopoverPlacement {
  if (!value) return "auto";
  const normalized = value.toLowerCase();
  if (normalized === "auto" || normalized === "top" || normalized === "bottom" || normalized === "left" || normalized === "right") {
    return normalized as PreferredPopoverPlacement;
  }
  return "auto";
}

function parseScrollDistance(element: HTMLElement): number {
  const value = element.getAttribute(SCROLL_DISTANCE_ATTRIBUTE);
  if (!value) return DEFAULT_SCROLL_DISTANCE;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_SCROLL_DISTANCE;
}

function setPlacementAttribute(target: HTMLElement, placement: string) {
  target.setAttribute(PLACEMENT_ATTRIBUTE, placement);
}

function emitPlacement(
  trigger: HTMLElement,
  target: HTMLElement,
  placement: string,
) {
  dispatch(trigger, "automagica11y:popover:placement", { trigger, target, placement });
}

function emitToggle(
  trigger: HTMLElement,
  target: HTMLElement,
  expanded: boolean,
  reason: PopoverReason,
) {
  dispatch(trigger, "automagica11y:popover:toggle", { trigger, target, expanded, reason });
}

function emitVisibility(
  trigger: HTMLElement,
  target: HTMLElement,
  expanded: boolean,
  reason: PopoverVisibilityReason,
) {
  const type = expanded ? "automagica11y:popover:shown" : "automagica11y:popover:hidden";
  dispatch(trigger, type, { trigger, target, reason });
}

function emitDismiss(
  trigger: HTMLElement,
  target: HTMLElement,
  reason: PopoverReason,
) {
  dispatch(trigger, "automagica11y:popover:dismissed", { trigger, target, reason });
}

function ensureButtonType(control: HTMLElement) {
  if (control instanceof HTMLButtonElement && !control.hasAttribute("type")) {
    control.setAttribute("type", "button");
  }
}

/**
 * Hydrates a popover trigger to toggle a floating panel with robust dismissal mechanics.
 * Supports outside click, escape, scroll-to-dismiss, and custom dismiss controls.
 */
export function initPopover(node: Element) {
  if (!(node instanceof HTMLElement)) return;

  const selector = node.getAttribute("data-automagica11y-popover");
  if (!selector) return;

  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;

  ensureId(target, "automagica11y-popover");
  appendToken(node, "aria-controls", target.id);
  if (!node.hasAttribute("aria-haspopup")) {
    node.setAttribute("aria-haspopup", "dialog");
  }

  setHiddenState(target, true);
  node.setAttribute("aria-expanded", "false");

  const toggleClasses = createClassToggler(node);

  const outsideDismissEnabled = parseBooleanAttribute(node, OUTSIDE_DISMISS_ATTRIBUTE, DEFAULT_OUTSIDE_DISMISS);
  const scrollDismissEnabled = parseBooleanAttribute(node, SCROLL_DISMISS_ATTRIBUTE, DEFAULT_SCROLL_DISMISS);
  const scrollThreshold = parseScrollDistance(node);
  const preferredPlacement = parsePreferredPlacement(node.getAttribute(POSITION_ATTRIBUTE));

  const dismissControls = Array.from(target.querySelectorAll<HTMLElement>(DISMISS_QUERY));
  dismissControls.forEach(ensureButtonType);

  const readyDetail = { trigger: node, target };

  let expanded = false;
  let scrollOriginX = 0;
  let scrollOriginY = 0;

  const detachOutside = () => {
    document.removeEventListener("pointerdown", handleOutsidePointer, true);
  };

  const detachEscape = () => {
    document.removeEventListener("keydown", handleEscape, true);
  };

  const detachScroll = () => {
    window.removeEventListener("scroll", handleScroll, true);
  };

  const attachOutside = () => {
    document.addEventListener("pointerdown", handleOutsidePointer, true);
  };

  const attachEscape = () => {
    document.addEventListener("keydown", handleEscape, true);
  };

  const attachScroll = () => {
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
  };

  const detachAll = () => {
    detachOutside();
    detachEscape();
    detachScroll();
  };

  const attachForOpen = () => {
    scrollOriginX = window.scrollX;
    scrollOriginY = window.scrollY;
    if (outsideDismissEnabled) attachOutside();
    attachEscape();
    if (scrollDismissEnabled) attachScroll();
  };

  function setState(open: boolean, reason: PopoverReason) {
    if (expanded === open) {
      if (!open) {
        emitDismiss(node, target, reason);
      }
      return;
    }
    expanded = open;
    node.setAttribute("aria-expanded", open ? "true" : "false");
    setHiddenState(target, !open);
    toggleClasses(open, target);

    if (open) {
      const placement = resolveAnchoredPlacement(node, target, preferredPlacement);
      setPlacementAttribute(target, placement);
      emitPlacement(node, target, placement);
      attachForOpen();
    } else {
      detachAll();
      emitDismiss(node, target, reason);
    }

    emitToggle(node, target, open, reason);
    emitVisibility(node, target, open, reason);
  }

  function openPopover(reason: PopoverReason) {
    setState(true, reason);
  }

  function closePopover(reason: PopoverReason) {
    setState(false, reason);
  }

  function togglePopover() {
    if (expanded) {
      closePopover("trigger");
    } else {
      openPopover("trigger");
    }
  }

  function handleOutsidePointer(event: PointerEvent) {
    const eventTarget = event.target as Node | null;
    if (!eventTarget) return;
    if (node.contains(eventTarget) || target.contains(eventTarget)) return;
    closePopover("outside");
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closePopover("escape");
    }
  }

  function handleScroll() {
    if (!scrollDismissEnabled) return;
    const deltaX = Math.abs(window.scrollX - scrollOriginX);
    const deltaY = Math.abs(window.scrollY - scrollOriginY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance >= scrollThreshold) {
      closePopover("scroll");
    }
  }

  node.addEventListener("click", (event) => {
    event.preventDefault();
    togglePopover();
  });

  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePopover();
    }
  });

  dismissControls.forEach((control) => {
    const requestDismiss = () => closePopover("dismiss-control");
    control.addEventListener("click", (event) => {
      event.preventDefault();
      requestDismiss();
    });
    control.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestDismiss();
      }
    });
  });

  emitVisibility(node, target, false, "initial");
  dispatch(node, "automagica11y:popover:ready", readyDetail);
}
