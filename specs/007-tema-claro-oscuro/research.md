# Research: Modo claro y modo oscuro en todo el sitio

**Feature**: `007-tema-claro-oscuro` · **Date**: 2026-11-10

Este documento resuelve las incógnitas técnicas del plan. Cada decisión incluye
la alternativa considerada y por qué se descartó. No se agregaron dependencias.

---

## R1. Modelo de estado y persistencia

**Decisión**: tres estados de preferencia (`auto`, `light`, `dark`) y dos estados
de tema resuelto (`light`, `dark`). La preferencia se guarda en
`localStorage['theme-preference']`; el tema resuelto se refleja en
`<html data-theme="light|dark">`. El estado de preferencia también se refleja en
`<html data-theme-preference="auto|light|dark">` para estilos y pruebas.

- `auto` (valor por defecto, también si el valor guardado es inválido): se usa
  `window.matchMedia('(prefers-color-scheme: dark)')`.
- `light` / `dark`: prevalecen sobre el sistema.
- Si `localStorage` lanza una excepción (modo privado, bloqueo), se usa `auto`
  sin errores visibles.

**Alternativas**:
- Guardar solo `light|dark` y perder “Automático”: incumple FR-008/FR-010.
- Usar cookies: añade peso a las peticiones y no es necesario para un sitio
  estático; `localStorage` ya se usa para `sidebar-collapsed`.
- Usar `sessionStorage`: no persiste entre visitas; incumple FR-009.

---

## R2. Prevención de FOUC (tema desde el primer pintado)

**Decisión**: un script inline en `<head>` de `BaseLayout.astro`, antes de
`ClientRouter`, que:
1. Lee `localStorage['theme-preference']` dentro de `try/catch`.
2. Resuelve el tema con `matchMedia` si la preferencia es `auto` o inválida.
3. Aplica `document.documentElement.dataset.theme` y
   `dataset.themePreference`.
4. Actualiza `meta[name="theme-color"]` al color de fondo del tema resuelto.
5. Se vuelve a ejecutar en `astro:after-swap` (ClientRouter reemplaza los
   atributos de `<html>` en cada navegación).

Se añade un fallback CSS para cuando no hay JavaScript:
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { /* tokens oscuros */ }
}
```
El script es mínimo y no bloquea: no espera fuentes ni datos.

**Alternativas**:
- Aplicar el tema solo en un módulo diferido: produce destello claro en la
  primera visita oscura (incumple FR-002/SC-003).
- Ocultar el `<body>` hasta que cargue el JS: empeora el rendimiento y la
  accesibilidad; no es necesario.
- Usar una cookie leída en el servidor: el sitio es SSG; no hay servidor.

---

## R3. Arquitectura de tokens

**Decisión**: mantener los tokens existentes en `:root` (claro) y añadir un
bloque `:root[data-theme="dark"]` que redefine los mismos tokens más los nuevos
tokens semánticos. Los componentes consumen tokens, nunca hex/rgba de tema.

Tokens nuevos propuestos (valores completos en `data-model.md`):
- Superficies: `--color-surface`, `--color-surface-raised`,
  `--color-surface-sunken`, `--color-surface-overlay`.
- Código: `--color-code-bg`, `--color-code-border`.
- Gráficos: `--color-chart-grid`, `--color-chart-axis`,
  `--color-chart-hover-bg`, `--color-chart-text`, `--color-chart-muted`.
- Blueprint/hero: `--color-blueprint-bg-start`, `--color-blueprint-bg-end`,
  `--color-blueprint-dot`, `--color-blueprint-border`,
  `--color-blueprint-glow`.
- Acento de texto vs. relleno: `--color-accent-text`, `--color-accent-fill`,
  `--color-on-accent`.
- Estados: `--color-status-positive`, `--color-status-warning`,
  `--color-status-danger`, `--color-status-info`.
- Sombras: `--color-shadow`, `--color-shadow-strong`.
- Foco: `--color-focus`.

**Regla de acento**: el azul de marca `#2563eb` se conserva como relleno
(`--color-accent-fill`). Para texto e íconos en oscuro se usa
`--color-accent-text: #60a5fa`, porque `#2563eb` sobre `#0f172a` no alcanza
4.5:1. En claro, `--color-accent-text` es `#2563eb`.

**Alternativas**:
- Un segundo archivo CSS completo para oscuro: duplica reglas y rompe UI-01
  (fuente única de tokens).
- Filtro global `invert()`/`hue-rotate()`: distorsiona fotos, logos, gráficos y
  la marca; inaceptable.
- Variables por componente sin tokens globales: impide el cambio de tema
  coherente y multiplica el mantenimiento.

---

## R4. Paleta oscura

