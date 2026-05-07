import type { SemanticIndicador, Variacion } from "./types";

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MESES_ES_CORTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const formatPct = (v: number | null, dec = 2): string =>
  v === null ? "—" : `${v.toFixed(dec)}%`;

export const formatPp = (v: number | null, dec = 2): string => {
  if (v === null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(dec)} pp`;
};

export const formatPeriodo = (p: string): string => {
  const [year, month] = p.split("-");
  const m = parseInt(month, 10) - 1;
  if (Number.isNaN(m) || m < 0 || m > 11) return p;
  return `${MESES_ES[m]} ${year}`;
};

export const formatPeriodoCorto = (p: string): string => {
  const [year, month] = p.split("-");
  const m = parseInt(month, 10) - 1;
  if (Number.isNaN(m) || m < 0 || m > 11) return p;
  return `${MESES_ES_CORTO[m]} ${year}`;
};

export const formatFechaActualizacion = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Bogota",
    });
  } catch {
    return iso;
  }
};

export const variacionIcon = (v: Variacion): string => {
  if (v === "subio") return "↑";
  if (v === "bajo") return "↓";
  if (v === "igual") return "→";
  return "";
};

export const variacionClass = (
  v: Variacion,
  semantic: SemanticIndicador,
): string => {
  if (v === null) return "var-none";
  if (v === "igual") return "var-igual";
  const isUp = v === "subio";
  if (semantic === "inflacion") return isUp ? "var-bad" : "var-good";
  if (semantic === "spread") return isUp ? "var-bad" : "var-good";
  return "var-neutral";
};

export const spreadEstadoLabel = (spread: number | null): string => {
  if (spread === null) return "—";
  if (spread >= 3) return "Freno fuerte";
  if (spread > 0.5) return "Freno moderado";
  if (spread >= -0.5) return "Neutral";
  if (spread > -3) return "Acelerador moderado";
  return "Acelerador fuerte";
};
