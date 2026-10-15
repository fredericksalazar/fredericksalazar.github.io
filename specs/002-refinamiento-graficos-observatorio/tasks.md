---

description: "Tareas de implementación · Refinamiento gráfico del Observatorio"
---

# Tasks: Refinamiento gráfico del Observatorio

**Input**: Documentos de diseño en `specs/002-refinamiento-graficos-observatorio/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chart-controls.md, quickstart.md

**Tests**: la spec no pide tests automatizados; la verificación es `npx astro check`, `npm run build` y la revisión visual de [quickstart.md](./quickstart.md).

**Organization**: tareas agrupadas por historia de usuario (US1 = líneas estadísticas, US2 = color por presidente apagado, US3 = interruptor "Ver en barras").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3)

---

## Phase 1: Setup (línea base)

**Purpose**: registrar el estado actual para poder afirmar "sin errores nuevos".

- [X] T001 Ejecutar `npx astro check` y `npm run build` desde la raíz del repo y anotar al final de este archivo (sección "Notas de implementación") el número de errores/advertencias previos
- [X] T002 [P] Ejecutar `grep -rn "Coloread\|color por presidente" src/lib/observatorio/chart-defs src/pages/observatorio` y anotar en "Notas de implementación" la lista de textos a revisar en T014

---

## Phase 2: Foundational

No hay prerrequisitos bloqueantes: cada historia toca piezas propias. Solo hay
dependencias de archivo entre historias (ver "Dependencies").

---

## Phase 3: User Story 1 - Ver máximo, mínimo y promedio en los gráficos clave (Priority: P1) 🎯 MVP

**Goal**: los 5 gráficos objetivo muestran máx/mín/promedio, y todas las líneas de máx/mín/promedio del sitio pasan a gris neutro.

**Independent Test**: filas 1–5 de quickstart.md: Empleo 01, Comercio 01–03 y PIB 04 con tres líneas grises a la izquierda; Demografía 03 sin líneas; inflación con meta BanRep verde punteada.

- [X] T003 [US1] En `src/lib/observatorio/charts.ts`, cambiar `REF_COLORS` para que máximo, mínimo y promedio usen `#64748b`, y que la referencia de promedio se genere con `estilo: "punteada"` (`dash: "dot"`) mientras máximo y mínimo siguen `"discontinua"` (`dash: "dash"`); no modificar `META_BANREP` (verde `#16a34a`, punteada) ni `REF_TEXTO_COMBINADO`; cambiar la etiqueta del promedio de "Promedio" a "Prom" y eliminar la opción `etiquetaPromedio` de `LineasReferenciaOpts` (las etiquetas son exactamente "Máx", "Mín", "Prom"); actualizar los comentarios de `REF_COLORS` y `ReferenceLine.etiqueta` ("DESIGN-SYSTEM 6.4: gris neutro; se distinguen por etiqueta y trazo")
- [X] T004 [US1] En `src/lib/observatorio/chart-defs/historico.ts`, reemplazar la opción `promedioOptions?: { showLine: boolean }` de `HistoricoOptions` por `referencias?: { maximo?: boolean; minimo?: boolean; promedio?: boolean }` (todo `false` por defecto) y pasarla a `lineasReferencia(valores, { maximo, minimo, promedio, sufijo, decimales: 2, extra })` (sin `etiquetaPromedio`: la etiqueta pasa a "Prom"); en `inflacionHistorica` usar `referencias: { promedio: true }`
- [X] T005 [US1] En `src/lib/observatorio/chart-defs/historico.ts`, activar `referencias: { maximo: true, minimo: true, promedio: true }` en `desempleoHistorico` (`desempleo-historico`), `comercioHistorico` (`comercio-historico`) e `importacionesHistorica` (`comercio-impo`)
- [X] T006 [P] [US1] En `src/lib/observatorio/chart-defs/comercio.ts` (`balanzaComercial`), calcular `lineasReferencia(y, { sufijo: "%", decimales: 2 })` y fusionar: `shapes: [lineaCero, ...ref.shapes]`, `annotations: ref.annotations`; conservar la línea de cero (`#1f2328`, sólida) y los colores verde/rojo de las barras
- [X] T007 [P] [US1] En `src/lib/observatorio/chart-defs/pib.ts` (`deudaPublica`), calcular `lineasReferencia(y, { sufijo: "%", decimales: 1, rangoY: [0, 100] })` y fusionar: `shapes: [...bandas, ...ref.shapes]`, `annotations: [anotacionPandemia, ...ref.annotations]`; no cambiar bandas, rango ni la anotación "Pandemia"
- [X] T008 [US1] Revisión visual con `npm run dev` de las filas 1–5 de `specs/002-refinamiento-graficos-observatorio/quickstart.md` (incluye cambiar a barras en deuda pública y comprobar que las líneas siguen; en deuda pública, comprobar que la etiqueta "Máx · 91,2 %" y la anotación "Pandemia" no se tapan; etiquetas "Máx"/"Mín"/"Prom" en todos)

