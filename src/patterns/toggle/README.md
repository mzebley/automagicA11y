# Toggle Pattern (`data-automagica11y-toggle`)

> _Drop an attribute. Get the ARIA._

The **Toggle Pattern** (sometimes called “Disclosure”) is the foundational pattern in **automagicA11y**.
It provides accessible, keyboard-operable toggling behavior for showing and hiding content — no extra JavaScript authoring required.

👉 New to the library? Start with the [root README](../../README.md#getting-started) for installation commands and registry initialization.

## Quick start

1. Add the package to your project: `npm install automagica11y`
2. Author semantic HTML with a trigger and target connected by `data-automagica11y-toggle`.
3. Import the library once (for example in your layout entry point) so the registry can initialize the pattern.

```html
<button data-automagica11y-toggle="#details">More details</button>
<section id="details" hidden>
  AutomagicA11y wires aria-expanded/aria-controls and toggles visibility for you.
</section>
<script type="module">
  import "automagica11y";
</script>
```

Need to hydrate toggles inside dynamically rendered islands or partials? Scope initialization with `initNode`:

```ts
import { initNode } from "automagica11y";

const drawer = document.querySelector("#my-fragment");
if (drawer) {
  initNode(drawer);
}
```

---

## Overview

A toggle consists of two elements:

1. A **trigger** — the interactive element the user clicks or activates.  
2. A **target** — the content that is shown or hidden.

The trigger declares its target using the `data-automagica11y-toggle="#targetId"` attribute.  
automagicA11y handles the rest: wiring up ARIA attributes, managing visibility, and syncing class names to reflect open or closed states.

```html
<button data-automagica11y-toggle="#faq1">More details</button>
<div id="faq1">Hidden content</div>
```

When initialized, automagicA11y automatically:

- Adds `aria-controls` and `aria-expanded`  
- Applies `aria-labelledby` to the target  
- Hides the target by default (`hidden = true`)  
- Enables Space/Enter keyboard activation  
- Dispatches lifecycle events you can listen for  

---

## Accessible Defaults

| Element | Behavior |
|----------|-----------|
| **Trigger** | Receives `aria-controls` + `aria-expanded` |
| **Target** | Receives `aria-labelledby` |
| **Non-button trigger** | Gets `role="button"`, `tabindex="0"`, and pointer cursor |

ARIA and keyboard affordances are handled automatically to ensure compliance with WCAG and ARIA Authoring Practices.

---

## Example with Classes

```html
<button
  data-automagica11y-toggle="#info"
  data-automagica11y-trigger-class-open="btn--active"
  data-automagica11y-trigger-class-closed="btn--ghost"
  data-automagica11y-target-class-open="panel--visible"
  data-automagica11y-target-class-closed="panel--hidden">
  Info
</button>

<div id="info" hidden>More information...</div>
```

When the button is toggled **open**, automagicA11y:

- Sets `aria-expanded="true"`  
- Removes `hidden` from the target  
- Adds `.btn--active` to the trigger  
- Adds `.panel--visible` to the target  

When toggled **closed**, these revert automatically.

---

## Attribute Reference

| Attribute | Description |
|------------|-------------|
| `data-automagica11y-toggle` | Selector (ID or class) of the target element. **Required.** |
| `data-automagica11y-trigger-class-[state]` | Classes to apply to the trigger for each state (`open`, `closed`, `active`, `inactive`, etc.). |
| `data-automagica11y-target-class-[state]` | Classes to apply to the target element for each state (declared on the trigger). |
| `data-automagica11y-animate` | Opt into the built-in animate lifecycle so close transitions wait for CSS to finish. |

---

## Truthiness Mapping

automagicA11y understands multiple synonyms for “open” and “closed” states.  
The toggle pattern uses a **truthiness mapping** to normalize them internally.

| Truthy (open) | Falsy (closed) |
|---------------|----------------|
| open | closed |
| expanded | collapsed |
| shown | hidden |
| active | inactive |
| pressed | unpressed |
| true | false |
| on | off |

This means that `data-automagica11y-target-class-expanded` and `data-automagica11y-target-class-active` behave identically.

---

## Lifecycle Events

Each initialized toggle dispatches the following events:

| Event | When it fires |
|--------|----------------|
| `automagica11y:ready` | Once the toggle has been initialized and is ready for use |
| `automagica11y:toggle` | Whenever the toggle changes state |

Example:

```js
document.addEventListener("automagica11y:toggle", (e) => {
  const { expanded, trigger, target } = e.detail;
  console.log(expanded ? "Opened" : "Closed", trigger, target);
});
```

---

## Keyboard Support

- **Enter** and **Space** toggle the target (for non-button triggers).  
- Focus remains on the trigger to match ARIA disclosure behavior.  
- `tabindex="0"` is automatically added when needed.

---

## Authoring Notes

- The trigger and target **must** have unique IDs — automagicA11y generates them if missing.  
- The target is hidden by default (`hidden = true`).  
- You can style `[hidden]` or `[aria-expanded="true"]` for transitions.  
- To integrate with CSS animations, use the built-in `data-automagica11y-animate` attribute.

---

## Customization via Data Attributes

Developers can define as many custom class mappings as they want:

```html
<div
  data-automagica11y-toggle="#panel"
  data-automagica11y-trigger-class-active="highlight"
  data-automagica11y-trigger-class-inactive="muted"
  data-automagica11y-target-class-expanded="visible"
  data-automagica11y-target-class-collapsed="hidden">
  Toggle Panel
</div>

<section id="panel" hidden>Panel content here.</section>
```

The truthiness system will resolve each class set to the appropriate true/false state automatically.

---

## Event Detail Structure

Every dispatched event includes a `detail` payload:

```ts
{
  expanded: boolean;  // true if open
  trigger: HTMLElement;
  target: HTMLElement;
}
```

This structure makes it simple to integrate with frameworks, custom logic, or analytics.

---

## Default Styles

```css
.automagic-toggle-open {}
.automagic-toggle-closed {}

[hidden] {
  display: none !important;
}
```

`.automagic-toggle-*` are the built-in trigger fallbacks. Define `data-automagica11y-target-class-*` attributes if you want automagicA11y to manage target-side classes.

---

## Integration Tips

- Manually initialize toggles with `initToggle(element)`.
- The registry auto-initializes all `[data-automagica11y-toggle]` elements on load.
- To extend behavior (persistence, announcements, animations), use or register a plugin.

## Roadmap

- [ ] `data-automagica11y-group` support for accordion-style mutual exclusivity.
- [ ] Persistence plugin that remembers open state across reloads.
- [ ] URL hash synchronization so toggles can be deep-linked.
- [ ] Multi-target toggles (one trigger controlling multiple related panels).

---

## Learn more

| Document | Description |
|-----------|-------------|
| [Root README](../../README.md#getting-started) | Installation commands and pattern index |
| [Toggle pattern docs](../../../docs/src/content/docs/patterns/toggle.mdx) | Live playground and expanded context coverage |
| [Attribute reference](../../../docs/src/content/docs/reference/attributes.mdx) | Grammar for `data-automagica11y-*` attributes |
| [Announce plugin](../../../src/plugins/announce/README.md) | Layer screen reader messaging on top of toggles |

---

© 2025 Mark Zebley • automagicA11y  
_Licensed under the MIT License_
