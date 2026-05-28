import { baseLayout, extractSerie, periodoToISODate } from "../charts";
import { comercioPorPibJoin, okunRegression, empleoAnualDiciembre } from "../derivations";
import type { ChartDef } from "./types";

const FUENTE_BM = "Banco Mundial — WDI";

export const crecimientoPib: ChartDef = {
  id: "pib-crecimiento",
  titulo: "Crecimiento del PIB (%)",
  pregunta: "Variación porcentual anual del PIB real. Verde = crecimiento, rojo = contracción.",
  fuenteTexto: FUENTE_BM,
  datasets: ["pib"],
  height: 380,
  ariaLabel: "Crecimiento anual del PIB de Colombia",
  build({ pib }) {
    const { x, y } = extractSerie(pib!.serie, "crecimiento_pib");
    const barColors = y.map((v) => v !== null ? (v >= 0 ? "#16a34a" : "#dc2626") : "#cbd5e1");
    return {
      traces: [{ name: "Crecimiento PIB", x, y, type: "bar",
        marker: { color: barColors, line: { color: "rgba(0,0,0,0.05)", width: 0.5 } },
        hovertemplate: "<b>%{x|%Y}</b><br>Crecimiento: %{y:.2f}%<extra></extra>" }],
      layout: baseLayout({
        showlegend: false, margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
        shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 0, y1: 0,
          line: { color: "#1f2328", width: 1.5, dash: "solid" } }],
      }),
    };
  },
};

export const pibTotal: ChartDef = {
  id: "pib-total",
  titulo: "PIB total de Colombia",
  pregunta: "Producto Interno Bruto en miles de millones de USD corrientes. La economía colombiana multiplicó su tamaño 100 veces desde 1960.",
  fuenteTexto: FUENTE_BM,
  datasets: ["pib"],
  height: 340,
  ariaLabel: "PIB total de Colombia",
  build({ pib }) {
    const { x, y } = extractSerie(pib!.serie, "pib_total");
    return {
      traces: [{ name: "PIB", x, y, mode: "lines",
        line: { color: "#2563eb", width: 2.2 }, fill: "tozeroy",
        fillcolor: "rgba(37,99,235,0.06)",
        hovertemplate: "<b>%{x|%Y}</b><br>PIB: %{y:,.1f} mil M USD<extra></extra>" }],
      layout: baseLayout(),
    };
  },
};

export const pibPerCapita: ChartDef = {
  id: "pib-percapita",
  titulo: "PIB per cápita",
  pregunta: "PIB dividido por la población. Pasó de $258 en 1960 a $7,919 en 2024. Mide la riqueza promedio por habitante.",
  fuenteTexto: FUENTE_BM,
  datasets: ["pib"],
  height: 340,
  ariaLabel: "PIB per cápita de Colombia",
  build({ pib }) {
    const { x, y } = extractSerie(pib!.serie, "pib_percapita");
    return {
      traces: [{ name: "PIB per cápita", x, y, mode: "lines",
        line: { color: "#2563eb", width: 2.2 }, fill: "tozeroy",
        fillcolor: "rgba(37,99,235,0.06)",
        hovertemplate: "<b>%{x|%Y}</b><br>PIB per cápita: %{y:,.0f} USD<extra></extra>" }],
      layout: baseLayout({
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "", automargin: true },
      }),
    };
  },
};

export const poblacionPib: ChartDef = {
  id: "pib-poblacion",
  titulo: "Población y PIB per cápita",
  pregunta: "La población crece de forma estable mientras el PIB per cápita refleja los ciclos económicos. Eje izquierdo: población, eje derecho: PIB per cápita USD.",
  fuenteTexto: FUENTE_BM,
  datasets: ["pib"],
  height: 360,
  ariaLabel: "Población y PIB per cápita de Colombia",
  build({ pib }) {
    const { x: x1, y: y1 } = extractSerie(pib!.serie, "poblacion");
    const { x: x2, y: y2 } = extractSerie(pib!.serie, "pib_percapita");
    return {
      traces: [
        { name: "Población", x: x1, y: y1, mode: "lines", line: { color: "#2563eb", width: 2.2 },
          yaxis: "y", hovertemplate: "<b>%{x|%Y}</b><br>Población: %{y:,.0f}<extra></extra>" },
        { name: "PIB per cápita", x: x2, y: y2, mode: "lines",
          line: { color: "#16a34a", width: 2.2, dash: "dash" },
          yaxis: "y2", hovertemplate: "<b>%{x|%Y}</b><br>PIB per cápita: %{y:,.0f} USD<extra></extra>" },
      ],
      layout: baseLayout({
        showlegend: true, legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#2563eb" }, ticksuffix: "", automargin: true },
        yaxis2: { overlaying: "y", side: "right", showgrid: false, tickfont: { size: 11, color: "#16a34a" }, automargin: true },
      }),
    };
  },
};

