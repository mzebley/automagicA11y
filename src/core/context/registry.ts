import { getDataAttribute, hasDataAttribute, prefixedSelector } from "@core/attributes";
import { dispatch } from "../events";
import { resolveAnchoredPlacement } from "../placement";
import type { PreferredAnchoredPlacement } from "../placement";
import type { helpers as HelpersMap } from "./helpers";

export type Capability =
  | "semantics"
  | "focusTrap"
  | "escToClose"
  | "ariaModal"
  | "inertSiblings"
  | "restoreFocus"
  | "hoverIntent"
  | "anchorFollow"
  | "rovingTabindex"
  | "typeahead"
  | "arrowNav";

export interface ContextSpec {
  ensureSemantics(trigger: HTMLElement, target: HTMLElement, h: Helpers): void;
  enableBehaviors(trigger: HTMLElement, target: HTMLElement, h: Helpers): void;
  capabilities: Capability[];
}

type Helpers = typeof HelpersMap;

type ToggleDetail = {
  expanded: boolean;
  trigger: HTMLElement;
  target: HTMLElement;
  targets?: HTMLElement[];
};

function getToggleController(trigger: HTMLElement) {
  return (trigger as HTMLElement & { __automagica11ySetState?: (open: boolean) => void })
    .__automagica11ySetState ?? null;
}

interface DialogBehaviorState {
  focusTrap: ReturnType<Helpers["focusTrap"]>;
  restoreFocus: ReturnType<Helpers["restoreFocusOnClose"]>;
  escape: ReturnType<Helpers["closeOnEscape"]>;
  inert: ReturnType<Helpers["inertSiblingsWhileOpen"]>;
  currentTrigger: HTMLElement | null;
}

const dialogState = new WeakMap<HTMLElement, DialogBehaviorState>();
const dialogBindings = new WeakMap<HTMLElement, Set<HTMLElement>>();
const dialogTriggerBindings = new WeakMap<HTMLElement, Set<HTMLElement>>();

function ensureDialogState(target: HTMLElement, h: Helpers): DialogBehaviorState {
  let state = dialogState.get(target);
  if (state) return state;
  state = {
    focusTrap: h.focusTrap(target),
    restoreFocus: h.restoreFocusOnClose(target, target),
    escape: h.closeOnEscape(target),
    inert: h.inertSiblingsWhileOpen(target),
    currentTrigger: null,
  };
  const onClick = (event: MouseEvent) => {
    const origin = event.target as HTMLElement | null;
    if (!origin) return;
    const closer = origin.closest(prefixedSelector("dialog-close"));
    if (closer && target.contains(closer)) {
      event.preventDefault();
      const trigger = state?.currentTrigger;
      const controller = trigger ? getToggleController(trigger) : null;
      controller?.(false);
      return;
    }
    if (origin === target && hasDataAttribute(target, "dialog-dismissable")) {
      event.preventDefault();
      const trigger = state?.currentTrigger;
      const controller = trigger ? getToggleController(trigger) : null;
      controller?.(false);
    }
  };
  target.addEventListener("click", onClick);
  dialogState.set(target, state);
  return state;
}

interface TooltipBehaviorState {
  hover: ReturnType<Helpers["hoverIntent"]> | null;
  dismissControls: HTMLElement[];
}

const tooltipState = new WeakMap<HTMLElement, TooltipBehaviorState>();
const tooltipBindings = new WeakMap<HTMLElement, WeakSet<HTMLElement>>();

function ensureTooltipState(target: HTMLElement): TooltipBehaviorState {
  let state = tooltipState.get(target);
  if (state) return state;
  state = { hover: null, dismissControls: [] };
  tooltipState.set(target, state);
  return state;
}

