# automagicA11y

Version: 0.4 (concept phase)

_Accessibility that writes itself._

---

## Overview

automagicA11y is a lightweight, framework-agnostic accessibility utility that automates ARIA attributes, accessibility states, and related classes for common interactive components such as toggles, tooltips, dialogs, and menus.

Built for simplicity and scalability, it uses a consistent declarative syntax via `data-automagica11y-*` attributes to handle open or closed states, ARIA bindings, and accessibility affordances automatically.

### Key capabilities

- **Drop-in attributes:** Use semantic HTML and `data-automagica11y-*` hooks. The runtime reflects ARIA attributes and stateful classes without bespoke scripts.
- **Context-aware patterns:** Toggle dialogs, popovers, tooltips, and more with a single attribute. Presets bundle roles, keyboard bindings, and focus management for you.
- **Progressive enhancement first:** No-JS fallbacks stay semantic while enhancements respect reduced motion, restore focus, and keep the DOM tidy.

---

## Getting started

### Install the package

```bash
npm install automagica11y
```

The published package ships ESM, CJS, and browser-ready bundles alongside TypeScript definitions. Use whichever entry point fits
your bundler – Vite, Astro, Next, Remix, Angular, and plain script tags all work out of the box.

### Initialize the registry

```html
<script type="module">
  import "automagica11y";
  // Auto-initializes every supported pattern on the current document.
</script>
```

Prefer to hydrate specific sections? Import the helpers and scope initialization manually:

```ts
import { initNode, initPattern } from "automagica11y";

const drawer = document.querySelector("#offcanvas");
if (drawer) {
  initNode(drawer);
}

// Or target a specific pattern factory
initPattern("toggle", document.body);
```

Every readme in this repository includes an end-to-end usage example. If you are exploring a particular pattern or plugin, jump
straight to it via the table below.

> ℹ️ **First time cloning the repo?** Run `npm install` in the project root to grab dependencies, then `npm run build` to generate
> the dist bundle before launching any demos.

### Documentation

- **Starlight site:** _Coming soon_ – deploy the docs with the provided GitHub Pages workflow or Vercel project.
- **Run locally:**
  1. `npm run build` (ensures the docs import the latest local bundle).
  2. `npm run docs:dev`
  3. Open the dev server URL printed in the terminal.
- **Docs workspace README:** [`docs/README.md`](docs/README.md) covers Astro-specific commands and troubleshooting tips.

### Pattern & plugin quick links

| Scope | Feature | README |
| ----- | ------- | ------ |
| Core patterns | Toggle / Disclosure | [`src/patterns/toggle/README.md`](src/patterns/toggle/README.md) |
| Core patterns | Tooltip | [`src/patterns/tooltip/README.md`](src/patterns/tooltip/README.md) |
| Core patterns | Popover | [`src/patterns/popover/README.md`](src/patterns/popover/README.md) |
| Core patterns | Dialog | [`src/patterns/dialog/README.md`](src/patterns/dialog/README.md) |
| Utilities | Focus helpers | [`src/patterns/focus/README.md`](src/patterns/focus/README.md) |
| Plugins | Announce live region | [`src/plugins/announce/README.md`](src/plugins/announce/README.md) |

Each pattern README links back here for install steps and into the canonical Astro docs for live playgrounds. Start with the
toggle pattern if you are brand new – every other pattern composes on top of it.

## Angular integration

Angular 16+ apps can import the ESM build directly in component code. Guard invocations with
`isPlatformBrowser` so SSR renders stay inert, then hydrate after Angular paints the view and whenever
the router swaps pages.

```ts
// app.component.ts
import { Component, Inject, PLATFORM_ID, AfterViewInit, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { initAllPatterns } from 'automagica11y';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements AfterViewInit, OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object, private router: Router) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      initAllPatterns();
    }
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (isPlatformBrowser(this.platformId) && event instanceof NavigationEnd) {
        initAllPatterns();
      }
    });
  }
}
```

Call `initAllPatterns` again whenever new markup with `data-automagica11y-*` attributes is rendered (for example,
after lazy-loaded components resolve or dynamic content appears).

