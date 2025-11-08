import { describe, expect, it } from "vitest";
import { normalizeContext } from "../../src/core/context/normalize";

describe("context aliases", () => {
  it("normalizes modal aliases to dialog", () => {
    expect(normalizeContext("modal")).toBe("dialog");
    expect(normalizeContext("Dialog")).toBe("dialog");
  });

  it("normalizes dropdown/kebab/meatball to menu", () => {
    expect(normalizeContext("dropdown")).toBe("menu");
    expect(normalizeContext("kebab")).toBe("menu");
    expect(normalizeContext("meatball")).toBe("menu");
  });

  it("normalizes tooltip, disclosure, and tree variants", () => {
    expect(normalizeContext("tooltip")).toBe("tooltip");
    expect(normalizeContext("treeview")).toBe("tree");
    expect(normalizeContext("details")).toBe("disclosure");
  });
});
