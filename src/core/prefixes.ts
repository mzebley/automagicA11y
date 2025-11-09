/**
 * Normalizes data-attribute prefixes so variations like
 * data-ama11y-toggle map to data-automagica11y-toggle.
 */
export const PREFIX_MAP = new Map<string, string>([
  ["automagica11y", "automagica11y"],
  ["automagically", "automagica11y"],
  ["ama11y", "automagica11y"],
  ["amaally", "automagica11y"],
  ["ama", "automagica11y"],
  ["autoa11y", "automagica11y"],
  ["automagic", "automagica11y"],
]);

/**
 * Return the canonical attribute name for any recognized data prefix alias.
 */
export function normalizePrefix(attrName: string): string {
  for (const [alias, canonical] of PREFIX_MAP) {
    if (attrName.startsWith(`data-${alias}-`)) {
      return attrName.replace(`data-${alias}-`, `data-${canonical}-`);
    }
  }
  return attrName;
}
