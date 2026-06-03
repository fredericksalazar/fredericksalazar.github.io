# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (requires Node >=22.12.0)
npm run build     # Production build
npm run preview   # Preview production build locally
```

## Architecture

**Stack:** Astro 6.1.8 (static site, no JS framework) + Tailwind CSS v4 via `@tailwindcss/vite` plugin. No React/Vue.

**Layout system:** `BaseLayout.astro` is the single root layout. It renders a fixed 240px sidebar (`Sidebar.astro`) + a main content area. Pages pass `fullWidth={true}` to suppress the sidebar's max-width constraint. View Transitions (Astro's `ClientRouter`) are enabled globally for SPA-style navigation.

**Content Collections** (`src/content.config.ts`):
- `blog` — Markdown posts with `titulo`, `fecha`, `descripcion`, `etiquetas`, `imagen`, `draft`
- `proyectos` — Markdown project files with `titulo`, `descripcion`, `tecnologias[]`, `github`, `demo`, `imagen`, `destacado`, `orden`

All content lives in `src/content/{blog,proyectos}/`. Dynamic routes use `getStaticPaths()` + `getCollection()`.

**CSS approach:** Global design tokens as CSS custom properties on `:root` in `BaseLayout.astro`. Page-scoped styles use Astro's `<style>` blocks (auto-scoped). Tailwind v4 is available but most styles use the custom property system.

**No tests, no linter config** — `astro check` is the type checker (runs via Astro CLI).

## Enlaces internos (vinculante)

El sitio usa `trailingSlash: 'always'`. **Nunca** escribas template literals
para rutas internas (p. ej. `` href={`/blog/${slug}/`} ``) — importa los
helpers de [`src/lib/urls.ts`](./src/lib/urls.ts):

```astro
import { urls, absUrls } from '../lib/urls';
<a href={urls.blogPost(post.id)}>...</a>      {/* hrefs relativos */}
{ url: absUrls.blogPost(post.id) }            {/* JSON-LD, canonical, RSS */}
```

Si necesitas una ruta nueva, **agrégala** a `urls.ts` antes de usarla.
`npm run build` ejecuta `scripts/check-internal-links.mjs` y falla si
encuentra cualquier `href="/..."` sin trailing slash en el output — no hay
forma de mergear código que reintroduzca el problema de redirecciones 301.

## Observatorio (dashboards)

Cualquier trabajo en `src/pages/observatorio/`, `src/components/observatorio/`,
`src/lib/observatorio/` o `public/data/*.json` **debe leer y cumplir**
[`src/lib/observatorio/ARCHITECTURE.md`](./src/lib/observatorio/ARCHITECTURE.md).

Ese documento define el ciclo de vida de datos (pipeline → JSON → fetch
runtime), el contrato del JSON, dónde vive cada cosa (`ChartDef` + registry +
componente único `Chart.astro`), las reglas de SEO/runtime, los anti-patrones
prohibidos y el procedimiento canónico para agregar un indicador o un dataset.
Las reglas son vinculantes — si un cambio no encaja, parar y consultar antes
de romper la arquitectura.