Template example:

```html
<button data-automagica11y-toggle="#details">Details</button>
<section id="details" hidden>Accessible disclosure target</section>
```

> ⚠️ Do not list `node_modules/automagica11y/dist/automagica11y.esm.js` in `angular.json` `scripts` – classic script tags
> cannot parse `export` statements. Prefer module imports inside TypeScript instead.

If you must use a global script (client-only builds, legacy code), reference the minified bundle and call the exposed global:

```json
// angular.json
{
  "scripts": ["node_modules/automagica11y/dist/automagica11y.min.js"]
}
```

```ts
declare const automagicA11y: typeof import('automagica11y/browser').default;

automagicA11y.initAllPatterns();
```

Only run the global variant in the browser; the IIFE bundle is not SSR-compatible.

## Examples

- Toggle — basic disclosure (`docs/src/content/docs/examples/toggle-basic.mdx`)
- Toggle — grouped accordion (`docs/src/content/docs/examples/toggle-accordion.mdx`)
- Context → Dialog (`docs/src/content/docs/examples/context-dialog.mdx`)
- Context → Tooltip (`docs/src/content/docs/examples/context-tooltip.mdx`)
- Truthiness aliases (`docs/src/content/docs/examples/truthiness-aliases.mdx`)
- Popover dismissal (`docs/src/content/docs/examples/popover-basic.mdx`)
- Focus map ordering (`docs/src/content/docs/examples/focus-map.mdx`)
- Per-element focus links (`docs/src/content/docs/examples/focus-links.mdx`)
- Examples roadmap (`docs/src/content/docs/examples/coverage-plan.mdx`)

---

## Design Philosophy

The guiding principle of automagicA11y is to make accessibility effortless and predictable.

1. **Declarative, not prescriptive**  
   Add a single `data-automagica11y-*` attribute. The library handles ARIA, keyboard bindings, and state reflection automatically.

2. **Universal grammar**  
   Every interactive pattern (toggle, tooltip, dialog, etc.) follows the same mental model:

   `element -> affordance -> action`

   `data-automagica11y-[element]-[affordance]-[action]`

   | Element  | Description                                    | Example                                |
   | -------- | ---------------------------------------------- | -------------------------------------- |
   | trigger  | Interactive element that initiates the change  | `data-automagica11y-trigger-class-open`     |
   | target   | Element that responds to the trigger           | `data-automagica11y-target-class-open`      |
   | affordance | Type of thing being manipulated (class, attr, style) | `class`                       |
   | action   | Current or resulting state (open, closed, etc.) | `open`, `closed`                       |

   This structure provides consistent, composable naming that can scale across all patterns.

3. **Lightweight by design**  
   Each module (toggle, tooltip, dialog) is a standalone ~2-3 kB file. No dependencies and no framework lock-in.

4. **ARIA handled for you**  
   automagicA11y automatically applies and maintains required ARIA attributes (`aria-expanded`, `aria-controls`, `aria-labelledby`, etc.) and accessible keyboard behaviors.

5. **Predictable class hooks**  
   Trigger and target classes reflect open or closed state using customizable attributes:

   ```html
   <button
     data-automagica11y-toggle="#details"
     data-automagica11y-trigger-class-open="active"
     data-automagica11y-trigger-class-closed="inactive"
     data-automagica11y-target-class-open="visible"
     data-automagica11y-target-class-closed="hidden">
     More details
   </button>

   <div id="details">Hidden content</div>
   ```

If no custom trigger classes are defined, automagicA11y falls back to `automagic-toggle-open` / `automagic-toggle-closed`. Targets only receive classes you explicitly configure with `data-automagica11y-target-class-*`.

---

## Core Patterns

### Context Engine

The new context registry acts as the single source of truth for accessibility semantics and behaviors. Pair any toggle trigger with `data-automagica11y-context` to opt into a preset bundle of roles, ARIA wiring, and behavioral helpers. The [Astro docs "Contexts" guide](docs/src/content/docs/guides/contexts.mdx) mirrors this overview with live demos, a capability matrix, and roadmap status for each composite pattern.

