# Arquitectura del sitio · fredericksalazar.github.io

> **Documento vinculante y agnóstico de proveedor.** Cualquier persona o agente de
> IA (de cualquier proveedor) que proponga un cambio debe leerlo antes de escribir
> la spec o el plan. Las reglas `ARQ-NN` no son negociables: violar una es un bug
> o requiere una excepción justificada en el `plan.md` de la feature (sección
> *Complexity Tracking* de Spec Kit).
>
> **Precedencia:** `.specify/memory/constitution.md` → este documento →
> [`docs/design-system.md`](./design-system.md) → documentos de módulo
> (p. ej. [`src/lib/observatorio/ARCHITECTURE.md`](../src/lib/observatorio/ARCHITECTURE.md)).
> Si dos documentos se contradicen, gana el de mayor precedencia y el otro se
> corrige.
>
> **Última revisión:** 2026-10-06 · Versión del documento: 1.0.0

---

## 1. Visión general

Sitio personal y plataforma de datos públicos de Frederick Salazar. Es un **sitio
estático (SSG, MPA)** generado con Astro y publicado en GitHub Pages, alimentado
por **pipelines Python** que producen datasets JSON versionados en el repo.

```
 ┌───────────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────────┐
 │ 1. Datos (Python)         │   │ 2. Contrato (JSON)      │   │ 3. Presentación (Astro)      │
 │ ingestion/  pipeline/     │──▶│ public/data/*.json      │──▶│ src/pages  src/components    │
 │ scripts/*.py|*.mjs        │   │ public/geo/*.geo.json   │   │ build-time: KPIs, SEO        │
 │ (cron GitHub Actions o    │   │ data/raw, data/processed│   │ runtime: Plotly vía fetch    │
 │  ejecución manual)        │   │                         │   │                              │
 └───────────────────────────┘   └─────────────────────────┘   └──────────────┬───────────────┘
                                                                              │ astro build
                                                                              ▼
                                                     ┌──────────────────────────────────────┐
                                                     │ dist/ → GitHub Pages (estático)      │
                                                     │ + IndexNow ping · GA4 · sitemap      │
                                                     └──────────────────────────────────────┘
```

No hay backend, base de datos, autenticación ni secretos en runtime. Todo lo que
el visitante ve es HTML/CSS/JS estático más JSON públicos.

---

## 2. Stack y versiones

Versiones **instaladas** a la fecha de revisión (rango declarado entre paréntesis).
Cambiar una versión mayor de cualquier fila requiere una spec propia (ARQ-12).

### 2.1 Sitio (Node)

| Pieza | Versión | Rol |
| --- | --- | --- |
| Node.js | `>=22.12.0` (engines) · CI usa 22 | Runtime de build |
| Astro | 6.4.8 (`^6.1.8`) | Framework SSG, Content Layer, View Transitions |
| TypeScript | 5.9.3 (`^5.9.3`) · `astro/tsconfigs/strict` | Tipado estricto |
| @astrojs/mdx | 6.0.3 | Posts `.mdx` con componentes (charts en el blog) |
| @astrojs/sitemap | 3.7.2 | `sitemap-index.xml` (excluye páginas noindex) |
| @astrojs/rss | 4.0.18 | `/rss.xml` |
| @astrojs/check | 0.9.9 | `npx astro check` (diagnóstico de tipos) |
| Tailwind CSS + @tailwindcss/vite | 4.2.4 | Importado en `global.css`; **uso marginal** (ver ARQ-20) |
| sharp | 0.34.5 (transitiva de Astro) | Scripts de imágenes/portadas |
| Plotly.js | 2.35.2 vía CDN `cdn.plot.ly` (bundle `basic` por defecto, `full` opcional) | Gráficos interactivos en cliente |
| Shiki | (incluido en Astro) tema `github-light` | Resaltado de código en Markdown |

### 2.2 Datos (Python)

| Pieza | Versión | Rol |
| --- | --- | --- |
| Python | 3.12 (CI) · 3.11+ mínimo | Pipelines |
| pandas | `>=2.2,<3` | Transformación |
| requests | `>=2.31,<3` | Descarga de fuentes |
| openpyxl | `>=3.1,<4` | XLSX del DANE |
| pytest | `>=8,<9` | Tests de ingesta |
| matplotlib, Pillow | sin fijar (no están en `requirements.txt`) | Portadas `scripts/build-*-cover.py` |

