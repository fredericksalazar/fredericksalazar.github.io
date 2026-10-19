# Research · 005 Landing page del Observatorio

Fase 0 del plan. Resuelve las incógnitas técnicas de la spec. Cada decisión sigue
el formato *Decisión → Razón → Alternativas descartadas*.

## R1 · Mover el dashboard de inflación a `/observatorio/inflacion/`

- **Decisión:** el contenido actual de `src/pages/observatorio/index.astro` se
  mueve sin cambios de fondo a `src/pages/observatorio/inflacion.astro`. La nueva
  Home ocupa `index.astro`. No se crea página de redirección: `/observatorio/`
  sigue existiendo (ahora es la Home) y lleva inflación en el primer bloque, con
  enlace directo al dashboard (FR-001a).
- **Razón:** GitHub Pages no admite redirecciones 301 (ARQUITECTURA, sección 9).
  Como la URL antigua no desaparece, no hay enlaces externos rotos: quien llega
  buscando inflación la encuentra en la Home a un clic. `/observatorio/` conserva
  su autoridad acumulada, y `/observatorio/inflacion/` entra al sitemap como URL
  nueva y se notifica con IndexNow en el deploy.
- **Alternativas descartadas:**
  - Una página `noindex` con meta refresh (patrón de `elecciones-presidenciales/`):
    no aplica, porque la URL de origen ahora tiene contenido propio.
  - Dejar la Home en otra URL: el autor eligió la opción A en la clarificación.

## R2 · Enlaces internos afectados por el cambio

Inventario (`grep` sobre `src/`) de los enlaces que hoy apuntan a `/observatorio/`:

| Tipo | Ubicación | Acción |
|---|---|---|
| Menú del Observatorio | `DashboardNav.astro` (ítem `inflacion-tasa` → `urls.observatorio()`) | Nuevo ítem "Inicio" → `urls.observatorio()`; "Inflación vs Tasa" → `urls.observatorioSub('inflacion')` |
| Posts que dicen "dashboard de inflación y tasas" | `inflacion-tasas-interes-colombia-{junio,agosto,septiembre}-2026.mdx` (línea ~100) | Cambiar a `/observatorio/inflacion/` |
| Posts que dicen "Observatorio de Datos de Colombia" (genérico) | comparativos, dólar, inflación (intro y metodología) | **Se mantienen**: ahora apuntan correctamente a la Home |
| Informe "historia de Colombia" | botón "Explorar el dashboard en vivo" | Se mantiene → Home |
| Sidebar, Footer, 404, inicio del sitio, calculadoras, `acerca` | `urls.observatorio()` | Se mantienen → Home (es lo que el texto promete) |
| JSON-LD del dashboard de inflación | `url` y `mainEntityOfPage` escritos a mano | Pasar a `absUrls.observatorioSub('inflacion')` (ARQ-03) |
| Página `informe` de `historia-de-colombia`, `informes/index` | `publisher`/`isPartOf` → `absUrls.observatorio()` | Se mantienen |
| Skill `publicar-informe-inflacion` | No fija la URL del dashboard; los posts mensuales la copian del post anterior | Agregar a la skill la instrucción explícita de enlazar el dashboard en `/observatorio/inflacion/`. Ojo: `.claude/` está en `.gitignore`, así que este cambio es local del autor |

El link-checker de `npm run build` valida que no quede ningún enlace roto.

## R3 · Panel de indicadores clave: qué indicadores y de qué dataset

Se eligen 8 indicadores con dato no nulo, agrupados según los referentes
(BanRep: real, financiero, externo; UK: crecimiento, precios, mercado laboral,
comercio y tasa de cambio):

| Grupo | Indicador | Dataset · campo | Periodicidad | Dominio (enlace) |
|---|---|---|---|---|
| Precios y dinero | Inflación anual | `inflacion` · `inflacion_anual` | mensual | `/observatorio/inflacion/` |
| Precios y dinero | Tasa de intervención BanRep | `inflacion` · `tasa_interes` | mensual | `/observatorio/inflacion/` |
| Actividad y bienestar | Crecimiento del PIB | `pib` · `crecimiento_pib` | anual | `/observatorio/pib/` |
| Actividad y bienestar | PIB per cápita | `pib` · `pib_percapita` | anual | `/observatorio/pib/` |
| Empleo | Tasa de desempleo | `empleo` · `tasa_desempleo` | mensual | `/observatorio/empleo/` |
| Sector externo | Dólar (TRM) | `externo` · `trm` | mensual | `/observatorio/monetario/` |
| Sector externo | Cuenta corriente (% PIB) | `externo` · `cuenta_corriente` | anual | `/observatorio/monetario/` |
| Contexto | Salario mínimo | `salario-minimo` · `salario_minimo` | anual | `/calculadoras/sueldo-vs-inflacion/` |

- **Hallazgo de datos:** en `data_comercio.json`, `balanza_comercial` está
  definida como "cuenta corriente del Banco Mundial" y vale lo mismo que
  `externo.cuenta_corriente` (−2,41 % en 2025). Para no mostrar dos veces el mismo
  dato con nombres distintos, la Home usa **cuenta corriente** (de `externo`) con
  su nombre real. Se avisa al autor para revisar la etiqueta en el pipeline; no se
  corrige en esta feature.
