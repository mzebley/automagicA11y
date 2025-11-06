import { registerPattern } from "@core/registry";
import { initToggle } from "./toggle/toggle";
export { registerAnnouncePlugin } from "./announce/announce";

registerPattern("toggle", "[data-automagica11y-toggle]", (node) => {
  if (node instanceof Element) {
    initToggle(node);
  }
});

export { initToggle };