### 2.3 Servicios externos

| Servicio | Uso |
| --- | --- |
| GitHub Pages | Hosting estático |
| GitHub Actions | Deploy y cron de ingesta |
| Google Fonts | Google Sans Flex (`wght 100..900`) |
| Google Analytics 4 (`G-ZFSVVSZG6K`) | Analítica; `page_view` manual por View Transitions; eventos `data-ga-*` |
| IndexNow (Bing/Yandex) | Ping tras cada deploy |
| cdn.plot.ly | Plotly |
| Fuentes de datos | BanRep SDMX, DANE (XLSX), Banco Mundial API v2, Wikipedia (es) para elecciones |

---

## 3. Estructura del repositorio

```
.github/workflows/      deploy.yml · ingest-monthly.yml
.specify/               Spec Kit: constitución, plantillas, scripts (agnóstico de agente)
specs/                  Specs de features (NNN-nombre/ spec.md plan.md tasks.md …)
docs/                   architecture.md (este) · design-system.md · ai-fluency.md
data/
  raw/                  Snapshots crudos versionados (banrep, dane, world_bank); geih ignorado
  processed/            CSV consolidado del Observatorio
ingestion/              Pipeline Python del Observatorio (sources/ → processing/ → JSON)
pipeline/               Pipelines Python independientes: elecciones/, ingresos/, salario_minimo/
scripts/                Utilidades Node/Python: link-checker, IndexNow, portadas, imágenes
public/
  data/                 CONTRATO: datasets JSON consumidos por el sitio
  geo/                  GeoJSON (departamentos, municipios)
  images/ badges/ logos/ informes/   Assets estáticos (sin pipeline de <Image>)
src/
  content.config.ts     Colecciones blog y proyectos (schemas Zod)
  content/blog/         Posts .md / .mdx
  content/proyectos/    Fichas de proyecto .md
  layouts/BaseLayout.astro   Layout único + design tokens globales
  components/           Componentes de sitio (Hero, Card, Sidebar, SEOHead…)
  components/blog/      Componentes MDX del blog (Marcadores, FaqSchema)
  components/observatorio/   Chart, ChartContainer, PlotlyLoader, KPIs, Nav…
  lib/                  urls.ts · seo.ts (fuentes únicas de verdad)
  lib/observatorio/     Capa de datos y charts (ver su ARCHITECTURE.md)
  lib/calculadoras/     Cálculos puros de calculadoras
  data/tags.ts          Descripciones editoriales de tags
  pages/                Rutas (file-based routing)
  styles/global.css     Import de Tailwind + estilos de calculadoras
```

---

## 4. Modelo de renderizado

- **SSG puro** (`astro build` → `dist/`). No hay adaptador SSR ni endpoints dinámicos.
- **MPA con View Transitions** (`<ClientRouter />` en `BaseLayout`): navegación tipo
  SPA conservando HTML indexable. Todo script de página debe ser idempotente y
  re-engancharse en `astro:page-load` (ARQ-08).
- **`trailingSlash: 'always'`** y `prefetch` en hover.
- **Sin framework de UI de islas** (no React/Vue/Svelte). La interactividad es
  TypeScript/JS vanilla en `<script>` de componentes `.astro`.
- **Dos momentos de lectura de datos:**
  - *Build-time* (frontmatter): KPIs, titulares, JSON-LD, meta → SEO.
  - *Runtime* (`fetch` vía `data-client.ts`): series para gráficos Plotly.

---

## 5. Módulos

Cada módulo tiene dueño único (el autor del sitio), rutas, fuentes de datos y
reglas propias. Al crear una spec, indica el/los módulos afectados.

### 5.1 Portafolio

- **Rutas:** `/`, `/experiencia/`, `/certificaciones/`, `/proyectos/`, `/proyectos/[slug]/`.
- **Datos:** colección `proyectos` (schema en `content.config.ts`); experiencia y
  certificaciones están escritas en las propias páginas `.astro`; badges en
  `public/badges/`.
- **Componentes:** `Hero`, `Card`, `Sidebar` (stats: años, certs, nº proyectos), iconos.
- **Nota:** el contador "12 Certs" del `Sidebar` es un literal; debe mantenerse
  sincronizado con `certificaciones.astro`.

