# Tooltip Pattern (`data-automagica11y-tooltip`)

> _Declarative hover/focus hints with accessible defaults._

The **Tooltip Pattern** wires accessible descriptions without writing imperative code.
Attach `data-automagica11y-tooltip="#tipId"` to any trigger element and
automagicA11y will create the ARIA relationship, hide/show the tooltip on the
appropriate interactions, and emit lifecycle events for analytics or plugins.

---

## Overview

A tooltip pair consists of:

1. **Trigger** — the element users hover or focus.
2. **Tooltip** — the descriptive content referenced by the trigger.

```html
<button data-automagica11y-tooltip="#tip-weather">Forecast</button>
<span id="tip-weather" role="tooltip">Showers expected this afternoon.</span>
```

When initialized, automagicA11y automatically:

- Connects trigger and tooltip via `aria-describedby`.
- Ensures the tooltip has `role="tooltip"` and `aria-hidden`.
- Hides the tooltip by default (`hidden = true`).
- Keeps the tooltip visible while pointer rests on either trigger or tooltip.
- Dispatches namespaced lifecycle events (`automagica11y:tooltip:*`).

---

## Accessible Defaults

| Element | Behavior |
|---------|----------|
| **Trigger** | Receives `aria-describedby` pointing to the tooltip. Existing values are preserved. |
| **Tooltip** | Receives an ID (if missing), `role="tooltip"`, and `aria-hidden="true"`. |
| **Visibility** | Tooltip is hidden via both `hidden` and `aria-hidden` until activated. |
| **Keyboard** | Tooltip appears on trigger focus and hides on blur or `Escape`. |

---

## Interaction Lifecycle

- **Pointer enter** on trigger or tooltip → tooltip shows immediately.
- **Pointer leave** from both elements → tooltip hides after a short delay (100&nbsp;ms) to prevent flicker.
- **Focus** on trigger → tooltip shows.
- **Blur** from trigger (with no pointer hover) → tooltip hides on the same delay.
- **Escape key** → tooltip hides immediately and clears pending timers.

The delay ensures that moving between the trigger and tooltip content does not accidentally dismiss the tooltip.

---

## Attribute Reference

| Attribute | Description |
|-----------|-------------|
| `data-automagica11y-tooltip` | Selector (ID or class) resolving to the tooltip element. **Required.** |
| `data-automagica11y-trigger-class-[state]` | Classes applied to the trigger for truthy/falsy states (`open`, `active`, etc.). |
| `data-automagica11y-target-class-[state]` | Classes applied to the tooltip. Declared on the trigger element. |

Tooltips reuse the [truthiness mapping](../../../docs/truthiness.md) so synonyms like `open`, `expanded`, and `shown` behave consistently.

---

## Lifecycle Events

Each initialized tooltip dispatches the following events:

| Event | When it fires | Detail payload |
|-------|---------------|----------------|
| `automagica11y:tooltip:ready` | After initialization completes. | `{ trigger, target }` |
| `automagica11y:tooltip:toggle` | Whenever visibility changes. | `{ expanded, trigger, target }` |
| `automagica11y:tooltip:shown` | After the tooltip is shown. | `{ trigger, target }` |
| `automagica11y:tooltip:hidden` | After the tooltip is hidden. | `{ trigger, target }` |

For compatibility with early builds, the pattern also emits `automagica11y:ready` and `automagica11y:toggle` aliases.

```js
document.addEventListener("automagica11y:tooltip:toggle", (event) => {
  const { expanded, trigger, target } = event.detail;
  if (expanded) {
    console.log("Tooltip opened", trigger, target);
  }
});
```

---

## Styling Hooks

Tooltips share the same class grammar as the toggle pattern:

```html
<button
  data-automagica11y-tooltip="#tip-weather"
  data-automagica11y-trigger-class-active="has-tooltip"
  data-automagica11y-target-class-visible="tooltip--open">
  Forecast
</button>
<span id="tip-weather" class="tooltip">Showers expected this afternoon.</span>
```

- `data-automagica11y-trigger-class-*` affects the trigger.
- `data-automagica11y-target-class-*` affects the tooltip itself.
- No default classes are injected; define your own hooks as needed.

---

## Authoring Notes

- Tooltips must stay lightweight. Keep content brief and avoid focusable controls inside.
- Ensure the tooltip element has a unique ID — automagicA11y generates one if absent.
- Multiple triggers can point at the same tooltip by referencing the same selector.
- Consider adding a manual dismiss button for touch environments if the tooltip contains lengthy content.

---

## Roadmap

- [ ] Opt-in attributes to configure open/close delay per tooltip.
- [ ] Smart positioning helper that flips when overflowing the viewport.
- [ ] Touch-specific affordances (long-press support and dismiss buttons).

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
