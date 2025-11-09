import { ensureId, getDataAttribute, hasDataAttribute, setDataAttribute } from "@core/attributes";

/**
 * Initialize a context-declared trigger by promoting `data-automagica11y-target`
 * (or a sensible fallback) into `data-automagica11y-toggle` so the core toggle
 * pattern can hydrate and the context registry can apply semantics/behaviors.
 *
 * Supported authoring forms:
 * - <button data-automagica11y-context="tooltip" data-automagica11y-target="#tip">…</button>
 * - <button data-automagica11y-context="dialog">…</button><div id="dlg">…</div>
 *
 * Notes:
 * - If `data-automagica11y-toggle` is already present, this is a no-op.
 * - If no explicit `data-automagica11y-target` exists, the next element sibling
 *   is used as a reasonable default surface.
 */
export function initContextTrigger(node: Element) {
  if (!(node instanceof HTMLElement)) return;

  // If authors already provided a toggle selector, nothing to do here.
  if (hasDataAttribute(node, "toggle")) return;

  // Resolve the target surface via explicit attribute or next sibling fallback.
  const explicit = getDataAttribute(node, "target");
  let target: HTMLElement | null = null;

  if (explicit && explicit.trim() !== "") {
    target = document.querySelector<HTMLElement>(explicit);
  } else if (node.nextElementSibling instanceof HTMLElement) {
    target = node.nextElementSibling as HTMLElement;
  }

  if (!target) return;

  // Ensure a stable ID for ARIA relations and toggle selector wiring.
  ensureId(target, "automagica11y-p");
  setDataAttribute(node, "toggle", `#${target.id}`);
}

