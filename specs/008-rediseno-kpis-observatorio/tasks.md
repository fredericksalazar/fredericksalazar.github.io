---

description: "Task list for feature 008-rediseno-kpis-observatorio"
---

# Tasks: Rediseño de los indicadores clave del Observatorio

**Input**: Design documents from `/specs/008-rediseno-kpis-observatorio/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/kpi-card-contract.md`, `quickstart.md`

**Tests**: No se generan tareas de test automatizado: la spec no las solicita y el
proyecto no tiene framework de pruebas. La validación es manual
(`quickstart.md`) más `npx astro check` y `npm run build`.

**Organization**: tareas agrupadas por historia de usuario. **US1 y US2 son ambas
P1 y deben publicarse juntas** (MVP): sin US2 la tarjeta no muestra la fuente, lo
que incumple PRD-05 y el principio II de la constitución.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias
  pendientes).
- **[Story]**: historia de usuario (`US1`–`US4`).
- Todas las rutas son exactas respecto de la raíz del repositorio.

## Path Conventions

- Sitio Astro único: `src/`, `public/`, `specs/`, `agents/`.
- Sin backend ni tests automatizados.
- **Git es del autor:** ninguna tarea crea ramas, commits, merges ni push.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: registrar la línea base y confirmar el alcance del retiro antes de
tocar código.

- [X] T001 Registrar la línea base de `/observatorio/` en la sección 4 de `specs/008-rediseno-kpis-observatorio/quickstart.md`, antes de cualquier cambio: para cada una de las 8 tarjetas actuales, valor, periodo, cambio y frase de referencia (texto visible); número de peticiones, tiempo de carga y peticiones a `public/data/*.json` (pestaña Red, caché desactivada); capturas de las 8 tarjetas y de las secciones 02–05 en claro y oscuro, guardadas en el directorio scratchpad de la sesión. Anotar el volumen reciente del evento `home_indicador_click` solo si el autor lo aporta.
- [X] T002 Confirmar el alcance del retiro (research R8) ejecutando `grep -rnE "sparkline|spark-|GRUPOS|GrupoIndicador|\.grupo|grupo:" src agents scripts public` y `grep -rn "IndicadorClaveCard" src`; anotar los resultados en la sección 4 de `specs/008-rediseno-kpis-observatorio/quickstart.md`. Si aparece un uso fuera de `src/components/observatorio/IndicadorClaveCard.astro`, `src/lib/observatorio/chart-defs/sparkline.ts`, `src/lib/observatorio/home.ts`, `src/lib/observatorio/chart-defs/index.ts`, `src/components/observatorio/Chart.astro` y `src/pages/observatorio/index.astro`, detenerse y avisar al autor.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tokens, catálogo y derivaciones puras que necesitan todas las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase.

