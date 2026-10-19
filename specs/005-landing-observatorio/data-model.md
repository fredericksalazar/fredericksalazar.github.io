# Data model · 005 Landing page del Observatorio

Ninguna entidad agrega campos a los JSON publicados: todas se **derivan en
build** de `public/data/*.json` (vía `lib/observatorio/data.ts`) o son **catálogos
de metadata** sin cifras (permitidos por ARQ-02, como `informes.ts`).

## 1. `IndicadorClaveDef` (catálogo, sin cifras)

Vive en `src/lib/observatorio/home.ts`. Declara qué mostrar y cómo, nunca el
valor.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `string` kebab-case | Único; también es el sufijo del `ChartDef` de la sparkline (`spark-<id>`) |
| `grupo` | `"precios" \| "actividad" \| "empleo" \| "externo" \| "contexto"` | Orden fijo de grupos en la Home |
| `nombre` | `string` | Lenguaje sencillo (p. ej. "Dólar (TRM)") |
| `dataset` | `DatasetName` | Uno de los existentes en `data-client.ts` |
| `campo` | `string` | Clave en `indicadores` **y** en `serie` del dataset |
| `periodicidad` | `"mensual" \| "anual"` | **Obligatorio.** Se declara por indicador, no se lee del dataset (`externo` mezcla ambas; `inflacion` y `pib` no declaran `granularidad`). Lo usan `estadoFrescura` y `makeSparkline` (research R3, R5, R8) |
| `comparacion` | `"anterior" \| "interanual"` | Contra qué periodo calcula el pipeline el `delta`. Verificado el 2026-10-19: solo `empleo.tasa_desempleo` es interanual (mismo mes del año anterior); el resto compara con el periodo anterior. Define el texto "frente a {periodo}" |
| `referencia` | `"meta-oficial" \| "promedio-20a" \| "hace-un-ano"` | Ver research R4 |
| `explicacion` | `string` ≤ 110 caracteres | Qué significa el número para una persona no experta; sin cifras |
| `fuenteKey` | `string` | Clave de `metadata.fuentes` del dataset |
| `href` | `string` | Siempre construido con `urls.*` (ARQ-03) |

**Validación:** `astro check` tipa `dataset` y `campo`; un test de humo en build
(en `home.ts`) lanza un error si `campo` no existe en el dataset, para que el
build falle en lugar de mostrar un 0.

## 2. `IndicadorClave` (derivado en build)

Resultado de `buildIndicadoresClave()`: une cada definición con su dataset.

| Campo | Origen |
|---|---|
| `def` | `IndicadorClaveDef` |
| `valor`, `unidad`, `periodo`, `delta`, `variacion` | `dataset.indicadores[campo]` |
| `referencia` | `{ tipo, valorReferencia, posicion: "arriba" \| "en-linea" \| "abajo" \| "dentro", frase }`, calculada por `referenciaIndicador()` en `derivations.ts` |
| `fuente` | `dataset.metadata.fuentes[fuenteKey]` |
| `frescura` | `"reciente" \| "no-reciente"` por `estadoFrescura(periodo, def.periodicidad)` |

**Reglas:**
- `valor === null` → el indicador **no se renderiza** y se registra un
  `console.warn` en build (FR-018, caso de borde).
- `frescura === "no-reciente"` → la tarjeta muestra la etiqueta "Dato no reciente".
- `posicion` nunca se traduce a color: solo a texto (Q2).

**Transiciones de `frescura`:** `reciente` → `no-reciente` cuando la fecha de build
supera el umbral (R8); vuelve a `reciente` cuando el pipeline publica un periodo
nuevo y se redespliega el sitio.

## 3. `DominioObservatorio` (catálogo + derivado)

| Campo | Tipo / origen |
|---|---|
| `slug` | `"inflacion" \| "empleo" \| "comercio" \| "monetario" \| "pib" \| "demografia"` + accesos `informes`, `elecciones`, `calculadoras` |
| `nombre`, `descripcion` (1 línea) | Catálogo en `home.ts` |
| `datoEstrella` | `{ nombre, valorFormateado, periodo, fuente }` desde un campo de `indicadores` y `metadata.fuentes` del dataset (derivado). Siempre con periodo y fuente (constitución, principio II) |
| `ultimaActualizacion` | `metadata.ultima_actualizacion` del dataset (derivado) |
| `href` | `urls.observatorioSub(slug)`, `urls.elecciones(...)`, `urls.calculadoras()` |

**Fuente única:** `DashboardNav.astro` y la sección de dominios de la Home leen la
misma lista `DOMINIOS` de `home.ts` (ARQ-19), para que el menú y la Home no se
desincronicen.

## 4. `PublicacionReciente` (derivado)

| Campo | Origen |
|---|---|
| `tipo` | `"informe" \| "articulo"` |
| `titulo`, `fecha`, `href`, `descripcion` | `INFORMES` (`informes.ts`) o la colección `blog` con alguna etiqueta de `ETIQUETAS_OBSERVATORIO = ["Observatorio de Datos", "Banco Mundial"]` (comparación sin mayúsculas ni tildes) y `draft !== true` |

Orden: fecha descendente. Límite: 4.

## 5. `ResumenEconomia` (derivado)

`resumenEconomia(indicadores: IndicadorClave[]) → string[]` (1–2 frases).
Plantillas fijas; cada cifra va con su periodo (`formatPeriodoCorto`); omite los
indicadores ausentes o no recientes.

## 6. `DatasetPublicado` → JSON-LD

`catalogoSchema(datasets)` en `lib/seo.ts` produce un `DataCatalog` con un
`Dataset` por cada JSON del Observatorio (`inflacion`, `empleo`, `pib`,
`comercio`, `externo`, `demografia`, `salario_minimo`):

| Propiedad schema.org | Origen |
|---|---|
| `name`, `description` | Catálogo de nombres en `home.ts` |
| `temporalCoverage` | `cobertura.primer_periodo/ultimo_periodo` |
| `dateModified` | `metadata.ultima_actualizacion` |
| `isBasedOn` | `metadata.fuentes[*]` (nombre + url) |
| `distribution.contentUrl` | `absUrls.dataset(nombre)` (helper nuevo en `urls.ts`, research R10b) |
| `creator` | `personSchema` |
| `license` | `https://creativecommons.org/licenses/by/4.0/` |
| `spatialCoverage` | Colombia |
