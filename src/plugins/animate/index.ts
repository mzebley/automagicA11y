import { getClassConfig } from "@core/classes";
import { setHiddenState } from "@core/styles";

/** Track pending close animations so we can cancel if the element re-opens. */
type PendingClose = {
  trigger: HTMLElement;
  target: HTMLElement;
  watched: HTMLElement;
  timeout: number | null;
  cleanup: () => void;
  classes: string[] | null;
  auxWatchedAnimating: boolean;
};

type ToggleEventDetail = {
  expanded?: boolean;
  trigger?: HTMLElement;
  target?: HTMLElement;
  __automagica11yAnimateProcessed?: boolean;
};

const pending = new WeakMap<HTMLElement, PendingClose>();

const DEFAULT_ANIMATION_CLASS = "automagica11y-animating";
type AnimatedSide = "trigger" | "target";

function collectClassesForState(
  expanded: boolean,
  side: AnimatedSide,
  trigger: HTMLElement,
  target: HTMLElement
) {
  const classes = new Set<string>();
  const sources: HTMLElement[] = [trigger, target];
  for (const source of sources) {
    const cfg = getClassConfig(source, {
      applyTriggerFallback: source === trigger,
    });
    const list = expanded ? cfg[side].true : cfg[side].false;
    for (const className of list) classes.add(className);
  }
  return [...classes];
}

const getOpenClasses = (
  side: AnimatedSide,
  trigger: HTMLElement,
  target: HTMLElement
) => collectClassesForState(true, side, trigger, target);

const getCloseClasses = (
  side: AnimatedSide,
  trigger: HTMLElement,
  target: HTMLElement
) => collectClassesForState(false, side, trigger, target);

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

const toMilliseconds = (value: CSSNumberish | null | undefined) => {
  if (typeof value === "number") return value;
  if (value && typeof (value as CSSNumericValue).to === "function") {
    try {
      const msValue = (value as CSSNumericValue).to("ms");
      if ("value" in msValue) return msValue.value;
    } catch {
      // Ignore conversion errors and fall through to zero.
    }
  }
  return 0;
};

/** Determine the longest transition/animation duration applied to the element */
function getDuration(el: HTMLElement) {
  const style = getComputedStyle(el);
  const toMs = (token: string) => {
    if (!token) return 0;
    const value = parseFloat(token);
    if (Number.isNaN(value)) return 0;
    return token.trim().toLowerCase().endsWith("ms") ? value : value * 1000;
  };
  const parseTimeList = (value: string) =>
    value
      .split(",")
      .map((token) => token.trim())
      .map(toMs);
  const parseIterationList = (value: string) =>
    value
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .map((token) => {
        if (!token || token === "initial" || token === "inherit") return 1;
        if (token === "infinite") return 1;
        const parsed = parseFloat(token);
        return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
      });
  const durations = parseTimeList(style.transitionDuration);
  const delays = parseTimeList(style.transitionDelay);
  const properties = style.transitionProperty
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const transitionCount = Math.max(
    durations.length,
    delays.length,
    properties.length
  );

  let transitionTotal = 0;
  for (let i = 0; i < transitionCount; i += 1) {
    const duration = durations.length ? durations[i % durations.length] : 0;
    const delay = delays.length ? delays[i % delays.length] : 0;
    const property = properties.length
      ? properties[i % properties.length]
      : "all";
    if (property === "none") continue;
    const total = Math.max(0, duration + delay);
    transitionTotal = Math.max(transitionTotal, total);
  }

  const animationDurations = parseTimeList(style.animationDuration);
  const animationDelays = parseTimeList(style.animationDelay);
  const animationIterations = parseIterationList(
    style.animationIterationCount
  );
  const animationCount = Math.max(
    animationDurations.length,
    animationDelays.length,
    animationIterations.length
  );

  let animationTotal = 0;
  for (let i = 0; i < animationCount; i += 1) {
    const duration = animationDurations.length
      ? animationDurations[i % animationDurations.length]
      : 0;
    const delay = animationDelays.length
      ? animationDelays[i % animationDelays.length]
      : 0;
    const iterations = animationIterations.length
      ? animationIterations[i % animationIterations.length]
      : 1;
    const totalAnim = Math.max(0, duration * iterations + delay);
    animationTotal = Math.max(animationTotal, totalAnim);
  }

  // If all animations are paused, they will not complete; treat as zero for fallback purposes.
  const playStates = style.animationPlayState
    ? style.animationPlayState.split(",").map((s) => s.trim().toLowerCase())
    : [];
  if (playStates.length && playStates.every((s) => s === "paused")) {
    animationTotal = 0;
  }

  return Math.max(transitionTotal, animationTotal);
}

