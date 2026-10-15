# Research · 001 Estandarizar los gráficos de línea

**Fecha:** 2026-10-14 · **Spec:** [spec.md](./spec.md)

Investigación hecha sobre el código real del repositorio. Cada decisión responde
a una incógnita del plan.

## Inventario de partida

El Observatorio publica **38 gráficos** en 6 páginas
(`src/pages/observatorio/{index,monetario,pib,empleo,comercio,demografia}.astro`).

### Gráficos que reciben el control Línea | Barras (21)

| Id | Archivo | Tipo actual | Control actual |
|---|---|---|---|
| `inflacion-anual` | inflacion.ts | Línea + banda de meta | `lineBarToggle` (segmentado) |
| `tasa-interes` | inflacion.ts | Línea escalonada | `lineBarToggle` (segmentado) |
| `inflacion-mensual` | inflacion.ts | Línea + marcadores coloreados | Interruptor propio "Ver en barras" |
| `spread` | inflacion.ts | **Mixto:** barras + línea opcional de inflación | Interruptor "Mostrar inflación" (no es de vista) |
| `freno-acelerador` | inflacion.ts | **Mixto:** 2 líneas + áreas de relleno auxiliares | — |
| `pib-inflacion` | inflacion.ts | 2 líneas + banda de meta | — |
| `trm-historica` | externo.ts | Línea + relleno | Interruptores propios (barras + color por presidente) |
| `deuda-externa-pib` | externo.ts | Línea + relleno | — |
| `pass-through-trm-inflacion` | externo.ts | 2 líneas, **doble eje** | — |
| `salario-minimo-variacion` | historico.ts | Línea + marcadores | Interruptores propios (barras + color por presidente) con `restyle` |
| `pib-poblacion` | pib.ts | 2 líneas, **doble eje** | — |
| `deuda-publica` | pib.ts | Línea + relleno | — |
| `pib-comercio` | pib.ts | 2 líneas, **doble eje** | — |
| `desempleo` | empleo.ts | Línea + relleno | — |
| `subempleo` | empleo.ts | Línea + relleno | — |
| `tgp-to-dual` | empleo.ts | 2 líneas | — |
| `poblacion-crecimiento` | demografia.ts | Línea + marcadores | — |
| `esperanza-vida` | demografia.ts | 2 líneas | — |
| `gini-evolucion` | demografia.ts | Línea + bandas | — |
| `comercio-apertura` | comercio.ts | Línea + marcadores + texto | — |
| `productos-tradicionales` | comercio.ts | Varias líneas | — |

### Gráficos que no reciben el control (17)

Barras puras o barras apiladas: `inflacion-historica`, `pib-historico`,
`pib-percapita`, `desempleo-historico`, `salario-minimo-historico`,
`poblacion-historica`, `comercio-impo`, `comercio-historico`, `pib-crecimiento`,
`brecha-laboral`, `comercio-balanza`, `reservas-internacionales`,
`cuenta-corriente-pib`, `matriz-expo`, `matriz-impo`, `participacion-expo`,
`participacion-impo`. Sí se les aplican las reglas de etiquetas (FR-001 a FR-003)
cuando tienen líneas de referencia.

### Hallazgos que justifican la feature

- **5 mecanismos distintos** para cambiar a barras: `lineBarToggle`
  (charts.ts), interruptor de `inflacion-mensual`, `bindTogglableChart`
  (externo.ts), `restyle` de `salario-minimo-variacion`, y ninguno en 17 gráficos de línea.
- **3 generadores distintos** de líneas de referencia: `minMaxAvgLines`
  (charts.ts, promedio a la **derecha** por defecto), `makeMinMaxMeanRefs`
  (externo.ts, media a la derecha y colores propios) y el código manual de
  `buildHistorico` (historico.ts, promedio a la derecha).
- **Metas a la derecha:** `inflacion-anual` y `pib-inflacion` anotan la meta del
  BanRep con `xanchor: "right"`.