- [X] T003 [P] Agregar el token `--color-chart-serie` en los **tres** bloques de `src/layouts/BaseLayout.astro`, junto a `--color-chart-reference` (`:root` claro ≈ línea 293, `:root[data-theme="dark"]` ≈ línea 372 y `@media (prefers-color-scheme: dark) :root:not([data-theme])` ≈ línea 437): `#2563eb` en claro, `#3b82f6` en oscuro y en el bloque sin JavaScript (regla 2.9 de `agents/DESIGN-SYSTEM.md`). No tocar `--color-accent`.
- [X] T004 [P] En `src/lib/observatorio/theme-colors.ts` agregar a `ChartTheme` los campos `serie` y `superficie`, con `FALLBACK` `serie: '#2563eb'` y `superficie: '#ffffff'`, y hacer que `chartTheme()` los lea de `--color-chart-serie` y `--color-surface`; exportar `conAlfa(color: string, alfa: number): string` (acepta hex de 3 o 6 dígitos y `rgb()/rgba()`, devuelve `rgba()`). En `src/lib/observatorio/charts.ts` agregar a `COLORS` el getter `serie` → `chartTheme().serie`. NO cambiar `COLORS.brand` (el azul claro en oscuro solo aplica a los gráficos `kpi-*`).
- [X] T005 [P] En `src/lib/observatorio/derivations.ts` agregar la función pura `ejeCompartido(ventanas: { inicio: string; fin: string }[], periodicidad: "mensual" | "anual"): string[]` (REGLA 10, sin DOM): lista ordenada e inclusiva de periodos `"YYYY-MM"` desde el menor `inicio` hasta el mayor `fin`; paso de 1 mes (`mensual`) o de 1 año (`anual`; el pipeline fecha los anuales en diciembre, `"YYYY-12"`).
- [X] T006 [P] En `src/lib/observatorio/home.ts` agregar `export type FormaGrafico = "linea" | "escalon" | "barras"` y, en `IndicadorClaveDef`, los campos `forma: FormaGrafico` y `desdeCero?: boolean` (solo el salario mínimo; "las barras ya parten de cero"). Asignar `forma` a los 8 indicadores de `INDICADORES_CLAVE` exactamente así: `inflacion-anual` → `"linea"`; `tasa-banrep` → `"escalon"`; `desempleo` → `"linea"`; `trm` → `"linea"`; `crecimiento-pib` → `"barras"`; `pib-percapita` → `"linea"`; `cuenta-corriente` → `"barras"`; `salario-minimo` → `"escalon"` con `desdeCero: true`. Conservar por ahora `grupo` y `GRUPOS` (se retiran en T033).
- [X] T007 En `src/lib/observatorio/home.ts` agregar (a) `nombreCortoFuente(fuente: Fuente | null): string | null`: texto de `fuente.nombre` antes del primer `" — "`, o el nombre completo si no hay separador, o `null` si `fuente` es `null`; y (b) `filasIndicadores(indicadores: IndicadorClave[]): FilaIndicadores[]` con `export interface FilaIndicadores { ritmo: Periodicidad; titulo: string; indicadores: IndicadorClave[]; ejeCompartido: string[]; ventanaTexto: string }`. Devuelve dos filas: `"mensual"` → `"Cada mes"` y `"anual"` → `"Cada año"`, cada una con los indicadores de esa `periodicidad` en el orden del catálogo, `ejeCompartido` calculado con `ejeCompartido()` (T005) a partir de `periodoInicioVentana` y `periodo` de cada indicador, y `ventanaTexto` = `"Últimos 24 meses de cada serie sobre un mismo eje, {desde} — {hasta}"` (mensual) o `"Últimos 20 años de cada serie sobre un mismo eje, {desde} — {hasta}"` (anual), con los periodos formateados con `formatPeriodoIndicador`. Depende de T005 y T006.

**Checkpoint**: tokens, catálogo y derivaciones listos; las historias pueden comenzar.

---

## Phase 3: User Story 1 - Leer de un vistazo cómo va cada indicador (Priority: P1) 🎯 MVP

**Goal**: el gráfico de 150 px es el cuerpo de cada tarjeta, con forma propia por
indicador y la referencia dibujada; la tarjeta muestra nivel 1 (dato) y nivel 2
(contexto) sin pill de grupo, índice, caja del sparkline ni enlace "Ver dashboard"
aparte; el panel se organiza en dos filas.

**Independent Test**: abrir `/observatorio/` e identificar, sin interactuar, valor,
periodo, sentido del cambio y posición frente a la referencia de cada indicador;
comprobar forma, tamaño y elementos eliminados (`quickstart.md` filas 1–8).

### Implementation for User Story 1

