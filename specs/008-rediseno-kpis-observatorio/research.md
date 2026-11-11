# Research: Rediseño de los indicadores clave del Observatorio

**Feature**: `008-rediseno-kpis-observatorio` · **Date**: 2026-11-10 · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Resuelve las incógnitas del plan y fija las decisiones técnicas. La spec no dejó
marcadores `[NEEDS CLARIFICATION]`; la única decisión abierta que la propuesta
delegó al plan es **cómo se dibuja el gráfico** (R1). El resto son decisiones de
diseño de la implementación.

**Evidencia leída para este documento:** `IndicadorClaveCard.astro`,
`chart-defs/sparkline.ts`, `Chart.astro`, `home.ts`, `derivations.ts`,
`charts.ts` (`lineasReferencia`, `META_BANREP`, `RANGO_META_BANREP`),
`plotly-mount.ts`, `index.astro` (panel), `src/lib/observatorio/ARCHITECTURE.md`
(REGLAS 1–4, 8, 17 y anti-patrones), `agents/ARCHITECTURE.md` (ARQ-01 a ARQ-19),
`agents/DESIGN-SYSTEM.md` (2.6, 5.5, 6.x, UI-07/UI-08), la constitución y
`specs/005-landing-observatorio/research.md` (R5).

---

## R1 · Técnica de dibujo del gráfico

**Decisión:** cada indicador se dibuja con un `ChartDef` renderizado por Plotly en
modo estático (`staticPlot`), publicado con `<Chart id="kpi-…" variant="kpi" />`. La
lectura sincronizada es una capa de interacción propia (módulo cliente) montada
encima, que **no** usa los eventos de hover de Plotly.

**Por qué:**

- Cumple sin excepciones de arquitectura la constitución (principio III: "un gráfico
  DEBE publicarse con `<Chart id>`"), ARQ-07, ARQ-19, REGLA 2 (series cargadas en
  el cliente, nunca incrustadas en el HTML) y REGLA 4 (no crear componentes de
  gráfico nuevos).
- Reutiliza la infraestructura que ya resuelve temas, caché y ciclo de vida:
  `Chart.astro` re-renderiza los gráficos al cambiar de tema (spec 007),
  `loadDatasets` deduplica descargas y `onMount` permite enganchar la capa de
  lectura.
- Es la misma técnica que la spec 005 aprobó para los sparklines; solo cambia el
  tamaño (48 → 150 px) y la forma.
- Plotly expresa todo lo que la maqueta necesita: líneas con área, escalones
  (`line.shape: "hvh"`, escalón centrado), barras desde cero, `shapes` para banda y
  referencias, anotaciones para los rótulos y marcadores para el dato vigente y el
  punto de comparación. Falta por confirmar visualmente la estética fina (ver *Valores
  por calibrar* al final).
- Se mantiene el mismo número de instancias de Plotly (8, estáticas) y el mismo
  bundle `basic`: la portada no se vuelve más pesada (SC-010).

**Alternativas consideradas:**

| Alternativa | Ventajas | Por qué se descarta |
| --- | --- | --- |
| **B · SVG generado en build por Astro** (lo que hace la maqueta, pero en el servidor) | Gráfico en el HTML inicial (mejor para PRD-03); el tema se resuelve solo con CSS, sin re-render; y como las 8 miniaturas son los únicos gráficos de la portada, se podría **quitar Plotly de la portada**; fidelidad total con la maqueta. | Viola la **REGLA 2** (incrusta series en el HTML) y el anti-patrón de embeber datos para la lectura; contradice ARQ-07, ARQ-19 y el principio III (que dice "DEBE"), y crea un segundo camino de dibujo que mantener (temas, accesibilidad, tipografía). La spec 005 ya lo rechazó por lo mismo. Requeriría cuatro excepciones, una contra un principio constitucional. **Solo el autor puede aprobarla**; si prioriza el gráfico en el HTML inicial y sacar Plotly de la portada, es una opción viable. |
| **C · Componente SVG propio en el cliente** | Misma fidelidad que B sin incrustar datos. | Duplica el ciclo de vida de los gráficos (carga, temas, reintento, estados de error); rechazado en la spec 005 y contrario a REGLA 4. |
| **D · Plotly interactivo con sus eventos de hover** (`plotly_hover`, `Fx.hover`) para sincronizar | Menos código propio de interacción. | Depende del comportamiento táctil de Plotly (no verificado), exige `staticPlot: false` en 8 gráficos (más handlers), no es operable con teclado y no permite un recorrido por periodos común a toda la fila. |

