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
      'Use semantic HTML and data-automagica11y-* hooks and we\'ll wire the ARIA, focus, and stateful classes automatically at runtime. No setup required.',
    link: { href: '/getting-started/installation/', label: 'Install guide' }
  },
  {
    title: 'Context-aware patterns',
    description:
      'Toggle dialogs, popovers, and tooltips with a single attribute. Context-aware logic handles roles, keyboard bindings, and focus flow for you.',
    link: { href: '/guides/contexts/', label: 'Contexts guide' }
  },
  {
    title: 'Thoughtful details',
    description:
      'Write code the way you think. Truthiness mapping understands your naming — open, expanded, active — and keeps behavior consistent across patterns.',
    link: { href: '/guides/truthiness/', label: 'Truthiness map' }
  }
];
