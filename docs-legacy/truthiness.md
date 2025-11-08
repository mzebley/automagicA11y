# Truthiness Mapping System

automagicA11y introduces a **truthiness mapping** to normalize state terms (like `open`, `expanded`, or `active`) into a boolean model internally. Toggle, tooltip, and dialog patterns all rely on this mapping when applying trigger/target classes.

---

## Purpose

Different developers use different terms for describing states. For example:

- Some write `data-automagica11y-trigger-class-open`.
- Others prefer `data-automagica11y-trigger-class-active`.

Truthiness mapping makes these interchangeable by interpreting the meaning of the term.

---

## Implementation Details

### Truthy and Falsy Sets

```ts
const truthy = new Set(["open","expanded","shown","active","pressed","true","on"]);
const falsy  = new Set(["closed","collapsed","hidden","inactive","unpressed","false","off"]);
```

### Parsing Flow

1. Scan all attributes matching `data-automagica11y-[trigger|target]-class-[state]`.
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
  data-automagica11y-toggle="#info"
  data-automagica11y-trigger-class-active="btn--active"
  data-automagica11y-trigger-class-inactive="btn--ghost"
  data-automagica11y-target-class-expanded="panel--visible"
  data-automagica11y-target-class-collapsed="panel--hidden">
  Info
</button>
<div id="info" hidden>More information...</div>
```

Internally:

- `active` and `expanded` resolve to **truthy**.
- `inactive` and `collapsed` resolve to **falsy**.

Result: same behavior, regardless of terminology.

---

## Future Use: Announcements

The announce pattern uses the same notion of "expanded" vs "collapsed" when generating default live messages. As we broaden truthiness mapping (for example, to support localized strings), the announce defaults can tap into the shared table to keep spoken feedback consistent with class/state naming.

---

## Context aliases

Contexts accept a variety of friendly names which normalize to canonical keys before being applied. Use whichever term feels most natural—automagicA11y keeps the semantics consistent.

| Friendly term(s) | Canonical context |
| ---------------- | ----------------- |
| `dialog`, `modal` | `dialog` |
| `tooltip` | `tooltip` |
| `dropdown`, `menu`, `kebab`, `meatball`, `overflow`, `popover` | `menu` |
| `details`, `disclosure`, `expander` | `disclosure` |
| `accordion` | `accordion` |
| `select`, `combobox`, `listbox` | `listbox` |
| `tabs`, `tablist` | `tablist` |
| `tree`, `treeview` | `tree` |

The table mirrors the lookup used by `normalizeContext()` so both declarative markup and imperative APIs resolve to the same behaviors.

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
