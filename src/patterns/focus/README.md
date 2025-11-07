# Focus Utilities

> _Declarative helpers to control initial focus and custom tab order._

automagicA11y ships two focus-oriented patterns plus shared utilities that other patterns (like dialogs) rely on. These helpers never mutate author-defined tabindex ordering permanently — they apply temporary adjustments and restore originals automatically.

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

## Shared Focus Utilities

Located in `src/core/focus.ts`:

- `getFocusableIn(root)` – returns focusable elements within a container.
- `focusElement(element, { preserveTabIndex, preventScroll })` – focuses an element without permanently altering tabindex.
- `createFocusTrap(container)` – reusable trap used by the dialog pattern for keyboard containment.
- `applyFocusOrder(elements)` – applies sequential `tabindex` values and returns a controller that can restore originals.

These helpers keep focus behavior predictable across patterns while letting authors opt into higher-level behaviors via declarative attributes.

---

## Roadmap

- [ ] Automatic rehydration when mapped nodes enter/exit the DOM (MutationObserver support).
- [ ] Author-provided fallbacks for when no focusable elements resolve inside a map sequence.
- [ ] Documentation generator that outputs focus diagrams for complex widget setups.

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
