import type {
  ObservatorioData,
  EmpleoData,
  ComercioData,
  PIBData,
  ExternoData,
  DemografiaData,
  SalarioMinimoData,
  PresEleccionData,
  PresCandidatosData,
} from "./types";
import type { Presidente } from "./presidentes";

const cache = new Map<string, Promise<unknown>>();

/**
 * Caché compartida entre consumidores. Intencionalmente no pasamos `AbortSignal`
 * al `fetch`: si un consumidor cancela, la promesa cacheada moriría y rompería
 * al resto. La cancelación se hace a nivel de consumidor (chequeando
 * `signal.aborted` después del await).
 */
function load<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`/data/${name}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`Fetch ${name}.json failed: ${r.status}`);
        return r.json();
      }).catch((err) => {
        cache.delete(name);
        throw err;
      }),
    );
  }
  return cache.get(name) as Promise<T>;
}

export const loadInflacion = () => load<ObservatorioData>("data_inflacion");
export const loadPIB = () => load<PIBData>("data_pib");
export const loadComercio = () => load<ComercioData>("data_comercio");
export const loadEmpleo = () => load<EmpleoData>("data_empleo");
export const loadExterno = () => load<ExternoData>("data_externo");
export const loadDemografia = () => load<DemografiaData>("data_demografia");
export const loadSalarioMinimo = () => load<SalarioMinimoData>("data_salario_minimo");
export const loadPresidentes = () =>
  load<{ fuente: string; nota: string; presidentes: Presidente[] }>("presidentes")
    .then((d) => d.presidentes);

export const loadInflacionAsc = () =>
  loadInflacion().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadPIBAsc = () =>
  loadPIB().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadComercioAsc = () =>
  loadComercio().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadEmpleoAsc = () =>
  loadEmpleo().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadExternoAsc = () =>
  loadExterno().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadDemografiaAsc = () =>
  loadDemografia().then((d) => ({ ...d, serie: [...d.serie].reverse() }));
export const loadSalarioMinimoAsc = () =>
  loadSalarioMinimo().then((d) => ({ ...d, serie: [...d.serie].reverse() }));

export const loadPres2026_1v = () => load<PresEleccionData>("data_pres_2026_1v");
export const loadPres2022_1v = () => load<PresEleccionData>("data_pres_2022_1v");
export const loadPres2022_2v = () => load<PresEleccionData>("data_pres_2022_2v");
export const loadPresCandidatos = () => load<PresCandidatosData>("data_pres_candidatos");

export type DatasetName = "inflacion" | "pib" | "comercio" | "empleo" | "externo" | "demografia"
  | "salario-minimo"
  | "pres-2026-1v" | "pres-2022-1v" | "pres-2022-2v" | "pres-candidatos";

export interface LoadedDatasets {
  inflacion?: ObservatorioData;
  pib?: PIBData;
  comercio?: ComercioData;
  empleo?: EmpleoData;
  externo?: ExternoData;
  demografia?: DemografiaData;
  "salario-minimo"?: SalarioMinimoData;
  "pres-2026-1v"?: PresEleccionData;
  "pres-2022-1v"?: PresEleccionData;
  "pres-2022-2v"?: PresEleccionData;
  "pres-candidatos"?: PresCandidatosData;
}

const ASC_LOADERS = {
  inflacion: loadInflacionAsc,
  pib: loadPIBAsc,
  comercio: loadComercioAsc,
  empleo: loadEmpleoAsc,
  externo: loadExternoAsc,
  demografia: loadDemografiaAsc,
  "salario-minimo": loadSalarioMinimoAsc,
  "pres-2026-1v": loadPres2026_1v,
  "pres-2022-1v": loadPres2022_1v,
  "pres-2022-2v": loadPres2022_2v,
  "pres-candidatos": loadPresCandidatos,
} as const;

export async function loadDatasets(
  names: readonly DatasetName[],
): Promise<LoadedDatasets> {
  const entries = await Promise.all(
    names.map(async (n) => [n, await ASC_LOADERS[n]()] as const),
  );
  return Object.fromEntries(entries) as LoadedDatasets;
}
