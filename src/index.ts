/**
 * Re-export the public registry helpers so consumers can import from the package root
 * without relying on build-time path aliases.
 *
 * Quick install + init instructions live in README.md#getting-started and are mirrored in
 * docs/src/content/docs/getting-started/installation.mdx so code comments, READMEs, and
 * the Astro docs stay in sync for first-time users.
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