- [X] T008 [US1] Crear `src/lib/observatorio/chart-defs/indicadores-clave.ts` (esqueleto): `export const kpiChartId = (id: string) => \`kpi-${id}\``; `makeIndicadorClaveChart(ind: IndicadorClaveDef): ChartDef` (patrón de fábrica de `makeSparkline`, ARQ-19) con `id: kpiChartId(ind.id)`, `titulo: "Tendencia · {nombre}"`, `datasets` = datasets únicos de **todos** los indicadores de `INDICADORES_CLAVE` con la misma `periodicidad` (para el eje compartido), `height: 150`, `vistas: ["linea"]`, `ariaLabel: "Tendencia de {nombre en minúsculas} en {los últimos 24 meses | los últimos 20 años}"`. `build(data)`: ventana `valoresNoNulos(serie, campo).slice(0, 24 | 20).reverse()` (24 mensual, 20 anual); eje con `ejeCompartido()` sobre las ventanas de la fila; layout con `baseLayout()` (REGLA 12) y márgenes fijos `{ l: 10, r: 12, t: 26, b: 24 }` (valores iniciales a calibrar, siempre explícitos), `showlegend: false`, `height: 150`; `xaxis`: tipo fecha, `range` = primer periodo del eje − medio paso hasta último + medio paso (ISO), `fixedrange: true`, marcas solo de año (`tickvals`/`ticktext`: enero en mensuales, múltiplos de 5 en anuales), `showgrid: false` (DESIGN-SYSTEM 6.5: sin grilla vertical); `yaxis`: `visible: false`, `fixedrange: true`, `range` explícito = serie + referencias + `0` si `forma === "barras"` o `desdeCero`, con 8 % de holgura (sin holgura en el lado que toca 0); `config: { staticPlot: true, displayModeBar: false, responsive: true }`. Exportar `export const indicadoresClave: ChartDef[] = INDICADORES_CLAVE.map(makeIndicadorClaveChart)`. Colores solo desde `COLORS`/`chartTheme()` (REGLA 11); ningún hex suelto.
- [X] T009 [US1] En `src/lib/observatorio/chart-defs/indicadores-clave.ts`, trazas por forma: `linea` → `scatter` de líneas con `line.shape: "linear"` (no spline), `COLORS.serie`, ancho 2.2, más área hasta la base (traza base invisible + `fill: "tonexty"`, patrón de `sparkline.ts`) con `fillcolor: conAlfa(COLORS.serie, alfa)` (alfa a calibrar visualmente: DESIGN-SYSTEM 6.5 indica 6 %, la maqueta usó 16–22 %); `escalon` → igual con `line.shape: "hvh"` (escalón centrado), y con `desdeCero` el rango Y parte de 0; `barras` → traza `bar` con `conAlfa(COLORS.serie, 0.42)` y la última barra en `COLORS.serie` (array de colores), más una línea de cero como `shape` con `COLORS.border`. Marcador del dato vigente (no en `barras`): halo `conAlfa(COLORS.serie, 0.25)` tamaño 16 y punto sólido `COLORS.serie` tamaño 8 en el último periodo de la serie. Sin hover (`hoverinfo: "skip"`).
- [X] T010 [US1] En `src/lib/observatorio/chart-defs/indicadores-clave.ts`, referencias dibujadas: calcular `valorReferencia` llamando a `referenciaIndicador()` de `src/lib/observatorio/derivations.ts` con los datos cargados (mismos cálculos que la tarjeta; sin referencia ni rótulo si es `null`). `meta-oficial` → `shape` `rect` (`xref: "paper"`, `x0: 0`, `x1: 1`, `yref: "y"`, `y0: RANGO_META_BANREP.min`, `y1: RANGO_META_BANREP.max`, `fillcolor: COLORS.metaBanda`, `line: { width: 0 }`, `layer: "below"`, patrón de `src/lib/observatorio/chart-defs/inflacion.ts` ≈ línea 38) más dos líneas punteadas en 2 y 4 con `META_BANREP.color` y una anotación a la izquierda "Rango meta BanRep · 2–4 %". `promedio-20a` y `hace-un-ano` → `lineasReferencia([], { extra: [{ etiqueta: "Prom 20 años" | "Hace un año", valor, estilo: "punteada" }], formato, rangoY })` de `src/lib/observatorio/charts.ts` (gris neutro por defecto, rótulo a la izquierda con formato "Etiqueta · valor", UI-10); `formato` usa `formatIndicador(v, unidad)` de `home.ts`. Marcador hueco en el periodo de comparación cuando la referencia es `hace-un-ano` o `comparacion === "interanual"` (mismo mes del año anterior; periodo de hace un año en anuales): relleno `chartTheme().superficie`, borde `COLORS.serie` de 1.6, tamaño 8; no aplica a `barras`. Solo la banda de la meta lleva color propio (FR-013, FR-026).
- [X] T011 [US1] En `src/lib/observatorio/chart-defs/index.ts` reemplazar `import { sparklines } from "./sparkline"` por `import { indicadoresClave } from "./indicadores-clave"` y el registro `...Object.fromEntries(sparklines.map(...))` por `...Object.fromEntries(indicadoresClave.map((d) => [d.id, d]))`, actualizando el comentario ("Gráficos de los indicadores clave de la Home (`kpi-*`), uno por indicador"). Depende de T008.
- [X] T012 [P] [US1] En `src/components/observatorio/Chart.astro` renombrar la variante `"sparkline"` a `"kpi"`: tipo `variant?: "card" | "kpi"`, comentario ("gráfico sin card, título ni fuente propios; la card es el componente que lo contiene: excepciones UI-07/UI-08 reformuladas en la spec 008"), clase `plotly-chart--kpi` y altura por defecto `def.height ?? 150`. Sin otros cambios al flujo de render ni a `renderChart`.
- [X] T013 [P] [US1] Reescribir `src/components/observatorio/IndicadorClaveCard.astro` (niveles 1 y 2 del contrato `contracts/kpi-card-contract.md` §2.1): prop única `indicador` (retirar `indice`); `<article data-indicador={def.id} aria-labelledby>`; `<h4>` con `<a href={def.href} aria-label="{nombre}. {destino}" data-ga-event="home_indicador_click" data-ga-indicador={def.id} data-ga-destino={def.href}>` y flecha `aria-hidden`; `<p>` con `<span data-kpi-valor>` (conservar la lógica `esPctPib`), `<time data-kpi-periodo datetime>` y, si `frescura === "no-reciente"`, la etiqueta "Dato no reciente"; `<p data-kpi-contexto>` con flecha `aria-hidden`, texto `sr` "Subió/Bajó/Sin cambio" y "{magnitud} frente a {periodo comparado}" (sin color de juicio, K-05); `<div data-kpi-lectura>` con `<Chart id={kpiChartId(def.id)} variant="kpi" />`. Sin pill de grupo, índice, caja del sparkline ni enlace "Ver dashboard" aparte, sin contenedores anidados (K-01); no importar `GRUPOS`. Solo tokens del sistema de diseño; el valor es el texto más grande (K-03), con tamaño ajustado al ancho (`clamp()` o unidades de container query). Sin el detalle: lo agrega T018.
- [X] T014 [P] [US1] Crear `src/components/observatorio/FilaIndicadoresClave.astro` (contrato §1): prop `fila: FilaIndicadores`; `<section data-fila-indicadores={fila.ritmo} aria-labelledby="fila-{ritmo}-titulo">` con `<h3 id>` ("Cada mes" / "Cada año"), `<p>` con `fila.ventanaTexto` y una grilla (`div` sin roles de lista) de 4 columnas, 2 hasta `1024px` y 1 hasta `640px` (DESIGN-SYSTEM 2.6; sin breakpoints nuevos) que recorre `fila.indicadores` renderizando `IndicadorClaveCard`. Trasladar aquí los estilos de `.panel-clave__grilla` de `src/pages/observatorio/index.astro` (gap `1.25rem`).
- [X] T015 [US1] En `src/pages/observatorio/index.astro`: importar `FilaIndicadoresClave` y `filasIndicadores`; reemplazar el bloque `<div class="panel-clave__grilla">…</div>` (≈ líneas 192–199) por `filasIndicadores(indicadores).map((fila) => <FilaIndicadoresClave fila={fila} />)` con separación vertical entre filas; quitar el import de `IndicadorClaveCard` y el índice `String(idx + 1).padStart(2, "0")`; eliminar la regla `.panel-clave__grilla` (≈ línea 579) y sus apariciones en los `@media` de `max-width: 1024px` y `640px` (≈ líneas 1271 y 1307); conservar `.panel-clave__meta`, `__badge` y `__dot`. Mantener `<PlotlyLoader />` (se sigue usando) y el resto de la página sin cambios. Depende de T013 y T014.
- [X] T016 [US1] Eliminar `src/lib/observatorio/chart-defs/sparkline.ts` (único consumidor: la tarjeta; ya sin importarlo tras T011 y T013) y confirmar con `grep -rn "sparkline" src` que no quedan referencias de código; el comentario de `src/lib/observatorio/home.ts` línea 5 se corrige en T033. Depende de T011, T013 y T015.
- [X] T017 [US1] Validar US1 con `quickstart.md` filas 1–8 en claro y oscuro (`npm run dev`): forma de cada gráfico, referencias, marcadores, nombre-enlace, elementos eliminados; ejecutar `npx astro check` y registrar el resultado en la sección 4 de `quickstart.md`. La fila 9 (prueba con 5 personas) la hace el autor.

