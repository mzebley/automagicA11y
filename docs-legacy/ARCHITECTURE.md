# automagicA11y Architecture

This document explains how **automagicA11y** is structured internally and how its modular registry and helper systems work.

---

## Overview

automagicA11y follows a modular design where each **pattern** (toggle, tooltip, dialog today; more coming) is self-contained but shares core utilities for:

- Class management
- ARIA attribute wiring
- Event emission
- Keyboard handling

This architecture ensures that:

- Patterns don't conflict
- Core utilities are reusable and consistent
- New patterns can be added without touching existing code

---

## Registry System

The **registry** is the backbone that keeps patterns independent but coordinated.

```ts
registerPattern(name: string, selector: string, initFn: (el: Element) => void);

initPattern("dialog", someContainer);
initPatterns(["tooltip", "dialog"], someContainer);
initAllPatterns(document);
initNode(fragment);
```

- Each pattern registers itself with a name and a selector (e.g., `[data-automagica11y-toggle]`).
- `initPattern()` / `initPatterns()` hydrate specific patterns within a provided root.
- `initAllPatterns()` hydrates every registered pattern within the provided root (defaults to `document`).
- `initNode()` is handy for dynamically inserted fragments (SSR, SPA hydration, shadow roots, etc.).

This allows you to dynamically load only the patterns you want, or initialize specific sections of a page.

---

## Helpers

### `classes.ts`

Handles class toggling and **truthiness mapping**.

- Reads `data-automagica11y-[trigger|target]-class-[action]` attributes.
- Maps synonyms (`open`, `expanded`, `active`, etc.) to true/false.
- Exposes `createClassToggler()` so patterns flip classes without re-parsing config.

### `attributes.ts`

Shared helpers for predictable IDs and ARIA/state attributes.

- `ensureId()` generates stable element IDs.
- `appendToken()` safely appends tokens (e.g., `aria-describedby`) without duplicates.
- `setAriaExpanded()` / `setAriaHidden()` normalize boolean ARIA states.

### `styles.ts`

Keeps DOM visibility and inert management consistent.

- `setHiddenState()` syncs `hidden` and `aria-hidden`.
- `setInert()` toggles the `inert` attribute while preserving author intent.

### `focus.ts`

Reusable focus primitives shared by dialogs and focus patterns.

- `getFocusableIn()` enumerates tabbable descendants.
- `focusElement()` focuses while preserving original tabindex.
- `enableFocusTrap()` loops focus within a container.
- `applyFocusOrder()` applies temporary tabindex maps and restores originals.

### `aria.ts`

Lightweight helper for applying ARIA attributes only when missing. (Currently a single utility with room to grow.)

### `keyboard.ts`

Holds shared keyboard affordance helpers such as `isActivateKey()`. Additional helpers will land alongside new patterns.

### `events.ts`

Wrapper for dispatching typed custom events. Future patterns can build on this instead of re-implementing dispatch logic.

### Context layering

Patterns now compose three distinct responsibilities:

1. **Wiring** — Toggle still owns class reflection, `aria-expanded`, and event emission.
2. **Semantics** — Contexts call shared helpers (linking triggers, setting roles/ARIA) so every entry point stays consistent.
3. **Behaviors** — Contexts enable optional helpers such as focus traps, Escape-to-close listeners, hover intent, and inert siblings.

Because contexts are addressable by name (`data-automagica11y-context="dialog"`), legacy attributes can simply defer to them. This keeps feature parity between declarative aliases and new declarative syntax while allowing advanced users to opt into `semantics-only` or `behaviors-only` modes when integrating custom wiring.

---

## Lifecycle Events

Every component dispatches consistent lifecycle events:

- `automagica11y:ready` — after setup
- `automagica11y:toggle` — whenever state changes

The announce pattern is the canonical listener for these events. Once `registerAnnouncePlugin()` runs, a shared live region responds to hooks like `automagica11y:toggle`. Future patterns (dialogs, accordions, menus) will emit the same events so announce can announce their state transitions without creating new live regions.

---

## Pattern Isolation

Each pattern registers against its own selector. Today that includes toggle, tooltip, and dialog; upcoming patterns (accordion, menu, etc.) will follow the same convention.
All patterns share the same attribute naming grammar (trigger/target/class/action) but register separately via the registry.

This ensures no collisions and predictable initialization order.

---

## Adding a New Pattern

1. Create a new folder under `src/patterns/` (e.g., `menu/`).
2. Create a pattern init function: `initMenu(trigger: HTMLElement)`.
3. Register it in `src/patterns/index.ts`:

   ```ts
   registerPattern("menu", "[data-automagica11y-menu]", initMenu);
   ```

4. Use shared helpers (e.g., `createClassToggler()`, `ensureId()`, `setHiddenState()`).
5. Add examples and tests.
6. Done.

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
