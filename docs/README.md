# AutomagicA11y Docs (Astro + Starlight)

This docs site demonstrates AutomagicA11y patterns using lightweight, inline-enhanced playgrounds. It favors zero-friction local development: no Astro islands, no client directives, and minimal wiring to keep demos fast and predictable.

## Dev Commands

- Install deps: `npm --prefix docs install`
- Start dev server: `npm run docs:dev`
- Build static site: `npm run docs:build`
- Preview build: `npm run docs:preview`

Root package build (optional during dev): `npm run build`

### Cross-repo references

- Need the package install snippet? Head back to the [root README](../README.md#getting-started).
- Each pattern README (for example [`src/patterns/dialog/README.md`](../src/patterns/dialog/README.md)) links into the matching Starlight page under `docs/src/content/docs/patterns/` so you can bounce between markdown and live playgrounds quickly.

## How Interactivity Works

- Global auto‑init: `docs/src/scripts/auto-init.ts` imports `automagica11y` once per page. The library auto‑initializes all supported patterns on import (`initAllPatterns(document)`). The script is injected in `docs/starlight.config.mjs` via a module `<script>` in `head`.

- Playground hydration: `docs/src/components/Playground.astro` contains a tiny inline module script. It:
  - Finds each `.playground` section on the page.
  - Wires buttons for “View source” and “Reset”.
  - Calls `window.automagica11y?.initNode(preview)` to re‑hydrate demo markup after a reset. If `window.automagica11y` isn’t present, it lazily `import('automagica11y')` as a fallback.

This design avoids Astro islands and keeps the demos framework‑agnostic while still enabling per‑playground re‑init.

## Why Not Use Islands?

Islands would work, but the docs intentionally showcase “just HTML + attributes”. Inline enhancement keeps the mental model close to how consumers use the library. The Starlight toolbar may show “No islands detected” — that’s expected.

## Styling “View Source”

The source panel uses `.playground__code` styles in `docs/src/styles/custom.css` to ensure a readable monospace block with scrolling when needed.

## Troubleshooting

- Toggle doesn’t work:
  - Ensure the global auto‑init is loaded (check that `/src/scripts/auto-init.ts` appears in the page source under `<head>`).
  - Inspect the trigger’s attributes in the devtools Elements panel and confirm the target selector resolves in the DOM.
- Console shows “Failed to resolve module specifier 'automagica11y'”:
  - Hard refresh after pulling updates. The playground now prefers `window.automagica11y` and won’t error once the global script is in place.

## Conventions (from AGENTS.md)

- Keep shared data and logic centralized; avoid repeating truthiness mappings or token lists.
- Follow event naming `automagica11y:<pattern>:<action>` when emitting custom events.
- Prefer narrow TypeScript types over `any`; add inline docs for exported functions.

