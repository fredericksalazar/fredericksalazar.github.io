# Implementation Plan: Landing page (Home) del Observatorio de Datos de Colombia

**Branch**: `005-landing-observatorio` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-landing-observatorio/spec.md`

## Summary

Convertir `/observatorio/` en la portada del Observatorio. Hoy esa URL es el
dashboard de inflación, que pasa a `/observatorio/inflacion/` sin perder
contenido. La Home muestra un resumen automático en una frase y un panel de 8
indicadores clave agrupados por tema. Cada indicador trae valor, periodo, cambio
descriptivo, referencia objetiva (meta oficial, promedio de 20 años o hace un año,
sin semáforo), explicación sencilla, fuente y una sparkline en azul de marca.
Debajo van la grilla de dominios, las publicaciones recientes, una sección de
confianza (fuentes, metodología, licencia, cita) y el bloque de autor.

Todo se deriva en build de los JSON publicados. Las sparklines se cargan en
runtime con el sistema `ChartDef` existente, mediante una fábrica nueva. El
JSON-LD `DataCatalog` está pensado para Google Dataset Search.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Astro 6.4 (SSG); Node `>=22.12`

**Primary Dependencies**: Astro, @astrojs/mdx, @astrojs/sitemap, Plotly 2.35.2 por CDN (`basic`). **Sin dependencias nuevas.**

**Storage**: N/A. Lectura de `public/data/*.json` (build: `data.ts`; runtime: `data-client.ts`)

**Testing**: `npx astro check`, `npm run build` (incluye link-checker), revisión visual en `npm run dev` y Lighthouse sobre `npm run preview` (ver [quickstart.md](./quickstart.md)). No hay suite de tests para `lib/` (deuda conocida, ARQUITECTURA sección 12).

**Target Platform**: GitHub Pages (sitio estático); navegadores modernos de escritorio y móvil

**Project Type**: Sitio web estático multipágina

**Performance Goals**: LCP < 2,5 s en móvil; Lighthouse Accesibilidad y SEO ≥ 90 (SC-006)

**Constraints**: Sin backend ni redirecciones de servidor (ARQ-01, ARQUITECTURA sección 9); contenido de valor en el HTML inicial (REGLA 3/17); series solo por `fetch` (REGLA 2); cero cifras escritas a mano (ARQ-02)

**Scale/Scope**: 1 página nueva, 1 página movida, 1 componente nuevo, 1 variante de componente, 1 fábrica de `ChartDef`, 1 módulo `lib` nuevo (`home.ts`), ~5 archivos de contenido con enlaces actualizados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Pre-diseño | Post-diseño | Evidencia |
|---|---|---|---|---|
| G1 | ¿Spec declara objetivo, pilar y KPI? | ✅ | ✅ | spec, sección "Contexto de producto": autoridad · P3 · K1, K3, K4, K5, K6 |
| G2 | ¿Datos de pipeline, con fuente y fecha? ¿Nada inventado? | ✅ | ✅ | Todo valor sale de `indicadores`/`serie`; las referencias se derivan (R4); `META_BANREP` ya existe; frescura visible (R8); excluidos los indicadores `null` (R3) |
| G3 | ¿Se reutilizó lo existente? | ✅ | ✅ | `Hero`, `MapaColombia`, `DashboardNav`, `PageHeader`, `Card`, `AuthorBio`, `DashboardFooter`, `PlotlyLoader`, `ChartDef`+`Chart.astro`, fábrica al estilo de `makeComparativoSet`, `DOMINIOS` como fuente única del menú y la Home. Un componente nuevo justificado (R6) |
| G4 | ¿Cumple UI-NN? | ⚠️ | ✅ con excepción aprobada | Tokens, hero, menú y color consultado (azul de marca) ✅. Excepciones UI-07/UI-08 para sparklines: ver Complexity Tracking |
| G5 | ¿Estático, contenido en HTML, accesible? | ✅ | ✅ | Build-time para cifras y JSON-LD; sparklines como mejora; un `h1`, `aria-label`, foco, sin color como única señal |
| G6 | ¿ARQ-NN y sin dependencias nuevas? | ✅ | ✅ | ARQ-03 (`urls.ts`, incluido el JSON-LD de inflación), ARQ-04 (`catalogoSchema` en `seo.ts`), ARQ-07, ARQ-10 (og PNG), ARQ-12 (cero deps), ARQ-19 |
| G7 | ¿Tareas con definición de terminado y actualización de `agents/`? | ✅ | ✅ | Ver "Documentos vivos" abajo; `/speckit-tasks` debe incluirlos |

**Resultado:** pasa. El autor aprobó las dos excepciones de Complexity Tracking
el 2026-10-19 (opción A).

## Project Structure

### Documentation (this feature)

```text
specs/005-landing-observatorio/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R11
├── data-model.md        # Fase 1: entidades derivadas y catálogos
├── quickstart.md        # Fase 1: guía de verificación
├── contracts/
│   └── home-page.md     # Fase 1: contrato UI de la Home y componentes
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── pages/observatorio/
│   ├── index.astro                 # REESCRITA: nueva Home
│   └── inflacion.astro             # NUEVA: contenido movido desde index.astro
├── components/observatorio/
│   ├── IndicadorClaveCard.astro    # NUEVO
│   ├── Chart.astro                 # + variant="sparkline"
│   └── DashboardNav.astro          # lee DOMINIOS; ítem "Inicio"
├── lib/
│   ├── observatorio/
│   │   ├── home.ts                 # NUEVO: INDICADORES_CLAVE, DOMINIOS, buildIndicadoresClave,
│   │   │                           #        resumenEconomia, estadoFrescura, publicacionesRecientes
│   │   ├── derivations.ts          # + referenciaIndicador, promedioVentana, valorHaceUnAno
│   │   └── chart-defs/
│   │       ├── sparkline.ts        # NUEVO: makeSparkline()
│   │       └── index.ts            # registra spark-*
│   ├── observatorio/charts.ts      # + RANGO_META_BANREP (junto a META_BANREP)
│   ├── urls.ts                     # + urls.dataset() / absUrls.dataset()
│   └── seo.ts                      # + catalogoSchema()
├── pages/llms.txt.ts               # + línea del Observatorio
└── content/blog/
    └── inflacion-tasas-interes-colombia-{junio,agosto,septiembre}-2026.mdx   # enlace al dashboard
public/images/observatorio-home.png  # og:image 1200×630 (NUEVO)

agents/
├── ARCHITECTURE.md                 # rutas del Observatorio (sección 5.4)
└── DESIGN-SYSTEM.md                # catálogo: IndicadorClaveCard, variante sparkline; patrón "Portada de dominio"
src/lib/observatorio/ARCHITECTURE.md  # árbol de archivos, sparklines
```

**Structure Decision**: sitio Astro único existente. La lógica nueva va a
`lib/observatorio/home.ts` y `derivations.ts` (ARQ-06); la página solo compone.

## Fases de implementación (insumo para `/speckit-tasks`)

1. **Mover el dashboard (US2, FR-001/001a):** `index.astro` → `inflacion.astro`,
   migas y JSON-LD con `absUrls.observatorioSub('inflacion')`; `DOMINIOS` en
   `home.ts`; `DashboardNav` lee `DOMINIOS` e incluye "Inicio"; actualizar los 3
   posts mensuales. Compuerta: build y link-checker en verde.
2. **Lógica derivada (US1):** `referenciaIndicador`, `promedioVentana` y
   `valorHaceUnAno` en `derivations.ts`; `INDICADORES_CLAVE`,
   `buildIndicadoresClave`, `estadoFrescura` y `resumenEconomia` en `home.ts`.
3. **Panel (US1, MVP):** `IndicadorClaveCard`, Home con hero, `PageHeader` y panel.
4. **Sparklines (US1):** `makeSparkline`, registro, `Chart variant="sparkline"`.
5. **Navegación y contenido (US2, US3, US5):** grilla de dominios, publicaciones
   recientes, sección de confianza, `AuthorBio` + CTA, `DashboardFooter`, eventos
   GA.
6. **SEO (US4):** metadatos, `catalogoSchema`, `llms.txt`, og:image.
7. **Cierre:** quickstart completo, actualización de `agents/` y del documento del
   Observatorio, nota en la skill `publicar-informe-inflacion` (local).

### Documentos vivos (G7)

- `agents/ARCHITECTURE.md` sección 5.4: rutas (`/observatorio/` = Home,
  `/observatorio/inflacion/`).
- `agents/DESIGN-SYSTEM.md`: catálogo (sección 8) con `IndicadorClaveCard` y la
  variante `sparkline`; sección 5 con la estructura de la Home; excepción UI-08
  para sparklines.
- `src/lib/observatorio/ARCHITECTURE.md`: árbol de archivos, `home.ts`,
  `sparkline.ts`.

### Avisos para el autor (no se resuelven aquí)

- `data_comercio.json`: `balanza_comercial` está definida como cuenta corriente y
  duplica `externo.cuenta_corriente` (research R3). Conviene revisarlo en
  `odc-data-pipeline`.
- El hero de varios dashboards menciona "Sector Fiscal" sin dataset.
- `.claude/` no se versiona: el ajuste de la skill de inflación queda solo en tu
  máquina.

## Complexity Tracking

> Excepciones a reglas UI. **Aprobadas por el autor el 2026-10-19 (opción A)**,
> limitadas a las sparklines `spark-*` de la Home; no aplican a otros gráficos.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **UI-08**: las sparklines (`spark-*`) no tienen interruptor Línea ↔ Barras | Son micrográficas de 48 px sin ejes ni interacción (`staticPlot`); un interruptor por tarjeta añadiría 8 controles sin valor y rompería la lectura de un vistazo | Cumplir UI-08 con interruptor: ruido visual y controles inútiles a ese tamaño. Quitar las sparklines: los referentes muestran que la tendencia es clave para leer el dato |
| **UI-07**: la sparkline no va en su propia card (`ChartContainer`) | Vive dentro de `IndicadorClaveCard`, que ya es la card y muestra título y fuente | Envolverla en `ChartContainer` duplica título y fuente y anida una card dentro de otra |