```html
<button
  data-automagica11y-toggle="#dialog"
  data-automagica11y-context="dialog"
  data-automagica11y-context-mode="all"
>
  Launch dialog
</button>
<div id="dialog" hidden>…</div>
```

- `data-automagica11y-context` accepts friendly aliases such as `dialog`, `modal`, `tooltip`, `dropdown`, and more. Values are normalized automatically.
- `data-automagica11y-context-mode` controls how much the registry applies: `all` (default), `semantics-only`, or `behaviors-only`.
- Legacy attributes like `data-automagica11y-dialog` and `data-automagica11y-tooltip` now defer to the context engine, so existing markup keeps working.
- Cross-reference the live [Context dialog example](docs/src/content/docs/examples/context-dialog.mdx) and [Context tooltip example](docs/src/content/docs/examples/context-tooltip.mdx) when testing locally. The docs site renders the same markup inside playgrounds.

| Context  | Semantics applied | Behaviors provided | Docs & Examples |
| -------- | ----------------- | ------------------ | --------------- |
| `dialog` | `aria-haspopup="dialog"`, `role="dialog"`, `aria-modal="true"`, shared ID/linking | Focus trap, Escape-to-close, background inerting + scroll lock, restore focus | [Dialog pattern](docs/src/content/docs/patterns/dialog.mdx) · [Context dialog example](docs/src/content/docs/examples/context-dialog.mdx) |
| `tooltip` | `role="tooltip"`, `aria-describedby` linkage | Hover/focus/long-press show & hide, Escape-to-close, placement event hook | [Tooltip pattern](docs/src/content/docs/patterns/tooltip.mdx) · [Context tooltip example](docs/src/content/docs/examples/context-tooltip.mdx) |
| `menu`    | `role="menu"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |
| `accordion` | `role="region"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |
| `disclosure` | `role="region"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |
| `listbox` | `role="listbox"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |
| `tablist` | `role="tablist"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |
| `tree` | `role="tree"` | _Behaviors planned_ | [Toggle pattern](docs/src/content/docs/patterns/toggle.mdx) |

Use `semantics-only` mode when you want ARIA defaults without focus trapping or inerting (for example, when integrating a custom dialog manager) and `behaviors-only` when you have bespoke semantics but still want automagicA11y to handle containment and dismissal logic.

**Roadmap checkpoints** (mirrored in the Astro docs):

- Menu context roving tabindex + typeahead interactions.
- Accordion/disclosure single-open coordination and `aria-disabled` propagation.
- Listbox, tablist, and tree keyboard navigation parity with WAI-ARIA Authoring Practices.
- Interactive capability lab demonstrating focus trap, inert siblings, hover intent, and anchor follow toggles.

### Toggle / Disclosure

#### Minimum viable example

```html
<button data-automagica11y-toggle="#faq1">More details</button>
<div id="faq1">Hidden content</div>
```

#### What happens automatically

- `aria-controls` and `aria-expanded` applied to the trigger
- `aria-labelledby` applied to the target
- Keyboard interaction (Enter/Space toggles)
- Classes updated based on state
- Optional `role="button"` and `tabindex="0"` applied to non-button triggers

#### Optional attributes

| Attribute                          | Description                               |
| ---------------------------------- | ----------------------------------------- |
| `data-automagica11y-trigger-class-open` | Classes to add when open                  |
| `data-automagica11y-trigger-class-closed` | Classes to add when closed              |
| `data-automagica11y-target-class-open` | Classes to add when target is visible     |
| `data-automagica11y-target-class-closed` | Classes to add when target is hidden    |
| `data-automagica11y-group`             | Treat multiple toggles as an accordion    |
| `data-automagica11y-inert`             | Apply or remove the `inert` attribute when closed |
| `data-automagica11y-persist`           | Remember open state (local or session)    |
| `data-automagica11y-hash`              | Sync state with the URL hash              |
| `data-automagica11y-animate`           | Delay hiding to support transitions       |

### Tooltip

#### Minimum viable example

```html
<button data-automagica11y-tooltip="#tip1">?</button>
<span id="tip1">Helpful tip...</span>
```

#### What happens automatically

- `aria-describedby` connects the trigger to the tooltip
- `role="tooltip"` and `aria-hidden` are applied to the target
- Tooltip is hidden by default (`hidden = true`)
- Pointer hover or focus shows the tooltip
- Pointer leave, blur, or pressing Escape hides it
- Optional class hooks apply via the same `data-automagica11y-[trigger|target]-class-*` attributes
- Optional open/close delays (`data-automagica11y-tooltip-[open|close]-delay`) are honored per trigger
- Placement auto-flips when the preferred side would clip the viewport; inspect `data-automagica11y-tooltip-placement`
- Touch users can long-press to open and close the tooltip with a `[data-automagica11y-tooltip-dismiss]` control

#### Behavior notes

- Tooltip stays visible while the pointer rests on either the trigger or tooltip element.
- When no custom classes are defined, tooltip triggers keep their existing class list (no default toggle classes).
- Long-press (~550&nbsp;ms) opens the tooltip on touch devices and keeps it visible until dismissed.
- Tooltips emit the shared `automagica11y:ready`/`automagica11y:toggle` events so announce or custom plugins can react.

### Popover

#### Minimum viable example

```html
<button
  data-automagica11y-popover="#profile-popover"
  data-automagica11y-target-class-open="popover-panel--visible">
  Manage profile