### 5.2 Blog

- **Rutas:** `/blog/`, `/blog/[slug]/`, `/blog/tags/`, `/blog/tag/[tag]/`, `/blog/archivo/`, `/rss.xml`, `/llms.txt`.
- **Datos:** colección `blog` (`.md`/`.mdx`). Schema: `titulo`, `fecha`,
  `descripcion ≤160`, `etiquetas`, `tipo` ∈ {tutorial, analisis, opinion,
  caso-estudio, referencia}, `imagen`, `draft`, `destacado`, `resumen`, `tituloSeo`.
- **MDX:** puede importar `Chart` (`embedded`), un único `PlotlyLoader`,
  `MarcadorEconomico`, `MarcadorFutbol`, `Callout`, `FaqSchema`.
- **Series recurrentes:** "Colombia vs <rival> en datos" (Mundial 2026) e
  informes mensuales de inflación/tasas/dólar.
- **Indexación:** tags, archivo y drafts son `noindex` y se excluyen del sitemap.

### 5.3 Observatorio Económico

- **Rutas:** `/observatorio/` (inflación vs tasa), `monetario`, `pib`, `empleo`,
  `comercio`, `demografia`, `acerca`.
- **Arquitectura detallada:** [`src/lib/observatorio/ARCHITECTURE.md`](../src/lib/observatorio/ARCHITECTURE.md)
  (REGLAS 1–19, recetas para agregar indicador/dataset, checklist de PR). Es
  vinculante y este documento no la duplica.
- **Patrón central:** `ChartDef` registrado en `chart-defs/index.ts` + componente
  genérico `Chart.astro`. No se crean componentes `Chart*.astro` por gráfico.

### 5.4 Informes

- **Rutas:** `/observatorio/informes/`, `/observatorio/informes/historia-de-colombia/` (una página `.astro` por informe).
- **Datos:** catálogo estático en `lib/observatorio/informes.ts`; PDFs en
  `public/informes/` enlazados con `urls.informePdf()`.
- `InformePopup` se muestra en todo el sitio salvo en páginas de informe.

### 5.5 Elecciones presidenciales

- **Rutas:** `/elecciones-presidenciales/` (noindex, redirección), `2022`,
  `2022-segunda-vuelta`, `2026`, `2026-segunda-vuelta`.
- **Datos:** `data_pres_*.json`, `data_pres_2026_2v_municipios.json`,
  `public/geo/*.geo.json`. Producidos por `pipeline/elecciones/`
  (`from_wikipedia.py`, `build_municipios_2v.py`) — **ejecución manual**.
- **Restricciones de dominio:**
  - El desglose departamental **no incluye el voto exterior**; los totales
    nacionales salen de `resultados`, nunca de sumar departamentos.
  - `censo`/`participacion` están en 0 a nivel departamental.
  - Los datos 2026 son **preconteo** hasta que se re-ejecute con escrutinio
    definitivo; el estado vive en `definiciones.estado` del JSON.
  - La Registraduría bloquea fetch automatizado (403); la fuente operativa es
    Wikipedia (es).

### 5.6 Calculadoras ciudadanas

- **Rutas:** `/calculadoras/`, `sueldo-vs-inflacion`, `cuanto-ganas`, `en-que-colombia-naciste`.
- **Datos:** mismos JSON del Observatorio (`data_inflacion`, `data_salario_minimo`,
  `data_ingresos`, `data_salarios_cargos`, `data_demografia`, `data_pib`).
- **Lógica:** funciones puras en `lib/calculadoras/` (`calculos.ts`, `ingresos.ts`).
  Toda fórmula nueva va ahí, no inline en la página (ARQ-06).

### 5.7 Transversal: SEO, descubrimiento y analítica

- `SEOHead.astro`: meta, OG/Twitter (og:image **PNG 1200×630**), canonical,
  Dublin Core, fuentes, `Person` JSON-LD en todas las páginas.
- `lib/seo.ts`: `personSchema`, `webSiteSchema` (solo home), `breadcrumbList()`,
  `trail()` + `sectionCrumb`. Las páginas pasan `breadcrumbs` a `BaseLayout`.
- `lib/urls.ts`: única fuente de rutas internas/absolutas.
- Título de página ≤ 60 caracteres (el sufijo de marca solo se añade si cabe).
- `robots.txt`, sitemap filtrado, `llms.txt`, IndexNow, archivos de verificación
  de Bing/Google en `public/`.
