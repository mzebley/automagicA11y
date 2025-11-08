import { Contexts } from "./registry";
import { normalizeContext } from "./normalize";
import { helpers } from "./helpers";

export type ContextMode = "all" | "semantics-only" | "behaviors-only";

const warnedUnknown = new Set<string>();
const warnedSemanticsOnly = new WeakSet<HTMLElement>();

/** Apply the registered context semantics and behaviors to a trigger/target pair. */
export function applyContext(
  trigger: HTMLElement,
  target: HTMLElement,
  contextName: string,
  mode: ContextMode = "all"
): void {
  const key = normalizeContext(contextName);
  const ctx = Contexts[key];
  if (!ctx) {
    const normalizedName = contextName.trim().toLowerCase();
    if (!warnedUnknown.has(normalizedName)) {
      console.warn(`[automagica11y] Unknown context: ${contextName}`);
      warnedUnknown.add(normalizedName);
    }
    return;
  }

  if (mode !== "behaviors-only") {
    ctx.ensureSemantics(trigger, target, helpers);
  }

  if (mode === "semantics-only") {
    if (!warnedSemanticsOnly.has(target) && ctx.capabilities.some((cap) => cap !== "semantics")) {
      console.warn(
        `[automagica11y] context='${key}' with semantics-only: ensure focus cannot leak and Escape closes if desired.`
      );
      warnedSemanticsOnly.add(target);
    }
    return;
  }

  ctx.enableBehaviors(trigger, target, helpers);
}
