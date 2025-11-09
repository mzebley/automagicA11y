export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(", ");

function isVisible(element: HTMLElement) {
  if (element.hasAttribute("hidden")) return false;
  const ariaHidden = element.getAttribute("aria-hidden");
  if (ariaHidden === "true") return false;
  if (element.offsetParent !== null) return true;
  if (element.offsetWidth > 0 || element.offsetHeight > 0) return true;
  if (typeof element.getClientRects === "function" && element.getClientRects().length > 0) return true;
  // Fallback for environments without layout (e.g., JSDOM)
  return true;
}

/** Determine if an element is focusable considering visibility and ARIA. */
export function isFocusable(element: HTMLElement) {
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (typeof element.closest === "function") {
    const inertAncestor = element.closest("[inert]");
    if (inertAncestor) return false;
  }
  if (!isVisible(element)) return false;
  if (element.matches(FOCUSABLE_SELECTOR)) return true;
  return element.tabIndex >= 0;
}

/** Collect unique focusable elements within a given root (inclusive). */
export function getFocusableIn(root: ParentNode | Element): HTMLElement[] {
  const result: HTMLElement[] = [];

  const pushIfFocusable = (el: Element | null) => {
    if (el instanceof HTMLElement && isFocusable(el) && !result.includes(el)) {
      result.push(el);
    }
  };

  if (root instanceof Element) {
    pushIfFocusable(root);
  }

  (root as ParentNode)
    .querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    .forEach((el) => pushIfFocusable(el));

  return result;
}

/** Options for focusing elements with sensible defaults. */
export interface FocusOptionsExtended {
  preventScroll?: boolean;
  preserveTabIndex?: boolean;
}

/** Focus an element, optionally preserving author `tabindex` after blur. */
export function focusElement(element: HTMLElement, options: FocusOptionsExtended = {}) {
  const { preventScroll = true, preserveTabIndex = true } = options;

  const restore = preserveTabIndex ? preserveTabIndexFn(element) : () => {};

  try {
    element.focus({ preventScroll });
  } catch {
    element.focus();
  }

  if (preserveTabIndex) {
    element.addEventListener(
      "blur",
      () => {
        restore();
      },
      { once: true }
    );
  }
}

function preserveTabIndexFn(element: HTMLElement) {
  const hadAttr = element.hasAttribute("tabindex");
  const previousValue = element.getAttribute("tabindex");
  const needsTemp = element.tabIndex < 0 && !element.matches(FOCUSABLE_SELECTOR);
  if (!needsTemp) {
    return () => {};
  }
  element.tabIndex = -1;
  return () => {
    if (hadAttr && previousValue !== null) {
      element.setAttribute("tabindex", previousValue);
    } else if (hadAttr && previousValue === null) {
      element.removeAttribute("tabindex");
    } else {
      element.removeAttribute("tabindex");
    }
  };
}

export function focusFirst(root: ParentNode | Element, options?: FocusOptionsExtended) {
  const focusables = getFocusableIn(root);
  const first = focusables[0];
  if (typeof first !== "undefined") {
    focusElement(first, options);
    return first;
  }
  if (root instanceof HTMLElement) {
    focusElement(root, options);
    return root;
  }
  return null;
}

/** Minimal focus trap contract used by modal/dialog flows. */
/** Handle to restore original tab order when custom ordering is applied. */
export interface FocusOrderController {
  release: () => void;
}

/** Options that control the starting point for ordered focus. */
export interface FocusOrderOptions {
  startIndex?: number;
  relativeTo?: HTMLElement | null;
}

/**
 * Apply a stable tab order across a set of elements by assigning positive tabindex values.
 * Returns a controller to restore the original state when no longer needed.
 */
export function applyFocusOrder(elements: HTMLElement[], options: FocusOrderOptions = {}): FocusOrderController | null {
  if (elements.length === 0) return null;

  const originals = new Map<HTMLElement, string | null>();
  const { startIndex, relativeTo } = options;

  let baseIndex: number;
  if (typeof startIndex === "number" && !Number.isNaN(startIndex)) {
    baseIndex = Math.max(1, Math.floor(startIndex));
  } else if (relativeTo instanceof HTMLElement && relativeTo.tabIndex > 0) {
    baseIndex = relativeTo.tabIndex + 1;
  } else {
    baseIndex = 1;
  }

  let index = baseIndex;

  elements.forEach((element) => {
    if (!originals.has(element)) {
      originals.set(element, element.hasAttribute("tabindex") ? element.getAttribute("tabindex") : null);
    }
    element.tabIndex = index++;
  });

  return {
    release() {
      originals.forEach((value, element) => {
        if (value === null) {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", value);
        }
      });
    }
  };
}
