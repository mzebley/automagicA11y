# Pattern Status

automagicA11y patterns are small, self-contained behaviors that automatically handle ARIA attributes, keyboard controls, and class/state reflection. This document tracks what ships today versus what is on the roadmap.

---

## Available Today

### Toggle / Disclosure (v0.1)

**Description:** Foundational component for show/hide interactions. Manages `aria-expanded`, `aria-controls`, open/closed truthiness mapping, and class reflection.

**Highlights:**
- Works with buttons and non-button triggers.
- Generates trigger IDs, ARIA relationships, and keyboard semantics automatically.
- Emits `automagica11y:ready` and `automagica11y:toggle` events.
- Supports declarative class mapping with synonym-aware data attributes.

---

### Tooltip (v0.2)

**Description:** Hover/focus tooltip that wires `aria-describedby`, `role="tooltip"`, and manages visibility automatically.

**Highlights:**
- Hides the tooltip by default and synchronizes `hidden`/`aria-hidden` on every toggle.
- Honors per-trigger open/close delay attributes so teams can match their motion guidelines.
- Auto-flips placement when the preferred side would clip the viewport and exposes `data-automagica11y-tooltip-placement` for styling.
- Keeps the tooltip visible while the pointer rests on the trigger/tooltip pair and supports long-press activation on touch.
- Reuses class mapping attributes without applying toggle-specific defaults.
- Emits `automagica11y:ready`/`automagica11y:toggle` so announce or custom listeners can respond.

---

### Dialog (v0.2)

**Description:** Accessible modal dialog that traps focus, locks background content, and restores state on close.

**Highlights:**
- Adds `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` to triggers.
- Ensures the dialog container is hidden by default with `role="dialog"`, `aria-modal`, and `tabindex="-1"`.
- Moves focus inside on open, keeps Tab/Shift+Tab cycling within, and returns focus when closing.
- Applies `inert` + `aria-hidden` to background siblings and prevents body scroll while open.
- Dispatches `automagica11y:ready`/`automagica11y:toggle` events so announce, analytics, or custom hooks can react.

---

### Focus Utilities (v0.3)

**Description:** Declarative helpers for initial focus placement and custom tab order mapping.

**Highlights:**
- `data-automagica11y-focus-initial` focuses an element once after hydration without permanently changing its tabindex.
- `data-automagica11y-focus-map` lets you define selector-based tab sequences scoped to a container. Pair it with `data-automagica11y-focus-map-anchor` to keep the mapped order aligned with the surrounding DOM (for example, when a floating music player is rendered at the end of the document but appears near the top of the UI).
- Shared core utilities (`getFocusableIn`, `focusElement`, `createFocusTrap`) keep focus trapping consistent across patterns.

---

## In Development

### Accordion (target release v0.3)

**Goal:** Grouped toggle pattern that builds on the existing toggle logic.

**Planned features:**
- `data-automagica11y-group` attribute for mutual exclusion.
- Arrow-key navigation between triggers.
- Optional “only one open” mode.

### Menu / Disclosure Menu (target release v0.3+)

**Goal:** Dropdown/disclosure menu following the ARIA Menu Button pattern.

**Planned features:**
- Keyboard arrow navigation and proper menu roles.
- Escape key close behavior.
- Optional hover activation.

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