function parseDelay(trigger: HTMLElement, suffix: string, fallback: number) {
  const value = getDataAttribute(trigger, suffix);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePreferredPlacement(value: string | null): PreferredAnchoredPlacement {
  if (!value) return "auto";
  const normalized = value.toLowerCase();
  if (normalized === "auto" || normalized === "top" || normalized === "bottom" || normalized === "left" || normalized === "right") {
    return normalized as PreferredAnchoredPlacement;
  }
  return "auto";
}

// Contexts declare the semantics + behaviors layered on top of toggle triggers.
// Keep the capability matrix in README.md and docs/src/content/docs/guides/contexts.mdx
// synchronized with the data below so contributors and consumers can track parity and
// roadmap status from code or documentation.
export const Contexts: Record<string, ContextSpec> = {
  dialog: {
    capabilities: [
      "semantics",
      "ariaModal",
      "focusTrap",
      "escToClose",
      "inertSiblings",
      "restoreFocus",
    ],
    ensureSemantics(trigger, target, h) {
      h.link(trigger, target);
      h.setAria(trigger, "aria-haspopup", "dialog");
      h.setRole(target, "dialog");
      h.setAria(target, "aria-modal", "true");
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
    },
    enableBehaviors(trigger, target, h) {
      const state = ensureDialogState(target, h);
      let boundTargets = dialogBindings.get(trigger);
      if (!boundTargets) {
        boundTargets = new Set<HTMLElement>();
        dialogBindings.set(trigger, boundTargets);
      }
      if (boundTargets.has(target)) return;
      boundTargets.add(target);

      let boundTriggers = dialogTriggerBindings.get(target);
      if (!boundTriggers) {
        boundTriggers = new Set<HTMLElement>();
        dialogTriggerBindings.set(target, boundTriggers);
      }
      boundTriggers.add(trigger);
      const handleToggle = (event: Event) => {
        if (!(event instanceof CustomEvent)) return;
        const detail = event.detail as ToggleDetail;
        if (!detail || detail.target !== target) return;
          if (detail.expanded) {
            const siblings = dialogTriggerBindings.get(target);
            if (siblings) {
              for (const candidate of siblings) {
                if (candidate === trigger) continue;
                const controller = getToggleController(candidate);
                controller?.(false);
              }
            }
            state.currentTrigger = trigger;
            state.restoreFocus.capture(trigger);
            state.inert.activate();
            state.focusTrap.activate();
            state.escape.activate(trigger);
          } else {
            state.escape.deactivate();
            state.focusTrap.deactivate();
            state.inert.deactivate();
          state.restoreFocus.restore();
          state.currentTrigger = null;
        }
      };
      trigger.addEventListener("automagica11y:toggle", handleToggle as EventListener);
    }
  },
  tooltip: {
    capabilities: ["semantics", "hoverIntent", "anchorFollow"],
    ensureSemantics(trigger, target, h) {
      h.describe(trigger, target);
      h.setRole(target, "tooltip");
    },
    enableBehaviors(trigger, target, h) {
      const state = ensureTooltipState(target);
      let boundTargets = tooltipBindings.get(trigger);
      if (!boundTargets) {
        boundTargets = new WeakSet<HTMLElement>();
        tooltipBindings.set(trigger, boundTargets);
      }
      if (boundTargets.has(target)) return;
      boundTargets.add(target);
      const openDelay = parseDelay(trigger, "tooltip-open-delay", 0);
      const closeDelay = parseDelay(trigger, "tooltip-close-delay", 100);
      const longPressDelay = parseDelay(trigger, "tooltip-long-press", 550);
      const preferredPlacement = parsePreferredPlacement(getDataAttribute(trigger, "tooltip-position"));
      const controller = getToggleController(trigger);
      if (!controller) return;

      const initialPlacement = preferredPlacement === "auto" ? "bottom" : preferredPlacement;
      target.setAttribute("data-automagica11y-tooltip-placement", initialPlacement);

      const show = () => {
        controller(true);
        const resolvedPlacement = resolveAnchoredPlacement(trigger, target, preferredPlacement);
        target.setAttribute("data-automagica11y-tooltip-placement", resolvedPlacement);
        h.anchorFollow(trigger, target);
      };
      const hide = () => {
        state.hover?.resetTouchHold();
        controller(false);
      };

      const hoverHandle = h.hoverIntent(trigger, target, {
        show,
        hide,
        openDelay,
        closeDelay,
        longPressDelay,
        onTouchToggle(active) {
          if (!active) return;
          show();
        }
      });
      state.hover = hoverHandle;

      const dismissControls = Array.from(
        target.querySelectorAll<HTMLElement>(prefixedSelector("tooltip-dismiss"))
      );
      state.dismissControls = dismissControls;
      dismissControls.forEach((dismiss) => {
        if (dismiss instanceof HTMLButtonElement && !dismiss.hasAttribute("type")) {
          dismiss.setAttribute("type", "button");
        }
        const close = () => hide();
        dismiss.addEventListener("click", close);
        dismiss.addEventListener("keydown", (event) => {
          if (event instanceof KeyboardEvent && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            close();
          }
        });
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hide();
        }
      });

      const forwardToggle = (event: Event) => {
        if (!(event instanceof CustomEvent)) return;
        const detail = event.detail as ToggleDetail;
        if (!detail || detail.target !== target) return;
        dispatch(trigger, "automagica11y:tooltip:toggle", detail);
        dispatch(trigger, detail.expanded ? "automagica11y:tooltip:shown" : "automagica11y:tooltip:hidden", {
          trigger,
          target
        });
        if (!detail.expanded) {
          state.hover?.resetTouchHold();
        }
      };
      trigger.addEventListener("automagica11y:toggle", forwardToggle as EventListener);
    }
  },
  menu: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "menu");
    },
    enableBehaviors() {
      // TODO: implement interactive menu behaviors.
    }
  },
  accordion: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "region");
    },
    enableBehaviors() {
      // TODO: implement accordion behaviors.
    }
  },
  disclosure: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "region");
    },
    enableBehaviors() {
      // TODO: implement disclosure behaviors.
    }
  },
  listbox: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "listbox");
    },
    enableBehaviors() {
      // TODO: implement listbox behaviors.
    }
  },
  tablist: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "tablist");
    },
    enableBehaviors() {
      // TODO: implement tablist behaviors.
    }
  },
  tree: {
    capabilities: ["semantics"],
    ensureSemantics(_trigger, target, h) {
      h.setRole(target, "tree");
    },
    enableBehaviors() {
      // TODO: implement tree behaviors.
    }
  },
};
