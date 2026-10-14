# Arquitectura · fredericksalazar.github.io

> **Qué es este documento:** el *cómo* técnico del sitio: stack, módulos, flujo
> de datos y las reglas `ARQ-NN` con las que se valida todo plan
> (`/speckit-plan` → *Constitution Check*). Es vinculante para cualquier persona
> o agente de IA. Violar una regla `ARQ` es un bug, salvo excepción justificada
> en la sección *Complexity Tracking* del `plan.md` y aprobada por el autor.
>
> **Precedencia** (si dos documentos se contradicen, gana el primero y el otro se
> corrige): `.specify/memory/constitution.md` → [`PRODUCT.md`](./PRODUCT.md) →
> este documento → [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) → documentos de
> módulo (p. ej. [`src/lib/observatorio/ARCHITECTURE.md`](../src/lib/observatorio/ARCHITECTURE.md)).
>
> **Principio de redacción:** este documento describe lo que **es cierto hoy**.
> Lo que falta o está mal se registra en la sección 12 *Deuda técnica*, no como regla.
>
> Versión 0.1.0 · Borrador · 2026-10-14

---

## 1. Visión general

Sitio **estático** (SSG, multipágina) generado con Astro y publicado en GitHub
Pages, alimentado por **pipelines Python** que producen datasets JSON versionados
en el propio repositorio. No hay backend, base de datos, autenticación ni
secretos en tiempo de ejecución.

```
 ┌──────────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────────┐
 │ 1. Datos (Python)        │   │ 2. Contrato (JSON)     │   │ 3. Presentación (Astro)     │
 │ ingestion/  pipeline/    │──▶│ public/data/*.json     │──▶│ build: KPIs, SEO, JSON-LD   │
 │ scripts/                 │   │ public/geo/*.geo.json  │   │ runtime: gráficos Plotly    │
 │ cron GitHub Actions o    │   │ data/raw · processed   │   │ vía fetch                   │
 │ ejecución manual         │   │                        │   │                             │
 └──────────────────────────┘   └────────────────────────┘   └──────────────┬──────────────┘
                                                                            │ npm run build
                                                                            ▼
                                                      ┌───────────────────────────────────┐
                                                      │ dist/ → GitHub Pages              │
                                                      │ + ping IndexNow · GA4 · sitemap   │
                                                      └───────────────────────────────────┘
```

## 2. Stack y versiones

Versiones **instaladas** (rango declarado entre paréntesis). Agregar una
dependencia o subir una versión mayor requiere spec (ARQ-12).

### 2.1 Sitio

| Pieza | Versión | Rol |
|---|---|---|
| Node.js | `>=22.12.0` (engines) · CI usa 22 | Runtime de build |
| Astro | 6.4.8 (`^6.1.8`) | SSG, Content Layer, View Transitions |
| TypeScript | 5.9.3 · `astro/tsconfigs/strict` | Tipado estricto |
| @astrojs/mdx | 6.0.3 | Posts `.mdx` con componentes |
| @astrojs/sitemap | 3.7.2 | `sitemap-index.xml` filtrado |
| @astrojs/rss | 4.0.18 | `/rss.xml` |
| @astrojs/check | 0.9.9 | `npx astro check` |
| Tailwind CSS · @tailwindcss/vite | 4.2.4 | Importado en `global.css`; prácticamente sin uso (ver sección 12) |
| sharp | 0.34.5 (dependencia de Astro) | Scripts de imágenes y portadas |
| Plotly.js | 2.35.2 por CDN (`basic` por defecto, `full` opcional) | Gráficos interactivos |
| Shiki | incluido en Astro · tema `github-light` | Resaltado de código |

### 2.2 Datos

| Pieza | Versión | Rol |
|---|---|---|
| Python | 3.12 (CI) · 3.11+ mínimo | Pipelines |
| pandas | `>=2.2,<3` | Transformación |
| requests | `>=2.31,<3` | Descarga de fuentes |
| openpyxl | `>=3.1,<4` | XLSX del DANE |
| xlrd | `>=2.0,<3` | XLS antiguos del DANE |
| pytest | `>=8,<9` | Tests de ingesta |
| matplotlib, Pillow | sin fijar, fuera de `requirements.txt` | Portadas `scripts/build-*-cover.py` (ver sección 12) |

### 2.3 Servicios externos

