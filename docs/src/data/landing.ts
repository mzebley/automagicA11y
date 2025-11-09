/**
 * Landing page data definitions ensure hero features and quick links can be
 * reused across the docs and future marketing surfaces without duplicating
 * content.
 */
export type LandingFeatureLink = {
  href: string;
  label: string;
};

export type LandingFeature = {
  title: string;
  description: string;
  icon?: string;
  link?: LandingFeatureLink;
};

export type LandingQuickLink = {
  href: string;
  label: string;
  description: string;
};

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Drop-in attributes',
    description:
      'Use semantic HTML and `data-automagica11y-*` hooks. The library reflects `aria-expanded`, `aria-controls`, and stateful classes automatically.',
    icon: '✨',
    link: { href: '/getting-started/installation/', label: 'Install guide' }
  },
  {
    title: 'Context-aware patterns',
    description:
      'Toggle dialogs, popovers, and tooltips with a single attribute. Context presets add roles, keyboard bindings, and focus management for you.',
    icon: '🎯',
    link: { href: '/guides/contexts/', label: 'Contexts guide' }
  },
  {
    title: 'Progressive enhancement first',
    description:
      'No-JS fallbacks stay semantic. Enhancements respect reduced motion, restore focus, and keep the DOM tidy.',
    icon: '🌱',
    link: { href: '/guides/animate/', label: 'Animate responsibly' }
  }
];

export const landingQuickLinks: LandingQuickLink[] = [
  {
    href: '/getting-started/installation/',
    label: 'Installation',
    description: 'Add automagicA11y with npm or pnpm and pull in the auto-init helper.'
  },
  {
    href: '/getting-started/quickstart/',
    label: 'Quickstart',
    description: 'Wire your first toggle in under a minute with live playgrounds.'
  },
  {
    href: '/guides/truthiness/',
    label: 'Truthiness reference',
    description: 'Map custom open/closed states to the library’s boolean helpers.'
  },
  {
    href: '/patterns/toggle/',
    label: 'Toggle pattern',
    description: 'Review attributes, focus helpers, and context-aware presets.'
  },
  {
    href: '/patterns/focus/',
    label: 'Focus utilities',
    description: 'Coordinate focus maps, guard rails, and interactive regions.'
  },
  {
    href: '/plugins/announce/',
    label: 'Announce plugin',
    description: 'Send live region updates with a single `data-automagica11y` attribute.'
  }
];
