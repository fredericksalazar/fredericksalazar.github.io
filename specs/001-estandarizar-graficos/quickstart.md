# Quickstart · Validar la feature 001

Guía para comprobar que la feature cumple la spec. Detalle técnico en
[contracts/chart-def.md](./contracts/chart-def.md) y
[data-model.md](./data-model.md).

## Prerrequisitos

```bash
npm install
```

## 1. Verificaciones automáticas

```bash
npx astro check
```
Esperado: 0 errores nuevos.

```bash
npm run build
```
Esperado: build exitoso y link-checker sin errores.

Búsqueda que debe devolver **cero** resultados en las recetas del Observatorio
(comparativos y elecciones están fuera de alcance):

```bash
grep -n "Plotly.react\|Plotly.restyle\|makeMinMaxMeanRefs\|lineBarToggle\|minMaxAvgLines\|xanchor: \"right\"" src/lib/observatorio/chart-defs/{inflacion,externo,historico,pib,empleo,demografia,comercio}.ts
```

## 2. Recorrido visual

```bash
npm run dev
```

Abrir cada página y revisar los gráficos listados en
[research.md](./research.md) (inventario):

| Página | Ruta |
|---|---|
| Inflación vs tasa | `/observatorio/` |
| Monetario | `/observatorio/monetario/` |
| PIB | `/observatorio/pib/` |
| Empleo | `/observatorio/empleo/` |
| Comercio | `/observatorio/comercio/` |
| Demografía | `/observatorio/demografia/` |

En **cada uno de los 21 gráficos con control**:

- [ ] El control "Línea | Barras" aparece a la derecha de la cabecera, con "Línea" activo.
- [ ] "Barras" muestra los mismos valores; las líneas de referencia siguen visibles.
- [ ] En mixtos y doble eje, solo las series de línea pasan a barras y cada una conserva su eje.
- [ ] Volver a "Línea" restaura la vista original, sin recargar.
- [ ] Cambiar un gráfico no altera los demás de la página.
- [ ] Con teclado: Tab llega al control, Enter/Espacio cambia la vista.
- [ ] Los controles propios (mostrar inflación, color por presidente) siguen funcionando en ambas vistas.

En **todo gráfico con líneas de referencia** (de los 38 del Observatorio):

- [ ] Todas las etiquetas están a la izquierda con formato "Etiqueta · valor" y coma decimal.
- [ ] Máx rojo, Promedio gris, Mín verde, trazo discontinuo.
- [ ] La meta del BanRep se ve igual en `inflacion-anual`, `pib-inflacion` e `inflacion-historica`: verde, punteada, "Meta BanRep · 3 %".
- [ ] En `gini-evolucion` (eje fijo 40–62) la cercanía entre etiquetas se mide sobre ese rango fijo: si dos quedan a menos del 6 % (≈ 1,3 puntos), aparecen combinadas.
- [ ] Ninguna etiqueta tapa el último dato; etiquetas cercanas aparecen combinadas.

## 3. Blog (herencia)

Abrir `/blog/inflacion-tasas-interes-colombia-agosto-2026/` y
`/blog/precio-dolar-colombia-julio-2026/`:

- [ ] Los gráficos del Observatorio incrustados se comportan igual que en su página de origen.
- [ ] Los comparativos de "Colombia vs rival" no cambian (fuera de alcance).

## 4. Móvil

Con la vista de 375 px:

- [ ] El control sigue visible y usable en cada gráfico.

## Línea base (T001, 2026-10-14, antes de implementar)

| Verificación | Resultado |
|---|---|
| `npx astro check` | 103 archivos · **0 errores · 0 advertencias** · 45 hints |
| `npm run build` | **160 páginas** generadas · link-checker: 0 enlaces internos sin barra final |