export const deudaPublica: ChartDef = {
  id: "deuda-publica",
  titulo: "Deuda pública como % del PIB",
  pregunta: "Del 17% en 2000 al 91% en 2020 durante la pandemia. Las bandas marcan los umbrales clásicos de sostenibilidad fiscal para mercados emergentes.",
  fuenteTexto: "Banco Mundial — WDI · Umbrales FMI",
  datasets: ["pib"],
  height: 420,
  ariaLabel: "Evolución de la deuda pública de Colombia como porcentaje del PIB, con bandas de sostenibilidad fiscal",
  build({ pib }) {
    const data = pib!.serie.filter((r) => typeof r.deuda_publica === "number" && r.deuda_publica > 0);
    const x = data.map((r) => periodoToISODate(r.periodo));
    const y = data.map((r) => r.deuda_publica as number);

    const banda = (y0: number, y1: number, color: string) => ({
      type: "rect", xref: "paper", yref: "y", x0: 0, x1: 1, y0, y1,
      fillcolor: color, line: { width: 0 }, layer: "below",
    });

    return {
      traces: [{
        name: "Deuda pública", x, y, mode: "lines",
        line: { color: "#1e293b", width: 2.4 }, fill: "tozeroy",
        fillcolor: "rgba(30,41,59,0.06)",
        hovertemplate: "<b>%{x|%Y}</b><br>Deuda pública: <b>%{y:.1f}%</b> del PIB<extra></extra>",
      }],
      layout: baseLayout({
        margin: { l: 48, r: 24, t: 16, b: 40 }, showlegend: false, hovermode: "x",
        yaxis: { showgrid: true, gridcolor: "rgba(208, 215, 220, 0.4)", zeroline: false,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true, range: [0, 100] },
        shapes: [
          banda(0, 40, "rgba(34,197,94,0.10)"),
          banda(40, 60, "rgba(234,179,8,0.10)"),
          banda(60, 100, "rgba(220,38,38,0.10)"),
        ],
        annotations: [{
          x: "2020-12-01", y: 91.16, xref: "x", yref: "y",
          text: "Pandemia<br><b>91.2%</b>", showarrow: true, arrowhead: 2,
          arrowcolor: "#dc2626", ax: -40, ay: -30,
          font: { size: 11, color: "#dc2626" },
          bgcolor: "rgba(255,255,255,0.85)", bordercolor: "rgba(220,38,38,0.4)",
          borderwidth: 1, borderpad: 4,
        }],
      }),
      footerHtml: `
        <div class="banda-leyenda">
          <span class="banda-chip"><span class="banda-dot banda-dot--low"></span>&lt;40% sostenibilidad sólida</span>
          <span class="banda-chip"><span class="banda-dot banda-dot--mid"></span>40-60% atención</span>
          <span class="banda-chip"><span class="banda-dot banda-dot--high"></span>&gt;60% riesgo</span>
        </div>`,
    };
  },
};

export const pibComercio: ChartDef = {
  id: "pib-comercio",
  titulo: "PIB total y peso de las exportaciones",
  pregunta: "Las exportaciones representan entre 13% y 22% del PIB. Cuando caen los precios de commodities, cae el PIB en USD.",
  fuenteTexto: "Banco Mundial — WDI · DANE",
  datasets: ["pib", "comercio"],
  height: 440,
  ariaLabel: "PIB total y exportaciones como porcentaje del PIB, 1960-2024",
  build({ pib, comercio }) {
    const { x, pib: pibArr, exp } = comercioPorPibJoin(pib!.serie, comercio!.serie);
    return {
      traces: [
        { name: "PIB total", x, y: pibArr, mode: "lines",
          line: { color: "#2563eb", width: 2.2 }, fill: "tozeroy", fillcolor: "rgba(37,99,235,0.05)",
          yaxis: "y", hovertemplate: "<b>%{x|%Y}</b><br>PIB: <b>%{y:,.1f} mil M USD</b><extra></extra>" },
        { name: "Exportaciones (% PIB)", x, y: exp, mode: "lines",
          line: { color: "#16a34a", width: 2.2 }, yaxis: "y2",
          hovertemplate: "<b>%{x|%Y}</b><br>Exportaciones: <b>%{y:.1f}%</b> del PIB<extra></extra>" },
      ],
      layout: baseLayout({
        margin: { l: 56, r: 56, t: 24, b: 40 },
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        hovermode: "x unified",
        yaxis: {
          title: { text: "PIB (mil M USD)", font: { size: 11, color: "#2563eb" } },
          showgrid: true, gridcolor: "rgba(208,215,220,0.4)", zeroline: false,
          tickfont: { size: 11, color: "#2563eb" }, ticksuffix: "", automargin: true,
        },
        yaxis2: {
          title: { text: "Exportaciones (% PIB)", font: { size: 11, color: "#16a34a" } },
          overlaying: "y", side: "right", showgrid: false, zeroline: false,
          tickfont: { size: 11, color: "#16a34a" }, ticksuffix: "%", automargin: true,
        },
        shapes: [{ type: "rect", xref: "x", yref: "paper", x0: "2007-01-01", x1: "2014-12-31",
          y0: 0, y1: 1, fillcolor: "rgba(234,179,8,0.06)", line: { width: 0 }, layer: "below" }],
        annotations: [
          { x: "2011-01-01", y: 1.02, xref: "x", yref: "paper", text: "Boom petrolero", showarrow: false, font: { size: 10, color: "#a16207" } },
          { x: "2020-12-01", y: 270.35, xref: "x", yref: "y", text: "COVID", showarrow: true, arrowhead: 2, arrowcolor: "#dc2626", ax: 30, ay: 30, font: { size: 10, color: "#dc2626" } },
        ],
      }),
    };
  },
};