- **Periodicidad por indicador, no por dataset:** `data_externo.json` declara
  `granularidad: "mensual"`, pero mezcla la TRM (mensual) con la cuenta corriente
  (anual, último dato 2025-12); en sus últimas 24 filas la cuenta corriente solo
  tiene 2 valores no nulos. Además, `data_inflacion.json` y `data_pib.json` no
  declaran `granularidad`. Por eso cada indicador del catálogo declara su
  `periodicidad` (columna "Periodicidad" de la tabla), y tanto la frescura (R8)
  como la sparkline (R5) la leen de ahí.
- **Excluidos:** informalidad (valor `null`), sector fiscal (sin dataset), PIB
  trimestral (no publicado). Población queda en el hero como cifra de contexto,
  no en el panel.

## R4 · Referencia objetiva por indicador (FR-006, clarificación Q2)

- **Decisión:** cada indicador declara un tipo de referencia, sin juicios de valor:

| Tipo | Se aplica a | Cálculo | Frase |
|---|---|---|---|
| `meta-oficial` | Inflación anual | `META_BANREP` (3 %) y una constante nueva `RANGO_META_BANREP` (2–4 %) en `charts.ts`, que también reemplaza los 2 y 4 sueltos de `chart-defs/inflacion.ts` (ARQ-19) | "por encima / dentro / por debajo del rango meta del BanRep (2–4 %)" |
| `promedio-20a` | Tasa BanRep, desempleo, crecimiento PIB, cuenta corriente | Promedio de los valores no nulos de los últimos 20 años de la serie publicada | "por encima / en línea con / por debajo de su promedio de 20 años (X)" |
| `hace-un-ano` | TRM, PIB per cápita, salario mínimo | Valor del mismo periodo del año anterior en la serie | "X % más alto / más bajo que hace un año" |

- **Razón:** las series nominales (TRM en COP, PIB per cápita en USD corrientes,
  salario mínimo en COP) tienen tendencia, y su promedio histórico no es una
  referencia útil; la comparación anual sí lo es. Una ventana fija de 20 años hace
  comparables los datasets (inflación arranca en 2004; PIB en 1960) y evita que
  décadas con otra estructura económica distorsionen el promedio. "En línea con" se
  usa cuando la diferencia es menor al 5 % del promedio.
- **Dónde vive:** una función pura nueva en `derivations.ts`
  (`referenciaIndicador`), usada en build (REGLA 10).
- **Alternativas descartadas:** promedio de toda la serie (mezcla épocas);
  semáforo (lo descartó el autor en Q2).

## R5 · Mini tendencias (sparklines)

- **Decisión:** una fábrica `makeSparkline({ dataset, campo, … })` en
  `chart-defs/sparkline.ts` genera un `ChartDef` por indicador (patrón de
  `makeComparativoSet`, ARQ-19). Las series se cargan por `data-client.ts` en
  runtime (REGLAS 2 y 8) y se dibujan con Plotly ya cargado por el único
  `<PlotlyLoader />`, en modo estático (`staticPlot`, sin ejes ni barra de
  herramientas). Ventana: últimos 24 periodos (mensual) o 20 años (anual). Color:
  **azul de marca** (`COLORS.brand`), elegido por el autor. Para el contenedor
  ligero se agrega una variante `variant="sparkline"` a `Chart.astro` (sin card,
  título ni fuente propios, porque la tarjeta del indicador ya los muestra).
- **Razón:** reutiliza el sistema de gráficos existente (ChartDef, data-client,
  plotly-mount) sin dependencias nuevas, y respeta la regla de no incrustar
  series en el HTML.
- **Ventana por valores, no por filas:** la sparkline descarta los nulos y toma
  los últimos 24 **valores** (periodicidad mensual) o los últimos 20 (anual),
  según la `periodicidad` del indicador. Así la cuenta corriente, anual dentro de
  una serie mensual, muestra 20 años y no solo 2 puntos.
- **Excepciones que requieren aprobación del autor** (ver Complexity Tracking del
  plan):
  - **UI-08** (interruptor Línea ↔ Barras): no aplica a una micrográfica de 48 px
    sin ejes.
  - **UI-07** (gráfico en card): la sparkline vive dentro de la tarjeta del
    indicador, que es la card.
- **Alternativas descartadas:**
  - SVG generado en build: incrusta la serie en el HTML (viola REGLA 2).
  - Componente SVG propio en cliente: duplica el ciclo de vida de los gráficos
    (anti-patrón de la sección 9 del documento del Observatorio).
  - Sin sparklines: los referentes (tarjeta con tendencia de 24 periodos)
    muestran que la tendencia es clave para leer el dato de un vistazo.

## R6 · Tarjeta de indicador sin juicio de valor