| Servicio | Uso |
|---|---|
| GitHub Pages / Actions | Hosting, deploy y cron de ingesta |
| Google Fonts | Google Sans Flex (`wght 100..900`) |
| Google Analytics 4 | `page_view` manual por View Transitions; eventos con `data-ga-event` + `data-ga-*` (base para medir conversiones, ver los KPIs de `PRODUCT.md`) |
| IndexNow | Aviso a Bing/Yandex tras cada deploy |
| cdn.plot.ly | Plotly |
| Fuentes de datos | BanRep (SDMX), DANE (XLSX/XLS), Banco Mundial (API v2), Wikipedia es (elecciones) |

## 3. Estructura del repositorio

```
CLAUDE.md               Puntero (@agents/AGENTS.md) para Claude Code. Sin contenido propio.
agents/                 Guía para agentes y humanos (agnóstica de proveedor)
  AGENTS.md             Índice y reglas operativas
  PRODUCT.md            Objetivos, negocio, audiencias, embudo, KPIs
  ARCHITECTURE.md       Este documento
  DESIGN-SYSTEM.md      Sistema visual y de UI
.specify/               Spec Kit: constitución, plantillas, scripts
specs/                  Features en curso y cerradas (NNN-nombre/), creadas por Spec Kit
.claude/                Integración de Claude Code (skills speckit-*). No versionada; se regenera.
.github/workflows/      deploy.yml · ingest-monthly.yml
data/raw/               Snapshots crudos versionados: banrep, dane, world_bank (geih ignorado)
data/processed/         CSV consolidado del Observatorio
ingestion/              Pipeline del Observatorio: sources/ → processing/ → JSON; tests/
pipeline/               Pipelines independientes: elecciones/, ingresos/, salario_minimo/
scripts/                Link-checker, IndexNow, comparativos, portadas, optimización de imágenes
public/data/            CONTRATO: datasets JSON que consume el sitio
public/geo/             GeoJSON de departamentos y municipios
public/                 images/ badges/ logos/ informes/ y archivos de verificación
src/content.config.ts   Colecciones blog y proyectos (schemas Zod)
src/content/            blog/ (.md, .mdx) · proyectos/ (.md)
src/layouts/            BaseLayout.astro: layout único y tokens globales de diseño
src/components/         Componentes del sitio; blog/ (MDX) y observatorio/ (gráficos, KPIs)
src/lib/                urls.ts y seo.ts (fuentes únicas); observatorio/; calculadoras/
src/data/tags.ts        Descripciones editoriales de etiquetas
src/pages/              Rutas
src/styles/global.css   Import de Tailwind y estilos de calculadoras
```

## 4. Modelo de renderizado

- **SSG puro:** `astro build` → `dist/`. Sin adaptador SSR ni endpoints dinámicos
  (`rss.xml.js` y `llms.txt.ts` se generan en build).
- **Multipágina con View Transitions** (`<ClientRouter />`): navegación fluida
  sin perder HTML indexable.
- **`trailingSlash: 'always'`**, `prefetch` al pasar el cursor.
- **Sin framework de islas** (ni React, ni Vue, ni Svelte): la interactividad es
  TypeScript/JS en `<script>` de componentes `.astro`.
- **Dos momentos de lectura de datos:**
  - *Build* (frontmatter, vía `lib/observatorio/data.ts`): KPIs, titulares,
    meta y JSON-LD, para SEO.
  - *Runtime* (`fetch` vía `lib/observatorio/data-client.ts`): series de los
    gráficos.

## 5. Módulos

Cada spec declara qué módulos toca. Entre paréntesis, el pilar de
[`PRODUCT.md`](./PRODUCT.md) al que sirve.

### 5.1 CV digital (P1)
- **Rutas:** `/`, `/experiencia/`, `/certificaciones/`.
- **Datos:** experiencia y certificaciones escritas como arrays en sus páginas
  `.astro`; badges en `public/badges/`; identidad en `personSchema` (`lib/seo.ts`).
- **Componentes:** `Hero`, `Card`, `Sidebar` (estadísticas de años, certificaciones
  y proyectos), `AuthorBio`, iconos.

### 5.2 Proyectos (P2)
- **Rutas:** `/proyectos/`, `/proyectos/[slug]/`.
- **Datos:** colección `proyectos` (`titulo`, `descripcion`, `tecnologias`,
  `categoria`, `github`, `demo`, `imagen`, `destacado`, `orden`).
- Algunas `demo` apuntan a otros repositorios publicados en el mismo dominio;
  no forman parte de este repo.

### 5.3 Blog (P4)
- **Rutas:** `/blog/`, `/blog/[slug]/`, `/blog/tags/`, `/blog/tag/[tag]/`,
  `/blog/archivo/`, `/rss.xml`, `/llms.txt`.
