import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const raw = JSON.parse(
  readFileSync(resolve(process.cwd(), "public", "data", "presidentes.json"), "utf-8"),
);

export interface Presidente {
  id: string;
  nombre: string;
  partido: string;
  periodo?: string;
  inicio: string;
  fin: string;
  color: string;
}

interface PresidentesFile {
  fuente: string;
  nota: string;
  presidentes: Presidente[];
}

const data = raw as PresidentesFile;

export const getPresidentes = (): Presidente[] => data.presidentes;

/**
 * Devuelve el presidente que gobernó la mayor parte del año dado.
 * En Colombia las posesiones son el 7 de agosto (mes 8), por lo que:
 * - Si el periodo del presidente cubre julio (mes 7) del año, gobernó la primera mitad → ~7 meses si finaliza en agosto.
 * - Más simple: el presidente que tiene en su rango la fecha YYYY-07-01 (mediados del año).
 */
export const presidenteForYear = (year: number, presidentes: Presidente[] = data.presidentes): Presidente | undefined => {
  const probe = new Date(`${year}-07-01`);
  return presidentes.find((p) => {
    const ini = new Date(p.inicio);
    const fin = new Date(p.fin);
    return probe >= ini && probe < fin;
  });
};

/**
 * Devuelve color para un año, con fallback al azul de marca si no hay presidente.
 */
export const colorForYear = (year: number, fallback = "#2563eb"): string => {
  const p = presidenteForYear(year);
  return p?.color ?? fallback;
};

/**
 * Útil para Plotly: dado un array de años, devuelve un array de colores paralelo.
 */
export const colorsForYears = (years: Array<string | number>, fallback = "#2563eb"): string[] => {
  return years.map((y) => colorForYear(typeof y === "string" ? parseInt(y, 10) : y, fallback));
};
