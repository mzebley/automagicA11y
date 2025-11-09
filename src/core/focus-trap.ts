import { getDataAttribute } from "./attributes";
import { dispatch } from "./events";
import { focusElement, getFocusableIn, isFocusable } from "./focus";

/** Options that control focus trap behavior. */
export interface FocusTrapOptions {
  initial?: "first" | "last" | string;
  returnFocus?: boolean;
  escapeDismiss?: boolean;
}

const SENTINEL_STYLE = [
  "position: fixed",
  "width: 1px",
  "height: 1px",
  "margin: -1px",
  "padding: 0",
  "border: 0",
  "clip: rect(0 0 0 0)",
  "clip-path: inset(50%)",
  "overflow: hidden",
  "opacity: 0",
  "pointer-events: none",
  "white-space: nowrap",
].join(";");

class FocusTrapManager {
  private stack: FocusTrapInstance[] = [];

  push(trap: FocusTrapInstance) {
    const current = this.peek();
    if (current === trap) return;
    current?.pause();
    this.stack.push(trap);
    trap.activate();
  }

  remove(trap: FocusTrapInstance) {
    const index = this.stack.indexOf(trap);
    if (index === -1) return;
    const wasTop = index === this.stack.length - 1;
    this.stack.splice(index, 1);
    trap.deactivate();
    if (wasTop) {
      this.peek()?.resume();
    }
  }

  isTop(trap: FocusTrapInstance) {
    return this.peek() === trap;
  }

  private peek() {
    return this.stack[this.stack.length - 1] ?? null;
  }
}

const manager = new FocusTrapManager();

function normalizeInitial(initial: FocusTrapOptions["initial"]): "first" | "last" | string {
  if (typeof initial !== "string" || initial.trim() === "") return "first";
  const normalized = initial.trim().toLowerCase();
  if (normalized === "first" || normalized === "last") {
    return normalized;
  }
  return initial;
}

function hasHiddenAncestor(el: HTMLElement) {
  const doc = el.ownerDocument ?? document;
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute("hidden")) return true;
    if (current.getAttribute("aria-hidden") === "true") return true;
    if (current.hasAttribute("disabled")) return true;
    if (current.hasAttribute("inert")) return true;
    if ("inert" in current && (current as HTMLElement & { inert: boolean }).inert) return true;

    const view = doc.defaultView;
    if (view) {
      const style = view.getComputedStyle(current);
      if (style.display === "none") return true;
      if (style.visibility === "hidden" || style.visibility === "collapse") return true;
    }

    if (current.parentElement) {
      current = current.parentElement;
      continue;
    }

    const root = current.getRootNode();
    if (root instanceof ShadowRoot) {
      current = root.host instanceof HTMLElement ? root.host : null;
    } else {
      current = null;
    }
  }
  return false;
}

/**
 * Determine if a focus trap container should be considered visible.
 * Visibility is blocked when the element or any ancestor is hidden,
 * aria-hidden, disabled, inert, or has computed styles that remove it
 * from the visual flow.
 */
export function isFocusTrapVisible(el: HTMLElement) {
  if (!el.isConnected) return false;
  if (hasHiddenAncestor(el)) return false;
  return true;
}

function matchesVisibility(el: HTMLElement) {
  return isFocusTrapVisible(el);
}

function tryFocus(element: HTMLElement | null) {
  if (!element) return;
  focusElement(element, { preventScroll: true, preserveTabIndex: true });
}

class FocusTrapInstance {
  private active = false;
  private paused = false;
  private invoker: HTMLElement | null = null;
  private releaseRequested = false;
  private releaseShouldReturn = true;
  private cleanupSentinels: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;
  private documentObserver: MutationObserver | null = null;

  constructor(private container: HTMLElement, private options: FocusTrapOptions) {}

  enable() {
    if (this.active) return;
    this.active = true;
    this.releaseShouldReturn = this.options.returnFocus !== false;
    this.invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    manager.push(this);
  }