</button>

<div id="profile-popover" class="popover-panel" hidden>
  <p>Quick actions</p>
  <button data-automagica11y-popover-dismiss type="button">Done</button>
  <!-- CSS can read data-automagica11y-popover-placement for arrows/offsets -->
</div>
```

#### What happens automatically

- Adds `aria-controls`, `aria-haspopup="dialog"`, and `aria-expanded` to the trigger.
- Hides the panel by default and mirrors visibility to `aria-hidden`.
- Resolves a safe placement and flips if the preferred side would overflow the viewport. Cross‑axis guards prevent clipping near edges.
- Emits namespaced events: `automagica11y:popover:ready`, `:toggle`, `:shown`, `:hidden`, `:dismissed`, and `:placement`.
- Returns focus to the trigger before applying `hidden`/`aria-hidden` on close to avoid a11y warnings.

#### Sticky example

```html
<button
  data-automagica11y-popover="#sticky-popover"
  data-automagica11y-popover-outside-dismiss="false"
  data-automagica11y-popover-scroll-dismiss="false"
  data-automagica11y-target-class-open="popover-panel--visible">
  Sticky panel
</button>
<div id="sticky-popover" class="popover-panel" hidden>
  <p>Stays open until Escape or dismiss.</p>
  <a href="#" data-automagica11y-popover-dismiss>Close</a>
  <!-- Placement reflected via data-automagica11y-popover-placement -->
  <!-- Focus returns to the trigger on close -->
</div>
```

---

### Dialog

#### Minimum viable example

```html
<button data-automagica11y-dialog="#session-dialog">Extend session</button>

<div
  id="session-dialog"
  hidden
  role="dialog"
  aria-labelledby="session-title"
  data-automagica11y-dialog-dismissable>
  <div role="document">
    <h2 id="session-title">Stay signed in?</h2>
    <p>Your session will expire in 2 minutes.</p>
    <button data-automagica11y-dialog-close>Stay signed in</button>
    <button type="button">Sign out</button>
  </div>
</div>
```

#### What happens automatically

- Trigger receives `aria-controls`, `aria-expanded`, and `aria-haspopup="dialog"`.
- Dialog container gets `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`, and stays hidden by default.
- Focus moves inside the dialog on open and returns to the previous element on close.
- Background siblings receive `inert` + `aria-hidden` and scroll is locked while the dialog is open.
- Escape, Space, and Enter support open/close flows; elements with `data-automagica11y-dialog-close` close the dialog.
- Shared lifecycle events (`automagica11y:ready` / `automagica11y:toggle`) fire for plugins and analytics.

---

### Focus Utilities

Focus helpers give you fine-grained control over where focus starts and how it progresses through custom interfaces.

#### Initial focus

```html
<header>
  <button data-automagica11y-focus-initial data-automagica11y-focus-prevent-scroll="false">
    Skip to content
  </button>
