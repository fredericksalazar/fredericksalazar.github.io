# Quickstart & Verification Guide: Automatización de post de análisis de inflación y tasas de interés

**Feature**: `specs/004-automatizacion-post-inflacion`  
**Date**: 2026-10-19  

Esta guía describe cómo ejecutar y validar la automatización tanto de forma local manual como en modo desatendido.

---

## 1. Prerrequisitos

- Node.js >= 22.12
- Repositorio web limpio y dependencias instaladas (`npm install`)
- Dataset actualizado en `public/data/data_inflacion.json`

---

## 2. Flujo de Ejecución Local (Paso a Paso)

### Paso 1: Extracción de Hechos
```bash
node scripts/extract-inflacion-facts.mjs
```
- **Salida esperada**: JSON con `status: "NEEDS_POST"`, periodo actual (`2026-09`), deltas y efecto base calculados.
- Si ya existe el post, emite `status: "UP_TO_DATE"` y termina con código 0.

### Paso 2: Generación de Portada
```bash
node scripts/build-inflacion-cover-hero.mjs
```
- **Salida esperada**: Archivo `public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png` de 1200x630 píxeles, RGB sin canal alfa.

### Paso 3: Redacción del Post
El agente (o la skill `.agents/skills/publicar-informe-inflacion/SKILL.md`) redacta `src/content/blog/inflacion-tasas-interes-colombia-<mes>-<anio>.mdx` guiándose por los hechos extraídos en el Paso 1 y la estructura contractual de `contracts/post-structure.md`.

### Paso 4: Verificación Técnica
```bash
ASTRO_TELEMETRY_DISABLED=1 npx astro check
ASTRO_TELEMETRY_DISABLED=1 npm run build
```
- **Salida esperada**: 0 errores en types y build exitoso con 0 enlaces internos rotos o sin trailing slash.

### Paso 5: Publicación Autónoma y Notificación
```bash
git add src/content/blog/inflacion-tasas-interes-colombia-<mes>-<anio>.mdx public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png
git commit -m "feat(blog): publicar informe de inflación <mes> <anio>"
git push origin main
node scripts/indexnow-submit.mjs https://fredericksalazar.github.io/blog/inflacion-tasas-interes-colombia-<mes>-<anio>/
```

---

## 3. Modo Desatendido (Scheduled Automation)

La automatización programada se configura como un sidecar nativo de Antigravity:
- **Archivo**: `~/.gemini/config/sidecars/auto-informe-inflacion/sidecar.json`
- **Cadencia**: `CRON_TZ=America/Bogota 0 9 6-12 * *` (9:00 AM entre el 6 y el 12 de cada mes).
- **Acción**: Sincroniza Git (`git pull --rebase`), ejecuta la skill `publicar-informe-inflacion`, valida y realiza el push a producción.
