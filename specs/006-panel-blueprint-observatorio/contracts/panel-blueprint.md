# UI Contract: `PanelBlueprint.astro` y secciones de `/observatorio/`

**Feature**: `006-panel-blueprint-observatorio`  
**Date**: 2026-10-22

## 1. Contrato del componente `PanelBlueprint.astro`

Ubicación: `src/components/observatorio/PanelBlueprint.astro`

### Estructura DOM emitida

```html
<section
  class="panel-blueprint {class}"
  id={id}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledby}
>
  <div class="panel-blueprint__grid" aria-hidden="true"></div>
  <div class="panel-blueprint__glow" aria-hidden="true"></div>
  <div class="panel-blueprint__inner">
    <slot />
  </div>
</section>
```

### Especificación visual (tokens)

- **Contenedor (`.panel-blueprint`)**:
  - `position: relative; overflow: hidden;`
  - `padding: 2.5rem 2.25rem;` (`1.5rem 1.25rem` en `≤ 768px`)
  - `background: linear-gradient(180deg, var(--color-sidebar) 0%, #f0f5ff 100%);`
  - `border: 1px solid rgba(37, 99, 235, 0.18);`
  - `border-radius: 24px;` (`18px` en `≤ 768px`)
  - `box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);`
- **Retícula (`.panel-blueprint__grid`)**:
  - `radial-gradient(circle, rgba(37, 99, 235, 0.18) 1px, transparent 1px)` cada `24px × 24px`
  - Máscara elíptica suave centrada en la esquina superior derecha (`85% 15%`)
- **Halo (`.panel-blueprint__glow`)**:
  - Orbe de `360px × 360px` en `top: -120px; right: -80px` con `var(--color-accent-glow)`

## 2. Contrato de composición en `src/pages/observatorio/index.astro`

Dentro de `.observatorio-container`, las tres secciones principales se envuelven en `<PanelBlueprint>`:

1. **Sección 01 · Indicadores clave (`ariaLabelledby="panel-clave-titulo"`)**
   - Cabecera `.seccion-head` con divisor inferior sutil (`border-bottom: 1px solid rgba(37, 99, 235, 0.12)`), índice `01`, eyebrow `"Indicadores clave"`, `h2` `"Cómo va Colombia"` y badge en vivo `"Actualizado · {fecha}"`.
   - Grilla `.panel-clave__grilla` (4 columnas en escritorio, 2 en `≤ 1024px`, 1 en `≤ 640px`) con las 8 tarjetas `<IndicadorClaveCard />`.
2. **Sección 02 · Últimas publicaciones (`ariaLabelledby="recientes-titulo"`)**
   - Cabecera `.seccion-head` con divisor inferior sutil, índice `02`, eyebrow `"Análisis e informes"`, `h2` `"Últimas publicaciones"`, subtítulo y botones `"Ver informes"` + `"Ir al blog"`.
   - Grilla `.recientes` (4 columnas en escritorio, 2 en `≤ 1024px`, 1 en `≤ 640px`) con las 4 tarjetas `<Card variant="blog" />`.
3. **Sección 03 · Quiénes somos + Misión y Visión (`ariaLabelledby="quienes-somos-titulo"`)**
   - Bloque superior `.quienes-grid` a dos columnas con índice `03`, eyebrow `"Quiénes somos"`, titular y texto descriptivo con enlace a `/observatorio/acerca/#creador`, separado por un divisor inferior sutil (`border-bottom: 1px solid rgba(37, 99, 235, 0.12)`).
   - Bloque inferior `.mision-vision` (2 columnas en escritorio, 1 en `≤ 768px`) con las dos tarjetas blancas `.mv-card` ("Nuestra misión" y "Nuestra visión").