</header>
```

When the page hydrates, the button receives focus once (without altering the author’s tabindex order). Optional `data-automagica11y-focus-delay="100"` delays focus in milliseconds.

#### Focus map

```html
<div id="focus-map-anchor" tabindex="0"></div>

<div
  data-automagica11y-focus-map="#navbar a; #player button; main [data-primary]"
  data-automagica11y-focus-map-scope="#page-shell"
  data-automagica11y-focus-map-anchor="#focus-map-anchor">
</div>
```

Define an explicit tab order using selectors. Scope the search to a container with `data-automagica11y-focus-map-scope="#page-shell"` (or use `"self"` to limit to the element itself). Provide a `data-automagica11y-focus-map-anchor` selector that resolves to a focusable element – this anchor acts as the entry and exit point for the sequence. If no anchor is supplied and the scope resolves to `document`, the map will not activate.

Instead of rewriting `tabindex` values, the pattern listens for `Tab` / `Shift + Tab` on the mapped elements and routes focus through the declared order. When focus exits the final element, the browser’s natural tab order resumes so the rest of the page stays reachable. Re-initialize the pattern after DOM changes to refresh the sequence.

Use this to keep floating players, overlays, or portal-based menus in the logical navigation sequence without breaking the author’s source order.

#### Per-element focus links

```html
<div class="controls" data-automagica11y-focus-scope="#deck">
  <button id="shuffle" data-automagica11y-focus-next="#repeat">Shuffle</button>
  <button id="play"
          data-automagica11y-focus-next="#queue"
          data-automagica11y-focus-prev="#shuffle">Play</button>
  <section id="deck">
    <button id="repeat" data-automagica11y-focus-prev="#play">Repeat</button>
    <button id="queue">Queue</button>
  </section>
</div>
```

Author `data-automagica11y-focus-next` / `data-automagica11y-focus-prev` on any focusable element to define its immediate neighbors. The handler resolves selectors inside the configured scope (use `data-automagica11y-focus-scope="self"` to limit lookups) and moves focus to the first viable match, skipping hidden, disabled, or inert nodes along the way. Reverse edges are inferred automatically, so adding only `data-automagica11y-focus-next` still makes `Shift+Tab` land on the previous linked element.

#### Focus trap

```html
<section
  data-automagica11y-focus-trap
  data-automagica11y-focus-trap-initial="[data-primary]"
  data-automagica11y-focus-trap-return="true"
  data-automagica11y-focus-trap-escape-dismiss="false">
  <!-- interactive content -->
</section>
```

Adding `data-automagica11y-focus-trap` keeps `Tab` / `Shift+Tab` cycling inside the container. By default the trap activates whenever the element becomes visible (no `hidden` attribute, `aria-hidden="true"` removed) and pauses when hidden or detached. Provide:

- `data-automagica11y-focus-trap-initial="first|last|<selector>"` to control the starting focus target.
- `data-automagica11y-focus-trap-return="false"` to opt out of restoring focus to the prior invoker on release.
- `data-automagica11y-focus-trap-escape-dismiss="true"` to make Escape release the trap (ideal for non-modal surfaces).
- `data-automagica11y-focus-trap-auto="false"` when you only want to toggle via lifecycle events.

In addition to auto mode, the pattern listens for `automagica11y:toggle`, `automagica11y:toggle:opened`, `automagica11y:toggle:closed`, `automagica11y:shown`, and `automagica11y:hidden` events. Dispatching any of these with `detail.target` pointing at the container forces the trap on/off—perfect for custom dialog managers.

Nested surfaces (dialog inside popover) just work: a shared focus trap manager pauses the parent trap while the child is active and resumes it once the child releases. Imperative callers can reach for `enableFocusTrap(container, options)` when they need direct control.

---

## Plugins

### Announce

The announce pattern provides a shared live region for screen reader updates so individual components stay declarative.

Add `data-automagica11y-announce` to any pattern trigger to opt in:

```html
<button
  data-automagica11y-toggle="#faq1"
  data-automagica11y-announce="polite"
  data-automagica11y-announce-open="FAQ expanded"
  data-automagica11y-announce-closed="FAQ collapsed">
  FAQ
