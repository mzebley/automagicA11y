# Truthiness Mapping System

autoA11y introduces a **truthiness mapping** to normalize state terms (like `open`, `expanded`, or `active`) into a boolean model internally.

---

## Purpose

Different developers use different terms for describing states. For example:

- Some write `data-autoa11y-trigger-class-open`.
- Others prefer `data-autoa11y-trigger-class-active`.

Truthiness mapping makes these interchangeable by interpreting the meaning of the term.

---

## Implementation Details

### Truthy and Falsy Sets

```ts
const truthy = new Set(["open","expanded","shown","active","pressed","true","on"]);
const falsy  = new Set(["closed","collapsed","hidden","inactive","unpressed","false","off"]);
```

### Parsing Flow

1. Scan all attributes matching `data-autoa11y-[trigger|target]-class-[state]`.
2. Split the `state` segment (`open`, `collapsed`, `active`, etc.).
3. Determine if the keyword is **truthy** or **falsy**.
4. Store them in the config object under `.true` or `.false` arrays.
5. When toggling, add classes from `.true` and remove `.false`, or vice versa.

---

## Benefits

- Developers can use any term they find natural.
- Keeps code DRY and predictable.
- Easily extended to cover new state types (like `selected/unselected`).

---

## Example

```html
<button
  data-autoa11y-toggle="#info"
  data-autoa11y-trigger-class-active="btn--active"
  data-autoa11y-trigger-class-inactive="btn--ghost"
  data-autoa11y-target-class-expanded="panel--visible"
  data-autoa11y-target-class-collapsed="panel--hidden">
  Info
</button>
<div id="info" hidden>More information...</div>
```

Internally:

- `active` and `expanded` resolve to **truthy**.
- `inactive` and `collapsed` resolve to **falsy**.

Result: same behavior, regardless of terminology.
