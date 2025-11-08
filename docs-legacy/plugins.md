# Plugin Concepts

automagicA11y aims to keep the core tiny and let optional behaviors layer on as needed. Today that means two shipped plugins (announce and animate) with more specialized plugins planned once patterns expand.

The new context registry exposes consistent semantics/behaviors across patterns, so plugins can observe a single stream of lifecycle events (`automagica11y:toggle`, `automagica11y:tooltip:shown`, etc.) regardless of whether a feature was activated via a legacy alias or the new `data-automagica11y-context` attribute.

---

## Current Plugin — Announce (Cross-cutting)

### Description

Shared live region that centralizes screen reader announcements for any pattern that emits `automagica11y:*` events.

### Usage

```ts
import { registerAnnouncePlugin } from "automagica11y";

registerAnnouncePlugin();
```

Add `data-automagica11y-announce` to a trigger to opt in:

```html
<button
  data-automagica11y-toggle="#details"
  data-automagica11y-announce="polite"
  data-automagica11y-announce-open="Details expanded"
  data-automagica11y-announce-closed="Details collapsed">
  Toggle details
</button>
```

### Features

- Singleton polite live region (assertive opt-in via `data-automagica11y-announce="assertive"`)
- Consumes trigger data attributes for custom messages
- Generates sensible defaults from accessible names
- Suppresses duplicate messages and skips redundant focused updates
- Listens to `automagica11y:toggle` from toggle, tooltip, and dialog patterns

---

## Current Plugin — Animate

### Description

Delays the “close” side of a pattern until its CSS transition/animation completes so UI stays smooth without manual timeouts.

### Usage

```ts
import { registerAnimatePlugin } from "automagica11y";

registerAnimatePlugin();
```

```html
<button
  data-automagica11y-toggle="#details"
  data-automagica11y-animate="target">
  Toggle details
</button>
```

### Features

- Watches the specified element for `transitionend` / `animationend` and only hides once the browser reports completion.
- Automatically skips delays when `prefers-reduced-motion: reduce` is active or when no animation is present.
- Applies a defensive timeout so content never gets stuck mid-animation.
- Works with any pattern that emits `automagica11y:toggle` (toggle, tooltip, dialog, etc.).

---

## Planned Plugins (Roadmap)

### 1. Persist Plugin

Remembers open state using localStorage or sessionStorage.

```html
data-automagica11y-persist="local"
```

### 2. Hash Plugin

Synchronizes toggle state with the URL hash (deep-linking).

### 3. Inert Plugin

Applies/removes `inert` attribute on non-active content areas for modals or dialogs.

---

## Future API Shape

As additional plugins materialize, the plan is to expose a lightweight hook system (for example, `registerPlugin(name, hooks)`) so cross-cutting behaviors can subscribe to pattern lifecycle events without manual wiring. That API is still in exploration.

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