</button>
```

Behavior:

- Defaults to polite announcements (use `assertive` to override).
- Skips redundant announcements when focus remains on the control.
- Falls back to the trigger's accessible name (`aria-label`, `aria-labelledby`, or text content).
- Automatically listens for events like `automagica11y:toggle`.

Register once on boot:

```ts
import { registerAnnouncePlugin } from "automagica11y";

registerAnnouncePlugin();
```

---

### Animate

Delay the “close” side of any toggle until the target (or trigger) finishes its CSS animation. Great for fade-outs or sliding panels where you want the animation to complete before `hidden` flips.

```html
<button
  data-automagica11y-toggle="#drawer"
  data-automagica11y-animate="target"
  data-automagica11y-target-class-open="drawer--open"
  data-automagica11y-target-class-closed="drawer--closed">
  Toggle drawer
</button>
```

Behavior:

- Watches the chosen element for `transitionend` / `animationend` (plus `element.getAnimations()` if available) and only applies the close state when CSS actually finishes.
- Automatically skips delays when `prefers-reduced-motion` is enabled or when no animation is detected.
- Adds a safety timeout so content can’t get stuck mid-animation and replays the original event once complete.
- Adds the `.automagica11y-animating` class (or your custom close classes) while the close animation runs so you can transition styles declaratively.
- Re-opening mid-close cancels the pending wait and removes temporary classes automatically.
- Works with trigger-side animations as well (`data-automagica11y-animate="trigger"`). See [`examples/animate.html`](./examples/animate.html) for full transition + keyframe demos driven purely by data attributes.
- No manual registration needed—animate installs itself alongside the core toggle lifecycle. If you need to target a specific document manually, call `initAnimateLifecycle(yourDocument)` directly.

---

## Attribute Synonyms

automagicA11y recognizes several synonyms for open or closed states to improve author ergonomics.

> ✨ **Prefix shortcuts:** Attributes can also be authored with shorthand prefixes such as `data-automagically-*`, `data-ama11y-*`, `data-ama-*`, or `data-automagic-*`. The runtime normalizes every alias to `data-automagica11y-*` so existing selectors and plugins keep working.

| True states                   | False states                           |
| ----------------------------- | -------------------------------------- |
| open, expanded, shown, active, pressed | closed, collapsed, hidden, inactive, unpressed |

Internally, all map to a boolean expanded state.

---

## Truthiness Mapping System

automagicA11y uses a truthiness mapping mechanism to normalize synonyms for open or closed (or true or false) states. This allows developers to use whichever terms make sense in their project while keeping the logic consistent internally.

### How it works

Each recognized action keyword is categorized into one of two groups:

- Truthy states -> represent `expanded = true`
- Falsy states -> represent `expanded = false`

| Truthy keywords | Falsy keywords |
| --------------- | -------------- |
| open            | closed         |
| expanded        | collapsed      |
| shown           | hidden         |
| active          | inactive       |
| pressed         | unpressed      |
| true            | false          |
| on              | off            |

Internally, any `data-automagica11y-*-class-[keyword]` attribute is parsed through this table and resolved to either a true or false state. This lets authors mix terminology freely. For example, `data-automagica11y-target-class-expanded` and `data-automagica11y-target-class-active` both behave as the same truthy condition.

### Benefits

- Flexible authoring: Use whichever keywords match your mental model.
- Predictable behavior: Everything ultimately maps to a boolean expanded state.
- Future extensibility: Works equally for any binary state (for example, pressed/unpressed or on/off).

### Example

```html
<div
  data-automagica11y-toggle="#panel"
  data-automagica11y-trigger-class-active="btn--active"
  data-automagica11y-trigger-class-inactive="btn--ghost"
  data-automagica11y-target-class-expanded="panel--visible"
  data-automagica11y-target-class-collapsed="panel--hidden">
  Toggle Content
