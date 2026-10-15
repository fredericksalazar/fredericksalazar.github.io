# Contrato · Controles de cabecera y líneas estadísticas

Interfaz interna entre `Chart.astro`, `chart-defs/color-presidente.ts`,
`charts.ts` y las recetas (`chart-defs/*.ts`). Amplía el contrato de
`specs/001-estandarizar-graficos/contracts/chart-def.md`.

## 1. Interruptor de vista (lo emite solo `Chart.astro`)

```html
<label class="pres-toggle" data-vistas-control>
  <span class="pres-toggle__label">Ver en barras</span>
  <input type="checkbox" class="pres-toggle__input" role="switch"
         aria-label="Ver en barras" />          <!-- checked si vistas[0] === "barras" -->
  <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
</label>
```

- Se emite solo si `def.vistas` incluye `"linea"` y `"barras"`.
- Va al final de `.chart-controls`, después del `headerHtml` de la receta.
- La receta sigue declarando `vistas: ["linea", "barras"]`; nunca escribe este
  marcado.

## 2. Interruptor "Color por presidente" (solo `color-presidente.ts`)

```ts
headerHtml: presToggleHtml(prefix, soloEnBarras)   // input sin "checked", con role="switch" y aria-label
footerHtml: presLeyendaHtml(prefix, presidentes)   // data-visible="false"
onMount: (target, ctx) => bindColorPresidente({ target, ctx, prefix, traza, soloEnBarras })
```

- `traza(false)` es la traza inicial (color por defecto). Invariante: **ningún**
  gráfico arranca con `traza(true)`.
- No existe otra implementación del interruptor (se eliminan `renderToggle` /
  `renderLegend` de `historico.ts` y `bindPresidenteToggle` de `Chart.astro`).

## 3. Líneas estadísticas

```ts
const ref = lineasReferencia(valores, {
  sufijo: "%", decimales: 2,      // como el tooltip del gráfico
  rangoY,                         // obligatorio si la receta fija yaxis.range
  extra: [META_BANREP],           // opcional
});
layout: baseLayout({
  shapes: [...propias, ...ref.shapes],
  annotations: [...propias, ...ref.annotations],
});
```

- Colores, trazos y etiquetas ("Máx", "Mín", "Prom") salen de `charts.ts`; las
  recetas no los fijan (sin opción `etiquetaPromedio`).
- Esta sección y la 1 reemplazan la sección 3 de
  `specs/001-estandarizar-graficos/contracts/chart-def.md` (control segmentado).
- `buildHistorico(id, { …, referencias: { maximo: true, minimo: true, promedio: true } })`.
