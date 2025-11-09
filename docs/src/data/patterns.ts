export const toggleAttributes = [
  {
    attribute: 'data-automagica11y-toggle',
    type: 'string | Selector',
    allowedValues: 'CSS selector, typically an #id',
    defaultValue: 'None',
    description: 'Identifies the target surface to show or hide.'
  },
  {
    attribute: 'data-automagica11y-trigger-class-[state] ',
    type: 'string | string[]',
    allowedValues: 'Any truthiness token (open, expanded, active, shown, true, on...)',
    defaultValue: 'automagic-toggle-open / automagic-toggle-closed',
    description: 'Maps classes onto the trigger for truthy/falsy states.'
  },
  {
    attribute: 'data-automagica11y-target-class-[state]',
    type: 'string | string[]',
    allowedValues: 'Any truthiness token',
    defaultValue: 'None',
    description: 'Applies classes to the target element during each state.'
  },
  {
    attribute: 'data-automagica11y-animate',
    type: 'boolean',
    allowedValues: '`true`, `false`',
    defaultValue: '`false`',
    description: 'Opt into the animate plugin to wait for CSS transitions when closing.'
  }
];

export const dialogAttributes = [
  {
    attribute: 'data-automagica11y-context="dialog"',
    type: 'string',
    allowedValues: '`dialog`',
    defaultValue: 'N/A',
    description: 'Activates the dialog context with full semantics and behaviors.'
  },
  {
    attribute: 'data-automagica11y-target',
    type: 'string | Selector',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'Next sibling',
    description: 'Points at the dialog surface element.'
  },
  {
    attribute: 'data-automagica11y-context-mode',
    type: '`full` | `semantics` | `behaviors`',
    allowedValues: 'Mode tokens',
    defaultValue: '`full`',
    description: 'Toggle between semantic-only, behavior-only, or full automation.'
  },
  {
    attribute: 'data-automagica11y-dialog',
    type: 'string | Selector',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'None',
    description: 'Legacy alias that maps directly to the dialog context.'
  },
  {
    attribute: 'data-automagica11y-dialog-close',
    type: 'boolean attribute',
    allowedValues: '`data-automagica11y-dialog-close`',
    defaultValue: 'N/A',
    description: 'Marks a button inside the surface that closes the dialog.'
  }
];

export const tooltipAttributes = [
  {
    attribute: 'data-automagica11y-context="tooltip"',
    type: 'string',
    allowedValues: '`tooltip`',
    defaultValue: 'N/A',
    description: 'Activates tooltip semantics and behaviors.'
  },
  {
    attribute: 'data-automagica11y-tooltip',
    type: 'string | Selector',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'None',
    description: 'Legacy alias mapped to the tooltip context.'
  },
  {
    attribute: 'data-automagica11y-target',
    type: 'string | Selector',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'Next sibling',
    description: 'Explicitly points at the tooltip surface when using context syntax.'
  },
  {
    attribute: 'data-automagica11y-tooltip-open-delay',
    type: 'number (ms)',
    allowedValues: '0+',
    defaultValue: '0',
    description: 'Delay before showing the tooltip after hover/focus.'
  },
  {
    attribute: 'data-automagica11y-tooltip-close-delay',
    type: 'number (ms)',
    allowedValues: '0+',
    defaultValue: '100',
    description: 'Delay before hiding once the pointer/focus leaves.'
  },
  {
    attribute: 'data-automagica11y-tooltip-position',
    type: '`auto` | `top` | `bottom` | `left` | `right`',
    allowedValues: 'Placement tokens',
    defaultValue: '`auto`',
    description: 'Preferred placement; flips automatically when space is tight.'
  }
];

export const popoverAttributes = [
  {
    attribute: 'data-automagica11y-popover',
    type: 'string | Selector',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'Required',
    description: 'Connects the trigger to the popover surface.'
  },
  {
    attribute: 'data-automagica11y-popover-position',
    type: '`auto` | `top` | `bottom` | `left` | `right`',
    allowedValues: 'Placement tokens',
    defaultValue: '`auto`',
    description: 'Preferred placement for anchored positioning. Falls back automatically.'
  },
  {
    attribute: 'data-automagica11y-popover-outside-dismiss',
    type: 'boolean',
    allowedValues: '`true`, `false`',
    defaultValue: '`true`',
    description: 'Close the popover when clicking outside the surface.'
  },
  {
    attribute: 'data-automagica11y-popover-scroll-dismiss',
    type: 'boolean',
    allowedValues: '`true`, `false`',
    defaultValue: '`true`',
    description: 'Close the popover when the page scrolls beyond the configured distance.'
  },
  {
    attribute: 'data-automagica11y-popover-scroll-distance',
    type: 'number (px)',
    allowedValues: '0+',
    defaultValue: '0',
    description: 'Pixels of scroll before the popover dismisses itself.'
  },
  {
    attribute: 'data-automagica11y-popover-dismiss',
    type: 'boolean attribute',
    allowedValues: 'Present on any control inside the surface',
    defaultValue: 'N/A',
    description: 'Marks controls that close the popover when activated.'
  }
];

