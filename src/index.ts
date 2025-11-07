export * from "@core/registry";
export * from "./patterns";
export { registerAnnouncePlugin } from "./patterns/announce/announce";
export { registerAnimatePlugin } from "./plugins/animate";

import { initAllPatterns } from "@core/registry";
if (typeof window !== "undefined") {
  initAllPatterns(document);
}
