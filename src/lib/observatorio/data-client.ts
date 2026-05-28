import type {
  ObservatorioData,
  EmpleoData,
  ComercioData,
  PIBData,
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

export type DatasetName = "inflacion" | "pib" | "comercio" | "empleo";

export interface LoadedDatasets {
  inflacion?: ObservatorioData;
  pib?: PIBData;
  comercio?: ComercioData;
  empleo?: EmpleoData;
}

const ASC_LOADERS = {
  inflacion: loadInflacionAsc,
  pib: loadPIBAsc,
  comercio: loadComercioAsc,
  empleo: loadEmpleoAsc,
} as const;

export async function loadDatasets(
  names: readonly DatasetName[],
): Promise<LoadedDatasets> {
  const entries = await Promise.all(
    names.map(async (n) => [n, await ASC_LOADERS[n]()] as const),
  );
  return Object.fromEntries(entries) as LoadedDatasets;
}
