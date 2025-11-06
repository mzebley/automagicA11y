# automagicA11y

Licensed under the MIT License

Version: 0.1 (concept phase)

_Tagline: Drop an attribute. Get the ARIA._

---

## Overview

automagicA11y is a lightweight, framework-agnostic accessibility utility that automates ARIA attributes, accessibility states, and related classes for common interactive components such as toggles, tooltips, dialogs, and menus.

Built for simplicity and scalability, it uses a consistent declarative syntax via `data-automagica11y-*` attributes to handle open or closed states, ARIA bindings, and accessibility affordances automatically.

---

## Design Philosophy

The guiding principle of automagicA11y is to make accessibility effortless and predictable.

1. **Declarative, not prescriptive**  
   Add a single `data-automagica11y-*` attribute. The library handles ARIA, keyboard bindings, and state reflection automatically.

2. **Universal grammar**  
   Every interactive pattern (toggle, tooltip, dialog, etc.) follows the same mental model:

   `element -> affordance -> action`

   `data-automagica11y-[element]-[affordance]-[action]`

   | Element  | Description                                    | Example                                |
   | -------- | ---------------------------------------------- | -------------------------------------- |
   | trigger  | Interactive element that initiates the change  | `data-automagica11y-trigger-class-open`     |
   | target   | Element that responds to the trigger           | `data-automagica11y-target-class-open`      |
   | affordance | Type of thing being manipulated (class, attr, style) | `class`                       |
   | action   | Current or resulting state (open, closed, etc.) | `open`, `closed`                       |

   This structure provides consistent, composable naming that can scale across all patterns.

3. **Lightweight by design**  
   Each module (toggle, tooltip, dialog) is a standalone ~2-3 kB file. No dependencies and no framework lock-in.

4. **ARIA handled for you**  
   automagicA11y automatically applies and maintains required ARIA attributes (`aria-expanded`, `aria-controls`, `aria-labelledby`, etc.) and accessible keyboard behaviors.

5. **Predictable class hooks**  
   Trigger and target classes reflect open or closed state using customizable attributes:

   ```html
   <button
     data-automagica11y-toggle="#details"
     data-automagica11y-trigger-class-open="active"
     data-automagica11y-trigger-class-closed="inactive"
     data-automagica11y-target-class-open="visible"
     data-automagica11y-target-class-closed="hidden">
     More details
   </button>

   <div id="details">Hidden content</div>
   ```

   If no custom classes are defined, automagicA11y defaults to:

   - Trigger: `automagic-toggle-open` / `automagic-toggle-closed`
   - Target: `automagic-target-open` / `automagic-target-closed`

---

## Core Patterns

### Toggle / Disclosure

#### Minimum viable example

```html
<button data-automagica11y-toggle="#faq1">More details</button>
<div id="faq1">Hidden content</div>
```

#### What happens automatically

- `aria-controls` and `aria-expanded` applied to the trigger
- `aria-labelledby` applied to the target
- Keyboard interaction (Enter/Space toggles)
- Classes updated based on state
- Optional `role="button"` and `tabindex="0"` applied to non-button triggers

#### Optional attributes

| Attribute                          | Description                               |
| ---------------------------------- | ----------------------------------------- |
| `data-automagica11y-trigger-class-open` | Classes to add when open                  |
| `data-automagica11y-trigger-class-closed` | Classes to add when closed              |
| `data-automagica11y-target-class-open` | Classes to add when target is visible     |
| `data-automagica11y-target-class-closed` | Classes to add when target is hidden    |
| `data-automagica11y-group`             | Treat multiple toggles as an accordion    |
| `data-automagica11y-inert`             | Apply or remove the `inert` attribute when closed |
| `data-automagica11y-persist`           | Remember open state (local or session)    |
| `data-automagica11y-hash`              | Sync state with the URL hash              |
| `data-automagica11y-animate`           | Delay hiding to support transitions       |

### Tooltip (planned)

Reuses the same attribute syntax but maps to `aria-describedby` and `role="tooltip"`.

```html
<button
  data-automagica11y-tooltip="#tip1"
  data-automagica11y-trigger-class-open="tooltip-active"
  data-automagica11y-target-class-open="tooltip-visible">
  ?
</button>
<span id="tip1" role="tooltip" hidden>Helpful tip...</span>
```

### Dialog (planned)

Manages focus trap, `aria-modal`, and background `inert` state automatically.

```html
<button
  data-automagica11y-dialog="#login"
  data-automagica11y-trigger-class-open="pressed">
  Login
</button>
<div id="login" role="dialog" hidden>Dialog content...</div>
```

---

### Announce (cross-cutting)

The announce pattern provides a shared live region for screen reader updates so individual components stay declarative.

Add `data-automagica11y-announce` to any pattern trigger to opt in:

```html
<button
  data-automagica11y-toggle="#faq1"
  data-automagica11y-announce="polite"
  data-automagica11y-announce-open="FAQ expanded"
  data-automagica11y-announce-closed="FAQ collapsed">
  FAQ
</button>
```

Behavior:

- Defaults to polite announcements (use `assertive` to override).
- Skips redundant announcements when focus remains on the control.
- Falls back to the trigger's accessible name (`aria-label`, `aria-labelledby`, or text content).
- Automatically listens for events like `automagica11y:toggle`.

