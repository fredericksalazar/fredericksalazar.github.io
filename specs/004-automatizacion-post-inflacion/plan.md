# Implementation Plan: Automatización de post de análisis de inflación y tasas de interés con publicación e indexación automática

**Branch**: `004-automatizacion-post-inflacion` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-automatizacion-post-inflacion/spec.md`

---

## Summary

Automatización end-to-end de la publicación mensual del análisis de inflación y tasas de interés:
1. **Extracción determinista de hechos**: Implementación de `scripts/extract-inflacion-facts.mjs` que lee `public/data/data_inflacion.json`, detecta si el último periodo ya fue publicado, y calcula con precisión matemática deltas, efecto base y contexto del año.
2. **Generación automática de portada**: Reutilización de `scripts/build-inflacion-cover-hero.mjs` con `sharp` para producir portadas OpenGraph PNG de 1200x630 píxeles.
3. **Estructura editorial estandarizada**: Redacción de `src/content/blog/inflacion-tasas-interes-colombia-<mes>-<anio>.mdx` incorporando metadatos SEO, `<PlotlyLoader />`, `<FaqSchema />` y los 3 gráficos interactivos del Observatorio (`inflacion-anual`, `tasa-interes`, `spread`).
4. **Verificación y calidad**: Ejecución estricta de `npx astro check` y `npm run build` como compuerta previa a cualquier acción en Git.
5. **Autonomía de publicación y despliegue**: Sincronización con `git pull --rebase`, commit semántico y `git push origin main` para disparo automático del pipeline de GitHub Pages.
6. **Indexación inmediata**: Notificación directa a Bing/Yandex vía `scripts/indexnow-submit.mjs` y actualización de `lastmod` en el sitemap para Google Search Console.
7. **Skill y Programación**: Creación de la skill `.agents/skills/publicar-informe-inflacion/SKILL.md` y configuración del sidecar programado `auto-informe-inflacion`.

---

## Technical Context

**Language/Version**: Node.js >= 22.12 (ESM) y Astro 6 / TypeScript estricto.

**Primary Dependencies**:
- `sharp` (ya presente en el proyecto para rasterización de portadas SVG a PNG).
- `@astrojs/mdx`, `@astrojs/sitemap`.
- Dependencias nativas de Node: `node:fs/promises`, `node:path`.

**Storage**:
- Entrada: `public/data/data_inflacion.json`.
- Salida de portada: `public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png`.
- Salida de post: `src/content/blog/inflacion-tasas-interes-colombia-<mes>-<anio>.mdx`.

**Testing**:
- `ASTRO_TELEMETRY_DISABLED=1 npx astro check`: Verificación de tipos y validación de esquemas Zod en Astro Content Collections.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: Compilación de producción, generación de sitemap y chequeo de enlaces internos (`scripts/check-internal-links.mjs`).

**Target Platform**: macOS (entorno local del autor con Antigravity / Gemini) y Ubuntu latest (GitHub Actions para deploy a GitHub Pages).

**Project Type**: Herramienta de automatización editorial y script de publicación estática.

**Performance Goals**:
- Extracción de datos y generación de portada en < 5 segundos.
- Generación de post y validación completa en < 90 segundos.

**Constraints**:
- **Cero cifras inventadas**: La IA solo puede utilizar los valores contenidos en la Ficha de Hechos producida por el extractor (PRD-05, PRD-07).
- **Sitio 100% estático**: Sin endpoints backend ni almacenamiento dinámico (ARQ-01).
- **Calidad de enlaces**: Todo enlace interno DEBE terminar en `/` (ARQ-03).
- **Autonomía en Git**: Autorizada explícitamente por el usuario para este flujo automático, con la condición innegociable de que el build pase con 0 errores.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Resultado | Evidencia |
|---|---|---|---|
| **G1** | ¿Objetivo, pilar y KPI de `PRODUCT.md` declarados? | ✅ | Spec declara O1 (Autoridad), O2 (Monetización), Pilares P4 (Blog) y P3 (Observatorio), y KPIs K6 (Frescura ≤ 24h), K1 (Impresiones) y K3 (Tráfico). |
| **G2** | ¿Todo dato viene de pipeline con fuente oficial y sin inventar nada? | ✅ | Todos los datos provienen de `data_inflacion.json` (DANE y BanRep) extraídos determinísticamente sin alucinaciones numéricas (PRD-02, PRD-05, PRD-07). |
| **G3** | ¿Se reutiliza lo existente en vez de duplicar? | ✅ | Se reutiliza `build-inflacion-cover-hero.mjs`, los componentes `<Chart id="…">`, `<PlotlyLoader />`, `<FaqSchema />` y `indexnow-submit.mjs` (ARQ-19). |
| **G4** | ¿La interfaz cumple las reglas UI-NN? | ✅ | La portada sigue el diseño blueprint de `DESIGN-SYSTEM.md` y el post MDX cumple la tipografía Google Sans Flex, azul de marca y accesibilidad. |
| **G5** | ¿Sigue siendo estático con contenido de valor en HTML y accesible? | ✅ | El sitio permanece 100% estático en GitHub Pages; el contenido analítico y las tablas están en el HTML inicial para máxima indexabilidad (PRD-03). |
| **G6** | ¿Se respetan las reglas ARQ-NN y no hay dependencias sin justificar? | ✅ | No se agregan nuevas dependencias externas (se utiliza Node nativo y sharp ya existente). Excepción a ARQ-17 autorizada explícitamente para Git push autónomo condicionado a build verde. |
| **G7** | ¿Las tareas incluyen definición de terminado y actualización de `agents/`? | ✅ | Se incluye la actualización de `agents/ARCHITECTURE.md` para documentar la nueva automatización y el script de extracción. |

---

## Project Structure

### Documentation (este feature)

```text
specs/004-automatizacion-post-inflacion/
├── plan.md                                    # Este plan de implementación
├── research.md                                # Decisiones técnicas y de arquitectura
├── data-model.md                              # Ficha de hechos y modelos de datos
├── quickstart.md                              # Guía paso a paso de ejecución y verificación
├── checklists/
│   └── requirements.md                        # Lista de verificación de la especificación
└── contracts/
    ├── inflation-facts-schema.json            # Contrato JSON Schema del extractor de hechos
    └── post-structure.md                      # Contrato estructural normativo del post MDX
```

### Source Code

```text
scripts/
├── extract-inflacion-facts.mjs                # NUEVO: Extractor determinista de cifras y efecto base
├── build-inflacion-cover-hero.mjs             # EXISTENTE: Generador de portada PNG 1200x630
└── indexnow-submit.mjs                        # EXISTENTE: Notificador a Bing/Yandex

src/content/blog/
└── inflacion-tasas-interes-colombia-<mes>-<anio>.mdx # Artículos generados

.agents/skills/
└── publicar-informe-inflacion/
    └── SKILL.md                               # NUEVO: Skill reproducible del proyecto

.claude/skills/
└── publicar-informe-inflacion/
    └── SKILL.md                               # NUEVO: Espejo de la skill
```

---

## Complexity Tracking

| Violación | Razón | Alternativa rechazada y por qué |
|---|---|---|
| Autonomía de Git (`git push` automático) | El usuario solicitó explícitamente que la publicación sea 100% desatendida tras detectar el nuevo dato mensual. | Push manual: obligaría al autor a intervenir manualmente cada mes, perdiendo la ventaja de frescura inmediata (K6). |