**Checkpoint**: US1 funciona; **no publicar solo US1** (falta la fuente visible: US2).

---

## Phase 4: User Story 2 - Consultar la fuente y el significado bajo demanda (Priority: P1)

**Goal**: el nivel 3 (detalle) bajo un `<details>` nativo, con el nombre corto de la
fuente y el periodo siempre visibles y todo el contenido en el HTML inicial.

**Independent Test**: abrir y cerrar el detalle de cada tarjeta con ratón, toque y
teclado; verificar su contenido y su presencia sin JavaScript (`quickstart.md`
filas 10–14).

### Implementation for User Story 2

- [X] T018 [US2] En `src/components/observatorio/IndicadorClaveCard.astro` agregar el nivel 3 (contrato §2.1): `<details><summary>Fuente: {nombreCortoFuente(fuente)}</summary>…</details>` con, en este orden, la explicación `def.explicacion`; la frase `referencia.frase` terminada en punto; el enlace `fuente.nombre` → `fuente.url` (`target="_blank" rel="noopener"`) con `<small>{fuente.indicador} · Corte {periodo formateado} · Serie {ventana}</small>` (ventana = `periodoInicioVentana` — `periodo`, con el respaldo "Últimos 24 meses"/"Últimos 20 años" ya existente); y el enlace secundario `{def.destino} →` a `def.href` **sin** atributos `data-ga-*`. Si `fuente` es `null`, el `summary` dice "Detalle", se omite el bloque de fuente y se emite `console.warn("[home] …sin fuente…")` en build (no inventar la fuente). Ocultar el marcador nativo del `summary` y dibujar un ícono propio con tokens (`--color-border`, `--color-text-muted`), foco visible con `--color-focus` y transición anulada con `prefers-reduced-motion`. Depende de T013.
- [X] T019 [US2] Validar US2 con `quickstart.md` filas 10–14 (ratón, toque, teclado; contenido; sin JavaScript; "dato no reciente" forzando temporalmente una fecha futura en la llamada a `buildIndicadoresClave()` de `src/pages/observatorio/index.astro` y **revirtiendo** el cambio); ejecutar `npx astro check` y `npm run build`; registrar resultados en la sección 4 de `quickstart.md`.

