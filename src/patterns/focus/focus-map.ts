import { getDataAttribute } from "@core/attributes";
import { getFocusableIn, isFocusable, focusElement } from "@core/focus";

type Cleanup = () => void;
const releases = new WeakMap<HTMLElement, Cleanup>();

function parseSelectors(value: string | null): string[] {
  if (value === null || value === "") return [];
  const trimmed = value.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map(sel => sel.trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return trimmed.split(";").map(sel => sel.trim()).filter(Boolean);
}

export function initFocusMap(node: Element) {
  if (!(node instanceof HTMLElement)) return;
  const selectors = parseSelectors(getDataAttribute(node, "focus-map"));
  if (selectors.length === 0) {
    releases.get(node)?.();
    releases.delete(node);
    return;
  }

  const scopeAttr = getDataAttribute(node, "focus-map-scope");
  let scope: ParentNode | Element = document;
  if (scopeAttr === "self") scope = node;
  else if (scopeAttr && scopeAttr !== "document") {
    const scoped = document.querySelector(scopeAttr);
    if (scoped) scope = scoped;
  }

  const ordered: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  const addElement = (element: HTMLElement) => {
    if (seen.has(element)) return;
    if (isFocusable(element)) {
      seen.add(element);
      ordered.push(element);
      return;
    }

    const descendants = getFocusableIn(element);
    descendants.forEach(desc => {
      if (seen.has(desc)) return;
      seen.add(desc);
      ordered.push(desc);
    });
  };

  selectors.forEach(selector => {
    const root = scope instanceof Element || scope instanceof Document ? scope : document;
    const contextElements = root.querySelectorAll<HTMLElement>(selector);
    contextElements.forEach(element => {
      addElement(element);
    });
  });

  if (ordered.length === 0) return;

  releases.get(node)?.();

  const anchorSelector = getDataAttribute(node, "focus-map-anchor");
  let focusAnchor: HTMLElement | null = null;
  if (anchorSelector) {
    focusAnchor = document.querySelector(anchorSelector) as HTMLElement | null;
  }
  if (!focusAnchor) {
    focusAnchor = scope instanceof HTMLElement ? scope : null;
  }
  if (!focusAnchor) return;

  const anchorOriginalTabIndex = focusAnchor.getAttribute("tabindex");
  if (!isFocusable(focusAnchor)) {
    focusAnchor.tabIndex = 0;
  }

  const elementHandlers = new Map<HTMLElement, (event: KeyboardEvent) => void>();
  let suppressNextAnchorFocus = false;

  ordered.forEach((element, index) => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (event.shiftKey) {
        if (index === 0) {
          event.preventDefault();
          suppressNextAnchorFocus = true;
          focusElement(focusAnchor);
        } else {
          event.preventDefault();
          focusElement(ordered[index - 1]);
        }
        return;
      }
      if (index === ordered.length - 1) return;
      event.preventDefault();
      focusElement(ordered[index + 1]);
    };
    element.addEventListener("keydown", handler);
    elementHandlers.set(element, handler);
  });

  const handleAnchorKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    focusElement(ordered[0]);
  };

  const handleAnchorFocus = (event: FocusEvent) => {
    if (suppressNextAnchorFocus) {
      suppressNextAnchorFocus = false;
      return;
    }
    const related = event.relatedTarget as HTMLElement | null;
    if (related && ordered.includes(related)) return;
    focusElement(ordered[0]);
  };

  focusAnchor.addEventListener("keydown", handleAnchorKeydown);
  focusAnchor.addEventListener("focus", handleAnchorFocus);

  releases.set(node, () => {
    elementHandlers.forEach((handler, element) => element.removeEventListener("keydown", handler));
    const fa = focusAnchor;
    if (fa instanceof HTMLElement) {
      fa.removeEventListener("keydown", handleAnchorKeydown);
      fa.removeEventListener("focus", handleAnchorFocus);
      if (anchorOriginalTabIndex === null) fa.removeAttribute("tabindex");
      else fa.setAttribute("tabindex", anchorOriginalTabIndex);
    }
  });
}