- 8 llamadas directas a `Plotly.react` / `Plotly.restyle` en las recetas del
  Observatorio (inflacion, historico, externo), más 2 en `lineBarToggle`: cada
  control vuelve a dibujar a su manera. Las 5 de las recetas de elecciones quedan
  fuera de alcance.

## Decisiones

### D1 · El control Línea | Barras vive en `Chart.astro`, no en cada receta

- **Decision:** `Chart.astro` dibuja el control segmentado y gestiona el estado de
  vista de cada gráfico. Las recetas solo **declaran** que admiten el cambio.
- **Rationale:** cumple FR-008 y el principio III: una sola implementación para
  todo el sitio. Una mejora futura del control se hace en un solo lugar.
- **Alternatives considered:** extender `lineBarToggle` y llamarlo desde cada
  receta (rechazada: seguiría habiendo HTML y listeners por receta, y no cubre
  gráficos con varias series ni mixtos).

### D2 · Activación explícita por receta (`vistas`), no detección automática

- **Decision:** cada `ChartDef` en alcance declara `vistas: ["linea", "barras"]`.
- **Rationale:** la detección automática añadiría el control a los comparativos
  del blog, que el autor dejó **fuera** del alcance (FR-010). Lo explícito es
  predecible y se revisa en el plan de cada feature futura.
- **Alternatives considered:** detección automática con exclusión manual
  (rechazada por el efecto lateral sobre los comparativos).

### D3 · Conversión genérica de trazas línea → barras

- **Decision:** una función pura `aVista(trazas, vista)` en `charts.ts`:
  - Traza de línea **visible** (scatter con `lines` y grosor > 0): pasa a
    `type: "bar"`, conserva `x`, `y`, `name`, `customdata`, `hovertemplate`,
    `yaxis`, y toma como color `marker.color` (si es un arreglo por punto, como en
    `inflacion-mensual`) o `line.color`. Se descartan `mode`, `line`, `fill`.
  - Traza **auxiliar** (relleno entre series o línea de grosor 0, como las áreas
    de `freno-acelerador`): se oculta en vista de barras.
  - Traza que ya es barra: no cambia.
  - Si en vista de barras quedan 2 o más series de barras sobre el mismo eje, el
    layout usa `barmode: "group"`.
- **Rationale:** cubre una serie, varias series, mixtos y doble eje con una sola
  regla (aclaración Q2 del autor: solo las líneas pasan a barras).
- **Alternatives considered:** que cada receta defina su `barTrace` (rechazada:
  repite lógica en 21 recetas).

### D4 · Contexto de render para recetas con otros controles

- **Decision:** `onMount` recibe un segundo parámetro `ctx` con
  `ctx.vista()`, `ctx.render(trazas, layout?)` y `ctx.alCambiarVista(fn)`.
  Las recetas con controles propios (`spread`: mostrar inflación; `trm-historica`
  y `salario-minimo-variacion`: color por presidente) dejan de llamar a
  `Plotly.react`/`restyle` y usan `ctx.render`, que aplica la vista actual.
- **Rationale:** evita que un control "pise" la vista elegida por el otro (edge
  case de la spec: controles que conviven) y elimina las llamadas dispersas a
  Plotly.
- **Alternatives considered:** eventos DOM personalizados entre controles
  (rechazada: estado repartido, difícil de razonar).

### D5 · Un único generador de líneas de referencia

- **Decision:** reemplazar `minMaxAvgLines` por `lineasReferencia(valores, opciones)`
  en `charts.ts`, que:
  - Genera máximo, promedio y mínimo (cada uno activable) y referencias extra
    (`{ etiqueta, valor, color? }`, p. ej. la meta del BanRep).
  - Ubica **todas** las etiquetas con `x: 0, xanchor: "left"`.
  - Formato `Etiqueta · valor` con `toLocaleString("es-CO")` o un formateador
    propio (p. ej. la TRM en pesos).
  - Colores de la sección 6.4 de DESIGN-SYSTEM (Máx `#dc2626`, Promedio
    `#64748b`, Mín `#16a34a`, discontinua 1,5 px); las referencias con color
    semántico (meta) lo conservan (aclaración Q1).
  - **Combina** etiquetas que quedarían superpuestas en una sola (aclaración Q2):
    dos etiquetas se consideran superpuestas si su distancia vertical es menor al
    6 % del rango visible del eje Y. El rango es `yaxis.range` cuando la receta lo
    fija (p. ej. `gini-evolucion` 40–62), pasado como `rangoY`; si no, máximo −
    mínimo de valores y referencias. Se mide sobre el rango visible porque la
    superposición es un fenómeno de pantalla: con un eje fijo amplio, dos valores
    cercanos quedan más juntos de lo que sugiere el rango de los datos.