**Checkpoint**: US1 + US2 = **MVP publicable** (tarjeta completa con fuente visible y detalle).

---

## Phase 5: User Story 3 - Comparar indicadores de una misma fila en la misma fecha (Priority: P2)

**Goal**: recorrer el gráfico de una tarjeta con cursor, toque o teclado hace que
las cuatro tarjetas de la fila lean el mismo periodo, sin inventar valores.

**Independent Test**: recorrer una fila mensual y una anual con ratón, toque y
teclado; las 4 tarjetas leen la misma fecha y vuelven a su dato vigente al salir
(`quickstart.md` filas 15–24).

### Implementation for User Story 3

- [X] T020 [P] [US3] En `src/lib/observatorio/derivations.ts` agregar la función pura `lecturaEnPeriodo(serie: Map<string, number>, periodo: string, periodoVigente: string, primerPeriodo: string)` que devuelve `{ tipo: "vigente", valor } | { tipo: "dato", valor } | { tipo: "sin-publicar" } | { tipo: "fuera-de-ventana" }`: el periodo vigente → `"vigente"`; presente en `serie` → `"dato"`; posterior a `periodoVigente` → `"sin-publicar"`; anterior a `primerPeriodo` o ausente por otra causa → `"fuera-de-ventana"` (data-model 3.2). Nunca devuelve un valor que no esté en `serie`.
- [X] T021 [US3] Crear `src/lib/observatorio/kpi-lectura.ts` (parte pura, sin DOM): tipos `GeometriaGrafico { margen: { l: number; r: number; t: number; b: number }; rangoX: [string, string]; rangoY: [number, number]; periodos: string[]; serie: Map<string, number>; periodoVigente: string }`; `periodoEnX(geo, x, ancho)`: interpolación lineal de la posición X en el área de dibujo (`ancho − l − r`) a fecha entre `rangoX` y devuelve el periodo más cercano de `periodos` por distancia en milisegundos; `posicionDe(geo, periodo, valor, ancho, alto)`: posición X/Y del cursor y del punto (Y por interpolación sobre `rangoY` dentro de `alto − t − b`). Sin llamadas a APIs internas de Plotly ni a `fetch` (REGLAS 8 y 9). Depende de T020.
- [X] T022 [US3] En `src/lib/observatorio/kpi-lectura.ts` agregar la parte con efectos (contrato §5): `registrarLectura(reg)` con `reg = { id, destino, fila, geometria, formatear }` que registra o **actualiza** el gráfico por `id` en la fila `closest("[data-fila-indicadores]")` y engancha una sola vez los listeners de la zona `[data-kpi-lectura]`, guardando la primera vez el contenido inicial de `[data-kpi-valor]`, `[data-kpi-periodo]` y `[data-kpi-contexto]`; `leer(fila, indice | null)` idempotente (no hace nada si el estado no cambia) que pasa la fila a `leyendo(i)` o `reposo` y actualiza las 4 tarjetas; entradas según el mapa de interacción del contrato §3: `pointermove`/`pointerdown` leen, `pointerleave` solo con ratón restablece, `pointerup`/`pointercancel` táctil restablecen a los **2,5 s** (constante `REGRESO_TACTIL_MS = 2500`), teclado `←`/`↓` y `→`/`↑` un punto de la serie propia, `Inicio`, `Fin`, `Escape` (todos con `preventDefault()` solo con el foco en la zona) y la pérdida de foco restablece; salida por tarjeta: valor (o "—"), periodo y contexto ("Es el dato vigente", "Dato vigente: {valor} · {periodo}", "Aún sin dato publicado para esta fecha" o "Fuera de la ventana de esta serie"); actualizar `aria-valuenow` y `aria-valuetext` ("{periodo}: {valor con unidad}"). Bandera `window.__kpiLecturaBound` y re-enganche en `astro:page-load` (ARQ-08). Depende de T021.
- [X] T023 [US3] En `src/lib/observatorio/chart-defs/indicadores-clave.ts` completar `build()` con `onMount(target, ctx)` que llama a `registrarLectura()` entregando la geometría exacta usada en el layout (márgenes, `rangoX`, `rangoY`, `periodos` del eje compartido, `serie` propia como `Map`, `periodoVigente`) y los formateadores `formatIndicador`/`formatPeriodoIndicador` de `home.ts`. Debe ser idempotente: Chart.astro vuelve a llamar `onMount` en cada re-render por cambio de tema (la fila vuelve a `reposo`). Depende de T010 y T022.
- [X] T024 [US3] En `src/components/observatorio/IndicadorClaveCard.astro` y `src/components/observatorio/FilaIndicadoresClave.astro` completar la zona de lectura (contrato §2.3 y §3): en `[data-kpi-lectura]` agregar `tabindex="0"`, `role="slider"`, `aria-orientation="horizontal"`, `aria-label="Recorrer la serie de {nombre en minúsculas}, {ventana}"`, `aria-valuemin="0"`, `aria-valuemax` = puntos de la serie − 1, `aria-valuenow` (último) y `aria-valuetext` ("{periodo}: {valor}"), y dentro un `<span data-kpi-cursor hidden>` con la línea vertical y el punto (HTML superpuesto, solo tokens); estilos: `touch-action: pan-y`, anillo de foco `--color-focus` visible en ambos temas, cursor sin animación con `prefers-reduced-motion`; importar `kpi-lectura` con `<script>` de la tarjeta. En la fila mensual, la pista de teclado "Recorre un gráfico ←/→ y toda la fila lee la misma fecha" (texto informativo, no único modo de descubrir la interacción). Depende de T022 y T018.
- [X] T025 [US3] Validar US3 con `quickstart.md` filas 15–24: lectura con ratón, toque (emulación de móvil y dispositivo real si el autor lo tiene), teclado; periodos sin dato ("—" y causa); `Fin` deja el cursor sobre el marcador del dato vigente (tolerancia de 2 px) en las 8 tarjetas, ambos temas y 3 anchos; 5 cambios de tema y luego `←` mueve **un** punto (sin listeners duplicados); navegación con View Transitions sin errores de consola. Registrar resultados en la sección 4 de `quickstart.md`.

