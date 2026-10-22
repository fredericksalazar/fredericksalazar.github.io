# Data Model: Contenedor reutilizable con estética blueprint y unificación visual de la Home del Observatorio

**Feature**: `006-panel-blueprint-observatorio`  
**Date**: 2026-10-22

Esta feature es de interfaz y composición visual; no modifica contratos JSON en `public/data/*.json` ni agrega nuevos datasets al pipeline.

## Entidades de interfaz (Props de componentes)

### 1. `PanelBlueprintProps` (`src/components/observatorio/PanelBlueprint.astro`)

| Prop | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | No | Identificador HTML para anclas o referencias accesibles |
| `ariaLabel` | `string` | No | Etiqueta accesible directa del `<section>` |
| `ariaLabelledby` | `string` | No | ID del encabezado (`h2`/`p`) que nombra la sección |
| `class` | `string` | No | Clases CSS adicionales para espaciado externo |

**Reglas de validación:**
- Toda instancia en `/observatorio/` DEBE incluir `ariaLabel` o `ariaLabelledby` para que los lectores de pantalla identifiquen cada región temática (`<section>`).
- Los elementos decorativos internos (`.__grid` y `.__glow`) DEBEN llevar `aria-hidden="true"` y `pointer-events: none`.
