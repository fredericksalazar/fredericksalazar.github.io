# Data Model: Modo claro y modo oscuro

**Feature**: `007-tema-claro-oscuro` · **Date**: 2026-11-10

Este modelo describe el estado del tema (no datos de contenido) y los contratos
de tokens/componentes que lo implementan. No se modifican datasets ni entidades
de `public/data/*.json`.

---

## 1. Entidades

### `ThemePreference`

Elección explícita o implícita del visitante.

```ts
type ThemePreference = 'auto' | 'light' | 'dark';
```

- **Valor por defecto**: `'auto'`.
- **Persistencia**: `localStorage['theme-preference']`.
- **Valores válidos en storage**: exactamente `'auto'`, `'light'`, `'dark'`.
- **Valor inválido/ausente/error de storage**: se normaliza a `'auto'`.

### `ResolvedTheme`

Tema que el sitio está mostrando.

```ts
type ResolvedTheme = 'light' | 'dark';
```

Resolución:

```ts
function resolveTheme(pref: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return systemDark ? 'dark' : 'light';
}
```

### `ThemeState`

Estado observable en un momento dado.

```ts
interface ThemeState {
  preference: ThemePreference;
  theme: ResolvedTheme;
  systemDark: boolean;
  hasStoredPreference: boolean;
}
```

- `hasStoredPreference`: distingue “nunca eligió” de “eligió auto”; no cambia
  el comportamiento, pero permite analítica/QA y el estado del selector.
- `systemDark`: resultado de
  `matchMedia('(prefers-color-scheme: dark)').matches`; en SSR/`undefined` se
  asume `false` (claro) para el fallback estático.

---

## 2. Transiciones de estado

| Estado actual | Evento | Nuevo estado | Efectos |
| --- | --- | --- | --- |
| `preference=auto`, sistema claro | Cambio del sistema a oscuro | `preference=auto`, `theme=dark` | Re-aplicar `data-theme`; actualizar `theme-color`; emitir `themechange`; re-renderizar gráficos. |
| `preference=auto`, sistema oscuro | Cambio del sistema a claro | `preference=auto`, `theme=light` | Igual que arriba. |
| `preference=auto` | El visitante elige `dark` | `preference=dark`, `theme=dark` | Persistir `dark`; actualizar radios; emitir `themechange`; re-renderizar gráficos. |
| `preference=light` | El visitante elige `auto` con sistema oscuro | `preference=auto`, `theme=dark` | Persistir `auto`; actualizar radios; emitir `themechange`. |
| `preference=dark` | El visitante elige `light` | `preference=light`, `theme=light` | Persistir `light`; actualizar radios; emitir `themechange`. |
| Cualquiera | Recarga/navegación | Mismo estado | El pre-pintado aplica antes de pintar; no hay evento visible. |
| Cualquiera | Otra pestaña cambia `theme-preference` | Estado de esa preferencia | Escuchar `storage` y re-aplicar. |
| `preference=*` | Se borra el almacenamiento | `preference=auto` | Volver al sistema. |
| `preference=*` | Valor inválido en storage | `preference=auto` | Ignorar valor; no lanzar error. |

**Invariantes**:

1. `theme` siempre es `light` o `dark`; nunca `auto`.
2. `preference=light` ⇒ `theme=light`; `preference=dark` ⇒ `theme=dark`.
3. `preference=auto` ⇒ `theme` sigue a `systemDark`.
4. El DOM y el storage nunca se contradicen después de `applyTheme`.
5. Ningún cambio de tema modifica contenido, cifras ni metadatos indexables.

---

## 3. Contrato de DOM y almacenamiento

### Atributos en `<html>`

| Atributo | Valores | Cuándo |
| --- | --- | --- |
| `data-theme` | `light` \| `dark` | Siempre tras el pre-pintado; controla los tokens. |
| `data-theme-preference` | `auto` \| `light` \| `dark` | Siempre tras el pre-pintado; útil para el estado del selector y QA. |

### `localStorage`

| Clave | Valores | Escritura |
| --- | --- | --- |
| `theme-preference` | `auto` \| `light` \| `dark` | Solo cuando el visitante elige una opción; `auto` se escribe explícitamente si elige Automático. |

- Toda lectura/escritura va en `try/catch`.
- Si `localStorage` no está disponible, el sitio funciona en `auto` sin errores.

### `meta[name="theme-color"]`

