import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Set the site URL and base path for GitHub Pages project site
  site: 'https://unaiberis.github.io/mus-txapelketa',
  base: '/mus-txapelketa/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
