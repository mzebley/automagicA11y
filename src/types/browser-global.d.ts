import type {
  initAllPatterns,
  initNode,
  initPattern,
  initPatterns,
  registerPattern
} from "../core/registry";
import type { initAnimateLifecycle } from "../core/animate";
import type {
  enableFocusTrap,
  readFocusTrapOptionsFromAttributes
} from "../core/focus-trap";
import type { registerAnnouncePlugin } from "../plugins/announce/announce";

/**
 * Shape of the global exposed by the IIFE build. Mirrors the public ESM API so
 * non-module consumers receive accurate typing and editor IntelliSense.
 */
declare const automagicA11y: {
  initAllPatterns: typeof initAllPatterns;
  initPattern: typeof initPattern;
  initPatterns: typeof initPatterns;
  initNode: typeof initNode;
  registerPattern: typeof registerPattern;
  initAnimateLifecycle: typeof initAnimateLifecycle;
  enableFocusTrap: typeof enableFocusTrap;
  readFocusTrapOptionsFromAttributes: typeof readFocusTrapOptionsFromAttributes;
  registerAnnouncePlugin: typeof registerAnnouncePlugin;
};

export default automagicA11y;
export { automagicA11y };