Register once on boot:

```ts
import { registerAnnouncePlugin } from "automagica11y";

registerAnnouncePlugin();
```

---

## Attribute Synonyms

automagicA11y recognizes several synonyms for open or closed states to improve author ergonomics.

| True states                   | False states                           |
| ----------------------------- | -------------------------------------- |
| open, expanded, shown, active, pressed | closed, collapsed, hidden, inactive, unpressed |

Internally, all map to a boolean expanded state.

---

## Truthiness Mapping System

automagicA11y uses a truthiness mapping mechanism to normalize synonyms for open or closed (or true or false) states. This allows developers to use whichever terms make sense in their project while keeping the logic consistent internally.

### How it works

Each recognized action keyword is categorized into one of two groups:

- Truthy states -> represent `expanded = true`
- Falsy states -> represent `expanded = false`

| Truthy keywords | Falsy keywords |
| --------------- | -------------- |
| open            | closed         |
| expanded        | collapsed      |
| shown           | hidden         |
| active          | inactive       |
| pressed         | unpressed      |
| true            | false          |
| on              | off            |

Internally, any `data-automagica11y-*-class-[keyword]` attribute is parsed through this table and resolved to either a true or false state. This lets authors mix terminology freely. For example, `data-automagica11y-target-class-expanded` and `data-automagica11y-target-class-active` both behave as the same truthy condition.

### Benefits

- Flexible authoring: Use whichever keywords match your mental model.
- Predictable behavior: Everything ultimately maps to a boolean expanded state.
- Future extensibility: Works equally for any binary state (for example, pressed/unpressed or on/off).

### Example

```html
<div
  data-automagica11y-toggle="#panel"
  data-automagica11y-trigger-class-active="btn--active"
  data-automagica11y-trigger-class-inactive="btn--ghost"
  data-automagica11y-target-class-expanded="panel--visible"
  data-automagica11y-target-class-collapsed="panel--hidden">
  Toggle Content
</div>
<div id="panel">...</div>
```

Both the trigger and target use synonym terms, but automagicA11y resolves them through the truthiness mapping system.

---

## Event Model

automagicA11y dispatches custom events for integration:

- `automagica11y:ready` — when a component is initialized
- `automagica11y:toggle` — when a toggle or disclosure changes state
- `automagica11y:open` / `automagica11y:close` — convenience events for state transitions

```js
document.addEventListener('automagica11y:toggle', (event) => {
  console.log(event.detail.expanded ? 'opened' : 'closed');
});
```

---

## Architecture

### Core modules

- Registry — pattern registration (toggle, tooltip, dialog, etc.)
- Helpers — class toggling, ARIA wiring, keyboard management
- Patterns — behaviors registered via `registerPattern(name, selector, initFn)`

### Class helper example

```js
applyA11yClasses(cfg, expanded, trigger, target);
```

This helper is shared across all patterns to keep class handling consistent.

### Pattern registration example

```js
registerPattern('toggle', '[data-automagica11y-toggle]', initToggle);
registerPattern('tooltip', '[data-automagica11y-tooltip]', initTooltip);
```

Each pattern initializes independently, avoiding collisions while sharing helpers.

---

## Default Styles

```css
[hidden] {
  display: none !important;
}
.automagic-toggle-open {}
.automagic-toggle-closed {}
.automagic-target-open {}
.automagic-target-closed {}
```

Authors can override these defaults or disable automatic classes.

---

## Roadmap

### v0.1 (MVP)

- [x] Core toggle pattern
- [x] Configurable trigger and target classes
- [x] Synonym and truthiness mapping system
- [x] Event system
- [x] Non-button accessibility fixes

### v0.2

- [ ] Tooltip pattern
- [ ] Dialog pattern
- [ ] Shared class, attribute, and style helpers
- [ ] Registry-based initialization

### v0.3+

- [ ] Focus management utilities
- [ ] Persist and hash plugins
- [ ] Animate plugin
- [ ] Framework wrappers (Angular, React, Svelte)

---

## License

MIT License (planned)

---

## Tagline Ideas

- "Drop an attribute. Get the ARIA."
- "No more aria-yak-shaving."
- "Accessibility by declaration."

## Further Reading

| Topic | Description |
|-------|--------------|
| [Architecture](./docs/ARCHITECTURE.md) | Deep dive into the internal registry, helper modules, and event lifecycle. |
| [Truthiness Mapping](./docs/truthiness.md) | How automagicA11y normalizes open/closed and active/inactive states into boolean logic. |
| [Patterns Roadmap](./docs/patterns.md) | Current and planned interactive patterns (toggle, tooltip, dialog, etc.). |
| [Plugins](./docs/plugins.md) | Optional future enhancements (persist, animate, hash-sync, announce, inert). |
| [Attribute Grammar](./docs/attributes.md) | Explains the `data-automagica11y-[element]-[affordance]-[action]` syntax and philosophy. |
| [Contributing Guide](./docs/CONTRIBUTING.md) | How to build, test, and contribute new patterns or fixes. |
| [Branding & Voice](./docs/branding.md) | Taglines, tone, and visual direction for the project identity. |

---

**Tip:** Keep the README focused on quick adoption and usage, and use these linked docs for deep architectural and contributor details.

---

(c) 2025 Mark Zebley

---
