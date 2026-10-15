# Implementation Plan: Refinamiento gráfico del Observatorio

**Branch**: `feature/ui-refinement` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-refinamiento-graficos-observatorio/spec.md`

## Summary

Tres refinamientos de los gráficos del Observatorio (y del blog que los incrusta):

1. **Líneas estadísticas** (máx, mín, promedio) en cinco gráficos: Empleo 01,
   Comercio Exterior 01–03 y PIB 04, y un **nuevo estilo gris neutro** para
   todas las líneas de máx/mín/promedio del sitio.
2. **Color por presidente apagado al cargar** en todos los gráficos, unificando
   las dos implementaciones actuales del interruptor en `color-presidente.ts`.
3. **Interruptor "Ver en barras"** en lugar del control segmentado Línea | Barras,
   con el mismo estilo que "Color por presidente".

Enfoque: cambios en las piezas únicas que ya existen (`lineasReferencia()`,
`Chart.astro`, `color-presidente.ts`, `buildHistorico()`), sin datos ni
dependencias nuevas. Detalle en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript estricto (Astro 6, SSG); CSS global en `Chart.astro`

**Primary Dependencies**: Plotly por CDN (existente). Sin dependencias nuevas.

**Storage**: N/A (lee `public/data/*.json` sin cambiar su contrato)

**Testing**: `npx astro check`, `npm run build` (incluye verificador de enlaces) y revisión visual con `npm run dev` según [quickstart.md](./quickstart.md). No hay tests unitarios de front en el repo.

**Target Platform**: navegadores modernos, escritorio y móvil (GitHub Pages)

**Project Type**: sitio web estático

**Performance Goals**: sin regresión; el interruptor redibuja con `Plotly.react` como hoy

**Constraints**: estático (ARQ-01), tokens de DESIGN-SYSTEM (UI-01), una sola implementación por control (ARQ-19), accesibilidad (UI-12)

**Scale/Scope**: ~10 gráficos con "Color por presidente", ~20 con `vistas`, ~10 con líneas de referencia; 5 gráficos ganan líneas estadísticas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Resultado | Evidencia |
|---|---|---|---|
| G1 | Objetivo, pilar y KPI declarados | ✅ | Spec: O1 Autoridad; pilares Observatorio y Blog; KPI K5 (autoridad); PRD-04 |
| G2 | Datos de pipeline, nada inventado | ✅ | Sin datos nuevos; máx/mín/promedio se calculan de la serie publicada. Esperanza de vida excluida para no inventar una serie total |
| G3 | Reutilización | ✅ | Se elimina una implementación duplicada del interruptor de presidente; el interruptor de vista reutiliza el estilo `.pres-toggle`; las líneas salen de `lineasReferencia()` |
| G4 | Reglas UI-NN, color consultado | ✅ | UI-08 se redefine (interruptor) y se documenta; UI-10 se mantiene; color de líneas consultado al autor (gris `#64748b`, token existente) |
| G5 | Estático, accesible | ✅ | Sin backend; interruptores nativos con `role="switch"` y `aria-label` |
| G6 | ARQ-NN, sin dependencias | ✅ | Sin dependencias; recetas siguen sin llamar a `Plotly.*` (se elimina el único `restyle` fuera de recetas) |
| G7 | Tareas con definición de terminado y `agents/` | ✅ (a verificar en `tasks.md`) | Docs a actualizar: DESIGN-SYSTEM 6.1, 6.2, 6.4 y UI-08; `src/lib/observatorio/ARCHITECTURE.md` (historico.ts) |

**Re-check post-diseño:** sin cambios; ninguna violación. *Complexity Tracking* vacío.

## Project Structure

### Documentation (this feature)

```text
specs/002-refinamiento-graficos-observatorio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chart-controls.md
├── checklists/
│   └── requirements.md
└── tasks.md             # speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/observatorio/
│   └── Chart.astro                     # interruptor de vista; quita bindPresidenteToggle y la regla móvil
└── lib/observatorio/
    ├── charts.ts                       # REF_COLORS gris; promedio punteado
    ├── ARCHITECTURE.md                 # doc del módulo
    └── chart-defs/
        ├── color-presidente.ts         # role="switch" + aria-label
        ├── historico.ts                # usa color-presidente.ts; `referencias`; textos
        ├── comercio.ts                 # balanza: líneas estadísticas
        ├── pib.ts                      # deuda pública: líneas estadísticas
        ├── externo.ts                  # solo textos si aplica
        └── inflacion.ts                # "Mostrar inflación": aria-label/role
src/pages/observatorio/*.astro          # revisar leads que asumen color encendido
agents/DESIGN-SYSTEM.md                 # 6.1 (diagrama), 6.2, 6.4, UI-08
```

**Structure Decision**: proyecto único Astro; todos los cambios viven en el
módulo Observatorio y sus documentos. El blog hereda los cambios por `<Chart id>`.

## Orden de implementación sugerido

1. `charts.ts` (gris) — afecta todo, cambio mínimo, se valida rápido.
2. Líneas en las 5 recetas (`historico.ts` `referencias`, balanza, deuda).
3. Unificar "Color por presidente" (`historico.ts` → `color-presidente.ts`;
   quitar `bindPresidenteToggle` de `Chart.astro`) + textos.
4. Interruptor de vista en `Chart.astro` + accesibilidad + móvil.
5. Documentación de `agents/` y del módulo; quickstart completo.

## Riesgos

- **Unificación del interruptor (paso 3):** `historico.ts` pasa de `restyle` a
  `ctx.render`; verificar que el tooltip y la leyenda siguen iguales en los 7
  gráficos históricos.
- **Etiquetas en la deuda pública:** máx (91,2 %) coincide con la anotación
  "Pandemia"; están en lados opuestos (izquierda vs. 2020), verificar visualmente.
- **Cabecera en móvil:** con textos visibles, las cards con dos o tres
  interruptores envuelven a dos líneas; verificar a 375 px.

## Complexity Tracking

Sin violaciones.
