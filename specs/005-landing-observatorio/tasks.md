---

description: "Tareas de implementación de la Home del Observatorio de Datos de Colombia"
---

# Tasks: Landing page (Home) del Observatorio de Datos de Colombia

**Input**: Design documents from `/specs/005-landing-observatorio/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/home-page.md, quickstart.md

**Tests**: La spec no pide tests automatizados (y no hay suite para `lib/`, deuda conocida). La verificación es la de [quickstart.md](./quickstart.md): `npx astro check`, `npm run build` con link-checker, revisión visual y Lighthouse.

**Organization**: Tareas agrupadas por historia de usuario (US1–US5 de spec.md).

**Reglas que aplican a TODAS las tareas** (constitución y `agents/`):
- Ninguna cifra escrita a mano en `.astro`/`.ts` (ARQ-02); todo sale de `public/data/*.json`.
- Enlaces internos solo con `urls.*` / `absUrls.*` de `src/lib/urls.ts` (ARQ-03).
- Solo tokens de DESIGN-SYSTEM sección 2 (UI-01); cambio y referencia en gris neutro, **nunca** rojo/verde (clarificación Q2).
- Series de gráficos solo vía `data-client.ts` (REGLAS 2 y 8); un solo `<PlotlyLoader />` por página.
- Texto en español es-CO. Git lo administra el autor: no crear ramas, commits ni push.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ir en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: Historia de usuario (US1…US5)

---

## Phase 1: Setup (línea base)

**Purpose**: Registrar el estado de partida para poder decir luego "sin errores nuevos".

- [X] T001 Ejecutar `npx astro check` y `npm run build` en la raíz del repo y anotar en `specs/005-landing-observatorio/tasks.md` (sección Notes, al final) el número de errores/avisos de partida y que el link-checker pasa

---

## Phase 2: Foundational (prerrequisitos que bloquean todo)

**Purpose**: Liberar `/observatorio/` moviendo el dashboard de inflación (FR-001, FR-001a, research R1–R2) y crear la base de lógica que usan todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede empezar antes de terminar esta fase.

- [X] T002 Crear `src/pages/observatorio/inflacion.astro` copiando íntegro el contenido actual de `src/pages/observatorio/index.astro` (mismo Hero, `DashboardNav active="inflacion-tasa"`, paneles, glosario, footer, JSON-LD)
- [X] T003 Agregar a `src/lib/urls.ts` los helpers `urls.dataset(nombre)` → `/data/data_<nombre>.json` (archivo real, sin barra final) y `absUrls.dataset(nombre)` (research R10b). Luego, en `src/pages/observatorio/inflacion.astro`: cambiar `breadcrumbs` a `trail(sectionCrumb.observatorio, { name: 'Inflación y tasas', url: absUrls.observatorioSub('inflacion') })`, reemplazar las URLs escritas a mano del JSON-LD (`url`, `mainEntityOfPage`) por `absUrls.observatorioSub('inflacion')` y `distribution.contentUrl` por `absUrls.dataset('inflacion')`
- [X] T004 Reemplazar temporalmente `src/pages/observatorio/index.astro` por un esqueleto mínimo de la Home (`BaseLayout` + `Hero` con `MapaColombia` + `DashboardNav active="inicio"` + enlace a `urls.observatorioSub('inflacion')`) para que el build no se rompa mientras se implementa US1
- [X] T005 Crear `src/lib/observatorio/home.ts` con los tipos `IndicadorClaveDef`, `IndicadorClave`, `DominioObservatorio`, `PublicacionReciente` según data-model.md, y la constante `DOMINIOS` (catálogo sin cifras): Inicio (`urls.observatorio()`), Inflación vs Tasa (`urls.observatorioSub('inflacion')`, slug `inflacion-tasa`), Empleo, Comercio Exterior, Monetario, PIB, Demografía, Informes (`urls.observatorioInformes()`), Acerca; más los accesos extra de la Home Elecciones (`urls.elecciones('2026-segunda-vuelta')`) y Calculadoras (`urls.calculadoras()`), cada uno con `nombre`, `descripcion` de una línea y un flag `enMenu`
- [X] T006 Modificar `src/components/observatorio/DashboardNav.astro` para que construya su lista desde `DOMINIOS` de `home.ts` (solo `enMenu: true`), con "Inicio" como primer ítem (`slug: "inicio"`); conservar intacto el marcado y los estilos actuales
- [X] T007 [P] Actualizar el enlace "dashboard de inflación y tasas del Observatorio" de `/observatorio/` a `/observatorio/inflacion/` en `src/content/blog/inflacion-tasas-interes-colombia-junio-2026.mdx`, `src/content/blog/inflacion-tasas-interes-colombia-agosto-2026.mdx` y `src/content/blog/inflacion-tasas-interes-colombia-septiembre-2026.mdx` (solo esa frase; los enlaces genéricos "Observatorio de Datos de Colombia" se quedan apuntando a la Home, research R2)
- [X] T008 [P] Agregar a `src/lib/observatorio/derivations.ts` las funciones puras `promedioVentana(serie, campo, anios = 20)` (promedio de valores no nulos de los últimos 20 años desde el último periodo), `valorHaceUnAno(serie, campo)` (valor del mismo mes del año anterior; en series anuales, el año anterior) y `referenciaIndicador(tipo, valor, serie, campo)` que devuelve `{ tipo, valorReferencia, posicion, frase }` con `posicion` en `"arriba" | "en-linea" | "abajo" | "dentro"`: `meta-oficial` usa `META_BANREP` y una constante nueva `RANGO_META_BANREP = { min: 2, max: 4 }` que se agrega en `src/lib/observatorio/charts.ts` junto a `META_BANREP` (y se usa también para reemplazar los `y0: 2` / `y1: 4` sueltos de la banda meta en `src/lib/observatorio/chart-defs/inflacion.ts`, ARQ-19); `promedio-20a` marca `en-linea` si la diferencia es menor al 5 % del promedio; `hace-un-ano` expresa la variación porcentual. Frases según research R4, sin palabras de juicio ("mejor", "peor", "bueno", "malo")
- [X] T009 Ejecutar `npm run build` y confirmar que el link-checker pasa con `/observatorio/` (esqueleto) y `/observatorio/inflacion/` (dashboard completo)

**Checkpoint**: El dashboard de inflación vive en su nueva URL, el menú se alimenta de `DOMINIOS` y no hay enlaces rotos.

---

## Phase 3: User Story 1 - "¿Cómo va Colombia?" en menos de un minuto (Priority: P1) 🎯 MVP

**Goal**: Hero + resumen automático + panel de 8 indicadores clave con valor, periodo, cambio descriptivo, referencia objetiva, explicación, fuente y sparkline en azul de marca.

**Independent Test**: Abrir `/observatorio/` y, sin hacer clic, leer valor y periodo de inflación, tasa BanRep, desempleo, crecimiento del PIB y TRM; con JS desactivado, las cifras siguen visibles (quickstart secciones 2 y 3).

### Implementation for User Story 1

- [X] T010 [US1] Agregar a `src/lib/observatorio/home.ts` la constante `INDICADORES_CLAVE: IndicadorClaveDef[]` con los 8 indicadores de research R3 en este orden y grupo: Precios y dinero (`inflacion.inflacion_anual` · `meta-oficial` · fuente `inflacion`; `inflacion.tasa_interes` · `promedio-20a` · fuente `tasa_interes`), Actividad y bienestar (`pib.crecimiento_pib` · `promedio-20a`; `pib.pib_percapita` · `hace-un-ano`), Empleo (`empleo.tasa_desempleo` · `promedio-20a`), Sector externo (`externo.trm` · `hace-un-ano` · fuente `banrep_trm`; `externo.cuenta_corriente` · `promedio-20a` · fuente `banco_mundial`), Contexto (`salario-minimo.salario_minimo` · `hace-un-ano`). Cada uno declara `periodicidad` (obligatoria, no se lee del dataset): `mensual` para inflación anual, tasa BanRep, desempleo y TRM; `anual` para crecimiento del PIB, PIB per cápita, cuenta corriente y salario mínimo (data-model sección 1). `explicacion` "≤ 110 caracteres", sin cifras; `href` con `urls.observatorioSub(...)` o `urls.calculadora('sueldo-vs-inflacion')`
- [X] T011 [US1] Agregar a `src/lib/observatorio/home.ts` `buildIndicadoresClave()` que lee cada dataset con los getters de `data.ts` (`getObservatorio`, `getPIB`, `getEmpleo`, `getExterno`, `getSalarioMinimo`), une `indicadores[campo].actual` + `unidad` + `metadata.fuentes[fuenteKey]` + `referenciaIndicador(...)`; si `campo` no existe en el dataset lanza `Error` (el build falla); si `valor === null` omite el indicador y hace `console.warn` (data-model sección 2)
- [X] T012 [US1] Agregar a `src/lib/observatorio/home.ts` `resumenEconomia(indicadores)` que devuelve 1–2 frases con plantillas fijas (inflación vs rango meta, tasa BanRep, desempleo vs promedio 20 años), cada cifra con su periodo vía `formatPeriodoCorto` de `formatters.ts`, omitiendo indicadores ausentes (research R7)
- [X] T013 [P] [US1] Crear `src/lib/observatorio/chart-defs/sparkline.ts` con la fábrica `makeSparkline({ id, dataset, campo, periodicidad, ariaLabel })` que devuelve un `ChartDef` con `id: "spark-<id>"`, `datasets: [dataset]`, `height: 48`, `vistas: ["linea"]`, y un `build` que extrae la serie con `extractSerie`, **descarta los nulos** y toma los últimos 24 **valores** si `periodicidad === "mensual"` o los últimos 20 si es `"anual"` (no las últimas N filas: en `externo` la cuenta corriente anual solo tiene 2 valores en las últimas 24 filas, research R5), traza línea de 2 px `COLORS.brand` con el último punto marcado, `baseLayout()` con ejes ocultos y márgenes 0, y `config: { staticPlot: true, displayModeBar: false }`. Generar los 8 defs a partir de `INDICADORES_CLAVE` (ARQ-19, patrón `makeComparativoSet`)
- [X] T014 [US1] Registrar los defs `spark-*` en `src/lib/observatorio/chart-defs/index.ts`
- [X] T015 [US1] Agregar a `src/components/observatorio/Chart.astro` la prop `variant?: "card" | "sparkline"` (por defecto `"card"`, sin cambiar el comportamiento actual); con `"sparkline"` renderiza solo el `div.plotly-chart` con `data-chart-host`, alto fijo del def, `role="img"` y `aria-label`, sin `ChartContainer` (contrato sección 3); verificar que `plotly-mount.ts` monta igual sin los slots de header/footer
- [X] T016 [P] [US1] Crear `src/components/observatorio/IndicadorClaveCard.astro` (prop `indicador: IndicadorClave`) según contrato sección 2: nombre, valor con unidad (formatters existentes), `<time datetime="YYYY-MM">` del periodo, cambio descriptivo ("subió 0,03 pp vs ago. 2026") con flecha `aria-hidden`, frase de referencia, explicación, enlace a la fuente (`target="_blank" rel="noopener"`), enlace principal "Ver dashboard de …" al `href`, y hueco de 48 px con `<Chart id={`spark-${id}`} variant="sparkline" />`. Cambio y referencia en `var(--color-text-secondary)`; foco visible; solo tokens
- [X] T017 [US1] Reescribir `src/pages/observatorio/index.astro` como la Home: `BaseLayout` (title/description provisionales), `Hero` con badge "Datos públicos · Colombia", h1 y subtítulo propios (no copiados de otro hero), `kpis` de contexto derivados: población de `getPIB().indicadores.poblacion` **con su periodo y fuente** (Banco Mundial) visibles bajo la cifra, "7 datasets publicados" (largo del catálogo de datasets del Observatorio en `home.ts`, el mismo que usa `catalogoSchema`) y años de historia desde el `primer_periodo` más antiguo; tags propios y `MapaColombia` como visual; `DashboardNav active="inicio"`; `PageHeader` con eyebrow "Actualizado · {periodo más reciente}" y `resumenEconomia`; sección "Cómo va Colombia" (`aria-labelledby`) con un `h2` por grupo y `IndicadorClaveCard` por indicador en grilla responsive (4 → 2 → 1 columnas, breakpoints de DESIGN-SYSTEM); `<PlotlyLoader />` una vez
- [X] T018 [US1] Ejecutar `npx astro check`, `npm run build` y `npm run dev`; revisar en `/observatorio/` los puntos 1–6 de la tabla de quickstart sección 3 (panel visible en 1366×768, sin scroll horizontal a 375 px, sparklines en estado `ready`, cifras visibles sin JS) y quickstart sección 2

**Checkpoint**: MVP: la Home responde "¿cómo va Colombia?" con 8 indicadores y sus tendencias.

---

## Phase 4: User Story 2 - Del resumen al detalle (Priority: P2)

**Goal**: Grilla de dominios con dato estrella y fecha de actualización; cada tarjeta lleva a su dashboard; el dashboard de inflación enlaza de vuelta.

**Independent Test**: Desde la Home se llega en un clic a cada uno de los dominios y accesos (SC-004); desde `/observatorio/inflacion/` se vuelve a la Home.

### Implementation for User Story 2

- [X] T019 [US2] Agregar a `src/lib/observatorio/home.ts` `buildDominios()` que enriquece `DOMINIOS` con `datoEstrella: { nombre, valorFormateado, periodo, fuente }` (indicador principal de cada dataset desde su getter de `data.ts`, con su periodo y la fuente de `metadata.fuentes`; constitución, principio II) y `ultimaActualizacion` (`metadata.ultima_actualizacion`); Informes, Elecciones y Calculadoras sin dato estrella
- [X] T020 [US2] Agregar a `src/pages/observatorio/index.astro` la sección "Explora por tema" (`h2`) con una tarjeta por dominio/acceso (nombre, descripción, dato estrella con periodo y fuente, "Actualizado {fecha}") en una grilla con **estilos locales de la página** (solo tokens de DESIGN-SYSTEM). No se usa `Card`: sus variantes (`project`, `blog`, `related`, `cert`) no tienen lugar para el dato estrella. Contenido electoral descrito de forma neutral, sin nombres de candidatos
- [X] T021 [P] [US2] Agregar en `src/pages/observatorio/inflacion.astro`, al inicio de `.observatorio-container`, un enlace "← Todos los indicadores" a `urls.observatorio()`
- [X] T022 [US2] Verificar con `npm run dev` los puntos 7, 9 y 10 de quickstart sección 3 (un clic a cada dominio, dashboard de inflación completo con enlace de vuelta, ítem activo correcto en el menú)

**Checkpoint**: US1 y US2 funcionan juntas; toda la navegación del Observatorio sale de `DOMINIOS`.

---

## Phase 5: User Story 3 - Confianza y frescura (Priority: P2)

**Goal**: Cada dato muestra fuente y fecha; los datos viejos se marcan; la Home explica fuentes, metodología, licencia y cómo citar.

**Independent Test**: Para cualquier indicador se identifican fuente y fecha de corte; existe una cita sugerida; un dataset vencido aparece como "Dato no reciente".

### Implementation for User Story 3

- [X] T023 [US3] Agregar a `src/lib/observatorio/home.ts` `estadoFrescura(ultimoPeriodo, periodicidad, fechaBuild = new Date())` (la `periodicidad` viene del `IndicadorClaveDef`, nunca de `cobertura.granularidad`) → `"reciente" | "no-reciente"`: mensual, "no reciente" si pasan más de 45 días desde el cierre del mes siguiente al periodo; anual, más de 15 meses desde el cierre del año (research R8). Usarla en `buildIndicadoresClave()` para llenar `frescura`, y hacer que `resumenEconomia` omita los indicadores no recientes
- [X] T024 [US3] En `src/components/observatorio/IndicadorClaveCard.astro` mostrar la etiqueta "Dato no reciente" (pill con tokens, texto, no solo color) cuando `frescura === "no-reciente"`
- [X] T025 [US3] Agregar a `src/pages/observatorio/index.astro` la sección "Datos en los que puedes confiar" (`h2`): lista de fuentes oficiales tomada de `metadata.fuentes` de los datasets del panel (sin duplicados), cómo se actualiza (pipeline automático), enlace a la metodología `urls.observatorioSub('acerca')`, licencia CC BY 4.0 con enlace, cita sugerida ("Salazar, F. Observatorio de Datos de Colombia. {URL}. Consultado el {fecha de build}") y enlaces a los JSON abiertos construidos con `urls.dataset(nombre)`
- [X] T026 [US3] Agregar `DashboardFooter` al final de `src/pages/observatorio/index.astro` con las fuentes del panel, la `ultima_actualizacion` más reciente y la cobertura combinada (primer y último periodo entre datasets)
- [X] T027 [US3] Verificar con quickstart sección 4 (pasos 1 y 2: sparkline refleja cambio en JSON sin recompilar; indicador `null` desaparece con aviso) y simular frescura vencida con una fecha de build futura en `estadoFrescura`; **revertir los JSON y la simulación**

**Checkpoint**: La Home es citable y honesta con la antigüedad de cada dato.

---

## Phase 6: User Story 4 - Descubrimiento en buscadores y redes (Priority: P3)

**Goal**: Metadatos propios, JSON-LD `DataCatalog`, `llms.txt` y og:image.

**Independent Test**: El JSON-LD valida sin errores en la prueba de resultados enriquecidos; la vista previa social muestra la imagen propia.

### Implementation for User Story 4

- [X] T028 [P] [US4] Agregar a `src/lib/seo.ts` `catalogoSchema(datasets)` que produce un `DataCatalog` con un `Dataset` por cada JSON del Observatorio (`inflacion`, `empleo`, `pib`, `comercio`, `externo`, `demografia`, `salario_minimo`) con `name`, `description`, `temporalCoverage`, `dateModified`, `isBasedOn` (de `metadata.fuentes`), `distribution` `DataDownload` (`encodingFormat: application/json`, `contentUrl: absUrls.dataset(nombre)`), `creator: personSchema`, `license` CC BY 4.0 y `spatialCoverage` Colombia; más un `WebPage` (data-model sección 6). Nombres y descripciones de datasets en un catálogo de `home.ts`
- [X] T029 [US4] En `src/pages/observatorio/index.astro`: `title` "Indicadores económicos de Colombia hoy · Observatorio" (≤ 60 caracteres), `description` de research R10 (≤ 160), `image="/images/observatorio-home.png"`, `breadcrumbs={trail(sectionCrumb.observatorio)}` y `<script type="application/ld+json">` con `catalogoSchema(...)`
- [X] T030 [P] [US4] Agregar en `src/pages/llms.txt.ts` la línea `- [Observatorio de Datos de Colombia](${absUrls.observatorio()}): indicadores económicos clave de Colombia con fuente oficial y actualización automática.` junto a las de Inicio, Blog y Proyectos
- [X] T031 [P] [US4] Crear `scripts/build-observatorio-home-cover.mjs` siguiendo el patrón de `scripts/build-inflacion-cover-hero.mjs` (sharp, sin dependencias nuevas) que genera `public/images/observatorio-home.png` 1200×630 PNG (ARQ-10) con fondo blanco/azul de marca, mapa de Colombia, título "Observatorio de Datos de Colombia" y subtítulo "Indicadores clave del país", **sin cifras** (no se desactualiza); ejecutarlo y confirmar dimensiones
- [X] T032 [US4] Verificar quickstart sección 5: JSON-LD de `dist/observatorio/index.html` sin errores en la prueba de resultados enriquecidos, `/observatorio/` y `/observatorio/inflacion/` en `dist/sitemap-0.xml`, línea en `dist/llms.txt`, `og:image` PNG 1200×630

**Checkpoint**: La Home está lista para indexarse y compartirse.

---

## Phase 7: User Story 5 - Lo último publicado y siguiente paso (Priority: P3)

**Goal**: Publicaciones recientes automáticas, bloque de autor con CTA y eventos de analítica.

**Independent Test**: El último informe mensual aparece sin editar la Home; hay un enlace al perfil del autor; los clics disparan `data-ga-event`.

### Implementation for User Story 5

- [X] T033 [US5] Agregar a `src/lib/observatorio/home.ts` `publicacionesRecientes(posts, informes, limite = 4)`: combina `INFORMES` de `informes.ts` y los posts de la colección `blog` que tengan alguna etiqueta de la constante `ETIQUETAS_OBSERVATORIO = ["Observatorio de Datos", "Banco Mundial"]` (definida en `home.ts`; comparación sin mayúsculas ni tildes; "Banco Mundial" trae los comparativos "Colombia vs rival") y `draft !== true`, ordenados por fecha descendente (research R9)
- [X] T034 [US5] Agregar a `src/pages/observatorio/index.astro` la sección "Lo más reciente" (`h2`) usando `getCollection('blog')` y `publicacionesRecientes(...)`, renderizando cada entrada con `Card` de `src/components/Card.astro` y `urls.blogPost(...)` / `urls.observatorioInforme(...)`
- [X] T035 [US5] Agregar a `src/pages/observatorio/index.astro`, antes del `DashboardFooter`, el componente `AuthorBio` (`src/components/AuthorBio.astro`) y un CTA "Conoce mi trabajo" hacia `urls.home()` (o `urls.experiencia()`), sin repetir datos del autor fuera de lo que ya dice `AuthorBio`/`personSchema` (PRD-07)
- [X] T036 [US5] Agregar `data-ga-event` y `data-ga-*` a los enlaces de la Home según contrato sección 7: `home_indicador_click` (en `IndicadorClaveCard.astro`, con `data-ga-indicador`), `home_dominio_click` y `home_publicacion_click` (en `index.astro`), y al CTA del autor

**Checkpoint**: Todas las historias funcionan juntas.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentos vivos (G7), avisos y verificación final.

- [X] T037 [P] Actualizar `agents/ARCHITECTURE.md` sección 5.4: rutas `/observatorio/` (Home) y `/observatorio/inflacion/` (inflación vs tasa); mencionar `home.ts` y las sparklines
- [X] T038 [P] Actualizar `agents/DESIGN-SYSTEM.md`: catálogo (sección 8) con `IndicadorClaveCard` y `Chart variant="sparkline"`; sección 5 con la estructura de la Home ("Portada del Observatorio"); nota en UI-07/UI-08 de la excepción aprobada para sparklines (solo `spark-*`, aprobada por el autor el 2026-10-19)
- [X] T039 [P] Actualizar `src/lib/observatorio/ARCHITECTURE.md`: árbol de archivos (`home.ts`, `chart-defs/sparkline.ts`, `IndicadorClaveCard.astro`, `inflacion.astro`), `index.astro` = Home, y que `DashboardNav` lee `DOMINIOS`
- [X] T040 [P] Agregar a `.claude/skills/publicar-informe-inflacion/SKILL.md` la instrucción de enlazar el dashboard en `/observatorio/inflacion/` (archivo local, no versionado; avisar al autor)
- [X] T041 Revisar con `grep` que no quedan cifras escritas a mano en `src/pages/observatorio/index.astro` ni en `src/lib/observatorio/home.ts` (quickstart sección 4, paso 3)
- [X] T042 Ejecutar `npx astro check` (sin errores nuevos frente a T001) y `npm run build` (link-checker en verde)
- [X] T043 Ejecutar `npm run preview` y Lighthouse móvil sobre `/observatorio/`: Accesibilidad ≥ 90, SEO ≥ 90, LCP < 2,5 s; un solo `h1`; foco visible; `aria-label` en cada sparkline (SC-006); revisar `prefers-reduced-motion`
- [X] T044 Informar al autor: qué cambió, qué se verificó y qué quedó pendiente (prueba de 5 personas SC-001, seguimiento K1/K4 SC-007, aviso de `balanza_comercial` duplicada en `odc-data-pipeline`, "Sector Fiscal" en heros sin dataset, cambio local de la skill)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de Setup; **bloquea todas las historias** (libera `/observatorio/`, crea `home.ts` y las derivaciones).
- **US1 (Fase 3)**: depende de Fase 2. Es el MVP.
- **US2 (Fase 4)** y **US3 (Fase 5)**: dependen de Fase 2 y de T017 (la Home existe). T024 depende de T016.
- **US4 (Fase 6)** y **US5 (Fase 7)**: dependen de T017. T036 depende de T016, T020 y T034.
- **Polish (Fase 8)**: al terminar las historias deseadas.

### Within Each User Story

- `home.ts`/`derivations.ts` (lógica) → componentes → página → verificación.
- `src/pages/observatorio/index.astro` lo tocan T017, T020, T025, T026, T029, T034, T035 y T036: **en secuencia**, nunca en paralelo.
- `src/lib/observatorio/home.ts` lo tocan T005, T010–T012, T019, T023 y T033: en secuencia.

### Parallel Opportunities

- Fase 2: T007 y T008 en paralelo (archivos distintos) tras T002–T006.
- US1: T013 (sparkline.ts) y T016 (IndicadorClaveCard.astro) en paralelo después de T010–T012.
- US2: T021 en paralelo con T019–T020.
- US4: T028, T030 y T031 en paralelo.
- Polish: T037–T040 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Tras T010–T012 (home.ts listo):
Task: "T013 Crear makeSparkline en src/lib/observatorio/chart-defs/sparkline.ts"
Task: "T016 Crear IndicadorClaveCard en src/components/observatorio/IndicadorClaveCard.astro"
```

## Parallel Example: User Story 4

```bash
Task: "T028 catalogoSchema en src/lib/seo.ts"
Task: "T030 Línea del Observatorio en src/pages/llms.txt.ts"
Task: "T031 Portada og en scripts/build-observatorio-home-cover.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1 (línea base) → Fase 2 (mover inflación, `home.ts`, derivaciones).
2. Fase 3 (US1): panel de indicadores con sparklines.
3. **Parar y validar** con quickstart secciones 2 y 3. Si el autor quiere, se publica ya: `/observatorio/` responde "¿cómo va Colombia?" y el dashboard de inflación sigue disponible en su URL nueva.

### Incremental Delivery

1. MVP (US1) → validar.
2. US2 (navegación) + US3 (confianza): mismo nivel de prioridad (P2).
3. US4 (SEO) → validar el JSON-LD → el autor despliega y avisa a IndexNow.
4. US5 (recientes y autor).
5. Polish: documentos vivos y verificación final.

---

## Notes

- [P] = archivo distinto, sin dependencias pendientes.
- Cada historia se valida con su "Independent Test" antes de pasar a la siguiente.
- El autor hace los commits; el agente no toca git (ARQ-17).
- Decisiones de implementación (MVP, 2026-10-19):
  - `home.ts` es un módulo **puro** (no importa `data.ts`): `chart-defs/sparkline.ts` lo importa y se empaqueta en el cliente, donde `node:fs` no existe. La página lee los datasets con los getters de `data.ts` y se los pasa a `buildIndicadoresClave(datasets)`.
  - `estadoFrescura` se implementó en T011 porque `IndicadorClave.frescura` lo requiere; en T023 queda conectar la etiqueta "Dato no reciente" (T024) y verificar.
  - Se agregó `comparacion` a `IndicadorClaveDef` (data-model sección 1) para escribir bien "frente a {periodo}" en desempleo, que compara interanual.
  - `DATASETS_PUBLICADOS` (catálogo de 7 datasets) se creó en T017 para el KPI del hero; T028 lo reutiliza para el JSON-LD.
- Verificación del MVP (T018): `astro check` 0 errores (43 hints, uno menos que la línea base); build 162 páginas y link-checker OK; 8 sparklines `ready`; 1366×768: el panel empieza dentro de la primera pantalla bajo el hero; 375 px: 1 columna sin scroll horizontal; `/observatorio/inflacion/` con 6 gráficos `ready`.
- Verificación de US2 y US3 (T022, T027, 2026-10-19):
  - Los 9 destinos de "Explora por tema" están a un clic, con dato estrella, periodo y fuente; el menú marca "Inicio" (SC-004).
  - Cambiar un valor de `serie` en `data_empleo.json` se ve en la sparkline sin recompilar (REGLA 2). Con `tasa_desempleo` en `null`, el build avisa (`[home] … se omite del panel`), la tarjeta desaparece y el resumen la omite. Los JSON se restauraron (`git diff public/` vacío).
  - Frescura simulada con fechas futuras: los indicadores vencidos se marcan y el resumen los omite. Se corrigió un error de borde: el día límite ahora cuenta completo. Se agregó un texto de respaldo para cuando el resumen queda vacío.
  - Cita sugerida en formato de conjunto de datos, sin fecha de consulta (el lector la agrega), en lugar de "Consultado el {fecha de build}": una fecha de build en una cita confunde.
  - Observación previa, no causada por esta feature: con un viewport de 1024 px, el `main` mide 963 px y desborda (también en `/observatorio/empleo/`).
- Verificación de US4 y US5 (T032, 2026-10-19):
  - JSON-LD de la Home: `WebPage` + `DataCatalog` con 7 `Dataset` (licencia, cobertura, `dateModified`, `isBasedOn`, `DataDownload`). Título de 53 caracteres, descripción de 152, `og:image` = `/images/observatorio-home.png` (PNG 1200×630, RGB). `/observatorio/` y `/observatorio/inflacion/` están en el sitemap; `llms.txt` incluye el Observatorio. **Pendiente del autor:** validar en la prueba de resultados enriquecidos de Google tras el deploy (herramienta externa).
  - T031 (ARQ-19): fondo, mapa y pie de las portadas se extrajeron a `scripts/lib/cover-hero.mjs`, que ahora usan `build-inflacion-cover-hero.mjs` y el nuevo `build-observatorio-home-cover.mjs`. La portada de inflación de septiembre sale byte a byte igual tras el refactor (mismo SHA-256).
  - "Lo más reciente": 4 publicaciones automáticas (informes mensuales y dólar); `Card variant="blog"` reutilizado. Eventos GA: `home_indicador_click`, `home_dominio_click`, `home_publicacion_click`, `home_autor_click`.
  - Grillas: 4/3/2 columnas en 1366 px y 1 columna en 375 px, sin scroll horizontal; 1 solo `h1`.
- Verificación final (T041–T043, 2026-10-19):
  - Sin cifras escritas a mano en la Home, `home.ts`, `IndicadorClaveCard` ni `sparkline.ts`. `astro check`: 0 errores, 0 avisos, 39 hints (44 en la línea base). Build: 162 páginas, link-checker OK.
  - **Lighthouse no se ejecutó:** no está instalado y correrlo con `npx` implica descargar un paquete. Se hizo una auditoría manual sobre `npm run preview`: 1 `h1`, encabezados sin saltos, 0 enlaces sin nombre, 0 imágenes sin `alt`, 8 sparklines con `aria-label`, `lang="es-CO"`, enlace para saltar al contenido, foco visible con teclado (outline azul de 2 px) y 6 reglas de `prefers-reduced-motion`. Peso: HTML 49 KB, JS propio 34 KB, CSS 5 KB.
  - **LCP sin medir:** el panel del navegador no expone las métricas de pintado. **Pendiente del autor:** Lighthouse móvil (SC-006) y la prueba de resultados enriquecidos (SC-005) tras el deploy.
  - Fuera del alcance de la spec, en esta sesión: se corrigió el desborde horizontal del layout a 1024 px (`min-width: 0` en `.layout__main` de `BaseLayout.astro`).
- Refinamiento del autor (2026-10-19, después de T044): se eliminaron de la Home el resumen en `PageHeader` (FR-003), la grilla "Explora por tema" (FR-010) y el bloque "Datos abiertos (JSON)" (FR-012), y se quitó `distribution` del JSON-LD de la Home. En el código se borraron `resumenEconomia`, `buildDominios` y el dato estrella, y `DOMINIOS` quedó solo para el menú. Los textos "Datos abiertos" / "datasets abiertos" pasaron a "Conjuntos de datos". Spec, contrato y documentos de `agents/` actualizados.
- Segunda ronda de refinamiento (2026-10-19): se quitó `distribution`/`DataDownload` del JSON-LD de 11 páginas (6 dashboards, 4 de elecciones y el informe "Historia de Colombia", cuyo `distribution` apuntaba al PDF; el botón de descarga del PDF en la página sigue igual). Se eliminaron los helpers `urls.dataset`/`absUrls.dataset` (research R10b), que quedaron sin uso. El bloque de licencia de la Home pasó a "Cita y comparte": la licencia CC BY 4.0 cubre cifras, gráficos y análisis, sin invitar a reutilizar los datos procesados. Verificado: 0 páginas con `DataDownload`, JSON-LD válido en las 162 páginas.
- Línea base (T001, 2026-10-19): `npx astro check` → 0 errores, 0 avisos, 44 hints (104 archivos); `npm run build` → 161 páginas, link-checker OK.
