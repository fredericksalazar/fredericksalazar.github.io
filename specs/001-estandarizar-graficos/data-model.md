# Data Model · 001 Estandarizar los gráficos de línea

La feature no cambia datos ni datasets JSON. Estas son las entidades de
**configuración** (TypeScript) que se agregan o modifican.

## ChartDef (modificada) · `src/lib/observatorio/chart-defs/types.ts`

| Campo | Tipo | Cambio | Regla |
|---|---|---|---|
| `vistas` | `readonly ("linea" \| "barras")[]` | **Nuevo**, opcional | Si incluye `"barras"`, `Chart.astro` muestra el control Línea \| Barras. La primera vista es la inicial (siempre `"linea"` en esta feature). |
| *(resto)* | — | Sin cambios | — |

## ChartBuildResult (modificada)

| Campo | Tipo | Cambio |
|---|---|---|
| `onMount` | `(target: HTMLElement, ctx: ChartContext) => void` | **Nuevo segundo parámetro** `ctx` (compatible: las recetas existentes que lo ignoran siguen funcionando). |

## ChartContext (nueva)

Contrato entre `Chart.astro` y las recetas que tienen controles propios.

| Miembro | Tipo | Descripción |
|---|---|---|
| `vista()` | `() => Vista` | Vista actual del gráfico |
| `render(trazas, layout?)` | `(unknown[], Record<string, unknown>?) => void` | Redibuja aplicando la vista actual; reemplaza las llamadas directas a `Plotly.react` |
| `alCambiarVista(fn)` | `(fn: (vista: Vista) => void) => void` | Suscribe a la receta a los cambios de vista (p. ej. mostrar el interruptor "Color por presidente" solo en barras) |

**Estado:** cada gráfico guarda su propia vista (`"linea"` al cargar). No se
comparte entre gráficos ni se persiste (supuestos de la spec).

**Transición:** `linea ⇄ barras` por clic en el control; no hay otros estados.

## ReferenceLine (nueva) · `src/lib/observatorio/charts.ts`

Entrada de `lineasReferencia()`.

| Campo | Tipo | Regla |
|---|---|---|
| `etiqueta` | `string` | Texto antes del valor: "Máx", "Promedio", "Mín", "Meta BanRep"… |
| `valor` | `number` | Posición en el eje Y |
| `color` | `string?` | Por defecto el de la sección 6.4; obligatorio para referencias semánticas |
| `estilo` | `"discontinua" \| "punteada"?` | Por defecto discontinua 1,5 px |

**Opciones de `lineasReferencia(valores, opciones)`:** `maximo`, `minimo`,
`promedio` (booleanos, por defecto `true`), `extra: ReferenceLine[]`,
`formato: (v: number) => string` (por defecto es-CO con sufijo), `sufijo`,
`decimales`, `rangoY?: [number, number]` (obligatorio si la receta fija
`yaxis.range`).

**Constante única `META_BANREP`** (exportada desde `charts.ts`; ninguna receta
redefine la meta):
`{ etiqueta: "Meta BanRep", valor: 3, color: "#16a34a", estilo: "punteada" }`.
Verde porque representa la zona sana (coherente con la banda de meta de
DESIGN-SYSTEM 6.3); punteada para distinguirla del Mín, que también es verde pero
discontinuo. La identidad nunca depende solo del color: también la dan el trazo y
la etiqueta.

**Salida:** `{ shapes, annotations }` listas para `baseLayout()`.

**Reglas de validación** (de la spec):
- Toda anotación: `xref: "paper"`, `x: 0`, `xanchor: "left"` (FR-001).
- Texto `Etiqueta · valor` en es-CO (FR-002).
- Si dos referencias distan menos del 6 % del **rango visible del eje Y** (`rangoY`
  si se pasa; si no, máximo − mínimo de los valores y de las referencias), se
  emite **una** anotación combinada `Etiqueta1 · v1 · Etiqueta2 · v2`; ambas
  líneas se siguen dibujando (FR-003, aclaración Q2).
- Valores `null` se ignoran; sin valores no se emite nada.