**Checkpoint**: US1–US3 funcionan juntas.

---

## Phase 6: User Story 4 - Usar el panel en cualquier pantalla, tema y modo de acceso (Priority: P2)

**Goal**: panel legible, completo y operable en escritorio, tableta y teléfono, en
ambos temas, con teclado, lector de pantalla y movimiento reducido.

**Independent Test**: abrir la portada a 1440, 768 y 375 px en ambos temas y
recorrerla solo con teclado, con contraste y foco correctos y sin desplazamiento
horizontal (`quickstart.md` filas 25–33).

### Implementation for User Story 4

- [X] T026 [US4] Revisar y ajustar los estilos de `src/components/observatorio/IndicadorClaveCard.astro` y `src/components/observatorio/FilaIndicadoresClave.astro`: 4 columnas, 2 a `max-width: 1024px` y 1 a `max-width: 640px`; sin desplazamiento horizontal a 375 px; el valor no se corta ni desborda con "US$8.562", "$1.750.905" y "$3.221,74" en 4 columnas a 1024 px y a 375 px; en oscuro la tarjeta se distingue del fondo por luminosidad (token `--color-surface-raised`/`--color-surface`, sin sombra); transiciones anuladas con `prefers-reduced-motion`; jerarquía `h2` (panel) → `h3` (fila) → `h4` (indicador) con un solo `h1` en la página; impresión legible en claro. Solo tokens.
- [X] T027 [US4] Ejecutar una auditoría de contraste (texto y elementos gráficos) de `/observatorio/` en tema claro y oscuro, como la usada en la spec 007 (calcular la relación de contraste del texto contra su fondo efectivo y revisar los elementos gráficos): meta 4.5:1 en texto grande y gráficos; corregir en los tokens o estilos de los archivos de la feature lo que falle (en oscuro la serie debe verse con `#3b82f6`). Registrar el resultado en la sección 4 de `quickstart.md`.
- [X] T028 [US4] Validar US4 con `quickstart.md` filas 25–33 (columnas, sin desplazamiento horizontal, cifras largas, contraste, luminosidad en oscuro, teclado, movimiento reducido emulado, impresión, jerarquía de títulos; lector de pantalla con VoiceOver si el autor lo tiene) y registrar resultados, incluidos los puntos no verificados.

