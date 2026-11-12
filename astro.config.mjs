// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { rename, rm } from 'node:fs/promises';

/**
 * Páginas que deben publicarse como archivo `.html` exacto, no como carpeta.
 * Las políticas de privacidad de Tilo tienen URL fija (la extensión y la
 * Chrome Web Store apuntan a `/proyectos/tilo/privacidad.html`). Con el
 * formato `directory`, Astro genera `privacidad.html/index.html`; esta
 * integración lo mueve a `privacidad.html` y, en dev, sirve la URL sin slash.
 */
const HTML_FILE_PAGES = [
  '/proyectos/tilo/privacidad.html',
  '/proyectos/tilo/privacy-en.html',
];

/** @returns {import('astro').AstroIntegration} */
function htmlFilePages() {
  return {
    name: 'html-file-pages',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((/** @type {{ url?: string }} */ req, /** @type {unknown} */ _res, /** @type {() => void} */ next) => {
          const [path, query] = (req.url ?? '').split('?');
          if (HTML_FILE_PAGES.includes(path)) req.url = `${path}/${query ? `?${query}` : ''}`;
          next();
        });
      },
      'astro:build:done': async ({ dir }) => {
        for (const page of HTML_FILE_PAGES) {
          const folder = new URL(`.${page}/`, dir);
          const tmp = new URL(`.${page}.tmp`, dir);
          await rename(new URL('index.html', folder), tmp);
          await rm(folder, { recursive: true });
          await rename(tmp, new URL(`.${page}`, dir));
        }
      },
    },
  };
}

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
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
  integrations: [
    mdx(),
    htmlFilePages(),
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
      // Las páginas `.html` exactas no llevan slash final.
      serialize: (item) => {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        if (HTML_FILE_PAGES.includes(path)) item.url = item.url.replace(/\/$/, '');
        return item;
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});