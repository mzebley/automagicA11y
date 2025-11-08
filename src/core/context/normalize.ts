import { contextAliases } from "./aliases";

const aliasLookup = new Map<string, string>();

for (const [canonical, aliases] of Object.entries(contextAliases)) {
  aliases.forEach((alias) => {
    aliasLookup.set(alias.toLowerCase(), canonical);
  });
}

/** Map friendly context names to canonical registry keys. */
export function normalizeContext(input: string): string {
  const normalized = input.trim().toLowerCase();
  return aliasLookup.get(normalized) ?? normalized;
}
