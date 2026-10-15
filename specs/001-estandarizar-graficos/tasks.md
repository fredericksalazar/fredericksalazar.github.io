---

description: "Lista de tareas · 001 Estandarizar los gráficos de línea"
---

# Tasks: Estandarizar los gráficos de línea

**Input**: Design documents from `/specs/001-estandarizar-graficos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chart-def.md, quickstart.md

**Tests**: la spec no pide tests automatizados y el proyecto no tiene runner de
TypeScript (research D9). La verificación es `npx astro check`, `npm run build` y
[quickstart.md](./quickstart.md).

**Organization**: tareas agrupadas por historia de usuario (US1 etiquetas, US2
control Línea | Barras, US3 herencia en el blog).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3)

## Path Conventions

Proyecto único: `src/components/observatorio/`, `src/lib/observatorio/`,
`src/lib/observatorio/chart-defs/`, `agents/`.

---

## Phase 1: Setup

**Purpose**: dejar una línea base para comprobar "sin errores nuevos" al final.

- [X] T001 Ejecutar `npx astro check` y `npm run build` en la rama y anotar el número de errores y advertencias actuales en specs/001-estandarizar-graficos/quickstart.md (sección nueva "Línea base", al final)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, funciones puras y control genérico que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia empieza antes de cerrar esta fase.

- [X] T002 En src/lib/observatorio/chart-defs/types.ts: agregar `export type Vista = "linea" | "barras"`; agregar a `ChartDef` el campo opcional `vistas?: readonly Vista[]` ("Si incluye "barras", Chart.astro muestra el control Línea | Barras. La primera vista es la inicial"); agregar la interfaz `ChartContext` con `vista(): Vista`, `render(trazas: unknown[], layout?: Record<string, unknown>): void` y `alCambiarVista(fn: (vista: Vista) => void): void`; cambiar `onMount` a `(target: HTMLElement, ctx: ChartContext) => void`
- [X] T003 En src/lib/observatorio/charts.ts: crear `lineasReferencia(valores, opciones)` según data-model.md: opciones `maximo`, `minimo`, `promedio` (por defecto `true`), `extra: { etiqueta, valor, color?, estilo? }[]`, `formato?: (v) => string`, `sufijo`, `decimales`; ignora `null`; colores Máx `#dc2626`, Promedio `#64748b`, Mín `#16a34a`, trazo discontinuo 1,5 px; las referencias `extra` usan su `color`; **toda anotación con `xref: "paper"`, `x: 0`, `xanchor: "left"`**; texto `Etiqueta · valor` en es-CO; fuente 10 px del color de su línea, fondo `rgba(255,255,255,0.9)`, borde `#cbd5e1` 1 px; **si dos referencias distan menos del 6 % del rango visible del eje Y (`opciones.rangoY` si la receta fija `yaxis.range`; si no, máximo − mínimo de los valores y referencias), emitir una sola anotación combinada `Etiqueta1 · v1 · Etiqueta2 · v2`** y dibujar ambas líneas; devuelve `{ shapes, annotations }`. Exportar además la constante única `META_BANREP: ReferenceLine = { etiqueta: "Meta BanRep", valor: 3, color: "#16a34a", estilo: "punteada" }` (verde semántico de "dentro de meta"; trazo punteado para no confundirla con el Mín, que es verde discontinuo)
- [X] T004 En src/lib/observatorio/charts.ts: crear la función pura `aVista(trazas, vista, layout)` según research D3: en `"barras"`, cada traza scatter con `lines` en `mode` y grosor de línea > 0 pasa a `type: "bar"` conservando `x`, `y`, `name`, `customdata`, `hovertemplate`, `yaxis`, `text`/`textposition` si existen, y con color `marker.color` (si es arreglo) o `line.color`; las trazas con `fill: "tonexty"` o grosor 0 se ocultan (`visible: false`); las barras existentes no cambian; si quedan 2 o más series de barras en el mismo eje y el layout no define `barmode`, usar `barmode: "group"`; en `"linea"` devuelve las trazas y el layout originales; devuelve `{ trazas, layout }`
- [X] T005 En src/components/observatorio/Chart.astro: cuando `def.vistas` incluye `"barras"`, insertar el control segmentado del contrato (contracts/chart-def.md, sección 3) **después** del `headerHtml` de la receta en `[data-chart-header-slot]`; guardar por gráfico la vista actual (inicial `"linea"`) y las últimas trazas y layout recibidos; al hacer clic en un botón, actualizar `is-active` y `aria-pressed` y redibujar con `window.Plotly.react(target, aVista(...))`; construir `ctx` (`vista`, `render`, `alCambiarVista`) y pasarlo a `result.onMount(target, ctx)`; el binding es idempotente (marca `data-bound`) y compatible con `astro:page-load` (ARQ-08); usar los estilos `.chart-toggle` existentes
- [X] T006 Verificar con `npx astro check` que el cambio de firma de `onMount` no rompe ninguna receta (recetas de elecciones y comparativos incluidas)