- Claro: `#f6f8fa`.
- Oscuro: `#0f172a`.
- Se actualiza en el pre-pintado y en cada cambio de tema.
- `msapplication-TileColor` se mantiene `#2563eb` (color de marca, no de tema).

---

## 4. Tokens de diseño

### 4.1 Tokens base (se conservan)

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--color-bg` | `#f6f8fa` | `#0f172a` |
| `--color-sidebar` | `#ffffff` | `#111827` |
| `--color-border` | `#d0d7de` | `#334155` |
| `--color-hover` | `#eaeef2` | `#1e293b` |
| `--color-active-bg` | `rgba(37,99,235,0.08)` | `rgba(96,165,250,0.14)` |
| `--color-text-primary` | `#1f2328` | `#f1f5f9` |
| `--color-text-secondary` | `#424a53` | `#cbd5e1` |
| `--color-text-muted` | `#636c76` | `#94a3b8` |
| `--color-accent` | `#2563eb` | `#2563eb` |
| `--color-accent-hover` | `#1d4ed8` | `#3b82f6` |
| `--color-accent-glow` | `rgba(37,99,235,0.15)` | `rgba(96,165,250,0.18)` |
| `--color-tag-bg` | `#eaeef2` | `#1e293b` |
| `--color-tag-border` | `#d0d7de` | `#334155` |
| `--color-tag-text` | `#424a53` | `#cbd5e1` |

> `--color-accent` se mantiene como azul de marca para rellenos y bordes. Para
> texto e íconos se usa `--color-accent-text` (ver 4.3).

### 4.2 Superficies y código

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-surface` | `#ffffff` | `#111827` | Cards, paneles, sidebar. |
| `--color-surface-raised` | `#ffffff` | `#1e293b` | Elementos elevados, hover de cards. |
| `--color-surface-sunken` | `#f6f8fa` | `#0b1220` | Fondos internos, inputs, stats. |
| `--color-surface-overlay` | `rgba(255,255,255,0.96)` | `rgba(15,23,42,0.96)` | Popups, overlays. |
| `--color-code-bg` | `#f6f8fa` | `#0b1220` | Bloques de código. |
| `--color-code-border` | `#d0d7de` | `#334155` | Borde de bloques. |

### 4.3 Acento de texto, foco y estados

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-accent-text` | `#2563eb` | `#60a5fa` | Enlaces, texto de acento, íconos. |
| `--color-accent-text-hover` | `#1d4ed8` | `#93c5fd` | Hover de enlaces. |
| `--color-accent-fill` | `#2563eb` | `#2563eb` | Botones y fondos de marca. |
| `--color-accent-fill-hover` | `#1d4ed8` | `#3b82f6` | Hover de botones. |
| `--color-on-accent` | `#ffffff` | `#ffffff` | Texto sobre relleno azul. |
| `--color-focus` | `#2563eb` | `#60a5fa` | Outline de foco. |
| `--color-status-positive` | `#16a34a` | `#4ade80` | Éxito, positivo. |
| `--color-status-warning` | `#d97706` | `#fbbf24` | Advertencia. |
| `--color-status-danger` | `#dc2626` | `#f87171` | Error, negativo. |
| `--color-status-info` | `#2563eb` | `#60a5fa` | Informativo. |

### 4.4 Gráficos

| Token | Claro | Oscuro | Uso en Plotly |
| --- | --- | --- | --- |
| `--color-chart-grid` | `rgba(208,215,220,0.4)` | `rgba(148,163,184,0.18)` | `yaxis.gridcolor`, grid de bandas. |
| `--color-chart-axis` | `#d0d7de` | `#334155` | `linecolor`, `zerolinecolor` neutro. |
| `--color-chart-hover-bg` | `#ffffff` | `#1e293b` | `hoverlabel.bgcolor`. |
| `--color-chart-text` | `#1f2328` | `#f1f5f9` | `font.color`, títulos. |
| `--color-chart-muted` | `#636c76` | `#94a3b8` | `tickfont.color`, anotaciones. |
| `--color-chart-reference` | `#64748b` | `#94a3b8` | Líneas de referencia (máx/mín/prom). |

### 4.5 Blueprint / hero

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--color-blueprint-bg-start` | `#ffffff` | `#0f172a` |
| `--color-blueprint-bg-end` | `#f5f8ff` | `#111c33` |
| `--color-blueprint-dot` | `rgba(37,99,235,0.18)` | `rgba(96,165,250,0.22)` |
| `--color-blueprint-border` | `rgba(37,99,235,0.18)` | `rgba(96,165,250,0.25)` |
| `--color-blueprint-glow` | `rgba(37,99,235,0.07)` | `rgba(59,130,246,0.12)` |

