# Observatorio de Datos · Arquitectura y reglas para agentes

> **Este documento es vinculante.** Cualquier agente (humano o IA) que vaya a
> agregar indicadores, datasets, gráficos o páginas al Observatorio **debe**
> leerlo completo antes de proponer cambios. Las reglas marcadas como
> "**REGLA**" no son negociables: violar una es un bug.

---

## 1. Modelo mental

El Observatorio es un **pipeline de tres capas** que separa la generación del
dato, la entrega del dato y la presentación del dato. Cada capa tiene una
única responsabilidad y un contrato de salida.

```
  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
  │ 1. Pipeline (Python) │ →  │ 2. JSON públicos     │ →  │ 3. Astro + Plotly    │
  │  ETL automático      │    │  public/data/*.json  │    │  Charts en cliente   │
  └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
   - Descarga fuentes         - Contrato estable           - Lectura por `fetch`
   - Procesa / normaliza      - Versionable                - SEO build-time
   - Calcula indicadores      - Reemplazable               - SPA / View Trans
```

**REGLA 1 — Una sola fuente de verdad.** Todo dato cuantitativo del
Observatorio nace en el pipeline y se materializa en
`public/data/*.json`. Está prohibido hardcodear series, valores numéricos o
metadatos de fuente en TypeScript/Astro fuera del fallback documentado en
[`fuentes.ts`](./fuentes.ts).

**REGLA 2 — Los gráficos nunca incrustan datos en el HTML.** Todo gráfico
descarga su serie via `fetch` en tiempo de ejecución. Si para editar un valor
del JSON tienes que recompilar la página, **algo está mal**.

**REGLA 3 — El above-the-fold sí puede ser build-time.** KPIs, headlines,
JSON-LD y metadata para SEO se renderizan estáticamente desde
[`data.ts`](./data.ts). Para esto y solo para esto se permite leer los JSON en
el frontmatter de Astro.

---

## 2. Estructura de archivos

```
public/data/
  data_inflacion.json    ← Pipeline → JSON. Contrato: ObservatorioData
  data_empleo.json       ← Pipeline → JSON. Contrato: EmpleoData
  data_comercio.json     ← Pipeline → JSON. Contrato: ComercioData
  data_pib.json          ← Pipeline → JSON. Contrato: PIBData
  presidentes.json       ← Referencia estática (no es serie temporal)

src/lib/observatorio/
  types.ts               ← Tipos del contrato JSON. SOLO se toca cuando el pipeline cambia el shape.
  data.ts                ← Lectura build-time. Solo KPIs/SEO. NO tocar para gráficos.
  data-client.ts         ← Runtime fetch + caché compartida. Nuevo dataset = nuevo loader aquí.
  derivations.ts         ← Cálculos puros derivados (joins, regresiones, agregaciones).
  charts.ts              ← Tokens visuales: COLORS, FONT, baseLayout, extractSerie.
  plotly-mount.ts        ← Ciclo de vida Plotly. NO duplicar este sistema.
  plotly.d.ts            ← Tipos de window.Plotly.
  presidentes-client.ts  ← Lookup de presidentes por año (runtime).
  fuentes.ts             ← Fallback temporal de fuentes mientras pipeline no las publique.
  chart-defs/
    types.ts             ← ChartDef y ChartBuildResult.
    index.ts             ← REGISTRY: aquí se registran todos los chart-defs.
    inflacion.ts         ← Defs del dominio "inflación/tasa".
    pib.ts               ← Defs del dominio "PIB".
    empleo.ts            ← Defs del dominio "empleo".
    comercio.ts          ← Defs del dominio "comercio".
    historico.ts         ← Defs con presidente-toggle (charts históricos anuales).

src/components/observatorio/
  Chart.astro            ← Componente genérico ÚNICO. Recibe un id de chart-def.
  ChartContainer.astro   ← Shell visual (card + estados loading/error).
  PlotlyLoader.astro     ← Carga del CDN. UNA sola instancia por página.
  KpiRow.astro           ← KPIs (build-time, SEO crítico).
  IndicadorCard.astro    ← Card de KPI.
  IndicadorPanel.astro   ← Panel narrativo (texto + gráfico).
  PageHeader.astro       ← Header con eyebrow + lead.
  DashboardNav.astro     ← Tabs de navegación entre dashboards.
  DashboardFooter.astro  ← Footer común con fuentes + cobertura.
  GlosarioGrid.astro     ← Grid de glosario.
  MapaColombia.astro     ← Visual del hero.

src/pages/observatorio/
  index.astro            ← Dashboard "Inflación vs Tasa".
  empleo.astro           ← Dashboard "Empleo".
  comercio.astro         ← Dashboard "Comercio".
  pib.astro              ← Dashboard "PIB".
  acerca.astro           ← Página estática.
```

