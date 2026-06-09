import { COLORS, baseLayout, extractSerie, periodoToISODate, minMaxAvgLines } from "../charts";
import type { ChartDef } from "./types";

const FUENTE_BM = "Banco Mundial — WDI";

// Tokens locales reutilizados (no hex sueltos dispersos): rosa para mujeres,
// azul de marca para hombres, gris pizarra para Gini.
const COLOR_MUJERES = "#db2777";
const COLOR_HOMBRES = COLORS.brand;

export const poblacionCrecimiento: ChartDef = {
  id: "poblacion-crecimiento",
  titulo: "Tasa de crecimiento poblacional",
  pregunta:
    "Variación porcentual anual de la población. El ritmo cayó de más del 3 % en los años 60 a cerca del 1 % hoy: la transición demográfica en acción.",
  fuenteTexto: "Cálculo propio · Banco Mundial — WDI",
  datasets: ["demografia"],
  height: 340,
  ariaLabel: "Tasa de crecimiento poblacional anual de Colombia desde 1961",
  build({ demografia }) {
    const { x, y } = extractSerie(demografia!.serie, "crecimiento_poblacion");
    const { shapes, annotations } = minMaxAvgLines(y, { suffix: "%" });
    return {
      traces: [{
        name: "Crecimiento poblacional", x, y, mode: "lines+markers",
        line: { color: COLORS.brand, width: 2.2 },
        marker: { size: 5, color: COLORS.brand },
        hovertemplate: "<b>%{x|%Y}</b><br>Crecimiento: %{y:.2f}%<extra></extra>",
      }],
      layout: baseLayout({
        showlegend: false, hovermode: "x",
        yaxis: {
          showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true,
        },
        shapes, annotations,
      }),
    };
  },
};

export const esperanzaVida: ChartDef = {
  id: "esperanza-vida",
  titulo: "Esperanza de vida al nacer",
  pregunta:
    "Mujeres y hombres viven cada vez más, pero la brecha de género se mantiene a favor de las mujeres.",
  fuenteTexto: FUENTE_BM,
  datasets: ["demografia"],
  height: 360,
  ariaLabel: "Esperanza de vida al nacer de mujeres y hombres en Colombia",
  build({ demografia }) {
    const { x: xm, y: ym } = extractSerie(demografia!.serie, "esperanza_vida_mujeres");
    const { y: yh } = extractSerie(demografia!.serie, "esperanza_vida_hombres");

    // Última brecha disponible (cálculo propio, ya en el dataset).
    const ultimaBrecha = [...demografia!.serie]
      .reverse()
      .find((r) => typeof r.brecha_esperanza_vida === "number");
    const brechaTxt = ultimaBrecha
      ? `${(ultimaBrecha.brecha_esperanza_vida as number).toFixed(1)} años`
      : "—";

    return {
      traces: [
        {
          name: "Mujeres", x: xm, y: ym, mode: "lines+markers",
          line: { color: COLOR_MUJERES, width: 2.2 },
          marker: { size: 5, color: COLOR_MUJERES },
          hovertemplate: "<b>%{x|%Y}</b><br>Mujeres: %{y:.1f} años<extra></extra>",
        },
        {
          name: "Hombres", x: xm, y: yh, mode: "lines+markers",
          line: { color: COLOR_HOMBRES, width: 2.2 },
          marker: { size: 5, color: COLOR_HOMBRES },
          hovertemplate: "<b>%{x|%Y}</b><br>Hombres: %{y:.1f} años<extra></extra>",
        },
      ],
      layout: baseLayout({
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        hovermode: "x unified",
        yaxis: {
          showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true,
        },
      }),
      footerHtml: `
        <div class="banda-leyenda">
          <span class="banda-chip"><span class="banda-dot" style="background:${COLOR_MUJERES}"></span>Mujeres</span>
          <span class="banda-chip"><span class="banda-dot" style="background:${COLOR_HOMBRES}"></span>Hombres</span>
          <span class="banda-chip"><strong>Brecha actual:</strong>&nbsp;${brechaTxt}</span>
        </div>`,
    };
  },
};

export const giniEvolucion: ChartDef = {
  id: "gini-evolucion",
  titulo: "Desigualdad: coeficiente de Gini",
  pregunta:
    "El Gini mide la desigualdad de ingresos (0 = igualdad total, 100 = un solo hogar concentra todo). Colombia es uno de los países más desiguales de la región.",
  fuenteTexto: "Banco Mundial — WDI · Umbrales de referencia",
  datasets: ["demografia"],
  height: 400,
  ariaLabel: "Evolución del coeficiente de Gini de Colombia con bandas de interpretación",
  build({ demografia }) {
    const data = demografia!.serie.filter((r) => typeof r.gini === "number");
    const x = data.map((r) => periodoToISODate(r.periodo));
    const y = data.map((r) => r.gini as number);

    const banda = (y0: number, y1: number, color: string) => ({
      type: "rect", xref: "paper", yref: "y", x0: 0, x1: 1, y0, y1,
      fillcolor: color, line: { width: 0 }, layer: "below",
    });

    const ref = minMaxAvgLines(y);

    return {
      traces: [{
        name: "Gini", x, y, mode: "lines+markers",
        line: { color: "#1e293b", width: 2.4 },
        marker: { size: 5, color: "#1e293b" },
        hovertemplate: "<b>%{x|%Y}</b><br>Gini: <b>%{y:.1f}</b><extra></extra>",
      }],
      layout: baseLayout({
        margin: { l: 48, r: 24, t: 16, b: 40 }, showlegend: false, hovermode: "x",
        yaxis: {
          showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true,
          range: [40, 62],
        },
        shapes: [
          banda(40, 45, "rgba(34,197,94,0.10)"),
          banda(45, 50, "rgba(234,179,8,0.10)"),
          banda(50, 62, "rgba(220,38,38,0.10)"),
          ...ref.shapes,
        ],
        annotations: ref.annotations,
      }),
      footerHtml: `
        <div class="banda-leyenda">
          <span class="banda-chip"><span class="banda-dot banda-dot--low"></span>&lt;45 desigualdad moderada</span>
          <span class="banda-chip"><span class="banda-dot banda-dot--mid"></span>45-50 alta</span>
          <span class="banda-chip"><span class="banda-dot banda-dot--high"></span>&gt;50 muy alta</span>
        </div>`,
    };
  },
};
