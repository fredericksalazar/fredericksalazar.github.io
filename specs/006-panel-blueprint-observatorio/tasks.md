---
description: "Task list for feature 006-panel-blueprint-observatorio"
---

# Tasks: Contenedor reutilizable con estética blueprint y unificación visual de la Home del Observatorio

**Input**: Design documents from `/specs/006-panel-blueprint-observatorio/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No se solicitaron tests automatizados nuevos; la verificación se realiza mediante `npx astro check`, `npm run build` y los pasos de `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar estado base antes de crear el nuevo componente reutilizable.

- [x] T001 Verificar que el entorno actual compila sin errores de tipos ejecutando `ASTRO_TELEMETRY_DISABLED=1 npx astro check` sobre `src/pages/observatorio/index.astro`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Creación del componente base `PanelBlueprint.astro` que requieren las historias de usuario.

**⚠️ CRITICAL**: Ninguna historia de usuario puede completarse antes de que el componente reutilizable exista.

- [x] T002 Crear el componente reutilizable `src/components/observatorio/PanelBlueprint.astro` con las props opcionales `id?: string`, `ariaLabel?: string`, `ariaLabelledby?: string`, `class?: string`, los elementos decorativos `.panel-blueprint__grid` y `.panel-blueprint__glow` con `aria-hidden="true"` y `pointer-events: none`, y los tokens visuales del contrato (`border-radius: 24px` en escritorio y `18px` en `≤ 768px`, `padding: 2.5rem 2.25rem` en escritorio y `1.5rem 1.25rem` en `≤ 768px`, fondo `linear-gradient(180deg, var(--color-sidebar) 0%, #f0f5ff 100%)`, borde `1px solid rgba(37, 99, 235, 0.18)` y sombra `0 4px 16px rgba(15, 23, 42, 0.04)`)

**Checkpoint**: `PanelBlueprint.astro` listo para ser usado en páginas y documentado en el catálogo.

---

## Phase 3: User Story 1 - Lectura estructurada de la portada en contenedores blueprint unificados (Priority: P1) 🎯 MVP

**Goal**: Aplicar `PanelBlueprint.astro` a las tres secciones principales de `/observatorio/` (01 Indicadores clave, 02 Últimas publicaciones, 03 Quiénes somos + Misión/Visión) manteniendo contraste limpio en todas las tarjetas hijas.

**Independent Test**: Abrir `/observatorio/` y verificar que las secciones 01, 02 y 03 renderizan con `<PanelBlueprint>`, con divisor de cabecera sutil y tarjetas internas blancas (`--color-sidebar`) bien diferenciadas.

### Implementation for User Story 1

- [x] T003 [US1] Importar `PanelBlueprint` y envolver la sección **01 · Indicadores clave ("Cómo va Colombia")** con `<PanelBlueprint class="home-panel" ariaLabelledby="panel-clave-titulo">` y cabecera `.seccion-head` con divisor inferior en `src/pages/observatorio/index.astro`
- [x] T004 [US1] Reemplazar el contenedor ad-hoc `.recientes-zona` de la sección **02 · Últimas publicaciones** por `<PanelBlueprint class="home-panel" ariaLabelledby="recientes-titulo">` en `src/pages/observatorio/index.astro`
- [x] T005 [US1] Reemplazar el contenedor `.identidad` de la sección **03 · Quiénes somos + Misión y Visión** por `<PanelBlueprint class="home-panel" ariaLabelledby="quienes-somos-titulo">`, actualizar las tarjetas `.mv-card` a superficie blanca sólida (`background: var(--color-sidebar)`) y eliminar los estilos duplicados de retícula/halo en `src/pages/observatorio/index.astro`

**Checkpoint**: Las tres secciones de `/observatorio/` comparten el contenedor `PanelBlueprint` sin estilos duplicados en la página.

---

## Phase 4: User Story 2 - Reutilización del contenedor blueprint como pieza única del sistema de diseño (Priority: P2)

**Goal**: Registrar `PanelBlueprint` en el catálogo de componentes reutilizables del sistema de diseño y en la arquitectura del módulo Observatorio (cumpliendo `ARQ-19` y `UI-11`).

