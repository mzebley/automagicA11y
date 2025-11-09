import { describe, expect, it, beforeEach } from "vitest";
import { registerPattern, initPattern, initNode } from "../../src/core/registry";

describe("pattern registry", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes elements only once per pattern", () => {
    const calls: Element[] = [];
    const name = `test-pattern-${Math.random()}`;
    registerPattern(name, "[data-registry-test]", (el) => {
      calls.push(el);
      el.setAttribute("data-initialized", "true");
    });

    document.body.innerHTML = `<div data-registry-test></div>`;

    initPattern(name);
    initPattern(name);

    expect(calls).toHaveLength(1);
    expect((document.querySelector("[data-registry-test]") as HTMLElement).dataset.initialized).toBe("true");
  });

  it("hydrates descendants within the provided root", () => {
    const calls: Element[] = [];
    const name = `test-pattern-scope-${Math.random()}`;
    registerPattern(name, "[data-registry-scope]", (el) => {
      calls.push(el);
    });

    const section = document.createElement("section");
    section.innerHTML = `
      <div data-registry-scope></div>
      <article>
        <span data-registry-scope></span>
      </article>
    `;
    document.body.appendChild(section);

    initPattern(name, section);

    expect(calls).toHaveLength(2);
  });

  it("supports initNode for dynamically inserted content", () => {
    const calls: Element[] = [];
    const name = `test-init-node-${Math.random()}`;
    registerPattern(name, "[data-node-pattern]", (el) => {
      calls.push(el);
    });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <article data-node-pattern></article>
      <div>
        <button data-node-pattern></button>
      </div>
    `;

    initNode(wrapper);

    expect(calls).toHaveLength(2);
  });

  it("hydrates alias-prefixed attributes for registered selectors", () => {
    const calls: Element[] = [];
    const name = `alias-pattern-${Math.random()}`;
    registerPattern(name, "[data-automagica11y-alias]", (el) => {
      calls.push(el);
    });

    document.body.innerHTML = `
      <div data-ama-alias></div>
    `;

    initPattern(name);

    expect(calls).toHaveLength(1);
  });
});
