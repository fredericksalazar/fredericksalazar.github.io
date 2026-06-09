import { COLORS, baseLayout, extractSerie, minMaxAvgLines } from "../charts";
import type { ChartDef } from "./types";

const FUENTE_BM = "Banco Mundial — World Development Indicators";

export const balanzaComercial: ChartDef = {
  id: "comercio-balanza",
  titulo: "Balanza comercial (% PIB)",
  pregunta: "Déficit o superávit comercial. Verde = superávit, rojo = déficit. La línea en 0 marca el equilibrio.",
  fuenteTexto: FUENTE_BM,
  datasets: ["comercio"],
  height: 380,
  ariaLabel: "Balanza comercial de Colombia como porcentaje del PIB",
  build({ comercio }) {
    const { x, y } = extractSerie(comercio!.serie, "balanza_comercial");
    const barColors = y.map((v) =>
      v !== null ? (v >= 0 ? "#16a34a" : "#dc2626") : "#cbd5e1",
    );
    return {
      traces: [{
        name: "Balanza comercial", x, y, type: "bar",
        marker: { color: barColors, line: { color: "rgba(0,0,0,0.05)", width: 0.5 } },
        hovertemplate: "<b>%{x|%Y}</b><br>Balanza: %{y:.2f}% PIB<extra></extra>",
      }],
      layout: baseLayout({
        showlegend: false, margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
        shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 0, y1: 0,
          line: { color: "#1f2328", width: 1.5, dash: "solid" } }],
      }),
    };
  },
};

export const apertura: ChartDef = {
  id: "comercio-apertura",
  titulo: "Grado de apertura comercial",
  pregunta: "Exportaciones + Importaciones como % del PIB. Mide qué tan integrada está Colombia al comercio mundial.",
  fuenteTexto: "Cálculo propio sobre Banco Mundial — WDI",
  datasets: ["comercio"],
  height: 340,
  ariaLabel: "Grado de apertura comercial de Colombia",
  build({ comercio }) {
    const { x, y } = extractSerie(comercio!.serie, "apertura");
    const { shapes, annotations } = minMaxAvgLines(y, { suffix: "%" });
    return {
      traces: [{
        name: "Apertura comercial", x, y, mode: "lines+markers+text",
        line: { color: COLORS.brand, width: 2.2 },
        marker: { size: 5, color: COLORS.brand },
        text: y.map((v) => (typeof v === "number" ? v.toFixed(1) : "")),
        texttemplate: "%{text}", textposition: "top center",
        textfont: { size: 8, color: "#475569" }, cliponaxis: false,
        hovertemplate: "<b>%{x|%Y}</b><br>Apertura: %{y:.2f}% PIB<extra></extra>",
      }],
      layout: baseLayout({ shapes, annotations }),
    };
  },
};

const MATRIZ_GRUPOS = ["agropecuarios", "combustibles", "manufacturas", "otros"] as const;
const MATRIZ_LABELS: Record<string, string> = {
  agropecuarios: "Agropecuarios",
  combustibles: "Combustibles",
  manufacturas: "Manufacturas",
  otros: "Otros sectores",
};
const MATRIZ_COLORS: Record<string, string> = {
  agropecuarios: "#16a34a",
  combustibles: "#f59e0b",
  manufacturas: COLORS.brand,
  otros: "#64748b",
};

function buildMatriz(matriz: Record<string, Record<string, number | null>>) {
  const years = Object.keys(matriz).sort();
  const traces = MATRIZ_GRUPOS.map((g) => ({
    name: MATRIZ_LABELS[g], x: years,
    y: years.map((y) => matriz[y]?.[g] ?? null),
    type: "bar", marker: { color: MATRIZ_COLORS[g] },
    hovertemplate: `<b>%{x}</b><br>${MATRIZ_LABELS[g]}: %{y:,.0f} mil USD<extra></extra>`,
  }));
  const layout = baseLayout({
    barmode: "stack", showlegend: true,
    legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
    margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
  });
  return { traces, layout };
}

export const matrizExportaciones: ChartDef = {
  id: "matriz-expo",
  titulo: "Matriz exportadora",
  pregunta: "Desglose anual de exportaciones colombianas por grupo OMC. Miles de USD FOB.",
  fuenteTexto: "DANE — Comercio Internacional · Grupos OMC (CUCI Rev.3) · Miles de dólares",
  datasets: ["comercio"],
  height: 420,
  ariaLabel: "Matriz exportadora",
  build({ comercio }) {
    return buildMatriz(comercio!.matriz_exportaciones);
  },
};

export const matrizImportaciones: ChartDef = {
  id: "matriz-impo",
  titulo: "Matriz importadora",
  pregunta: "Desglose anual de importaciones colombianas por grupo OMC. Miles de USD CIF.",
  fuenteTexto: "DANE — Comercio Internacional · Grupos OMC (CUCI Rev.3) · Miles de dólares",
  datasets: ["comercio"],
  height: 420,
  ariaLabel: "Matriz importadora",
  build({ comercio }) {
    return buildMatriz(comercio!.matriz_importaciones);
  },
};

export const productosTradicionales: ChartDef = {
  id: "productos-tradicionales",
  titulo: "Productos tradicionales de exportación",
  pregunta: "Café, carbón, petróleo y ferroníquel. La columna vertebral de las exportaciones colombianas desde 1992.",
  fuenteTexto: "DANE — Comercio Internacional · Miles de dólares FOB anuales",
  datasets: ["comercio"],
  height: 400,
  ariaLabel: "Evolución de las exportaciones tradicionales de Colombia",
  build({ comercio }) {
    const productos = comercio!.productos_tradicionales;
    const years = Object.keys(productos).sort();
    const items = [
      { key: "cafe", label: "Café", color: "#16a34a" },
      { key: "carbon", label: "Carbón", color: "#1f2328" },
      { key: "petroleo", label: "Petróleo y derivados", color: "#f59e0b" },
      { key: "ferroniquel", label: "Ferroníquel", color: COLORS.brand },
    ];
    const traces = items.map((item) => ({
      name: item.label, x: years,
      y: years.map((y) => productos[y]?.[item.key] ?? null),
      mode: "lines", line: { color: item.color, width: 2 },
      hovertemplate: `<b>%{x}</b><br>${item.label}: %{y:,.0f} mil USD<extra></extra>`,
    }));
    return {
      traces,
      layout: baseLayout({
        showlegend: true,
        legend: { orientation: "h", yanchor: "bottom", y: 1.04, xanchor: "left", x: 0, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
        margin: { l: 48, r: 24, t: 16, b: 40 }, hovermode: "x",
      }),
    };
  },
};
