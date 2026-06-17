import { COLORS, baseLayout } from "../charts";
import type { ChartDef } from "./types";

/**
 * Gráficos comparativos Colombia vs Uzbekistán para el artículo de blog.
 * Dataset: data_comparativo_col_uzb.json (Banco Mundial WDI). Doble serie:
 * Colombia (azul de marca) vs Uzbekistán (verde).
 */

const COL = COLORS.brand; // #2563eb
const UZB = "#16a34a";
const FUENTE = "Banco Mundial — World Development Indicators";

/**
 * Líneas de referencia (máximo y mínimo) sobre el conjunto de AMBAS series.
 * Color neutro (gris) a propósito: el verde ya identifica a Uzbekistán y el rojo
 * podría confundirse con una alerta. Devuelve shapes + annotations para baseLayout.
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

interface CmpOpts {
  id: string;
  serieKey: string;
  titulo: string;
  pregunta: string;
  /** Sufijo del eje Y ("" para no-porcentajes; REGLA 13). */
  ySuffix?: string;
  /** Token de formato d3 para el valor en el hover, p. ej. ",.0f". */
  hoverFmt: string;
  /** Texto antes del valor en el hover (p. ej. "US$ "). */
  hoverPrefix?: string;
  /** Texto después del valor en el hover (p. ej. "%", " años"). */
  hoverUnit?: string;
  /** Transforma el valor crudo a unidad de display (p. ej. millones→miles de millones). */
  transform?: (v: number) => number;
}

function comparativo(o: CmpOpts): ChartDef {
  return {
    id: o.id,
    titulo: o.titulo,
    pregunta: o.pregunta,
    fuenteTexto: FUENTE,
    datasets: ["comparativo-col-uzb"],
    height: 380,
    ariaLabel: `${o.titulo}: comparación Colombia vs Uzbekistán según el Banco Mundial`,
    build(data) {
      const cmp = data["comparativo-col-uzb"]!;
      const serie = cmp.series[o.serieKey] ?? [];
      const tx = (v: number | null) =>
        v === null ? null : o.transform ? o.transform(v) : v;
      const x = serie.map((p) => `${p.anio}-01-01`);
      const co = serie.map((p) => tx(p.colombia));
      const uz = serie.map((p) => tx(p.uzbekistan));
      const hover = `${o.hoverPrefix ?? ""}%{y:${o.hoverFmt}}${o.hoverUnit ?? ""}`;
      const refs = refMaxMin([...co, ...uz], o.hoverPrefix ?? "", o.hoverUnit ?? "");
      return {
        traces: [
          {
            name: "Colombia", x, y: co, mode: "lines+markers", connectgaps: true,
            line: { color: COL, width: 2.4 }, marker: { size: 5, color: COL },
            hovertemplate: `<b>%{x|%Y}</b><br>Colombia: <b>${hover}</b><extra></extra>`,
          },
          {
            name: "Uzbekistán", x, y: uz, mode: "lines+markers", connectgaps: true,
            line: { color: UZB, width: 2.4 }, marker: { size: 5, color: UZB },
            hovertemplate: `<b>%{x|%Y}</b><br>Uzbekistán: <b>${hover}</b><extra></extra>`,
          },
        ],
        layout: baseLayout({
          title: {
            text: `<b>${o.titulo}</b>`,
            font: { size: 14, color: "#1f2328" },
            x: 0, xanchor: "left", xref: "paper", y: 0.97, yanchor: "top",
          },
          showlegend: true,
          legend: { orientation: "h", yanchor: "top", y: -0.16, xanchor: "center", x: 0.5, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
          hovermode: "x unified",
          margin: { l: 60, r: 28, t: 46, b: 56 },
          yaxis: {
            showgrid: true, gridcolor: "rgba(208,215,220,0.4)", zeroline: false,
            tickfont: { size: 11, color: "#636c76" }, ticksuffix: o.ySuffix ?? "", automargin: true,
          },
          shapes: refs.shapes,
          annotations: refs.annotations,
        }),
      };
    },
  };
}

export const cmpPibPercapita = comparativo({
  id: "cmp-pib-percapita",
  serieKey: "pib_percapita",
  titulo: "PIB per cápita (USD corrientes)",
  pregunta: "Cuánto produce la economía por habitante. Colombia más que duplica a Uzbekistán.",
  hoverFmt: ",.0f", hoverPrefix: "US$ ",
});

export const cmpPibTotal = comparativo({
  id: "cmp-pib-total",
  serieKey: "pib_total",
  titulo: "PIB total (miles de millones USD)",
  pregunta: "El tamaño total de cada economía. La colombiana es varias veces mayor.",
  hoverFmt: ",.1f", hoverPrefix: "US$ ", hoverUnit: " mil M",
  transform: (v) => v / 1000, // millones → miles de millones
});

export const cmpPoblacion = comparativo({
  id: "cmp-poblacion",
  serieKey: "poblacion",
  titulo: "Población (millones de habitantes)",
  pregunta: "Cuántas personas viven en cada país a lo largo del tiempo.",
  hoverFmt: ".1f", hoverUnit: " M hab.",
  transform: (v) => v / 1_000_000,
});

export const cmpInflacion = comparativo({
  id: "cmp-inflacion",
  serieKey: "inflacion",
  titulo: "Inflación anual (%)",
  pregunta: "Cuánto suben los precios cada año. Más bajo es mejor.",
  ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
});

export const cmpDesempleo = comparativo({
  id: "cmp-desempleo",
  serieKey: "desempleo",
  titulo: "Tasa de desempleo (%)",
  pregunta: "Porcentaje de la fuerza laboral sin empleo. Uzbekistán registra cifras más bajas.",
  ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
});

export const cmpGini = comparativo({
  id: "cmp-gini",
  serieKey: "gini",
  titulo: "Desigualdad — coeficiente de Gini",
  pregunta: "0 = igualdad total, 100 = desigualdad máxima. Colombia es de las más desiguales del mundo.",
  hoverFmt: ".1f",
});

export const cmpEsperanzaVida = comparativo({
  id: "cmp-esperanza-vida",
  serieKey: "esperanza_vida",
  titulo: "Esperanza de vida al nacer (años)",
  pregunta: "Promedio de años de vida esperados. Ambos países mejoran de forma sostenida.",
  hoverFmt: ".1f", hoverUnit: " años",
});

export const cmpApertura = comparativo({
  id: "cmp-apertura",
  serieKey: "apertura",
  titulo: "Apertura comercial (% del PIB)",
  pregunta: "Qué tan integrada al comercio mundial está cada economía. Uzbekistán es hoy más abierta.",
  ySuffix: "%", hoverFmt: ".1f", hoverUnit: "%",
});

export const cmpDeudaExterna = comparativo({
  id: "cmp-deuda-externa",
  serieKey: "deuda_externa",
  titulo: "Deuda externa (% del PIB)",
  pregunta: "Cuánto debe cada país al exterior frente al tamaño de su economía. Más bajo es mejor.",
  ySuffix: "%", hoverFmt: ".1f", hoverUnit: "%",
});

export const cmpIed = comparativo({
  id: "cmp-ied",
  serieKey: "ied",
  titulo: "Inversión extranjera directa (% del PIB)",
  pregunta: "Capital extranjero que entra como inversión productiva, frente al PIB.",
  ySuffix: "%", hoverFmt: ".2f", hoverUnit: "%",
});
