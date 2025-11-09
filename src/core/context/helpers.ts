import { ensureId, appendToken, normalizeAttributeName } from "../attributes";
import { focusElement } from "../focus";
import { enableFocusTrap, readFocusTrapOptionsFromAttributes } from "../focus-trap";
import { setHiddenState, setInert } from "../styles";

interface FocusTrapController {
  activate: () => void;
  deactivate: () => void;
}

interface RestoreFocusController {
  capture: (opener: HTMLElement) => void;
  restore: () => void;
}

interface EscapeController {
  activate: (trigger: HTMLElement) => void;
  deactivate: () => void;
}

interface InertController {
  activate: () => void;
  deactivate: () => void;
}

interface HoverIntentHandle {
  addElement: (element: HTMLElement) => void;
  resetTouchHold: () => void;
  destroy: () => void;
}

function hasRoleOverride(el: HTMLElement) {
  if (el.hasAttribute("role")) return true;
  return Array.from(el.attributes).some((attr) => {
    const normalized = normalizeAttributeName(attr.name);
    return normalized.startsWith("data-automagica11y") && normalized.endsWith("-role");
  });
}

function hasAriaOverride(el: HTMLElement, attribute: string) {
  const attr = attribute.toLowerCase();
  if (el.hasAttribute(attr)) return true;
  const normalized = attr.startsWith("aria-") ? attr.slice(5) : attr;
  const candidates = [
    `data-automagica11y-${normalized}`,
    `data-automagica11y-aria-${normalized}`,
    `data-automagica11y-target-${normalized}`,
    `data-automagica11y-target-aria-${normalized}`,
    `data-automagica11y-trigger-${normalized}`,
    `data-automagica11y-trigger-aria-${normalized}`,
  ];
  const attributeNames = Array.from(el.attributes).map((attr) =>
    normalizeAttributeName(attr.name)
  );
  return candidates.some((name) => attributeNames.includes(name));
}

const focusTraps = new WeakMap<HTMLElement, FocusTrapController>();
const restoreFocusControllers = new WeakMap<HTMLElement, RestoreFocusController>();
const escapeControllers = new WeakMap<HTMLElement, EscapeController>();
const inertControllers = new WeakMap<HTMLElement, InertController>();

function createFocusTrapController(target: HTMLElement): FocusTrapController {
  const options = readFocusTrapOptionsFromAttributes(target);
  let release: (() => void) | null = null;

  return {
    activate() {
      if (release) return;
      release = enableFocusTrap(target, {
        initial: options.initial,
        returnFocus: false,
        escapeDismiss: options.escapeDismiss,
      });
    },
    deactivate() {
      if (!release) return;
      const dispose = release;
      release = null;
      dispose();
    }
  };
}

function createRestoreFocusController(target: HTMLElement): RestoreFocusController {
  let restoreTo: HTMLElement | null = null;

  return {
    capture(opener: HTMLElement) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && !target.contains(active)) {
        restoreTo = active;
      } else {
        restoreTo = opener;
      }
    },
    restore() {
      const candidate = restoreTo;
      restoreTo = null;
      if (candidate instanceof HTMLElement) {
        focusElement(candidate);
      }
    }
  };
}

function createEscapeController(target: HTMLElement): EscapeController {
  let active = false;
  let triggerRef: HTMLElement | null = null;

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (!active) return;
    event.preventDefault();
    const trigger = triggerRef;
    if (!trigger) return;
    const setter = (trigger as HTMLElement & { __automagica11ySetState?: (open: boolean) => void })
      .__automagica11ySetState;
    if (typeof setter === "function") {
      setter(false);
    }
  };

  return {
    activate(trigger: HTMLElement) {
      triggerRef = trigger;
      if (active) return;
      active = true;
      document.addEventListener("keydown", onKeydown, true);
    },
    deactivate() {
      triggerRef = null;
      if (!active) return;
      active = false;
      document.removeEventListener("keydown", onKeydown, true);
    }
  };
}

interface Snapshot {
  el: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
}