**Checkpoint**: las cuatro historias funcionan.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: documentación viva, retiro de lo obsoleto y verificación final.

- [X] T029 [P] Actualizar `agents/DESIGN-SYSTEM.md`: sección 5.5 (esquema de la portada: de "grilla 4 columnas × `IndicadorClaveCard` × 8" a dos `FilaIndicadoresClave` de 4 tarjetas; la frase "la referencia … en gris neutro; nunca rojo/verde" debe admitir la banda verde de la meta como única excepción); catálogo (`FilaIndicadoresClave`, `IndicadorClaveCard`, variante `kpi` de `Chart`); UI-07 y UI-08 (reformular las excepciones de la spec 005 de "sparklines `spark-*`, 48 px, sin ejes, estáticas" a "gráficos `kpi-*` dentro de la tarjeta del indicador; cada indicador tiene asignada su forma de gráfico y el interruptor vive en el dashboard de dominio"); sección 2.9 (excepción del azul de serie en oscuro, acotada a los `kpi-*`); y el token `--color-chart-serie` en la tabla de la sección 2.1.1.
- [X] T030 [P] Actualizar `src/lib/observatorio/ARCHITECTURE.md`: árbol de archivos con `chart-defs/indicadores-clave.ts` y `kpi-lectura.ts`, retiro de `sparkline.ts` y de cualquier mención de sparklines `spark-*` (buscar con `grep -n "spark" src/lib/observatorio/ARCHITECTURE.md`).
- [X] T031 [P] Revisar `agents/ARCHITECTURE.md` (sección 5.4, Observatorio) y mencionar el módulo cliente `kpi-lectura.ts` solo si la sección describe los módulos de interacción; si no corresponde, anotar en `quickstart.md` sección 4 que no se cambió y por qué.
- [X] T032 [P] Agregar en `specs/005-landing-observatorio/spec.md`, junto a FR-004, FR-005, FR-006 y FR-008, una nota breve "*(Enmendado por la spec 008, 2026-11-10)*" que remita a `specs/008-rediseno-kpis-observatorio/spec.md`, sin reescribir esos requisitos.
- [X] T033 Retirar `GRUPOS`, `GrupoIndicador` y el campo `grupo` de `src/lib/observatorio/home.ts` (tipo `IndicadorClaveDef`, las 8 entradas y la constante `GRUPOS`) y corregir el comentario del encabezado (línea 5, "`chart-defs/sparkline.ts`" → "`chart-defs/indicadores-clave.ts`") y el de `periodoInicioVentana` ("miniserie (sparkline)" → "serie del gráfico"). Solo si T002 y `grep -rnE "GRUPOS|GrupoIndicador|\.grupo|grupo:" src` confirman que ya nada más los usa; si aparece otro uso, conservarlos y anotarlo. Depende de T013, T016 y T018.
- [X] T034 Ejecutar `npx astro check` y corregir cualquier error nuevo.
- [X] T035 Ejecutar `npm run build` y corregir errores de build o enlaces internos (verificador de enlaces).
- [X] T036 Ejecutar las filas de datos y no regresión de `quickstart.md` (34–40): comparar cada tarjeta con `public/data/*.json` y con la línea base de T001 (cero diferencias), último punto de cada gráfico igual al valor vigente, pestaña Red (cada dataset una vez, Plotly una vez, sin `fetch` directo), rendimiento percibido comparable, evento `home_indicador_click` con atributos correctos, secciones 02–05 sin cambios y `git status` sin cambios en `public/data/`, `package.json` ni `package-lock.json`. Registrar todo en la sección 4 de `quickstart.md`.
- [X] T037 Auditoría final: `grep -rnE "sparkline|spark-|GRUPOS|GrupoIndicador" src` sin resultados, sin colores ni cifras sueltos nuevos en los archivos de la feature, y revisión de la definición de terminado del `plan.md` (casillas pendientes). Informar al autor qué cambió, qué se verificó y qué quedó pendiente (toque en dispositivo real, lector de pantalla, prueba con personas SC-003, comparación del evento en GA4), sin maquillar fallos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de T001–T002; bloquea todas las historias.
- **US1 (Phase 3)** y **US2 (Phase 4)**: dependen de Phase 2; US2 modifica el mismo archivo que US1 (`IndicadorClaveCard.astro`), por lo que se hace después de T013. Se publican juntas.
- **US3 (Phase 5)**: depende de US1 (gráficos y tarjeta) y de US2 (T024 usa la tarjeta completa).
- **US4 (Phase 6)**: depende de US1–US3 para revisar el panel completo; la revisión de CSS (T026) puede empezar tras US1.
- **Polish (Phase 7)**: depende de las historias; T033 depende de T013, T016 y T018.