**Checkpoint**: control y funciones listos; ningún gráfico cambia todavía.

---

## Phase 3: User Story 1 - Etiquetas de referencia que no tapan el dato reciente (Priority: P1) 🎯 MVP

**Goal**: todas las etiquetas de referencia de los gráficos del Observatorio a la izquierda, con el mismo formato, colores unificados y combinación de etiquetas cercanas.

**Independent Test**: quickstart.md, bloque "En todo gráfico con líneas de referencia", en las 6 páginas del Observatorio.

- [X] T007 [US1] En src/lib/observatorio/charts.ts: reescribir `minMaxAvgLines` como envoltorio temporal de `lineasReferencia` (ignora `avgAnchor`; todo a la izquierda) y agregar a `LineBarToggleOpts` la opción `referenciasExtra` que se pasa como `extra` a `lineasReferencia` dentro de `lineBarToggle` (marcar ambas como `@deprecated`; se eliminan en T026)
- [X] T008 [US1] En src/lib/observatorio/chart-defs/inflacion.ts: `inflacion-anual` pasa la meta como `referenciasExtra: [META_BANREP]` y elimina su `baseAnnotations` con `xanchor: "right"` (conserva la banda 2–4 % en `baseShapes`); `inflacion-mensual` usa `lineasReferencia(y, { sufijo: "%", decimales: 2 })`; `pib-inflacion` reemplaza la anotación de meta (`xanchor: "right"`) por `lineasReferencia(..., { maximo: false, minimo: false, promedio: false, extra: [META_BANREP] })` conservando la banda y la anotación de evento "Sobrecalentamiento post-COVID"
- [X] T009 [P] [US1] En src/lib/observatorio/chart-defs/externo.ts: `trm-historica` usa `lineasReferencia(y, { formato: (v) => "$" + Math.round(v).toLocaleString("es-CO") })` y `deuda-externa-pib` usa `lineasReferencia(y, { sufijo: "%", decimales: 1 })`; eliminar `makeMinMaxMeanRefs`, `REF_LINE_COLOR` y `REF_MEAN_COLOR`
- [X] T010 [P] [US1] En src/lib/observatorio/chart-defs/historico.ts: en `buildHistorico`, reemplazar el código manual de promedio y meta por `lineasReferencia(valores, { maximo: false, minimo: false, promedio: opts.promedioOptions?.showLine ?? false, extra: opts.metaBanrep ? [META_BANREP] : [] })` con la etiqueta del promedio "Promedio histórico" (afecta a `inflacion-historica` y `desempleo-historico`); la meta deja de ser roja con texto blanco y pasa al estilo único de `META_BANREP`
- [X] T011 [P] [US1] En src/lib/observatorio/chart-defs/empleo.ts: `desempleo` usa `lineasReferencia(y, { sufijo: "%" })` en lugar de `minMaxAvgLines`
- [X] T012 [P] [US1] En src/lib/observatorio/chart-defs/demografia.ts: `poblacion-crecimiento` y `gini-evolucion` usan `lineasReferencia` (sufijo `%` en el primero, sin sufijo en Gini; en Gini pasar `rangoY: [40, 62]` porque su eje tiene rango fijo); conservar las bandas de color de Gini
- [X] T013 [P] [US1] En src/lib/observatorio/chart-defs/comercio.ts: `comercio-apertura` usa `lineasReferencia(y, { sufijo: "%" })`
- [X] T014 [US1] Validar US1 con quickstart.md (bloque de referencias) en `/observatorio/`, `/observatorio/monetario/`, `/observatorio/pib/`, `/observatorio/empleo/`, `/observatorio/comercio/` y `/observatorio/demografia/`; confirmar que las anotaciones de eventos (Pandemia, COVID, Boom petrolero) no cambiaron (research D7)

