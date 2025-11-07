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
- Honors per-trigger open/close delay attributes so teams can match existing motion guidance.
- Calculates a safe tooltip placement and flips to the opposite side when the preferred position would overflow the viewport.
- Provides long-press support on touch and wires optional dismiss controls for screen magnifier users.

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

- **Pointer enter** on trigger or tooltip → tooltip shows after the configured open delay (`0` ms default).
- **Pointer leave** from both elements → tooltip hides after the configured close delay (`100`&nbsp;ms default) to prevent flicker.
- **Focus** on trigger → tooltip shows immediately, ignoring pointer delays for accessibility.
- **Blur** from trigger (with no pointer hover) → tooltip hides on the same delay.
- **Escape key** → tooltip hides immediately and clears pending timers.
- **Touch long-press** → tooltip appears after ~550&nbsp;ms and remains visible until dismissed or another interaction occurs.

The delay ensures that moving between the trigger and tooltip content does not accidentally dismiss the tooltip.

---

## Attribute Reference

| Attribute | Description |
|-----------|-------------|
| `data-automagica11y-tooltip` | Selector (ID or class) resolving to the tooltip element. **Required.** |
| `data-automagica11y-tooltip-open-delay` | Delay (ms) before showing the tooltip for pointer interactions. Default `0`. |
| `data-automagica11y-tooltip-close-delay` | Delay (ms) before hiding the tooltip when neither pointer nor focus is active. Default `100`. |
| `data-automagica11y-tooltip-position` | Preferred placement: `top`, `bottom`, `left`, `right`, or `auto`. Defaults to `auto` (prefers bottom but flips when overflowing). |
| `data-automagica11y-trigger-class-[state]` | Classes applied to the trigger for truthy/falsy states (`open`, `active`, etc.). |
| `data-automagica11y-target-class-[state]` | Classes applied to the tooltip. Declared on the trigger element. |
| `data-automagica11y-tooltip-dismiss` | Add to an element inside the tooltip (ideally a `<button>`) to close the tooltip on touch or keyboard activation. |

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
- Consider exposing a visible dismiss affordance for touch users when the tooltip contains lengthy content; automagicA11y wires `[data-automagica11y-tooltip-dismiss]` controls automatically.

---

## Responsive Placement

Set `data-automagica11y-tooltip-position` to a preferred side. The pattern will honor the request when there is space, but automatically flip to the opposite side when the tooltip would clip the viewport. Use the generated `data-automagica11y-tooltip-placement` attribute for styling arrows and offsets:

```css
[data-automagica11y-tooltip-placement="top"] { /* place tooltip above */ }
[data-automagica11y-tooltip-placement="bottom"] { /* default below trigger */ }
```

---

## Touch Support

- Long-pressing the trigger (`~550` ms) shows the tooltip without requiring hover.
- The tooltip stays visible after the finger lifts until dismissed, supporting screen magnifiers and switch users.
- Add `[data-automagica11y-tooltip-dismiss]` to a button or link inside the tooltip to provide a keyboard and touch-friendly close control.

---

## Roadmap

- [x] Opt-in attributes to configure open/close delay per tooltip.
- [x] Smart positioning helper that flips when overflowing the viewport.
- [x] Touch-specific affordances (long-press support and dismiss buttons).
- [ ] Investigate collision detection with nested scroll containers.
- [ ] Author guidance for pairing tooltips with form validation hints.

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
