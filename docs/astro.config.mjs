import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';
import starlightConfig from './starlight.config.mjs';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://automagica11y.dev/docs',
  integrations: [
    starlight(starlightConfig),
    mdx()
  ],
  vite: {
    resolve: {
      alias: {
        automagica11y: fileURLToPath(new URL('../dist/automagica11y.esm.js', import.meta.url))
      }
    }
  }
});
