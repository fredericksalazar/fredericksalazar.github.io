// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://fredericksalazar.github.io',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  integrations: [
    sitemap({
      // Excluir del sitemap cualquier página NO indexable (noindex):
      // borradores, páginas de tags, índice de tags, archivo y la página
      // de redirección de elecciones. El sitemap solo debe listar URLs
      // canónicas indexables; incluir noindex genera señales contradictorias
      // en Google Search Console y Bing Webmaster Tools.
      filter: (page) =>
        !page.includes('/draft') &&
        !page.includes('/blog/tag/') &&
        !page.endsWith('/blog/tags/') &&
        !page.endsWith('/blog/archivo/') &&
        !page.endsWith('/elecciones-presidenciales/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});