import { META_BANREP, RANGO_META_BANREP } from "./charts";
import type {
  SerieFila,
  PIBSerieFila,
  EmpleoSerieFila,
  ComercioSerieFila,
  ExternoData,
  ObservatorioData,
} from "./types";

export const yearOf = (periodo: string): string => periodo.slice(0, 4);

export function recordByYear<T extends { periodo: string }>(
  serie: T[],
  pick: (row: T) => number | null,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of serie) {
    const v = pick(r);
    if (typeof v === "number") out[yearOf(r.periodo)] = v;
  }
  return out;
}

export const empleoAnualDiciembre = (serie: EmpleoSerieFila[]): EmpleoSerieFila[] =>
  serie.filter((r) => r.periodo.endsWith("-12"));

export const mesOf = (periodo: string): number => parseInt(periodo.slice(5, 7), 10);

export const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/**
 * Media histórica de la inflación mensual para cada mes calendario (1–12).
 * La serie tiene una estacionalidad fuerte —enero y febrero concentran la
 * indexación anual de tarifas—, así que sin esta referencia una variación
 * mensual no se puede leer como alta o baja.
 */
export function perfilEstacionalInflacion(serie: SerieFila[]): Record<number, number> {
  const buckets: Record<number, number[]> = {};
  for (const r of serie) {
    if (typeof r.inflacion_mensual !== "number") continue;
    (buckets[mesOf(r.periodo)] ??= []).push(r.inflacion_mensual);
  }
  const out: Record<number, number> = {};
  for (const [mes, vals] of Object.entries(buckets)) {
    out[Number(mes)] = vals.reduce((s, v) => s + v, 0) / vals.length;
  }
  return out;
}

export interface InflacionAnualRow {
  periodo: string;
  inflacion: number;
  tasa: number | null;
}

export const inflacionAnualPromedio = (serie: SerieFila[]): InflacionAnualRow[] => {
  const buckets: Record<string, { infl: number[]; tasa: number[] }> = {};
  for (const r of serie) {
    const year = yearOf(r.periodo);
    if (!buckets[year]) buckets[year] = { infl: [], tasa: [] };
    if (typeof r.inflacion_anual === "number") buckets[year].infl.push(r.inflacion_anual);
    if (typeof r.tasa_interes === "number") buckets[year].tasa.push(r.tasa_interes);
  }
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  return Object.keys(buckets)
    .sort()
    .map((year) => ({
      periodo: `${year}-12`,
      inflacion: avg(buckets[year].infl) as number,
      tasa: avg(buckets[year].tasa),
    }))
    .filter((r) => r.inflacion !== null);
};

export interface OkunResult {
  puntos: { year: string; crecimiento: number; deltaDesempleo: number }[];
  slope: number;
  intercept: number;
  umbral: number;
  n: number;
}

export function okunRegression(
  seriePIB: PIBSerieFila[],
  empleoDiciembre: EmpleoSerieFila[],
): OkunResult {
  const desempleoPorAnio = recordByYear(empleoDiciembre, (r) => r.tasa_desempleo);
  const pibPorAnio = recordByYear(seriePIB, (r) => r.crecimiento_pib);

  const years = Object.keys(desempleoPorAnio).sort();
  const puntos: OkunResult["puntos"] = [];
  for (let i = 1; i < years.length; i++) {
    const y = years[i];
    const yPrev = years[i - 1];
    if (parseInt(y, 10) - parseInt(yPrev, 10) !== 1) continue;
    if (!(y in pibPorAnio)) continue;
    puntos.push({
      year: y,
      crecimiento: pibPorAnio[y],
      deltaDesempleo: desempleoPorAnio[y] - desempleoPorAnio[yPrev],
    });
  }

  const n = puntos.length;
  const xs = puntos.map((p) => p.crecimiento);
  const ys = puntos.map((p) => p.deltaDesempleo);
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  const umbral = -intercept / slope;
  return { puntos, slope, intercept, umbral, n };
}

export function joinByPeriodo<A extends { periodo: string }, B extends { periodo: string }>(
  a: A[],
  b: B[],
  pickA: (r: A) => number | null,
  pickB: (r: B) => number | null,
): { periodo: string; a: number | null; b: number | null }[] {
  const mapB = new Map<string, number | null>();
  for (const r of b) mapB.set(r.periodo, pickB(r));
  return a.map((r) => ({
    periodo: r.periodo,
    a: pickA(r),
    b: mapB.has(r.periodo) ? (mapB.get(r.periodo) ?? null) : null,
  }));
}

export function frenoAceleradorMinMax(serie: SerieFila[]): {
  x: string[];
  inflacion: number[];
  tasa: number[];
  tasaRestrictiva: number[];
  tasaExpansiva: number[];
} {
  const data = serie.filter(
    (r) => r.inflacion_anual !== null && r.tasa_interes !== null,
  );
  return {
    x: data.map((r) => `${r.periodo}-01`),
    inflacion: data.map((r) => r.inflacion_anual as number),
    tasa: data.map((r) => r.tasa_interes as number),
    tasaRestrictiva: data.map((r) =>
      Math.max(r.tasa_interes as number, r.inflacion_anual as number),
    ),
    tasaExpansiva: data.map((r) =>
      Math.min(r.tasa_interes as number, r.inflacion_anual as number),
    ),
  };
}

export function comercioPorPibJoin(
  seriePIB: PIBSerieFila[],
  serieComercio: ComercioSerieFila[],
): { x: string[]; pib: (number | null)[]; exp: (number | null)[] } {
  const mapExp = new Map<string, number | null>();
  for (const r of serieComercio) {
    mapExp.set(r.periodo, typeof r.exportaciones === "number" ? r.exportaciones : null);
  }
  const data = seriePIB.filter((r) => typeof r.pib_total === "number");
  return {
    x: data.map((r) => `${r.periodo}-01`),
    pib: data.map((r) => r.pib_total as number),
    exp: data.map((r) => mapExp.get(r.periodo) ?? null),
  };
}

