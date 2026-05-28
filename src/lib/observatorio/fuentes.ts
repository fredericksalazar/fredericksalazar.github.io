import type { Fuente } from "./types";

/**
 * Fallback temporal mientras el pipeline no publique
 * `metadata.fuentes.calculo_propio` en los JSON.
 * Cuando esté disponible en `data_inflacion.json`, eliminar este archivo
 * y consumir directamente desde `data.metadata.fuentes.calculo_propio`.
 */
export const FUENTE_CALCULO_PROPIO: Fuente = {
  nombre: "Cálculo propio · DANE (IPC) y Banco de la República (TPM)",
  url: "https://www.banrep.gov.co/es/estadisticas/tasas-de-interes-de-politica-monetaria",
  indicador: "Tasa real ex-post",
};

export const FUENTE_HISTORICA_BM: Fuente = {
  nombre: "Banco Mundial — World Development Indicators",
  url: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=CO",
  indicador: "Inflación anual de Colombia desde 1960",
};
