# Data Model: Rediseño de los indicadores clave del Observatorio

**Feature**: `008-rediseno-kpis-observatorio` · **Date**: 2026-11-10 · **Plan**: [plan.md](./plan.md)

Esta feature **no agrega ni modifica datos** (spec FR-019, SC-010). El modelo
describe: (1) las extensiones del catálogo de indicadores, (2) las derivaciones
puras que necesita la nueva presentación y (3) el estado de la lectura
sincronizada. Ninguna cifra vive en el catálogo (ARQ-02).

## 1. Catálogo de indicadores clave (`INDICADORES_CLAVE`)

### 1.1 Cambios al tipo `IndicadorClaveDef`

| Campo | Estado | Descripción |
| --- | --- | --- |
| `forma` | **Nuevo** | `FormaGrafico`: `"linea"`, `"escalon"` o `"barras"`. Metadata de presentación. |
| `desdeCero` | **Nuevo** (opcional) | `true` si el eje Y debe partir de cero (solo el salario mínimo; las barras ya parten de cero). |
| `grupo` | **Retirado** | Solo lo consumía la pill de grupo que se elimina. Se conserva si una búsqueda previa encuentra otro uso. |
| `periodicidad` | Se conserva | Pasa a ser el criterio de agrupación en filas (`"mensual"` → "Cada mes", `"anual"` → "Cada año"). |
| `id`, `nombre`, `dataset`, `campo`, `comparacion`, `referencia`, `explicacion`, `fuenteKey`, `href`, `destino` | Se conservan | Sin cambios de valor. |

`GRUPOS` y `GrupoIndicador` se retiran con `grupo` (R8 de `research.md`).

### 1.2 Los 8 indicadores (valores vigentes del catálogo + `forma` nueva)

| Orden | `id` | Dataset · campo | Fila | Comparación | Referencia | `forma` |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `inflacion-anual` | `inflacion` · `inflacion_anual` | Cada mes | anterior | `meta-oficial` | `linea` |
| 2 | `tasa-banrep` | `inflacion` · `tasa_interes` | Cada mes | anterior | `promedio-20a` | `escalon` |
| 3 | `desempleo` | `empleo` · `tasa_desempleo` | Cada mes | interanual | `promedio-20a` | `linea` |
| 4 | `trm` | `externo` · `trm` | Cada mes | anterior | `hace-un-ano` | `linea` |
| 5 | `crecimiento-pib` | `pib` · `crecimiento_pib` | Cada año | anterior | `promedio-20a` | `barras` |
| 6 | `pib-percapita` | `pib` · `pib_percapita` | Cada año | anterior | `hace-un-ano` | `linea` |
| 7 | `cuenta-corriente` | `externo` · `cuenta_corriente` | Cada año | anterior | `promedio-20a` | `barras` |
| 8 | `salario-minimo` | `salario-minimo` · `salario_minimo` | Cada año | anterior | `hace-un-ano` | `escalon` + `desdeCero` |

El orden dentro de cada fila conserva el orden relativo actual del catálogo, que ya
coincide con el de la spec (FR-002).

### 1.3 `IndicadorClave` (derivado en build)

Sin cambios de forma: `valor`, `unidad`, `periodo`, `delta`, `variacion`,
`referencia` (`ReferenciaCalculada`), `fuente`, `frescura`, `periodoComparado`,
`periodoInicioVentana`. Se sigue produciendo con `buildIndicadoresClave()`.

## 2. Entidades de presentación

### 2.1 Forma del gráfico (`FormaGrafico`)

| Valor | Representa | Reglas |
| --- | --- | --- |
| `linea` | Nivel o tasa que varía de forma continua | Línea recta con área hasta la base. |
| `escalon` | Valor que cambia por decisión | Escalón centrado entre puntos; con `desdeCero` el eje parte de 0. |
| `barras` | Tasa con signo o saldo | Barras desde la línea de cero; la última barra en azul pleno, las demás tenues. |

### 2.2 Referencia dibujada

Se deriva de `IndicadorClave.referencia` (ya calculada por `referenciaIndicador()`):

| `referencia.tipo` | Elementos dibujados | Rótulo | Color |
| --- | --- | --- | --- |
| `meta-oficial` | Banda entre `RANGO_META_BANREP.min` y `.max` más dos líneas punteadas | "Rango meta BanRep · 2–4 %" | Verde de meta del sistema (`COLORS.metaBanda`, `META_BANREP.color`) |
| `promedio-20a` | Línea punteada en `referencia.valorReferencia` | "Prom 20 años · {valor}" | Gris neutro (`--color-chart-reference`) |
| `hace-un-ano` | Línea punteada en `referencia.valorReferencia` y marcador hueco en el mismo periodo del año anterior | "Hace un año · {valor}" | Gris neutro |

Si `valorReferencia` es `null` ("Sin promedio de referencia"), no se dibuja
referencia ni rótulo.

### 2.3 Fila de indicadores (`FilaIndicadores`)

| Atributo | Descripción |
| --- | --- |
| `ritmo` | `"mensual"` o `"anual"`; igual a `periodicidad` de sus 4 indicadores. |
| `titulo` | "Cada mes" o "Cada año". |
| `indicadores` | Los 4 `IndicadorClave` con esa `periodicidad`, en orden del catálogo. |
| `ejeCompartido` | Lista ordenada de periodos (ver 3.1). |
| `ventanaTexto` | "Últimos 24 meses de cada serie sobre un mismo eje, {desde} — {hasta}" (mensual) o "Últimos 20 años …" (anual). |