function createInertController(target: HTMLElement): InertController {
  let snapshots: Snapshot[] = [];
  let locked = false;
  let previousOverflow: string | null = null;

  const mark = (el: HTMLElement) => {
    if (el === target) return;
    if (snapshots.some((snapshot) => snapshot.el === el)) return;
    snapshots.push({
      el,
      ariaHidden: el.getAttribute("aria-hidden"),
      inert: el.hasAttribute("inert")
    });
    el.setAttribute("aria-hidden", "true");
    if (!el.hasAttribute("inert")) {
      setInert(el, true);
    }
  };

  const markSiblings = (node: HTMLElement | null) => {
    const parent = node?.parentElement;
    if (!parent) return;
    Array.from(parent.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      if (child === node) return;
      mark(child);
    });
    markSiblings(parent);
  };

  return {
    activate() {
      if (locked) return;
      locked = true;
      snapshots = [];
      const root = document.documentElement;
      Array.from(root.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        if (child === target || child.contains(target)) return;
        mark(child);
      });
      markSiblings(target);
      const body = document.body;
      previousOverflow = body.style.overflow || null;
      body.style.overflow = "hidden";
      body.classList.add("modal-open");
    },
    deactivate() {
      if (!locked) return;
      locked = false;
      snapshots.forEach(({ el, ariaHidden, inert }) => {
        if (ariaHidden === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", ariaHidden);
        if (!inert) setInert(el, false);
      });
      snapshots = [];
      const body = document.body;
      if (previousOverflow !== null) {
        body.style.overflow = previousOverflow;
      } else {
        body.style.removeProperty("overflow");
      }
      body.classList.remove("modal-open");
      previousOverflow = null;
    }
  };
}

function createHoverIntentHandle(trigger: HTMLElement, options: {
  show: () => void;
  hide: () => void;
  openDelay: number;
  closeDelay: number;
  longPressDelay: number;
  onTouchToggle?: (active: boolean) => void;
}): HoverIntentHandle {
  const elements = new Set<HTMLElement>();
  let pointerActive = false;
  let focusActive = false;
  let touchHoldActive = false;
  let showTimer: number | null = null;
  let hideTimer: number | null = null;
  let longPressTimer: number | null = null;

  const { show, hide, openDelay, closeDelay, longPressDelay, onTouchToggle } = options;

  const resetTouchHold = () => {
    if (!touchHoldActive) return;
    touchHoldActive = false;
    onTouchToggle?.(false);
  };

  const clearTimer = (timer: number | null) => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
  };

  const clearShow = () => {
    clearTimer(showTimer);
    showTimer = null;
  };
  const clearHide = () => {
    clearTimer(hideTimer);
    hideTimer = null;
  };
  const clearLongPress = () => {
    clearTimer(longPressTimer);
    longPressTimer = null;
  };

  const scheduleShow = () => {
    clearShow();
    clearHide();
    if (openDelay <= 0) {
      show();
      return;
    }
    showTimer = window.setTimeout(() => {
      showTimer = null;
      show();
    }, openDelay);
  };

  const scheduleHide = () => {
    clearShow();
    clearHide();
    if (pointerActive || focusActive || touchHoldActive) return;
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      if (!pointerActive && !focusActive && !touchHoldActive) {
        resetTouchHold();
        hide();
      }
    }, closeDelay);
  };

  const beginLongPress = () => {
    touchHoldActive = true;
    onTouchToggle?.(true);
    show();
  };

  const attach = (element: HTMLElement) => {
    if (elements.has(element)) return;
    elements.add(element);

    element.addEventListener("pointerenter", (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerActive = true;
      scheduleShow();
    });

    element.addEventListener("pointerleave", (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerActive = false;
      scheduleHide();
    });
  };

  trigger.addEventListener("focus", () => {
    focusActive = true;
    show();
  });
  trigger.addEventListener("blur", () => {
    focusActive = false;
    scheduleHide();
  });

  trigger.addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    pointerActive = true;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressTimer = null;
      beginLongPress();
    }, longPressDelay);
  });

  const endTouchPointer = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    pointerActive = false;
    if (longPressTimer !== null) {
      clearLongPress();
      scheduleHide();
      return;
    }
    if (!touchHoldActive) {
      scheduleHide();
    }
  };

  trigger.addEventListener("pointerup", endTouchPointer);
  trigger.addEventListener("pointercancel", endTouchPointer);

  document.addEventListener("pointerdown", (event) => {
    if (!touchHoldActive) return;
    const target = event.target as Node | null;
    if (!target) return;
    for (const element of elements) {
      if (element.contains(target)) return;
    }
    resetTouchHold();
    scheduleHide();
  }, true);

  attach(trigger);

  return {
    addElement(element: HTMLElement) {
      attach(element);
      element.addEventListener("pointerdown", (event: PointerEvent) => {
        if (event.pointerType === "touch") {
          pointerActive = true;
        }
      });
      element.addEventListener("pointerup", (event: PointerEvent) => {
        if (event.pointerType === "touch") {
          pointerActive = false;
          scheduleHide();
        }
      });
      element.addEventListener("pointercancel", (event: PointerEvent) => {
        if (event.pointerType === "touch") {
          pointerActive = false;
          scheduleHide();
        }
      });
    },
    resetTouchHold,
    destroy() {
      clearShow();
      clearHide();
      clearLongPress();
      resetTouchHold();
      elements.clear();
    }
  };
}

