/**
 * indicadores-clave.ts — Gráficos principales de las 8 tarjetas de la Home
 * del Observatorio (`/observatorio/`, spec 008).
 *
 * Evolución de la fábrica `makeSparkline` (ARQ-19): genera un `ChartDef`
 * `kpi-{id}` de 150 px por indicador, con eje de tiempo compartido por fila,
 * forma según la naturaleza del dato (`linea`, `escalon`, `barras`), referencia
 * dibujada sin rótulo flotante (la frase de referencia vive en el detalle de la
 * tarjeta para no tapar la serie) y registro de su geometría en `kpi-lectura.ts`
 * para la lectura sincronizada.
 *
 * Excepciones aprobadas (plan, Complexity Tracking):
 * - UI-07: vive dentro de `IndicadorClaveCard` (que es su card).
 * - UI-08: sin interruptor "Ver en barras" (cada indicador tiene su forma y el
 *   interruptor vive en el dashboard destino).
 * - DESIGN-SYSTEM 2.9: `COLORS.serie` usa `#3b82f6` en tema oscuro.
 * - DESIGN-SYSTEM 5.5: banda verde del rango meta (`COLORS.metaBanda`).
 */
import {
  COLORS,
  FONT,
  META_BANREP,
  RANGO_META_BANREP,
  baseLayout,
  lineasReferencia,
  periodoToISODate,
} from "../charts";
import {
  ejeCompartido,
  referenciaIndicador,
  valoresNoNulos,
  yearOf,
} from "../derivations";
import {
  INDICADORES_CLAVE,
  formatIndicador,
  formatPeriodoIndicador,
  type DatasetObservatorio,
  type IndicadorClaveDef,
  type Periodicidad,
} from "../home";
import { registrarLectura, type GeometriaGrafico } from "../kpi-lectura";
import { chartTheme, conAlfa } from "../theme-colors";
import type { ChartDef, LoadedDatasets } from "./types";

const VENTANA = { mensual: 24, anual: 20 } as const;

const VENTANA_TEXTO = {
  mensual: "los últimos 24 meses",
  anual: "los últimos 20 años",
} as const;

const MARGEN_KPI = { l: 10, r: 12, t: 12, b: 24 } as const;
const ALTURA_KPI = 150;
const ALFA_AREA = 0.16;

export const kpiChartId = (id: string) => `kpi-${id}`;

/**
 * Rango ISO `[inicio, fin]` del eje X compartido ampliado medio paso a cada
 * lado (15 días en mensual, 6 meses en anual) para no recortar barras ni el
 * halo del marcador vigente.
 */
function rangoXCompartidoISO(eje: string[], periodicidad: Periodicidad): [string, string] {
  if (eje.length === 0) return ["2020-01-01", "2026-12-01"];
  const primero = eje[0];
  const ultimo = eje[eje.length - 1];
  if (periodicidad === "anual") {
    const y0 = parseInt(yearOf(primero), 10);
    const y1 = parseInt(yearOf(ultimo), 10);
    return [`${String(y0).padStart(4, "0")}-06-01`, `${String(y1 + 1).padStart(4, "0")}-06-01`];
  }
  const [y0, m0] = primero.split("-").map((n) => parseInt(n, 10));
  const prevY = m0 === 1 ? y0 - 1 : y0;
  const prevM = m0 === 1 ? 12 : m0 - 1;
  const inicioISO = `${String(prevY).padStart(4, "0")}-${String(prevM).padStart(2, "0")}-16`;
  const finISO = `${ultimo}-16`;
  return [inicioISO, finISO];
}

function marcasAnioEje(eje: string[], periodicidad: Periodicidad): { tickvals: string[]; ticktext: string[] } {
  const filtrados =
    periodicidad === "mensual"
      ? eje.filter((p) => p.endsWith("-01"))
      : eje.filter((p) => parseInt(yearOf(p), 10) % 5 === 0);
  return {
    tickvals: filtrados.map(periodoToISODate),
    ticktext: filtrados.map((p) => yearOf(p)),
  };
}

