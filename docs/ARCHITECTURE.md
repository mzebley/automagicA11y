# autoA11y Architecture

This document explains how **autoA11y** is structured internally and how its modular registry and helper systems work.

---

## Overview

autoA11y follows a modular design where each **pattern** (toggle, tooltip, dialog, etc.) is self-contained but shares core utilities for:

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
registerPattern(name: string, selector: string, initFn: (el: Element) => void)
```

- Each pattern registers itself with a name and a selector (e.g., `[data-autoa11y-toggle]`).
- `initAllPatterns()` runs through the registry and initializes all registered selectors in the document or given root.

This allows you to dynamically load only the patterns you want, or initialize specific sections of a page.

---

## Helpers

### `classes.ts`

Handles class toggling and **truthiness mapping**.

- Reads `data-autoa11y-[trigger|target]-class-[action]` attributes.
- Maps synonyms (`open`, `expanded`, `active`, etc.) to true/false.
- Applies/removes appropriate classes from both trigger and target.

### `aria.ts`

Provides utilities for applying and managing ARIA attributes safely.
Example:

```ts
setIfAbsent(el, "role", "button");
```

### `keyboard.ts`

Provides utilities for managing keyboard interactions.
Example:

```ts
if (isActivateKey(e)) toggle();
```

### `events.ts`

Centralized event dispatch helpers for uniform custom event handling.

---

## Lifecycle Events

Every component dispatches consistent lifecycle events:

- `autoa11y:ready` — after setup
- `autoa11y:toggle` — whenever state changes
- `autoa11y:open` / `autoa11y:close` — for convenience and custom logic

---

## Pattern Isolation

Each pattern (toggle, tooltip, dialog) only responds to its own selector.
They all use the same attribute naming conventions (trigger/target/class/action) but register separately via the registry.

This ensures no collisions and predictable initialization order.

---

## Adding a New Pattern

1. Create a new folder under `src/patterns/` (e.g., `menu/`).
2. Create a pattern init function: `initMenu(trigger: HTMLElement)`.
3. Register it in `src/patterns/index.ts`:

   ```ts
   registerPattern("menu", "[data-autoa11y-menu]", initMenu);
   ```

4. Use shared helpers (e.g., `getClassConfig()`, `applyClasses()`).
5. Add examples and tests.
6. Done.
