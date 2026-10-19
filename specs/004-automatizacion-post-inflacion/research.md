# Research & Technical Decisions: Automatización de post de análisis de inflación y tasas de interés

**Feature**: `specs/004-automatizacion-post-inflacion`  
**Date**: 2026-10-19  

## 1. Detección y extracción de datos determinista

- **Decisión**: Implementar un script en Node.js ESM (`scripts/extract-inflacion-facts.mjs`) que cargue `public/data/data_inflacion.json` y emita por `stdout` (o archivo temporal JSON) una ficha de hechos normalizada (`InflationFacts`).
- **Rationale**:
  - Garantiza **PRD-02** y **PRD-05**: la IA nunca calcula porcentajes, restas ni deltas a partir de números sueltos; los datos vienen pre-calculados con precisión exacta.
  - Compara `metadata.cobertura.ultimo_periodo` con los archivos existentes en `src/content/blog/` para devolver un estado (`NEEDS_POST` o `UP_TO_DATE`).
  - Calcula automáticamente el **efecto base**: compara la variación mensual del mes saliente (hace 12 meses, ej. septiembre 2025: `0,32 %`) con la del mes entrante (septiembre 2026: `0,37 %`).
- **Alternativas consideradas**:
  - *Calcular en Python*: Añade dependencia de runtime Python en el repo web que fue recientemente limpiado en la spec 003. Node 22 ya está instalado y disponible en todo el entorno web.
  - *Que el LLM lea el JSON directamente*: Riesgo inaceptable de alucinación o redondeo erróneo en cifras financieras clave.

---

## 2. Generación de la imagen de portada OpenGraph

- **Decisión**: Reutilizar y parametrizar `scripts/build-inflacion-cover-hero.mjs`.
- **Rationale**:
  - Ya está construido, usa `sharp` para generar un PNG RGB 1200x630 optimizado para redes sociales (Facebook, X, WhatsApp, LinkedIn) sin canal alfa.
  - Lee directamente las cifras reales de `data_inflacion.json` e incrusta el mapa de Colombia y la tipografía de marca.
  - El nombre del archivo se estandariza a `public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png`.
- **Alternativas consideradas**:
  - *Generar portada con Matplotlib (`build-inflacion-cover.py`)*: Requiere entorno virtual Python y no coincide con la línea visual "hero blueprint" de [DESIGN-SYSTEM.md](../../agents/DESIGN-SYSTEM.md).

---

## 3. Redacción del artículo MDX y componentes interactivos

- **Decisión**: Estructurar el artículo `.mdx` utilizando los componentes nativos del Observatorio:
  - `<PlotlyLoader />`
  - `<FaqSchema items={[...]} />` con 5 preguntas clave actualizadas con los datos del mes.
  - 3 gráficos embebidos: `<Chart id="inflacion-anual" embedded={true} />`, `<Chart id="tasa-interes" embedded={true} />`, y `<Chart id="spread" embedded={true} />`.
  - Tabla comparativa de 3 columnas: [Mismo mes año anterior] vs [Mes inmediatamente anterior] vs [Mes actual].
  - Metadatos frontmatter completos: `titulo`, `tituloSeo`, `fecha`, `descripcion` (≤ 160 caracteres), `etiquetas`, `autor: "Frederick Salazar"`, `imagen`, `tipo: "analisis"`, `destacado: true`, `resumen`.
- **Rationale**: Cumple **ARQ-19** (reutilización ante todo). Un gráfico nunca se duplica, se invoca por `<Chart id="…">`. El contenido interactivo corre en cliente vía Plotly pero el HTML contiene todas las cifras para SEO (**PRD-03**).

---

## 4. Control de calidad y validación previa a Git

- **Decisión**: Ejecutar en secuencia `ASTRO_TELEMETRY_DISABLED=1 npx astro check` y `ASTRO_TELEMETRY_DISABLED=1 npm run build` antes de cualquier acción en Git.
- **Rationale**:
  - Valida el esquema de la colección de contenido `blog` (`src/content.config.ts`), tipos TypeScript y la sintaxis MDX.
  - El hook de build ejecuta `scripts/check-internal-links.mjs`, garantizando que todos los enlaces internos terminen en `/` sin enlaces rotos.
  - Si cualquiera de los dos comandos falla (código de salida != 0), el flujo se detiene de inmediato.

---

## 5. Autonomía de Git y Despliegue

- **Decisión**: Implementar la sincronización y publicación en un step autónomo:
  1. `git pull --rebase origin main` (para asegurar sincronización con commits automáticos de `odc-data-pipeline`).
  2. `git add` de los artefactos generados (post `.mdx`, imagen de portada y actualización opcional de flags `destacado` en post anterior).
  3. `git commit -m "feat(blog): publicar informe de inflación <mes> <año>"`
  4. `git push origin main`
- **Rationale**:
  - El autor autorizó expresamente esta excepción a **ARQ-17** para esta automatización.
  - Al hacer push a `main`, se activa inmediatamente el workflow de GitHub Actions `.github/workflows/deploy.yml` que compila y despliega a GitHub Pages.

---

## 6. Notificación e Indexación en Motores de Búsqueda (Bing / Google)

- **Decisión**: Estrategia combinada en dos capas:
  1. **Bing / Yandex (IndexNow)**:
     - El workflow `.github/workflows/deploy.yml` ya tiene un step post-despliegue que ejecuta `node scripts/indexnow-submit.mjs`.
     - Adicionalmente, el script local de publicación puede invocar `node scripts/indexnow-submit.mjs https://fredericksalazar.github.io/blog/inflacion-tasas-interes-colombia-<mes>-<anio>/` para notificar de forma individual inmediatamente.
  2. **Google Search Console**:
     - Google eliminó su endpoint anónimo de ping en 2023. La indexación en Google se optimiza mediante:
       a) Entrada inmediata de la URL en `@astrojs/sitemap` con `lastmod: new Date()` en el build.
       b) Enlace interno destacado desde `/blog/` y `/observatorio/`.
       c) Enlaces sindicados en `rss.xml` y `llms.txt`.
- **Rationale**: Proporciona el rastreo más veloz posible sin requerir credenciales de servicio complejas ni comprometer seguridad.

---

## 7. Empaquetamiento y Automatización Programada

- **Decisión**:
  1. Crear la Skill del proyecto en `.agents/skills/publicar-informe-inflacion/SKILL.md` (y espejo en `.claude/skills/publicar-informe-inflacion/SKILL.md`).
  2. Diseñar la automatización programada en `<configDir>/sidecars/auto-informe-inflacion/sidecar.json` con horario cron `CRON_TZ=America/Bogota 0 9 6-12 * *` (se ejecuta diariamente a las 9:00 AM entre los días 6 y 12 de cada mes, ventana en que DANE y BanRep liberan los datos).
- **Rationale**: Permite ejecución manual bajo demanda por el autor ("corre la skill de inflación") o ejecución 100% desatendida por el sidecar programado.