### User Story Dependencies

- **US1**: tras Phase 2; es la base visual.
- **US2**: tras T013 (mismo archivo); independiente de US3.
- **US3**: tras US1 y US2; no cambia datos ni la estructura de las otras.
- **US4**: verificación y ajuste transversal; no agrega funcionalidad.

### Within Each User Story

- Foundational: tokens y derivaciones puras antes que el catálogo y los gráficos.
- US1: `indicadores-clave.ts` (T008 → T009 → T010, mismo archivo) → registro (T011) → tarjeta y fila → página → retiro de `sparkline.ts` → validación.
- US3: derivación pura → módulo (puro → efectos) → `onMount` del def → marcado y estilos → validación.

### Parallel Opportunities

- T003, T004, T005 y T006 son de archivos distintos: pueden ir en paralelo; T007 espera a T005 y T006.
- En US1, T012, T013 y T014 (archivos distintos) pueden ir en paralelo con T008–T010; T011 espera a T008; T015 espera a T013 y T014.
- T020 puede ir en paralelo con T018 (archivos distintos).
- T029, T030, T031 y T032 son documentos distintos: pueden ir en paralelo.

---

## Parallel Example: Foundational

```bash
# Lanzar en paralelo (archivos distintos):
Task: "T003 Token --color-chart-serie en src/layouts/BaseLayout.astro"
Task: "T004 serie/superficie/conAlfa en src/lib/observatorio/theme-colors.ts y COLORS.serie en charts.ts"
Task: "T005 ejeCompartido() en src/lib/observatorio/derivations.ts"
Task: "T006 forma/desdeCero en src/lib/observatorio/home.ts"
```

## Parallel Example: User Story 1

```bash
# Mientras se escribe indicadores-clave.ts (T008–T010):
Task: "T012 Variante kpi en src/components/observatorio/Chart.astro"
Task: "T013 Reescribir src/components/observatorio/IndicadorClaveCard.astro (niveles 1 y 2)"
Task: "T014 Crear src/components/observatorio/FilaIndicadoresClave.astro"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1 (T001–T002) y Phase 2 (T003–T007).
2. Completar US1 (T008–T017) y US2 (T018–T019).
3. **STOP and VALIDATE**: panel con gráficos de 150 px, dos filas, tarjeta de tres
   niveles y fuente visible; `astro check` y `build` en verde.
4. Publicar o demostrar si el autor lo decide.

> US1 y US2 son ambas P1: sin US2 la tarjeta oculta la fuente (PRD-05). El MVP las
> incluye juntas.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 + US2 → MVP.
3. US3 → lectura sincronizada por fila.
4. US4 → ajustes y validación de responsive, temas y accesibilidad.
5. Polish → documentación viva, retiro de lo obsoleto y verificación final.

### Parallel Team Strategy

1. Un desarrollador completa Phase 1–2.
2. Después de Phase 2:
   - Dev A: `indicadores-clave.ts` (T008–T010, T023) y el registro.
   - Dev B: tarjeta, fila y página (T013–T015, T018, T024).
   - Dev C: `kpi-lectura.ts` (T020–T022), que solo necesita el contrato.
3. Integrar y validar con `quickstart.md`.

---

## Notes

- `[P]` indica archivos distintos y sin dependencias pendientes.
- Cada historia debe poder validarse sola con su *Independent Test*, salvo que US1
  no se publica sin US2.
- No se agregan dependencias, datos ni tests automatizados; no se tocan
  `public/data/`, `package.json` ni `package-lock.json`.
- Las cuatro excepciones de diseño ya están aprobadas por el autor (plan,
  *Complexity Tracking*, 2026-11-10).
- Valores a calibrar a ojo en ambos temas (research, *Valores por calibrar*):
  opacidad del área, márgenes, texto de la línea de contexto y los 2,5 s del
  regreso táctil. Si la opacidad del área se aparta del 6 % de DESIGN-SYSTEM 6.5,
  actualizar esa sección.
- Tras publicar, el autor puede comparar el evento `home_indicador_click` (la
  tarjeta deja de ser un enlace estirado; riesgo K4 del plan).
- Commit después de cada tarea o grupo lógico, solo si el autor lo pide.
