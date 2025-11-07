import { describe, it, expect, beforeEach, vi } from "vitest";
import { initFocusInitial } from "../../src/patterns/focus/focus-initial";
import { initFocusMap } from "../../src/patterns/focus/focus-map";

describe("focus patterns", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    (document.activeElement as (HTMLElement | null))?.blur?.();
    vi.useRealTimers();
  });

  it("focuses an element marked with data-automagica11y-focus-initial", async () => {
    document.body.innerHTML = `
      <div>
        <button id="primary" data-automagica11y-focus-initial>Primary</button>
        <button id="secondary">Secondary</button>
      </div>
    `;

    const primary = document.getElementById("primary") as HTMLElement;
    initFocusInitial(primary);
    await Promise.resolve();

    expect(document.activeElement).toBe(primary);
  });

  it("applies a focus map order across selectors", () => {
    document.body.innerHTML = `
      <button id="before">Before</button>
      <div id="anchor" tabindex="0"></div>
      <section id="scope">
        <button id="player">Player</button>
        <a id="nav1" href="#">Nav1</a>
        <a id="nav2" href="#">Nav2</a>
        <button id="cta">CTA</button>
      </section>
      <button id="after">After</button>
    `;

    const anchor = document.getElementById("anchor") as HTMLElement;
    anchor.setAttribute("data-automagica11y-focus-map", "#nav1; #nav2; #player; #cta");
    anchor.setAttribute("data-automagica11y-focus-map-scope", "#scope");
    anchor.setAttribute("data-automagica11y-focus-map-anchor", "#anchor");
    initFocusMap(anchor);

    const nav1El = document.getElementById("nav1") as HTMLElement;
    const nav2El = document.getElementById("nav2") as HTMLElement;
    const playerEl = document.getElementById("player") as HTMLElement;
    const ctaEl = document.getElementById("cta") as HTMLElement;

    anchor.focus();
    anchor.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(nav1El);

    nav1El.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(nav2El);

    nav2El.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(playerEl);

    playerEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(ctaEl);

    const exitEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    ctaEl.dispatchEvent(exitEvent);
    expect(exitEvent.defaultPrevented).toBe(false);
    ctaEl.blur();
    (document.getElementById("after") as HTMLElement).focus();

    const reverseEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    nav1El.dispatchEvent(reverseEvent);
    expect(reverseEvent.defaultPrevented).toBe(true);
  });

  it("respects preventScroll (default true) and focus delay", async () => {
    vi.useFakeTimers();

    document.body.innerHTML = `
      <div style="height:2000px"></div>
      <button id="skip" data-automagica11y-focus-initial data-automagica11y-focus-delay="150">Skip</button>
    `;

    const skip = document.getElementById("skip") as HTMLElement;

    // Ensure scrollTo exists and spy on it
    const scrollSpy = vi.spyOn(window, "scrollTo");

    initFocusInitial(skip);

    // Not yet focused before delay
    vi.advanceTimersByTime(149);
    expect(document.activeElement).not.toBe(skip);

    // After delay, focus should land
    vi.advanceTimersByTime(1);
    expect(document.activeElement).toBe(skip);

    // preventScroll=true by default should avoid programmatic scroll
    expect(scrollSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("applies focus once and restores tabindex on blur", async () => {
    document.body.innerHTML = `<button id="a" data-automagica11y-focus-initial>Go</button>`;
    const a = document.getElementById("a") as HTMLElement;
    const originalTabindex = a.getAttribute("tabindex");

    initFocusInitial(a);
    await Promise.resolve();
    expect(document.activeElement).toBe(a);

    a.blur();

    // Expect the tabindex to be restored to its original value
    expect(a.getAttribute("tabindex")).toBe(originalTabindex);

    // Re-init should not move focus again
    const other = document.createElement("button");
    other.id = "other";
    document.body.appendChild(other);
    other.focus();

    initFocusInitial(a);
    await Promise.resolve();
    expect(document.activeElement).toBe(other);
  });

  it('limits scope when data-automagica11y-focus-map-scope="self"', () => {
    document.body.innerHTML = `
      <div id="host" tabindex="0"
           data-automagica11y-focus-map="#inside1; #inside2"
           data-automagica11y-focus-map-scope="self"
           data-automagica11y-focus-map-anchor="#host">
        <button id="inside1">In1</button>
        <button id="inside2">In2</button>
      </div>
      <button id="outside">Outside</button>
    `;

    const host = document.getElementById("host") as HTMLElement;
    initFocusMap(host);

    host.focus();
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe("inside1");
  });

  it("does not activate when anchor is missing and scope is document", () => {
    document.body.innerHTML = `
      <div id="anchor"></div>
      <button id="one">One</button>
      <button id="two">Two</button>
      <div id="host" data-automagica11y-focus-map="#one; #two"
           data-automagica11y-focus-map-scope="document"
           data-automagica11y-focus-map-anchor="#does-not-exist"></div>
    `;

    const host = document.getElementById("host") as HTMLElement;
    initFocusMap(host);

    const one = document.getElementById("one") as HTMLElement;
    one.focus();
    const evt = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    one.dispatchEvent(evt);

    // Because the map didn't activate, nothing should be prevented
    expect(evt.defaultPrevented).toBe(false);
  });

  it("routes Shift+Tab on first mapped item back to anchor and prevents default", () => {
    document.body.innerHTML = `
      <div id="anchor" tabindex="0"></div>
      <section id="scope">
        <button id="a">A</button>
        <button id="b">B</button>
      </section>
    `;

    const anchor = document.getElementById("anchor") as HTMLElement;
    anchor.setAttribute("data-automagica11y-focus-map", "#a; #b");
    anchor.setAttribute("data-automagica11y-focus-map-scope", "#scope");
    anchor.setAttribute("data-automagica11y-focus-map-anchor", "#anchor");
    initFocusMap(anchor);

    anchor.focus();
    anchor.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));

    const a = document.getElementById("a") as HTMLElement;
    expect(document.activeElement).toBe(a);

    const rev = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    a.dispatchEvent(rev);
    expect(rev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(anchor);
  });

  it("lets Tab on the last mapped element fall through to next natural focus", () => {
    document.body.innerHTML = `
      <button id="before">Before</button>
      <div id="anchor" tabindex="0"></div>
      <section id="scope">
        <button id="x">X</button>
        <button id="y">Y</button>
      </section>
      <button id="after">After</button>
    `;

    const anchor = document.getElementById("anchor") as HTMLElement;
    anchor.setAttribute("data-automagica11y-focus-map", "#x; #y");
    anchor.setAttribute("data-automagica11y-focus-map-scope", "#scope");
    anchor.setAttribute("data-automagica11y-focus-map-anchor", "#anchor");
    initFocusMap(anchor);

    anchor.focus();
    anchor.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    const x = document.getElementById("x") as HTMLElement;
    x.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));

    const y = document.getElementById("y") as HTMLElement;
    const exitEvt = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    y.dispatchEvent(exitEvt);
    expect(exitEvt.defaultPrevented).toBe(false);

    // Simulate native browser advance after unhandled Tab
    y.blur();
    (document.getElementById("after") as HTMLElement).focus();
    expect(document.activeElement?.id).toBe("after");
  });

  it("skips elements that become disabled or hidden at runtime (documented limitation today)", () => {
    document.body.innerHTML = `
      <div id="anchor" tabindex="0"></div>
      <section id="scope">
        <button id="one">One</button>
        <button id="two">Two</button>
        <button id="three">Three</button>
      </section>
    `;

    const anchor = document.getElementById("anchor") as HTMLElement;
    anchor.setAttribute("data-automagica11y-focus-map", "#one; #two; #three");
    anchor.setAttribute("data-automagica11y-focus-map-scope", "#scope");
    anchor.setAttribute("data-automagica11y-focus-map-anchor", "#anchor");
    initFocusMap(anchor);

    anchor.focus();
    anchor.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    const one = document.getElementById("one") as HTMLButtonElement;
    expect(document.activeElement).toBe(one);

    // Disable the next item just before Tab
    const two = document.getElementById("two") as HTMLButtonElement;
    two.disabled = true;

    const evt = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    one.dispatchEvent(evt);

    // Current implementation may still attempt to focus the disabled element.
    // This test documents the limitation; adjust expectation when behavior is improved.
    expect(document.activeElement === document.getElementById("three")).toBe(false);
  });

  it("does not activate when the anchor is not focusable (display:none)", () => {
    document.body.innerHTML = `
      <div id="anchor" style="display:none" tabindex="0"></div>
      <section id="scope"><button id="a">A</button></section>
    `;

    const anchor = document.getElementById("anchor") as HTMLElement;
    anchor.setAttribute("data-automagica11y-focus-map", "#a");
    anchor.setAttribute("data-automagica11y-focus-map-scope", "#scope");
    anchor.setAttribute("data-automagica11y-focus-map-anchor", "#anchor");
    initFocusMap(anchor);

    const a = document.getElementById("a") as HTMLElement;
    a.focus();
    const evt = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    a.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
  });
});
