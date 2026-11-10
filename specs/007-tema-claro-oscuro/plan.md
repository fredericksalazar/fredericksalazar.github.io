# Implementation Plan: Modo claro y modo oscuro en todo el sitio

**Branch**: `feature/dark-mode` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-tema-claro-oscuro/spec.md`

**Note**: Este plan se ejecuta con `/speckit-plan`; su definición describe el flujo de trabajo.

## Summary

Implementar un sistema de tema de tres estados —**Automático**, **Claro** y
**Oscuro**— en todo el sitio estático. La preferencia se detecta del sistema en
la primera visita, se puede cambiar desde una sección nueva del sidebar ubicada
debajo del divisor del perfil, se persiste en el navegador y se aplica antes del
primer pintado para evitar destellos. El enfoque es CSS-first: tokens semánticos
en `:root` y `:root[data-theme="dark"]`, un script inline mínimo para el estado
inicial y un módulo cliente para la interacción. Los gráficos Plotly, el
resaltado de código, las imágenes/logos y los componentes con estilos propios
(hero, blueprint, banners, marcadores) se adaptan sin dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto · Astro 6.4.8 · Node.js >= 22.12

**Primary Dependencies**: Astro, `@astrojs/mdx`, `@astrojs/sitemap`,
`@astrojs/rss`, Tailwind CSS v4 (importado, uso mínimo), Plotly.js 2.35.2 por CDN.
**Sin dependencias nuevas.**

**Storage**: `localStorage` del navegador para la preferencia de tema
(`theme-preference`). Los datasets de `public/data/*.json` no cambian.

**Testing**: `npx astro check` (tipos), `npm run build` (build + verificador de
enlaces internos) y revisión visual manual con `npm run dev`. El proyecto no
tiene framework de pruebas visuales ni unitarias; no se agrega uno.

**Target Platform**: Sitio SSG multipágina en GitHub Pages. Navegadores modernos
con CSS custom properties, `prefers-color-scheme`, `matchMedia` y `localStorage`.
Degradación elegante en navegadores antiguos y con JavaScript desactivado.

**Project Type**: Sitio web estático (Astro SSG), sin backend ni islas de
framework.

**Performance Goals**: Tema correcto desde el primer pintado (sin FOUC) en ≥ 99 %
de las cargas; sin cambios de layout (CLS 0) al cambiar de tema; script inline
de pre-pintado mínimo (< 1 KB) y módulo cliente diferido. Los gráficos solo se
re-renderizan cuando cambia el tema.

**Constraints**: Solo estático, sin backend, sin secretos ni nuevas
dependencias (ARQ-01, ARQ-12). Contraste WCAG AA (4.5:1 texto normal, 3:1 texto
grande/íconos). Respeto a `prefers-reduced-motion`. Contenido de valor en el HTML
inicial. El modo claro debe conservar el aspecto actual. El tema oscuro conserva
el azul de marca y usa grises muy oscuros (no negro puro).

**Scale/Scope**: Todo el sitio: CV, proyectos, Observatorio (dashboards,
informes, elecciones), calculadoras, blog, 404, navegación, sidebar, footer,
popups, tablas, formularios, gráficos Plotly, bloques de código Shiki e imágenes.
Auditoría inicial: ~898 literales de color en ~50 archivos `.astro`/`.css`/`.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Resultado | Evidencia / nota |
| --- | --- | --- | --- |
| G1 | ¿La spec declara objetivo, pilar y KPI de `PRODUCT.md`? | **Pass** | `spec.md` → Contexto de producto: autoridad + monetización; P1–P4; K3 y K5. |
| G2 | ¿Todo dato nuevo viene de un pipeline y muestra fuente y fecha? ¿Nada inventado? | **Pass** | No hay datos nuevos ni cifras; la preferencia de tema es estado de UI, no dato publicado. |
| G3 | ¿Se reutilizó lo existente (componentes, `ChartDef`, fábricas) en vez de duplicar? | **Pass** | Se reutilizan tokens, `Chart.astro`, `baseLayout()` y los `ChartDef`. El único componente nuevo es `ThemeToggle` (justificado por la spec y se agrega al catálogo, UI-11). |
| G4 | ¿La interfaz cumple las reglas `UI-NN` (tokens, hero, card, toggle, etiquetas, color consultado)? | **Pass con enmienda** | Se amplía la identidad de “solo modo claro” a dos temas. Se añaden tokens y una regla UI de tema; se actualizan `DESIGN-SYSTEM.md` y `PRODUCT.md` (PRD-04). Registrado en *Complexity Tracking*. |
| G5 | ¿Sigue siendo estático, con el contenido de valor en el HTML y accesible? | **Pass** | SSG sin backend; script inline de pre-pintado y módulo diferido; controles nativos accesibles; contenido intacto en HTML inicial. |
| G6 | ¿Se respetan las reglas `ARQ-NN` y no hay dependencias nuevas sin justificar? | **Pass** | Solo CSS y Web APIs (`matchMedia`, `localStorage`). Shiki dual theme es nativo de Astro. Plotly ya existe. Sin npm/pip/CDN nuevos. |
| G7 | ¿Las tareas incluyen la definición de terminado y la actualización de `agents/`? | **Pass** | El plan incluye DoD (`astro check`, build, QA visual) y actualización de `agents/DESIGN-SYSTEM.md`, `PRODUCT.md` y `ARCHITECTURE.md`. |

**Resultado**: las 7 compuertas pasan. La única desviación (identidad visual de
dos temas) está justificada por la petición explícita del autor y se documenta en
*Complexity Tracking* y en los documentos vivos.

## Project Structure

### Documentation (this feature)

```text
specs/007-tema-claro-oscuro/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y alternativas
├── data-model.md        # Fase 1: entidades, estados y tokens
├── quickstart.md        # Fase 1: guía de validación end-to-end
├── contracts/
│   └── theme-contract.md # Fase 1: contrato DOM / storage / eventos / ARIA
└── tasks.md             # Fase 2 (lo crea /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── layouts/
│   └── BaseLayout.astro          # Tokens claro/oscuro, script de pre-pintado,
│                                 # color-scheme, print y transiciones
├── components/
│   ├── ThemeToggle.astro         # NUEVO: selector Automático/Claro/Oscuro
│   ├── Sidebar.astro             # Hospeda ThemeToggle bajo el divisor del perfil
│   ├── SEOHead.astro             # meta color-scheme y theme-color
│   ├── Hero.astro                # Fondo blueprint adaptado a oscuro
│   ├── Card.astro, Footer.astro, Callout.astro, AuthorBio.astro,
│   ├── BlogFilters.astro, ShareButtons.astro, TableOfContents.astro,
│   ├── ReadingProgress.astro     # Migración de literales a tokens
│   └── observatorio/
│       ├── PanelBlueprint.astro, PipelineBlueprint.astro, BandaOscura.astro,
│       ├── MapaColombia.astro, InformePopup.astro, IndicadorCard.astro,
│       ├── IndicadorClaveCard.astro, DashboardNav.astro,
│       ├── EleccionesNav.astro, ChartContainer.astro,
│       └── Chart.astro           # Re-render de gráficos al cambiar de tema
├── lib/
│   ├── theme-client.ts           # NUEVO: preferencia, resolución, eventos
│   └── observatorio/
│       ├── charts.ts             # baseLayout()/FONT/COLORS sensibles al tema
│       ├── theme-colors.ts       # NUEVO: lectura de tokens CSS para Plotly
│       ├── plotly-mount.ts       # Plotly.react al cambiar de tema
│       └── chart-defs/*.ts       # Neutros y mapbox adaptados al tema
├── styles/
│   └── global.css                # Superficies de calculadoras a tokens
└── pages/
    ├── index.astro, experiencia.astro, certificaciones.astro, 404.astro
    ├── proyectos/, blog/, calculadoras/, observatorio/,
    └── elecciones-presidenciales/ # Migración de literales a tokens

astro.config.mjs                  # Shiki con temas claro/oscuro
```

**Structure Decision**: se mantiene la estructura existente de Astro. No se crean
proyectos ni carpetas nuevas de código; solo se agregan `ThemeToggle.astro`,
`theme-client.ts` y `theme-colors.ts`, y se modifican los archivos existentes. La
documentación de la feature vive en `specs/007-tema-claro-oscuro/`.

## Complexity Tracking

| Violación | Por qué es necesaria | Alternativa más simple rechazada |
| --- | --- | --- |
| Cambio de identidad: la constitución (principio IV) y `DESIGN-SYSTEM.md` declaran “solo modo claro” y fondo blanco. | El autor pidió explícitamente modo claro/oscuro en todo el sitio; la preferencia del sistema y la accesibilidad lo justifican. | Mantener solo modo claro no cumple la feature. Un segundo CSS aislado duplicaría tokens y rompería UI-01. Se actualizan los documentos y se registra la enmienda. |
| Migración masiva de ~898 literales de color en ~50 archivos. | Los literales impiden que los tokens cambien con el tema. | Un filtro CSS global (`invert`/`hue-rotate`) distorsiona marca, imágenes, gráficos y accesibilidad. Se tokeniza por semántica. |
| Re-render de gráficos Plotly al cambiar de tema. | Plotly dibuja colores estáticos en canvas/SVG; CSS no puede recolorear el canvas. | Dejar los gráficos en claro violaría “todo el website” y el contraste. Se reutiliza `def.build()` + `Plotly.react` con datos cacheados. |
| Mapas con `mapbox.style` oscuro. | Los mapas de elecciones usan `white-bg`; en oscuro necesitan una base oscura. | Un token de Mapbox o un servicio de tiles nuevo es una dependencia/secreto no justificado. Se usa el estilo integrado `carto-darkmatter` de Plotly, que no requiere token, con fallback a `white-bg`. |
| Código resaltado con Shiki `github-light`. | Los bloques de código deben ser legibles en oscuro. | Un tema único no cubre ambos; se usa el soporte nativo de Astro para temas duales, sin dependencias nuevas. |

## Phase 0: Outline & Research

**Output**: [`research.md`](./research.md)

Decisiones principales (detalle y alternativas en `research.md`):

1. **Modelo de estado**: preferencia `auto | light | dark`; tema resuelto
   `light | dark`; `localStorage` clave `theme-preference`; DOM
   `<html data-theme="…" data-theme-preference="…">`; evento `themechange`.
2. **Pre-pintado sin FOUC**: script inline en `<head>` que lee storage y
   `matchMedia`, aplica `data-theme` y actualiza `theme-color`; re-aplicación en
   `astro:after-swap`; fallback CSS con `@media (prefers-color-scheme: dark)`
   para cuando no hay JavaScript.
3. **Arquitectura de tokens**: tokens existentes intactos en claro; bloque oscuro
   en `:root[data-theme="dark"]`; tokens nuevos para superficies, texto, sombras,
   blueprint/hero, estados y gráficos. El azul de marca se conserva; en oscuro se
   usa una variante más clara para texto/enlaces y el azul de marca para rellenos.
4. **Paleta oscura**: grises azulados tipo slate (`#0f172a` fondo, `#1e293b`
   superficie, `#334155` bordes/hover, texto `#f1f5f9`/`#cbd5e1`/`#94a3b8`),
   acento de texto `#3b82f6` y acento de marca `#2563eb`.
5. **Gráficos**: `theme-colors.ts` lee CSS custom properties en runtime;
   `baseLayout()` y `FONT` se vuelven sensibles al tema; los neutros de
   `chart-defs` se reemplazan por tokens; `Chart.astro` re-ejecuta `def.build()`
   y `Plotly.react` en `themechange`; los mapas usan `carto-darkmatter` en oscuro.
6. **Código**: `astro.config.mjs` con `shikiConfig.themes` claro/oscuro y CSS
   para `.astro-code` según `data-theme`.
7. **Imágenes/logos**: no se invierten; se ajustan contenedores/bordes solo donde
   el fondo claro rompa el contraste.
8. **Sin dependencias nuevas**: todo se resuelve con CSS, Web APIs y lo ya
   instalado (Astro/Plotly).

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` completo.

**Outputs**:

- [`data-model.md`](./data-model.md): entidades `ThemePreference`,
  `ResolvedTheme`, `ThemeState`; transiciones de estado; contrato de tokens
  claro/oscuro; contrato del componente `ThemeToggle`; reglas de persistencia y
  resolución.
- [`contracts/theme-contract.md`](./contracts/theme-contract.md): contrato de DOM
  (`data-theme`, `data-theme-preference`), almacenamiento
  (`theme-preference`), evento `themechange`, API del módulo `theme-client`,
  semántica ARIA del selector y comportamiento en View Transitions.
- [`quickstart.md`](./quickstart.md): matriz de validación manual (primera visita,
  cambio manual, persistencia, navegación, móvil, teclado, reduced motion, sin
  JavaScript, storage bloqueado, impresión, gráficos, mapas, código, imágenes).

## Post-Design Constitution Check

*Re-evaluación tras el diseño de Fase 1.*

| # | Compuerta | Resultado | Nota post-diseño |
| --- | --- | --- | --- |
| G1 | Objetivo, pilar y KPI declarados | **Pass** | Sin cambios. |
| G2 | Datos con fuente, nada inventado | **Pass** | Sin cambios en datos. |
| G3 | Reutilización | **Pass** | `ThemeToggle` es el único componente nuevo y queda en el catálogo; el resto reutiliza tokens y componentes. |
| G4 | Reglas UI | **Pass con enmienda** | El diseño define tokens oscuros y una regla UI nueva; la enmienda de identidad queda documentada. |
| G5 | Estático, indexable, accesible | **Pass** | El contrato usa atributos y CSS; el contenido sigue en HTML; controles nativos con teclado y ARIA. |
| G6 | ARQ y dependencias | **Pass** | Sin dependencias nuevas; `carto-darkmatter` es un estilo integrado de Plotly. |
| G7 | DoD y documentos vivos | **Pass** | `quickstart.md` define la validación; las tareas actualizarán `agents/`. |

## Risks & Mitigations

| Riesgo | Mitigación |
| --- | --- |
| Literales de color olvidados en páginas o componentes. | Auditoría con búsqueda de hex/rgba; checklist por archivo; QA visual de una página representativa por pilar en ambos temas. |
| FOUC o parpadeo al navegar con View Transitions. | Script inline de pre-pintado, re-aplicación en `astro:after-swap` y `astro:page-load`, y prueba con caché deshabilitada. |
| Re-render de gráficos con controles duplicados o listeners repetidos. | Se reconstruyen los slots de cabecera/pie antes de re-render; los listeners globales de `chart-defs` son de nivel de módulo y no se re-ejecutan. |
| Mapas oscuros sin token. | Usar `carto-darkmatter` (integrado, sin token) y fallback a `white-bg` con marco claro si la carga de tiles falla. |
| Contraste insuficiente en oscuro. | Paleta validada con contraste ≥ 4.5:1 para texto y ≥ 3:1 para texto grande/íconos; QA con herramienta de contraste. |
| Shiki dual theme no aplica por especificidad. | Reglas CSS acotadas a `.astro-code` y `.astro-code span` con variables `--shiki-dark*`. |
| Enmienda de gobernanza pendiente. | Registrar la dependencia en `spec.md`/`plan.md`; actualizar `DESIGN-SYSTEM.md` y `PRODUCT.md` en la misma feature; el autor aprueba la enmienda de la constitución con `speckit-constitution`. |

## Definition of Done

- [ ] `npx astro check` sin errores nuevos.
- [ ] `npm run build` exitoso (incluye verificador de enlaces internos).
- [ ] QA visual de ambos temas en: inicio, experiencia, proyectos, Observatorio
      (home y un dashboard), elecciones, calculadoras, blog (índice y post),
      informes y 404.
- [ ] Selector visible y usable en escritorio y móvil, debajo del divisor del
      perfil y antes de los KPIs.
- [ ] Primera visita respeta el sistema; preferencia manual persiste; automático
      reacciona a cambios del sistema.
- [ ] Sin FOUC en carga inicial ni en navegación interna.
- [ ] Gráficos, mapas, bloques de código e imágenes legibles en ambos temas.
- [ ] Teclado, foco visible, `aria-checked`/rol correcto y
      `prefers-reduced-motion` verificados.
- [ ] Sin JavaScript: el tema automático funciona por CSS.
- [ ] `agents/DESIGN-SYSTEM.md`, `agents/PRODUCT.md` y
      `agents/ARCHITECTURE.md` actualizados; catálogo con `ThemeToggle`.
- [ ] Sin dependencias nuevas ni secretos.