**REGLA 4 — Un componente nuevo de gráfico es casi siempre un error.** Antes
de crear un nuevo `Chart*.astro`, lee el procedimiento de §5 (agregar un
indicador). El 95% de los casos se resuelven creando un `ChartDef` y
reutilizando [`Chart.astro`](../../components/observatorio/Chart.astro).

---

## 3. Contrato del JSON

Todo dataset emitido por el pipeline DEBE cumplir:

```ts
{
  metadata: {
    ultima_actualizacion: string,         // ISO 8601
    fuentes: Record<string, Fuente>,      // siempre incluye 'calculo_propio' cuando aplique
    definiciones: Record<string, string | number>,
    cobertura: {
      primer_periodo: string,             // "YYYY-MM"
      ultimo_periodo: string,
      total_registros: number,
      granularidad?: "anual" | "mensual",
    },
  },
  indicadores: Record<string, Indicador>, // valor actual + delta + variación
  serie: Array<{ periodo: "YYYY-MM", ...campos }>,  // DESCENDENTE (más reciente primero)
  historico?: Record<string, number>,     // opcional, anual "YYYY" → valor
  // campos adicionales específicos del dominio (matrices, productos, etc.)
}
```

**REGLA 5 — `serie` viene descendente.** El pipeline siempre entrega la serie
con el período más reciente primero. Las funciones `*Asc` de
[`data-client.ts`](./data-client.ts) invierten para uso en gráficos cronológicos.
No reordenes manualmente.

**REGLA 6 — `periodo` siempre `"YYYY-MM"`.** Conversión a fecha ISO se hace
con `periodoToISODate()` de [`charts.ts`](./charts.ts).

**REGLA 7 — Nulls explícitos.** Valores faltantes son `null`, no `0` ni
`undefined`. `extractSerie` ya respeta esto.

---

## 4. Capa de datos: cuándo usar cada API

| Necesitas… | Usa… | Dónde |
|---|---|---|
| Valor de KPI para HTML inicial / SEO / JSON-LD | `getObservatorio()`, `getEmpleo()`, `getComercio()`, `getPIB()` | [`data.ts`](./data.ts), frontmatter de la página |
| Serie completa para un chart | `loadInflacionAsc()`, `loadPIBAsc()`, `loadComercioAsc()`, `loadEmpleoAsc()` | Dentro del `build()` de un ChartDef |
| Múltiples datasets en un chart | `loadDatasets(['pib','comercio'])` | Lo hace `Chart.astro` automáticamente vía `def.datasets` |
| Lista de presidentes | `getPresidentesClient()` | [`presidentes-client.ts`](./presidentes-client.ts) |
| Joins / regresiones / agregaciones derivadas | Funciones de [`derivations.ts`](./derivations.ts) | Si no existe, **agrégala ahí** y reúsa |
| Tokens de color / layout base | `COLORS`, `FONT`, `baseLayout()`, `extractSerie()` | [`charts.ts`](./charts.ts) |

**REGLA 8 — Nunca llames a `fetch('/data/...')` directo.** Todo pasa por
`data-client.ts` para reusar la caché en memoria.

**REGLA 9 — Nunca leas JSON con `node:fs` fuera de `data.ts`.** Esa es la
única excepción permitida (build-time SEO).

**REGLA 10 — Derivaciones puras en `derivations.ts`.** Si un cálculo se usa
en más de un sitio (build-time + runtime, o dos charts), va a `derivations.ts`
como función pura. No duplicar.

---

## 5. Procedimiento: agregar un indicador nuevo

Estos pasos son la receta canónica. Sigue el orden.

### 5.1 — ¿El dato ya vive en algún JSON?

- **Sí, y solo necesitas graficarlo:** salta a §5.3.
- **No, es un campo nuevo:** primero coordina con el pipeline para que lo
  publique en el JSON correspondiente. **No agregues el campo solo en código.**
  Mientras el pipeline no esté listo, tu trabajo está bloqueado — díselo al
  usuario, no inventes datos.

### 5.2 — Actualizar el contrato de tipos

Cuando el pipeline confirme un nuevo campo, refleja la estructura exacta en
[`types.ts`](./types.ts). Mantén nombres `snake_case` (como vienen del JSON).
Si el campo es opcional/aún no disponible en todos los datasets, márcalo `?`.

### 5.3 — Decidir el tipo de gráfico

