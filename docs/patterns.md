# Patterns Roadmap

automagicA11y patterns are small, self-contained behaviors that automatically handle ARIA attributes, keyboard controls, and class/state reflection.

---

## v0.1 — Toggle / Disclosure

### Description

The foundational component. Manages `aria-expanded`, `aria-controls`, and open/closed classes.

### Features

- Handles buttons and non-button elements
- Custom class support via `data-automagica11y-trigger-class-open`
- Truthiness mapping for flexible naming
- Emits lifecycle events (`automagica11y:toggle`)

---

## v0.2 — Tooltip

### Description

Handles hover/focus interactions using `aria-describedby` and `role="tooltip"`.

### Planned Features

- Open on hover/focus, close on blur/leave
- `data-automagica11y-tooltip` to point to tooltip element
- Automatic ARIA role assignment
- Delay timers for better UX

---

## v0.2 — Dialog

### Description

Accessible modal system with `aria-modal`, focus trapping, and inert background.

### Planned Features

- `data-automagica11y-dialog` for trigger/target pair
- Adds/removes `aria-hidden` from background
- Keyboard ESC close support
- Focus restoration to trigger

---

## v0.3 — Accordion

### Description

A grouped toggle pattern using the same toggle behavior but with mutual exclusion.

### Planned Features

- `data-automagica11y-group` attribute
- Arrow key navigation between triggers
- Only one open at a time (optional)

---

## v0.3+ — Menu / Disclosure Menu

### Description

Dropdown or disclosure menu following ARIA Menu Button pattern.

### Planned Features

- Keyboard arrow navigation
- `role="menu"` and `role="menuitem"` support
- Escape key closes menu
- Optional hover activation
