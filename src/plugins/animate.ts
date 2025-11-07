/** Track pending close animations so we can cancel if the element re-opens. */
type PendingClose = {
  trigger: HTMLElement;
  target: HTMLElement;
  timeout: number | null;
  cleanup: () => void;
  classes: string[] | null;
};

type ToggleEventDetail = {
  expanded?: boolean;
  trigger?: HTMLElement;
  target?: HTMLElement;
  __automagica11yAnimateProcessed?: boolean;
};

const pending = new WeakMap<HTMLElement, PendingClose>();

const DEFAULT_ANIMATION_CLASS = "automagica11y-animating";
const truthyOpenKeywords = [
  "open",
  "expanded",
  "shown",
  "active",
  "pressed",
  "true",
  "on",
] as const;
const falsyCloseKeywords = [
  "close",
  "closed",
  "collapsed",
  "hidden",
  "inactive",
  "unpressed",
  "false",
  "off",
] as const;

function parseTokenList(value: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // Fall through to whitespace parsing.
    }
  }
  return trimmed.split(/\s+/).filter(Boolean);
}

function getStateClasses(
  trigger: HTMLElement,
  target: HTMLElement,
  keywords: readonly string[]
) {
  const sources: HTMLElement[] = [trigger, target];
  for (const source of sources) {
    for (const keyword of keywords) {
      const attr = source.getAttribute(
        `data-automagica11y-target-class-${keyword}`
      );
      if (!attr) continue;
      const classes = parseTokenList(attr);
      if (classes.length) return classes;
    }
  }
  return [];
}

const getCloseClasses = (trigger: HTMLElement, target: HTMLElement) =>
  getStateClasses(trigger, target, falsyCloseKeywords);

const getOpenClasses = (trigger: HTMLElement, target: HTMLElement) =>
  getStateClasses(trigger, target, truthyOpenKeywords);

function removeAnimatingClasses(
  element: HTMLElement,
  classes?: string[] | null
) {
  if (classes?.length) {
    element.classList.remove(...classes);
    if (!classes.includes(DEFAULT_ANIMATION_CLASS)) {
      element.classList.remove(DEFAULT_ANIMATION_CLASS);
    }
    return;
  }
  element.classList.remove(DEFAULT_ANIMATION_CLASS);
}

/** Respect user motion preferences */
const prefersReducedMotion = () => {
  if (typeof matchMedia === "function") {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
};

/** Determine the longest transition/animation duration applied to the element */
function getDuration(el: HTMLElement) {
  const style = getComputedStyle(el);
  const parseTime = (value: string) => {
    return value
      .split(",")
      .map((token) => token.trim())
      .map((token) =>
        token.endsWith("ms") ? parseFloat(token) : parseFloat(token) * 1000
      )
      .filter((value) => !Number.isNaN(value));
  };

  const transitionDurations = parseTime(style.transitionDuration);
  const animationDurations = parseTime(style.animationDuration);

  const transitionDelays = parseTime(style.transitionDelay);
  const animationDelays = parseTime(style.animationDelay);

  const transitionTotal = Math.max(
    ...transitionDurations.map((d, i) => d + (transitionDelays[i] ?? 0)),
    0
  );
  const animationTotal = Math.max(
    ...animationDurations.map((d, i) => d + (animationDelays[i] ?? 0)),
    0
  );

  return Math.max(transitionTotal, animationTotal);
}

/** Attach listeners + timeout that call `done` when the animation completes */
function watchAnimation(element: HTMLElement, done: () => void) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    done();
  };

  const handleTransitionEnd = (event: Event) => {
    if (event.target !== element) return;
    finish();
  };

  const handleAnimationEnd = (event: Event) => {
    if (event.target !== element) return;
    finish();
  };

  const cleanup = () => {
    element.removeEventListener("transitionend", handleTransitionEnd);
    element.removeEventListener("animationend", handleAnimationEnd);
    element.removeEventListener("animationcancel", handleAnimationEnd);
  };

  element.addEventListener("transitionend", handleTransitionEnd);
  element.addEventListener("animationend", handleAnimationEnd);
  element.addEventListener("animationcancel", handleAnimationEnd);

  const duration = getDuration(element);
  const timeout = window.setTimeout(finish, duration + 64);

  return () => {
    cleanup();
    window.clearTimeout(timeout);
  };
}

/**
 * Wire up the animate plugin once. Consumers call this during boot. The listener
 * intercepts close events, waits for animations, then replays the event.
 */
export function registerAnimatePlugin() {
  document.addEventListener(
    "automagica11y:toggle",
    (event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as ToggleEventDetail | undefined;
      const trigger = detail?.trigger;
      const target = detail?.target;
      if (!trigger || !target) return;

      // Already handled once after animation -> let it bubble through.
      if (detail?.__automagica11yAnimateProcessed) return;

      const animateAttr = trigger.getAttribute("data-automagica11y-animate");
      if (!animateAttr) return;

      const el = animateAttr === "trigger" ? trigger : target;
      if (!(el instanceof HTMLElement)) return;

      if (detail?.expanded) {
        const pendingClose = pending.get(target);
        pendingClose?.cleanup();
        pending.delete(target);
        el.style.removeProperty("--automagica11y-animating");
        removeAnimatingClasses(el, pendingClose?.classes);
        return;
      }

      if (prefersReducedMotion()) return;

      const duration = getDuration(el);
      if (duration === 0) return;

      // Prevent the original close event from reaching the toggle handler.
      event.stopImmediatePropagation();
      event.preventDefault?.();

      el.style.setProperty("--automagica11y-animating", "closing");

      // Keep CSS transitions visible even when the element is logically closed.
      let revertHidden: (() => void) | null = null;
      let appliedClosingClasses: string[] | null = null;
      if (animateAttr !== "trigger") {
        const wasHidden = target.hasAttribute("hidden");
        const previousAriaHidden = target.getAttribute("aria-hidden");
        if (wasHidden) {
          target.removeAttribute("hidden");
          target.removeAttribute("aria-hidden");

          const openClasses = getOpenClasses(trigger, target);
          if (openClasses.length) el.classList.remove(...openClasses);
          // Force reflow so CSS transitions pick up after hidden removal.
          void target.offsetWidth;
          // Then add the configured (or default) animation class
          const closeClasses = getCloseClasses(trigger, target);
          appliedClosingClasses =
            closeClasses.length > 0 ? closeClasses : [DEFAULT_ANIMATION_CLASS];
          el.classList.add(...appliedClosingClasses);

          revertHidden = () => {
            target.hidden = true;
            if (previousAriaHidden === null)
              target.removeAttribute("aria-hidden");
            else target.setAttribute("aria-hidden", previousAriaHidden);
          };
        }
      }

      const cleanup = watchAnimation(el, () => {
        pending.delete(target);
        revertHidden?.();
        el.style.removeProperty("--automagica11y-animating");
        removeAnimatingClasses(el, appliedClosingClasses);
        trigger.dispatchEvent(
          new CustomEvent("automagica11y:toggle", {
            detail: {
              expanded: false,
              trigger,
              target,
              __automagica11yAnimateProcessed: true,
            },
            bubbles: true,
          })
        );
      });

      pending.set(target, {
        trigger,
        target,
        timeout: null,
        cleanup,
        classes: appliedClosingClasses,
      });
    },
    { capture: true }
  );
}