- **Decisión:** se crea `IndicadorClaveCard.astro` (componente nuevo, se agrega al
  catálogo de DESIGN-SYSTEM). Muestra nombre, valor, unidad, periodo, cambio
  descriptivo (↑ / ↓ / → y su magnitud en gris neutro), frase de referencia,
  explicación de una línea, fuente y enlace al dominio, y un hueco para la
  sparkline.
- **Razón:** `IndicadorCard` colorea el cambio con `variacionClass` según
  semántica (verde = bueno, rojo = malo), lo que contradice Q2. Extenderlo con un
  modo neutral obligaría a cambiar el componente que ya usan seis dashboards y
  aun así le faltarían referencia, explicación, fuente y enlace.
- **Alternativa descartada:** agregar `semantic="neutral"` a `IndicadorCard`: se
  retoma en el futuro si los dashboards adoptan el mismo criterio neutral.

## R7 · Resumen automático en una frase (FR-003)

- **Decisión:** función pura `resumenEconomia(indicadores)` en `lib/observatorio/home.ts`
  que arma 1–2 frases con plantillas fijas a partir de los valores y referencias
  (p. ej. "La inflación está en 6,28 % (sep. 2026), por encima del rango meta del
  BanRep; el desempleo, en 9,36 % (ago. 2026), está por debajo de su promedio de
  20 años"). Cada cifra lleva su periodo.
- **Razón:** determinismo y cero cifras escritas a mano (la misma filosofía que
  `extract-inflacion-facts.mjs`).

## R8 · Frescura (FR-018, K6)

- **Decisión:** `estadoFrescura(ultimoPeriodo, periodicidad, fechaBuild)` en
  `home.ts`: "no reciente" si han pasado más de 45 días desde el cierre del mes
  siguiente al periodo (series mensuales; el DANE publica con ~1 mes de rezago) o
  más de 15 meses desde el cierre del año (series anuales). Se evalúa en cada
  build, y el deploy ocurre con cada actualización del pipeline.
- **Razón:** el sitio es estático; la frescura se calcula cuando se genera la
  página.

## R9 · Publicaciones recientes (FR-011)

- **Decisión:** se combinan el catálogo `INFORMES` (`informes.ts`) y los posts de
  la colección `blog` que tengan alguna de las etiquetas de
  `ETIQUETAS_OBSERVATORIO = ["Observatorio de Datos", "Banco Mundial"]` (sin
  importar mayúsculas ni tildes), sin borradores, ordenados por fecha; se
  muestran los 4 más recientes.
- **Razón:** la skill `publicar-informe-inflacion` ya pone "Observatorio de Datos"
  a cada informe mensual (y el post del dólar también la lleva), y los 5
  comparativos "Colombia vs rival" llevan "Banco Mundial", etiqueta que ningún
  otro post usa hoy (verificado el 2026-10-19). Así la Home se actualiza sola con
  todo el cluster "Colombia en datos". Las etiquetas viven en una constante para
  cambiarlas en un solo lugar.

## R10 · SEO y datos estructurados (FR-014 a FR-016)

- **Decisión:**
  - `title`: "Indicadores económicos de Colombia hoy · Observatorio" (≤ 60).
  - `description` (≤ 160): "Inflación, tasa BanRep, desempleo, PIB y dólar en
    Colombia: los indicadores clave del país en un vistazo, con fuente oficial y
    actualización automática."
  - JSON-LD `DataCatalog` con un `Dataset` por cada JSON publicado (nombre,
    descripción, `creator` = `personSchema`, `license` CC BY 4.0,
    `temporalCoverage`, `dateModified`, `distribution` `DataDownload` JSON), más
    `WebPage`. Se genera con una función nueva en `lib/seo.ts` (ARQ-04).
  - El JSON-LD `Dataset` + `Article` de inflación se queda en
    `/observatorio/inflacion/`.
  - `llms.txt`: nueva línea "Observatorio de Datos" → Home.
  - og:image: PNG 1200×630 propio (`/images/observatorio-home.png`), generado con
    el mismo estilo de portada (ARQ-10).
  - Migas: la Home es la raíz `sectionCrumb.observatorio` (sin cambios); el
    dashboard de inflación agrega un eslabón "Inflación y tasas".
- **Razón:** Google recomienda `DataCatalog` + `Dataset` para portales de datos
  (Dataset Search).

## R10b · Helper de URL para los datos abiertos

- **Decisión:** agregar `urls.dataset(nombre)` (`/data/data_<nombre>.json`, sin
  barra final porque es un archivo real) y `absUrls.dataset(nombre)` en
  `src/lib/urls.ts`. Se usan en el JSON-LD (`distribution.contentUrl`), en la
  sección de confianza y en el dashboard de inflación movido.
- **Razón:** ARQ-03 exige que toda ruta interna salga de `urls.ts`; si el helper
  no existe, se agrega ahí.

## R11 · Rendimiento (SC-006)

- **Decisión:** todo el contenido de valor se genera en build (HTML estático). Las
  8 sparklines usan Plotly `basic`, que ya cachean las otras páginas del
  Observatorio, y se cargan después del contenido principal. El mapa del hero es
  SVG decorativo existente.
- **Verificación:** auditoría Lighthouse móvil sobre `npm run preview`
  (quickstart).
