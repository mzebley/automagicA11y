import { describe, it, expect } from "vitest";
import { PREFIX_MAP, normalizePrefix } from "../../src/core/prefixes";

describe("core/prefixes", () => {
  it("normalizes all aliases to the canonical prefix", () => {
    PREFIX_MAP.forEach((canonical, alias) => {
      const source = `data-${alias}-toggle`;
      const normalized = normalizePrefix(source);
      expect(normalized).toBe(`data-${canonical}-toggle`);
    });
  });

  it("returns the original name when no alias matches", () => {
    const attr = "data-custom-toggle";
    expect(normalizePrefix(attr)).toBe(attr);
  });
});
