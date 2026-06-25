import { COLORS, baseLayout } from "../charts";
import type { ChartDef } from "./types";

/**
 * Gráficos comparativos "Colombia vs <oponente>" para los artículos de blog.
 * Doble serie: Colombia (azul de marca) vs el oponente (color propio).
 *
 * Sistema parametrizado: `INDICADORES_CMP` define los indicadores una sola vez y
 * `makeComparativoSet(op)` genera el set completo para un rival. Agregar un rival
 * nuevo = una línea en `export const ...` + el dataset en data-client/data.
 */

const COL = COLORS.brand; // #2563eb

/**
 * Líneas de referencia (máximo y mínimo) sobre el conjunto de AMBAS series.
 * Color neutro (gris) a propósito: el color del oponente ya lo identifica y el
 * rojo podría confundirse con una alerta.
 */
function refMaxMin(
  values: (number | null)[],
  prefix = "",
  unit = "",
): { shapes: unknown[]; annotations: unknown[] } {
  const vals = values.filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return { shapes: [], annotations: [] };
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const dec = max >= 1000 ? 0 : 1;
  const fmt = (n: number) =>
    `${prefix}${n.toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${unit}`;
  const line = (value: number, label: string) => ({
    shape: {
      type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: value, y1: value,
      line: { color: "#94a3b8", width: 1.2, dash: "dot" }, layer: "below",
    },
    ann: {
      xref: "paper", yref: "y", x: 1, xanchor: "right", y: value, yanchor: "bottom",
      text: `${label} · ${fmt(value)}`, showarrow: false,
      font: { size: 9.5, color: "#64748b" },
      bgcolor: "rgba(255,255,255,0.85)", borderpad: 2,
    },
  });
  const hi = line(max, "Máx");
  const lo = line(min, "Mín");
  return { shapes: [hi.shape, lo.shape], annotations: [hi.ann, lo.ann] };
}

interface IndicadorCmp {
  /** Sufijo del id del chart, p. ej. "pib-percapita" → id "cmp-<key>-pib-percapita". */
  suffix: string;
  /** Clave de la serie en el JSON. */
  serieKey: string;
  titulo: string;
  pregunta: string;
  /** Sufijo del eje Y ("" para no-porcentajes; REGLA 13). */
  ySuffix?: string;
  /** Token d3 para el valor en el hover, p. ej. ",.0f". */
  hoverFmt: string;
  hoverPrefix?: string;
  hoverUnit?: string;
  /** Transforma el valor crudo a unidad de display (p. ej. millones→miles de millones). */
  transform?: (v: number) => number;
}

const INDICADORES_CMP: IndicadorCmp[] = [
  {
    suffix: "pib-percapita", serieKey: "pib_percapita",
    titulo: "PIB per cápita (USD corrientes)",
    pregunta: "Cuánto produce la economía por habitante.",
    hoverFmt: ",.0f", hoverPrefix: "US$ ",
  },
  {
    suffix: "pib-total", serieKey: "pib_total",
    titulo: "PIB total (miles de millones USD)",
    pregunta: "El tamaño total de cada economía.",
    hoverFmt: ",.1f", hoverPrefix: "US$ ", hoverUnit: " mil M",
    transform: (v) => v / 1000,
  },
  {
    suffix: "poblacion", serieKey: "poblacion",
    titulo: "Población (millones de habitantes)",
    pregunta: "Cuántas personas viven en cada país a lo largo del tiempo.",
    hoverFmt: ".1f", hoverUnit: " M hab.",
    transform: (v) => v / 1_000_000,
  },
  {
    suffix: "inflacion", serieKey: "inflacion",
    titulo: "Inflación anual (%)",
    pregunta: "Cuánto suben los precios cada año. Más bajo es mejor.",
    ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
  },
  {
    suffix: "desempleo", serieKey: "desempleo",
    titulo: "Tasa de desempleo (%)",
    pregunta: "Porcentaje de la fuerza laboral sin empleo.",
    ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
  },
  {
    suffix: "gini", serieKey: "gini",
    titulo: "Desigualdad — coeficiente de Gini",
    pregunta: "0 = igualdad total, 100 = desigualdad máxima.",
    hoverFmt: ".1f",
  },
  {
    suffix: "esperanza-vida", serieKey: "esperanza_vida",
    titulo: "Esperanza de vida al nacer (años)",
    pregunta: "Promedio de años de vida esperados al nacer.",
    hoverFmt: ".1f", hoverUnit: " años",
  },
  {
    suffix: "apertura", serieKey: "apertura",
    titulo: "Apertura comercial (% del PIB)",
    pregunta: "Exportaciones + importaciones sobre el PIB: qué tan integrada al comercio está la economía.",
    ySuffix: "%", hoverFmt: ".1f", hoverUnit: "%",
  },
  {
    suffix: "deuda-externa", serieKey: "deuda_externa",
    titulo: "Deuda externa (% del PIB)",
    pregunta: "Cuánto debe cada país al exterior frente al tamaño de su economía.",
    ySuffix: "%", hoverFmt: ".1f", hoverUnit: "%",
  },
  {
    suffix: "ied", serieKey: "ied",
    titulo: "Inversión extranjera directa (% del PIB)",
    pregunta: "Capital extranjero que entra como inversión productiva, frente al PIB.",
    ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
  },
];

