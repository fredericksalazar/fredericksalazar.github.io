import { COLORS, baseLayout, periodoToISODate, lineasReferencia } from "../charts";
import { trmInflacionJoin } from "../derivations";
import {
  getPresidentesClient,
  presidenteForYear,
  presidentesEnLeyenda,
  type Presidente,
} from "../presidentes-client";
import type { ChartDef } from "./types";
import { bindColorPresidente, presLeyendaHtml, presToggleHtml } from "./color-presidente";
import type { ExternoData, ExternoSerieFila } from "../types";

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
const FUENTE_BANCO_MUNDIAL = "Banco Mundial — WDI";
const FUENTE_BANREP_BALANZA = "Banco de la Republica (TRM) — DANE (IPC)";

/** Formato de la TRM en pesos colombianos (p. ej. "$4.123"). */
const formatoPesos = (v: number) => `$${Math.round(v).toLocaleString("es-CO")}`;

interface TogglableData {
  x: string[];
  y: number[];
  colorsByPresident: string[];
  customdata: [string, string][];
  leyenda: Presidente[];
}

/** Prepara x, y, colores y customdata por presidente para los toggles. */
async function prepareTogglableData(
  externo: ExternoData,
  field: "trm" | "reservas_netas",
): Promise<TogglableData> {
  const presidentes = await getPresidentesClient();
  const data = externo.serie.filter((r): r is ExternoSerieFila & Record<typeof field, number> => r[field] !== null);
  const x = data.map((r) => periodoToISODate(r.periodo));
  const y = data.map((r) => r[field] as number);
  const colorsByPresident = data.map((r) => {
    const p = presidenteForYear(parseInt(r.periodo.slice(0, 4), 10), presidentes);
    return p?.color ?? COLORS.brand;
  });
  const customdata: [string, string][] = data.map((r) => {
    const p = presidenteForYear(parseInt(r.periodo.slice(0, 4), 10), presidentes);
    return [p?.nombre ?? "Sin datos", p?.partido ?? "—"];
  });
  const yearsInSerie = Array.from(new Set(data.map((r) => r.periodo.slice(0, 4))));
  const leyenda = presidentesEnLeyenda(yearsInSerie, presidentes);
  return { x, y, colorsByPresident, customdata, leyenda };
}

// ──────────────────────────────────────────────────────────────────────
// TRM (mensual)
// ──────────────────────────────────────────────────────────────────────

export const trmHistorica: ChartDef = {
  id: "trm-historica",
  titulo: "Tasa de cambio TRM (USD/COP)",
  pregunta: "¿Como se ha movido el dolar frente al peso colombiano?",
  fuenteTexto: FUENTE_BANREP_TRM,
  datasets: ["externo"],
  height: 340,
  ariaLabel: "Evolucion mensual de la TRM USD/COP",
  vistas: ["linea", "barras"],
  async build({ externo }) {
    const { x, y, colorsByPresident, customdata, leyenda } = await prepareTogglableData(externo!, "trm");

    const refs = lineasReferencia(y, { formato: formatoPesos });

    const layout = baseLayout({
      yaxis: {
        showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
        tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true,
      },
      shapes: refs.shapes,
      annotations: refs.annotations,
    });

    // Una sola traza: en vista de barras, aVista toma `marker.color` por punto
    // (colores por presidente) o el color de la línea.
    const traza = (conPresidente: boolean) => ({
      name: "TRM", x, y, mode: "lines+markers",
      line: { color: COLORS.brand, width: 2.2 },
      marker: { size: 4, color: conPresidente ? colorsByPresident : COLORS.brand, line: { color: "white", width: 1 } },
      fill: "tozeroy", fillcolor: "rgba(37, 99, 235, 0.06)",
      customdata: conPresidente ? customdata : undefined,
      hovertemplate: conPresidente
        ? "<b>%{x|%b %Y}</b><br>TRM: <b>$%{y:,.0f}</b><br>Presidente: %{customdata[0]}<br><span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>"
        : "<b>%{x|%b %Y}</b><br>TRM: <b>$%{y:,.0f} COP/USD</b><extra></extra>",
    });

    return {
      traces: [traza(false)],
      layout,
      headerHtml: presToggleHtml("trm", true),
      footerHtml: presLeyendaHtml("trm", leyenda),
      onMount: (target, ctx) => bindColorPresidente({ target, ctx, prefix: "trm", traza, soloEnBarras: true }),
    };
  },
};

// ──────────────────────────────────────────────────────────────────────
// Reservas internacionales (anual)
// ──────────────────────────────────────────────────────────────────────

export const reservasInternacionales: ChartDef = {
  id: "reservas-internacionales",
  titulo: "Reservas internacionales netas",
  pregunta: "¿Cuanto colchon de divisas tiene Colombia para enfrentar choques externos?",
  fuenteTexto: FUENTE_BANCO_MUNDIAL,
  datasets: ["externo"],
  height: 340,
  ariaLabel: "Evolucion anual de las reservas internacionales netas de Colombia",
  async build({ externo }) {
    const { x, y, colorsByPresident, customdata, leyenda } = await prepareTogglableData(externo!, "reservas_netas");

    const layout = baseLayout({
      yaxis: {
        showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
        tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true,
      },
    });

    const barTrace = (withPresident: boolean) => ({
      type: "bar", x, y,
      marker: {
        color: withPresident ? colorsByPresident : COLORS.brand,
        line: { color: "rgba(0,0,0,0.08)", width: 0.5 },
      },
      customdata: withPresident ? customdata : undefined,
      hovertemplate: withPresident
        ? "<b>%{x|%Y}</b><br>Reservas: <b>%{y:,.1f} mil M USD</b><br>Presidente: %{customdata[0]}<br><span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>"
        : "<b>%{x|%Y}</b><br>Reservas: <b>%{y:,.1f} mil M USD</b><extra></extra>",
    });

    return {
      traces: [barTrace(false)],
      layout,
      headerHtml: presToggleHtml("res"),
      footerHtml: presLeyendaHtml("res", leyenda),
      onMount: (target, ctx) => bindColorPresidente({ target, ctx, prefix: "res", traza: barTrace }),
    };
  },
};

// ──────────────────────────────────────────────────────────────────────
// Resto de charts del sector externo (sin toggles)
// ──────────────────────────────────────────────────────────────────────

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
  vistas: ["linea", "barras"],
  build({ externo }) {
    // Filtrar ceros (placeholders del CSV en anios sin dato real).
    const data = externo!.serie.filter((r) => typeof r.deuda_externa === "number" && r.deuda_externa > 0);
    const x = data.map((r) => periodoToISODate(r.periodo));
    const y = data.map((r) => r.deuda_externa as number);
    const refs = lineasReferencia(y, { sufijo: "%", decimales: 1 });
    return {
      traces: [{
        name: "Deuda externa", x, y, mode: "lines+markers",
        line: { color: COLORS.brand, width: 2.2 },
        marker: { size: 6, color: COLORS.brand, line: { color: "white", width: 1 } },
        fill: "tozeroy", fillcolor: "rgba(37, 99, 235, 0.06)",
        hovertemplate: "<b>%{x|%Y}</b><br>Deuda externa: <b>%{y:.1f}%</b> PIB<extra></extra>",
      }],
      layout: baseLayout({
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true },
        shapes: refs.shapes,
        annotations: refs.annotations,
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
  vistas: ["linea", "barras"],
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
