# Contract: Tema claro/oscuro

**Feature**: `007-tema-claro-oscuro` · **Date**: 2026-11-10

Contrato observable entre el HTML/CSS, el módulo `theme-client.ts`, el selector
`ThemeToggle.astro`, los gráficos y cualquier consumidor futuro. Los nombres son
estables; cambiarlos requiere actualizar este documento y `data-model.md`.

---

## 1. Contrato de DOM

### 1.1 `<html>`

| Atributo | Tipo | Valores | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| `data-theme` | string | `light` \| `dark` | Sí, tras el pre-pintado | Tema resuelto. Controla todos los tokens. |
| `data-theme-preference` | string | `auto` \| `light` \| `dark` | Sí, tras el pre-pintado | Preferencia efectiva. |

Reglas:

- Ambos atributos viven en `document.documentElement`.
- El pre-pintado los establece antes de que se pinte el `<body>`.
- `astro:after-swap` los vuelve a establecer (ClientRouter reemplaza `<html>`).
- Sin JavaScript, `data-theme` puede estar ausente; el CSS de
  `prefers-color-scheme` cubre el caso.

### 1.2 `meta[name="theme-color"]`

| Tema | Valor |
| --- | --- |
| `light` | `#f6f8fa` |
| `dark` | `#0f172a` |

Debe existir exactamente un `meta[name="theme-color"]`. Se actualiza en el
pre-pintado y en cada cambio de tema.

### 1.3 Selector

- Contenedor: `[data-theme-toggle]`.
- Grupo: `[role="radiogroup"][aria-label="Tema de la página"]`.
- Opciones: `input[type="radio"][name="theme-preference"]` con
  `value` ∈ `{auto, light, dark}`.
- Etiquetas visibles: `Automático`, `Claro`, `Oscuro`.
- Exactamente una opción `checked`.
- En móvil, el contenedor no debe tener `display: none`.

---

## 2. Contrato de almacenamiento

| Clave | Valores | Lectura | Escritura |
| --- | --- | --- | --- |
| `theme-preference` | `auto` \| `light` \| `dark` | Al iniciar y en `storage` | Al elegir una opción |

Reglas:

- Toda operación va en `try/catch`; un error no debe propagarse ni mostrarse.
- Un valor ausente, vacío o inválido se trata como `auto`.
- `auto` se escribe explícitamente cuando el visitante elige “Automático” (para
  distinguirlo de “nunca eligió”, aunque el comportamiento sea el mismo).
- No se guardan preferencias del sistema ni estado derivado.

---

## 3. Contrato de eventos

### 3.1 `themechange`

Se emite en `document` cada vez que cambia el **tema resuelto** (no cuando solo
cambia la preferencia sin cambiar el tema).

```ts
interface ThemeChangeDetail {
  theme: 'light' | 'dark';
  preference: 'auto' | 'light' | 'dark';
}

document.dispatchEvent(
  new CustomEvent<ThemeChangeDetail>('themechange', {
    detail: { theme, preference },
  }),
);
```

- `bubbles`: `false` (se emite en `document`; no necesita burbujear).
- `cancelable`: `false`.
- Los consumidores deben ser idempotentes: pueden recibir el evento varias veces
  si el tema se re-aplica.
- No se emite en el pre-pintado inicial (no hay consumidores aún); los gráficos
  leen el estado actual al montar.

### 3.2 Eventos de Astro

| Evento | Acción del tema |
| --- | --- |
| `astro:after-swap` | Re-aplicar `data-theme`, `data-theme-preference` y `theme-color`. |
| `astro:page-load` | Re-sincronizar radios y re-renderizar gráficos si el tema cambió durante la navegación. |
| `astro:before-swap` | No requiere acción específica; `plotly-mount` ya purga los gráficos. |

### 3.3 `storage`

- Escuchar `storage` para la clave `theme-preference`.
- Si `event.key === 'theme-preference'`, re-leer y aplicar la preferencia.
- Si `event.key === null` (clear), volver a `auto`.

