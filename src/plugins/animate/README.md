# Animate Plugin (`registerAnimatePlugin`)

> Ensure CSS-driven close animations finish before targets are hidden—no hard-coded timers required. The plugin now performs the hide itself after visual completion and supports watching a specific element by CSS selector.

The animate plugin listens for every `automagica11y:toggle` event that bubbles through the document. When a trigger opts in with `data-automagica11y-animate`, the plugin pauses the “close” side of the interaction until the browser reports that all transitions/animations on the chosen element are finished. The plugin performs the hide itself after the animation completes, keeping the core toggle fully declarative. It supports `"target"`, `"trigger"`, or any valid CSS selector for fine-grained control.

---

## Installation

```ts
import { registerAnimatePlugin, initToggle } from "automagica11y";

registerAnimatePlugin();

document
  .querySelectorAll("[data-automagica11y-toggle]")
  .forEach((trigger) => initToggle(trigger));
```

Call `registerAnimatePlugin()` once during app boot. The plugin is passive until a trigger adds `data-automagica11y-animate`.

---

## Opting-In

```html
<button
  data-automagica11y-toggle="#drawer"
  data-automagica11y-animate="target"
  data-automagica11y-target-class-open="drawer--open"
  data-automagica11y-target-class-closed="drawer--closed">
  Toggle Drawer
</button>

<section id="drawer" class="drawer drawer--closed" hidden>
  …
</section>
```

- `data-automagica11y-animate="target"`: watch the target element (use `"trigger"` if the trigger itself owns the CSS).
- Combine with `data-automagica11y-target-class-*` (or trigger equivalents) so class changes drive your animations.
- Define the close animation in CSS; the plugin temporarily removes `hidden/aria-hidden`, waits for CSS to finish, then re-hides.

- You can also pass a CSS selector as the value of `data-automagica11y-animate` to watch another element (e.g., an overlay or container) instead of just `"trigger"` or `"target"`.

---

## Lifecycle & Event Flow

1. User activates a toggle; the pattern dispatches a cancelable `automagica11y:toggle`.
2. The animate plugin sees the bubbling event, checks `data-automagica11y-animate`, and if the toggle is *closing* it calls `event.preventDefault()`.
3. While the toggle waits, the plugin:
   - Removes `hidden`/`aria-hidden` (remembering prior values).
   - Removes “open” classes and adds the configured “closing” classes (defaults to `.automagica11y-animating`).
   - Waits a frame so the browser registers the new style before transitions begin.
4. It then monitors:
   - `element.getAnimations({ subtree: false })` and their `.finished` promises.
   - `transitionrun/start/end/cancel` + `animationstart/end/cancel` events.
   - A computed fallback timer derived from all durations/delays/iteration counts.
5. When everything finishes (or is canceled/zero-duration), the plugin re-applies `hidden`/`aria-hidden`, removes temporary helper classes, dispatches `automagica11y:animation-done`, and then re-dispatches the original toggle event with `__automagica11yAnimateProcessed: true` for observers. The plugin itself performs the hide; the toggle will not re-hide when the event was canceled.

Re-opening mid-close? The plugin cancels all timers/listeners, removes staging classes, and defers to the new “open” transition immediately.

### Events

- `automagica11y:animation-done` — fired after close animations fully complete.  
  Detail: `{ trigger, target, watched, phase: "close" }`
- `automagica11y:toggle` — original event dispatched by the toggle pattern (cancelable, bubbles). When Animate completes a close, it re-dispatches the event with `__automagica11yAnimateProcessed: true`.

---

## Roadmap

- [ ] Add support for open-phase animations and custom lifecycle callbacks.
- [ ] Author-configurable minimum/maximum durations via `data-automagica11y-animate-duration-*` guards.
- [ ] Visual regression example that asserts class hooks stay in sync with the animation lifecycle.

---

## Accessibility Considerations

- Respects `prefers-reduced-motion: reduce` by skipping delays and allowing the toggle to resolve instantly.
- Restores the author’s original `aria-hidden` attribute, so custom semantics stay intact.
- Keeps focus on the trigger; you can layer `@core/focus` utilities if you also need focus trapping or return.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Close “jumps” with no animation | Missing `data-automagica11y-animate` or no closing class/transition | Ensure at least one transition/animation is defined on the watched element |
| Close never hides | Another listener canceled the toggle before Animate could run, or the watched selector didn’t resolve | Ensure `data-automagica11y-animate` points to `"target"`, `"trigger"`, or a valid selector and avoid stopping propagation |
| Animations finish instantly | `prefers-reduced-motion` active | Remove the system setting or allow the instant behavior |

Need a refresher on available data attributes? See the main [README](../../../README.md#data-attributes) for the full table.

---

© 2025 automagicA11y · Licensed under MIT. Contributions welcome! Add reproducible scenarios in `tests/plugins/animate.spec.ts` when filing issues.
