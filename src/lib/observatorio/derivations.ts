import type {
  SerieFila,
  PIBSerieFila,
  EmpleoSerieFila,
  ComercioSerieFila,
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
