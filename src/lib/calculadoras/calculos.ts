/**
 * calculos.ts — Funciones puras para las calculadoras ciudadanas.
 *
 * Las calculadoras consumen los mismos JSON del Observatorio vía
 * `data-client.ts` (REGLA 8: nunca fetch directo). Aquí solo viven cálculos
 * puros sobre esos datos: índice de precios acumulado, equivalencias de
 * poder adquisitivo y comparaciones contra el salario mínimo.
 *
 * Metodología del índice de precios:
 *  - 1960–último año cerrado: inflación anual del histórico (Banco Mundial /
 *    DANE), compuesta año a año. `nivel(y)` representa el nivel de precios
 *    al cierre del año `y`.
 *  - Años posteriores al histórico: se usa la inflación anual del dato de
 *    diciembre de la serie mensual; para el año en curso se compone la
 *    inflación mensual de los meses ya publicados.
 */
import type { ObservatorioData, SalarioMinimoData } from "../observatorio/types";

export interface IndicePrecios {
  /** Nivel de precios al cierre de cada año (base: cierre del primer año disponible = 1). */
  nivel: Map<number, number>;
  /** Primer año con inflación disponible. */
  anioMin: number;
  /** Último año con nivel calculado (puede ser parcial si es el año en curso). */
  anioMax: number;
  /** Último periodo mensual publicado ("YYYY-MM"). */
  ultimoPeriodo: string;
}

/** Construye el índice de precios acumulado a partir del dataset de inflación. */
export function construirIndicePrecios(inflacion: ObservatorioData): IndicePrecios {
  const nivel = new Map<number, number>();
  const anios = Object.keys(inflacion.historico)
    .map((y) => parseInt(y, 10))
    .sort((a, b) => a - b);

  let acumulado = 1;
  for (const anio of anios) {
    const tasa = inflacion.historico[String(anio)];
    acumulado *= 1 + tasa / 100;
    nivel.set(anio, acumulado);
  }

  // Extender con la serie mensual más allá del histórico anual.
  const serieAsc = [...inflacion.serie].sort((a, b) => a.periodo.localeCompare(b.periodo));
  const ultimoPeriodo = serieAsc[serieAsc.length - 1]?.periodo ?? `${anios[anios.length - 1]}-12`;
  const anioSerieMax = parseInt(ultimoPeriodo.slice(0, 4), 10);

  for (let anio = anios[anios.length - 1] + 1; anio <= anioSerieMax; anio++) {
    const diciembre = serieAsc.find((r) => r.periodo === `${anio}-12`);
    if (diciembre?.inflacion_anual != null) {
      acumulado *= 1 + diciembre.inflacion_anual / 100;
    } else {
      // Año en curso: componer la inflación mensual publicada.
      for (const fila of serieAsc) {
        if (fila.periodo.startsWith(`${anio}-`) && fila.inflacion_mensual != null) {
          acumulado *= 1 + fila.inflacion_mensual / 100;
        }
      }
    }
    nivel.set(anio, acumulado);
  }

  return { nivel, anioMin: anios[0], anioMax: anioSerieMax, ultimoPeriodo };
}

/**
 * Factor para llevar pesos del cierre del año `desde` a pesos de hoy.
 * Ej.: factor 1.8 significa que $100 de `desde` equivalen a $180 de hoy.
 */
export function factorAHoy(indice: IndicePrecios, desde: number): number {
  const base = indice.nivel.get(desde);
  const hoy = indice.nivel.get(indice.anioMax);
  if (base === undefined || hoy === undefined) {
    throw new Error(`Año fuera de cobertura del índice: ${desde}`);
  }
  return hoy / base;
}

/** Equivalente en pesos de hoy de un monto del año `desde`. */
export const equivalenteHoy = (indice: IndicePrecios, monto: number, desde: number): number =>
  monto * factorAHoy(indice, desde);

/**
 * Pérdida de poder adquisitivo (en %) de un monto nominal que NO se ajustó
 * desde el año `desde`: cuánto poder de compra perdió ese mismo billete.
 */
export const perdidaPoderAdquisitivo = (indice: IndicePrecios, desde: number): number =>
  (1 - 1 / factorAHoy(indice, desde)) * 100;

/**
 * Trayectoria año a año del monto ajustado por inflación: cuánto habría que
 * ganar en cada año para conservar el poder de compra del monto original.
 */
export function trayectoriaAjustada(
  indice: IndicePrecios,
  monto: number,
  desde: number,
): { anios: number[]; valores: number[] } {
  const base = indice.nivel.get(desde);
  if (base === undefined) throw new Error(`Año fuera de cobertura del índice: ${desde}`);
  const anios: number[] = [];
  const valores: number[] = [];
  for (let anio = desde; anio <= indice.anioMax; anio++) {
    const n = indice.nivel.get(anio);
    if (n === undefined) continue;
    anios.push(anio);
    valores.push(monto * (n / base));
  }
  return { anios, valores };
}

/** Salario mínimo mensual del año dado, o null si está fuera de cobertura (serie desde 1984). */
export const smlvDe = (smlv: SalarioMinimoData, anio: number): number | null =>
  smlv.historico[String(anio)] ?? null;

/** Cuántos salarios mínimos del año `anio` representa el monto. */
export function vecesSMLV(smlv: SalarioMinimoData, monto: number, anio: number): number | null {
  const valor = smlvDe(smlv, anio);
  return valor ? monto / valor : null;
}

/** Año del salario mínimo vigente (último de la serie). */
export const anioSMLVActual = (smlv: SalarioMinimoData): number =>
  parseInt(smlv.indicadores.salario_minimo.actual.periodo.slice(0, 4), 10);

// ───────────────────────── formato es-CO ─────────────────────────

const nfCOP = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const nfDec = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtCOP = (v: number): string => `$${nfCOP.format(Math.round(v))}`;
export const fmtNum = (v: number): string => nfCOP.format(Math.round(v));
export const fmtDec1 = (v: number): string => nfDec.format(v);
export const fmtVeces = (v: number): string => `${nfDec.format(v)}×`;