**Checkpoint**: US1 completa y verificable por sí sola.

---

## Phase 4: User Story 2 - Cambiar cualquier gráfico de línea a barras (Priority: P2)

**Goal**: los 21 gráficos de línea del Observatorio con el control único Línea | Barras; los controles propios conviven sin llamar a Plotly.

**Independent Test**: quickstart.md, bloque "En cada uno de los 21 gráficos con control".

- [X] T015 [US2] En src/lib/observatorio/chart-defs/inflacion.ts: `inflacion-anual` y `tasa-interes` dejan `lineBarToggle` y devuelven su traza de línea (mismo color, relleno y `lineShape: "hv"` en la tasa) con las referencias de `lineasReferencia` (meta como `extra` en inflación) y declaran `vistas: ["linea", "barras"]`; `inflacion-mensual` elimina el interruptor "Ver en barras", su `headerHtml`, su `onMount` y `barTrace`, conserva `marker.color` por punto (deflación en verde) y declara `vistas`; `freno-acelerador` y `pib-inflacion` declaran `vistas`; `spread` declara `vistas` y su interruptor "Mostrar inflación" llama a `ctx.render(...)` en lugar de `window.Plotly.react`
- [X] T016 [P] [US2] En src/lib/observatorio/chart-defs/externo.ts: `trm-historica` declara `vistas`, elimina el interruptor "Mostrar como barras", `makeTogglesHtml` y `bindTogglableChart`; el interruptor "Color por presidente" se muestra solo en vista de barras (vía `ctx.alCambiarVista`) y aplica los colores con `ctx.render` sobre la traza con `marker.color = colorsByPresident`; `bindPresOnlyChart` (`reservas-internacionales`) usa `ctx.render` en lugar de `window.Plotly.react`; `deuda-externa-pib` y `pass-through-trm-inflacion` declaran `vistas`
- [X] T017 [P] [US2] En src/lib/observatorio/chart-defs/historico.ts: `salario-minimo-variacion` declara `vistas`, elimina el interruptor "Ver como barras" y las 3 llamadas a `window.Plotly.restyle`; el interruptor "Color por presidente" se muestra solo en barras (`ctx.alCambiarVista`) y aplica colores con `ctx.render`
- [X] T018 [P] [US2] En src/lib/observatorio/chart-defs/pib.ts: `pib-poblacion`, `deuda-publica` y `pib-comercio` declaran `vistas: ["linea", "barras"]` (los de doble eje conservan `yaxis` por traza)
- [X] T019 [P] [US2] En src/lib/observatorio/chart-defs/empleo.ts: `desempleo`, `subempleo` y `tgp-to-dual` declaran `vistas: ["linea", "barras"]`
- [X] T020 [P] [US2] En src/lib/observatorio/chart-defs/demografia.ts: `poblacion-crecimiento`, `esperanza-vida` y `gini-evolucion` declaran `vistas: ["linea", "barras"]`
- [X] T021 [P] [US2] En src/lib/observatorio/chart-defs/comercio.ts: `comercio-apertura` y `productos-tradicionales` declaran `vistas: ["linea", "barras"]`
- [X] T022 [US2] Validar US2 con quickstart.md en los 21 gráficos: vista inicial, cambio a barras con mismos valores y referencias, mixtos y doble eje (`spread`, `freno-acelerador` con áreas ocultas, `pib-poblacion`, `pib-comercio`, `pass-through-trm-inflacion`), independencia entre gráficos, teclado y controles propios en ambas vistas

**Checkpoint**: US1 y US2 completas.

---

## Phase 5: User Story 3 - La misma experiencia en el blog (Priority: P3)

**Goal**: los artículos que incrustan gráficos del Observatorio heredan el comportamiento.

