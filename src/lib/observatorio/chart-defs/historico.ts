import { COLORS, baseLayout, lineasReferencia, META_BANREP } from "../charts";
import { recordByYear } from "../derivations";
import {
  getPresidentesClient,
  colorsForYears,
  presidentesEnLeyenda,
  presidenteForYear,
  type Presidente,
} from "../presidentes-client";
import type { ChartDef, ChartBuildResult } from "./types";
import { bindColorPresidente, presLeyendaHtml, presToggleHtml } from "./color-presidente";

const COLOR_BASE = COLORS.brand;

interface HistoricoOptions {
  historico: Record<string, number>;
  name: string;
  hoverSuffix: string;
  hoverDecimals?: number;
  /** Si es true, el hover agrupa miles (`%{y:,.0f}`) — para valores COP grandes. */
  hoverThousands?: boolean;
  yaxisTickSuffix?: string;
  promedioOptions?: { showLine: boolean };
  metaBanrep?: boolean;
  /** Estado inicial del toggle "color por presidente". Default: true (encendido). */
  defaultOn?: boolean;
  /** Si es false, no se renderiza el toggle ni la leyenda: barras de un solo color. Default: true. */
  presidenteToggle?: boolean;
}

function renderLegend(presidentes: Presidente[], visible: boolean): string {
  return `
    <div class="pres-legend" data-pres-legend data-visible="${visible ? "true" : "false"}" aria-label="Presidentes representados en el gráfico">
      ${presidentes.map((p) => `
        <span class="pres-chip">
          <span class="pres-chip__dot" style="background:${p.color}"></span>
          <span class="pres-chip__name">${p.nombre}</span>
          <span class="pres-chip__period">${new Date(p.inicio).getFullYear()}–${new Date(p.fin).getFullYear()}</span>
        </span>
      `).join("")}
    </div>`;
}

function renderToggle(defaultOn: boolean): string {
  return `
    <label class="pres-toggle" data-pres-toggle>
      <span class="pres-toggle__label">Color por presidente</span>
      <input type="checkbox" class="pres-toggle__input" ${defaultOn ? "checked" : ""} />
      <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
    </label>`;
}

async function buildHistorico(
  chartId: string,
  opts: HistoricoOptions,
): Promise<ChartBuildResult> {
  const presidentes = await getPresidentesClient();
  const defaultOn = opts.defaultOn ?? true;
  const showToggle = opts.presidenteToggle ?? true;
  const years = Object.keys(opts.historico).sort();
  const valores = years.map((y) => opts.historico[y]);
  const colorsPorPresidente = colorsForYears(years, presidentes, COLOR_BASE);
  // Color inicial del trace: por presidente solo si el toggle existe y arranca encendido.
  const initialColor = showToggle && defaultOn
    ? colorsPorPresidente
    : colorsPorPresidente.map(() => COLOR_BASE);
  const customdata = years.map((y) => {
    const p = presidenteForYear(parseInt(y, 10), presidentes);
    return [p?.nombre ?? "Sin datos", p?.partido ?? "—"];
  });

  const dec = opts.hoverDecimals ?? 2;
  const yFormat = opts.hoverThousands ? ",.0f" : `.${dec}f`;
  const traces = [{
    type: "bar", x: years, y: valores,
    marker: { color: initialColor, line: { color: "rgba(0,0,0,0.08)", width: 0.5 } },
    customdata, name: opts.name,
    hovertemplate:
      `<b>%{x}</b><br>${opts.name}: <b>%{y:${yFormat}}${opts.hoverSuffix}</b><br>` +
      "Presidente: %{customdata[0]}<br>" +
      "<span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>",
  }];

  // Referencias con el generador único (UI-10): promedio histórico y meta BanRep.
  const { shapes, annotations } = lineasReferencia(valores, {
    maximo: false,
    minimo: false,
    promedio: opts.promedioOptions?.showLine ?? false,
    etiquetaPromedio: "Promedio histórico",
    sufijo: opts.yaxisTickSuffix ?? "%",
    decimales: 2,
    extra: opts.metaBanrep ? [META_BANREP] : [],
  });

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
    ...(showToggle ? { headerHtml: renderToggle(defaultOn) } : {}),
    ...(showToggle ? { footerHtml: renderLegend(leyenda, defaultOn) } : {}),
    onMount: (target) => {
      target.dataset.colorsByPresident = JSON.stringify(colorsPorPresidente);
      target.dataset.colorBase = COLOR_BASE;
    },
  };
}

export const inflacionHistorica: ChartDef = {
  id: "inflacion-historica",
  titulo: "Inflación histórica de Colombia",
  pregunta: "Inflación anual promedio desde 1960 según datos del Banco Mundial. Coloreada por presidente que gobernó la mayor parte del año.",
  fuenteTexto: "Banco Mundial — World Development Indicators (último año: cálculo propio con IPC del DANE) · Presidentes: Registraduría Nacional",
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
      defaultOn: false,
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
      defaultOn: false,
    });
  },
};

export const salarioMinimoHistorico: ChartDef = {
  id: "salario-minimo-historico",
  titulo: "Salario mínimo histórico de Colombia",
  pregunta: "Salario mínimo mensual legal vigente (SMMLV) en pesos corrientes desde 1984, año en que se unificó para todos los sectores. Coloreado por presidente que lo decretó.",
  fuenteTexto: "Ministerio del Trabajo — decretos anuales · Presidentes: Registraduría Nacional",
  datasets: ["salario-minimo"],
  height: 420,
  ariaLabel: "Salario mínimo mensual de Colombia desde 1984 en pesos corrientes, con color por presidente",
  build({ "salario-minimo": smlv }) {
    return buildHistorico("salario-minimo-historico", {
      historico: smlv!.historico,
      name: "Salario mínimo",
      hoverSuffix: " COP",
      hoverThousands: true,
      yaxisTickSuffix: "",
      defaultOn: false,
    });
  },
};

