# Popover Pattern (`data-automagica11y-popover`)

The popover pattern turns any control into a trigger for a floating action panel. Developers configure the relationship entirely through declarative data attributes, while the library handles accessibility wiring, viewport-aware placement, and graceful dismissal behavior.

## Key Features

- Declarative `data-automagica11y-popover` attribute that references the floating panel.
- Automatic `aria-controls`, `aria-haspopup`, and `aria-expanded` management.
- Shared placement engine that flips the popover when it would overflow the viewport.
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