### 3.4 `matchMedia`

- Instancia: `window.matchMedia('(prefers-color-scheme: dark)')`.
- Escuchar `change` solo cuando `preference === 'auto'`; si es manual, ignorar.
- Al cambiar a `auto`, registrar el listener si no estaba; al pasar a manual,
  puede permanecer registrado pero debe ignorar los cambios.

---

## 4. Contrato del módulo `src/lib/theme-client.ts`

```ts
export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeChangeDetail {
  theme: ResolvedTheme;
  preference: ThemePreference;
}

export const THEME_STORAGE_KEY = 'theme-preference';

export function getPreference(): ThemePreference;
export function setPreference(preference: ThemePreference): void;
export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme;
export function applyTheme(
  theme: ResolvedTheme,
  preference: ThemePreference,
): void;
export function initTheme(): void;
export function onThemeChange(
  handler: (detail: ThemeChangeDetail) => void,
): () => void;
```

Reglas:

- `getPreference()` nunca lanza; devuelve `auto` si el storage falla.
- `setPreference()` valida el valor; si es inválido, usa `auto`.
- `setPreference()` persiste y aplica; si el tema resuelto cambia, emite
  `themechange`.
- `resolveTheme()` es pura y no toca el DOM.
- `applyTheme()` actualiza `<html>`, `theme-color` y el estado de los radios.
- `initTheme()` es idempotente; usa `window.__themeBound` para no duplicar
  listeners.
- `onThemeChange()` devuelve una función de limpieza.
- El módulo no debe importarse en el script inline de pre-pintado.

### 4.1 Script inline de pre-pintado

Requisitos mínimos (puede duplicar lógica, no importar el módulo):

1. Leer `localStorage['theme-preference']` en `try/catch`.
2. Validar el valor; si no es válido, usar `auto`.
3. Resolver con `matchMedia('(prefers-color-scheme: dark)')`.
4. Establecer `data-theme` y `data-theme-preference`.
5. Actualizar `meta[name="theme-color"]`.
6. Re-ejecutar en `astro:after-swap`.

No debe contener lógica de UI, gráficos ni persistencia.

---

## 5. Contrato del componente `ThemeToggle`

### 5.1 API

```ts
interface Props {
  orientation?: 'horizontal' | 'vertical'; // default: horizontal
  class?: string;
}
```

### 5.2 Requisitos

- Renderiza exactamente tres opciones con ícono SVG + texto visible.
- Usa radios nativos; no usa `div` clicables ni `role="radio"` manual.
- El grupo tiene `aria-label="Tema de la página"`.
- El texto “Tema” es visible (etiqueta de sección) y no reemplaza el
  `aria-label` del grupo.
- El estado activo se refleja con `:checked`; no depende solo del color.
- El foco es visible en ambos temas.
- No usa animaciones si `prefers-reduced-motion: reduce`.
- En móvil permanece visible y usable.
- El componente no contiene lógica de persistencia propia; delega en
  `theme-client.ts`.

### 5.3 Ubicación

- En `Sidebar.astro`, después de `.sidebar__profile` y antes de
  `.sidebar__stats`.
- En el DOM, el divisor visual es el `border-bottom` de `.sidebar__profile`.
- No se duplica en otras partes del sitio.

---

## 6. Contrato de gráficos

### 6.1 `src/lib/observatorio/theme-colors.ts`

```ts
export interface ChartTheme {
  text: string;
  muted: string;
  border: string;
  grid: string;
  hoverBg: string;
  reference: string;
  mapStyle: 'white-bg' | 'carto-darkmatter';
}

export function chartTheme(): ChartTheme;
export function getMapboxStyle(): 'white-bg' | 'carto-darkmatter';
```

- Lee `getComputedStyle(document.documentElement)`.
- Si no hay DOM, devuelve los valores claros.
- `mapStyle` se deriva de `document.documentElement.dataset.theme`.

### 6.2 `charts.ts`