**Checkpoint**: US1 completa y verificable sola.

---

## Phase 4: User Story 2 - Color por presidente apagado al cargar (Priority: P2)

**Goal**: todo gráfico con "Color por presidente" carga en color por defecto, interruptor apagado y leyenda oculta, con una sola implementación del interruptor.

**Independent Test**: filas 6 y 10 de quickstart.md sobre el inventario de research.md R3 (10 gráficos).

- [X] T009 [P] [US2] En `src/lib/observatorio/chart-defs/color-presidente.ts` (`presToggleHtml`), agregar al input `role="switch"` y `aria-label="Color por presidente"`; el input NUNCA lleva `checked`
- [X] T010 [US2] En `src/lib/observatorio/chart-defs/historico.ts`, eliminar `renderToggle()`, `renderLegend()`, la opción `defaultOn` y el `onMount` que escribe `data-colors-by-president`/`data-color-base`; en `buildHistorico` crear `traza(conPresidente)` (la traza de barras actual con `marker.color` = `colorsPorPresidente` o `COLOR_BASE`) y devolver `traces: [traza(false)]`, `headerHtml: presToggleHtml(chartId)`, `footerHtml: presLeyendaHtml(chartId, leyenda)`, `onMount: (target, ctx) => bindColorPresidente({ target, ctx, prefix: chartId, traza })`; con `presidenteToggle: false` no devolver header/footer/onMount; quitar `defaultOn: false` de todas las recetas del archivo (depende de T004–T005)
- [X] T011 [US2] En `src/components/observatorio/Chart.astro`, eliminar la función `bindPresidenteToggle()` y su llamada (`if (headerSlot?.querySelector("[data-pres-toggle]")) …`) (depende de T010)
- [X] T012 [US2] En `src/lib/observatorio/chart-defs/historico.ts`, reescribir `pregunta` y `ariaLabel` de `inflacion-historica`, `pib-historico`, `pib-percapita`, `desempleo-historico`, `comercio-historico`, `comercio-impo` y `salario-minimo-historico` para que no afirmen que el gráfico carga coloreado (p. ej. "… Activa «Color por presidente» para ver quién gobernaba cada año." / ariaLabel "… con opción de color por presidente"); en `poblacion-historica` (sin interruptor) quitar la mención a presidentes
- [X] T013 [P] [US2] Revisar `pregunta`/`ariaLabel` de `trm-historica` y `reservas-internacionales` en `src/lib/observatorio/chart-defs/externo.ts` y corregir cualquier texto que asuma el color encendido
- [X] T014 [P] [US2] Revisar con la lista de T002 los `lead`/textos de `src/pages/observatorio/*.astro` y corregir los que afirmen que el gráfico ya se ve coloreado ("Activa el color por presidente…" es correcto y se deja)
- [X] T015 [US2] Revisión visual de las filas 6 y 10 de quickstart.md: los 10 gráficos del inventario cargan apagados; encender/apagar colorea y muestra/oculta la leyenda; tooltip con presidente intacto

**Checkpoint**: US1 y US2 funcionan juntas.

---