- **Datos:** colección `blog`: `titulo`, `tituloSeo`, `fecha`, `descripcion`
  (≤ 160), `etiquetas`, `autor`, `imagen`, `draft`, `tipo` (tutorial, analisis,
  opinion, caso-estudio, referencia), `resumen`, `destacado`.
- **MDX:** puede usar `Chart` (`embedded`), un solo `PlotlyLoader`,
  `MarcadorEconomico`, `MarcadorFutbol`, `Callout`, `FaqSchema`.
- Etiquetas, archivo y borradores son `noindex` y no van al sitemap.

### 5.4 Observatorio de Datos (P3)
- **Rutas:** `/observatorio/` (inflación vs tasa), `monetario`, `pib`, `empleo`,
  `comercio`, `demografia`, `acerca`.
- **Documento del módulo (vinculante):**
  [`src/lib/observatorio/ARCHITECTURE.md`](../src/lib/observatorio/ARCHITECTURE.md)
  (REGLAS 1–19, recetas para agregar indicadores y datasets, checklist de PR).
  Este documento no lo duplica.
- **Patrón central:** `ChartDef` registrado en `chart-defs/index.ts` + componente
  genérico `Chart.astro`.

### 5.5 Informes (P3)
- **Rutas:** `/observatorio/informes/` y una página `.astro` por informe
  (hoy `historia-de-colombia`).
- **Datos:** catálogo en `lib/observatorio/informes.ts`; PDFs en
  `public/informes/`, enlazados con `urls.informePdf()`.
- `InformePopup` aparece en todo el sitio salvo en las páginas de informe.

### 5.6 Elecciones presidenciales (P3)
- **Rutas:** `/elecciones-presidenciales/` (noindex, redirección), `2022`,
  `2022-segunda-vuelta`, `2026`, `2026-segunda-vuelta`.
- **Datos:** `data_pres_*.json`, `public/geo/*.geo.json`. Producidos por
  `pipeline/elecciones/` (`from_wikipedia.py`, `build_municipios_2v.py`),
  **ejecución manual**.
- **Restricciones de dominio:**
  - El desglose departamental **no incluye el voto en el exterior**: los totales
    nacionales salen de `resultados`, nunca de sumar departamentos.
  - `censo` y `participacion` valen 0 a nivel departamental.
  - Los datos 2026 son **preconteo** hasta re-ejecutar con escrutinio definitivo;
    el estado vive en `definiciones.estado`.
  - La Registraduría bloquea descargas automáticas (403); la fuente operativa es
    Wikipedia en español.

### 5.7 Calculadoras ciudadanas (P3)
- **Rutas:** `/calculadoras/`, `sueldo-vs-inflacion`, `cuanto-ganas`,
  `en-que-colombia-naciste`.
- **Datos:** los mismos JSON del Observatorio.
- **Lógica:** funciones puras en `lib/calculadoras/` (`calculos.ts`, `ingresos.ts`).

### 5.8 Transversal: SEO, descubrimiento y analítica
- `SEOHead.astro`: meta, Open Graph y Twitter (og:image **PNG 1200×630**),
  canonical, Dublin Core, fuentes y `Person` JSON-LD en todas las páginas.
- `lib/seo.ts`: `personSchema`, `webSiteSchema` (solo home), `breadcrumbList()`,
  `trail()` y `sectionCrumb`.
- `lib/urls.ts`: única fuente de rutas internas y absolutas.
- `robots.txt`, sitemap filtrado, `llms.txt`, IndexNow y archivos de verificación
  de buscadores en `public/`.
- Sin `SearchAction` a propósito: el sitio no tiene buscador.

## 6. Capa de datos

### 6.1 Inventario de datasets (`public/data/`)

| Dataset | Productor | Actualización |
|---|---|---|
| `data_inflacion.json` | `ingestion/` (BanRep + DANE IPC) | **Cron** |
| `data_externo.json` | `ingestion/processing/export_externo.py` | **Cron** |
| `data_empleo.json` | `ingestion/processing/export_empleo.py` (DANE GEIH, respaldo Banco Mundial) | **Cron**, con guarda de no regresión |
| `data_pib.json`, `data_comercio.json`, `data_demografia.json` | `ingestion/processing/export_<x>.py` | Manual: `python -m ingestion.processing.export_<x>` |
| `data_comparativo_col_<key>.json` | `scripts/build-comparativo.mjs` + bloque `futbol` editado a mano | Manual |
| `data_salario_minimo.json` | `pipeline/salario_minimo/` | Manual |
| `data_ingresos.json`, `data_salarios_cargos.json` | `pipeline/ingresos/` | Manual |
| `data_pres_*.json` | `pipeline/elecciones/` | Manual |
| `presidentes.json` | Referencia estática | Manual |

