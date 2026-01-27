import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Set `base` to the GitHub Pages project path so built assets use the correct prefix
export default defineConfig({
  integrations: [svelte()],
  output: 'static',
  base: '/',
  // NOTE: if you deploy to GitHub Pages under a project path, change `site` and `base` accordingly.
  site: 'https://unaiberis.github.io/',
});