## Phase 5: User Story 3 - Cambiar entre línea y barras con un interruptor (Priority: P3)

**Goal**: el control de vista es el interruptor "Ver en barras", con el estilo de "Color por presidente", operable con teclado y anunciado como interruptor.

**Independent Test**: filas 7–9 de quickstart.md en el Observatorio y en un post del blog.

- [X] T016 [US3] En `src/components/observatorio/Chart.astro`, reemplazar `controlVistasHtml()` y `ETIQUETAS_VISTA` por el marcado de `contracts/chart-controls.md` sección 1: `<label class="pres-toggle" data-vistas-control>` con texto "Ver en barras", `<input type="checkbox" class="pres-toggle__input" role="switch" aria-label="Ver en barras">` (con `checked` solo si la vista inicial es `"barras"`) y el `span.pres-toggle__switch`; se sigue emitiendo solo cuando `vistas` incluye `"barras"` y al final de `.chart-controls` (depende de T011)
- [X] T017 [US3] En `src/components/observatorio/Chart.astro`, reescribir `bindControlVistas()` para escuchar `change` del input y llamar `ctx.cambiarVista(input.checked ? "barras" : "linea")`, conservando la guarda `data-bound`
- [X] T018 [US3] En `src/components/observatorio/Chart.astro` (estilos globales), eliminar las reglas `.chart-toggle`, `.chart-toggle__btn*` y la regla `@media (max-width: 600px) { .pres-toggle__label { display: none; } }` para que el texto de los interruptores se vea en móvil
- [X] T019 [P] [US3] En `src/lib/observatorio/chart-defs/inflacion.ts` (interruptor "Mostrar inflación"), agregar `role="switch"` y `aria-label="Mostrar inflación"` al input, por consistencia de accesibilidad
- [X] T020 [US3] Revisión visual de las filas 7–9 de quickstart.md: interruptor en gráficos con `vistas` del Observatorio y de un post del blog (p. ej. `src/content/blog/inflacion-tasas-interes-colombia-agosto-2026.mdx`), teclado (Tab + Espacio), VoiceOver y ancho 375 px

**Checkpoint**: las tres historias completas.

---

### Refinamiento posterior (pedido del autor, 2026-10-15)

- [X] T026 [US1] En `src/lib/observatorio/chart-defs/historico.ts` (`inflacionHistorica`), usar `referencias: { maximo: true, minimo: true, promedio: true }` manteniendo `metaBanrep: true`
- [X] T027 [P] [US1] En `src/lib/observatorio/chart-defs/inflacion.ts` (`spread`), calcular `lineasReferencia(sp, { sufijo: " pp", decimales: 2 })` sobre el diferencial y fusionar con la línea de cero (`shapes`) y `annotations`
- [X] T028 [US1] Verificar en `/observatorio/` los paneles 01 y 06 (incluido "Mostrar inflación" y "Ver en barras" en el 06), `npx astro check` y `npm run build`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 [P] Actualizar `agents/DESIGN-SYSTEM.md`: diagrama de 6.1 (`[Línea | Barras]` → interruptor "Ver en barras"); 6.2 (interruptor en lugar de control segmentado, accesibilidad `role="switch"`, regla "Color por presidente arranca siempre apagado", única implementación en `color-presidente.ts`); 6.4 (máx/mín/promedio en gris `#64748b`, máx/mín discontinuas, promedio punteado; etiquetas "Máx", "Mín", "Prom" y ejemplos `Prom · 6,1 %` en lugar de `Promedio · 6,1 %`, también en el diagrama de 6.1; meta BanRep sin cambios); texto de UI-08
- [X] T022 [P] Actualizar `src/lib/observatorio/ARCHITECTURE.md`: descripción de `historico.ts` (usa `color-presidente.ts`, opción `referencias`, sin `defaultOn`) y la fila "Barra histórica anual con color-por-presidente + toggle" de la tabla de recetas
- [X] T023 Ejecutar las comprobaciones de código de quickstart.md: `grep -rn "defaultOn\|bindPresidenteToggle\|chart-toggle__btn" src` sin resultados y `grep -rn "Coloread" src/lib/observatorio/chart-defs src/pages/observatorio` sin textos que afirmen color encendido al cargar
- [X] T024 Ejecutar `npx astro check` y `npm run build` y comparar con la línea base de T001 (sin errores nuevos)
- [X] T025 Informar al autor qué cambió, qué se verificó y qué quedó pendiente (sin commits: git es del autor)

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → antes de todo.
- **US1 (T003–T008)**: sin dependencias de otras historias. MVP.
- **US2 (T009–T015)**: T010 y T012 tocan `historico.ts`, igual que T004–T005 → hacer US2 después de US1 (o al menos después de T005).
- **US3 (T016–T020)**: T016–T018 tocan `Chart.astro`, igual que T011 → hacer después de T011.
- **Polish (T021–T025)**: al final; T021 y T022 pueden ir en paralelo con la verificación de US3.