**Independent Test**: quickstart.md, sección 3.

- [X] T023 [US3] Verificar en `/blog/inflacion-tasas-interes-colombia-agosto-2026/`, `/blog/inflacion-tasas-interes-colombia-junio-2026/` y `/blog/precio-dolar-colombia-julio-2026/` que `inflacion-anual`, `tasa-interes`, `spread`, `trm-historica` y `pass-through-trm-inflacion` muestran el control y las etiquetas igual que en el Observatorio, también en modo `embedded`
- [X] T024 [US3] Verificar en un artículo "Colombia vs rival" (p. ej. `/blog/colombia-vs-suiza-en-datos/`) que los comparativos no cambiaron (fuera de alcance, FR-010)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 Confirmar que la búsqueda de quickstart.md (sección 1) devuelve cero resultados en inflacion, externo, historico, pib, empleo, demografia y comercio
- [X] T026 En src/lib/observatorio/charts.ts: eliminar `lineBarToggle`, `LineBarToggleOpts` y `minMaxAvgLines` tras confirmar con `grep -rn "lineBarToggle\|minMaxAvgLines" src/` que no quedan usos
- [X] T027 [P] En agents/DESIGN-SYSTEM.md: actualizar la sección 6.2 (el control se activa con `vistas: ["linea", "barras"]` en el `ChartDef` y lo dibuja `Chart.astro`; las recetas usan `ctx.render`, nunca `Plotly.react`) y la sección 6.4 (las referencias se generan con `lineasReferencia()`, incluida la combinación de etiquetas cercanas sobre el rango visible del eje Y; la meta del BanRep es la constante única `META_BANREP`: verde `#16a34a`, punteada) y la tabla de colores semánticos de la sección 6.3 (agregar "Meta BanRep: `#16a34a`, línea punteada"); registrar en la sección 6.2 la excepción conocida de los comparativos del blog
- [X] T028 Ejecutar `npx astro check` y `npm run build` y comparar con la línea base de T001: cero errores nuevos
- [X] T029 Recorrido final de quickstart.md completo, incluida la vista móvil de 375 px
- [X] T030 Informar al autor qué cambió, qué se verificó y qué quedó pendiente (constitución, principio VI); sin operaciones git

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; **bloquea** todas las historias. T003 y T004 tocan el mismo archivo: van en secuencia. T005 depende de T002–T004.
- **US1 (Phase 3)**: depende de Foundational. T007 antes de T008.
- **US2 (Phase 4)**: depende de Foundational y, por archivo, de su tarea de US1 (T015 después de T008; T016 después de T009; T017 después de T010; T019 después de T011; T020 después de T012; T021 después de T013).
- **US3 (Phase 5)**: depende de US1 y US2 (solo verifica).
- **Polish (Phase 6)**: depende de todas las historias. T026 después de T015.

### Parallel Opportunities

- **US1:** T009, T010, T011, T012 y T013 en paralelo (archivos distintos), mientras T007 → T008 avanzan en secuencia.
- **US2:** T016, T017, T018, T019, T020 y T021 en paralelo; T015 en paralelo con ellos una vez hecha T008.
- **Polish:** T027 en paralelo con T025/T026.

### Parallel Example: User Story 1

```text
T007 (charts.ts) → T008 (inflacion.ts)
En paralelo: T009 externo.ts · T010 historico.ts · T011 empleo.ts · T012 demografia.ts · T013 comercio.ts
```

### Parallel Example: User Story 2

```text
En paralelo: T015 inflacion.ts · T016 externo.ts · T017 historico.ts · T018 pib.ts · T019 empleo.ts · T020 demografia.ts · T021 comercio.ts
```

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1 y Phase 2.
2. Phase 3 (US1): etiquetas a la izquierda en todo el Observatorio.
3. **Parar y validar** con T014. Es el cambio de mayor visibilidad y menor riesgo.

### Entrega incremental

1. Setup + Foundational → base lista.
2. US1 → validar → el autor revisa.
3. US2 → validar → el autor revisa.
4. US3 → verificar blog.
5. Polish → limpieza, documentación y verificación final.

El autor hace los commits y el PR en cada punto de control (constitución, principio VI).
