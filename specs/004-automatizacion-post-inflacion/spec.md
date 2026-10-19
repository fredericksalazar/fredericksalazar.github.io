# Feature Specification: Automatización de post de análisis de inflación y tasas de interés con publicación e indexación automática

**Feature Directory**: `specs/004-automatizacion-post-inflacion`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "diseñemos la automatización, en este caso yo tengo instalado gemini app en mi OS, vamos a usar este agente para que haga el proceso de escritura y publicación automática del post de analisis de inflación y tasas de interes, guiame paso a paso en lo que debemos hacer. 1 - si sigamos el speckit para dejar un producto completo y definido. 2 - en este caso el agente debe tener autonomia para hacer el commit y el pull a github y que la pagina se compile y publique automáticamente, ademas si podemos registrar las paginas en google search y bing search para indexar automáticamente mejor."

---

## Contexto de producto *(Constitution Check G1)*

| Campo | Valor |
|---|---|
| **Objetivos** | **O1 · Autoridad** (publicación analítica rigurosa, inmediata y profesional con el corte del DANE/BanRep) y **O2 · Monetización** (captura de tráfico de búsqueda en las primeras 24 horas del dato económico para atraer clientes de consultoría/datos). |
| **Pilares** | **P4 · Blog (content marketing y SEO)** (serie recurrente mensual) y **P3 · Observatorio de Datos de Colombia** (reutilización directa de datasets y componentes `Chart`). |
| **KPIs** | **K6 · Frescura del Observatorio** (latencia ≤ 24h desde la actualización de `data_inflacion.json`), **K1 · Impresiones orgánicas** y **K3 · Tráfico orgánico**. |
| **Principios de producto** | **PRD-02** (credibilidad antes que volumen), **PRD-03** (indexable primero: HTML y JSON-LD nativos), **PRD-05** (rigor de datos: cifras 100% derivadas de `public/data/data_inflacion.json`), **PRD-07** (nada inventado). |
| **Reglas ARQ / UI** | **ARQ-01** (sitio estático SSG), **ARQ-02** (una sola fuente de verdad por dato), **ARQ-19** (reutilización de `Chart` de `tasa-interes`, `inflacion-anual` y `spread`), **UI-01/02** (Google Sans Flex, azul de marca). |
| **Excepción de gobernanza** | **ARQ-17 (Git es del autor)**: El autor autoriza explícitamente **autonomía de Git** para este flujo automatizado, permitiendo ejecutar `git pull`, `git add`, `git commit` y `git push origin main` únicamente tras validación exitosa de `npx astro check` y `npm run build`. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Detección y redacción analítica determinista con portada (Priority: P1)

Como autor del sitio y profesional de datos, quiero que el sistema detecte de forma automática cuando `public/data/data_inflacion.json` contenga un nuevo período mensual no publicado, extraiga los indicadores de forma 100% determinista, genere la portada visual OpenGraph (1200x630) y redacte el artículo `.mdx` con análisis, FAQs estructuradas y gráficos interactivos, para no tener que redactar manualmente las cifras cada mes.

**Why this priority**: Es el núcleo funcional del producto (MVP). Sin esto, no hay contenido que publicar ni indexar.

**Independent Test**: Ejecutar el script extractor y el redactor en el corte `2026-09`. Debe generar el archivo `src/content/blog/inflacion-tasas-interes-colombia-septiembre-2026.mdx` y la imagen `public/images/blog/inflacion-tasas-colombia-septiembre-2026-cover.png` con valores exactos coincidentes con `data_inflacion.json`.

**Acceptance Scenarios**:
1. **Given** un nuevo corte en `public/data/data_inflacion.json` (ej. `2026-09`) que no tiene archivo `.mdx` en `src/content/blog/`, **When** se ejecuta el flujo, **Then** se calculan los hechos (variación mensual, anual, tasa BanRep, spread, efecto base y récords del año) y se redacta el `.mdx` con metadatos completos y componentes `<Chart />`.
2. **Given** que el período actual ya cuenta con un artículo publicado (ej. `2026-08`), **When** se evalúa el corte, **Then** el sistema reporta `UP_TO_DATE` y termina sin modificar archivos ni gastar cómputo innecesario.

---

### User Story 2 - Verificación de calidad, compilación y despliegue autónomo en Git (Priority: P2)

Como autor, quiero que el agente verifique la integridad técnica de la página generada mediante chequeo de tipos y build de producción antes de realizar `git commit` y `git push` a la rama `main`, garantizando que GitHub Actions compile y despliegue el sitio a GitHub Pages sin intervención manual.

**Why this priority**: Permite que la publicación sea verdaderamente desatendida y confiable, sin riesgo de romper el sitio en producción.

**Independent Test**: Simular la generación de un post; si `npm run build` falla, el proceso debe abortar sin realizar commit ni push. Si pasa con 0 errores, realiza el commit semántico y el push a `main`.

**Acceptance Scenarios**:
1. **Given** un artículo nuevo generado y validado con `npx astro check` (0 errores) y `npm run build` (0 errores, enlaces con trailing slash correctos), **When** el agente procede a la etapa de despliegue, **Then** realiza `git add` de los artefactos del post, genera un commit descriptivo (ej: `feat(blog): publicar informe de inflación septiembre 2026`) y hace `git push origin main`.
2. **Given** un error de compilación o enlace roto durante `npm run build`, **When** se detecta la falla, **Then** el agente no realiza ningún commit ni push, revierte los cambios inválidos y reporta el diagnóstico del error.

---

### User Story 3 - Notificación de indexación automática en motores de búsqueda (Priority: P3)

