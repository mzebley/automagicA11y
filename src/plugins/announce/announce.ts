/**
 * The announce pattern wires a shared ARIA live region to automagicA11y events so controls
 * can opt in to screen reader messaging with simple data attributes.
 */
// ID used for the shared live region node so we never duplicate it.
const LIVE_REGION_ID = "automagica11y-live";
// Prevent chattiness by ignoring identical announcements for a short window.
const MESSAGE_DEBOUNCE_MS = 750;

// Minimal detail payload we expect from `automagica11y:toggle` events.
type ToggleEventDetail = {
  expanded?: boolean;
  trigger?: HTMLElement;
  target?: HTMLElement;
};

// Authors can request polite (default) or assertive hand-off to screen readers.
type AnnounceMode = "polite" | "assertive";

// Internal singleton state shared across all announce calls.
let liveRegion: HTMLElement | null = null;
let registered = false;
let lastMessage = "";
let lastTimestamp = 0;
let refreshTimer: number | null = null;

/**
 * Guarantee there is exactly one live region that all patterns can reuse.
 * We keep it visually hidden off-screen but accessible to assistive tech.
 */
function ensureLiveRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (liveRegion) return liveRegion;

  const existing = document.getElementById(LIVE_REGION_ID) as HTMLElement | null;
  if (existing) {
    liveRegion = existing;
    return liveRegion;
  }

  const region = document.createElement("div");
  region.id = LIVE_REGION_ID;
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.hidden = true;
  region.style.position = "absolute";
  region.style.left = "-9999px";
  region.style.width = "1px";
  region.style.height = "1px";
  region.style.overflow = "hidden";

  const parent: HTMLElement = document.body as HTMLElement;
  parent.appendChild(region);
  liveRegion = region;
  return liveRegion;
}

/**
 * Derive a human readable label for announcements using aria-label, aria-labelledby,
 * value text, or fallback to the element's text/ID. Mirrors ARIA accessible name computation.
 */
export function nameOf(element: HTMLElement): string {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel !== null && ariaLabel.trim().length > 0) return ariaLabel.trim();

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy !== null && labelledBy !== "") {
    const names = labelledBy
      .split(/\s+/)
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .map(el => {
        const content = el.textContent as string | null;
        return content === null ? "" : content;
      })
      .join(" ")
      .trim();
    if (names.length > 0) return names.replace(/\s+/g, " ");
  }

  if ("value" in element && typeof (element as HTMLInputElement).value === "string") {
    const value = (element as HTMLInputElement).value.trim();
    if (value.length > 0) return value;
  }

  const textContent = element.textContent as string | null;
  const text = (textContent === null ? "" : textContent).trim();
  if (text.length > 0) return text.replace(/\s+/g, " ");

  return element.id !== "" ? element.id : "Control";
}

/**
 * Write text into the live region, swapping politeness and guarding against spammy repeats.
 */
export function announce(message: string, assertive = false) {
  if (typeof window === "undefined") return;
  const trimmed = message.trim();
  if (trimmed.length === 0) return;

  const now = Date.now();
  if (trimmed === lastMessage && now - lastTimestamp < MESSAGE_DEBOUNCE_MS) return;
  lastMessage = trimmed;
  lastTimestamp = now;

  const region = ensureLiveRegion();
  if (region === null) return;

  region.hidden = false;
  region.setAttribute("aria-live", assertive ? "assertive" : "polite");
  region.setAttribute("role", assertive ? "alert" : "status");

  // Clearing then repopulating the region nudges screen readers to re-announce.
  region.textContent = "";
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    region.textContent = trimmed;
  }, 30);
}

/**
 * Build the announcement sentence for the given toggle detail.
 * Prefers author-supplied strings, otherwise falls back to "{name} expanded/collapsed".
 */
function announcementFor(detail: ToggleEventDetail, trigger: HTMLElement): string {
  const expanded = Boolean(detail.expanded);
  const attr = expanded
    ? getDataAttribute(trigger, "announce-open")
    : getDataAttribute(trigger, "announce-closed");
  if (attr !== null && attr.trim().length > 0) return attr.trim();

  const controlName = nameOf(trigger);
  const state = expanded ? "expanded" : "collapsed";
  return controlName.length > 0 ? `${controlName} ${state}` : state.charAt(0).toUpperCase() + state.slice(1);
}

/**
 * Respond to `automagica11y:toggle` events fired by patterns. We ignore controls that haven't opted in
 * and skip redundant announcements when the user still has focus on the trigger.
 */
function handleToggle(event: Event) {
  if (!(event instanceof CustomEvent)) return;
  const detail = event.detail as ToggleEventDetail | undefined;
  const trigger = detail?.trigger;
  if (!(trigger instanceof HTMLElement)) return;
  if (!hasDataAttribute(trigger, "announce")) return;

  // When focus stays on the trigger, screen readers announce aria-expanded natively.
  if (trigger === document.activeElement) return;

  const announceAttr = getDataAttribute(trigger, "announce");
  const modeAttr = announceAttr?.toLowerCase() as AnnounceMode | null;
  const mode: AnnounceMode = modeAttr === "assertive" ? "assertive" : "polite";
  const message = announcementFor(detail ?? {}, trigger);
  // Hand off to the live region with the requested politeness mode.
  announce(message, mode === "assertive");
}

/**
 * Initialize the announce system once per document. Consumers call this during app boot.
 */
export function registerAnnouncePlugin() {
  if (registered || typeof document === "undefined") return;
  registered = true;
  ensureLiveRegion();
  document.addEventListener("automagica11y:toggle", handleToggle, { capture: true });
}
import { getDataAttribute, hasDataAttribute } from "@core/attributes";
