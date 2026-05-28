import { baseLayout, extractSerie } from "../charts";
import type { ChartDef } from "./types";

const FUENTE_GEIH = "DANE — Gran Encuesta Integrada de Hogares (GEIH)";

export const desempleo: ChartDef = {
  id: "desempleo",
  titulo: "Tasa de desempleo",
  pregunta: "¿Cómo ha evolucionado el desempleo en Colombia?",
  fuenteTexto: "Banco Mundial — World Development Indicators",
  datasets: ["empleo"],
  height: 340,
  ariaLabel: "Evolución de la tasa de desempleo en Colombia",
  build({ empleo }) {
    const filtered = empleo!.serie.filter((r) => r.periodo >= "2000-01");
    const { x, y } = extractSerie(filtered, "tasa_desempleo");
    return {
      traces: [{
        name: "Tasa de desempleo", x, y, mode: "lines",
        line: { color: "#2563eb", width: 2.2 }, fill: "tozeroy",
        fillcolor: "rgba(37, 99, 235, 0.06)",
        hovertemplate: "<b>%{x|%b %Y}</b><br>Desempleo: %{y:.2f}%<extra></extra>",
      }],
      layout: baseLayout(),
    };
  },
};

export const subempleo: ChartDef = {
  id: "subempleo",
  titulo: "Tasa de subempleo",
  pregunta: "Porcentaje de ocupados que trabajan menos horas de las que quisieran. Un indicador adelantado: el subempleo suele anticipar cambios en el desempleo.",
  fuenteTexto: FUENTE_GEIH,
  datasets: ["empleo"],
  height: 340,
  ariaLabel: "Tasa de subempleo mensual en Colombia",
  build({ empleo }) {
    const filtered = empleo!.serie.filter((r) => r.periodo >= "2000-01");
    const { x, y } = extractSerie(filtered, "subempleo");
    return {
      traces: [{
        name: "Tasa de subempleo", x, y, mode: "lines",
        line: { color: "#2563eb", width: 2.2 }, fill: "tozeroy",
        fillcolor: "rgba(37, 99, 235, 0.06)",
        hovertemplate: "<b>%{x|%b %Y}</b><br>Subempleo: %{y:.2f}%<extra></extra>",
      }],
      layout: baseLayout(),
    };
  },
};

export const tgpToDual: ChartDef = {
  id: "tgp-to-dual",
  titulo: "TGP y Tasa de Ocupación",
  pregunta: "La TGP mide cuántas personas trabajan o buscan trabajo. La TO mide cuántas están efectivamente ocupadas. La brecha entre ambas refleja el desempleo.",
  fuenteTexto: FUENTE_GEIH,
  datasets: ["empleo"],
  height: 340,
  ariaLabel: "Tasa Global de Participación y Tasa de Ocupación mensuales",
  build({ empleo }) {
    const filtered = empleo!.serie.filter((r) => r.periodo >= "2000-01");
    const tgp = extractSerie(filtered, "tgp");
    const to = extractSerie(filtered, "to");
    return {
      traces: [
        { name: "TGP", x: tgp.x, y: tgp.y, mode: "lines",
          line: { color: "#2563eb", width: 2.2 },
          hovertemplate: "<b>%{x|%b %Y}</b><br>TGP: %{y:.2f}%<extra></extra>" },
        { name: "Tasa de Ocupación", x: to.x, y: to.y, mode: "lines",
          line: { color: "#64748b", width: 2.2, dash: "dash" },
          hovertemplate: "<b>%{x|%b %Y}</b><br>TO: %{y:.2f}%<extra></extra>" },
      ],
      layout: baseLayout({
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
      }),
    };
  },
};

export const brechaLaboral: ChartDef = {
  id: "brecha-laboral",
  titulo: "Brecha laboral (TGP − TO)",
  pregunta: "Diferencia entre participación y ocupación. Una brecha alta indica que mucha gente busca trabajo pero no lo encuentra. Colores: azul = baja (<8 pp), ámbar = media (8-10 pp), rojo = alta (>10 pp).",
  fuenteTexto: "Cálculo propio sobre DANE — GEIH",
  datasets: ["empleo"],
  height: 380,
  ariaLabel: "Brecha entre TGP y Tasa de Ocupación mensual",
  build({ empleo }) {
    const filtered = empleo!.serie.filter((r) => r.periodo >= "2000-01");
    const tgp = extractSerie(filtered, "tgp");
    const to = extractSerie(filtered, "to");
    const brecha = tgp.y.map((v, i) =>
      v !== null && to.y[i] !== null ? v - (to.y[i] as number) : null,
    );
    const pares = tgp.x.map((x, i) => ({ x, y: brecha[i] })).filter((p) => p.y !== null);

    return {
      traces: [{
        name: "Brecha laboral",
        x: pares.map((p) => p.x),
        y: pares.map((p) => p.y),
        type: "bar",
        marker: {
          color: pares.map((p) => (p.y! > 10 ? "#dc2626" : p.y! > 8 ? "#f59e0b" : "#2563eb")),
          line: { color: "rgba(0,0,0,0.05)", width: 0.5 },
        },
        hovertemplate: "<b>%{x|%b %Y}</b><br>Brecha TGP − TO: %{y:.2f} pp<extra></extra>",
      }],
      layout: baseLayout({
        showlegend: false, margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
      }),
    };
  },
};
