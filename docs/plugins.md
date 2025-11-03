# Plugin System (Future)

autoA11y will support lightweight, opt-in plugins that extend the behavior of core patterns.

---

## Design Goals

- Stay <2 KB per plugin
- No dependencies
- Use `registerPlugin(name, { hooks })` API

---

## v0.1 — Announce (Cross-cutting)

### Description

Shared live region that centralizes screen reader announcements for any pattern that emits `autoa11y:*` events.

### Features

- Singleton polite live region (assertive opt-in via `data-autoa11y-announce="assertive"`)
- Consumes trigger data attributes for custom messages
- Generates sensible defaults from accessible names
- Suppresses duplicate messages and skips redundant focused updates

---

## Planned Plugins

### 1. Persist Plugin

Remembers open state using localStorage or sessionStorage.

```html
data-autoa11y-persist="local"
```

### 2. Hash Plugin

Synchronizes toggle state with the URL hash (deep-linking).

### 3. Animate Plugin

Delays hiding until CSS transition ends; respects `prefers-reduced-motion`.

### 4. Announce Plugin

Adds live region updates via `aria-live` for screen reader announcements.

### 5. Inert Plugin

Applies/removes `inert` attribute on non-active content areas for modals or dialogs.

---

## Example Hook Interface

```ts
registerPlugin('persist', {
  onInit: (trigger, target) => {},
  onOpen: (trigger, target) => {},
  onClose: (trigger, target) => {}
});
```
