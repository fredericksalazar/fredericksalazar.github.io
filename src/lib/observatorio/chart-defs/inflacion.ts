import { COLORS, baseLayout, extractSerie, periodoToISODate } from "../charts";
import { frenoAceleradorMinMax, inflacionAnualPromedio } from "../derivations";
import type { ChartDef } from "./types";

const FUENTE_DANE = "DANE — Índice de Precios al Consumidor";
const FUENTE_BANREP = "Banco de la República — Tasa de intervención";
const FUENTE_CALC = "Cálculo propio sobre DANE (IPC) y Banco de la República (TPM)";

export const inflacionAnual: ChartDef = {
  id: "inflacion-anual",
  titulo: "Inflación anual",
  pregunta: "¿Cómo ha evolucionado el alza de precios al consumidor?",
  fuenteTexto: FUENTE_DANE,
  datasets: ["inflacion"],
  height: 340,
  ariaLabel: "Evolución mensual de la inflación anual de Colombia desde 2004",
  build({ inflacion }) {
    const { x, y } = extractSerie(inflacion!.serie, "inflacion_anual");
    const xMin = x[0];
    const xMax = x[x.length - 1];
    return {
      traces: [
        {
          name: "Inflación anual",
          x, y,
          mode: "lines",
          line: { color: COLORS.inflacion, width: 2.2 },
          fill: "tozeroy",
          fillcolor: "rgba(220, 38, 38, 0.06)",
          hovertemplate: "<b>%{x|%b %Y}</b><br>Inflación anual: %{y:.2f}%<extra></extra>",
        },
      ],
      layout: baseLayout({
        shapes: [
          { type: "rect", xref: "x", yref: "y", x0: xMin, x1: xMax, y0: 2, y1: 4,
            fillcolor: COLORS.metaBanda, line: { width: 0 }, layer: "below" },
          { type: "line", xref: "x", yref: "y", x0: xMin, x1: xMax, y0: 3, y1: 3,
            line: { color: COLORS.metaLinea, width: 1, dash: "dot" }, layer: "below" },
        ],
        annotations: [
          { x: xMax, y: 3, xref: "x", yref: "y", text: "Meta BanRep · 3%",
            showarrow: false, font: { size: 10, color: "#16a34a" },
            bgcolor: "rgba(255,255,255,0.85)", borderpad: 3,
            xanchor: "right", yanchor: "bottom" },
        ],
      }),
    };
  },
};

export const tasaInteres: ChartDef = {
  id: "tasa-interes",
  titulo: "Tasa de intervención BanRep",
  pregunta: "¿Cómo se ha movido la tasa de política monetaria del Banco de la República?",
  fuenteTexto: FUENTE_BANREP,
  datasets: ["inflacion"],
  height: 340,
  ariaLabel: "Evolución mensual de la tasa de intervención del Banco de la República desde 2004",
  build({ inflacion }) {
    const { x, y } = extractSerie(inflacion!.serie, "tasa_interes");
    return {
      traces: [{
        name: "Tasa BanRep", x, y, mode: "lines",
        line: { color: COLORS.tasa, width: 2.2, shape: "hv" },
        fill: "tozeroy", fillcolor: "rgba(37, 99, 235, 0.06)",
        hovertemplate: "<b>%{x|%b %Y}</b><br>Tasa BanRep: %{y:.2f}%<extra></extra>",
      }],
      layout: baseLayout(),
    };
  },
};

export const spread: ChartDef = {
  id: "spread",
  titulo: "¿Qué tan 'caro' está el dinero en Colombia?",
  pregunta: "Diferencial entre Tasa del Banco de la República e Inflación. Barras rojas = freno (tasa > inflación), barras verdes = acelerador.",
  fuenteTexto: FUENTE_CALC,
  datasets: ["inflacion"],
  height: 500,
  ariaLabel: "Diferencial entre la tasa de intervención y la inflación anual, en puntos porcentuales",
  build({ inflacion }) {
    const data = inflacion!.serie.filter((r) => r.inflacion_anual !== null && r.tasa_interes !== null);
    const x = data.map((r) => periodoToISODate(r.periodo));
    const sp = data.map((r) => (r.tasa_interes as number) - (r.inflacion_anual as number));
    const barColors = sp.map((v) =>
      v > 0 ? "rgba(214, 39, 40, 0.8)" : v < 0 ? "rgba(0, 160, 80, 0.8)" : "rgba(150, 150, 150, 0.6)");
    return {
      traces: [{
        type: "bar", x, y: sp, marker: { color: barColors }, name: "Diferencial",
        hovertemplate: "<b>%{x|%b %Y}</b><br>Diferencial: %{y:.2f} pp<extra></extra>",
      }],
      layout: baseLayout({
        margin: { l: 48, r: 24, t: 16, b: 40 }, showlegend: false, barmode: "overlay",
        shapes: [{ type: "line", x0: x[0], x1: x[x.length - 1], y0: 0, y1: 0,
          line: { color: "#1f2328", width: 2, dash: "solid" } }],
        hovermode: "x",
      }),
    };
  },
};

