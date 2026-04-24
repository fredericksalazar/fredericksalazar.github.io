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