**Decisión**: grises azulados tipo *slate*, no negro puro, con el azul de marca
como acento.

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo | `#f6f8fa` | `#0f172a` |
| Sidebar/superficie | `#ffffff` | `#111827` |
| Superficie elevada | `#ffffff` | `#1e293b` |
| Superficie hundida | `#f6f8fa` | `#0b1220` |
| Borde | `#d0d7de` | `#334155` |
| Hover | `#eaeef2` | `#1e293b` |
| Texto primario | `#1f2328` | `#f1f5f9` |
| Texto secundario | `#424a53` | `#cbd5e1` |
| Texto atenuado | `#636c76` | `#94a3b8` |
| Acento de texto | `#2563eb` | `#60a5fa` |
| Acento de relleno | `#2563eb` | `#2563eb` |
| Éxito | `#16a34a` | `#4ade80` |
| Advertencia | `#d97706` | `#fbbf24` |
| Peligro | `#dc2626` | `#f87171` |
| Info | `#2563eb` | `#60a5fa` |

Los contrastes se validan en `quickstart.md` (WCAG AA). Los colores de series de
gráficos (candidatos, partidos, inflación, etc.) se conservan porque son
identitarios y ya tienen contraste sobre fondos claros; si un color de serie no
alcanza contraste en oscuro, se aclara solo para ese tema mediante el helper de
gráficos.

**Alternativas**:
- Negro puro (`#000000`): incumple FR-021 y cansa la vista.
- Invertir la paleta clara: produce azules y grises incorrectos.
- Tema oscuro con acento amarillo/verde: rompe la identidad de marca.

---

## R5. Componente selector y ubicación

**Decisión**: `src/components/ThemeToggle.astro`, insertado en
`Sidebar.astro` inmediatamente después de `.sidebar__profile` (que ya tiene
`border-bottom`) y antes de `.sidebar__stats`.

- Tres `<input type="radio" name="theme-preference">` nativos, visualmente
  ocultos, dentro de etiquetas con ícono SVG + texto visible
  (`Automático`, `Claro`, `Oscuro`).
- El estado activo se marca con `:checked` y se refleja en
  `aria-checked` mediante el propio control nativo (radio). El grupo lleva
  `role="radiogroup"` y `aria-label="Tema de la página"`.
- En móvil, el sidebar se convierte en barra superior; `.sidebar__stats` se
  oculta hoy, pero el selector **no** se oculta: se acomoda en la fila del
  perfil con `flex-wrap`.
- El cambio se aplica al instante; no recarga.

**Alternativas**:
- Tres botones (`<button>`) con `aria-pressed`: más código y menos semántica de
  selección exclusiva.
- Un `<select>`: cumple, pero el autor pidió tres selectores con ícono y
  etiqueta visibles.
- Un solo botón que alterna claro/oscuro: incumple la opción Automático.

---

## R6. Módulo cliente y contrato de eventos

**Decisión**: `src/lib/theme-client.ts` centraliza:
- `getPreference()`, `setPreference(p)`, `resolveTheme(p)`, `applyTheme(t)`,
  `initTheme()`, `onThemeChange(fn)`.
- `initTheme()` aplica el estado, sincroniza los radios, escucha
  `matchMedia('(prefers-color-scheme: dark)')` (solo en `auto`), escucha
  `storage` (para otras pestañas) y re-aplica en `astro:after-swap` /
  `astro:page-load`.
- Al cambiar el tema resuelto, emite
  `document.dispatchEvent(new CustomEvent('themechange', { detail: { theme, preference } }))`.
- Guardas de idempotencia (`window.__themeBound`) para no duplicar listeners con
  View Transitions.

El script inline de pre-pintado duplica solo la lógica mínima de lectura y
resolución; no importa el módulo (debe ejecutarse antes del bundle). Es una
duplicación deliberada y acotada (~20 líneas), documentada en el contrato.

**Alternativas**:
- Poner toda la lógica en el inline: crece el HTML y duplica la API.
- Usar un store global (`window.__theme`): no es necesario; el contrato DOM +
  evento es suficiente y más testeable.
- Depender de `astro:page-load` para el primer pintado: llega tarde (FOUC).

---

## R7. Gráficos Plotly

**Decisión**:
- Nuevo `src/lib/observatorio/theme-colors.ts` con `chartTheme()` que lee
  `getComputedStyle(document.documentElement)` para
  `--color-chart-*`, `--color-text-*` y `--color-border`, con fallback claro.
- `charts.ts`: `COLORS.textPrimary/textMuted/border` pasan a getters que leen
  los tokens; `FONT` pasa a getters (`family`, `size`, `color`). `baseLayout()`
  usa `chartTheme()` para ejes, grid, hover y fuente. Si el layout trae
  `mapbox`, se reemplaza `style` por `getMapboxStyle()`.
