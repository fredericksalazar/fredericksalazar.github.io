# Implementation Plan: Estandarizar los gráficos de línea

**Branch**: `feature/001-estandarizar-graficos` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-estandarizar-graficos/spec.md`

## Summary

Unificar la experiencia de los 38 gráficos del Observatorio:

1. **Un solo control Línea | Barras**, dibujado y gestionado por `Chart.astro`,
   que se activa declarando `vistas: ["linea", "barras"]` en la receta. Se aplica
   a los 21 gráficos con series de línea (incluidos mixtos y de doble eje) y
   reemplaza los 5 mecanismos actuales.
2. **Un solo generador de líneas de referencia**, `lineasReferencia()`, con todas
   las etiquetas a la izquierda, formato `Etiqueta · valor`, colores de la sección
   6.4 de DESIGN-SYSTEM, metas con su color semántico y combinación de etiquetas
   cercanas. Reemplaza los 3 generadores actuales.

Una conversión genérica de trazas (`aVista`) y un contexto de render (`ctx`)
permiten que las recetas con controles propios convivan con el nuevo control sin
llamar a Plotly directamente. Detalle en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) sobre Astro 6.4

**Primary Dependencies**: Plotly.js 2.35.2 (CDN, ya existente). Sin dependencias nuevas.

**Storage**: N/A (no cambian los datasets JSON)

**Testing**: `npx astro check`, `npm run build` y validación manual guiada
([quickstart.md](./quickstart.md)). No hay runner de tests de TypeScript; las
funciones nuevas son puras para poder testearlas en el futuro.

**Target Platform**: navegadores modernos de escritorio y móvil (sitio estático en GitHub Pages)

**Project Type**: sitio web estático (Astro SSG) con gráficos interactivos en el cliente

**Performance Goals**: el cambio de vista responde de inmediato (un `Plotly.react`
sobre datos ya cargados, sin nuevas descargas)

**Constraints**: no cambiar datos, colores de series ni textos; compatibilidad
con View Transitions (ARQ-08); sin dependencias nuevas (ARQ-12)

**Scale/Scope**: 38 gráficos en 6 páginas del Observatorio (21 con control);
6 archivos de recetas, `charts.ts`, `types.ts`, `Chart.astro`; los artículos del
blog que incrustan esos gráficos heredan el cambio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Antes del diseño | Después del diseño |
|---|---|---|---|
| G1 | Objetivo, pilar y KPI de PRODUCT | ✅ O1 Autoridad · Observatorio y Blog · KPI de autoridad (spec, "Contexto de producto") | ✅ Sin cambios |
| G2 | Datos desde pipelines, nada inventado | ✅ No se tocan datos | ✅ Las referencias se calculan de las mismas series; la meta del BanRep (3 %) ya existía |
| G3 | Reutilización en vez de duplicar | ✅ Objetivo central de la feature | ✅ 5 controles → 1 (D1); 3 generadores de referencias → 1 (D5); 8 llamadas directas a Plotly en las recetas del Observatorio → 0 (D4; las de elecciones quedan fuera de alcance) |
| G4 | Reglas UI | ✅ Implementa UI-08 y UI-10 | ✅ Control segmentado existente (6.2); colores 6.4; card sin cambios. Comparativos del blog: ver Complexity Tracking |
| G5 | Estático, HTML de valor, accesible | ✅ Solo cliente sobre datos ya cargados | ✅ Control con `role="group"` y `aria-pressed` (D8) |
| G6 | Reglas ARQ, sin dependencias nuevas | ✅ | ✅ ARQ-07 (Chart + ChartDef), ARQ-08 (idempotente en `astro:page-load`), ARQ-12 (cero dependencias), ARQ-19 |
| G7 | Definición de terminado y docs de `agents/` | ✅ | ✅ Tareas incluirán astro check, build, quickstart y actualizar DESIGN-SYSTEM 6.2/6.4 (API `vistas` y `lineasReferencia`) |

**Resultado:** todas las compuertas pasan. Una excepción registrada (abajo).

## Project Structure

### Documentation (this feature)

```text
specs/001-estandarizar-graficos/
├── spec.md              # Especificación (specify + clarify)
├── plan.md              # Este archivo
├── research.md          # Inventario y decisiones D1–D9
├── data-model.md        # ChartDef.vistas, ChartContext, ReferenceLine
├── quickstart.md        # Guía de validación
├── contracts/
│   └── chart-def.md     # Contrato receta ↔ Chart.astro
├── checklists/
│   └── requirements.md  # Calidad de la spec
└── tasks.md             # (lo crea /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/observatorio/
│   └── Chart.astro                  # Control Línea|Barras, estado de vista, ctx (D1, D4, D8)
└── lib/observatorio/
    ├── charts.ts                    # + aVista(), + lineasReferencia(); − lineBarToggle, − minMaxAvgLines (D3, D5)
    └── chart-defs/
        ├── types.ts                 # + ChartDef.vistas, + ChartContext, onMount(target, ctx)
        ├── inflacion.ts             # 6 gráficos: vistas, referencias, metas a la izquierda, spread con ctx
        ├── externo.ts               # trm/deuda/pass-through; − makeMinMaxMeanRefs, − bindTogglableChart
        ├── historico.ts             # salario-minimo-variacion con ctx; referencias de buildHistorico unificadas
        ├── pib.ts                   # pib-poblacion, deuda-publica, pib-comercio
        ├── empleo.ts                # desempleo, subempleo, tgp-to-dual
        ├── demografia.ts            # poblacion-crecimiento, esperanza-vida, gini-evolucion
        └── comercio.ts              # comercio-apertura, productos-tradicionales

agents/
└── DESIGN-SYSTEM.md                 # Secciones 6.2 y 6.4: API `vistas` y `lineasReferencia`
```

**Structure Decision**: proyecto único existente. Los cambios se concentran en la
capa de gráficos del Observatorio (`components/observatorio/Chart.astro` y
`lib/observatorio/`), siguiendo el patrón `ChartDef` + `Chart.astro` de ARQ-07.
Ninguna página `.astro` del Observatorio ni del blog necesita cambios.

**Orden sugerido** (para `/speckit-tasks`):
1. Fundaciones: `types.ts`, `aVista()` y `lineasReferencia()` en `charts.ts`, control y `ctx` en `Chart.astro`.
2. Historia 1 (P1): migrar las referencias de las 6 recetas y eliminar los generadores duplicados.
3. Historia 2 (P2): declarar `vistas` en los 21 gráficos y migrar los 4 con controles propios a `ctx`.
4. Historia 3 (P3): verificar la herencia en el blog.
5. Cierre: eliminar `lineBarToggle`/`minMaxAvgLines`, actualizar DESIGN-SYSTEM, quickstart completo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Los comparativos "Colombia vs rival" (blog) siguen sin control y con promedio a la derecha (UI-08, UI-10) | Decisión de alcance del autor (aclaración Q1 de la spec, 2026-10-14) | Incluirlos ampliaba el alcance más allá de lo aprobado; quedan para una feature posterior. **Aprobado por el autor.** |
