/**
 * data.ts — Lectura **build-time** de los datasets del Observatorio.
 *
 * Responsabilidad: alimentar el HTML inicial con datos críticos para SEO
 * (indicadores actuales, metadata, JSON-LD) y el contenido above-the-fold.
 *
 * Las **series temporales** consumidas por gráficos viven en `data-client.ts`
 * y se descargan vía `fetch` en cliente, para que cambios en `public/data/*.json`
 * no requieran recompilar.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function readPublicJSON<T>(name: string): T {
  const path = resolve(process.cwd(), "public", "data", `${name}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

const obs = readPublicJSON<ObservatorioData>("data_inflacion");
const emp = readPublicJSON<EmpleoData>("data_empleo");
const com = readPublicJSON<ComercioData>("data_comercio");
const pib = readPublicJSON<PIBData>("data_pib");
const ext = readPublicJSON<ExternoData>("data_externo");
const dem = readPublicJSON<DemografiaData>("data_demografia");
const smlv = readPublicJSON<SalarioMinimoData>("data_salario_minimo");

export const getObservatorio = (): ObservatorioData => obs;
export const getEmpleo = (): EmpleoData => emp;
export const getComercio = (): ComercioData => com;
export const getPIB = (): PIBData => pib;
export const getExterno = (): ExternoData => ext;
export const getDemografia = (): DemografiaData => dem;
export const getSalarioMinimo = (): SalarioMinimoData => smlv;

const pres2026_1v = readPublicJSON<PresEleccionData>("data_pres_2026_1v");
const pres2022_1v = readPublicJSON<PresEleccionData>("data_pres_2022_1v");
const pres2022_2v = readPublicJSON<PresEleccionData>("data_pres_2022_2v");
const presCandidatos = readPublicJSON<PresCandidatosData>("data_pres_candidatos");

export const getPres2026_1v = (): PresEleccionData => pres2026_1v;
export const getPres2022_1v = (): PresEleccionData => pres2022_1v;
export const getPres2022_2v = (): PresEleccionData => pres2022_2v;
export const getPresCandidatos = (): PresCandidatosData => presCandidatos;