Como estratega de contenido, quiero que una vez desplegado el nuevo artículo se notifique a los motores de búsqueda (Bing/Yandex vía IndexNow y envío de sitemap / URLs para Google Search Console) para que el post sea indexado de inmediato durante el pico de búsquedas del informe de inflación.

**Why this priority**: Asegura que el contenido capitalice el tráfico orgánico y la autoridad SEO rápidamente tras cada publicación mensual.

**Independent Test**: Ejecutar `scripts/indexnow-submit.mjs` con la URL canónica del nuevo post y verificar respuesta HTTP 200/202 de la API de IndexNow, además de verificar la integración con el sitemap para Google.

**Acceptance Scenarios**:
1. **Given** un nuevo post publicado en `https://fredericksalazar.github.io/blog/inflacion-tasas-interes-colombia-septiembre-2026/`, **When** se dispara el webhook post-despliegue de IndexNow en GitHub Actions, **Then** la API de IndexNow recibe y encola la URL.
2. **Given** la actualización del sitemap `sitemap-index.xml` tras el build, **When** se ejecuta el paso de indexación, **Then** se asegura que la nueva URL esté incluida en el sitemap con `lastmod` actualizado para rastreo prioritario de Google.

---

## Edge Cases

1. **Datos incompletos o nulos:** Si `data_inflacion.json` presenta `null` en indicadores clave del último mes (ej. IPC publicado pero acta del BanRep aún no cargada), el generador debe detectar la inconsistencia y no publicar un post parcial; debe alertar y pausar.
2. **Colisión de ejecución simultánea:** Si el pipeline de datos (`odc-data-pipeline`) actualiza datos mientras se ejecuta el agente local, el agente debe hacer `git pull --rebase` antes de intentar cualquier commit para evitar conflictos de ramas.
3. **Fallo de conexión o límites de API:** Si falla la llamada a la API de indexación o timeout en el push, no debe corromperse el historial de Git local.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE contar con un script de extracción determinista (`scripts/extract-inflacion-facts.mjs`) que procese `public/data/data_inflacion.json` y emita una estructura JSON con los hechos numéricos indiscutibles (mes actual, anterior, año pasado, deltas, efecto base y récord del año).
- **FR-002**: El sistema DEBE generar automáticamente la imagen de portada en formato PNG RGB de 1200x630 píxeles (`public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png`) mediante `scripts/build-inflacion-cover-hero.mjs` utilizando las cifras extraídas.
- **FR-003**: El contenido del post DEBE crearse en formato `.mdx` en `src/content/blog/` con slug estandarizado `inflacion-tasas-interes-colombia-<mes>-<anio>.mdx`.
- **FR-004**: El post DEBE incluir el frontmatter obligatorio (título, SEO, descripción ≤ 160 caracteres, fecha, autor, tags, imagen, tipo `analisis`, `destacado: true`).
- **FR-005**: El post DEBE reutilizar los componentes estándar del Observatorio: `<PlotlyLoader />`, `<FaqSchema />` (con mínimo 5 preguntas y respuestas específicas del mes) y `<Chart id="inflacion-anual" embedded={true} />`, `<Chart id="tasa-interes" embedded={true} />`, `<Chart id="spread" embedded={true} />`.
- **FR-006**: El sistema DEBE validar localmente el sitio con `npx astro check` y `npm run build` antes de realizar operaciones de publicación.
- **FR-007**: El sistema DEBE contar con autonomía para sincronizar el repositorio (`git pull`), registrar los archivos creados (`git add`), comprometerlos con mensaje semántico (`git commit`) y enviarlos a la rama principal (`git push origin main`).
- **FR-008**: El sistema DEBE notificar la nueva URL canónica a los motores de búsqueda mediante el script de IndexNow (`scripts/indexnow-submit.mjs`) y la actualización del sitemap indexable.
- **FR-009**: Se DEBE empaquetar el flujo operativo en una skill reproducible (`.agents/skills/publicar-informe-inflacion/SKILL.md`) y documentar su automatización programada (`sidecar.json`).

### Key Entities

- **Ficha de Hechos (InflationFacts)**: Objeto estructurado que contiene:
  - `periodo`: `YYYY-MM` y nombre en español.
  - `inflacion_anual`, `inflacion_mensual`, `tasa_interes`, `spread`: valor actual, delta mensual, delta anual, dirección (`subio`, `bajo`, `igual`).
  - `efecto_base`: mes saliente de hace 12 meses y valor vs mes entrante actual.
  - `contexto`: máximo/mínimo del año, número de meses de pausa/ajuste del BanRep.
  - `rutas`: path al archivo `.mdx` resultante y path a la imagen OpenGraph.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Generación de un artículo completo de inflación en menos de 90 segundos desde la detección de nuevos datos.
- **SC-002**: 0 errores en `npx astro check` y 0 errores en `npm run build` (100% de enlaces internos con trailing slash).
- **SC-003**: 0 discrepancias numéricas entre el texto del artículo y `public/data/data_inflacion.json`.
- **SC-004**: Despliegue automático a producción (GitHub Pages) e indexación en IndexNow (HTTP 200/202) completados exitosamente sin requerir intervención manual del autor.

---

## Assumptions

- Los datos del pipeline en `public/data/data_inflacion.json` provienen de `odc-data-pipeline` ya validados por sus tests de esquema y no regresión.
- El entorno local del autor cuenta con permisos de push autenticados hacia el remoto `origin` en GitHub.
- El secret `WEB_REPO_TOKEN` y el workflow de GitHub Actions `deploy.yml` siguen activos y configurados para ejecutar `indexnow-submit.mjs` tras el despliegue.
