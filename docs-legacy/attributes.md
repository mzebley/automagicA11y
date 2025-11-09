# Attribute Grammar

automagicA11y uses a predictable, declarative attribute structure. Toggle/disclosure ships today, and upcoming patterns (tooltip, dialog, etc.) will reuse the same grammar.

```text
data-automagica11y-[element]-[affordance]-[action]
```

> **Alias-friendly:** Prefer the canonical `data-automagica11y-` prefix in docs, but the runtime also accepts shorthands such as `data-automagically-`, `data-ama11y-`, `data-ama-`, or `data-automagic-`. Every alias normalizes to the canonical prefix before parsing.

| Part | Description | Examples |
|------|--------------|-----------|
| `element` | The item being manipulated (`trigger` or `target`) | `data-automagica11y-trigger-*` |
| `affordance` | What’s being controlled (`class`, `attr`, `style`) | `data-automagica11y-trigger-class-open` |
| `action` | The resulting state (`open`, `closed`, etc.) | `data-automagica11y-target-class-closed` |

---

## Examples

### Toggle Example

```html
<button data-automagica11y-toggle="#faq1" data-automagica11y-trigger-class-open="btn-active" data-automagica11y-trigger-class-closed="btn-inactive">
  FAQ
</button>
<div id="faq1">...</div>
```

### Tooltip Example

```html
<button data-automagica11y-tooltip="#tip1" data-automagica11y-trigger-class-open="hovering">
  Hover me
</button>
<span id="tip1" role="tooltip">Tooltip text</span>
```

**Tooltip-specific attributes** extend the base grammar:

- `data-automagica11y-tooltip-open-delay` / `data-automagica11y-tooltip-close-delay` tune interaction timing per trigger.
- `data-automagica11y-tooltip-position` sets a preferred side while still allowing the helper to flip when overflowing.
- `data-automagica11y-tooltip-dismiss` designates an internal control that closes the tooltip for touch/keyboard users.

### Dialog Example

```html
<button
  data-automagica11y-dialog="#modal"
  data-automagica11y-trigger-class-open="btn--armed">
  Open dialog
</button>

<div id="modal" role="dialog" aria-labelledby="modal-title" hidden>
  <div role="document">
    <h2 id="modal-title">Announcement</h2>
    <p>This dialog shows how background inerting and closing controls work.</p>
    <button data-automagica11y-dialog-close>Close</button>
  </div>
</div>
```

### Focus Examples

```html
<!-- Initial focus -->
<button
  data-automagica11y-focus-initial
  data-automagica11y-focus-prevent-scroll="false"
  data-automagica11y-focus-delay="150">
  Skip to content
</button>

<!-- Focus map -->
<div id="focus-map-anchor" tabindex="0"></div>

<div
  data-automagica11y-focus-map="#navbar a; #player button; main [data-primary]"
  data-automagica11y-focus-map-scope="document"
  data-automagica11y-focus-map-anchor="#focus-map-anchor">
</div>
```

| Attribute | Description |
|-----------|-------------|
| `data-automagica11y-focus-initial` | Focus this element once after hydration. |
| `data-automagica11y-focus-prevent-scroll` | Optional (`true` default). Pass `"false"` to allow scrolling during the focus call. |
| `data-automagica11y-focus-delay` | Delay (ms) before applying initial focus. |
| `data-automagica11y-focus-map` | Semicolon-separated list or JSON array of selectors defining the tab sequence. |
| `data-automagica11y-focus-map-scope` | `"self"` to scope selectors to the current element, a CSS selector (e.g., `#sidebar`) to target a specific container, or omit to use the entire document. |
| `data-automagica11y-focus-map-anchor` | CSS selector that determines where the remapped elements sit in the natural tab order (defaults to the scope container). |
| `data-automagica11y-animate` | `trigger` or `target`. Delays hiding until the specified element’s CSS transition/animation finishes. |

---

## Grammar Benefits

- **Consistency** — one pattern for all features
- **Discoverability** — developers can infer attributes by name
- **Scalability** — easy to extend with `-attr-` or `-style-` affordances later

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
