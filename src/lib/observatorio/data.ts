import raw from "../../data/data_inflacion.json";
import rawEmpleo from "../../data/data_empleo.json";
import rawComercio from "../../data/data_comercio.json";
import rawPIB from "../../data/data_pib.json";
import type {
  ObservatorioData,
  SerieFila,
  EmpleoData,
  EmpleoSerieFila,
  ComercioData,
  ComercioSerieFila,
  PIBData,
  PIBSerieFila,
} from "./types";

const obs = raw as unknown as ObservatorioData;
const emp = rawEmpleo as unknown as EmpleoData;
const com = rawComercio as unknown as ComercioData;
const pib = rawPIB as unknown as PIBData;

export const getObservatorio = (): ObservatorioData => obs;
export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();
export const getEmpleo = (): EmpleoData => emp;
export const getEmpleoSerieAscending = (): EmpleoSerieFila[] => [...emp.serie].reverse();
export const getComercio = (): ComercioData => com;
export const getComercioSerieAscending = (): ComercioSerieFila[] => [...com.serie].reverse();
export const getPIB = (): PIBData => pib;
export const getPIBSerieAscending = (): PIBSerieFila[] => [...pib.serie].reverse();

export const getEmpleoAnualDiciembre = (): EmpleoSerieFila[] =>
  [...emp.serie].filter((r) => r.periodo.endsWith("-12")).reverse();

export const getInflacionAnualPromedio = (): { periodo: string; inflacion: number; tasa: number | null }[] => {
  const buckets: Record<string, { infl: number[]; tasa: number[] }> = {};
  for (const r of obs.serie) {
    const year = r.periodo.slice(0, 4);
    if (!buckets[year]) buckets[year] = { infl: [], tasa: [] };
    if (typeof r.inflacion_anual === "number") buckets[year].infl.push(r.inflacion_anual);
    if (typeof r.tasa_interes === "number") buckets[year].tasa.push(r.tasa_interes);
  }
  const avg = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  return Object.keys(buckets).sort().map((year) => ({
    periodo: `${year}-12`,
    inflacion: avg(buckets[year].infl) as number,
    tasa: avg(buckets[year].tasa),
  })).filter((r) => r.inflacion !== null);
};
