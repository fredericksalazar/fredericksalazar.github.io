import { COLORS, baseLayout, periodoToISODate } from "../charts";
import { trmInflacionJoin } from "../derivations";
import type { ChartDef } from "./types";
import type { ExternoSerieFila } from "../types";

/**
 * Extrae (x, y) filtrando filas donde el campo es null.
 * Necesario para defs sobre `data_externo.json`: la serie cubre 1960-actual
 * mezclando granularidades, asi que muchos meses tienen null y romperian el
 * rango visible del chart si se incluyeran.
 */
function extractNonNull(
  serie: ExternoSerieFila[],
  field: keyof ExternoSerieFila,
): { x: string[]; y: number[] } {
  const x: string[] = [];
  const y: number[] = [];
  for (const r of serie) {
    const v = r[field];
    if (typeof v === "number") {
      x.push(periodoToISODate(r.periodo));
      y.push(v);
    }
  }
  return { x, y };
}

const FUENTE_BANREP_TRM = "Banco de la Republica — TRM (promedio mensual)";
const FUENTE_BANREP_RESERVAS = "Banco de la Republica — Reservas";
const FUENTE_BANREP_BALANZA = "Banco de la Republica (TRM) — DANE (IPC)";
const FUENTE_BANCO_MUNDIAL = "Banco Mundial — WDI";

export const trmHistorica: ChartDef = {
  id: "trm-historica",
  titulo: "Tasa de cambio TRM (USD/COP)",
  pregunta: "¿Como se ha movido el dolar frente al peso colombiano?",
  fuenteTexto: FUENTE_BANREP_TRM,
  datasets: ["externo"],
  height: 340,
  ariaLabel: "Evolucion mensual de la TRM USD/COP",
  build({ externo }) {
    const { x, y } = extractNonNull(externo!.serie, "trm");
    return {
      traces: [{
        name: "TRM", x, y, mode: "lines",
        line: { color: COLORS.externo, width: 2.2 },
        fill: "tozeroy", fillcolor: "rgba(234, 88, 12, 0.06)",
        hovertemplate: "<b>%{x|%b %Y}</b><br>TRM: $%{y:,.0f} COP/USD<extra></extra>",
      }],
      layout: baseLayout({
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true },
      }),
    };
  },
};

export const reservasInternacionales: ChartDef = {
  id: "reservas-internacionales",
  titulo: "Reservas internacionales netas",
  pregunta: "¿Cuanto colchon de divisas tiene Colombia para enfrentar choques externos?",
  fuenteTexto: FUENTE_BANREP_RESERVAS,
  datasets: ["externo"],
  height: 340,
  ariaLabel: "Evolucion mensual de las reservas internacionales netas de Colombia",
  build({ externo }) {
    const { x, y } = extractNonNull(externo!.serie, "reservas_netas");
    return {
      traces: [{
        name: "Reservas", x, y, mode: "lines",
        line: { color: COLORS.tasa, width: 2.2 },
        fill: "tozeroy", fillcolor: "rgba(37, 99, 235, 0.06)",
        hovertemplate: "<b>%{x|%b %Y}</b><br>Reservas: %{y:,.1f} mil M USD<extra></extra>",
      }],
      layout: baseLayout({
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true },
      }),
    };
  },
};