export const frenoAcelerador: ChartDef = {
  id: "freno-acelerador",
  titulo: "¿Está el Banco frenando o acelerando la economía?",
  pregunta: "Cuando la tasa BanRep supera a la inflación anual, hay tasa real positiva (freno). Cuando la inflación supera a la tasa, hay tasa real negativa (acelerador).",
  fuenteTexto: FUENTE_CALC,
  datasets: ["inflacion"],
  height: 460,
  ariaLabel: "Evolución comparada de la inflación anual y la tasa de intervención BanRep, con áreas coloreadas indicando freno o acelerador monetario",
  build({ inflacion }) {
    const serieAsc = inflacion!.serie;
    const { x, inflacion: infl, tasa, tasaRestrictiva, tasaExpansiva } = frenoAceleradorMinMax(serieAsc);
    return {
      traces: [
        { x, y: infl, mode: "lines", line: { width: 0 }, showlegend: false, hoverinfo: "skip" },
        { name: "Tasa > Inflación (freno, tasa real positiva)", x, y: tasaRestrictiva, mode: "lines",
          fill: "tonexty", fillcolor: "rgba(214, 39, 40, 0.25)", line: { width: 0 }, hoverinfo: "skip" },
        { x, y: infl, mode: "lines", line: { width: 0 }, showlegend: false, hoverinfo: "skip" },
        { name: "Inflación > Tasa (acelerador, tasa real negativa)", x, y: tasaExpansiva, mode: "lines",
          fill: "tonexty", fillcolor: "rgba(0, 180, 80, 0.25)", line: { width: 0 }, hoverinfo: "skip" },
        { name: "Tasa BanRep", x, y: tasa, mode: "lines",
          line: { color: "#2563eb", width: 2.2, shape: "hv" },
          hovertemplate: "<b>%{x|%b %Y}</b><br>Tasa BanRep: %{y:.2f}%<extra></extra>" },
        { name: "Inflación anual", x, y: infl, mode: "lines",
          line: { color: "#dc2626", width: 2.2 },
          hovertemplate: "<b>%{x|%b %Y}</b><br>Inflación anual: %{y:.2f}%<extra></extra>" },
      ],
      layout: baseLayout({
        margin: { l: 48, r: 24, t: 16, b: 48 },
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        hovermode: "x unified",
      }),
      footerHtml: `
        <div class="freno-callout">
          <div class="freno-callout__legend">
            <span class="freno-callout__swatch freno-callout__swatch--freno" aria-hidden="true"></span>
            <span class="freno-callout__label">Freno: <strong>tasa real positiva</strong></span>
          </div>
          <div class="freno-callout__legend">
            <span class="freno-callout__swatch freno-callout__swatch--acelerador" aria-hidden="true"></span>
            <span class="freno-callout__label">Acelerador: <strong>tasa real negativa</strong></span>
          </div>
        </div>`,
    };
  },
};

export const pibInflacion: ChartDef = {
  id: "pib-inflacion",
  titulo: "Crecimiento del PIB e inflación (2004-2024)",
  pregunta: "Bajo el régimen de metas de inflación de BanRep, la economía oscila entre fases expansivas y enfriamientos. 2022-2023 fue el período de mayor inflación en 25 años.",
  fuenteTexto: "Banco Mundial — WDI · DANE — IPC",
  datasets: ["pib", "inflacion"],
  height: 420,
  ariaLabel: "Crecimiento del PIB anual e inflación anual desde 2004",
  build({ pib, inflacion }) {
    const inflAnual = inflacionAnualPromedio(inflacion!.serie);
    const inflPorAnio: Record<string, number> = {};
    for (const r of inflAnual) inflPorAnio[r.periodo.slice(0, 4)] = r.inflacion;

    const data = pib!.serie
      .filter((r) => typeof r.crecimiento_pib === "number")
      .filter((r) => r.periodo.slice(0, 4) in inflPorAnio);

    const x = data.map((r) => periodoToISODate(r.periodo));
    const crec = data.map((r) => r.crecimiento_pib as number);
    const infl = data.map((r) => inflPorAnio[r.periodo.slice(0, 4)]);
    const xMin = x[0];
    const xMax = x[x.length - 1];

    return {
      traces: [
        { name: "Crecimiento PIB", x, y: crec, mode: "lines+markers",
          line: { color: "#2563eb", width: 2.2 }, marker: { size: 6, color: "#2563eb" },
          hovertemplate: "<b>%{x|%Y}</b><br>Crecimiento PIB: <b>%{y:.2f}%</b><extra></extra>" },
        { name: "Inflación promedio", x, y: infl, mode: "lines+markers",
          line: { color: "#dc2626", width: 2.2 }, marker: { size: 6, color: "#dc2626" },
          hovertemplate: "<b>%{x|%Y}</b><br>Inflación: <b>%{y:.2f}%</b><extra></extra>" },
      ],
      layout: baseLayout({
        margin: { l: 48, r: 24, t: 24, b: 40 },
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        hovermode: "x unified",
        yaxis: {
          showgrid: true, gridcolor: "rgba(208,215,220,0.4)",
          zeroline: true, zerolinecolor: "rgba(100,100,100,0.4)",
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true,
        },
        shapes: [
          { type: "rect", xref: "x", yref: "y", x0: xMin, x1: xMax, y0: 2, y1: 4, fillcolor: "rgba(34,197,94,0.08)", line: { width: 0 }, layer: "below" },
          { type: "line", xref: "x", yref: "y", x0: xMin, x1: xMax, y0: 3, y1: 3, line: { color: "rgba(34,197,94,0.5)", width: 1, dash: "dot" } },
        ],
        annotations: [
          { x: xMax, y: 3, xref: "x", yref: "y", text: "Meta BanRep 3% ±1", showarrow: false, font: { size: 10, color: "#16a34a" }, xanchor: "right", bgcolor: "rgba(255,255,255,0.85)", borderpad: 3 },
          { x: "2022-12-01", y: 13.1, xref: "x", yref: "y", text: "Sobrecalentamiento<br>post-COVID", showarrow: true, arrowhead: 2, arrowcolor: "#dc2626", ax: -50, ay: -10, font: { size: 10, color: "#dc2626" } },
        ],
      }),
    };
  },
};