### 6.2 Contrato
Definido en la sección 3 del documento del Observatorio: `metadata` (fuentes, definiciones,
cobertura, `ultima_actualizacion`), `indicadores`, `serie` **descendente** con
`periodo` `"YYYY-MM"` y nulls explícitos. Los tipos TypeScript viven en
`src/lib/observatorio/types.ts` y solo cambian cuando cambia el JSON.

## 7. CI/CD

| Workflow | Disparador | Qué hace |
|---|---|---|
| `deploy.yml` | push a `main`, manual | `withastro/action@v3` (Node 22: instala y ejecuta `npm run build` = `astro build` + link-checker) → `deploy-pages@v4` → ping IndexNow (`continue-on-error`). `concurrency: pages`. |
| `ingest-monthly.yml` | cron `0 13 5,10,15,20,25 * *`, manual | Python 3.12 → `python -m ingestion.main` → `pytest ingestion/tests` → commit solo si hay cambios → build → deploy. Si falla, abre un issue `bug, ingest`. |

No existe workflow de Pull Request: ningún check corre antes del merge (ver sección 12).

## 8. Reglas de arquitectura

| ID | Regla |
|---|---|
| **ARQ-01** | **Estático siempre.** Sin SSR, funciones serverless, bases de datos ni secretos en el cliente. Un servicio de terceros (p. ej. formulario o agenda) se integra solo por enlace o embed, sin backend propio, y requiere spec. |
| **ARQ-02** | **Una sola fuente de verdad por dato.** Todo dato cuantitativo nace en un pipeline y vive en `public/data/*.json`. Prohibido escribir cifras o series a mano en `.astro`/`.ts`, salvo catálogos de metadata documentados (`informes.ts`, `presidentes.json`, `tags.ts`). |
| **ARQ-03** | **URLs solo desde `lib/urls.ts`.** Los enlaces internos terminan en `/` salvo archivos reales; el link-checker hace fallar el build si no. |
| **ARQ-04** | **SEO centralizado.** JSON-LD desde `lib/seo.ts` y meta desde `SEOHead`; cada página pasa `breadcrumbs` a `BaseLayout`, `title` ≤ 60 caracteres y `description` ≤ 160. |
| **ARQ-05** | **Un solo layout.** Toda página usa `BaseLayout`. Los estilos siguen [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md). |
| **ARQ-06** | **Lógica pura fuera de las páginas.** Cálculos reutilizables van a `lib/` (`observatorio/derivations.ts`, `calculadoras/`) como funciones puras. |
| **ARQ-07** | **Gráficos = `ChartDef` + `Chart.astro`.** Datos vía `data-client.ts` (nunca `fetch('/data/…')` directo) y un solo `<PlotlyLoader />` por página. |
| **ARQ-08** | **Compatibles con View Transitions.** Los scripts son idempotentes, se re-enganchan en `astro:page-load` y protegen los listeners globales con una bandera (p. ej. `window.__xBound`). |
| **ARQ-09** | **Contenido con schema.** Todo campo de frontmatter existe primero en el schema Zod de `content.config.ts`. |
| **ARQ-10** | **og:image en PNG 1200×630.** Nunca WebP (rompe previews en WhatsApp/LinkedIn). Raster nuevo se optimiza con `node scripts/optimize-images.mjs`. |
| **ARQ-11** | **Pipelines reproducibles.** Cada dataset tiene un productor y un comando documentado (ver sección 6.1). Los pipelines solo escriben en `data/` y `public/`. |
| **ARQ-12** | **Dependencias con spec.** Toda dependencia nueva (npm, pip, CDN) o subida de versión mayor requiere spec y justificación. Primero la plataforma (CSS, Web APIs). |
| **ARQ-13** | **Documentación neutral, Claude como agente.** Toda guía para agentes vive en `agents/` y `.specify/`. `CLAUDE.md` es solo un puntero (`@agents/AGENTS.md`) y nunca contiene reglas. Las skills en `.claude/skills/` se regeneran con `specify integration install claude` y no se versionan. Para otro agente se agrega un puntero equivalente, sin duplicar contenido. |
| **ARQ-14** | **Idioma.** UI, contenido y documentación en español (es-CO). Código: camelCase en TS, snake_case en campos JSON y en Python. |
| **ARQ-15** | **Accesibilidad mínima.** `lang="es-CO"`, skip-link, `aria-label` en gráficos y controles, foco visible y respeto a `prefers-reduced-motion`. |
| **ARQ-16** | **Rendimiento.** Plotly `basic` salvo que el gráfico necesite `full`; solo los scripts de terceros de la sección 2.3. |
| **ARQ-17** | **Git lo administra el autor.** Los agentes editan archivos; no crean ramas, commits, merges ni push. |
| **ARQ-18** | **Sin regresión de datos publicados.** Un pipeline nunca reemplaza un JSON publicado por uno más pobre (menor granularidad o periodo más antiguo); ante un fallo de la fuente se conserva el JSON vigente y se registra el aviso (patrón de `_exportar_empleo` en `ingestion/main.py`). |
| **ARQ-19** | **Reutilización ante todo.** Cada pieza (dato, cálculo, gráfico, componente, estilo) se define una sola vez y se reutiliza por referencia. Un gráfico se publica en cualquier página o post con `<Chart id="…">` y nunca se copia su `ChartDef`. Si dos piezas solo difieren en parámetros, se crea una fábrica (patrón de `makeComparativoSet`). Antes de crear algo nuevo se busca si ya existe. Se abstrae a partir de la segunda repetición con la misma razón de cambio. |