**Independent Test**: Revisar `agents/DESIGN-SYSTEM.md` y `src/lib/observatorio/ARCHITECTURE.md` y confirmar que `PanelBlueprint` aparece documentado en el catálogo y en la estructura de la portada.

### Implementation for User Story 2

- [x] T006 [P] [US2] Actualizar la sección 5.5 (Portada del Observatorio) y la sección 8 (Catálogo de componentes reutilizables) para documentar `PanelBlueprint` en `agents/DESIGN-SYSTEM.md`
- [x] T007 [P] [US2] Registrar `PanelBlueprint.astro` dentro del árbol de archivos de `src/components/observatorio/` en `src/lib/observatorio/ARCHITECTURE.md`

**Checkpoint**: Documentación viva sincronizada con el catálogo de componentes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verificación integral según la definición de terminado (Constitución, principio VI).

- [x] T008 Ejecutar las validaciones de `specs/006-panel-blueprint-observatorio/quickstart.md` (`npx astro check`, `npm run build` con link-checker y conteo de instancias de `<PanelBlueprint` en `src/pages/observatorio/index.astro`)

---

## Phase 6: Secciones 04 (Qué hacemos) y 05 (Cómo funciona · Mapa Blueprint Animado)

**Goal**: Incorporar en `/observatorio/` la sección **04 · Qué hacemos** y la sección **05 · Cómo funciona** con un mapa arquitectónico blueprint animado (`PipelineBlueprint.astro`) que muestre el flujo en vivo desde las fuentes oficiales a través de las 6 etapas del pipeline hasta el dashboard.

- [x] T009 [US2] Crear el componente reutilizable `src/components/observatorio/PipelineBlueprint.astro` con diagrama arquitectónico SVG + HTML blueprint animado (nodos de fuentes oficiales → cables bezier con paquetes de datos animados → bus de las 6 fases del pipeline con telemetría activa → nodo de salida del Dashboard interactivo) y soporte completo para `prefers-reduced-motion: reduce` y móvil
- [x] T010 [US2] Integrar las secciones **04 · Qué hacemos ("Seis capacidades, una infraestructura")** y **05 · Cómo funciona ("Del dato disperso al indicador histórico")** dentro de `<PanelBlueprint>` en `src/pages/observatorio/index.astro`
- [x] T011 [P] [US3] Actualizar `agents/DESIGN-SYSTEM.md` y `src/lib/observatorio/ARCHITECTURE.md` con `PipelineBlueprint` y las secciones 04 y 05 de la Home, y verificar con `npx astro check` y `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Inmediata.
- **Foundational (Phase 2)**: Depende de Phase 1 — bloquea US1 y US2.
- **User Story 1 (Phase 3)**: Depende de T002 (`PanelBlueprint.astro`).
- **User Story 2 (Phase 4)**: Depende de T002 (`PanelBlueprint.astro`); T006 y T007 pueden ejecutarse en paralelo (`[P]`).
- **Polish (Phase 5)**: Depende de completar Phase 3 y Phase 4.

### Parallel Opportunities

- `T006` (`agents/DESIGN-SYSTEM.md`) y `T007` (`src/lib/observatorio/ARCHITECTURE.md`) tocan archivos distintos y pueden ejecutarse en paralelo.

---

## Parallel Example: User Story 2

```bash
Task: "T006 [P] [US2] Actualizar la sección 5.5 y la sección 8 en agents/DESIGN-SYSTEM.md"
Task: "T007 [P] [US2] Registrar PanelBlueprint.astro en src/lib/observatorio/ARCHITECTURE.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2 (`T001`–`T002`).
2. Completar Phase 3 (`T003`–`T005`) aplicando `PanelBlueprint` en las tres secciones de `/observatorio/`.
3. Validar visualmente y con `astro check`.

### Incremental Delivery

1. `PanelBlueprint.astro` creado (Foundational).
2. Unificación visual de las 3 secciones en `src/pages/observatorio/index.astro` (US1).
3. Actualización del catálogo en `agents/DESIGN-SYSTEM.md` y `src/lib/observatorio/ARCHITECTURE.md` (US2).
4. Verificación final de build y enlaces (Polish).
