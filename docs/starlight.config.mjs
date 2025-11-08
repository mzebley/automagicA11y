
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
    { tag: 'meta', attrs: { name: 'theme-color', content: '#4f46e5' } }
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
        { label: 'Truthiness', link: '/guides/truthiness/' }
      ]
    },
    {
      label: 'Patterns',
      items: [
        { label: 'Toggle', link: '/patterns/toggle/' },
        { label: 'Dialog', link: '/patterns/dialog/' },
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
        { label: 'Truthiness aliases', link: '/examples/truthiness-aliases/' }
      ]
    }
  ],
  pagefind: {}
};

export default config;