export const salarioMinimoVariacion: ChartDef = {
  id: "salario-minimo-variacion",
  titulo: "Variación porcentual del salario mínimo",
  pregunta: "Incremento porcentual decretado cada año frente al anterior. Se muestra como línea por defecto; activa barras para ver el color por presidente.",
  fuenteTexto: "Ministerio del Trabajo — decretos anuales · Presidentes: Registraduría Nacional",
  datasets: ["salario-minimo"],
  height: 420,
  ariaLabel: "Variación porcentual anual del salario mínimo en Colombia desde 1985",
  vistas: ["linea", "barras"],
  async build({ "salario-minimo": smlv }) {
    const presidentes = await getPresidentesClient();

    const variacionMap: Record<string, number> = {};
    smlv!.serie.forEach((row) => {
      const y = row.periodo.split("-")[0];
      if (row.variacion_pct !== null) {
        variacionMap[y] = row.variacion_pct;
      }
    });

    const sortedYears = Object.keys(variacionMap).sort();
    const sortedValores = sortedYears.map((y) => variacionMap[y]);

    const colorsPorPresidente = colorsForYears(sortedYears, presidentes, COLOR_BASE);
    const customdata = sortedYears.map((y) => {
      const p = presidenteForYear(parseInt(y, 10), presidentes);
      return [p?.nombre ?? "Sin datos", p?.partido ?? "—"];
    });

    // Una sola traza: en vista de barras, aVista toma `marker.color` por punto
    // (colores por presidente) o el color de la línea.
    const traza = (conPresidente: boolean) => ({
      type: "scatter",
      mode: "lines+markers",
      x: sortedYears,
      y: sortedValores,
      line: { color: COLOR_BASE, width: 2 },
      marker: { color: conPresidente ? colorsPorPresidente : COLOR_BASE, size: 6 },
      customdata,
      name: "Variación",
      hovertemplate:
        `<b>%{x}</b><br>Variación: <b>%{y:.2f}%</b><br>` +
        "Presidente: %{customdata[0]}<br>" +
        "<span style='color:#94a3b8'>%{customdata[1]}</span><extra></extra>",
    });

    const layout = baseLayout({
      margin: { l: 48, r: 24, t: 16, b: 40 },
      showlegend: false,
      hovermode: "x",
      yaxis: {
        showgrid: true,
        gridcolor: "rgba(208, 215, 220, 0.4)",
        zeroline: false,
        tickfont: { size: 11, color: "#636c76" },
        ticksuffix: "%",
        automargin: true,
      },
    });

    const leyenda = presidentesEnLeyenda(sortedYears, presidentes);

    return {
      traces: [traza(false)],
      layout,
      headerHtml: presToggleHtml("smv", true),
      footerHtml: presLeyendaHtml("smv", leyenda),
      onMount: (target, ctx) => bindColorPresidente({ target, ctx, prefix: "smv", traza, soloEnBarras: true }),
    };
  },
};

export const poblacionHistorica: ChartDef = {
  id: "poblacion-historica",
  titulo: "Población histórica de Colombia",
  pregunta: "Población total anual desde 1960. Coloreada por presidente que gobernó la mayor parte del año.",
  fuenteTexto: "Banco Mundial — World Development Indicators · Presidentes: Registraduría Nacional",
  datasets: ["demografia"],
  height: 420,
  ariaLabel: "Población total histórica de Colombia desde 1960 con color por presidente",
  build({ demografia }) {
    return buildHistorico("poblacion-historica", {
      historico: demografia!.historico,
      name: "Población",
      hoverSuffix: " hab.",
      hoverDecimals: 0,
      yaxisTickSuffix: "",
      presidenteToggle: false,
    });
  },
};

export const importacionesHistorica: ChartDef = {
  id: "comercio-impo",
  titulo: "Importaciones (% del PIB)",
  pregunta: "Importaciones como % del PIB desde 1960. Coloreadas por presidente que gobernó la mayor parte del año.",
  fuenteTexto: "Banco Mundial — World Development Indicators · Presidentes: Registraduría Nacional",
  datasets: ["comercio"],
  height: 420,
  ariaLabel: "Importaciones de Colombia como porcentaje del PIB desde 1960, con color por presidente",
  build({ comercio }) {
    return buildHistorico("comercio-impo", {
      historico: recordByYear(comercio!.serie, (r) => r.importaciones ?? null),
      name: "Importaciones",
      hoverSuffix: "% PIB",
      defaultOn: false,
    });
  },
};

export const pibPerCapitaHistorico: ChartDef = {
  id: "pib-percapita",
  titulo: "PIB per cápita",
  pregunta: "PIB por habitante en USD desde 1960. Pasó de $258 en 1960 a $7,919 en 2024. Coloreado por presidente.",
  fuenteTexto: "Banco Mundial — WDI · Presidentes: Registraduría Nacional",
  datasets: ["pib"],
  height: 420,
  ariaLabel: "PIB per cápita de Colombia desde 1960, con color por presidente",
  build({ pib }) {
    return buildHistorico("pib-percapita", {
      historico: recordByYear(pib!.serie, (r) => r.pib_percapita ?? null),
      name: "PIB per cápita",
      hoverSuffix: " USD",
      hoverDecimals: 0,
      yaxisTickSuffix: "",
      defaultOn: false,
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
      defaultOn: false,
    });
  },
};