export const helpers = {
  link(trigger: HTMLElement, target: HTMLElement) {
    ensureId(trigger, "automagica11y-t");
    ensureId(target, "automagica11y-p");
    if (!hasAriaOverride(trigger, "aria-controls")) {
      trigger.setAttribute("aria-controls", target.id);
    }
    if (!hasAriaOverride(target, "aria-labelledby")) {
      appendToken(target, "aria-labelledby", trigger.id);
    }
  },
  describe(trigger: HTMLElement, target: HTMLElement) {
    ensureId(target, "automagica11y-tip");
    if (!hasAriaOverride(trigger, "aria-describedby")) {
      appendToken(trigger, "aria-describedby", target.id);
    }
  },
  focusTrap(target: HTMLElement): FocusTrapController {
    let controller = focusTraps.get(target);
    if (!controller) {
      controller = createFocusTrapController(target);
      focusTraps.set(target, controller);
    }
    return controller;
  },
  restoreFocusOnClose(_trigger: HTMLElement, target: HTMLElement): RestoreFocusController {
    let controller = restoreFocusControllers.get(target);
    if (!controller) {
      controller = createRestoreFocusController(target);
      restoreFocusControllers.set(target, controller);
    }
    return controller;
  },
  closeOnEscape(target: HTMLElement): EscapeController {
    let controller = escapeControllers.get(target);
    if (!controller) {
      controller = createEscapeController(target);
      escapeControllers.set(target, controller);
    }
    return controller;
  },
  inertSiblingsWhileOpen(target: HTMLElement): InertController {
    let controller = inertControllers.get(target);
    if (!controller) {
      controller = createInertController(target);
      inertControllers.set(target, controller);
    }
    return controller;
  },
  hoverIntent(trigger: HTMLElement, target: HTMLElement, options: {
    show: () => void;
    hide: () => void;
    openDelay?: number;
    closeDelay?: number;
    longPressDelay?: number;
    onTouchToggle?: (active: boolean) => void;
  }): HoverIntentHandle {
    const handle = createHoverIntentHandle(trigger, {
      show: options.show,
      hide: options.hide,
      openDelay: options.openDelay ?? 0,
      closeDelay: options.closeDelay ?? 100,
      longPressDelay: options.longPressDelay ?? 550,
      onTouchToggle: options.onTouchToggle,
    });
    handle.addElement(target);
    return handle;
  },
  anchorFollow(trigger: HTMLElement, target: HTMLElement) {
    const event = new CustomEvent("automagica11y:context:anchor", {
      detail: { trigger, target }
    });
    trigger.dispatchEvent(event);
  },
  setRole(el: HTMLElement, role: string) {
    if (hasRoleOverride(el)) return;
    if (!el.hasAttribute("role")) {
      el.setAttribute("role", role);
    }
  },
  setAria(el: HTMLElement, name: string, value: string) {
    if (hasAriaOverride(el, name)) return;
    el.setAttribute(name, value);
  },
  setHiddenState,
};