- `COLORS.textPrimary`, `COLORS.textMuted`, `COLORS.border` son getters que
  llaman a `chartTheme()`.
- `FONT.family`, `FONT.size`, `FONT.color` son getters; `...FONT` funciona.
- `baseLayout()` aplica los tokens a `font`, `xaxis`, `yaxis` y `hoverlabel`.
- Si `overrides.mapbox` existe, su `style` se reemplaza por
  `getMapboxStyle()`; el resto de la configuración de mapbox se conserva.

### 6.3 `plotly-mount.ts`

- `mountPlotly(elementId, spec)` se mantiene para la primera carga.
- Nuevo `reactPlotly(elementId, spec)`:
  - Si el elemento no existe o no está montado, delega en `mountPlotly`.
  - Si está montado, llama `Plotly.react(target, spec.traces, spec.layout, spec.config)`.
  - Mantiene `setState('ready')`.
- No se añaden listeners globales por gráfico.

### 6.4 `Chart.astro`

- En `themechange`, para cada host registrado:
  1. Leer la vista actual (línea/barras) del control o del contexto.
  2. Volver a ejecutar `def.build(data)` con los datos cacheados.
  3. Reconstruir `headerHtml`/`footerHtml` sin duplicar controles.
  4. Llamar `reactPlotly` con el nuevo layout.
  5. Recrear el contexto con la vista preservada.
- El listener de `themechange` se registra una sola vez
  (`window.__chartThemeBound`).
- No se re-ejecuta `onMount` si no es necesario; si se reconstruye el header,
  se re-bindean los controles.

---

## 7. Contrato sin JavaScript

- El HTML debe incluir el selector, pero sin JS no cambia la preferencia.
- El CSS debe aplicar el tema oscuro si el sistema lo prefiere:
  `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`.
- El contenido debe seguir siendo legible y navegable.
- Los gráficos siguen funcionando con su tema por defecto (claro) si no hay JS;
  no se garantiza el re-render dinámico sin JS.

---

## 8. Contrato de impresión

- `@media print` fuerza tokens claros y `color-scheme: light`.
- El selector se oculta (`display: none`).
- Los gráficos y el contenido se imprimen legibles; no se invierten imágenes.
- No se depende de `data-theme` para imprimir.

---

## 9. Contrato de accesibilidad

| Requisito | Implementación |
| --- | --- |
| Rol de selección exclusiva | `role="radiogroup"` + radios nativos |
| Nombre accesible | `aria-label="Tema de la página"` |
| Estado | `:checked` nativo; los lectores anuncian “seleccionado” |
| Teclado | Flechas dentro del grupo, Tab para entrar/salir, Espacio para elegir |
| Foco visible | `:focus-visible` con `--color-focus` |
| Contraste | ≥ 4.5:1 texto normal; ≥ 3:1 texto grande/íconos |
| Movimiento | Sin transiciones con `prefers-reduced-motion: reduce` |
| Etiquetas visibles | “Automático”, “Claro”, “Oscuro” siempre visibles |

---

## 10. Pruebas de contrato (manuales)

1. `document.documentElement.dataset.theme` es `light` o `dark` en cada página.
2. `document.documentElement.dataset.themePreference` coincide con el radio
   marcado.
3. `localStorage['theme-preference']` coincide con la elección.
4. Cambiar el sistema en `auto` actualiza `data-theme` y emite `themechange`.
5. Cambiar a manual ignora los cambios del sistema.
6. Recargar conserva la elección.
7. Navegar con ClientRouter conserva la elección y no parpadea.
8. Borrar storage vuelve a `auto`.
9. Storage bloqueado no lanza errores y el sitio funciona en `auto`.
10. Los gráficos se recolorean al cambiar de tema sin recargar.
11. Los mapas usan `carto-darkmatter` en oscuro y `white-bg` en claro.
12. Los bloques de código usan el tema Shiki correcto.
13. Imprimir produce una página legible en claro.
14. El selector es operable con teclado y anuncia su estado.