**No verificado:** no se midió el peso real del bundle `basic` de Plotly; el
argumento "quitar Plotly de la portada" de la alternativa B es cualitativo.

---

## R2 · Eje de tiempo compartido por fila

**Decisión:** una función pura `ejeCompartido()` en `derivations.ts` (REGLA 10)
calcula, para una fila, la lista de periodos desde el primer periodo de la ventana
más temprana hasta el último periodo de la serie más reciente, con paso de 1 mes
(mensual) o 1 año (anual). Se usa igual en build y en el cliente:

- **Build:** el título de la fila ("Últimos 24 meses de cada serie sobre un mismo
  eje, {desde} — {hasta}") se arma con `periodoInicioVentana` y `periodo` de cada
  `IndicadorClave`, que ya existen.
- **Cliente:** cada `ChartDef` fija `xaxis.range` con ese eje, ampliado medio paso a
  cada lado para que la primera y la última barra se vean completas.

**Por qué:** un solo cálculo para el texto y para el gráfico evita desfases;
resolverlo en una función pura respeta ARQ-06 y se puede razonar sin DOM.

**Consecuencia:** como cada gráfico necesita el eje de toda la fila, su `datasets`
incluye los de la fila (mensual: inflación, empleo, externo; anual: PIB, externo,
salario mínimo). `loadDatasets` deduplica, por lo que no hay descargas repetidas
(se verifica en `quickstart.md`).

**Alternativa descartada:** que cada tarjeta use su propio eje. Contradice FR-003 y
pierde la comparación visual entre indicadores de una fila.

---

## R3 · Forma y referencia de cada indicador en Plotly

**Decisión:** el catálogo `INDICADORES_CLAVE` gana `forma` (`"linea" | "escalon" |
"barras"`) y, para el salario mínimo, `desdeCero: true`. La fábrica
`makeIndicadorClaveChart(def)` arma las trazas según la forma:

| Forma | Trazas y ajustes en Plotly |
| --- | --- |
| `linea` | Línea recta (no spline: el spline puede sobrepasar los datos) más área hasta la base (traza base + `fill: "tonexty"`, patrón del sparkline actual). |
| `escalon` | Línea con `shape: "hvh"` más área; con `desdeCero` el eje Y empieza en 0. |
| `barras` | Traza de barras en azul de serie tenue y la última barra en azul pleno; línea de cero como `shape`. |

Además: marcador del dato vigente (halo translúcido + punto sólido; en barras, la
última barra plena) y, cuando corresponde (comparación interanual o referencia "hace
un año"), un marcador hueco en el periodo de comparación.

**Referencias** (spec FR-011, FR-013):

| Tipo de referencia | Cómo se dibuja | Reutiliza |
| --- | --- | --- |
| `meta-oficial` | Banda `rect` en `COLORS.metaBanda`, dos líneas punteadas en 2 % y 4 % con el color de `META_BANREP`, y un rótulo "Rango meta BanRep · 2–4 %". | Patrón de banda de `chart-defs/inflacion.ts`; `RANGO_META_BANREP`; `META_BANREP`. |
| `promedio-20a` y `hace-un-ano` | Una línea punteada gris con rótulo a la izquierda "Prom 20 años · valor" o "Hace un año · valor". | `lineasReferencia([], { extra })`, que ya ubica las etiquetas a la izquierda (UI-10) con formato `Etiqueta · valor`. Confirmado en el código: con `valores` vacío y sin flags solo emite las referencias `extra`. |

El valor de la referencia sale de `referenciaIndicador()` (`valorReferencia`), que
usa la serie completa de 20 años, no solo la ventana dibujada.

**Ejes:** X de tipo fecha con rango explícito, marcas solo de año (enero en
mensuales; múltiplos de 5 en anuales), **sin grilla vertical** (DESIGN-SYSTEM 6.5
la prohíbe; la maqueta dibujaba líneas de año, aquí se resuelve con marcas y
etiquetas). Eje Y oculto con rango explícito (serie, referencias y 0 cuando la forma
parte de cero, con 8 % de holgura), igual que el sparkline actual.

**Por qué reutilizar:** principio III y ARQ-19; evita copiar la lógica de etiquetas
combinadas y de bandas.

---

## R4 · Lectura sincronizada

**Decisión:** un módulo cliente `kpi-lectura.ts` gestiona una "lectura" por fila. Cada
`ChartDef` entrega al módulo, desde su `onMount`, la **geometría explícita** del
gráfico (márgenes, rango X, rango Y, periodos y serie propia). El módulo traduce
la posición del puntero a un periodo con esa geometría, **sin usar APIs internas de
Plotly**, y dibuja el cursor con elementos HTML superpuestos (línea vertical y punto),
estilizados con tokens.

**Reglas:**

- **Mapeo:** posición X → fecha por interpolación lineal en el área de dibujo
  (ancho del contenedor menos márgenes) → periodo más cercano del eje compartido.
  Posición Y del punto → interpolación sobre el rango Y.
- **Entradas:** `pointermove` y `pointerdown` (ratón y toque); `pointerleave` solo
  para ratón; tras `pointerup`/`pointercancel` táctil, la lectura vuelve al dato
  vigente a los 2,5 s (valor tomado de la maqueta aprobada; configurable en una
  constante). Teclado: ←/→ (y ↑/↓) un punto de la serie propia, Inicio, Fin,
  Escape; el foco que se pierde restablece.
- **Estados:** `reposo` (todas las tarjetas muestran su dato vigente) y `leyendo(i)`
  (todas muestran el periodo `i` del eje). Ver `data-model.md`.
- **Salida de cada tarjeta:** valor, periodo y línea de contexto. Sin dato en ese
  periodo: "—" y la causa ("Aún sin dato publicado para esta fecha" o "Fuera de la
  ventana de esta serie"). Nunca se inventa un valor.
- **Accesibilidad:** la zona de lectura es un `slider` enfocable con `aria-valuemin`,
  `aria-valuemax`, `aria-valuenow` y `aria-valuetext` ("Sep 2026: 8,02 %"); el
  gráfico de Plotly debajo conserva `role="img"` y su descripción.
- **Idempotencia (ARQ-08):** `onMount` se ejecuta de nuevo en cada re-render por
  cambio de tema; el registro se clava por id de gráfico, actualiza la geometría y
  no duplica listeners. El estado de lectura se reinicia al cambiar de tema.

**Por qué no usar el hover de Plotly:** ver alternativa D en R1. La capa propia da
el mismo comportamiento con ratón, toque y teclado, y su correctitud depende de
márgenes y rangos que el propio `ChartDef` fija.

**Riesgo conocido:** la capa y Plotly deben coincidir en el área de dibujo. Se
mitiga con márgenes y rangos explícitos y se comprueba en `quickstart.md`
(posición del cursor frente al marcador del dato vigente).

---

## R5 · Detalle de la tarjeta

**Decisión:** `<details>` / `<summary>` nativos. El `summary` se rotula "Fuente:
{nombre corto}" y el contenido (explicación, frase de referencia, fuente oficial
con enlace, indicador medido, fecha de corte, ventana de la serie, enlace al
dashboard) va dentro del `<details>`.

**Por qué:** funciona sin JavaScript, el contenido está en el HTML inicial
(FR-020), el navegador comunica el estado expandido y es operable con teclado sin
código propio.

**Alternativa descartada:** botón con `aria-expanded` y región `hidden` (la maqueta).
Sin JavaScript el contenido sería inalcanzable, lo que contradice FR-020.

**Nombre corto de la fuente:** se deriva del nombre del dataset cortando en " — "
(p. ej. "DANE", "Banco Mundial", "Ministerio del Trabajo"; "Banco de la República de
Colombia" no tiene separador y se muestra completo). Función pura
`nombreCortoFuente()` en `home.ts`. No se necesita un campo nuevo del pipeline.

---

## R6 · Tokens y color

**Decisión:**

- Token nuevo `--color-chart-serie`: `#2563eb` en claro, `#3b82f6` en oscuro y en el
  bloque sin JavaScript (regla 2.9: un token nuevo va en los tres bloques). Lo lee
  `chartTheme().serie` (con fallback claro) y se expone como `COLORS.serie`.
- Los matices (área, halo, barras tenues) se derivan de ese color con transparencia
  mediante un pequeño ayudante; no se agregan más tokens por matiz.
- La banda de la meta y las referencias grises **ya existen**: `COLORS.metaBanda`,
  `META_BANREP.color` y `--color-chart-reference`.
- El punto de comparación hueco se rellena con el color de superficie de la tarjeta
  (token `--color-surface` leído por `chartTheme()`).

**Alcance de la excepción del azul claro:** se aplica **solo** a los gráficos
`kpi-*`. El resto de los gráficos del sitio sigue usando `#2563eb` también en oscuro.
Extender el azul claro a todos sería un cambio de sistema de diseño fuera de esta
spec; **se deja como recomendación al autor** (los demás gráficos azules en oscuro
tienen el mismo contraste ≈3:1).

**Pregunta de color (constitución IV):** ya consultada al autor en la spec (azul de
marca, banda verde, azul claro en oscuro); las referencias grises y el resto de la
paleta vienen de la maqueta aprobada.

---

## R7 · Analítica y navegación

**Decisión:** los atributos `data-ga-event="home_indicador_click"`,
`data-ga-indicador` y `data-ga-destino` pasan al enlace del nombre, que ahora es el
único enlace al dashboard.

**Cambio de comportamiento a vigilar:** hoy toda la tarjeta es un "enlace
estirado"; en el rediseño solo lo es el nombre, porque la zona del gráfico es
interactiva (lectura). Puede afectar el CTR del evento (K4). Se compara el evento
antes y después de publicar; si cae, se evalúa un enlace estirado que excluya la
zona del gráfico. No es una violación de regla, pero conviene que el autor lo sepa.

---

## R8 · Migración y retiro

**Decisión:**

- Eliminar `chart-defs/sparkline.ts` y el registro `spark-*` en `chart-defs/index.ts`;
  se registran `kpi-*` con la fábrica nueva (evolución de `makeSparkline`, ARQ-19).
- Renombrar la variante `sparkline` de `Chart.astro` a `kpi` (único consumidor: la
  tarjeta; se comprobó con búsqueda en `src/`).
- Retirar `GRUPOS`, `GrupoIndicador` y el campo `grupo` de `home.ts`: hoy solo los
  consume la tarjeta (la pill de grupo que se elimina). Antes de borrarlos, la
  implementación vuelve a buscar usos con `grep`; si aparece alguno, se conservan.
- Retirar de `index.astro` los estilos y el marcado del índice 01–08 y de la grilla
  única; el panel pasa a dos `FilaIndicadoresClave`.

No hay referencias a `spark-*` en SEO, `llms.txt` ni JSON-LD (búsqueda en `src/`).

---

## R9 · Responsive, movimiento y tema

- **Columnas:** 4 en escritorio, 2 hasta `1024px` y 1 hasta `640px`, con los
  breakpoints existentes de DESIGN-SYSTEM 2.6; no se crean breakpoints nuevos (la
  sección 5.5 ya describe esta progresión para el panel).
- **Cifras largas:** el tamaño del valor se ajusta al ancho de la tarjeta (`clamp()`
  o unidades de container query) y se verifica con los peores casos del panel
  ("US$8.562", "$1.750.905", "$3.221,74") en 4 columnas a 1024 px y a 375 px.
- **Movimiento:** las únicas transiciones son el borde de la tarjeta y la flecha del
  enlace; se anulan con `prefers-reduced-motion`. El cursor de lectura se mueve sin
  animación.
- **Tema:** el re-render del gráfico lo hace `Chart.astro` en `themechange`; la capa de
  lectura y la tarjeta usan solo tokens, así que cambian de tema al instante.
- **Impresión:** el panel se imprime en claro por los tokens de impresión de la spec
  007; `<details>` cerrado se imprime cerrado.

---

## R10 · Rendimiento

- Mismas 8 instancias estáticas de Plotly (sin manejadores de hover) y mismo
  bundle: sin regresión esperada.
- Una descarga por dataset (caché de `loadDatasets`), aunque cada gráfico declare los
  datasets de su fila.
- Altura del gráfico reservada (150 px) desde el HTML: montar el gráfico no mueve el
  layout.
- Línea base: antes de implementar, registrar peticiones y tiempos de la portada
  para poder comparar (SC-010). El proyecto no tiene herramienta de medición
  automática; la comparación es manual con las herramientas del navegador.

---

## Valores por calibrar en la implementación

Se resuelven con revisión visual en ambos temas, no cambian el diseño:

- Opacidad del área bajo la línea: DESIGN-SYSTEM 6.5 indica 6 %; la maqueta usó
  16–22 % para dar presencia al gráfico. Si se sube, se actualiza 6.5.
- Márgenes superior e inferior para etiquetas de referencia y años.
- Texto final de la línea de contexto durante la lectura (maqueta: "Es el dato
  vigente" / "Dato vigente: {valor} · {periodo}").
- Plazo de regreso al dato vigente en táctil (2,5 s en la maqueta).
