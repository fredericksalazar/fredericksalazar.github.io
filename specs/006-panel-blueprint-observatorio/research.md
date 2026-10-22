# Research: Contenedor reutilizable con estética blueprint y unificación visual de la Home del Observatorio

**Feature**: `006-panel-blueprint-observatorio`  
**Date**: 2026-10-22

## R1 · Nombre y ubicación del componente contenedor reutilizable

- **Decision**: Crear `src/components/observatorio/PanelBlueprint.astro` con una interfaz de props idéntica a `BandaOscura.astro` (`id?: string`, `ariaLabel?: string`, `ariaLabelledby?: string`, `class?: string` y `<slot />`).
- **Rationale**:
  - `BandaOscura.astro` ya establece en `src/components/observatorio/` el patrón para secciones contenedoras con decoración atmosférica (retícula + orbes + contenedor interno con `z-index: 1`).
  - `PanelBlueprint.astro` es su contraparte en modo claro ("blueprint") para agrupar bloques de contenido dentro del contenedor de página (`.observatorio-container`).
  - Cumple la regla **ARQ-19** (Reutilización ante todo) y **UI-11** (todo componente nuevo se registra en el catálogo de `DESIGN-SYSTEM.md`).
- **Alternatives considered**:
  - *Clase utilitaria global en `BaseLayout.astro`*: obligaría a duplicar en cada sección los elementos decorativos internos (`.__grid`, `.__glow`, `.__inner`) en el HTML de cada página. Un componente `.astro` encapsula tanto el DOM decorativo como el CSS con alcance local.
  - *Extender `IndicadorPanel.astro`*: `IndicadorPanel` tiene una estructura rígida de dos slots (`text` y `visual`) más pie de fuente para un único gráfico de dashboard; no sirve para envolver grillas de 8 tarjetas, listados de blog o bloques mixtos de identidad y misión/visión.

## R2 · Tokens y tratamiento visual del contenedor (`PanelBlueprint`) y tarjetas hijas

- **Decision**:
  - Superficie del contenedor `PanelBlueprint`:
    - Fondo: `linear-gradient(180deg, var(--color-sidebar) 0%, #f0f5ff 100%)`
    - Borde: `1px solid rgba(37, 99, 235, 0.18)`
    - Radio: `24px` (nivel XL en escritorio) y `18px` (nivel L en `≤ 768px`), alineado con la sección 2.4 de `DESIGN-SYSTEM.md`.
    - Padding: `2.5rem 2.25rem` en escritorio y `1.5rem 1.25rem` en `≤ 768px`.
    - Sombra: `0 4px 16px rgba(15, 23, 42, 0.04)` (nivel 2 de `DESIGN-SYSTEM.md`).
    - Decoración: retícula de puntos `rgba(37, 99, 235, 0.18)` cada `24px` con máscara elíptica superior derecha + halo radial `var(--color-accent-glow)`.
  - Superficie de las tarjetas hijas dentro de `PanelBlueprint`:
    - `IndicadorClaveCard` (sección 01) y `Card` de blog (sección 02) ya usan `background: var(--color-sidebar)` (`#ffffff`), lo que garantiza contraste limpio sobre el degradado `#ffffff → #f0f5ff`.
    - En la sección 03 (Quiénes somos + Misión y Visión), las tarjetas `.mv-card` pasan a tener `background: var(--color-sidebar)` (`#ffffff`), borde `1px solid var(--color-border)` y sombra sutil nivel 1 en reposo / nivel 3 en hover, de modo que destaquen con nitidez sobre el fondo blueprint del contenedor padre.
- **Rationale**:
  - Si una tarjeta hija tuviera el mismo degradado azul claro que el contenedor padre, perdería separación figura-fondo en la mitad inferior del panel. Al usar `--color-sidebar` (`#ffffff`) en todas las tarjetas hijas, las tres secciones mantienen la misma jerarquía visual de dos capas (lienzo blueprint → tarjetas blancas).
- **Alternatives considered**:
  - *Mantener degradado azul en `.mv-card`*: descartado porque sobre el fondo `#f0f5ff` de `PanelBlueprint` se mimetiza y reduce el contraste del borde inferior.
