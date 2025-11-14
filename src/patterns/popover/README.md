# Popover Pattern (`data-automagica11y-popover`)

The popover pattern turns any control into a trigger for a floating action panel. Developers configure the relationship entirely through declarative data attributes, while the library handles accessibility wiring, viewport-aware placement, and graceful dismissal behavior.

📦 First-time setup lives in the [root README](../../README.md#getting-started). Once the package is installed, wire a popover by following the steps below.

## Quick start

1. Install the dependency: `npm install automagica11y`
2. Create a trigger element with `data-automagica11y-popover` pointing at the popover panel
3. Import the library globally or call `initPattern('popover', trigger)`

```html
<button data-automagica11y-popover="#profile-popover">Manage profile</button>
<div id="profile-popover" hidden>
  <button data-automagica11y-popover-dismiss>Done</button>
</div>

<script type="module">
  import "automagica11y";
</script>
```

To re-initialize a specific subtree (for example after fetching HTML), use:

```ts
import { initNode } from "automagica11y";

const menu = document.querySelector("#actions");
if (menu) {
  initNode(menu);
}
```

## Key Features

- Declarative `data-automagica11y-popover` attribute that references the floating panel.
- Automatic `aria-controls`, `aria-haspopup`, and `aria-expanded` management.
- Shared placement engine that flips the popover when it would overflow the viewport.
- Shared placement engine that flips the popover when it would overflow the viewport, including cross‑axis guards to keep the panel fully visible.
- Optional outside-click and scroll-to-dismiss controls with customizable thresholds.
- Custom dismissal controls via `data-automagica11y-popover-dismiss` inside the target.
- Rich custom events for lifecycle (ready, toggle, shown/hidden, dismissed, placement changes).

## Core Attributes

| Attribute | Description |
| --- | --- |
| `data-automagica11y-popover="#id"` | Connects the trigger to the popover element. |
| `data-automagica11y-popover-position` | Preferred placement (`auto`, `top`, `bottom`, `left`, `right`). Defaults to `auto`. |
| `data-automagica11y-popover-outside-dismiss` | Enables outside click dismissal (truthy/falsey tokens supported). Defaults to `true`. |
| `data-automagica11y-popover-scroll-dismiss` | Enables scroll dismissal. Defaults to `true`. |
| `data-automagica11y-popover-scroll-distance` | Minimum scroll distance (in CSS pixels) before dismissal. Defaults to `0`. |

### Target-only Attributes

| Attribute | Description |
| --- | --- |
| `data-automagica11y-popover-dismiss` | Attach to a button/link inside the popover to close it. |

## Events

The popover dispatches namespaced events to simplify integrations:

- `automagica11y:popover:ready` when hydration is complete.
- `automagica11y:popover:toggle` whenever visibility changes (`detail.expanded`, `detail.reason`).
- `automagica11y:popover:shown` and `automagica11y:popover:hidden` with `detail.reason`.
- `automagica11y:popover:dismissed` when the popover closes (`detail.reason`).
- `automagica11y:popover:placement` when placement is resolved.

All event detail objects include `{ trigger, target }` so hooks can react without additional DOM queries.

## Focus Management and A11y Notes

- On close, if focus is inside the popover, focus is returned to the trigger before the panel is hidden and `aria-hidden` is applied. This prevents "aria-hidden element contains focus" warnings and keeps keyboard users oriented.
- Dismiss controls inside the popover should be interactive elements (e.g., `<button>`). Buttons without a `type` attribute are normalized to `type="button"` to avoid accidental form submits.
- The target reflects resolved placement via `data-automagica11y-popover-placement` so styles can adapt (`top`, `bottom`, `left`, `right`).

## Usage Examples

### Basic

```html
<button
  class="btn"
  data-automagica11y-popover="#profile-popover"
  data-automagica11y-target-class-open="popover-panel--visible">
  Manage profile
</button>

<div id="profile-popover" class="popover-panel" hidden>
  <p class="popover-panel__title">Profile</p>
  <ul>
    <li><a href="#">View account</a></li>
    <li><a href="#">Security settings</a></li>
    <li><a href="#">Notifications</a></li>
  </ul>
  <button class="btn btn--secondary" data-automagica11y-popover-dismiss>Done</button>
</div>
```

### Sticky Panel (no outside or scroll dismiss)

```html
<button
  class="btn"
  data-automagica11y-popover="#sticky-popover"
  data-automagica11y-popover-outside-dismiss="false"
  data-automagica11y-popover-scroll-dismiss="false"
  data-automagica11y-target-class-open="popover-panel--visible">
  Sticky panel
</button>

<div id="sticky-popover" class="popover-panel" hidden>
  <p>This popover stays open until Escape or the dismiss control is used.</p>
  <button data-automagica11y-popover-dismiss>Close</button>
  <!-- Focus returns to the trigger on close -->
  <!-- Hidden/aria-hidden are applied after focus moves to avoid warnings -->
  <!-- Placement is reflected via data-automagica11y-popover-placement for CSS hooks -->
</div>
```

### Placement Preference

```html
<button
  data-automagica11y-popover="#updates"
  data-automagica11y-popover-position="right">
  Show updates
</button>
<div id="updates" class="popover-panel" hidden>
  <p>Resolved side is published via the placement event and mirrored on the target as a data attribute.</p>
  <button data-automagica11y-popover-dismiss>Dismiss</button>
  <!-- Example: data-automagica11y-popover-placement="right" -->
</div>
```

---

## Learn more

| Document | Description |
|-----------|-------------|
| [Root README](../../README.md#getting-started) | Install instructions and pattern overview |
| [Popover docs](../../../docs/src/content/docs/patterns/popover.mdx) | Live demos with placement diagrams |
| [Tooltip pattern](../../../src/patterns/tooltip/README.md) | Lightweight descriptions that share placement helpers |
| [Announce plugin](../../../src/plugins/announce/README.md) | Add spoken feedback for popover state changes |