- `SearchAction` omitido a propósito (no existe búsqueda en el sitio).

---

## 6. Capa de datos

### 6.1 Inventario de datasets (`public/data/`)

| Dataset | Productor | Automatización |
| --- | --- | --- |
| `data_inflacion.json` | `ingestion/` (BanRep + DANE IPC) | **Cron** (días 5,10,15,20,25) |
| `data_externo.json` | `ingestion/processing/export_externo.py` | **Cron** (incluido en `ingestion.main`) |
| `data_pib.json`, `data_empleo.json`, `data_comercio.json`, `data_demografia.json` | `ingestion/processing/export_*.py` | Manual (`python -m ingestion.processing.export_<x>`) |
| `data_comparativo_col_<key>.json` | `scripts/build-comparativo.mjs` (+ bloque `futbol` editado a mano) | Manual |
| `data_salario_minimo.json` | `pipeline/salario_minimo/` | Manual |
| `data_ingresos.json`, `data_salarios_cargos.json` | `pipeline/ingresos/` | Manual |
| `data_pres_*.json` | `pipeline/elecciones/` | Manual |
| `presidentes.json` | Referencia estática | Manual |

### 6.2 Contrato

Definido en §3 del ARCHITECTURE.md del Observatorio: `metadata` (fuentes,
definiciones, cobertura), `indicadores`, `serie` **descendente** con `periodo`
`"YYYY-MM"`, nulls explícitos. Los tipos TypeScript del contrato viven en
`src/lib/observatorio/types.ts` y solo cambian cuando cambia el shape del JSON.

---

## 7. CI/CD

| Workflow | Disparador | Pasos | Notas |
| --- | --- | --- | --- |
| `deploy.yml` | push a `main`, manual | `withastro/action@v3` (Node 22: install + `npm run build` = `astro build` + link-checker) → `deploy-pages@v4` → ping IndexNow (`continue-on-error`) | `concurrency: pages` evita deploys simultáneos |
| `ingest-monthly.yml` | cron `0 13 5,10,15,20,25 * *`, manual | Python 3.12 → `python -m ingestion.main` → `pytest ingestion/tests` → commit solo si hay diff → build → deploy | Abre issue `bug,ingest` si falla |

**No existe workflow de PR:** hoy ningún check corre antes del merge a `main`.

---

## 8. Reglas de arquitectura (vinculantes)