Orden de archivos compartidos: `historico.ts` T004 → T005 → T010 → T012; `Chart.astro` T011 → T016 → T017 → T018.

## Parallel Example

```text
US1: T006 (comercio.ts) y T007 (pib.ts) en paralelo, después de T003.
US2: T009 (color-presidente.ts), T013 (externo.ts) y T014 (páginas) en paralelo con T010.
US3: T019 (inflacion.ts) en paralelo con T016–T018.
Polish: T021 (DESIGN-SYSTEM.md) y T022 (ARCHITECTURE.md) en paralelo.
```

## Implementation Strategy

1. **MVP**: Setup + US1 → validar con quickstart filas 1–5. Ya aporta el valor principal (máx/mín/promedio y estilo unificado).
2. **+ US2**: color por presidente apagado y una sola implementación del interruptor.
3. **+ US3**: interruptor "Ver en barras".
4. **Polish**: documentación, comprobaciones y build final.

## Notas de implementación

- **Línea base (T001, 2026-10-15):** `npx astro check` → 0 errores, 0 advertencias, 45 hints (104 archivos). `npm run build` → 160 páginas, enlaces internos OK.
- **Textos a revisar (T002):** `historico.ts` → `pregunta`/`ariaLabel` de inflacion-historica, pib-historico, desempleo-historico, salario-minimo-historico, salario-minimo-variacion ("activa barras…"), poblacion-historica, comercio-impo, pib-percapita, comercio-historico. Páginas: `comercio.astro:102` y `empleo.astro:186` dicen "Activa el color por presidente…" (correcto, se dejan).
- **T013/T014:** sin cambios necesarios; los textos de `externo.ts` y los `lead` de las páginas no afirman que el gráfico cargue coloreado.
- **Verificación final (T023–T024):** búsquedas de quickstart sin resultados; `npx astro check` → 0 errores, 0 advertencias, 44 hints (antes 45); `npm run build` → 160 páginas, enlaces OK.
- **Revisión visual (T008, T015, T020):** Comercio 01–03, Empleo 01, PIB 04, Inflación (`/observatorio/`) y el post `inflacion-tasas-interes-colombia-agosto-2026`: líneas grises "Máx/Mín/Prom", meta BanRep verde, interruptores apagados al cargar, "Ver en barras" con teclado (Tab + Espacio, `role="switch"`), móvil 375 px sin desborde. VoiceOver no se probó con lector real (solo atributos ARIA).
- **Observación de datos (no se cambió):** en `data_pib.json`, `deuda_publica` 1998 = 5,4 % frente a 19,07 % en 1999; por eso "Mín · 5,4 %" en PIB 04. Conviene revisar el pipeline.
- **Refinamiento T026–T028:** Inflación vs Tasa 01 muestra "Máx · 33,80 %", "Prom · 13,67 %" y "Meta BanRep · 3 % · Mín · 2,02 %" (se combinan por cercanía, regla de la spec 001). El 06 muestra "Máx · 5,98 pp", "Prom · 1,34 pp" y "Mín · -4,53 pp", que se mantienen con "Mostrar inflación" y en barras. `astro check` da 0 errores y el build sale bien.