export const leyOkun: ChartDef = {
  id: "ley-okun",
  titulo: "Ley de Okun: crecimiento PIB vs cambio en desempleo",
  pregunta: "Cada punto adicional de crecimiento del PIB reduce el desempleo. Colombia necesita crecer por encima de cierto umbral para no destruir empleo neto.",
  fuenteTexto: "DANE — GEIH (desempleo Dic) · Banco Mundial — WDI (crecimiento PIB)",
  datasets: ["pib", "empleo"],
  height: 440,
  ariaLabel: "Diagrama de dispersión de crecimiento PIB vs cambio en desempleo con línea de regresión",
  build({ pib, empleo }) {
    const empDic = empleoAnualDiciembre(empleo!.serie);
    const { puntos, slope, intercept, umbral, n } = okunRegression(pib!.serie, empDic);
    const xs = puntos.map((p) => p.crecimiento);
    const ys = puntos.map((p) => p.deltaDesempleo);
    const xMin = Math.min(...xs) - 0.5;
    const xMax = Math.max(...xs) + 0.5;
    const regX = [xMin, xMax];
    const regY = regX.map((x) => intercept + slope * x);

    const umbralFmt = umbral.toFixed(1);
    const slopeFmt = slope.toFixed(2);

    return {
      traces: [
        { name: "Año", x: xs, y: ys, mode: "markers+text", type: "scatter",
          marker: { size: 9, color: "#2563eb", line: { color: "white", width: 1 } },
          text: puntos.map((p) => p.year.slice(2)),
          textposition: "top center",
          textfont: { size: 9, color: "#475569" },
          hovertemplate: "<b>%{text}</b><br>Crecimiento PIB: %{x:.2f}%<br>Δ Desempleo: %{y:+.2f} pp<extra></extra>" },
        { name: "Regresión OLS", x: regX, y: regY, mode: "lines", type: "scatter",
          line: { color: "#dc2626", width: 2, dash: "dash" }, hoverinfo: "skip" },
      ],
      layout: baseLayout({
        margin: { l: 56, r: 24, t: 24, b: 48 },
        showlegend: false, hovermode: "closest",
        xaxis: {
          type: "linear", title: { text: "Crecimiento PIB (%)", font: { size: 11, color: "#636c76" } },
          showgrid: true, gridcolor: "rgba(208,215,220,0.4)",
          zeroline: true, zerolinecolor: "rgba(100,100,100,0.4)", zerolinewidth: 1,
          tickfont: { size: 11, color: "#636c76" }, ticksuffix: "%", automargin: true,
        },
        yaxis: {
          title: { text: "Cambio en desempleo (pp)", font: { size: 11, color: "#636c76" } },
          showgrid: true, gridcolor: "rgba(208,215,220,0.4)",
          zeroline: true, zerolinecolor: "rgba(100,100,100,0.4)", zerolinewidth: 1,
          tickfont: { size: 11, color: "#636c76" }, automargin: true,
        },
        shapes: [{ type: "line", xref: "x", yref: "y", x0: umbral, x1: umbral, y0: -3, y1: 3,
          line: { color: "rgba(22,163,74,0.5)", width: 1, dash: "dot" } }],
        annotations: [{ x: umbral, y: 2.8, xref: "x", yref: "y",
          text: `Umbral: <b>${umbralFmt}%</b>`, showarrow: false,
          font: { size: 10, color: "#16a34a" }, bgcolor: "rgba(255,255,255,0.85)", borderpad: 3 }],
      }),
      pregunta: `Cada punto adicional de crecimiento del PIB reduce el desempleo en ${(-slope).toFixed(2)} pp. Colombia necesita crecer al menos ${umbralFmt}% para no destruir empleo neto.`,
      footerHtml: `
        <div class="okun-stat">
          <span><strong>Pendiente OLS:</strong> ${slopeFmt}</span>
          <span><strong>Umbral de crecimiento:</strong> ${umbralFmt}%</span>
          <span><strong>n:</strong> ${n} años</span>
        </div>`,
    };
  },
};