| ID | Regla |
| --- | --- |
| **ARQ-01** | **Estático siempre.** Nada de SSR, funciones serverless, bases de datos ni secretos en el cliente. Si una feature lo necesita, se discute como cambio de constitución. |
| **ARQ-02** | **Una sola fuente de verdad por dato.** Todo dato cuantitativo nace en un pipeline y vive en `public/data/*.json`. Prohibido hardcodear series o cifras en `.astro`/`.ts` (excepto catálogos de metadata documentados: `informes.ts`, `presidentes.json`, `tags.ts`). |
| **ARQ-03** | **URLs solo desde `lib/urls.ts`.** Enlaces internos terminan en `/` salvo archivos reales. El link-checker rompe el build si no. |
| **ARQ-04** | **SEO desde `lib/seo.ts` y `SEOHead`.** No escribir JSON-LD de `Person`/`BreadcrumbList` a mano. Cada página nueva pasa `breadcrumbs` y un `title` ≤ 60 caracteres y `description` ≤ 160. |
| **ARQ-05** | **Un solo layout.** Toda página usa `BaseLayout`. Los tokens globales viven ahí (ver design-system). |
| **ARQ-06** | **Lógica pura fuera de las páginas.** Cálculos reutilizables van a `lib/` (`derivations.ts`, `calculadoras/`) como funciones puras y testeables. |
| **ARQ-07** | **Gráficos = `ChartDef` + `Chart.astro`.** Datos por `data-client.ts` (nunca `fetch('/data/…')` directo), Plotly solo vía un `<PlotlyLoader />` por página. |
| **ARQ-08** | **Compatibilidad con View Transitions.** Scripts idempotentes, re-enganchados en `astro:page-load`, con guardas tipo `window.__xBound` para listeners globales. |
| **ARQ-09** | **Contenido validado por schema.** Toda colección tiene schema Zod en `content.config.ts`; un campo nuevo de frontmatter se agrega primero al schema. |
| **ARQ-10** | **Imágenes OG en PNG 1200×630.** No convertir og:image a WebP. Optimizar raster con `node scripts/optimize-images.mjs`. |
| **ARQ-11** | **Pipelines reproducibles.** Cada JSON indica su productor y se regenera con un comando documentado. Los datos crudos que se versionan van a `data/raw/<fuente>/`. Ningún pipeline escribe fuera de `data/` y `public/`. |
| **ARQ-12** | **Dependencias con spec.** Agregar una dependencia (npm/pip/CDN) o subir una versión mayor requiere spec + justificación en el plan. Preferir la plataforma (CSS, Web APIs) antes que una librería. |
| **ARQ-13** | **Agnóstico de agente.** La documentación del proyecto vive en `docs/`, `.specify/` y `specs/`. No se crean archivos de instrucciones atados a un proveedor (p. ej. `CLAUDE.md`). Los archivos de integración de agentes (`.claude/`, etc.) son regenerables con `specify integration install` y no son fuente de verdad. |
| **ARQ-14** | **Idioma.** UI, contenido y documentación en español (`es-CO`). Identificadores de código siguen la convención existente (camelCase en TS, snake_case en campos JSON y Python). |
| **ARQ-15** | **Accesibilidad mínima.** `lang="es-CO"`, skip-link, `aria-label` en gráficos y controles, foco visible, respeto de `prefers-reduced-motion`. |
| **ARQ-16** | **Rendimiento.** Plotly bundle `basic` salvo que el gráfico requiera `full`; scripts de terceros solo los ya listados en §2.3. |
| **ARQ-17** | **Git lo administra el autor.** Los agentes editan el working tree; no crean branches, commits, merges ni push. |

## 9. Constraints

- Hosting GitHub Pages: sin cabeceras HTTP personalizadas, sin redirects de
  servidor (se usan páginas `noindex` de redirección), límite de tamaño de sitio.
- El build debe pasar en CI con Node 22 aunque localmente se use otra versión.
- La Registraduría y algunas fuentes bloquean scraping; los pipelines deben
  degradar con elegancia (no romper el build si una fuente no publica).
- Datos publicados son públicos e indexables: nunca incluir datos personales.

---

## 10. Calidad y verificación (Discernment)

| Check | Dónde corre hoy | Estado |
| --- | --- | --- |
| Schema de contenido (Zod) | `astro build` | ✅ |
| Link-checker interno | `npm run build` | ✅ |
| `npx astro check` | Solo manual | ⚠️ falta en CI |
| Tests de ingesta (pytest) | Cron de ingesta | ⚠️ 18 tests / 10 fuentes |
| Tests de `lib/` TypeScript | — | ❌ no existen |
| Validación del contrato JSON (schema) | — | ❌ no existe |
| Checks en Pull Request | — | ❌ no existe workflow |
| Verificación visual (preview) | Manual | ⚠️ |

---

## 11. Deuda técnica conocida

1. `pipeline/elecciones/README.md` referencia archivos inexistentes
   (`config.py`, `generar_jsons.py`, `validar_jsons.py`).
2. §2 del ARCHITECTURE.md del Observatorio no lista demografía, externo,
   comparativo, elecciones ni `monetario.astro`.
3. Dos productores para comparativos (`scripts/build-comparativo.mjs` y
   `ingestion/processing/export_comparativo.py`): definir uno canónico.
4. `matplotlib`/`Pillow` no están en ningún `requirements`.
5. Tailwind instalado pero casi sin uso; 102 colores hex distintos dispersos
   (ver design-system §9).
6. `README.md` es la plantilla de Astro.
7. Contenido: el post de Ghana rotula "octavos" cuando fue "dieciseisavos".

---

## 12. Mantenimiento de este documento

- Se actualiza **en la misma feature** que cambie algo descrito aquí (el
  `plan.md` debe listar "Actualizar docs/architecture.md" como tarea).
- `/speckit-converge` y `/speckit-analyze` deben verificar coherencia con este
  documento.
- Cambios a reglas `ARQ-NN` incrementan la versión (MAJOR si se elimina/relaja
  una regla, MINOR si se agrega, PATCH si se aclara).
