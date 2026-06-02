/**
 * simulacion-2026-2v.ts
 *
 * Modelo de proyección de la 2ª vuelta presidencial 2026 (Cepeda vs De la Espriella)
 * a partir del comportamiento observado en 2022 (1V → 2V) aplicado a la 1V 2026.
 *
 * Fuente única de verdad: la consume tanto el prompt embebido en pronostico.astro
 * como las visualizaciones (donut + choropleth + tablas).
 *
 * Modelo, sin atajos:
 *  1. Para cada departamento, calculamos el "multiplicador izquierda 2022":
 *       MULT_IZQ_d = Petro2V_d / Petro1V_d  (con piso 1.0 si Petro1V_d == 0)
 *  2. Para cada departamento, calculamos la "tasa de transferencia derecha 2022":
 *       BASE_DER_d = Hernández1V_d + Fico1V_d + otros_derecha1V_d
 *       TRANSF_DER_d = Hernández2V_d / BASE_DER_d  (capeada en [0, 1.05])
 *  3. Proyección 2V 2026 por departamento:
 *       Cepeda_proj_d = Cepeda1V26_d * MULT_IZQ_d
 *       BASE_DER_26_d = suma de todos los candidatos derecha 2026 en d
 *       Abelardo_proj_d = BASE_DER_26_d * TRANSF_DER_d
 *  4. Voto del centro 2026 (Fajardo, Claudia López, etc): se reparte 60/40
 *     a favor de Cepeda — el centro colombiano en 2022 votó mayoritariamente
 *     por Petro en 2V (endoso de Fajardo/Coalición Centro Esperanza). El supuesto
 *     es explícito y editable.
 *  5. Nacional = suma de proyecciones departamentales + consulados (estimado plano).
 */
import type { PresEleccionData, PresCandidatosData, IdeologiaBloque } from "./types";

export interface DeptoSim {
  cod: string;
  nombre: string;
  multIzq: number;
  transfDer: number;
  cepeda1v26: number;
  baseDer26: number;
  baseCentro26: number;
  cepedaProj: number;
  abelardoProj: number;
  margen: number;        // cepedaProj − abelardoProj (positivo = Cepeda gana)
  ganador: "cepeda" | "abelardo";
}

export interface NacionalSim {
  cepeda: number;
  abelardo: number;
  margenAbs: number;
  margenPp: number;  // diferencia en pp sobre el total de los dos
  ganador: "cepeda" | "abelardo";
}

export interface Simulacion2026_2V {
  departamentos: DeptoSim[];
  nacional: NacionalSim;
  supuestos: {
    centroCepedaShare: number; // 0.60
    centroAbelardoShare: number; // 0.40
    transferDerechaMax: number; // 1.05
  };
}

// Bloques estables para 2026: el modelo usa ideología desde el catálogo.
function clasificarPorIdeologia(
  e: PresEleccionData,
  candidatos: { id: string; ideologia: IdeologiaBloque }[],
): Map<string, IdeologiaBloque> {
  const m = new Map<string, IdeologiaBloque>();
  for (const c of candidatos) m.set(c.id, c.ideologia);
  // Cualquier candidato no listado queda como "centro" (neutro).
  for (const r of e.resultados) if (!m.has(r.id)) m.set(r.id, "centro");
  return m;
}

export function simular2026_2V(
  e26: PresEleccionData,
  e22_1v: PresEleccionData,
  e22_2v: PresEleccionData,
  cat: PresCandidatosData,
): Simulacion2026_2V {
  const ideo26 = clasificarPorIdeologia(e26, cat.candidatos["2026-1v"]);
  const ideo22 = clasificarPorIdeologia(e22_1v, cat.candidatos["2022-1v"]);

  const m22_1v = new Map(e22_1v.agregados.departamentos.map(d => [d.cod_depto, d]));
  const m22_2v = new Map(e22_2v.agregados.departamentos.map(d => [d.cod_depto, d]));

  const TRANSF_MAX = 1.05;
  const CENTRO_A_CEPEDA = 0.60;
  const CENTRO_A_ABELARDO = 0.40;

  const deptos: DeptoSim[] = [];

  for (const d26 of e26.agregados.departamentos) {
    const d22_1v = m22_1v.get(d26.cod_depto);
    const d22_2v = m22_2v.get(d26.cod_depto);

    // Multiplicador izquierda
    const petro1V = d22_1v?.votos_por_candidato.gustavo_petro ?? 0;
    const petro2V = d22_2v?.votos_por_candidato.gustavo_petro ?? 0;
    const multIzq = petro1V > 0 ? petro2V / petro1V : 1;

    // Tasa transferencia derecha
    let baseDer22 = 0;
    if (d22_1v) {
      for (const [cid, vot] of Object.entries(d22_1v.votos_por_candidato)) {
        if (ideo22.get(cid) === "derecha") baseDer22 += vot;
      }
    }
    const hern2V = d22_2v?.votos_por_candidato.rodolfo_hernandez ?? 0;
    let transfDer = baseDer22 > 0 ? hern2V / baseDer22 : 1;
    if (transfDer > TRANSF_MAX) transfDer = TRANSF_MAX;
    if (transfDer < 0) transfDer = 0;

    // Bases por bloque en 2026
    let baseDer26 = 0;
    let baseCentro26 = 0;
    let cepeda1v26 = 0;
    for (const [cid, vot] of Object.entries(d26.votos_por_candidato)) {
      const bloque = ideo26.get(cid);
      if (cid === "ivan_cepeda") cepeda1v26 += vot;
      else if (bloque === "izquierda") cepeda1v26 += vot; // otra izquierda fluye a Cepeda
      else if (bloque === "derecha") baseDer26 += vot;
      else if (bloque === "centro") baseCentro26 += vot;
    }

    const cepedaProj = cepeda1v26 * multIzq + baseCentro26 * CENTRO_A_CEPEDA;
    const abelardoProj = baseDer26 * transfDer + baseCentro26 * CENTRO_A_ABELARDO;
    const margen = cepedaProj - abelardoProj;

    deptos.push({
      cod: d26.cod_depto,
      nombre: d26.nombre_depto,
      multIzq,
      transfDer,
      cepeda1v26,
      baseDer26,
      baseCentro26,
      cepedaProj: Math.round(cepedaProj),
      abelardoProj: Math.round(abelardoProj),
      margen: Math.round(margen),
      ganador: margen >= 0 ? "cepeda" : "abelardo",
    });
  }

  const cepedaNac = deptos.reduce((a, d) => a + d.cepedaProj, 0);
  const abelardoNac = deptos.reduce((a, d) => a + d.abelardoProj, 0);
  const margenAbs = cepedaNac - abelardoNac;
  const total = cepedaNac + abelardoNac;
  const margenPp = total > 0 ? (margenAbs / total) * 100 : 0;

  return {
    departamentos: deptos.sort((a, b) => b.margen - a.margen),
    nacional: {
      cepeda: cepedaNac,
      abelardo: abelardoNac,
      margenAbs,
      margenPp,
      ganador: margenAbs >= 0 ? "cepeda" : "abelardo",
    },
    supuestos: {
      centroCepedaShare: CENTRO_A_CEPEDA,
      centroAbelardoShare: CENTRO_A_ABELARDO,
      transferDerechaMax: TRANSF_MAX,
    },
  };
}
