# Research · Refinamiento gráfico del Observatorio

Fase 0 de `speckit-plan`. Ninguna decisión requiere dependencias nuevas: todo se
resuelve con piezas existentes (`Chart.astro`, `charts.ts`,
`chart-defs/color-presidente.ts`, `chart-defs/historico.ts`).

## R1 · Interruptor de vista "Ver en barras"

- **Decision:** `Chart.astro` reemplaza `controlVistasHtml()` (dos botones) por un
  interruptor con el mismo marcado y clases que "Color por presidente"
  (`label.pres-toggle` + `input.pres-toggle__input` + `span.pres-toggle__switch`).
  El input lleva `role="switch"`, `aria-label="Ver en barras"` y el atributo
  `data-vistas-control`; marcado = barras, desmarcado = línea. El estado inicial
  sale de `vistas[0]` (hoy siempre `"linea"`, o sea apagado).
- **Rationale:** reutiliza el único estilo de interruptor del sitio (principio III,
  FR-011); un `checkbox` nativo da teclado (Espacio), foco y estado accesible sin
  JS extra (FR-013). `role="switch"` hace que el lector anuncie
  "activado/desactivado".
- **Alternatives considered:** (a) mantener el control segmentado restilizado
  como interruptor: dos botones no son un control binario; (b) crear una clase
  nueva `.chart-switch` y migrar `.pres-toggle`: renombra sin cambiar
  comportamiento y toca 4 archivos más; se descarta por simplicidad (los nombres
  `.pres-toggle*` ya se usan también para "Mostrar inflación").

## R2 · Etiquetas del interruptor en móvil

- **Decision:** se elimina la regla `@media (max-width: 600px) { .pres-toggle__label { display: none; } }`
  y todos los interruptores muestran su texto también en móvil; además, cada
  input lleva `aria-label` con su texto.
- **Rationale:** con dos interruptores en la misma card (p. ej. "Variación del
  salario mínimo": vista + color por presidente), sin texto no se distinguen.
  `.chart-controls` ya tiene `flex-wrap`, así que el texto cabe en dos renglones.
  `display: none` también borra el nombre accesible del `label`; el `aria-label`
  lo garantiza (UI-12).
- **Alternatives considered:** ocultar texto solo del interruptor de color: deja
  el problema de nombre accesible y crea dos comportamientos.

## R3 · Color por presidente apagado al cargar

- **Decision:** se unifica la implementación. `historico.ts` deja de tener su
  propio `renderToggle()`/`renderLegend()` y la opción `defaultOn`, y usa
  `presToggleHtml()`, `presLeyendaHtml()` y `bindColorPresidente()` de
  `color-presidente.ts` (que ya arrancan apagados). Se elimina
  `bindPresidenteToggle()` de `Chart.astro` (usaba `Plotly.restyle`).
- **Rationale:** hoy hay dos implementaciones del mismo interruptor; la de
  `historico.ts` arranca encendida por defecto (`defaultOn ?? true`) y por eso
  "Inflación histórica" carga coloreada. Con una sola implementación el estado
  inicial apagado queda garantizado para todos (FR-007, SC-002) y se cumple la
  regla de DESIGN-SYSTEM 6.2 de redibujar solo con `ctx.render`.
- **Alternatives considered:** solo cambiar `defaultOn ?? true` por `false`:
  arregla el síntoma pero mantiene la duplicación (viola principio III).
- **Inventario** de gráficos con el interruptor: `inflacion-historica`,
  `pib-historico`, `pib-percapita`, `desempleo-historico`, `comercio-historico`,
  `comercio-impo`, `salario-minimo-historico` (historico.ts);
  `salario-minimo-variacion` (prefijo `smv`), `trm-historica` (`trm`) y
  `reservas-internacionales` (`res`) (externo.ts). En `historico.ts` el prefijo
  será el `chartId`.
  `poblacion-historica` no tiene interruptor (`presidenteToggle: false`).

## R4 · Líneas estadísticas en gris neutro para todo el sitio

- **Decision:** en `charts.ts`, `REF_COLORS` pasa a gris `#64748b` para máximo,
  mínimo y promedio; máximo y mínimo con trazo `dash`, promedio con trazo `dot`.
  `META_BANREP` no cambia (verde, `dot`).
- **Rationale:** todos los gráficos generan sus referencias con
  `lineasReferencia()`; un cambio en el generador aplica a todo el sitio y al
  blog (FR-004a, SC-006) sin tocar recetas.
- **Promedio y meta juntos:** ambos punteados; se distinguen por color (gris vs.
  verde) y etiqueta. La regla de etiquetas combinadas (spec 001) sigue igual; el
  texto combinado ya usa tinta neutra `#475569`.

## R5 · Líneas estadísticas en los cinco gráficos objetivo

| Gráfico | Receta | Cambio | Opciones de `lineasReferencia` |
|---|---|---|---|
| Empleo 01 · `desempleo-historico` | `buildHistorico` | de solo promedio a máx/mín/promedio | `sufijo: "%"`, `decimales: 2` |
| Comercio 01 · `comercio-historico` | `buildHistorico` | nuevas | ídem |
| Comercio 02 · `comercio-impo` | `buildHistorico` | nuevas | ídem |
| Comercio 03 · `comercio-balanza` | `balanzaComercial` | nuevas + conservar línea de cero | `sufijo: "%"`, `decimales: 2` |
| PIB 04 · `deuda-publica` | `deudaPublica` | nuevas + conservar bandas y anotación "Pandemia" | `sufijo: "%"`, `decimales: 1`, `rangoY: [0, 100]` |

- **Decision:** `buildHistorico` reemplaza `promedioOptions` por
  `referencias?: { maximo?: boolean; minimo?: boolean; promedio?: boolean }`
  (todo `false` por defecto) que se pasa tal cual a `lineasReferencia()`; se
  elimina `etiquetaPromedio` ("Promedio histórico") porque la etiqueta es "Prom"
  en todo el sitio;
  `inflacion-historica` usa `{ promedio: true }`. Las recetas de balanza y deuda
  concatenan sus `shapes`/`annotations` existentes con las de referencia.
- **Rationale:** una sola vía para activar referencias (UI-10); los decimales
  replican los del tooltip de cada gráfico; `deuda-publica` fija
  `yaxis.range`, por eso debe pasar `rangoY` (DESIGN-SYSTEM 6.4).
- **Datos de referencia (verificados en `public/data/`):** balanza 66 años,
  mín −7,84 %, máx 4,78 %, promedio −2,14 %; deuda pública 21 años,
  mín 5,4 %, máx 91,16 %, promedio 60,0 %. El promedio de deuda coincide con el
  borde de banda del 60 %: no hay conflicto porque las bandas no llevan etiqueta.
- **Fuera de alcance:** Demografía 03 (esperanza de vida) por decisión del autor.

## R6 · Textos que afirman que el gráfico ya está coloreado

- **Decision:** reescribir la `pregunta` y el `ariaLabel` de las recetas que dicen
  "Coloreado(a) por presidente" para que digan que se puede colorear
  (p. ej. "Activa «Color por presidente» para ver quién gobernaba cada año.").
  `poblacion-historica` no tiene interruptor: se quita la mención.
- **Rationale:** FR-009; el texto debe ser cierto en el estado inicial.
- Se revisan también los `lead` de las páginas del Observatorio con `grep`
  durante la implementación.
