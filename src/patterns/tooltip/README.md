# Tooltip Pattern (`data-automagica11y-tooltip`)

> _Declarative hover/focus hints with accessible defaults._

The **Tooltip Pattern** wires accessible tooltips without imperative logic. Attach `data-automagica11y-tooltip="#tipId"` to any trigger element and automagicA11y handles ARIA wiring, visibility state, and lifecycle events while keeping configuration declarative.

---

## Overview

A tooltip pair consists of:

1. **Trigger** — the element users hover or focus.
2. **Tooltip** — the content element referenced by the trigger.

```html
<button data-automagica11y-tooltip="#tip-weather">Forecast</button>
<span id="tip-weather" role="tooltip">Showers expected this afternoon.</span>
```

When initialized, automagicA11y automatically:

- Connects trigger and tooltip with `aria-describedby`.
- Ensures the tooltip has `role="tooltip"` and `aria-hidden`.
- Hides the tooltip by default (`hidden = true`).
- Emits `automagica11y:toggle` events whenever the tooltip opens or closes.

---

## Interaction Lifecycle

- Pointer **enter** on trigger or tooltip → tooltip shows.
- Trigger **focus** → tooltip shows.
- Pointer **leave** from both trigger and tooltip → tooltip hides (after a short delay to allow crossing between elements).
- Trigger **blur** → tooltip hides (unless the pointer remains on the trigger/tooltip).
- **Escape** key → tooltip hides immediately.

Tooltip visibility persists while the pointer rests on either element, preventing flicker when moving between trigger and tooltip content.

---

## Class Hooks

Tooltip reuses the same truthiness-aware class mapping attributes:

```html
<button
  data-automagica11y-tooltip="#tip-weather"
  data-automagica11y-trigger-class-active="has-tooltip"
  data-automagica11y-target-class-visible="tooltip--open">
  Forecast
</button>
<span id="tip-weather" class="tooltip">Showers expected this afternoon.</span>
```

- `data-automagica11y-trigger-class-*` applies to the trigger when the tooltip is shown/hidden.
- `data-automagica11y-target-class-*` applies to the tooltip.
- Unlike toggle, no default classes are added unless you specify them.

---

## Events

Each initialized tooltip dispatches:

| Event | When it fires |
|-------|----------------|
| `automagica11y:ready` | After initialization with `{ trigger, target }`. |
| `automagica11y:toggle` | On open/close with `{ expanded, trigger, target }`. |

Use the `automagica11y:toggle` payload to integrate with announce, analytics, or custom behaviors.

---

## Accessibility Notes

- If the tooltip element lacks an `id`, automagicA11y generates one so `aria-describedby` always resolves.
- Existing `aria-describedby` references on the trigger are preserved; the tooltip ID is appended.
- Tooltips set `aria-hidden="true"` while hidden to keep screen reader verbosity down when the tooltip is not visible.

---

## Roadmap

- [ ] Optional delay attributes for open/close to better support stylus interactions.
- [ ] Smart positioning helper that flips the tooltip when it would overflow the viewport.
- [ ] Touch-specific affordances (long-press detection and dismiss buttons for mobile).

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
