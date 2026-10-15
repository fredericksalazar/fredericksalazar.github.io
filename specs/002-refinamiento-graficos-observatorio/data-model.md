# Data model · Refinamiento gráfico del Observatorio

La feature **no** cambia ningún dataset (`public/data/*.json`) ni su contrato.
Solo cambia cómo se presentan los datos existentes. Las "entidades" son estados
de interfaz y parámetros de recetas.

## Línea estadística (`ReferenceLine` derivada)

| Campo | Valor | Regla |
|---|---|---|
| `etiqueta` | `"Máx"`, `"Mín"`, `"Prom"` | Fija en todo el sitio (FR-004b) |
| `valor` | máximo, mínimo o media aritmética de los valores numéricos finitos de la serie publicada | Sin ventana de años; nulos excluidos (FR-002) |
| `color` | `#64748b` | Igual para las tres (FR-004); etiqueta combinada en `#475569` |
| `estilo` | máx/mín `discontinua` (`dash`); promedio `punteada` (`dot`) | FR-004 |
| Etiqueta visible | `Etiqueta · valor` a la izquierda (`x: 0`) | UI-10; se combina si queda a < 6 % del rango |

**No cambia:** `META_BANREP` (verde `#16a34a`, punteada) ni las referencias
propias de cada gráfico (línea de cero de la balanza, bandas de sostenibilidad de
la deuda).

## Interruptor de vista

| Estado | `checked` | Vista | Anuncio accesible |
|---|---|---|---|
| Inicial | `false` (si `vistas[0] === "linea"`) | Línea | "Ver en barras, interruptor, desactivado" |
| Encendido | `true` | Barras | "…activado" |

Transición: `change` → `ctx.cambiarVista(checked ? "barras" : "linea")` →
redibujo + notificación a `alCambiarVista` (p. ej. mostrar u ocultar "Color por
presidente").

## Interruptor "Color por presidente"

| Estado | `checked` | Barras | Leyenda |
|---|---|---|---|
| Inicial (siempre) | `false` | color por defecto de la receta | oculta (`data-visible="false"`) |
| Encendido | `true` | color por gobierno | visible |

Con `soloEnBarras`: oculto en vista línea; al volver a línea se apaga.

## Opciones de receta

- `buildHistorico(chartId, opts)`:
  - **sale** `defaultOn` (el estado inicial ya no es configurable).
  - **sale** `promedioOptions`; **entra** `referencias?: { maximo?; minimo?; promedio? }`
    (todo `false` por defecto).
  - `presidenteToggle` se mantiene (`false` = sin interruptor).