  release(reason: "manual" | "escape" | "auto" = "manual", returnFocus = this.options.returnFocus !== false) {
    if (!this.active || this.releaseRequested) return;
    this.releaseRequested = true;
    this.releaseShouldReturn = returnFocus;
    manager.remove(this);
  }

  activate() {
    this.paused = false;
    this.ensureSentinels();
    this.observe();
    this.attachListeners();
    this.focusInitial();
  }

  deactivate() {
    this.detachListeners();
    this.disconnectObservers();
    this.removeSentinels();
    this.restoreFocus();
    this.active = false;
    this.releaseRequested = false;
    this.paused = false;
  }

  pause() {
    if (!this.active || this.paused) return;
    this.paused = true;
    this.detachListeners();
  }

  resume() {
    if (!this.active || !this.paused) return;
    this.paused = false;
    this.attachListeners();
  }

  focusInitial() {
    queueMicrotask(() => {
      if (!this.active || this.paused || !manager.isTop(this)) return;
      const strategy = normalizeInitial(this.options.initial);
      if (strategy === "last") {
        this.focusLast();
        return;
      }
      if (strategy !== "first") {
        const match = this.container.querySelector<HTMLElement>(strategy);
        if (match && isFocusable(match)) {
          tryFocus(match);
          return;
        }
      }
      this.focusFirst();
    });
  }

  private focusFirst() {
    const tabbables = this.getTabbables();
    if (tabbables.length > 0) {
      tryFocus(tabbables[0]);
    } else {
      tryFocus(this.container);
    }
  }

  private focusLast() {
    const tabbables = this.getTabbables();
    if (tabbables.length > 0) {
      tryFocus(tabbables[tabbables.length - 1]);
    } else {
      tryFocus(this.container);
    }
  }

  private getTabbables() {
    const list = getFocusableIn(this.container);
    return list.filter((el) => el !== this.container ? isFocusable(el) : true);
  }

  private ensureSentinels() {
    if (this.cleanupSentinels) return;
    const before = document.createElement("span");
    before.setAttribute("aria-hidden", "true");
    before.tabIndex = 0;
    before.style.cssText = SENTINEL_STYLE;
    before.addEventListener("focus", () => {
      if (!manager.isTop(this)) return;
      this.focusLast();
    });

    const after = document.createElement("span");
    after.setAttribute("aria-hidden", "true");
    after.tabIndex = 0;
    after.style.cssText = SENTINEL_STYLE;
    after.addEventListener("focus", () => {
      if (!manager.isTop(this)) return;
      this.focusFirst();
    });

    const parent = this.container.parentNode;
    if (parent instanceof Node) {
      parent.insertBefore(before, this.container);
      parent.insertBefore(after, this.container.nextSibling);
      this.cleanupSentinels = () => {
        before.remove();
        after.remove();
      };
    } else {
      this.cleanupSentinels = null;
    }
  }

  private removeSentinels() {
    this.cleanupSentinels?.();
    this.cleanupSentinels = null;
  }

  private observe() {
    if (this.mutationObserver || typeof MutationObserver === "undefined") return;
    this.mutationObserver = new MutationObserver(() => {
      if (!matchesVisibility(this.container)) {
        this.release("auto");
      }
    });
    this.mutationObserver.observe(this.container, {
      attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "style", "class", "disabled", "inert"],
    });

