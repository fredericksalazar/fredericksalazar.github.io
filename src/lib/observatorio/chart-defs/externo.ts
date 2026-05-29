import { COLORS, baseLayout, periodoToISODate } from "../charts";
import { trmInflacionJoin } from "../derivations";
import {
  getPresidentesClient,
  presidenteForYear,
  presidentesEnLeyenda,
  type Presidente,
} from "../presidentes-client";
import type { ChartDef } from "./types";
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

const REF_LINE_COLOR = "#94a3b8";
const REF_MEAN_COLOR = "#475569";

/**
 * Genera shapes + annotations para 3 lineas de referencia (min, max, media)
 * que se superponen al chart como guias horizontales.
 */
function makeMinMaxMeanRefs(y: number[], formatValue: (v: number) => string): {
  shapes: Record<string, unknown>[];
  annotations: Record<string, unknown>[];
} {
  if (y.length === 0) return { shapes: [], annotations: [] };
  const min = Math.min(...y);
  const max = Math.max(...y);
  const mean = y.reduce((s, v) => s + v, 0) / y.length;
  const labelBg = "rgba(255,255,255,0.85)";
  return {
    shapes: [
      { type: "line", xref: "paper", yref: "y", x0: 0, x1: 1, y0: min, y1: min,
        line: { color: REF_LINE_COLOR, width: 1, dash: "dot" }, layer: "above" },
      { type: "line", xref: "paper", yref: "y", x0: 0, x1: 1, y0: max, y1: max,
        line: { color: REF_LINE_COLOR, width: 1, dash: "dot" }, layer: "above" },
      { type: "line", xref: "paper", yref: "y", x0: 0, x1: 1, y0: mean, y1: mean,
        line: { color: REF_MEAN_COLOR, width: 1.5, dash: "dash" }, layer: "above" },
    ],
    annotations: [
      { xref: "paper", yref: "y", x: 0, xanchor: "left", y: max, yanchor: "bottom",
        text: `Máx: ${formatValue(max)}`, showarrow: false,
        font: { size: 10, color: REF_LINE_COLOR }, bgcolor: labelBg, borderpad: 2 },
      { xref: "paper", yref: "y", x: 0, xanchor: "left", y: min, yanchor: "top",
        text: `Mín: ${formatValue(min)}`, showarrow: false,
        font: { size: 10, color: REF_LINE_COLOR }, bgcolor: labelBg, borderpad: 2 },
      { xref: "paper", yref: "y", x: 1, xanchor: "right", y: mean, yanchor: "bottom",
        text: `Media: ${formatValue(mean)}`, showarrow: false,
        font: { size: 10, color: REF_MEAN_COLOR }, bgcolor: labelBg, borderpad: 2 },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────
// Helpers compartidos para charts con doble toggle (linea ↔ barras ± presidente)
// ──────────────────────────────────────────────────────────────────────

/** HTML de los dos toggles (linea↔barras + presidente). `prefix` evita colisiones. */
function makeTogglesHtml(prefix: string): string {
  return `
    <div class="trm-toggles">
      <label class="pres-toggle" data-${prefix}-bars-toggle>
        <span class="pres-toggle__label">Mostrar como barras</span>
        <input type="checkbox" class="pres-toggle__input" />
        <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
      </label>
      <label class="pres-toggle" data-${prefix}-presidente-toggle style="display: none;">
        <span class="pres-toggle__label">Color por presidente</span>
        <input type="checkbox" class="pres-toggle__input" />
        <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
      </label>
    </div>
  `;
}

/** HTML para chart que es SOLO barras (azul por defecto, con toggle de presidente). */
function makePresOnlyToggleHtml(prefix: string): string {
  return `
    <div class="trm-toggles">
      <label class="pres-toggle" data-${prefix}-presidente-toggle>
        <span class="pres-toggle__label">Color por presidente</span>
        <input type="checkbox" class="pres-toggle__input" />
        <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
      </label>
    </div>
  `;
}

function makeLegendHtml(prefix: string, presidentes: Presidente[]): string {
  return `
    <div class="pres-legend" data-${prefix}-presidente-legend data-visible="false" aria-label="Presidentes representados en el grafico">
      ${presidentes.map((p) => `
        <span class="pres-chip">
          <span class="pres-chip__dot" style="background:${p.color}"></span>
          <span class="pres-chip__name">${p.nombre}</span>
          <span class="pres-chip__period">${new Date(p.inicio).getFullYear()}–${new Date(p.fin).getFullYear()}</span>
        </span>
      `).join("")}
    </div>
  `;
}

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

/** Vincula los dos toggles al state machine usando Plotly.react. */
function bindTogglableChart(opts: {
  target: HTMLElement;
  prefix: string;
  lineTrace: () => Record<string, unknown>;
  barTrace: (withPresident: boolean) => Record<string, unknown>;
  layout: Record<string, unknown>;
}): void {
  const { target, prefix, lineTrace, barTrace, layout } = opts;
  const root = target.closest<HTMLElement>("[data-chart-root]");
  if (!root) return;

  const barsToggle = root.querySelector<HTMLElement>(`[data-${prefix}-bars-toggle]`);
  const presToggle = root.querySelector<HTMLElement>(`[data-${prefix}-presidente-toggle]`);
  const legend = root.querySelector<HTMLElement>(`[data-${prefix}-presidente-legend]`);
  if (!barsToggle || !presToggle) return;

  const barsInput = barsToggle.querySelector<HTMLInputElement>(".pres-toggle__input");
  const presInput = presToggle.querySelector<HTMLInputElement>(".pres-toggle__input");
  if (!barsInput || !presInput) return;

  // Evitar binding duplicado si el chart re-monta sobre el mismo nodo
  const boundKey = `${prefix}ToggleBound`;
  if (root.dataset[boundKey] === "true") return;
  root.dataset[boundKey] = "true";

  let isBars = false;
  let isPresidentes = false;

  const apply = () => {
    presToggle.style.display = isBars ? "" : "none";
    if (legend) legend.setAttribute("data-visible", (isBars && isPresidentes) ? "true" : "false");
    const nextTrace = isBars ? barTrace(isPresidentes) : lineTrace();
    if (window.Plotly) {
      window.Plotly.react(target, [nextTrace], layout);
    }
  };

  barsInput.addEventListener("change", () => {
    isBars = barsInput.checked;
    if (!isBars) {
      isPresidentes = false;
      presInput.checked = false;
    }
    apply();
  });
  presInput.addEventListener("change", () => {
    isPresidentes = presInput.checked;
    apply();
  });
}

/** Vincula un toggle UNICO de presidente sobre un chart de barras. */
function bindPresOnlyChart(opts: {
  target: HTMLElement;
  prefix: string;
  barTrace: (withPresident: boolean) => Record<string, unknown>;
  layout: Record<string, unknown>;
}): void {
  const { target, prefix, barTrace, layout } = opts;
  const root = target.closest<HTMLElement>("[data-chart-root]");
  if (!root) return;

  const presToggle = root.querySelector<HTMLElement>(`[data-${prefix}-presidente-toggle]`);
  const legend = root.querySelector<HTMLElement>(`[data-${prefix}-presidente-legend]`);
  const presInput = presToggle?.querySelector<HTMLInputElement>(".pres-toggle__input");
  if (!presInput) return;

  const boundKey = `${prefix}ToggleBound`;
  if (root.dataset[boundKey] === "true") return;
  root.dataset[boundKey] = "true";

  presInput.addEventListener("change", () => {
    const checked = presInput.checked;
    if (legend) legend.setAttribute("data-visible", checked ? "true" : "false");
    if (window.Plotly) {
      window.Plotly.react(target, [barTrace(checked)], layout);
    }
  });
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
  async build({ externo }) {
    const { x, y, colorsByPresident, customdata, leyenda } = await prepareTogglableData(externo!, "trm");

    const refs = makeMinMaxMeanRefs(y, (v) => `$${Math.round(v).toLocaleString("es-CO")}`);

    const layout = baseLayout({
      yaxis: {
        showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
        tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true,
      },
      shapes: refs.shapes,
      annotations: refs.annotations,
    });

    const lineTrace = () => ({
      name: "TRM", x, y, mode: "lines+markers",
      line: { color: COLORS.brand, width: 2.2 },
      marker: { size: 4, color: COLORS.brand, line: { color: "white", width: 1 } },
      fill: "tozeroy", fillcolor: "rgba(37, 99, 235, 0.06)",
      hovertemplate: "<b>%{x|%b %Y}</b><br>TRM: $%{y:,.0f} COP/USD<extra></extra>",
    });

    const barTrace = (withPresident: boolean) => ({
      type: "bar", x, y,
      marker: {
        color: withPresident ? colorsByPresident : COLORS.brand,
        line: { color: "rgba(0,0,0,0.08)", width: 0.5 },
      },
      customdata: withPresident ? customdata : undefined,
      hovertemplate: withPresident
        ? "<b>%{x|%b %Y}</b><br>TRM: <b>$%{y:,.0f}</b><br>Presidente: %{customdata[0]}<br><span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>"
        : "<b>%{x|%b %Y}</b><br>TRM: <b>$%{y:,.0f} COP/USD</b><extra></extra>",
    });

    return {
      traces: [lineTrace()],
      layout,
      headerHtml: makeTogglesHtml("trm"),
      footerHtml: makeLegendHtml("trm", leyenda),
      onMount: (target) => bindTogglableChart({ target, prefix: "trm", lineTrace, barTrace, layout }),
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
      headerHtml: makePresOnlyToggleHtml("res"),
      footerHtml: makeLegendHtml("res", leyenda),
      onMount: (target) => bindPresOnlyChart({ target, prefix: "res", barTrace, layout }),
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
  build({ externo }) {
    // Filtrar ceros (placeholders del CSV en anios sin dato real).
    const data = externo!.serie.filter((r) => typeof r.deuda_externa === "number" && r.deuda_externa > 0);
    const x = data.map((r) => periodoToISODate(r.periodo));
    const y = data.map((r) => r.deuda_externa as number);
    const refs = makeMinMaxMeanRefs(y, (v) => `${v.toFixed(1)}%`);
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
