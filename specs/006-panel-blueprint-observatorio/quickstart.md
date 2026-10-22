# Quickstart & Verification Guide: `006-panel-blueprint-observatorio`

## Prerrequisitos

- Node.js `>=22.12.0`
- Dependencias instaladas (`npm install`)

## 1. Verificación estática de tipos

```bash
ASTRO_TELEMETRY_DISABLED=1 npx astro check
```

**Resultado esperado:** `0 errors`, `0 warnings`.

## 2. Build de producción y verificador de enlaces internos

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

**Resultado esperado:**
- `astro build` genera todas las páginas estáticas en `dist/` sin errores.
- `scripts/check-internal-links.mjs` reporta `✓ Internal links OK — 0 enlaces internos sin trailing slash`.

## 3. Verificación de reutilización (SC-001)

Comprobar que las tres secciones de `src/pages/observatorio/index.astro` usan `<PanelBlueprint` y que no quedan selectores duplicados de retícula o halo en la página:

```bash
grep -c "<PanelBlueprint" src/pages/observatorio/index.astro
```

**Resultado esperado:** `3`.

## 4. Revisión visual en servidor de desarrollo

```bash
npm run dev
```

Abrir `http://localhost:4321/observatorio/` y comprobar:
1. La sección **01 · Cómo va Colombia** está dentro de su `PanelBlueprint` con retícula sutil y las 8 tarjetas blancas de indicadores destacan con nitidez.
2. La sección **02 · Últimas publicaciones** usa el mismo `PanelBlueprint` con las 4 tarjetas del blog/informes.
3. La sección **03 · Quiénes somos + Misión y Visión** usa el mismo `PanelBlueprint` y las dos tarjetas de Misión y Visión tienen fondo blanco limpio.
4. En vista móvil (`375px`) y tablet (`768px`) no hay desbordamiento horizontal y las grillas colapsan según los breakpoints del sistema de diseño.
