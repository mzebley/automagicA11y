/**
 * Re-export the public registry helpers so consumers can import from the package root
 * without relying on build-time path aliases.
 */
export {
  initAllPatterns,
  initNode,
  initPattern,
  initPatterns,
  registerPattern
} from "./core/registry";

export * from "./patterns";
export { registerAnnouncePlugin } from "./plugins/announce/announce";
export { initAnimateLifecycle } from "./core/animate";
export { enableFocusTrap, readFocusTrapOptionsFromAttributes } from "./core/focus-trap";

import { initAllPatterns } from "./core/registry";
import { initAnimateLifecycle } from "./core/animate";
if (typeof window !== "undefined") {
  initAnimateLifecycle(document);
  initAllPatterns(document);
}