/** Attach listeners + timeout that call `done` when the animation completes */
function watchAnimation(element: HTMLElement, done: () => void) {
  let finished = false;
  let activeTransitions = 0;
  let activeAnimations = 0;
  let timeoutId: number | null = null;
  const transitionRunAhead = new Map<string, number>();

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    done();
  };

  const maybeFinish = () => {
    if (activeTransitions === 0 && activeAnimations === 0) {
      finish();
    }
  };

  const trackRunAhead = (key: string) => {
    const count = transitionRunAhead.get(key) ?? 0;
    transitionRunAhead.set(key, count + 1);
  };

  const consumeRunAhead = (key: string) => {
    const count = transitionRunAhead.get(key);
    if (!count) return false;
    if (count === 1) transitionRunAhead.delete(key);
    else transitionRunAhead.set(key, count - 1);
    return true;
  };

  const handleTransitionRun = (event: TransitionEvent) => {
    if (event.target !== element) return;
    const key = event.propertyName || "__all";
    trackRunAhead(key);
    activeTransitions += 1;
  };

  const handleTransitionStart = (event: TransitionEvent) => {
    if (event.target !== element) return;
    const key = event.propertyName || "__all";
    if (consumeRunAhead(key)) return;
    activeTransitions += 1;
  };

  const handleTransitionComplete = (event: TransitionEvent) => {
    if (event.target !== element) return;
    if (activeTransitions > 0) activeTransitions -= 1;
    maybeFinish();
  };

  const handleAnimationStart = (event: AnimationEvent) => {
    if (event.target !== element) return;
    activeAnimations += 1;
  };

  const handleAnimationEnd = (event: AnimationEvent) => {
    if (event.target !== element) return;
    if (activeAnimations > 0) activeAnimations -= 1;
    maybeFinish();
  };

  const handleAnimationCancel = (event: AnimationEvent) => {
    if (event.target !== element) return;
    if (activeAnimations > 0) activeAnimations -= 1;
    maybeFinish();
  };

  const cleanup = () => {
    element.removeEventListener("transitionrun", handleTransitionRun);
    element.removeEventListener("transitionstart", handleTransitionStart);
    element.removeEventListener("transitionend", handleTransitionComplete);
    element.removeEventListener("transitioncancel", handleTransitionComplete);
    element.removeEventListener("animationstart", handleAnimationStart);
    element.removeEventListener("animationend", handleAnimationEnd);
    element.removeEventListener("animationcancel", handleAnimationCancel);
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  element.addEventListener("transitionrun", handleTransitionRun);
  element.addEventListener("transitionstart", handleTransitionStart);
  element.addEventListener("transitionend", handleTransitionComplete);
  element.addEventListener("transitioncancel", handleTransitionComplete);
  element.addEventListener("animationstart", handleAnimationStart);
  element.addEventListener("animationend", handleAnimationEnd);
  element.addEventListener("animationcancel", handleAnimationCancel);

  let fallbackDuration = getDuration(element);
  if (typeof element.getAnimations === "function") {
    const animations = element.getAnimations({ subtree: false });
    if (animations.length) {
      const animationEndTime = animations.reduce((max, animation) => {
        const timing = animation.effect?.getComputedTiming();
        const endTime = toMilliseconds(timing?.endTime);
        return Math.max(max, endTime);
      }, 0);
      fallbackDuration = Math.max(fallbackDuration, animationEndTime);
      Promise.all(animations.map((animation) => animation.finished))
        .then(() => finish())
        .catch(() => finish());
    }
  }
  timeoutId = window.setTimeout(finish, fallbackDuration + 75);

  return () => {
    cleanup();
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
      const attr = animateAttr.trim();
      // Element used for class manipulation (defaults to target)
      let elForClasses: HTMLElement = target;
      // Element whose animations/transitions we will watch
      let watched: HTMLElement = target;
      let animatedSide: AnimatedSide = "target";
      if (attr === "trigger") {
        elForClasses = trigger;
        watched = trigger;
        animatedSide = "trigger";
      } else if (attr === "target" || attr === "") {
        // already defaulted
      } else {
        // Treat as selector; resolve relative to the document
        const resolved = document.querySelector<HTMLElement>(attr);
        if (resolved) {
          watched = resolved;
          // We still apply open/close classes to the target by default, unless
          // authors define class mapping on the trigger; keep animatedSide = "target".
        }
      }

      if (detail?.expanded) {
        const pendingClose = pending.get(target);
        pendingClose?.cleanup();
        pending.delete(target);
        elForClasses.style.removeProperty("--automagica11y-animating");
        removeAnimatingClasses(elForClasses, pendingClose?.classes);
        if (pendingClose?.watched && pendingClose.watched !== elForClasses) {
          pendingClose.watched.style.removeProperty("--automagica11y-animating");
          // Only remove the default animating class on the watched element
          pendingClose.watched.classList.remove(DEFAULT_ANIMATION_CLASS);
        }
        return;
      }

      // Prevent the original close event from reaching the toggle handler.
      event.stopImmediatePropagation();
      event.preventDefault?.();

      const existingPending = pending.get(target);
      if (existingPending) {
        existingPending.cleanup();
        pending.delete(target);
        removeAnimatingClasses(elForClasses, existingPending.classes);
      }

      elForClasses.style.setProperty("--automagica11y-animating", "closing");
      if (watched !== elForClasses) {
        watched.style.setProperty("--automagica11y-animating", "closing");
      }

      // Keep CSS transitions visible even when the element is logically closed.
      let revertHidden: (() => void) | null = null;
      let appliedClosingClasses: string[] | null = null;
      if (animateAttr !== "trigger") {
        const wasHidden = target.hasAttribute("hidden");
        const previousAriaHidden = target.getAttribute("aria-hidden");
        if (wasHidden) {
          target.removeAttribute("hidden");
          target.removeAttribute("aria-hidden");

          revertHidden = () => {
            target.hidden = true;
            if (previousAriaHidden === null)
              target.removeAttribute("aria-hidden");
            else target.setAttribute("aria-hidden", previousAriaHidden);
          };
        }
      }

      const openClasses = getOpenClasses(animatedSide, trigger, target);
      if (openClasses.length) elForClasses.classList.remove(...openClasses);
      // Force layout so class changes are acknowledged before closing styles.
      void elForClasses.offsetWidth;

      const closeClasses = getCloseClasses(animatedSide, trigger, target);
      appliedClosingClasses =
        closeClasses.length > 0 ? closeClasses : [DEFAULT_ANIMATION_CLASS];
      elForClasses.classList.add(...appliedClosingClasses);
      let auxWatchedAnimating = false;
      if (watched !== elForClasses) {
        watched.classList.add(DEFAULT_ANIMATION_CLASS);
        auxWatchedAnimating = true;
      }

      let rafId: number | null = null;
      let cancelWatch: (() => void) | null = null;
      let finalized = false;

      const finalizeClose = () => {
        if (finalized) return;
        finalized = true;
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        cancelWatch?.();
        cancelWatch = null;
        pending.delete(target);
        revertHidden?.();
        elForClasses.style.removeProperty("--automagica11y-animating");
        if (!appliedClosingClasses || appliedClosingClasses.includes(DEFAULT_ANIMATION_CLASS)) {
          removeAnimatingClasses(elForClasses, appliedClosingClasses);
        }
        if (watched !== elForClasses) {
          watched.style.removeProperty("--automagica11y-animating");
          watched.classList.remove(DEFAULT_ANIMATION_CLASS);
        }
        // Apply the actual hide now that visual completion has finished.
        setHiddenState(target, true);

        // Notify listeners that close animations have fully completed.
        trigger.dispatchEvent(
          new CustomEvent("automagica11y:animation-done", {
            detail: { trigger, target, watched, phase: "close" },
            bubbles: true,
            composed: true,
          })
        );

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
      };

      const startWatch = () => {
        rafId = null;
        const style = getComputedStyle(watched);
        if (prefersReducedMotion() || style.transitionProperty === "none" || getDuration(watched) === 0) {
          finalizeClose();
          return;
        }
        // Double-rAF to ensure closing classes are applied and a paint occurs before we start listening.
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          const watcherCleanup = watchAnimation(watched, finalizeClose);
          cancelWatch = () => {
            watcherCleanup();
            cancelWatch = null;
          };
        });
      };

      // Delay watcher hookup one frame so the closing classes take effect visually.
      rafId = window.requestAnimationFrame(startWatch);

      pending.set(target, {
        trigger,
        target,
        watched,
        timeout: null,
        cleanup: () => {
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
          cancelWatch?.();
        },
        classes: appliedClosingClasses,
        auxWatchedAnimating,
      });
    },
    { capture: true }
  );
}