export const makeIndicadorClaveChart = (ind: IndicadorClaveDef): ChartDef => {
  const indicadoresFila = INDICADORES_CLAVE.filter((i) => i.periodicidad === ind.periodicidad);
  const datasetsFila = Array.from(new Set(indicadoresFila.map((i) => i.dataset)));

  return {
    id: kpiChartId(ind.id),
    titulo: `Tendencia · ${ind.nombre}`,
    datasets: datasetsFila,
    height: ALTURA_KPI,
    vistas: ["linea"],
    ariaLabel: `Tendencia de ${ind.nombre.toLowerCase()} en ${VENTANA_TEXTO[ind.periodicidad]}`,
    build(data: LoadedDatasets) {
      const limite = VENTANA[ind.periodicidad];

      // Ventanas de los 4 indicadores de la fila para construir el eje compartido.
      const ventanasFila: { inicio: string; fin: string }[] = [];
      for (const item of indicadoresFila) {
        const dsItem = data[item.dataset] as DatasetObservatorio | undefined;
        const ptsItem = valoresNoNulos(dsItem?.serie ?? [], item.campo)
          .slice(0, VENTANA[item.periodicidad])
          .reverse();
        if (ptsItem.length > 0) {
          ventanasFila.push({
            inicio: ptsItem[0].periodo,
            fin: ptsItem[ptsItem.length - 1].periodo,
          });
        }
      }
      const eje = ejeCompartido(ventanasFila, ind.periodicidad);
      const rangoX = rangoXCompartidoISO(eje, ind.periodicidad);
      const { tickvals, ticktext } = marcasAnioEje(eje, ind.periodicidad);

      const ds = data[ind.dataset] as DatasetObservatorio | undefined;
      const serieCompleta = ds?.serie ?? [];
      const indMeta = ds?.indicadores?.[ind.campo];
      const unidad = indMeta?.unidad ?? "%";

      const puntos = valoresNoNulos(serieCompleta, ind.campo)
        .slice(0, limite)
        .reverse();
      const x = puntos.map((p) => periodoToISODate(p.periodo));
      const y = puntos.map((p) => p.valor);
      const ultimoIdx = puntos.length - 1;
      const ultimoPunto = puntos[ultimoIdx];

      const periodoVigente = indMeta?.actual.periodo ?? ultimoPunto?.periodo ?? "";
      const valorVigente = indMeta?.actual.valor ?? ultimoPunto?.valor ?? 0;

      const ref = referenciaIndicador(
        ind.referencia,
        valorVigente,
        periodoVigente,
        serieCompleta,
        ind.campo,
        (v) => formatIndicador(v, unidad),
      );

      // Cálculo de rango Y explícito: serie + referencias + 0 (si barras o desdeCero), con 8 % de holgura.
      const valoresY: number[] = [...y];
      if (ind.referencia === "meta-oficial") {
        valoresY.push(RANGO_META_BANREP.min, RANGO_META_BANREP.max);
      } else if (ref.valorReferencia !== null) {
        valoresY.push(ref.valorReferencia);
      }
      if (ind.forma === "barras" || ind.desdeCero) {
        valoresY.push(0);
      }
      const rawMin = valoresY.length ? Math.min(...valoresY) : 0;
      const rawMax = valoresY.length ? Math.max(...valoresY) : 1;
      const span = rawMax - rawMin || Math.abs(rawMax) * 0.2 || 1;
      const pad = span * 0.08;
      const tocaCeroAbajo = (ind.forma === "barras" || ind.desdeCero) && rawMin === 0;
      const tocaCeroArriba = ind.forma === "barras" && rawMax === 0;
      const minY = tocaCeroAbajo ? 0 : rawMin - pad;
      const maxY = tocaCeroArriba ? 0 : rawMax + pad;
      const rangoY: [number, number] = [minY, maxY];

      const theme = chartTheme();
      const colorSerie = COLORS.serie;
      const traces: Record<string, unknown>[] = [];
      const shapes: unknown[] = [];

      // 1. Trazas según forma
      if (ind.forma === "barras") {
        const coloresBarras = puntos.map((_, i) =>
          i === ultimoIdx ? colorSerie : conAlfa(colorSerie, 0.42),
        );
        traces.push({
          type: "bar",
          x,
          y,
          marker: {
            color: coloresBarras,
            line: { width: 0 },
          },
          hoverinfo: "skip",
        });
        shapes.push({
          type: "line",
          xref: "paper",
          x0: 0,
          x1: 1,
          yref: "y",
          y0: 0,
          y1: 0,
          line: { color: COLORS.border, width: 1 },
          layer: "below",
        });
      } else {
        const lineShape = ind.forma === "escalon" ? "hvh" : "linear";
        traces.push(
          {
            type: "scatter",
            mode: "lines",
            x: x.length ? [x[0], x[ultimoIdx]] : [],
            y: x.length ? [minY, minY] : [],
            line: { width: 0, color: "rgba(0,0,0,0)" },
            hoverinfo: "skip",
          },
          {
            type: "scatter",
            mode: "lines",
            x,
            y,
            fill: "tonexty",
            fillcolor: conAlfa(colorSerie, ALFA_AREA),
            line: { color: colorSerie, width: 2.2, shape: lineShape },
            hoverinfo: "skip",
          },
        );
      }

      // 2. Referencias dibujadas sin rótulo flotante (banda verde meta-oficial o línea punteada gris)
      if (ind.referencia === "meta-oficial") {
        shapes.push(
          {
            type: "rect",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: RANGO_META_BANREP.min,
            y1: RANGO_META_BANREP.max,
            fillcolor: COLORS.metaBanda,
            line: { width: 0 },
            layer: "below",
          },
          {
            type: "line",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: RANGO_META_BANREP.min,
            y1: RANGO_META_BANREP.min,
            line: { color: META_BANREP.color, width: 1.2, dash: "dot" },
            layer: "below",
          },
          {
            type: "line",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: RANGO_META_BANREP.max,
            y1: RANGO_META_BANREP.max,
            line: { color: META_BANREP.color, width: 1.2, dash: "dot" },
            layer: "below",
          },
        );
      } else if (ref.valorReferencia !== null) {
        const etiquetaRef = ind.referencia === "promedio-20a" ? "Prom 20 años" : "Hace un año";
        const refs = lineasReferencia([], {
          extra: [{ etiqueta: etiquetaRef, valor: ref.valorReferencia, estilo: "punteada" }],
          formato: (v) => formatIndicador(v, unidad),
          rangoY,
        });
        shapes.push(...refs.shapes);
      }

      // 3. Marcador hueco en el periodo de comparación (hace-un-ano o interanual, no en barras)
      if (
        ind.forma !== "barras" &&
        (ind.referencia === "hace-un-ano" || ind.comparacion === "interanual") &&
        periodoVigente
      ) {
        const periodoComp = `${parseInt(yearOf(periodoVigente), 10) - 1}${periodoVigente.slice(4)}`;
        const puntoComp = puntos.find((p) => p.periodo === periodoComp);
        if (puntoComp) {
          traces.push({
            type: "scatter",
            mode: "markers",
            x: [periodoToISODate(puntoComp.periodo)],
            y: [puntoComp.valor],
            marker: {
              color: theme.superficie,
              size: 8,
              line: { color: colorSerie, width: 1.6 },
            },
            hoverinfo: "skip",
          });
        }
      }

      // 4. Marcador del dato vigente (halo + punto sólido, no en barras)
      if (ind.forma !== "barras" && ultimoPunto) {
        traces.push({
          type: "scatter",
          mode: "markers",
          x: [x[ultimoIdx], x[ultimoIdx]],
          y: [y[ultimoIdx], y[ultimoIdx]],
          marker: {
            color: [conAlfa(colorSerie, 0.25), colorSerie],
            size: [16, 8],
            line: { width: 0 },
          },
          hoverinfo: "skip",
        });
      }

      const serieMap = new Map<string, number>(puntos.map((p) => [p.periodo, p.valor]));
      const geometria: GeometriaGrafico = {
        margen: { ...MARGEN_KPI },
        rangoX,
        rangoY,
        periodos: eje,
        serie: serieMap,
        periodoVigente,
      };
      const esPctPib = unidad === "% PIB";

      return {
        traces,
        layout: baseLayout({
          margin: { ...MARGEN_KPI },
          showlegend: false,
          height: ALTURA_KPI,
          xaxis: {
            type: "date",
            range: rangoX,
            fixedrange: true,
            showgrid: false,
            showline: true,
            linecolor: COLORS.border,
            tickvals,
            ticktext,
            tickfont: { ...FONT, size: 10, color: COLORS.textMuted },
            automargin: false,
          },
          yaxis: {
            visible: false,
            fixedrange: true,
            range: rangoY,
            automargin: false,
          },
          shapes,
        }),
        config: { staticPlot: true, displayModeBar: false, responsive: true },
        onMount(target) {
          registrarLectura({
            id: kpiChartId(ind.id),
            destino: target,
            fila: ind.periodicidad,
            geometria,
            formatear: {
              valor: (v) => formatIndicador(v, esPctPib ? "%" : unidad),
              valorCompleto: (v) => formatIndicador(v, unidad),
              periodo: (p) => `${esPctPib ? "del PIB · " : ""}${formatPeriodoIndicador(p, ind.periodicidad)}`,
              periodoCorto: (p) => formatPeriodoIndicador(p, ind.periodicidad),
            },
          });
        },
      };
    },
  };
};

export const indicadoresClave: ChartDef[] = INDICADORES_CLAVE.map(makeIndicadorClaveChart);
