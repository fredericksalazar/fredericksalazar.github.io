/**
 * Single source of truth para construir URLs internas del sitio.
 *
 * Reglas (vinculantes):
 *  - El sitio usa `trailingSlash: 'always'` (ver astro.config.mjs).
 *    Cualquier enlace interno DEBE terminar en `/` excepto si apunta a un
 *    archivo real (rss.xml, llms.txt, sitemap.xml, /images/*, etc.).
 *  - Nunca construyas rutas internas con template literals sueltos en los
 *    `.astro` / `.ts`. Importa desde aquí. Si no existe el helper que
 *    necesitas, agrégalo en este archivo.
 *
 * El no-cumplimiento provoca redirecciones internas 301 que degradan el SEO
 * (problema detectado en la auditoría de mayo 2026, 77 enlaces afectados).
 */

export const SITE_URL = 'https://fredericksalazar.github.io';

/** Normaliza un texto a slug, con encodeURIComponent para soportar acentos. */
export const slugifyTag = (s: string) =>
  encodeURIComponent(s.toLowerCase().trim().replace(/\s+/g, '-'));

/** Garantiza que una ruta termine en `/`. */
const withSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);

/** Convierte una ruta relativa en URL absoluta usando SITE_URL. */
export const absolute = (path: string) => `${SITE_URL}${path}`;

/**
 * Rutas internas (relativas). Úsalas en `href="..."`.
 * Todas garantizan trailing slash cuando corresponde.
 */
export const urls = {
  home: () => '/',

  // Secciones principales
  experiencia: () => '/experiencia/',
  certificaciones: () => '/certificaciones/',
  proyectos: () => '/proyectos/',
  proyecto: (slug: string) => withSlash(`/proyectos/${slug}`),

  // Blog
  blog: () => '/blog/',
  blogPost: (slug: string) => withSlash(`/blog/${slug}`),
  blogTags: () => '/blog/tags/',
  blogTag: (tag: string) => withSlash(`/blog/tag/${slugifyTag(tag)}`),
  blogArchivo: () => '/blog/archivo/',

  // Observatorio
  observatorio: () => '/observatorio/',
  observatorioSub: (slug: string) => withSlash(`/observatorio/${slug}`),

  // Observatorio · Informes
  observatorioInformes: () => '/observatorio/informes/',
  observatorioInforme: (slug: string) => withSlash(`/observatorio/informes/${slug}`),
  /** PDF real bajo public/informes/. NO lleva trailing slash (archivo real). */
  informePdf: (archivo: string) => `/informes/${archivo}`,

  // Elecciones presidenciales
  elecciones: (slug: string) => withSlash(`/elecciones-presidenciales/${slug}`),

  // Calculadoras
  calculadoras: () => '/calculadoras/',
  calculadora: (slug: string) => withSlash(`/calculadoras/${slug}`),

  // Salarios por cargo
  salarios: () => '/salarios/',
  salarioCargo: (slug: string) => withSlash(`/salarios/${slug}`),

  // Archivos reales (NO llevan trailing slash)
  rss: () => '/rss.xml',
  llms: () => '/llms.txt',
  sitemap: () => '/sitemap-index.xml',
} as const;

/**
 * URLs absolutas. Úsalas en `<link rel="canonical">`, og:url, JSON-LD,
 * RSS y cualquier campo que requiera URL completa.
 */
export const absUrls = {
  home: () => absolute(urls.home()),
  experiencia: () => absolute(urls.experiencia()),
  certificaciones: () => absolute(urls.certificaciones()),
  proyectos: () => absolute(urls.proyectos()),
  proyecto: (slug: string) => absolute(urls.proyecto(slug)),

  blog: () => absolute(urls.blog()),
  blogPost: (slug: string) => absolute(urls.blogPost(slug)),
  blogTags: () => absolute(urls.blogTags()),
  blogTag: (tag: string) => absolute(urls.blogTag(tag)),
  blogArchivo: () => absolute(urls.blogArchivo()),

  observatorio: () => absolute(urls.observatorio()),
  observatorioSub: (slug: string) => absolute(urls.observatorioSub(slug)),

  observatorioInformes: () => absolute(urls.observatorioInformes()),
  observatorioInforme: (slug: string) => absolute(urls.observatorioInforme(slug)),
  informePdf: (archivo: string) => absolute(urls.informePdf(archivo)),

  elecciones: (slug: string) => absolute(urls.elecciones(slug)),

  calculadoras: () => absolute(urls.calculadoras()),
  calculadora: (slug: string) => absolute(urls.calculadora(slug)),

  salarios: () => absolute(urls.salarios()),
  salarioCargo: (slug: string) => absolute(urls.salarioCargo(slug)),

  rss: () => absolute(urls.rss()),
} as const;
