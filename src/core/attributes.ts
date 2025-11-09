import { normalizePrefix, PREFIX_MAP } from "./prefixes";

const CANONICAL_PREFIX = "automagica11y";
const CANONICAL_DATA_PREFIX = `data-${CANONICAL_PREFIX}-`;

function canonicalDataAttribute(suffix: string) {
  return `${CANONICAL_DATA_PREFIX}${suffix}`;
}

function findAttributeName(el: Element, canonicalName: string): string | null {
  for (const attr of Array.from(el.attributes)) {
    if (normalizePrefix(attr.name) === canonicalName) {
      return attr.name;
    }
  }
  return null;
}

/** Ensure `el.id` is present; assign with the given prefix if absent. */
export function ensureId(el: HTMLElement, prefix: string) {
  if (el.id === "") {
    const hasUUID =
      typeof globalThis.crypto !== "undefined" &&
      typeof (globalThis.crypto as Crypto).randomUUID === "function";
    const uuid = hasUUID
      ? (globalThis.crypto as Crypto).randomUUID()
      : Math.random().toString(36).slice(2);
    el.id = `${prefix}-${uuid}`;
  }
  return el.id;
}

/** Convenience setter for `aria-expanded` string boolean. */
export function setAriaExpanded(el: HTMLElement, expanded: boolean) {
  el.setAttribute("aria-expanded", expanded ? "true" : "false");
}

/** Convenience setter for `aria-hidden` string boolean. */
export function setAriaHidden(el: HTMLElement, hidden: boolean) {
  el.setAttribute("aria-hidden", hidden ? "true" : "false");
}

/**
 * Normalize an attribute name to the canonical automagica11y prefix.
 */
export function normalizeAttributeName(attr: string): string {
  return normalizePrefix(attr);
}

/**
 * Determine whether a `data-automagica11y-*` attribute (including aliases) exists.
 */
export function hasDataAttribute(el: Element, suffix: string): boolean {
  return findAttributeName(el, canonicalDataAttribute(suffix)) !== null;
}

/**
 * Read a `data-automagica11y-*` attribute value, resolving aliases to the canonical prefix.
 */
export function getDataAttribute(el: Element, suffix: string): string | null {
  const canonicalName = canonicalDataAttribute(suffix);
  const actualName = findAttributeName(el, canonicalName);
  if (actualName === null) return null;
  return el.getAttribute(actualName);
}

/**
 * Persist a `data-automagica11y-*` attribute value using the canonical prefix.
 */
export function setDataAttribute(el: Element, suffix: string, value: string) {
  const canonicalName = canonicalDataAttribute(suffix);
  const actualName = findAttributeName(el, canonicalName);
  if (actualName && actualName !== canonicalName) {
    el.removeAttribute(actualName);
  }
  el.setAttribute(canonicalName, value);
}

/**
 * Add a unique whitespace-separated token to an attribute value, normalizing aliases first.
 */
export function appendToken(el: Element, attr: string, token: string) {
  const canonicalName = normalizePrefix(attr);
  const actualName = findAttributeName(el, canonicalName) ?? canonicalName;
  const existing = el.getAttribute(actualName);
  const tokens = new Set((existing ?? "").split(/\s+/).filter(Boolean));
  tokens.add(token);
  const targetName = canonicalName;
  if (actualName !== targetName) {
    el.removeAttribute(actualName);
  }
  el.setAttribute(targetName, Array.from(tokens).join(" "));
  return tokens;
}

/**
 * Build a selector that matches every known alias for the given data attribute suffix.
 */
export function prefixedSelector(suffix: string): string {
  const selectors = new Set<string>();
  PREFIX_MAP.forEach((canonical, alias) => {
    if (canonical === CANONICAL_PREFIX) {
      selectors.add(`[data-${alias}-${suffix}]`);
    }
  });
  return Array.from(selectors).join(",");
}

/**
 * Remove a token from a whitespace-separated attribute value, respecting alias prefixes.
 */
export function removeToken(el: Element, attr: string, token: string) {
  const canonicalName = normalizePrefix(attr);
  const actualName = findAttributeName(el, canonicalName) ?? canonicalName;
  const existing = el.getAttribute(actualName);
  if (existing === null || existing === "") return;
  const tokens = existing.split(/\s+/).filter(Boolean).filter(value => value !== token);
  if (actualName !== canonicalName) {
    el.removeAttribute(actualName);
  }
  if (tokens.length > 0) el.setAttribute(canonicalName, tokens.join(" "));
  else el.removeAttribute(canonicalName);
}