### 2.4 Geometría del gráfico (`GeometriaGrafico`)

Publicada por cada `ChartDef` al módulo de lectura; es lo que permite traducir el
puntero a un periodo sin APIs internas de Plotly.

| Campo | Descripción |
| --- | --- |
| `margen` | `{ l, r, t, b }` en px, fijos por forma. |
| `rangoX` | `[inicio, fin]` ISO: primer y último periodo del eje compartido ± medio paso. |
| `rangoY` | `[mín, máx]` con serie, referencias y 0 (si aplica), más 8 % de holgura. |
| `periodos` | El eje compartido de la fila. |
| `serie` | Mapa `periodo → valor` propio del indicador (ventana de 24 meses o 20 años, sin nulos). |
| `periodoVigente` | `IndicadorClave.periodo`. |

### 2.5 Detalle de la tarjeta

Sus campos salen todos de lo que la tarjeta ya conoce:

| Campo del detalle | Fuente |
| --- | --- |
| Explicación en lenguaje sencillo | `def.explicacion` |
| Frase de posición frente a la referencia | `referencia.frase` |
| Nombre oficial de la fuente (enlace) | `fuente.nombre`, `fuente.url` |
| Indicador medido | `fuente.indicador` |
| Fecha de corte | `periodo` formateado |
| Ventana de la serie | `periodoInicioVentana` — `periodo` |
| Enlace al dashboard | `def.href`, `def.destino` |

Si `fuente` es `null`, el `summary` se rotula "Detalle" y la implementación emite
una advertencia de build (el panel sigue sin inventar la fuente).

## 3. Derivaciones puras (en `derivations.ts` y `home.ts`)

### 3.1 `ejeCompartido(indicadores, periodicidad)`

Entrada: los indicadores de una fila con sus ventanas. Salida: lista de periodos.

- `inicio` = el menor `periodoInicioVentana` de la fila.
- `fin` = el mayor `periodo` de la fila.
- Paso: 1 mes (`mensual`) o 1 año (`anual`; el pipeline fecha los anuales en
  diciembre).
- Resultado inclusivo de `inicio` a `fin`.

*Ejemplo con los datos actuales (a modo de verificación, no de especificación):* la
fila mensual abarca de Oct 2024 (desempleo) a Nov 2026 (dólar); la anual, de 2006
(series del Banco Mundial) a 2026 (salario mínimo, que empieza en 2007).

### 3.2 `lecturaEnPeriodo(geometria, periodo)`

Salida por tarjeta para un periodo del eje compartido:

| Caso | Resultado |
| --- | --- |
| El periodo está en `serie` | `{ tipo: "dato", valor, periodo }` |
| El periodo es posterior a `periodoVigente` | `{ tipo: "sin-publicar" }` → "—" y "Aún sin dato publicado para esta fecha" |
| El periodo es anterior a la ventana de la serie | `{ tipo: "fuera-de-ventana" }` → "—" y "Fuera de la ventana de esta serie" |
| El periodo es el vigente | `{ tipo: "vigente", valor }` → "Es el dato vigente" |

### 3.3 `nombreCortoFuente(fuente)`

Texto de `fuente.nombre` antes del primer " — "; si no hay separador, el nombre
completo.

### 3.4 Reglas de formato (es-CO, ya existentes)

`formatIndicador`, `formatCambio` y `formatPeriodoIndicador` de `home.ts` se
reutilizan tal cual para el valor, el cambio y los periodos, también durante la
lectura. La dirección ("Subió", "Bajó", "Sin cambio") sigue siendo descriptiva y sin
color de juicio (FR-008).

## 4. Estado de la lectura sincronizada

Una por fila (`FilaIndicadores`), en el cliente.

```text
            puntero/toque/tecla sobre un gráfico
   ┌────────┐  ───────────────────────────────►  ┌───────────────┐
   │ reposo │                                    │ leyendo(i)    │ ◄─┐ mover puntero /
   │ (null) │  ◄───────────────────────────────  │ i = índice en │ ──┘ flechas / Inicio / Fin
   └────────┘   salir del gráfico (ratón),       │ el eje común  │
                perder foco, Escape, o 2,5 s      └───────────────┘
                tras soltar (táctil)
```

| Estado | Qué muestra cada tarjeta de la fila |
| --- | --- |
| `reposo` | Valor, periodo y cambio vigentes (los del HTML inicial). |
| `leyendo(i)` | Valor y periodo del periodo `i` (o "—" y su causa), cursor visible. |

Reglas:

- El estado es **de la fila**: cambiar `i` actualiza las 4 tarjetas a la vez.
- Al entrar a `leyendo`, el módulo guarda el contenido inicial de cada tarjeta y lo
  restaura al volver a `reposo` (el HTML inicial es la fuente del estado de reposo).
- El teclado recorre los puntos de la **serie propia** del gráfico enfocado; las
  demás tarjetas siguen su periodo.
- Un cambio de tema (re-render) devuelve la fila a `reposo`.

## 5. Validaciones transversales (de la spec)

| Regla | Origen | Cómo se comprueba |
| --- | --- | --- |
| Toda cifra proviene de los datasets | FR-019 | `quickstart.md`: comparar DOM contra `public/data/*.json`. |
| Frescura | FR-018 | `estadoFrescura()` ya existente; etiqueta junto al periodo. |
| Sin dato → omitir o "sin dato" | FR-021 | `buildIndicadoresClave()` ya omite indicadores con valor `null`. |
| Referencia sin juicio de valor | FR-026 | Revisión visual: solo la banda meta lleva color propio. |