</div>
<div id="panel">...</div>
```

Both the trigger and target use synonym terms, but automagicA11y resolves them through the truthiness mapping system.

---

## Event Model

automagicA11y dispatches custom events for integration:

- `automagica11y:ready` — when a component is initialized
- `automagica11y:toggle` — when a toggle or disclosure changes state

```js
document.addEventListener('automagica11y:toggle', (event) => {
  console.log(event.detail.expanded ? 'opened' : 'closed');
});
```

---

## Architecture

### Core modules

- `registry.ts` — registers patterns once and exposes scoped hydration helpers (`initPattern`, `initPatterns`, `initNode`, `initAllPatterns`).
- `classes.ts` — truthiness mapping + `createClassToggler()` for consistent trigger/target class handling.
- `attributes.ts` — utilities for generating IDs, appending tokenized attributes, and toggling ARIA states.
- `styles.ts` — shared helpers for `hidden`, `aria-hidden`, and `inert` state management.
- `events.ts`, `keyboard.ts`, `aria.ts` — supporting utilities for custom events and keyboard affordances.

### Class helper example

```js
const toggleClasses = createClassToggler(trigger);
toggleClasses(true, target);
```

Patterns call the toggler instead of manipulating class lists manually.

### Pattern registration & initialization

```js
registerPattern('toggle', '[data-automagica11y-toggle]', initToggle);

// Hydrate everything in the document (default)
initAllPatterns();

// Scope hydration to new DOM
const fragment = document.querySelector('#lazy-loaded');
initPatterns(['tooltip', 'dialog'], fragment);

// Rehydrate a single node tree
initNode(fragment);
```

Each pattern initializes independently, avoiding collisions while sharing helpers.

---

## Default Styles

```css
[hidden] {
  display: none !important;
}
.automagic-toggle-open {}
.automagic-toggle-closed {}
```

`.automagic-toggle-*` classes are the built-in trigger fallback. Define `data-automagica11y-target-class-*` attributes if you want automagicA11y to manage target-side classes.

---

## Roadmap

### v0.1 (MVP)

- [x] Core toggle pattern
- [x] Configurable trigger and target classes
- [x] Synonym and truthiness mapping system
- [x] Event system
- [x] Non-button accessibility fixes

### v0.2

- [x] Tooltip pattern
- [x] Dialog pattern
- [x] Shared class, attribute, and style helpers
- [x] Registry-based initialization

### v0.3

- [x] Focus management utilities (`focus-initial`, `focus-map`, reusable traps)
- [x] Announce plugin for shared live region messaging
- [x] Animate plugin for CSS-driven close delays

### v0.4

- [ ] Persist plugin for remembering disclosure state via storage
- [ ] Hash-sync plugin for deep-linkable toggles
- [ ] Keyboard reference docs with pattern-specific shortcuts

### v0.5+

- [ ] Framework wrappers (Angular, React, Svelte)
- [ ] Authoring CLI that scaffolds semantic markup from component descriptors
- [ ] Visual regression suite to ensure default class hooks remain stable

---

## Further Reading

| Topic | Description |
|-------|--------------|
| [Architecture](./docs/ARCHITECTURE.md) | Deep dive into the internal registry, helper modules, and event lifecycle. |
| [Truthiness Mapping](./docs/truthiness.md) | How automagicA11y normalizes open/closed and active/inactive states into boolean logic. |
| [Patterns Roadmap](./docs/patterns.md) | Current and planned interactive patterns (toggle, tooltip, dialog, etc.). |
| [Plugins](./docs/plugins.md) | Optional future enhancements (persist, animate, hash-sync, announce, inert). |
| [Attribute Grammar](./docs/attributes.md) | Explains the `data-automagica11y-[element]-[affordance]-[action]` syntax and philosophy. |
| [Focus Utilities](./src/patterns/focus/README.md) | How to drive first-focus behavior and custom tab order mapping. |
| [Dialog Pattern](./src/patterns/dialog/README.md) | Deep dive into dialog configuration, focus trapping, and background management. |
| [Contributing Guide](./docs/CONTRIBUTING.md) | How to build, test, and contribute new patterns or fixes. |
| [Branding & Voice](./docs/branding.md) | Taglines, tone, and visual direction for the project identity. |

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
