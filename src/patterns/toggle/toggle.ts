import { createClassToggler } from "@core/classes";
import { ensureId, setAriaExpanded } from "@core/attributes";
import { setHiddenState } from "@core/styles";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

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
  const targetSel = trigger.getAttribute("data-automagica11y-toggle");
  if (!targetSel) return;
  const target = document.querySelector<HTMLElement>(targetSel);
  if (!target) return;
  (
    trigger as HTMLElement & { __automagica11yInitialized?: boolean }
  ).__automagica11yInitialized = true;

  // Ensure both trigger and target have IDs so ARIA relationships can be wired reliably.
  ensureId(trigger, "automagica11y-t");
  ensureId(target, "automagica11y-p");

  // Establish the baseline ARIA contract and initial collapsed state.
  trigger.setAttribute("aria-controls", target.id);
  setAriaExpanded(trigger, false);
  target.setAttribute("aria-labelledby", trigger.id);
  setHiddenState(target, true);

  const isNativeButton = trigger.tagName === "BUTTON";
  // Non-button triggers need button semantics and keyboard focusability.
  if (!isNativeButton) {
    if (!trigger.hasAttribute("role")) trigger.setAttribute("role", "button");
    if (!trigger.hasAttribute("tabindex"))
      (trigger as HTMLElement).tabIndex = 0;
    if (!(trigger as HTMLElement).style.cursor)
      (trigger as HTMLElement).style.cursor = "pointer";
  }

  // Apply the initial class state so author-defined hooks reflect "closed".
  const applyClasses = createClassToggler(trigger);
  applyClasses(false, target);

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
    const timeoutId = globalThis.setTimeout?.(callback, 32) ?? setTimeout(callback, 32);
    return () => {
      if (typeof globalThis.clearTimeout === "function") {
        globalThis.clearTimeout(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
    };
  };

  const dispatchToggle = (expanded: boolean) => {
    const evt = new CustomEvent("automagica11y:toggle", {
      detail: { expanded, trigger, target },
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    trigger.dispatchEvent(evt);
    return evt;
  };

  // Centralized state setter keeps ARIA, classes, DOM visibility, and events in sync.
  const setState = (open: boolean) => {
    setAriaExpanded(trigger, open);
    clearPendingOpenFrame();

    if (!open) {
      applyClasses(false, target);
      // Allow plugins to cancel closing before we hide the target.
      const evt = dispatchToggle(false);
      if (evt.defaultPrevented) return;
      setHiddenState(target, true);
      return;
    }

    setHiddenState(target, false);
    if (prefersReducedMotion()) {
      // Skip the double-rAF deferral when users prefer reduced motion.
      applyClasses(true, target);
    } else {
      cancelPendingOpenFrame = queueAfterPaint(() => {
        cancelPendingOpenFrame = null;
        // Flush layout so transitions see the pre-open styles before swapping classes.
        void target.offsetWidth;
        applyClasses(true, target);
      });
    }
    dispatchToggle(true);
  };

  // Basic toggle helper reads existing ARIA state and flips it.
  const toggle = () =>
    setState(trigger.getAttribute("aria-expanded") !== "true");

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

  // Announce readiness so plugins or host applications can hook into initialized toggles.
  trigger.dispatchEvent(
    new CustomEvent("automagica11y:ready", { detail: { trigger, target } })
  );

  return function destroy() {
    clearPendingOpenFrame();
    trigger.removeEventListener("click", toggle);
    if (onKeydown) trigger.removeEventListener("keydown", onKeydown);
    (
      trigger as HTMLElement & { __automagica11yInitialized?: boolean }
    ).__automagica11yInitialized = false;
  };
}