| Caso | Plantilla |
|---|---|
| Línea simple sobre 1 campo de 1 dataset | def estilo `inflacionAnual` en `chart-defs/inflacion.ts` |
| Barras (categórico o temporal con color condicional) | def estilo `crecimientoPib` o `balanzaComercial` |
| Doble eje | def estilo `poblacionPib` o `pibComercio` |
| Cross-dataset (join temporal) | def con `datasets: ['x','y']` y helper en `derivations.ts` |
| Heatmap / barras apiladas con submatriz | def estilo `matrizExportaciones` |
| Barra histórica anual con color-por-presidente + toggle | def en `chart-defs/historico.ts` |

### 5.4 — Crear el `ChartDef`

Ubicación: `chart-defs/{dominio}.ts`. **No** crear un archivo Astro nuevo.

```ts
// chart-defs/empleo.ts (ejemplo)
export const miNuevoIndicador: ChartDef = {
  id: "mi-nuevo-indicador",          // kebab-case, único en el registry
  titulo: "Título visible",
  pregunta: "Pregunta breve al lector.",  // omitible si la calcula build()
  fuenteTexto: "DANE — GEIH",        // texto crudo de fuente
  datasets: ["empleo"],              // qué datasets cargar (orden libre)
  height: 340,                       // px
  ariaLabel: "Descripción accesible",
  build({ empleo }) {                // destructura datasets cargados
    const { x, y } = extractSerie(empleo!.serie, "mi_campo");
    return {
      traces: [/* ... */],
      layout: baseLayout(/* overrides */),
      // opcional:
      // pregunta: "Pregunta dinámica calculada a partir de los datos",
      // headerHtml: "<...>",   // se inyecta en el slot header-extra
      // footerHtml: "<...>",   // se inyecta en el slot footer-extra
      // onMount: (target) => { /* binding extra tras renderizar */ },
    };
  },
};
```

### 5.5 — Registrar el def

En [`chart-defs/index.ts`](./chart-defs/index.ts) añade el import y la entrada
en `CHART_DEFS`. **El id es la única clave.** TypeScript te avisará si
duplicas un id.

### 5.6 — Usar en la página

```astro
<Chart id="mi-nuevo-indicador" embedded={true} />
```

Eso es todo. `Chart.astro` se encarga de:
- Renderizar el `ChartContainer` con título, pregunta, fuente.
- Cargar los datasets vía `loadDatasets(def.datasets)`.
- Ejecutar `def.build(data)`.
- Inyectar `headerHtml` / `footerHtml` si los hay.
- Llamar `mountPlotly()`.
- Manejar estados loading / error.

### 5.7 — Si el indicador es un KPI nuevo en cabecera

Además del def del gráfico, expón el valor en el frontmatter de la página
con `getEmpleo()/...` y pásalo a `<KpiRow indicadores={...}/>` o a
`<PageHeader>`. Recuerda: KPIs son SSG (REGLA 3).

### 5.8 — Verificar

1. `npx astro check` → 0 errores nuevos.
2. `npm run dev` → cargar la página, confirmar que el chart pinta sin
   pasar por `data-state="error"`.
3. Network tab → confirmar que `data_*.json` se descarga (no está incrustado).
4. **Editar manualmente el JSON sin recompilar:** cambiar un valor en
   `public/data/data_xxx.json`, recargar el navegador. El chart debe reflejar
   el cambio. Si requiere `npm run build`, has violado la REGLA 2.

---

## 6. Procedimiento: agregar un dataset nuevo

Si el pipeline emite un JSON completamente nuevo (ej. `data_fiscal.json`):

1. Define el tipo `FiscalData` en [`types.ts`](./types.ts).
2. Agrega `getFiscal()` en [`data.ts`](./data.ts) (SEO/KPIs).
3. Agrega `loadFiscal()` y `loadFiscalAsc()` en [`data-client.ts`](./data-client.ts)
   siguiendo el patrón existente. Añade `"fiscal"` a la unión `DatasetName` y
   a `ASC_LOADERS`.
4. Si va en una página nueva, crea `src/pages/observatorio/fiscal.astro` y
   agrega la entrada en [`DashboardNav.astro`](../../components/observatorio/DashboardNav.astro)
   (`slug` debe coincidir con el `active=""` que pase la página).
5. Cualquier chart con esos datos usa `datasets: ["fiscal"]` en su ChartDef.

---

## 7. Reglas visuales y de UX

- **REGLA 11 — Tokens centralizados.** Colores siempre desde `COLORS` en
  [`charts.ts`](./charts.ts). No hex sueltos dispersos.