export const cuentaCorrientePib: ChartDef = {
  id: "cuenta-corriente-pib",
  titulo: "Cuenta corriente (% PIB)",
  pregunta: "¿Gasta Colombia mas afuera de lo que ingresa? Un deficit persistente exige financiamiento externo.",
  fuenteTexto: FUENTE_BANCO_MUNDIAL,
  datasets: ["externo"],
  height: 380,
  ariaLabel: "Evolucion de la cuenta corriente de Colombia como porcentaje del PIB",
  build({ externo }) {
    const data = externo!.serie.filter((r) => r.cuenta_corriente !== null);
    const x = data.map((r) => periodoToISODate(r.periodo));
    const y = data.map((r) => r.cuenta_corriente as number);
    const barColors = y.map((v) =>
      v >= 0 ? "#16a34a" : "#dc2626",
    );
    return {
      traces: [{
        name: "Cuenta corriente", x, y, type: "bar",
        marker: { color: barColors, line: { color: "rgba(0,0,0,0.05)", width: 0.5 } },
        hovertemplate: "<b>%{x|%Y}</b><br>Cuenta corriente: %{y:.2f}% PIB<extra></extra>",
      }],
      layout: baseLayout({
        showlegend: false, margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
        shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 0, y1: 0,
          line: { color: "#1f2328", width: 1.5, dash: "solid" } }],
      }),
    };
  },
};

export const deudaExternaPib: ChartDef = {
  id: "deuda-externa-pib",
  titulo: "Deuda externa total (% PIB)",
  pregunta: "¿Cuanto debe Colombia al exterior? El stock de obligaciones como porcentaje del INB.",
  fuenteTexto: FUENTE_BANCO_MUNDIAL,
  datasets: ["externo"],
  height: 340,
  ariaLabel: "Evolucion de la deuda externa total de Colombia como porcentaje del PIB",
  build({ externo }) {
    const { x, y } = extractNonNull(externo!.serie, "deuda_externa");
    return {
      traces: [{
        name: "Deuda externa", x, y, mode: "lines",
        line: { color: COLORS.textPrimary, width: 2.2 }, fill: "tozeroy",
        fillcolor: "rgba(31, 35, 40, 0.06)",
        hovertemplate: "<b>%{x|%Y}</b><br>Deuda externa: <b>%{y:.1f}%</b> PIB<extra></extra>",
      }],
      layout: baseLayout({
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true },
      }),
    };
  },
};

export const passThroughTrmInflacion: ChartDef = {
  id: "pass-through-trm-inflacion",
  titulo: "Pass-through: TRM y inflacion anual",
  pregunta: "¿Cuanto traslado tiene el dolar a los precios? La devaluacion del peso suele anticipar repuntes en la inflacion de los meses siguientes.",
  fuenteTexto: FUENTE_BANREP_BALANZA,
  datasets: ["externo", "inflacion"],
  height: 420,
  ariaLabel: "Evolucion comparada de la TRM mensual y la inflacion anual",
  build({ externo, inflacion }) {
    const { x, trm, inflacion: infl } = trmInflacionJoin(externo!, inflacion!);
    return {
      traces: [
        { name: "TRM (COP/USD)", x, y: trm, mode: "lines",
          line: { color: COLORS.externo, width: 2.2 }, yaxis: "y",
          hovertemplate: "<b>%{x|%b %Y}</b><br>TRM: $%{y:,.0f}<extra></extra>" },
        { name: "Inflacion anual (%)", x, y: infl, mode: "lines",
          line: { color: COLORS.inflacion, width: 2.2, dash: "dash" }, yaxis: "y2",
          hovertemplate: "<b>%{x|%b %Y}</b><br>Inflacion: %{y:.2f}%<extra></extra>" },
      ],
      layout: baseLayout({
        margin: { l: 56, r: 56, t: 24, b: 40 },
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        hovermode: "x unified",
        yaxis: {
          title: { text: "TRM (COP/USD)", font: { size: 11, color: COLORS.externo } },
          showgrid: true, gridcolor: "rgba(208,215,220,0.4)", zeroline: false,
          tickfont: { size: 11, color: COLORS.externo }, ticksuffix: "", automargin: true,
        },
        yaxis2: {
          title: { text: "Inflacion (%)", font: { size: 11, color: COLORS.inflacion } },
          overlaying: "y", side: "right", showgrid: false, zeroline: false,
          tickfont: { size: 11, color: COLORS.inflacion }, ticksuffix: "%", automargin: true,
        },
      }),
    };
  },
};