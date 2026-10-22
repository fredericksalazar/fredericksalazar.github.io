/**
 * Mini tendencias de la Home del Observatorio (spec 005, research R5).
 *
 * `makeSparkline(def)` genera un `ChartDef` por indicador clave (patrón de
 * `makeComparativoSet`, ARQ-19). La serie se carga en runtime vía
 * `data-client.ts` (REGLAS 2 y 8). Color: azul de marca, elegido por el autor.
 *
 * Excepción aprobada (plan, Complexity Tracking): sin interruptor Línea ↔ Barras
 * (UI-08) y sin card propia (UI-07); vive dentro de `IndicadorClaveCard`.
 */
import { COLORS, baseLayout, periodoToISODate } from "../charts";
import { valoresNoNulos } from "../derivations";
import { INDICADORES_CLAVE, type IndicadorClaveDef } from "../home";
import type { ChartDef, LoadedDatasets } from "./types";

/** Puntos visibles: 24 meses o 20 años. Se cuentan valores, no filas (un dataset puede mezclar periodicidades). */
const VENTANA = { mensual: 24, anual: 20 } as const;

const VENTANA_TEXTO = { mensual: "los últimos 24 meses", anual: "los últimos 20 años" } as const;

export const sparklineId = (indicadorId: string) => `spark-${indicadorId}`;

export const makeSparkline = (ind: IndicadorClaveDef): ChartDef => ({
  id: sparklineId(ind.id),
  titulo: `Tendencia · ${ind.nombre}`,
  datasets: [ind.dataset],
  height: 48,
  vistas: ["linea"],
  ariaLabel: `Tendencia de ${ind.nombre.toLowerCase()} en ${VENTANA_TEXTO[ind.periodicidad]}`,
  build(data: LoadedDatasets) {
    const dataset = data[ind.dataset] as { serie: { periodo: string }[] } | undefined;
    const puntos = valoresNoNulos(dataset?.serie ?? [], ind.campo)
      .slice(0, VENTANA[ind.periodicidad])
      .reverse();
    const x = puntos.map((p) => periodoToISODate(p.periodo));
    const y = puntos.map((p) => p.valor);
    const ultimo = puntos.length - 1;
    const minY = y.length ? Math.min(...y) : 0;
    const maxY = y.length ? Math.max(...y) : 1;
    const pad = (maxY - minY) * 0.16 || 1;
    const baseY = minY - pad;
    return {
      traces: [
        {
          type: "scatter",
          mode: "lines",
          x: x.length ? [x[0], x[ultimo]] : [],
          y: x.length ? [baseY, baseY] : [],
          line: { width: 0, color: "rgba(0,0,0,0)" },
          hoverinfo: "skip",
        },
        {
          type: "scatter",
          mode: "lines",
          x,
          y,
          fill: "tonexty",
          fillcolor: "rgba(37, 99, 235, 0.08)",
          line: { color: COLORS.brand, width: 2, shape: "spline", smoothing: 0.4 },
          hoverinfo: "skip",
        },
        {
          type: "scatter",
          mode: "markers",
          x: x.length > 1 ? [x[0], x[ultimo]] : [x[ultimo]],
          y: y.length > 1 ? [y[0], y[ultimo]] : [y[ultimo]],
          marker: {
            color: x.length > 1 ? ["rgba(37, 99, 235, 0.45)", COLORS.brand] : [COLORS.brand],
            size: x.length > 1 ? [4, 6.5] : [6.5],
          },
          hoverinfo: "skip",
        },
      ],
      layout: baseLayout({
        margin: { l: 4, r: 6, t: 4, b: 4 },
        showlegend: false,
        height: 48,
        xaxis: { visible: false, fixedrange: true },
        yaxis: { visible: false, fixedrange: true, range: [baseY, maxY + pad] },
      }),
      config: { staticPlot: true, displayModeBar: false, responsive: true },
    };
  },
});

export const sparklines: ChartDef[] = INDICADORES_CLAVE.map(makeSparkline);
