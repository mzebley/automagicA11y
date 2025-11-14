# Announce Pattern (`data-automagica11y-announce`)

> _Shared live region messaging for every pattern._

The **Announce Pattern** centralizes screen reader updates across all automagicA11y components. Instead of each pattern managing its own live region, authors opt in per trigger using data attributes while a single plugin handles ARIA live output.

---

📘 First, follow the [root README](../../README.md#getting-started) to install and initialize the library. Then layer the announce plugin on top using the steps below.

## When to Use

- You need consistent spoken feedback when toggles, dialogs, or future patterns change state.
- You want localized/custom messaging without duplicating announce logic.
- You prefer declarative configuration over imperative announcement code.

---

## Quick Start

1. Confirm the package is installed: `npm install automagica11y`
2. Import and register the announce plugin once during boot:

```ts
import { registerAnnouncePlugin } from "automagica11y";

registerAnnouncePlugin();
```

3. Opt individual triggers into announcements:

```html
<button
  data-automagica11y-toggle="#details"
  data-automagica11y-announce="polite"
  data-automagica11y-announce-open="Details expanded"
  data-automagica11y-announce-closed="Details collapsed">
  Toggle details
</button>
```

---

## Attributes

| Attribute | Description |
|-----------|-------------|
| `data-automagica11y-announce` | Enables announcements and sets delivery mode (`polite` default, `assertive` optional). |
| `data-automagica11y-announce-open` | Custom message when the control opens. |
| `data-automagica11y-announce-closed` | Custom message when the control closes. |

If open/closed messages are omitted, the plugin derives sensible defaults using the trigger's accessible name (aria-label, aria-labelledby, or text content) plus `"expanded"`/`"collapsed"`.

---

## Behavior Summary

- Creates a singleton live region (`aria-live="polite"`, `role="status"`) on first use.
- Debounces identical messages for 750 ms to avoid chatter.
- Skips announcements when the trigger remains focused (screen readers already vocalize `aria-expanded` changes).
- Falls back to polite delivery unless `data-automagica11y-announce="assertive"` is supplied.
- Listens for `automagica11y:toggle` events emitted by patterns such as `data-automagica11y-toggle`.

---

## Event Integration

Any pattern that dispatches `automagica11y:toggle` automatically integrates with announce. Future patterns should emit similar events (e.g., `automagica11y:dialog`) so the plugin can announce their state transitions without additional wiring.

---

## Tips

- Keep custom messages short and action-oriented (e.g., “FAQ expanded” instead of “The FAQ section has now opened fully.”).
- When localizing, provide both open and closed strings to avoid mixing languages with the default English verbs.
- Use polite mode for routine updates; reserve `assertive` for urgent content like warnings or errors.

---

## Roadmap

- [ ] Global configuration API to set project-wide default copy and politeness levels.
- [ ] Message queueing so rapid toggle changes coalesce into a single announcement.
- [ ] Integration tests that validate polite/assertive timing across popular screen readers.

---

## Learn more

| Document | Description |
|-----------|-------------|
| [Root README](../../README.md#getting-started) | Install instructions and pattern overview |
| [Announce docs](../../../docs/src/content/docs/plugins/announce.mdx) | Live demos with suggested copy guidelines |
| [Toggle pattern](../../../src/patterns/toggle/README.md) | Emits the events announce listens for |
| [Events reference](../../../docs/src/content/docs/reference/events.mdx) | Namespaced event catalog for advanced integrations |

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
