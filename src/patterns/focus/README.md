# Focus Utilities

> _Declarative helpers to control initial focus and custom tab order._

automagicA11y ships two focus-oriented patterns plus shared utilities that other patterns (like dialogs) rely on. These helpers never mutate author-defined tabindex ordering permanently — they apply temporary adjustments and restore originals automatically.

---

Looking for install commands? See the [root README](../../README.md#getting-started). Once the package is installed, the snippets below show how to enable each focus helper.

## Quick start

```ts
import "automagica11y"; // auto-initializes focus helpers on the current document

// or initialize a specific subtree if the markup is injected later
import { initPattern } from "automagica11y";
const shell = document.querySelector("#modal-shell");
if (shell) {
  initPattern("focus", shell);
}
```

Focus utilities piggyback on the same registry as other patterns, so importing the package once hydrates them everywhere.

---

## Initial Focus (`data-automagica11y-focus-initial`)

Guarantees an element receives focus once after hydration.

```html
<button
  data-automagica11y-focus-initial
  data-automagica11y-focus-prevent-scroll="false"
  data-automagica11y-focus-delay="150">
  Skip to content
</button>
```

- `data-automagica11y-focus-prevent-scroll` (default `true`) toggles `preventScroll` during `element.focus()`.
- `data-automagica11y-focus-delay` delays the focus call by the supplied milliseconds.
- Focus is applied once per element and the original `tabindex` is restored on blur.

---

## Focus Map (`data-automagica11y-focus-map`)

Declare an explicit tab sequence using CSS selectors. Ideal for floating UI (music players, chat widgets) or overlays inserted outside the DOM order.

```html
<div id="floating-anchor" tabindex="0"></div>

<div
  data-automagica11y-focus-map="#navbar a; #player button; main [data-primary]"
  data-automagica11y-focus-map-scope="#page-shell"
  data-automagica11y-focus-map-anchor="#floating-anchor">
</div>
```

- Attribute value accepts a semicolon-separated list or a JSON array of selectors.
- `data-automagica11y-focus-map-scope="self"` queries within the current element; otherwise pass a CSS selector (e.g., `#page-shell`) or omit to use the whole document.
- `data-automagica11y-focus-map-anchor` points at a focusable element that represents where the mapped sequence belongs in the DOM. Tab/Shift+Tab on the anchor routes focus into/out of the sequence while keeping the rest of the page unaffected.

⚠️ If the anchor selector is missing and the scope is not a specific element, the focus map will not activate. The anchor acts as the entry and exit point for the sequence and must resolve to a focusable element.

- The pattern never assigns positive `tabindex`. Instead it listens for `Tab`/`Shift+Tab` within the mapped elements so keyboard order stays anchored to the surrounding context.

⚠️ The mapped focus sequence is captured once on initialization. If elements are added, removed, or become disabled after setup, the focus map will not automatically update. Re‑initialize the pattern after DOM changes to refresh its focus order.

The focus map is intentionally non‑disruptive — pressing Tab on the last mapped element will continue naturally to the next focusable item in the DOM, preserving page flow. This behavior is by design to keep the rest of the page unaffected.

---

## Per-element Links (`data-automagica11y-focus-next` / `data-automagica11y-focus-prev`)

Opt any focusable element into a custom neighbor relationship without authoring a full map. The runtime listens for `Tab`/`Shift+Tab`, resolves the linked selector inside the configured scope, and moves focus to the next available candidate. Hidden, disabled, or inert matches are skipped automatically so keyboard users never land on inert controls.

```html
<div data-automagica11y-focus-scope="#control-deck">
  <button id="shuffle" data-automagica11y-focus-next="#repeat">Shuffle</button>
  <button id="play"
          data-automagica11y-focus-next="#queue"
          data-automagica11y-focus-prev="#shuffle">Play</button>
  <div id="control-deck">
    <button id="repeat" data-automagica11y-focus-prev="#play">Repeat</button>
    <button id="queue">Queue</button>
  </div>
</div>
```

- `data-automagica11y-focus-next` and `data-automagica11y-focus-prev` accept any valid CSS selector (IDs, classes, complex chains). The handler searches the nearest scoped root and focuses the resolved element or its first focusable descendant.
- `data-automagica11y-focus-scope="self"` constrains selector resolution to the current element. Passing a selector (e.g., `#control-deck`) scopes the lookup to that container; omit the attribute to search the entire document or shadow root.
- Reverse edges are inferred automatically, so `Shift+Tab` works even if you only authored `data-automagica11y-focus-next` links.
- Focus links are initialized globally via `initFocusLinks()` and co-exist with focus maps—use maps for long sequences and per-element links for lightweight overrides.

If a selector cannot be resolved, or every resolved element is unfocusable, the library lets the browser’s natural tab order continue.

---

## Focus Trap (`data-automagica11y-focus-trap`)

Lock focus within a container while it is shown. The declarative pattern wraps the imperative `enableFocusTrap` helper so dialogs, popovers, and custom disclosures can opt into containment with a single attribute.

```html
<div
  data-automagica11y-focus-trap
  data-automagica11y-focus-trap-initial="[data-primary]"
  data-automagica11y-focus-trap-return="true"
  data-automagica11y-focus-trap-escape-dismiss="false">
  <!-- tabbables -->
</div>
```

- `data-automagica11y-focus-trap` marks the container. When visible, focus wraps on `Tab`/`Shift+Tab` and cannot leak.
- `data-automagica11y-focus-trap-initial` accepts `first`, `last`, or a selector inside the container. Defaults to the first tabbable.
- `data-automagica11y-focus-trap-return` controls whether focus returns to the previously focused element on release (default `true`).
- `data-automagica11y-focus-trap-escape-dismiss` enables Escape-to-release for non-modal surfaces (default `false`).
- `data-automagica11y-focus-trap-auto` toggles automatic activation when the container is revealed (`hidden`/`aria-hidden` removed). Defaults to `true`.

Activation happens two ways:

1. **Automatic visibility watcher** – When `-auto` is not `false`, the trap enables itself once the element becomes visible and tears down when hidden or detached.
2. **Lifecycle events** – Dispatch `automagica11y:toggle`, `automagica11y:toggle:opened`, `automagica11y:toggle:closed`, `automagica11y:shown`, or `automagica11y:hidden` with `detail.target` referencing the container to force enable/disable. This mirrors the events emitted by the toggle pattern.

Nested traps are coordinated by a shared manager so the most recent activation owns keyboard handling while parents pause. When the inner trap releases, the parent resumes automatically and restores focus according to its settings.

Escape dismissal dispatches `automagica11y:focus-trap:escape` from the container so hosts can react.

---

## Shared Focus Utilities

Located in `src/core/focus.ts`:

- `getFocusableIn(root)` – returns focusable elements within a container.
- `focusElement(element, { preserveTabIndex, preventScroll })` – focuses an element without permanently altering tabindex.
- `enableFocusTrap(container, options)` – installs a managed trap that wraps focus and returns a disposer. Context-driven patterns call this under the hood.
- `applyFocusOrder(elements)` – applies sequential `tabindex` values and returns a controller that can restore originals.

These helpers keep focus behavior predictable across patterns while letting authors opt into higher-level behaviors via declarative attributes.

---

## Learn more

| Document | Description |
|-----------|-------------|
| [Root README](../../README.md#getting-started) | Install instructions and pattern overview |
| [Focus docs](../../../docs/src/content/docs/patterns/focus.mdx) | Playground walkthrough of initial focus, maps, and traps |
| [Dialog pattern](../../../src/patterns/dialog/README.md) | Real-world consumer of focus utilities |
| [Core focus trap](../../../src/core/focus-trap.ts) | Implementation details for advanced customization |

---

## Roadmap

- [ ] Automatic rehydration when mapped nodes enter/exit the DOM (MutationObserver support).
- [ ] Author-provided fallbacks for when no focusable elements resolve inside a map sequence.
- [ ] Documentation generator that outputs focus diagrams for complex widget setups.

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
