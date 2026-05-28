import { loadPresidentes } from "./data-client";

export interface Presidente {
  id: string;
  nombre: string;
  partido: string;
  inicio: string;
  fin: string;
  color: string;
}

let cached: Promise<Presidente[]> | null = null;

export function getPresidentesClient(): Promise<Presidente[]> {
  if (!cached) cached = loadPresidentes() as Promise<Presidente[]>;
  return cached;
}

export const presidenteForYear = (
  year: number,
  presidentes: Presidente[],
): Presidente | undefined => {
  const probe = new Date(`${year}-07-01`).getTime();
  return presidentes.find((p) => {
    const ini = new Date(p.inicio).getTime();
    const fin = new Date(p.fin).getTime();
    return probe >= ini && probe < fin;
  });
};

export const colorsForYears = (
  years: Array<string | number>,
  presidentes: Presidente[],
  fallback = "#2563eb",
): string[] =>
  years.map((y) => {
    const yr = typeof y === "string" ? parseInt(y, 10) : y;
    return presidenteForYear(yr, presidentes)?.color ?? fallback;
  });

export const presidentesEnLeyenda = (
  years: string[],
  presidentes: Presidente[],
): Presidente[] => {
  const ids = new Set(
    years
      .map((y) => presidenteForYear(parseInt(y, 10), presidentes)?.id)
      .filter((id): id is string => Boolean(id)),
  );
  return Array.from(ids)
    .map((id) => presidentes.find((p) => p.id === id))
    .filter((p): p is Presidente => Boolean(p));
};