- `getMapboxStyle()` devuelve `carto-darkmatter` en oscuro y `white-bg` en
  claro. Ambos son estilos integrados de Plotly sin token.
- Los literales neutros de `chart-defs` (`#636c76`, `#475569`, `#1f2328`,
  `#d0d7de`, `#64748b`, `#1e293b`, `#0f172a`, `#f1f5f9`, `#e2e8f0`,
  `#cbd5e1`) se reemplazan por `COLORS.*` o `chartTheme()`.
- `Chart.astro` escucha `themechange` y, para cada gráfico montado, vuelve a
  ejecutar `def.build(data)` (datos cacheados por `data-client`) y
  `Plotly.react`. Se preserva la vista actual (línea/barras) leyendo el control
  o el contexto.
- `plotly-mount.ts` añade `reactPlotly(elementId, spec)` para centralizar
  `Plotly.react`; `mountPlotly` sigue igual para la primera carga.

**Alternativas**:
- Recolorear el canvas con CSS: imposible, Plotly dibuja en canvas/SVG con
  colores propios.
- Recargar la página al cambiar de tema: incumple FR-007 y pierde el scroll.
- Recrear los gráficos con `newPlot` en cada cambio: funciona, pero `react` es
  más barato y conserva el estado de zoom.
- Añadir un token de Mapbox: nueva dependencia/secreto; descartado.

---

## R8. Resaltado de código (Shiki)

**Decisión**: en `astro.config.mjs`, cambiar
`shikiConfig.theme: 'github-light'` por:
```js
shikiConfig: {
  themes: { light: 'github-light', dark: 'github-dark' },
  defaultColor: false,
}
```
Y añadir CSS global:
```css
html[data-theme="dark"] .astro-code,
html[data-theme="dark"] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```
Los bloques usan `--color-code-bg`/`--color-code-border` para el contenedor.

**Alternativas**:
- Un solo tema oscuro: rompe el modo claro.
- Resaltado en cliente: añade dependencia y peso; Shiki ya está integrado.
- CSS `filter: invert()`: distorsiona colores semánticos del código.

---

## R9. Imágenes y logos

**Decisión**: no se invierten. Se revisan los contenedores con fondo blanco
(hero partners, avatares, logos de proyectos, imágenes de blog) y se les aplica
`background: var(--color-surface)` o un borde sutil solo cuando el fondo claro
rompa el contraste. Las fotos se mantienen intactas.

**Alternativas**:
- `filter: invert(1)` en imágenes: altera fotos y logos (incumple FR-022).
- `mix-blend-mode`: impredecible y puede romper el contraste.

---

## R10. View Transitions, impresión y reduced motion

**Decisión**:
- `astro:after-swap`: re-aplicar `data-theme` y `data-theme-preference` (el
  script inline y `initTheme`).
- `astro:page-load`: re-sincronizar los radios y re-renderizar gráficos si
  hiciera falta.
- `@media print`: forzar tokens claros (`:root[data-theme]` con valores claros,
  `color-scheme: light`) y ocultar el selector.
- `@media (prefers-reduced-motion: reduce)`: sin transiciones de color/tema.
- `theme-color` se actualiza en el pre-pintado y en cada cambio.

**Alternativas**:
- No re-aplicar en `after-swap`: el tema se pierde al navegar (el `<html>` se
  reemplaza).
- Imprimir en oscuro: gasta tinta y reduce legibilidad; se fuerza claro.

---

## R11. Validación

**Decisión**: `npx astro check` + `npm run build` + matriz manual de
`quickstart.md`. No se añade Playwright ni otro framework: el proyecto no lo
tiene y la feature no lo requiere.

**Alternativas**:
- Añadir pruebas E2E: dependencia y mantenimiento no justificados para un sitio
  estático sin suite previa.
- Solo revisión visual: insuficiente para tipos y enlaces; se mantienen los
  comandos existentes.

---

## Resumen de decisiones

| # | Decisión | Impacto |
| --- | --- | --- |
| R1 | `auto/light/dark` + `localStorage` | Estado simple y persistente |
| R2 | Inline pre-paint + CSS fallback | Sin FOUC, funciona sin JS |
| R3 | Tokens existentes + nuevos semánticos | Migración ordenada y única fuente |
| R4 | Slate oscuro + azul de marca | Identidad y contraste |
| R5 | Radios nativos con ícono + texto | Accesible y visual |
| R6 | `theme-client.ts` + `themechange` | API única y testeable |
| R7 | `theme-colors.ts` + `Plotly.react` + `carto-darkmatter` | Gráficos y mapas legibles |
| R8 | Shiki dual theme | Código legible en ambos temas |
| R9 | Sin invertir imágenes | Respeta fotos/logos |
| R10 | after-swap, print y reduced motion | Navegación e impresión correctas |
| R11 | `astro check` + build + QA manual | Validación proporcionada |
