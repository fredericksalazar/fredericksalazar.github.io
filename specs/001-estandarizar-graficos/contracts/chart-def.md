# Contrato · ChartDef con vistas y líneas de referencia

Interfaz interna que deben cumplir las recetas de gráficos del Observatorio
(`src/lib/observatorio/chart-defs/*.ts`) y el componente `Chart.astro`.

## 1. Receta con cambio Línea | Barras

```ts
export const desempleo: ChartDef = {
  id: "desempleo",
  // …título, datasets, height, ariaLabel…
  vistas: ["linea", "barras"],          // activa el control
  build(data) {
    const ref = lineasReferencia(y, { sufijo: "%" });
    return {
      traces: [/* trazas de línea normales */],
      layout: baseLayout({ shapes: ref.shapes, annotations: ref.annotations }),
    };
  },
};
```

La receta **no** escribe HTML del control ni trazas de barras: `Chart.astro` las
deriva con `aVista()`.

## 2. Receta con controles propios

```ts
onMount(target, ctx) {
  // controles propios (p. ej. "Mostrar inflación", "Color por presidente")
  input.addEventListener("change", () => ctx.render(trazasSegunEstado()));
  ctx.alCambiarVista((vista) => { /* mostrar u ocultar controles propios */ });
}
```

Prohibido en recetas: `window.Plotly.react` y `window.Plotly.restyle`.

## 3. Marcado del control (lo emite `Chart.astro`)

```html
<div class="chart-toggle" role="group" aria-label="Tipo de gráfico">
  <button type="button" class="chart-toggle__btn is-active" data-vista="linea" aria-pressed="true">Línea</button>
  <button type="button" class="chart-toggle__btn" data-vista="barras" aria-pressed="false">Barras</button>
</div>
```

Se ubica en el slot `header-extra`, a la derecha y **después** de los controles
propios de la receta.

## 4. Garantías

| Garantía | Requisito |
|---|---|
| Vista inicial "Línea" | FR-004 |
| Mismos datos, título, fuente, colores y referencias en ambas vistas | FR-005 |
| Sin recarga y solo afecta a su gráfico | FR-006 |
| Teclado + `aria-pressed` | FR-007 |
| Una sola implementación del control y de las referencias | FR-008 |
