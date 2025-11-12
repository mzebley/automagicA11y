import starlightThemeRapide from 'starlight-theme-rapide';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('@astrojs/starlight').StarlightConfig} */
const config = {
  title: 'automagica11y',
  description: 'Progressively-enhanced accessibility utilities with first-class documentation.',
  favicon: '/favicon.svg',
  logo: {
    light: './src/assets/logo-dark.svg',
    dark: './src/assets/logo-dark.svg',
    replacesTitle: true,
  },
  social: [
    {
      icon: 'github',
      label: 'GitHub',
      href: 'https://github.com/mzebley/automagica11y'
    }
  ],
  plugins: [starlightThemeRapide()],
  customCss: ['./src/styles/custom.css'],
  head: [
    // Light/dark theme-color for better PWA/UA UI integration
    { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#2266DD' } },
    { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#2E2E2E' } },
    // Dev: load TS module directly via Vite server. Prod: load built IIFE from /dist.
    ...(isProd
      ? [
          { tag: 'script', attrs: { src: '/dist/automagica11y.min.js' } },
          { tag: 'script', attrs: { type: 'module' }, content: "(() => { const w = window; if (w.automagicA11y && !w.automagica11y) w.automagica11y = w.automagicA11y; if (w.automagica11y && typeof w.automagica11y.initAllPatterns === 'function') { w.automagica11y.initAllPatterns(document); } })();" }
        ]
      : [
          { tag: 'script', attrs: { type: 'module', src: '/src/scripts/auto-init.ts' } }
        ])
  ],
  sidebar: [
    {
      label: 'Get started',
      items: [
        { label: 'Introduction', link: '/' },
        { label: 'Installation', link: '/getting-started/installation/' },
        { label: 'Quickstart', link: '/getting-started/quickstart/' }
      ]
    },
    {
      label: 'Guides',
      items: [
        { label: 'Contexts', link: '/guides/contexts/' },
        { label: 'Truthiness', link: '/guides/truthiness/' },
        { label: 'Animate toggles', link: '/guides/animate/' }
      ]
    },
    {
      label: 'Patterns',
      items: [
        { label: 'Focus utilities', link: '/patterns/focus/' },
        { label: 'Toggle', link: '/patterns/toggle/' },
        { label: 'Dialog', link: '/patterns/dialog/' },
        { label: 'Popover', link: '/patterns/popover/' },
        { label: 'Tooltip', link: '/patterns/tooltip/' }
      ]
    },
    {
      label: 'Plugins',
      items: [
        { label: 'Announce', link: '/plugins/announce/' }
      ]
    },
    {
      label: 'Reference',
      items: [
        { label: 'Core modules', link: '/reference/core/' },
        { label: 'Attributes', link: '/reference/attributes/' },
        { label: 'Events', link: '/reference/events/' },
        { label: 'API', link: '/reference/api/' }
      ]
    },
    {
      label: 'Examples',
      items: [
        { label: 'Toggle', link: '/examples/toggle-basic/' },
        { label: 'Toggle — grouped accordion', link: '/examples/toggle-accordion/' },
        { label: 'Context → Dialog', link: '/examples/context-dialog/' },
        { label: 'Context → Tooltip', link: '/examples/context-tooltip/' },
        { label: 'Truthiness aliases', link: '/examples/truthiness-aliases/' },
        { label: 'Popover dismissal', link: '/examples/popover-basic/' },
        { label: 'Focus map ordering', link: '/examples/focus-map/' },
        { label: 'Per-element focus links', link: '/examples/focus-links/' },
        { label: 'Examples roadmap', link: '/examples/coverage-plan/' }
      ]
    }
  ],
  pagefind: {}
};

export default config;