interface Oponente {
  /** Clave corta para ids/datasets (uzb, cog, ...). */
  key: string;
  datasetName: "comparativo-col-uzb" | "comparativo-col-cog" | "comparativo-col-prt";
  /** Nombre visible del oponente en leyenda/hover. */
  label: string;
  /** Color de la serie del oponente (distinto del azul de Colombia). */
  color: string;
}

function makeDef(ind: IndicadorCmp, op: Oponente): ChartDef {
  return {
    id: `cmp-${op.key}-${ind.suffix}`,
    titulo: ind.titulo,
    pregunta: ind.pregunta,
    fuenteTexto: "Banco Mundial — World Development Indicators",
    datasets: [op.datasetName],
    height: 380,
    ariaLabel: `${ind.titulo}: comparación Colombia vs ${op.label} según el Banco Mundial`,
    build(data) {
      const cmp = data[op.datasetName]!;
      const serie = cmp.series[ind.serieKey] ?? [];
      const tx = (v: number | null) =>
        v === null ? null : ind.transform ? ind.transform(v) : v;
      const x = serie.map((p) => `${p.anio}-01-01`);
      const co = serie.map((p) => tx(p.colombia));
      const opv = serie.map((p) => tx(p.oponente));
      const hover = `${ind.hoverPrefix ?? ""}%{y:${ind.hoverFmt}}${ind.hoverUnit ?? ""}`;
      const refs = refMaxMin([...co, ...opv], ind.hoverPrefix ?? "", ind.hoverUnit ?? "");
      return {
        traces: [
          {
            name: "Colombia", x, y: co, mode: "lines+markers", connectgaps: true,
            line: { color: COL, width: 2.4 }, marker: { size: 5, color: COL },
            hovertemplate: `<b>%{x|%Y}</b><br>Colombia: <b>${hover}</b><extra></extra>`,
          },
          {
            name: op.label, x, y: opv, mode: "lines+markers", connectgaps: true,
            line: { color: op.color, width: 2.4 }, marker: { size: 5, color: op.color },
            hovertemplate: `<b>%{x|%Y}</b><br>${op.label}: <b>${hover}</b><extra></extra>`,
          },
        ],
        layout: baseLayout({
          title: {
            text: `<b>${ind.titulo}</b>`,
            font: { size: 14, color: "#1f2328" },
            x: 0, xanchor: "left", xref: "paper", y: 0.97, yanchor: "top",
          },
          showlegend: true,
          legend: { orientation: "h", yanchor: "top", y: -0.16, xanchor: "center", x: 0.5, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
          hovermode: "x unified",
          margin: { l: 60, r: 28, t: 46, b: 56 },
          yaxis: {
            showgrid: true, gridcolor: "rgba(208,215,220,0.4)", zeroline: false,
            tickfont: { size: 11, color: "#636c76" }, ticksuffix: ind.ySuffix ?? "", automargin: true,
          },
          shapes: refs.shapes,
          annotations: refs.annotations,
        }),
      };
    },
  };
}

const makeComparativoSet = (op: Oponente): ChartDef[] =>
  INDICADORES_CMP.map((ind) => makeDef(ind, op));

/** Set Colombia vs Uzbekistán (ids `cmp-uzb-*`). */
export const comparativoUzb = makeComparativoSet({
  key: "uzb", datasetName: "comparativo-col-uzb", label: "Uzbekistán", color: "#16a34a",
});

/** Set Colombia vs RD Congo (ids `cmp-cog-*`). */
export const comparativoCog = makeComparativoSet({
  key: "cog", datasetName: "comparativo-col-cog", label: "RD Congo", color: "#d97706",
});

/** Set Colombia vs Portugal (ids `cmp-prt-*`). */
export const comparativoPrt = makeComparativoSet({
  key: "prt", datasetName: "comparativo-col-prt", label: "Portugal", color: "#dc2626",
});
