import { baseLayout } from "../charts";
import {
  getPresidentesClient,
  colorsForYears,
  presidentesEnLeyenda,
  presidenteForYear,
  type Presidente,
} from "../presidentes-client";
import type { ChartDef, ChartBuildResult } from "./types";

const COLOR_BASE = "#2563eb";

interface HistoricoOptions {
  historico: Record<string, number>;
  name: string;
  hoverSuffix: string;
  hoverDecimals?: number;
  yaxisTickSuffix?: string;
  promedioOptions?: { showLine: boolean };
  metaBanrep?: boolean;
}

function renderLegend(presidentes: Presidente[]): string {
  return `
    <div class="pres-legend" data-pres-legend data-visible="true" aria-label="Presidentes representados en el gráfico">
      ${presidentes.map((p) => `
        <span class="pres-chip">
          <span class="pres-chip__dot" style="background:${p.color}"></span>
          <span class="pres-chip__name">${p.nombre}</span>
          <span class="pres-chip__period">${new Date(p.inicio).getFullYear()}–${new Date(p.fin).getFullYear()}</span>
        </span>
      `).join("")}
    </div>`;
}

function renderToggle(): string {
  return `
    <label class="pres-toggle" data-pres-toggle>
      <span class="pres-toggle__label">Color por presidente</span>
      <input type="checkbox" class="pres-toggle__input" checked />
      <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
    </label>`;
}

async function buildHistorico(
  chartId: string,
  opts: HistoricoOptions,
): Promise<ChartBuildResult> {
  const presidentes = await getPresidentesClient();
  const years = Object.keys(opts.historico).sort();
  const valores = years.map((y) => opts.historico[y]);
  const colorsPorPresidente = colorsForYears(years, presidentes, COLOR_BASE);
  const customdata = years.map((y) => {
    const p = presidenteForYear(parseInt(y, 10), presidentes);
    return [p?.nombre ?? "Sin datos", p?.partido ?? "—"];
  });

  const dec = opts.hoverDecimals ?? 2;
  const traces = [{
    type: "bar", x: years, y: valores,
    marker: { color: colorsPorPresidente, line: { color: "rgba(0,0,0,0.08)", width: 0.5 } },
    customdata, name: opts.name,
    hovertemplate:
      `<b>%{x}</b><br>${opts.name}: <b>%{y:.${dec}f}${opts.hoverSuffix}</b><br>` +
      "Presidente: %{customdata[0]}<br>" +
      "<span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>",
  }];

  const shapes: unknown[] = [];
  const annotations: unknown[] = [];

  if (opts.promedioOptions?.showLine) {
    const promedio = Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;
    shapes.push({
      type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: promedio, y1: promedio,
      line: { color: "#64748b", width: 1.5, dash: "dash" }, layer: "above",
    });
    annotations.push({
      xref: "paper", yref: "y", x: 1, xanchor: "right", y: promedio, yanchor: "bottom",
      text: `Promedio histórico · ${promedio.toFixed(2)}%`,
      showarrow: false,
      font: { size: 10, color: "#475569", family: "system-ui, sans-serif" },
      bgcolor: "rgba(255,255,255,0.9)", bordercolor: "#cbd5e1", borderwidth: 1, borderpad: 3,
    });
  }

  if (opts.metaBanrep) {
    shapes.push({
      type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 3, y1: 3,
      line: { color: "#dc2626", width: 2.5, dash: "dash" }, layer: "above",
    });
    annotations.push({
      xref: "paper", yref: "y", x: 0, xanchor: "left", y: 3, yanchor: "bottom",
      text: "<b>Meta BanRep · 3%</b>", showarrow: false,
      font: { size: 10, color: "#ffffff", family: "system-ui, sans-serif" },
      bgcolor: "#dc2626", bordercolor: "#b91c1c", borderwidth: 1, borderpad: 4,
    });
  }

  const layout = baseLayout({
    margin: { l: 48, r: 24, t: 16, b: 40 },
    showlegend: false, hovermode: "x",
    yaxis: {
      showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
      tickfont: { size: 11, color: "#636c76" },
      ticksuffix: opts.yaxisTickSuffix ?? "%", automargin: true,
    },
    ...(shapes.length ? { shapes } : {}),
    ...(annotations.length ? { annotations } : {}),
  });

  const leyenda = presidentesEnLeyenda(years, presidentes);
  return {
    traces, layout,
    headerHtml: renderToggle(),
    footerHtml: renderLegend(leyenda),
    onMount: (target) => {
      target.dataset.colorsByPresident = JSON.stringify(colorsPorPresidente);
      target.dataset.colorBase = COLOR_BASE;
    },
  };
}

export const inflacionHistorica: ChartDef = {
  id: "inflacion-historica",
  titulo: "Inflación histórica de Colombia",
  pregunta: "Inflación anual desde 1960 según datos del Banco Mundial. Coloreada por presidente que gobernó la mayor parte del año.",
  fuenteTexto: "Banco Mundial — World Development Indicators · Presidentes: Registraduría Nacional",
  datasets: ["inflacion"],
  height: 420,
  ariaLabel: "Inflación anual histórica de Colombia desde 1960 con color por presidente",
  build({ inflacion }) {
    return buildHistorico("inflacion-historica", {
      historico: inflacion!.historico,
      name: "Inflación",
      hoverSuffix: "%",
      promedioOptions: { showLine: true },
      metaBanrep: true,
    });
  },
};

export const pibHistorico: ChartDef = {
  id: "pib-historico",
  titulo: "PIB histórico de Colombia",
  pregunta: "Producto Interno Bruto en miles de millones de USD desde 1960. Coloreado por presidente.",
  fuenteTexto: "Banco Mundial — WDI · Presidentes: Registraduría Nacional",
  datasets: ["pib"],
  height: 420,
  ariaLabel: "PIB histórico de Colombia con color por presidente",
  build({ pib }) {
    return buildHistorico("pib-historico", {
      historico: pib!.historico,
      name: "PIB",
      hoverSuffix: " mil M USD",
      hoverDecimals: 1,
      yaxisTickSuffix: "",
    });
  },
};

export const desempleoHistorico: ChartDef = {
  id: "desempleo-historico",
  titulo: "Desempleo histórico de Colombia",
  pregunta: "Tasa de desempleo anual desde 1991 según Banco Mundial (OIT). Coloreada por presidente que gobernó la mayor parte del año.",
  fuenteTexto: "Banco Mundial — World Development Indicators · Presidentes: Registraduría Nacional",
  datasets: ["empleo"],
  height: 420,
  ariaLabel: "Tasa de desempleo histórica de Colombia desde 1991 con color por presidente",
  build({ empleo }) {
    return buildHistorico("desempleo-historico", {
      historico: empleo!.historico,
      name: "Desempleo",
      hoverSuffix: "%",
      promedioOptions: { showLine: true },
    });
  },
};

export const comercioHistorico: ChartDef = {
  id: "comercio-historico",
  titulo: "Comercio exterior histórico",
  pregunta: "Exportaciones como % del PIB desde 1960. Coloreado por presidente.",
  fuenteTexto: "Banco Mundial — World Development Indicators · Presidentes: Registraduría Nacional",
  datasets: ["comercio"],
  height: 420,
  ariaLabel: "Comercio exterior histórico de Colombia con color por presidente",
  build({ comercio }) {
    return buildHistorico("comercio-historico", {
      historico: comercio!.historico,
      name: "Exportaciones",
      hoverSuffix: "% PIB",
    });
  },
};