- Se eliminan `makeMinMaxMeanRefs` (externo.ts) y el código manual de referencias
  de `buildHistorico` (historico.ts); las anotaciones de meta de `inflacion-anual`
  y `pib-inflacion` pasan a ser referencias extra.
- **Rationale:** FR-001, FR-002, FR-003 y FR-008 con una sola función.
- **Alternatives considered:** mantener `minMaxAvgLines` y solo cambiar su valor
  por defecto (rechazada: no resuelve metas, formateadores ni colisiones, y deja
  los otros dos generadores).

### D10 · Una sola representación de la meta del BanRep

- **Decision:** la meta se define una vez, como `META_BANREP` en `charts.ts`:
  verde `#16a34a`, trazo **punteado**, etiqueta "Meta BanRep · 3 %". La usan
  `inflacion-anual`, `pib-inflacion` e `inflacion-historica`.
- **Rationale** (buenas prácticas de visualización de datos):
  - *Un concepto, un color:* el color sigue a la entidad, no al gráfico; hoy la
    meta es verde en dos gráficos y roja en otro.
  - *Semántica del color:* el rojo comunica peligro o error; la meta es la zona
    objetivo, y DESIGN-SYSTEM ya pinta su banda en verde.
  - *Nunca solo color:* como el Mín también es verde, la meta se distingue por el
    trazo (punteado frente a discontinuo) y por su etiqueta con nombre.
  - *Reutilización (ARQ-19):* una constante en vez de tres definiciones.
- **Alternatives considered:** meta roja en todos (rechazada: semántica de
  alerta); meta en gris neutro (rechazada: pierde el vínculo con la banda verde de
  la meta, que ya conocen los lectores del Observatorio).

### D6 · Las líneas de referencia en vista de barras

- **Decision:** las referencias son `shapes` del layout, independientes de las
  trazas: se conservan sin cambios al cambiar de vista.
- **Rationale:** FR-005 sin trabajo adicional.

### D7 · Anotaciones de eventos fuera de alcance

- **Decision:** las anotaciones con flecha que marcan eventos ("Pandemia",
  "COVID", "Boom petrolero", "Sobrecalentamiento post-COVID") no son líneas de
  referencia y no cambian.
- **Rationale:** señalan un punto concreto de la serie; moverlas a la izquierda
  les quitaría sentido.

### D8 · Accesibilidad del control

- **Decision:** grupo `role="group"` con `aria-label="Tipo de gráfico"`, dos
  `<button type="button">` con `aria-pressed`, operables con teclado (Tab +
  Enter/Espacio). Mismo marcado y estilos que el control segmentado actual
  (`.chart-toggle` en `Chart.astro`).
- **Rationale:** FR-007; reutiliza el estilo ya definido en DESIGN-SYSTEM (6.2).

### D9 · Verificación sin dependencias nuevas

- **Decision:** no se agregan dependencias (ARQ-12). La verificación es
  `npx astro check`, `npm run build` y la guía de validación manual de
  [quickstart.md](./quickstart.md). Las funciones nuevas (`aVista`,
  `lineasReferencia`) son puras para poder testearlas cuando exista un runner.
- **Alternatives considered:** agregar vitest (rechazada para esta feature: es una
  dependencia nueva que requiere su propia spec).

## Nota de alcance

`pib-total` (pib.ts) es un gráfico de línea definido pero **no publicado** en
ninguna página del Observatorio; queda fuera del alcance.
