
/** @type {import('@astrojs/starlight').StarlightConfig} */
const config = {
  title: 'automagicA11y',
  description: 'Progressively-enhanced accessibility utilities with first-class documentation.',
  favicon: '/favicon.svg',
  logo: {
    src: './src/assets/logo.svg',
    alt: 'automagicA11y logo'
  },
  social: [
    {
      icon: 'github',
      label: 'GitHub',
      href: 'https://github.com/markzebley/automagicA11y'
    }
  ],
  customCss: ['./src/styles/custom.css'],
  head: [
    // Light/dark theme-color for better PWA/UA UI integration
    { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#4f46e5' } },
    { tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1f2430' } },
    { tag: 'script', attrs: { type: 'module', src: '/src/scripts/auto-init.ts' } }
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
        { label: 'Focus management', link: '/guides/focus/' }
      ]
    },
    {
      label: 'Patterns',
      items: [
        { label: 'Toggle', link: '/patterns/toggle/' },
        { label: 'Dialog', link: '/patterns/dialog/' },
        { label: 'Popover', link: '/patterns/popover/' },
        { label: 'Tooltip', link: '/patterns/tooltip/' }
      ]
    },
    {
      label: 'Plugins',
      items: [
        { label: 'Announce', link: '/plugins/announce/' },
        { label: 'Animate', link: '/plugins/animate/' }
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
        { label: 'Context → Dialog', link: '/examples/context-dialog/' },
        { label: 'Context → Tooltip', link: '/examples/context-tooltip/' },
        { label: 'Truthiness aliases', link: '/examples/truthiness-aliases/' },
        { label: 'Popover dismissal', link: '/examples/popover-basic/' },
        { label: 'Focus map ordering', link: '/examples/focus-map/' },
        { label: 'Examples roadmap', link: '/examples/coverage-plan/' }
      ]
    }
  ],
  pagefind: {}
};

export default config;