    if (this.container.ownerDocument?.body && typeof MutationObserver !== "undefined") {
      this.documentObserver = new MutationObserver(() => {
        if (!matchesVisibility(this.container)) {
          this.release("auto");
        }
      });
      this.documentObserver.observe(this.container.ownerDocument.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden", "style", "class", "disabled", "inert"],
      });
    }
  }

  private disconnectObservers() {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.documentObserver?.disconnect();
    this.documentObserver = null;
  }

  private attachListeners() {
    const doc = this.container.ownerDocument ?? document;
    doc.addEventListener("focusin", this.handleFocusIn, true);
    this.container.addEventListener("keydown", this.handleKeydown, true);
  }

  private detachListeners() {
    const doc = this.container.ownerDocument ?? document;
    doc.removeEventListener("focusin", this.handleFocusIn, true);
    this.container.removeEventListener("keydown", this.handleKeydown, true);
  }

  private handleFocusIn = (event: FocusEvent) => {
    if (!this.active || this.paused || !manager.isTop(this)) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!this.container.contains(target)) {
      this.focusFirst();
    }
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (!this.active || this.paused || !manager.isTop(this)) return;
    if (event.key === "Tab") {
      this.handleTab(event);
      return;
    }
    if (event.key === "Escape" && this.options.escapeDismiss) {
      event.preventDefault();
      this.release("escape");
      dispatch(this.container, "automagica11y:focus-trap:escape", {
        container: this.container,
      });
    }
  };

  private handleTab(event: KeyboardEvent) {
    const tabbables = this.getTabbables();
    if (tabbables.length === 0) {
      event.preventDefault();
      tryFocus(this.container);
      return;
    }
    const active = this.container.ownerDocument?.activeElement as HTMLElement | null;
    const currentIndex = active ? tabbables.indexOf(active) : -1;
    event.preventDefault();
    if (event.shiftKey) {
      if (currentIndex <= 0) {
        tryFocus(tabbables[tabbables.length - 1]);
      } else {
        tryFocus(tabbables[currentIndex - 1]);
      }
    } else {
      if (currentIndex === -1 || currentIndex === tabbables.length - 1) {
        tryFocus(tabbables[0]);
      } else {
        tryFocus(tabbables[currentIndex + 1]);
      }
    }
  }

  private restoreFocus() {
    if (!this.releaseShouldReturn) return;
    const doc = this.container.ownerDocument ?? document;
    const candidate = this.invoker;
    this.invoker = null;
    if (candidate && matchesVisibility(candidate)) {
      tryFocus(candidate);
      return;
    }
    if (matchesVisibility(this.container)) {
      tryFocus(this.container);
      return;
    }
    const tabbables = getFocusableIn(doc);
    if (tabbables.length > 0) {
      tryFocus(tabbables[0]);
    }
  }
}

/**
 * Enable a managed focus trap for the given container element.
 * Returns a disposer that releases the trap when invoked.
 */
export function enableFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}) {
  const trap = new FocusTrapInstance(container, options);
  trap.enable();
  return () => {
    trap.release();
  };
}

/**
 * Read focus trap configuration options from `data-automagica11y-*` attributes.
 */
export function readFocusTrapOptionsFromAttributes(target: HTMLElement): FocusTrapOptions & { auto?: boolean } {
  const initialAttr = getDataAttribute(target, "focus-trap-initial");
  const returnAttr = getDataAttribute(target, "focus-trap-return");
  const escapeAttr = getDataAttribute(target, "focus-trap-escape-dismiss");
  const autoAttr = getDataAttribute(target, "focus-trap-auto");

  const normalizeBoolean = (value: string | null, defaultValue: boolean) => {
    if (value === null || value === "") return defaultValue;
    const normalized = value.toLowerCase().trim();
    if (normalized === "false" || normalized === "0") return false;
    if (normalized === "true" || normalized === "1") return true;
    return defaultValue;
  };

  let initial: FocusTrapOptions["initial"];
  if (typeof initialAttr === "string" && initialAttr.trim() !== "") {
    const normalized = initialAttr.trim();
    const lower = normalized.toLowerCase();
    if (lower === "first" || lower === "last") {
      initial = lower;
    } else {
      initial = normalized;
    }
  }

  return {
    initial,
    returnFocus: normalizeBoolean(returnAttr, true),
    escapeDismiss: normalizeBoolean(escapeAttr, false),
    auto: normalizeBoolean(autoAttr, true),
  };
}
