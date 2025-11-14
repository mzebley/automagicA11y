# Dialog Pattern (`data-automagica11y-dialog`)

> _Accessible modal dialogs with focus management and background locking._

The **Dialog Pattern** turns any trigger into a fully-managed modal. Declare `data-automagica11y-dialog="#selector"` on a control and automagicA11y handles focus trapping, background inerting, escape/close buttons, and lifecycle events for you.

---

👉 Installation and registry setup live in the [root README](../../README.md#getting-started). Come back here once the package is installed.

## Quick start

1. Ensure `automagica11y` is installed: `npm install automagica11y`
2. Mark up your dialog trigger and container.
3. Import the library (or call `initPattern('dialog', container)`) to wire the modal behavior.

```html
<button data-automagica11y-dialog="#session-dialog">Extend session</button>

<div id="session-dialog" hidden data-automagica11y-dialog-dismissable>
  <div role="document">
    <h2 id="dialog-title">Stay signed in?</h2>
    <p id="dialog-desc">Your session will expire soon.</p>
    <button data-automagica11y-dialog-close>Stay signed in</button>
  </div>
</div>

<script type="module">
  import "automagica11y";
</script>
```

Need to hydrate a newly rendered modal? Scope initialization to that node:

```ts
import { initPattern } from "automagica11y";

const dialog = document.querySelector("#session-dialog");
if (dialog) {
  initPattern("dialog", dialog);
}
```

---

## Overview

A dialog requires:

1. **Trigger** — the interactive element that opens and closes the dialog.
2. **Dialog container** — the element referenced by the trigger (typically a backdrop).
3. **Document node** — content inside the dialog container (usually with `role="document"`).

```html
<button data-automagica11y-dialog="#session-dialog">Extend session</button>

<div id="session-dialog" class="dialog-backdrop" hidden data-automagica11y-dialog-dismissable>
  <div class="dialog-shell" role="document">
    <h2 id="dialog-title">Stay signed in?</h2>
    <p id="dialog-desc">Your session will expire soon.</p>
    <div class="dialog-actions">
      <button data-automagica11y-dialog-close>Stay signed in</button>
      <button type="button">Sign out</button>
    </div>
  </div>
</div>
```

When initialized, automagicA11y automatically:

- Adds `aria-controls`, `aria-expanded`, and `aria-haspopup="dialog"` to the trigger.
- Ensures the dialog container has an `id`, `role="dialog"`, `aria-modal="true"`, and `tabindex="-1"`.
- Hides the dialog by default (`hidden`, `aria-hidden="true"`).
- Locks scroll and applies `inert`/`aria-hidden` to background siblings when the dialog opens.
- Traps focus within the dialog and returns focus to the trigger on close.
- Dispatches `automagica11y:ready` and `automagica11y:toggle` lifecycle events.

---

## Interaction Lifecycle

- Trigger click, Enter, or Space toggles the dialog.
- `data-automagica11y-dialog-close` elements close the dialog.
- Pressing Escape closes the dialog.
- Clicking the backdrop closes the dialog when the container has `data-automagica11y-dialog-dismissable`.

Focus is moved to the first focusable element inside the dialog (or the dialog container) on open, then returned to the element that owned focus before the dialog opened.

---

## Class Hooks

Triggers can share the same truthiness-aware class mapping used by other patterns:

```html
<button
  data-automagica11y-dialog="#session-dialog"
  data-automagica11y-trigger-class-open="is-armed"
  data-automagica11y-trigger-class-closed="is-idle">
  Extend session
</button>
```

- `data-automagica11y-trigger-class-[state]` updates the trigger based on dialog state.
- `data-automagica11y-target-class-[state]` (declared on the trigger) applies classes to the dialog container.

---

## Accessibility Notes

- Provide `aria-labelledby` and/or `aria-describedby` on the dialog container to point to the modal title and description.
- Use `role="document"` or `role="group"` inside the dialog to wrap the interactive content while keeping the container as the modal wrapper.
- Background elements receive temporary `inert` + `aria-hidden="true"` to remove them from the accessibility tree until the dialog closes.
- Body scrolling is disabled while the dialog is open and restored automatically.

---

## Roadmap

- [ ] Non-modal “popover” variant that omits scroll locking but retains focus management.
- [ ] Configurable focus return target for cases where the trigger should not regain focus.
- [ ] Nested dialog coordination so child modals temporarily pause parent traps without breaking background state snapshots.

---

## Learn more

| Document | Description |
|-----------|-------------|
| [Root README](../../README.md#getting-started) | Installation and pattern directory |
| [Dialog docs](../../../docs/src/content/docs/patterns/dialog.mdx) | Live examples of context-driven modals |
| [Focus utilities](../../../src/patterns/focus/README.md) | Supporting helpers for initial focus and tab order |
| [Announce plugin](../../../src/plugins/announce/README.md) | Announce open/close events to assistive tech |

---

© 2025 Mark Zebley • automagicA11y
_Licensed under the MIT License_
