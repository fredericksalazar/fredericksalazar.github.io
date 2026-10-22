# Implementation Plan: Contenedor reutilizable con estética blueprint y unificación visual de la Home del Observatorio

**Branch**: `006-panel-blueprint-observatorio` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-panel-blueprint-observatorio/spec.md`

## Summary

Extraer el formato de gran contenedor de contenido con estética blueprint sutil
(gradiente blanco a azul hielo `#f0f5ff`, retícula de puntos con máscara radial,
halo azul difuminado, borde traslúcido de 1 px y radio `24px`) en un nuevo
componente reutilizable `src/components/observatorio/PanelBlueprint.astro`
(cumpliendo el principio III de la constitución, `ARQ-19` y `UI-11`), y aplicarlo
a las tres secciones principales de la portada del Observatorio
(`src/pages/observatorio/index.astro`): **01 · Indicadores clave ("Cómo va
Colombia")**, **02 · Últimas publicaciones** y **03 · Quiénes somos + Misión y
Visión**. Todas las tarjetas internas mantienen superficie blanca sólida
(`--color-sidebar`) para asegurar contraste limpio sobre el contenedor blueprint.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Astro 6.4 (SSG); Node `>=22.12`

**Primary Dependencies**: Astro, @astrojs/mdx, @astrojs/sitemap, Plotly 2.35.2 por CDN (`basic`). **Sin dependencias nuevas.**

**Storage**: N/A. Consume `public/data/*.json` sin cambios.

**Testing**: `ASTRO_TELEMETRY_DISABLED=1 npx astro check`, `ASTRO_TELEMETRY_DISABLED=1 npm run build` (incluye link-checker interno), y revisión visual en `npm run dev` (ver [quickstart.md](./quickstart.md)).

**Target Platform**: GitHub Pages (sitio estático); navegadores modernos de escritorio y móvil.

**Project Type**: Sitio web estático multipágina (Astro SSG).

**Performance Goals**: Cero impacto en JS de cliente (el componente `PanelBlueprint.astro` es 100 % HTML + CSS estático); mantener LCP < 2,5 s y Lighthouse Accesibilidad/SEO ≥ 90.

**Constraints**: Sin dependencias nuevas (ARQ-12); tokens del sistema de diseño (UI-01); reutilización por componente único (ARQ-19, UI-11); enlaces internos solo desde `urls.ts` (ARQ-03).

**Scale/Scope**: 1 componente nuevo (`PanelBlueprint.astro`), 1 página actualizada (`src/pages/observatorio/index.astro`) y 2 documentos de arquitectura/diseño actualizados (`agents/DESIGN-SYSTEM.md` y `src/lib/observatorio/ARCHITECTURE.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Pre-diseño | Post-diseño | Evidencia |
|---|---|---|---|---|
| G1 | ¿La spec declara objetivo, pilar y KPI de `PRODUCT.md`? | ✅ | ✅ | `spec.md`, sección "Contexto de producto": autoridad · P3 Observatorio · K4 Conversiones y K5 Autoridad |
| G2 | ¿Todo dato nuevo viene de un pipeline y muestra fuente y fecha? ¿Nada inventado? | ✅ | ✅ | No se alteran cifras ni series; los 8 indicadores siguen saliendo de `public/data/*.json` con su fuente y periodo |
| G3 | ¿Se reutilizó lo existente (componentes, `ChartDef`, fábricas) en vez de duplicar? | ✅ | ✅ | Se abstrae la repetición de las 3 secciones en `PanelBlueprint.astro` siguiendo el patrón de `BandaOscura.astro` (ARQ-19) |
| G4 | ¿La interfaz cumple las reglas `UI-NN` (tokens, hero, card, toggle, etiquetas, color consultado)? | ✅ | ✅ | Usa los tokens `--color-sidebar`, `--color-border`, `--color-accent`, `--color-accent-glow`, radios XL (`24px`) y L (`18px`), y se registra en el catálogo (UI-11) |
| G5 | ¿Sigue siendo estático, con el contenido de valor en el HTML y accesible? | ✅ | ✅ | 100 % HTML/CSS estático; regiones `<section>` con `aria-labelledby`, decoraciones con `aria-hidden="true"` y soporte a `prefers-reduced-motion` |
| G6 | ¿Se respetan las reglas `ARQ-NN` y no hay dependencias nuevas sin justificar? | ✅ | ✅ | Sin dependencias nuevas (ARQ-12); enlaces con `urls.ts` (ARQ-03); JSON-LD intacto (ARQ-04) |
| G7 | ¿Las tareas incluyen la definición de terminado y la actualización de `agents/`? | ✅ | ✅ | Incluye actualización de `agents/DESIGN-SYSTEM.md` y `src/lib/observatorio/ARCHITECTURE.md` más `astro check` y `npm run build` |

## Project Structure

### Documentation (this feature)

```text
specs/006-panel-blueprint-observatorio/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Decisiones R1–R2 (/speckit-plan)
├── data-model.md        # Props y reglas de validación (/speckit-plan)
├── quickstart.md        # Guía de verificación (/speckit-plan)
├── contracts/
│   └── panel-blueprint.md # Contrato DOM y visual (/speckit-plan)
├── checklists/
│   └── requirements.md  # Checklist de calidad de spec (/speckit-specify)
└── tasks.md             # Tareas ordenadas (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/observatorio/
│   ├── PanelBlueprint.astro        # NUEVO: contenedor reutilizable con estética blueprint sutil
│   └── PipelineBlueprint.astro     # NUEVO: diagrama blueprint animado de fuentes → 6 fases del pipeline → dashboard
├── pages/observatorio/
│   └── index.astro                 # ACTUALIZADO: aplica PanelBlueprint a secciones 01–05 e integra Qué hacemos y Cómo funciona
└── lib/observatorio/
    └── ARCHITECTURE.md             # ACTUALIZADO: registra PanelBlueprint.astro y PipelineBlueprint.astro

agents/
└── DESIGN-SYSTEM.md                # ACTUALIZADO: sección 5.5 (Home) y sección 8 (catálogo de componentes)
```

**Structure Decision**: Se mantiene la arquitectura del módulo Observatorio en `src/components/observatorio/`, colocando `PanelBlueprint.astro` junto a `BandaOscura.astro` e `IndicadorPanel.astro`.

## Complexity Tracking

> Sin violaciones a la Constitución ni a las reglas `ARQ-NN` / `UI-NN`.