- **REGLA 12 — `baseLayout()` siempre.** Cualquier layout de Plotly empieza
  con `baseLayout({ ...overrides })`. No reescribir la base.
- **REGLA 13 — Sufijo del eje Y.** Si la métrica no es `%`, pasa explícitamente
  `yaxis: { ticksuffix: "" }` (ver `pibHistorico` en `historico.ts`).
- **REGLA 14 — Altura por chart.** Define `height` en el def. No CSS inline en
  la página.
- **REGLA 15 — Accesibilidad.** Siempre `ariaLabel` en el def. El container
  añade `role="img"` automáticamente.
- **REGLA 16 — Sin emojis en código** salvo que el usuario los pida
  explícitamente.

---

## 8. Reglas de SEO

- **REGLA 17 — Indicadores actuales en HTML.** Los valores que aparecen en
  `PageHeader`, `KpiRow` y JSON-LD se renderizan desde `data.ts` en build, no
  se cargan por fetch. Esto es crítico para indexación.
- **REGLA 18 — JSON-LD por página.** Cada dashboard incluye `<script
  type="application/ld+json">` con `Dataset` + `Article`. Si agregas una
  página, replica el patrón de las existentes.
- **REGLA 19 — Fuentes en el JSON.** Las URLs y nombres de fuentes vienen de
  `metadata.fuentes`. Si necesitas una fuente que el pipeline aún no expone
  (ej. "cálculo propio"), úsala desde [`fuentes.ts`](./fuentes.ts) con
  fallback. **Avísalo al pipeline para que la mueva al JSON.**

---

## 9. Anti-patrones (no hacer)

- ❌ Crear un nuevo `Chart*.astro` por chart. → Usar `ChartDef` + `Chart.astro`.
- ❌ Pasar `serie={...}` o `historico={...}` como prop. → Cargar en cliente
  con `loadDatasets`.
- ❌ Embeber datos en `<script type="application/json">` o `define:vars`.
- ❌ `fetch('/data/...')` directo desde un componente.
- ❌ `readFileSync` fuera de `data.ts`.
- ❌ Inyectar el script CDN de Plotly por tu cuenta. → Usar `<PlotlyLoader />`
  una vez por página.
- ❌ Pasar `AbortSignal` al `fetch` de la caché compartida (rompe a otros
  consumidores). Usar `signal.aborted` como guard a nivel de consumidor.
- ❌ Duplicar lógica de `mountPlotly`/`registerChart`. → Importar desde
  [`plotly-mount.ts`](./plotly-mount.ts).
- ❌ Hardcodear hex colors o copiar `baseLayout` parcialmente.
- ❌ Recalcular promedios anuales o joins en línea cuando ya existe el helper
  en `derivations.ts`. → Agregarlo ahí si falta.
- ❌ Crear archivos `.md` de documentación nuevos sin que el usuario lo pida.

---

## 10. Checklist de Pull Request

Antes de cerrar un cambio en el Observatorio, valida punto por punto:

- [ ] El cambio no añade `Chart*.astro` específicos (salvo justificación
      explícita).
- [ ] Todo gráfico nuevo tiene un `ChartDef` registrado en
      `chart-defs/index.ts`.
- [ ] Ningún dato cuantitativo se incrustó en HTML/TS (verifica con
      `grep -r '<dato_clave>' src/`).
- [ ] `npx astro check`: 0 errores.
- [ ] `npm run build`: pasa.
- [ ] `npm run dev`: los charts cargan en estado `ready` (no `error`).
- [ ] Editar manualmente un valor del JSON correspondiente se refleja al
      recargar sin recompilar.
- [ ] Si se tocó `types.ts`, las cuatro páginas siguen compilando.
- [ ] Si se agregó una página, está en `DashboardNav.astro` y tiene su
      JSON-LD.

---

## 11. Cuando algo no encaja

Si un caso real no cabe en este modelo, **detente y consulta antes de romper
la arquitectura**. Posibles señales:

- "Necesito interactividad compleja que el toggle de presidente no cubre."
  → Plantea si extender `ChartDef` con un nuevo hook genérico, no metas
  scripts ad-hoc.
- "Mi gráfico necesita un dataset que no existe."
  → Bloqueado por pipeline (REGLA 1). Documenta el bloqueo.
- "Necesito un cálculo solo para SEO y solo build-time."
  → Va en `data.ts`. No lo dupliques en `derivations.ts`.
- "El usuario quiere que un valor numérico salga en el HTML inicial."
  → KPI build-time (REGLA 17). No es un chart.

**La arquitectura existe para que los cambios sean predecibles.** Si vas a
romperla, justifícalo en un comentario en el código y comunícalo al revisor.
