# Plugins Overview

automagicA11y plugins hook into the shared `automagica11y:*` custom events so they can extend pattern behavior without altering individual components. Each plugin lives in its own sub-folder, exposing a `register*` function and documenting usage locally.

## Available Plugins

| Plugin | Description | Docs |
| --- | --- | --- |
| Animate | Delays the “close” side of toggles until CSS transitions/animations finish, with reduced-motion and re-entrancy safeguards. | [`src/plugins/animate/README.md`](./animate/README.md) |

## Usage

```ts
import { registerAnimatePlugin } from "automagica11y";

registerAnimatePlugin(); // call once during app boot
```

All plugins are optional; only import and register the ones your project needs. See the [root README](../../README.md#plugins) for additional guidance on combining plugins with patterns.
