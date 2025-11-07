# Plugins Overview

automagicA11y plugins hook into the shared `automagica11y:*` custom events so they can extend pattern behavior without altering individual components. Each plugin exposes a `register*` function and documents usage locally. The announce helper currently lives in the `patterns/announce` folder but is exported from the public entry point just like any other plugin.

## Available Plugins

| Plugin | Description | Docs |
| --- | --- | --- |
| Announce | Shared polite/assertive live region that listens for `automagica11y:toggle` events and speaks state changes. | [`src/patterns/announce/README.md`](../patterns/announce/README.md) |
| Animate | Delays the “close” side of toggles until CSS transitions/animations finish, with reduced-motion and re-entrancy safeguards. | [`src/plugins/animate/README.md`](./animate/README.md) |

## Usage

```ts
import { registerAnimatePlugin } from "automagica11y";

registerAnimatePlugin(); // call once during app boot
```

All plugins are optional; only import and register the ones your project needs. See the [root README](../../README.md#plugins) for additional guidance on combining plugins with patterns.

## Roadmap

- [ ] Persistence plugin that synchronizes toggle state to `localStorage` / `sessionStorage`.
- [ ] Hash-sync plugin so disclosure state can be deep-linked and restored from the URL.
- [ ] Plugin lifecycle hooks (`onBeforeToggle`, `onAfterToggle`) to compose custom extensions without re-dispatching events.