### 4.6 Sombras

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--color-shadow` | `rgba(15,23,42,0.08)` | `rgba(0,0,0,0.45)` |
| `--color-shadow-strong` | `rgba(15,23,42,0.16)` | `rgba(0,0,0,0.6)` |

### 4.7 `color-scheme`

- Claro: `color-scheme: light`.
- Oscuro: `color-scheme: dark`.
- Sin JS y sistema oscuro: `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { color-scheme: dark; /* tokens oscuros */ } }`.

---

## 5. Contrato del componente `ThemeToggle`

### Entrada

```ts
interface Props {
  /** Opcional: orientación visual; por defecto horizontal. */
  orientation?: 'horizontal' | 'vertical';
  /** Opcional: clase adicional. */
  class?: string;
}
```

### Salida (DOM)

```html
<div class="sidebar__theme" data-theme-toggle>
  <span class="sidebar__theme-label">Tema</span>
  <div class="theme-switch" role="radiogroup" aria-label="Tema de la página">
    <label class="theme-switch__option">
      <input class="theme-switch__input" type="radio" name="theme-preference" value="auto" />
      <span class="theme-switch__content">
        <svg aria-hidden="true">…</svg>
        <span class="theme-switch__text">Automático</span>
      </span>
    </label>
    <label class="theme-switch__option">
      <input class="theme-switch__input" type="radio" name="theme-preference" value="light" />
      <span class="theme-switch__content">
        <svg aria-hidden="true">…</svg>
        <span class="theme-switch__text">Claro</span>
      </span>
    </label>
    <label class="theme-switch__option">
      <input class="theme-switch__input" type="radio" name="theme-preference" value="dark" />
      <span class="theme-switch__content">
        <svg aria-hidden="true">…</svg>
        <span class="theme-switch__text">Oscuro</span>
      </span>
    </label>
  </div>
</div>
```

- El `name` es único en la página (`theme-preference`); no hay otro grupo de
  radios con ese nombre.
- El estado activo se marca con `input:checked + .theme-switch__content`.
- El foco visible usa `input:focus-visible + .theme-switch__content`.
- Los íconos son SVG inline, `aria-hidden="true"`, `focusable="false"`.
- La etiqueta “Tema” es texto visible; el grupo tiene `aria-label`.

### Comportamiento

1. Al montar, `initTheme()` marca el radio cuya `value` coincide con la
   preferencia efectiva (`auto` si no hay storage).
2. `change` en un radio llama `setPreference(value)`.
3. `setPreference` aplica el tema, persiste (try/catch) y emite
   `themechange` si el tema resuelto cambió.
4. En `astro:page-load` se re-sincronizan los radios (el DOM se reemplaza).
5. En móvil, el componente permanece visible; no se oculta con
   `.sidebar__stats`.

---

## 6. Mapeo de gráficos

| Elemento Plotly | Token / función |
| --- | --- |
| `font.color` | `--color-chart-text` |
| `tickfont.color` | `--color-chart-muted` |
| `xaxis.linecolor` | `--color-chart-axis` |
| `yaxis.gridcolor` | `--color-chart-grid` |
| `zerolinecolor` (neutro) | `--color-chart-axis` |
| `hoverlabel.bgcolor` | `--color-chart-hover-bg` |
| `hoverlabel.bordercolor` | `--color-border` |
| `mapbox.style` | `carto-darkmatter` en oscuro, `white-bg` en claro |
| Colores de series | Se conservan; si no alcanzan contraste en oscuro, se aclaran solo en ese tema |

`chartTheme()` devuelve estos valores leyendo `getComputedStyle` en runtime y
usa los valores claros como fallback si no hay DOM.

---

## 7. Reglas de validación

1. `theme-preference` solo puede ser `auto`, `light` o `dark`.
2. `data-theme` solo puede ser `light` o `dark`.
3. `preference=light` ⇒ `data-theme=light`; `preference=dark` ⇒
   `data-theme=dark`.
4. `preference=auto` ⇒ `data-theme` coincide con
   `matchMedia('(prefers-color-scheme: dark)').matches`.
5. `theme-color` coincide con el fondo del tema resuelto.
6. El selector tiene exactamente tres opciones y exactamente una marcada.
7. Ningún control del selector queda oculto en móvil.
8. El cambio de tema no altera `document.title`, metadatos, cifras ni el HTML
   indexable.