## 9. Restricciones

- **GitHub Pages:** sin cabeceras HTTP propias ni redirecciones de servidor (se
  usan páginas `noindex` de redirección).
- **Build en CI con Node 22**, aunque localmente se use otra versión.
- **Fuentes inestables:** algunas fuentes bloquean descargas o publican tarde;
  los pipelines degradan con elegancia y no rompen el build (ARQ-18).
- **Todo lo publicado es público e indexable:** nunca datos personales ni
  información confidencial de clientes.

## 10. Calidad y verificación

| Check | Dónde corre | Estado |
|---|---|---|
| Schema de contenido (Zod) | `astro build` | ✅ |
| Link-checker interno | `npm run build` | ✅ |
| Tests de ingesta (pytest, 19 tests) | Cron de ingesta | ✅ parcial: no cubren todas las fuentes |
| `npx astro check` | Manual | ⚠️ no está en CI |
| Tests de `lib/` (TypeScript) | — | ❌ no existen |
| Validación del contrato JSON | — | ❌ no existe |
| Checks en Pull Request | — | ❌ no existe workflow |
| Revisión visual | Manual (`npm run dev`) | ⚠️ |

**Mínimo antes de dar por terminada una tarea:** `npx astro check` sin errores
nuevos, `npm run build` exitoso y, si se tocó el pipeline, `pytest ingestion/tests/`.

## 11. Decisiones de arquitectura vigentes

| Decisión | Motivo |
|---|---|
| Astro estático en GitHub Pages | Costo cero, máxima indexabilidad, sin operación de servidores. |
| Datos como JSON versionados en el repo | Trazabilidad con git, sin base de datos, editable sin recompilar. |
| Plotly por CDN y gráficos en cliente | Interactividad sin inflar el HTML; datos fuera del bundle. |
| Sin framework de islas | Menos JS y menos dependencias; la interactividad es acotada. |
| og:image en PNG | Compatibilidad con previews de redes sociales. |
| Wikipedia como fuente electoral | La Registraduría bloquea descargas automáticas. |

## 12. Deuda técnica conocida

1. `pipeline/elecciones/README.md` menciona archivos que no existen
   (`config.py`, `generar_jsons.py`, `validar_jsons.py`).
2. La sección 2 del documento del Observatorio no lista demografía, externo,
   comparativos, elecciones ni `monetario.astro`.
3. Dos productores de comparativos (`scripts/build-comparativo.mjs` e
   `ingestion/processing/export_comparativo.py`): falta elegir uno.
4. `matplotlib` y `Pillow` no están en ningún archivo de requisitos.
5. Tailwind instalado pero sin uso real; estilos dispersos (102 colores hex
   distintos). Se resuelve según `DESIGN-SYSTEM.md`.
6. Datos del CV (experiencia, certificaciones) escritos dentro de las páginas;
   el contador de certificaciones del `Sidebar` es un literal.
7. `README.md` sigue siendo la plantilla de Astro.
8. Sin workflow de PR ni `astro check` en CI (ver sección 10).

## 13. Mantenimiento

- Se actualiza **en la misma feature** que cambie algo descrito aquí: el
  `plan.md` incluye la tarea "Actualizar `agents/ARCHITECTURE.md`".
- `/speckit-analyze` y `/speckit-converge` verifican la coherencia con este
  documento.
- Versionado: MAJOR si se elimina o relaja una regla `ARQ`; MINOR si se agrega
  una regla o un módulo; PATCH si se aclara o se actualiza un dato.
