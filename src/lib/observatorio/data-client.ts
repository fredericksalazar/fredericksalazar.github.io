import type {
  ObservatorioData,
  EmpleoData,
  ComercioData,
  PIBData,
} from "./types";
import type { Presidente } from "./presidentes";

const cache = new Map<string, Promise<unknown>>();

function load<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`/data/${name}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`Fetch ${name}.json failed: ${r.status}`);
        return r.json();
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
  load<{ fuente: string; nota: string; presidentes: Presidente[] }>("presidentes").then((d) => d.presidentes);