export const focusInitialAttributes = [
  {
    attribute: 'data-automagica11y-focus-initial',
    type: 'boolean attribute',
    allowedValues: 'Present on any focusable element',
    defaultValue: 'N/A',
    description: 'Opt-in marker that tells the helper which element to focus.'
  },
  {
    attribute: 'data-automagica11y-focus-delay',
    type: 'number (ms)',
    allowedValues: '0+',
    defaultValue: '0',
    description: 'Delay before focusing. Useful when waiting for transitions.'
  },
  {
    attribute: 'data-automagica11y-focus-prevent-scroll',
    type: 'boolean',
    allowedValues: '`true`, `false`',
    defaultValue: '`true`',
    description: 'Control whether focusing should avoid scrolling the page.'
  }
];

export const focusMapAttributes = [
  {
    attribute: 'data-automagica11y-focus-map',
    type: 'string | string[]',
    allowedValues: 'Semicolon or JSON array of selectors',
    defaultValue: 'None',
    description: 'Ordered selectors describing the preferred focus sequence.'
  },
  {
    attribute: 'data-automagica11y-focus-map-scope',
    type: '`document` | `self` | Selector',
    allowedValues: 'Scope tokens',
    defaultValue: '`document`',
    description: 'Restrict where selectors resolve when building the focus list.'
  },
  {
    attribute: 'data-automagica11y-focus-map-anchor',
    type: 'Selector',
    allowedValues: 'CSS selector',
    defaultValue: '`self`',
    description: 'Element that receives focus first and loops back when Shift+Tabbing from the first mapped item.'
  }
];

export const attributeReference = [
  {
    attribute: 'data-automagica11y-toggle',
    type: 'string',
    allowedValues: 'CSS selector, typically an #id',
    defaultValue: 'Required',
    description: 'Connects a trigger to its target surface.'
  },
  {
    attribute: 'data-automagica11y-context',
    type: 'string',
    allowedValues: '`dialog`, `tooltip`, `menu`, custom aliases',
    defaultValue: 'None',
    description: 'Activates a named context that layers semantics and behaviors on top of toggle.'
  },
  {
    attribute: 'data-automagica11y-context-mode',
    type: '`full` | `semantics` | `behaviors`',
    allowedValues: 'Mode tokens',
    defaultValue: '`full`',
    description: 'Controls how much automation the context applies.'
  },
  {
    attribute: 'data-automagica11y-target',
    type: 'string',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'Next sibling',
    description: 'Explicit override for the managed surface when using context syntax.'
  },
  {
    attribute: 'data-automagica11y-dialog',
    type: 'string',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'None',
    description: 'Alias that forwards to the dialog context.'
  },
  {
    attribute: 'data-automagica11y-tooltip',
    type: 'string',
    allowedValues: 'CSS selector or ID reference',
    defaultValue: 'None',
    description: 'Alias that forwards to the tooltip context.'
  },
  {
    attribute: 'data-automagica11y-*-role',
    type: 'string',
    allowedValues: 'Any valid ARIA role',
    defaultValue: 'Context defaults',
    description: 'Override the auto-assigned role on the trigger or target (for example `data-automagica11y-target-role="alertdialog"`).'
  },
  {
    attribute: 'data-automagica11y-target-aria-*',
    type: 'string',
    allowedValues: 'Any ARIA attribute value',
    defaultValue: 'Context defaults',
    description: 'Override specific ARIA attributes on the target. The library merges these with its computed values.'
  },
  {
    attribute: 'data-automagica11y-trigger-aria-*',
    type: 'string',
    allowedValues: 'Any ARIA attribute value',
    defaultValue: 'Context defaults',
    description: 'Override ARIA attributes placed on the trigger (for example `data-automagica11y-trigger-aria-haspopup="menu"`).'
  }
];
