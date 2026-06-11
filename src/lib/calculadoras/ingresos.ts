/**
 * ingresos.ts — Cálculos puros para la calculadora "¿Cuánto ganas frente al país?"
 * y las páginas de salarios por cargo.
 *
 * Datos: data_ingresos.json (percentiles GEIH + clases sociales DANE) y
 * data_salarios_cargos.json, cargados vía data-client (REGLA 8).
 */
import type { IngresosData, SalariosCargosData, CargoSalario, ClasesSociales } from "../observatorio/types";

export type ClaseSocial = "pobreza" | "vulnerable" | "media" | "alta";

export const CLASE_LABELS: Record<ClaseSocial, string> = {
  pobreza: "Pobreza monetaria",
  vulnerable: "Vulnerable",
  media: "Clase media",
  alta: "Clase alta",
};

/**
 * Percentil (1–99) del ingreso dado, interpolando linealmente entre los
 * percentiles publicados. Devuelve 99 si supera P99 y 1 si está bajo P1.
 */
export function percentilDe(ingreso: number, percentiles: Record<string, number>): number {
  if (ingreso <= percentiles["1"]) return 1;
  if (ingreso >= percentiles["99"]) return 99;
  for (let p = 1; p < 99; p++) {
    const lo = percentiles[String(p)];
    const hi = percentiles[String(p + 1)];
    if (ingreso >= lo && ingreso <= hi) {
      const frac = hi === lo ? 0 : (ingreso - lo) / (hi - lo);
      return Math.min(99, p + frac);
    }
  }
  return 99;
}

export interface ResultadoClase {
  clase: ClaseSocial;
  ingresoPerCapita: number;
  /** Clase siguiente y cuánto ingreso per cápita falta para alcanzarla (null si ya es alta). */
  siguiente: { clase: ClaseSocial; faltaPerCapita: number } | null;
}

/** Clasificación DANE del hogar según ingreso per cápita mensual. */
export function claseSocialHogar(
  ingresoTotalHogar: number,
  personas: number,
  clases: ClasesSociales,
): ResultadoClase {
  const pc = ingresoTotalHogar / Math.max(1, personas);
  const { pobreza_hasta, vulnerable_hasta, media_hasta } = clases.umbrales;
  if (pc < pobreza_hasta) {
    return { clase: "pobreza", ingresoPerCapita: pc, siguiente: { clase: "vulnerable", faltaPerCapita: pobreza_hasta - pc } };
  }
  if (pc < vulnerable_hasta) {
    return { clase: "vulnerable", ingresoPerCapita: pc, siguiente: { clase: "media", faltaPerCapita: vulnerable_hasta - pc } };
  }
  if (pc < media_hasta) {
    return { clase: "media", ingresoPerCapita: pc, siguiente: { clase: "alta", faltaPerCapita: media_hasta - pc } };
  }
  return { clase: "alta", ingresoPerCapita: pc, siguiente: null };
}

export const cargoPorSlug = (data: SalariosCargosData, slug: string): CargoSalario | undefined =>
  data.cargos.find((c) => c.slug === slug);

/**
 * Posición aproximada del ingreso dentro de un cargo, interpolando entre
 * p25 / mediana / p75 / p90 (los cuartiles publicados).
 */
export function percentilEnCargo(ingreso: number, cargo: CargoSalario): number {
  const puntos: Array<[number, number]> = [
    [25, cargo.p25],
    [50, cargo.mediana],
    [75, cargo.p75],
    [90, cargo.p90],
  ];
  if (ingreso <= puntos[0][1]) return 25;
  if (ingreso >= puntos[puntos.length - 1][1]) return 90;
  for (let i = 0; i < puntos.length - 1; i++) {
    const [pLo, vLo] = puntos[i];
    const [pHi, vHi] = puntos[i + 1];
    if (ingreso >= vLo && ingreso <= vHi) {
      const frac = vHi === vLo ? 0 : (ingreso - vLo) / (vHi - vLo);
      return pLo + frac * (pHi - pLo);
    }
  }
  return 90;
}

/** Serie {x: percentil, y: ingreso} para graficar la curva de distribución. */
export function curvaPercentiles(data: IngresosData): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (let p = 1; p <= 99; p++) {
    x.push(p);
    y.push(data.percentiles[String(p)]);
  }
  return { x, y };
}
