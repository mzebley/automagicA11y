import { createClassToggler } from "../../core/classes";
import {
  ensureId,
  setAriaExpanded,
  getDataAttribute,
  hasDataAttribute,
  prefixedSelector,
  appendToken,
} from "../../core/attributes";
import { setHiddenState } from "../../core/styles";
import { dispatch } from "../../core/events";
import { applyContext, type ContextMode } from "../../core/context/apply";
import { normalizeContext } from "../../core/context/normalize";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;

/**
 * Hydrates a toggle trigger so it controls its target element with accessible defaults.
 * Expects the trigger to provide a `data-automagica11y-toggle` selector that resolves to a target.
 */
export function initToggle(trigger: Element) {
  // Guard early: patterns only run against real HTMLElements.
  if (!(trigger instanceof HTMLElement)) return;
  if ((trigger as HTMLElement & { __automagica11yInitialized?: boolean })
    .__automagica11yInitialized) {
    return;
  }

  // Read the selector for the companion target and resolve it in the document.
  const targetSel = getDataAttribute(trigger, "toggle");
  if (targetSel === null || targetSel === "") return;
  const targetNodeList = document.querySelectorAll<HTMLElement>(targetSel);
  const targets = Array.from(targetNodeList).filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (targets.length === 0) return;
  (
    trigger as HTMLElement & { __automagica11yInitialized?: boolean }
  ).__automagica11yInitialized = true;

  const contextAttr = getDataAttribute(trigger, "context");
  const contextValue = contextAttr ? contextAttr.trim() : null;
  const canonicalContext = contextValue ? normalizeContext(contextValue) : null;
  const treatAsTooltip =
    canonicalContext === "tooltip" || (!contextValue && hasDataAttribute(trigger, "tooltip"));

  let contextMode: ContextMode = "all";
  const modeAttr = getDataAttribute(trigger, "context-mode");
  if (modeAttr) {
    const normalizedMode = modeAttr.trim().toLowerCase();
    if (
      normalizedMode === "all" ||
      normalizedMode === "semantics-only" ||
      normalizedMode === "behaviors-only"
    ) {
      contextMode = normalizedMode as ContextMode;
    }
  }

  // Ensure both trigger and target have IDs so ARIA relationships can be wired reliably.
  ensureId(trigger, "automagica11y-t");
  targets.forEach((t) => ensureId(t, `automagica11y-p`));

  // Establish the baseline ARIA contract and initial collapsed state (supports multiple targets).
  const managedTargetIds = targets.map((t) => t.id);
  const manageAriaControls = !treatAsTooltip;
  if (manageAriaControls) {
    trigger.setAttribute("aria-controls", managedTargetIds.join(" "));
  } else {
    const existingControls = trigger.getAttribute("aria-controls");
    if (existingControls) {
      const existingTokens = existingControls.split(/\s+/).filter(Boolean);
      if (
        existingTokens.length === managedTargetIds.length &&
        existingTokens.every((token) => managedTargetIds.includes(token))
      ) {
        trigger.removeAttribute("aria-controls");
      }
    }
  }
  const manageAriaExpanded = !treatAsTooltip;
  if (manageAriaExpanded) {
    setAriaExpanded(trigger, false);
  } else {
    const currentExpanded = trigger.getAttribute("aria-expanded");
    if (currentExpanded === "false" || currentExpanded === "true" || currentExpanded === "") {
      trigger.removeAttribute("aria-expanded");
    }
  }
  targets.forEach((t) => {
    appendToken(t, "aria-labelledby", trigger.id);
    setHiddenState(t, true);
  });

  const isNativeButton = trigger.tagName === "BUTTON";
  // Non-button triggers need button semantics and keyboard focusability.
  if (!isNativeButton) {
    if (!trigger.hasAttribute("role")) trigger.setAttribute("role", "button");
    if (!trigger.hasAttribute("tabindex"))
      (trigger as HTMLElement).tabIndex = 0;
    if ((trigger as HTMLElement).style.cursor === "")
      (trigger as HTMLElement).style.cursor = "pointer";
  }

  // Apply the initial class state so author-defined hooks reflect "closed".
  const applyClasses = createClassToggler(trigger);
  targets.forEach((t) => applyClasses(false, t));

  let expanded = false;
  (trigger as HTMLElement & { __automagica11yExpanded?: boolean }).__automagica11yExpanded = expanded;
  let cancelPendingOpenFrame: (() => void) | null = null;
  const clearPendingOpenFrame = () => {
    cancelPendingOpenFrame?.();
    cancelPendingOpenFrame = null;
  };
  const queueAfterPaint = (callback: () => void) => {
    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function" &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      let raf1: number | null = null;
      let raf2: number | null = null;
      const cancel = () => {
        if (raf1 !== null) window.cancelAnimationFrame(raf1);
        if (raf2 !== null) window.cancelAnimationFrame(raf2);
      };
      raf1 = window.requestAnimationFrame(() => {
        raf1 = null;
        raf2 = window.requestAnimationFrame(() => {
          raf2 = null;
          callback();
        });
      });
      return cancel;
    }
    const timeoutId = setTimeout(callback, 32);
    return () => {
      if (typeof globalThis.clearTimeout === "function") {
        globalThis.clearTimeout(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
    };
  };

  const dispatchToggle = (expanded: boolean) =>
    dispatch(
      trigger,
      "automagica11y:toggle",
      { expanded, trigger, target: targets[0], targets },
      { cancelable: true }
    );

  // Centralized state setter keeps ARIA, classes, DOM visibility, and events in sync.
  const setState = (open: boolean) => {
    expanded = open;
    (trigger as HTMLElement & { __automagica11yExpanded?: boolean }).__automagica11yExpanded = open;
    if (manageAriaExpanded) {
      setAriaExpanded(trigger, open);
    }
    clearPendingOpenFrame();

    if (!open) {
      targets.forEach((t) => applyClasses(false, t));
      // Allow plugins to cancel closing before we hide the target.
      const evt = dispatchToggle(false);
      if (evt.defaultPrevented) return;
      targets.forEach((t) => setHiddenState(t, true));
      // Notify observers that close completed locally.
      dispatch(trigger, "automagica11y:toggle:closed", { trigger, target: targets[0], targets });
      return;
    }

    targets.forEach((t) => setHiddenState(t, false));
    if (prefersReducedMotion()) {
      // Skip the double-rAF deferral when users prefer reduced motion.
      targets.forEach((t) => applyClasses(true, t));
    } else {
      cancelPendingOpenFrame = queueAfterPaint(() => {
        cancelPendingOpenFrame = null;
        // Flush layout so transitions see the pre-open styles before swapping classes.
        void targets[0].offsetWidth;
        targets.forEach((t) => applyClasses(true, t));
      });
    }
    dispatchToggle(true);
    // Notify observers after open completes.
    dispatch(trigger, "automagica11y:toggle:opened", { trigger, target: targets[0], targets });

    // If grouped, close siblings in the same group.
    const group = getDataAttribute(trigger, "group");
    if (group) {
      const others = Array.from(
        document.querySelectorAll<HTMLElement>(prefixedSelector("group"))
      ).filter((el) => el !== trigger && getDataAttribute(el, "group") === group);
      others.forEach((other) => {
        const controller = (other as HTMLElement & { __automagica11ySetState?: (open: boolean) => void })
          .__automagica11ySetState;
        const otherState =
          (other as HTMLElement & { __automagica11yExpanded?: boolean }).__automagica11yExpanded;
        const isOpen = typeof otherState === "boolean"
          ? otherState
          : other.getAttribute("aria-expanded") === "true";
        if (controller && isOpen) {
          controller(false);
        }
      });
    }
  };

  // Basic toggle helper reads existing ARIA state and flips it.
  const toggle = () => setState(!expanded);

  // Click activates the toggle for mouse and touch interactions.
  trigger.addEventListener("click", toggle);

  let onKeydown: ((e: KeyboardEvent) => void) | null = null;
  if (!isNativeButton) {
    // Space/Enter support classic button semantics when the trigger is not a native button.
    onKeydown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
    };
    trigger.addEventListener("keydown", onKeydown);
  }

  // Expose a minimal controller for grouped interactions
  (trigger as HTMLElement & { __automagica11ySetState?: (open: boolean) => void }).__automagica11ySetState = setState;

  if (contextValue) {
    const canonical = canonicalContext ?? contextValue.toLowerCase();
    const warnDuplicate = (alias: string) => {
      const key = `context-${alias}`;
      const registryHolder = trigger as HTMLElement & { __automagica11yWarnings?: Set<string> };
      const registry = registryHolder.__automagica11yWarnings ?? new Set<string>();
      if (!registryHolder.__automagica11yWarnings) {
        registryHolder.__automagica11yWarnings = registry;
      }
      if (registry.has(key)) return;
      registry.add(key);
      console.warn(
        `[automagica11y] data-automagica11y-${alias} and data-automagica11y-context="${alias}" are equivalent; prefer the context attribute.`
      );
    };
    if (canonical === "dialog" && hasDataAttribute(trigger, "dialog")) {
      warnDuplicate("dialog");
    }
    if (canonical === "tooltip" && hasDataAttribute(trigger, "tooltip")) {
      warnDuplicate("tooltip");
    }
    targets.forEach((target) => applyContext(trigger, target, contextValue, contextMode));
  }

  // Announce readiness so plugins or host applications can hook into initialized toggles.
  trigger.dispatchEvent(
    new CustomEvent("automagica11y:ready", { detail: { trigger, target: targets[0], targets } })
  );

  return function destroy() {
    clearPendingOpenFrame();
    trigger.removeEventListener("click", toggle);
    if (onKeydown) trigger.removeEventListener("keydown", onKeydown);
    (
      trigger as HTMLElement & { __automagica11yInitialized?: boolean }
    ).__automagica11yInitialized = false;
    delete (trigger as HTMLElement & { __automagica11ySetState?: (open: boolean) => void }).__automagica11ySetState;
    delete (trigger as HTMLElement & { __automagica11yExpanded?: boolean }).__automagica11yExpanded;
  };
}

/** Return whether a hydrated toggle trigger is currently expanded. */
export function isToggleOpen(trigger: HTMLElement): boolean {
  const aria = trigger.getAttribute("aria-expanded");
  if (aria === "true") return true;
  if (aria === "false") return false;
  const marker = (trigger as HTMLElement & { __automagica11yExpanded?: boolean }).__automagica11yExpanded;
  return marker ?? false;
}

/** Resolve the target element controlled by a toggle trigger. */
export function getToggleTarget(trigger: HTMLElement): HTMLElement | null {
  const fromData = getDataAttribute(trigger, "toggle");
  if (fromData) {
    const el = document.querySelector<HTMLElement>(fromData);
    if (el) return el;
  }
  const id = trigger.getAttribute("aria-controls");
  if (id) {
    // if multiple, return the first
    const firstId = id.trim().split(/\s+/)[0];
    return document.getElementById(firstId);
  }
  return null;
}