export function trmInflacionJoin(
  externo: ExternoData,
  inflacion: ObservatorioData,
): { x: string[]; trm: (number | null)[]; inflacion: (number | null)[] } {
  const mapInfl = new Map<string, number | null>();
  for (const r of inflacion.serie) {
    mapInfl.set(r.periodo, typeof r.inflacion_anual === "number" ? r.inflacion_anual : null);
  }
  const data = externo.serie.filter((r) => r.trm !== null);
  return {
    x: data.map((r) => `${r.periodo}-01`),
    trm: data.map((r) => r.trm),
    inflacion: data.map((r) => mapInfl.get(r.periodo) ?? null),
  };
}

// ───────────────────── Referencias objetivas (Home) ─────────────────────
// Describen la posición de un dato frente a una referencia, sin juicios de
// valor (spec 005, Q2): nunca "mejor"/"peor", solo "por encima"/"por debajo".

type FilaConPeriodo = { periodo: string };

/** Valores no nulos de `campo`, del más reciente al más antiguo. */
export function valoresNoNulos(
  serie: readonly FilaConPeriodo[],
  campo: string,
): { periodo: string; valor: number }[] {
  return serie
    .map((r) => ({ periodo: r.periodo, valor: (r as Record<string, unknown>)[campo] }))
    .filter((r): r is { periodo: string; valor: number } => typeof r.valor === "number")
    .sort((a, b) => b.periodo.localeCompare(a.periodo));
}

/** Promedio de los valores no nulos de los últimos `anios` años, contados desde el dato más reciente. */
export function promedioVentana(serie: readonly FilaConPeriodo[], campo: string, anios = 20): number | null {
  const valores = valoresNoNulos(serie, campo);
  if (valores.length === 0) return null;
  const ultimo = valores[0].periodo;
  const desde = `${parseInt(yearOf(ultimo), 10) - anios}${ultimo.slice(4)}`;
  const ventana = valores.filter((v) => v.periodo > desde);
  return ventana.reduce((s, v) => s + v.valor, 0) / ventana.length;
}

/** Valor del mismo periodo un año antes (mismo mes en series mensuales; año anterior en anuales). */
export function valorHaceUnAno(serie: readonly FilaConPeriodo[], campo: string, periodo: string): number | null {
  const objetivo = `${parseInt(yearOf(periodo), 10) - 1}${periodo.slice(4)}`;
  return valoresNoNulos(serie, campo).find((v) => v.periodo === objetivo)?.valor ?? null;
}

export type TipoReferencia = "meta-oficial" | "promedio-20a" | "hace-un-ano";

export interface ReferenciaCalculada {
  tipo: TipoReferencia;
  valorReferencia: number | null;
  posicion: "arriba" | "en-linea" | "abajo" | "dentro" | null;
  frase: string;
}

/** Diferencia relativa por debajo de la cual el dato está "en línea con" su promedio. */
const UMBRAL_EN_LINEA = 0.05;

const nfPct1 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Posición de `valor` frente a su referencia objetiva (research R4).
 * `fmt` formatea un valor en la unidad del indicador para la frase.
 */
export function referenciaIndicador(
  tipo: TipoReferencia,
  valor: number,
  periodo: string,
  serie: readonly FilaConPeriodo[],
  campo: string,
  fmt: (v: number) => string,
): ReferenciaCalculada {
  if (tipo === "meta-oficial") {
    const { min, max } = RANGO_META_BANREP;
    const rango = `rango meta del BanRep (${min}–${max} %)`;
    if (valor > max) return { tipo, valorReferencia: META_BANREP.valor, posicion: "arriba", frase: `Por encima del ${rango}` };
    if (valor < min) return { tipo, valorReferencia: META_BANREP.valor, posicion: "abajo", frase: `Por debajo del ${rango}` };
    return { tipo, valorReferencia: META_BANREP.valor, posicion: "dentro", frase: `Dentro del ${rango}` };
  }

  if (tipo === "promedio-20a") {
    const prom = promedioVentana(serie, campo, 20);
    if (prom === null) return { tipo, valorReferencia: null, posicion: null, frase: "Sin promedio de referencia" };
    const ref = `su promedio de 20 años (${fmt(prom)})`;
    const enLinea = Math.abs(valor - prom) < UMBRAL_EN_LINEA * Math.abs(prom);
    if (enLinea) return { tipo, valorReferencia: prom, posicion: "en-linea", frase: `En línea con ${ref}` };
    return valor > prom
      ? { tipo, valorReferencia: prom, posicion: "arriba", frase: `Por encima de ${ref}` }
      : { tipo, valorReferencia: prom, posicion: "abajo", frase: `Por debajo de ${ref}` };
  }

  const previo = valorHaceUnAno(serie, campo, periodo);
  if (previo === null || previo === 0) {
    return { tipo, valorReferencia: null, posicion: null, frase: "Sin dato de hace un año" };
  }
  const pct = (valor / previo - 1) * 100;
  const ref = `hace un año (${fmt(previo)})`;
  if (Math.abs(pct) < 0.5) return { tipo, valorReferencia: previo, posicion: "en-linea", frase: `Similar a ${ref}` };
  return pct > 0
    ? { tipo, valorReferencia: previo, posicion: "arriba", frase: `${nfPct1.format(pct)} % más alto que ${ref}` }
    : { tipo, valorReferencia: previo, posicion: "abajo", frase: `${nfPct1.format(Math.abs(pct))} % más bajo que ${ref}` };
}
