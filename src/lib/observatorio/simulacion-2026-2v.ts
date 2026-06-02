/**
 * simulacion-2026-2v.ts
 *
 * Modelo de proyección de la 2ª vuelta presidencial 2026 (Cepeda vs De la Espriella)
 * a partir del comportamiento observado en 2022 (1V → 2V) aplicado a la 1V 2026.
 *
 * Fuente única de verdad: la consumen el prompt embebido en pronostico.astro,
 * las visualizaciones (donut + choropleth + barras + histograma Monte Carlo)
 * y el cálculo de probabilidad.
 *
 * ── MODELO MODERADO (v2) ───────────────────────────────────────────────────
 * El multiplicador de movilización de la izquierda en 2022 fue un evento atípico:
 * Petro se enfrentó a un outsider antisistema (Hernández) en una 2ª vuelta de
 * polarización récord (IPI 0.999) que disparó la participación periférica.
 * Replicarlo íntegramente en 2026 sería demasiado optimista para Cepeda. Por eso
 * el modelo aplica:
 *
 *  1) MULTIPLICADOR DE IZQUIERDA CON REGRESIÓN A LA MEDIA
 *     mult_raw_d   = Petro2V_d / Petro1V_d              (señal histórica cruda)
 *     mult_apl_d   = 1 + (mult_raw_d − 1) · λ           (λ = 0.55, amortigua)
 *     mult_apl_d   = min(mult_apl_d, MULT_CAP=1.25)     (techo realista)
 *
 *  2) TRANSFERENCIA DE LA DERECHA CON CONSOLIDACIÓN ANTI-IZQUIERDA
 *     transf_raw_d = Hernández2V_d / base_derecha1V_d
 *     transf_apl_d = clamp(transf_raw_d · escala, [0.90, 1.00])
 *     (piso 0.90: ante la izquierda, el bloque de derecha se cohesiona más que
 *      frente a un outsider como Hernández).
 *
 *  3) REPARTO DEL CENTRO EQUILIBRADO
 *     centro → 52% Cepeda / 48% De la Espriella (antes 60/40). El centro
 *     colombiano es volátil y en un balotaje izquierda-derecha clásico se divide
 *     de forma mucho más pareja que en 2022.
 *
 *  4) PROBABILIDAD VÍA MONTE CARLO
 *     Se muestrean los 4 supuestos clave (λ, tope, reparto centro, escala
 *     transferencia) con distribuciones normales acotadas y se corre el modelo
 *     N veces; la probabilidad de victoria es la fracción de corridas que gana
 *     cada candidato (RNG sembrado → reproducible build-time y runtime).
 */
import type { PresEleccionData, PresCandidatosData, IdeologiaBloque } from "./types";

export interface SimParams {
  lambdaIzq: number;        // amortiguación del (multiplicador − 1)
  multCap: number;          // techo del multiplicador aplicado
  centroCepedaShare: number;// fracción del centro que va a Cepeda
  derTransferScale: number; // escala global sobre la transferencia derecha
  derTransferFloor: number; // piso de la transferencia aplicada
  derTransferCap: number;   // techo de la transferencia aplicada
}

/**
 * Escenario central REALISTA (v3). Calibrado con criterio político:
 *  - λ=0.72: amortigua el evento atípico de 2022 sin negar la capacidad real de
 *    movilización de 2ª vuelta de la izquierda (antes 0.55 lo aplastaba).
 *  - multCap=1.32: techo algo más alto, coherente con λ.
 *  - centroCepedaShare=0.57: el centro (Fajardo) rechaza a un candidato de
 *    extrema derecha y se inclina hacia Cepeda, como Fajardo→Petro en 2022.
 *  - derTransferFloor=0.82: De la Espriella es una figura polarizante de alto
 *    rechazo; transfiere PEOR que un candidato tradicional (parte del voto de
 *    Paloma Valencia / Miguel Uribe y del centro-derecha no lo sigue). El piso
 *    bajo refleja esa fuga estructural.
 */
export const DEFAULT_PARAMS: SimParams = {
  lambdaIzq: 0.72,
  multCap: 1.32,
  centroCepedaShare: 0.57,
  derTransferScale: 1.0,
  derTransferFloor: 0.82,
  derTransferCap: 1.00,
};

export interface DeptoInput {
  cod: string;
  nombre: string;
  multRaw: number;       // Petro2V / Petro1V (cruda)
  transfRaw: number;     // Hernández2V / base_derecha1V (cruda)
  cepeda1v26: number;    // base izquierda 2026 que fluye a Cepeda
  baseDer26: number;     // base derecha 2026
  baseCentro26: number;  // base centro 2026
}

export interface DeptoSim extends DeptoInput {
  multIzq: number;       // multiplicador APLICADO (amortiguado + tope)
  transfDer: number;     // transferencia APLICADA
  cepedaProj: number;
  abelardoProj: number;
  margen: number;        // cepedaProj − abelardoProj (positivo = Cepeda)
  ganador: "cepeda" | "abelardo";
}

export interface NacionalSim {
  cepeda: number;
  abelardo: number;
  margenAbs: number;
  margenPp: number;
  ganador: "cepeda" | "abelardo";
}

export interface MonteCarloResult {
  runs: number;
  probCepeda: number;     // 0..1
  probAbelardo: number;   // 0..1
  margenPpMedia: number;
  margenPpP10: number;
  margenPpP50: number;
  margenPpP90: number;
  muestrasPp: number[];   // margen pp por corrida (para histograma)
}

export interface Simulacion2026_2V {
  inputs: DeptoInput[];
  departamentos: DeptoSim[];
  nacional: NacionalSim;
  params: SimParams;
  totales: {
    cepeda1v26: number;
    baseDer26: number;
    baseCentro26: number;
    multIzqPromedio: number;
    transfDerPromedio: number;
  };
}

function clasificarPorIdeologia(
  e: PresEleccionData,
  candidatos: { id: string; ideologia: IdeologiaBloque }[],
): Map<string, IdeologiaBloque> {
  const m = new Map<string, IdeologiaBloque>();
  for (const c of candidatos) m.set(c.id, c.ideologia);
  for (const r of e.resultados) if (!m.has(r.id)) m.set(r.id, "centro");
  return m;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Construye los insumos por departamento (independientes de los parámetros). */
export function construirInputs(
  e26: PresEleccionData,
  e22_1v: PresEleccionData,
  e22_2v: PresEleccionData,
  cat: PresCandidatosData,
): DeptoInput[] {
  const ideo26 = clasificarPorIdeologia(e26, cat.candidatos["2026-1v"]);
  const ideo22 = clasificarPorIdeologia(e22_1v, cat.candidatos["2022-1v"]);
  const m22_1v = new Map(e22_1v.agregados.departamentos.map(d => [d.cod_depto, d]));
  const m22_2v = new Map(e22_2v.agregados.departamentos.map(d => [d.cod_depto, d]));

  const inputs: DeptoInput[] = [];
  for (const d26 of e26.agregados.departamentos) {
    const d22_1v = m22_1v.get(d26.cod_depto);
    const d22_2v = m22_2v.get(d26.cod_depto);

    const petro1V = d22_1v?.votos_por_candidato.gustavo_petro ?? 0;
    const petro2V = d22_2v?.votos_por_candidato.gustavo_petro ?? 0;
    const multRaw = petro1V > 0 ? petro2V / petro1V : 1;

    let baseDer22 = 0;
    if (d22_1v) {
      for (const [cid, vot] of Object.entries(d22_1v.votos_por_candidato)) {
        if (ideo22.get(cid) === "derecha") baseDer22 += vot;
      }
    }
    const hern2V = d22_2v?.votos_por_candidato.rodolfo_hernandez ?? 0;
    const transfRaw = baseDer22 > 0 ? hern2V / baseDer22 : 1;

    let baseDer26 = 0, baseCentro26 = 0, cepeda1v26 = 0;
    for (const [cid, vot] of Object.entries(d26.votos_por_candidato)) {
      const bloque = ideo26.get(cid);
      if (cid === "ivan_cepeda" || bloque === "izquierda") cepeda1v26 += vot;
      else if (bloque === "derecha") baseDer26 += vot;
      else if (bloque === "centro") baseCentro26 += vot;
    }

    inputs.push({
      cod: d26.cod_depto,
      nombre: d26.nombre_depto,
      multRaw,
      transfRaw,
      cepeda1v26,
      baseDer26,
      baseCentro26,
    });
  }
  return inputs;
}

function proyectarDepto(inp: DeptoInput, p: SimParams) {
  const multApl = clamp(1 + (inp.multRaw - 1) * p.lambdaIzq, 1, p.multCap);
  const transfApl = clamp(inp.transfRaw * p.derTransferScale, p.derTransferFloor, p.derTransferCap);
  const cepeda = inp.cepeda1v26 * multApl + inp.baseCentro26 * p.centroCepedaShare;
  const abelardo = inp.baseDer26 * transfApl + inp.baseCentro26 * (1 - p.centroCepedaShare);
  return { multApl, transfApl, cepeda, abelardo };
}

export function simular2026_2V(
  e26: PresEleccionData,
  e22_1v: PresEleccionData,
  e22_2v: PresEleccionData,
  cat: PresCandidatosData,
  params: SimParams = DEFAULT_PARAMS,
): Simulacion2026_2V {
  const inputs = construirInputs(e26, e22_1v, e22_2v, cat);

  const deptos: DeptoSim[] = inputs.map(inp => {
    const { multApl, transfApl, cepeda, abelardo } = proyectarDepto(inp, params);
    const margen = cepeda - abelardo;
    return {
      ...inp,
      multIzq: multApl,
      transfDer: transfApl,
      cepedaProj: Math.round(cepeda),
      abelardoProj: Math.round(abelardo),
      margen: Math.round(margen),
      ganador: margen >= 0 ? "cepeda" : "abelardo",
    };
  });

  const cepedaNac = deptos.reduce((a, d) => a + d.cepedaProj, 0);
  const abelardoNac = deptos.reduce((a, d) => a + d.abelardoProj, 0);
  const margenAbs = cepedaNac - abelardoNac;
  const total = cepedaNac + abelardoNac;
  const margenPp = total > 0 ? (margenAbs / total) * 100 : 0;

  return {
    inputs,
    departamentos: deptos.sort((a, b) => b.margen - a.margen),
    nacional: {
      cepeda: cepedaNac,
      abelardo: abelardoNac,
      margenAbs,
      margenPp,
      ganador: margenAbs >= 0 ? "cepeda" : "abelardo",
    },
    params,
    totales: {
      cepeda1v26: inputs.reduce((a, d) => a + d.cepeda1v26, 0),
      baseDer26: inputs.reduce((a, d) => a + d.baseDer26, 0),
      baseCentro26: inputs.reduce((a, d) => a + d.baseCentro26, 0),
      multIzqPromedio: deptos.reduce((a, d) => a + d.multIzq, 0) / deptos.length,
      transfDerPromedio: deptos.reduce((a, d) => a + d.transfDer, 0) / deptos.length,
    },
  };
}

// ── RNG sembrado (mulberry32) + normal (Box-Muller) ─────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNormal(rng: () => number) {
  return (mu: number, sigma: number) => {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mu + sigma * z;
  };
}

/**
 * Monte Carlo: muestrea los 4 supuestos clave y corre el modelo N veces.
 * Devuelve la probabilidad de victoria y la distribución del margen (pp).
 */
export function montecarlo2026_2V(
  inputs: DeptoInput[],
  runs = 4000,
  seed = 20260601,
): MonteCarloResult {
  const rng = mulberry32(seed);
  const normal = makeNormal(rng);
  const muestrasPp: number[] = [];
  let cepedaWins = 0;

  for (let i = 0; i < runs; i++) {
    const p: SimParams = {
      lambdaIzq: clamp(normal(0.72, 0.12), 0.45, 0.95),
      multCap: clamp(normal(1.32, 0.06), 1.18, 1.45),
      centroCepedaShare: clamp(normal(0.57, 0.06), 0.42, 0.72),
      derTransferScale: clamp(normal(1.0, 0.04), 0.88, 1.10),
      derTransferFloor: 0.82,
      derTransferCap: 1.00,
    };
    let cep = 0, abe = 0;
    for (const inp of inputs) {
      const r = proyectarDepto(inp, p);
      cep += r.cepeda;
      abe += r.abelardo;
    }
    const total = cep + abe;
    // Margen estructural del modelo...
    const ppEstructural = total > 0 ? ((cep - abe) / total) * 100 : 0;
    // ...más un SWING EXÓGENO nacional ~ Normal(0, 3.0 pp) que representa la
    // incertidumbre irreducible que el modelo no captura (eventos de campaña,
    // shocks de participación, error tipo-encuesta) a varias semanas de la 2V.
    // Sin este término la probabilidad quedaría sobre-estimada.
    const swing = normal(0, 3.0);
    const pp = ppEstructural + swing;
    muestrasPp.push(pp);
    if (pp >= 0) cepedaWins++;
  }

  const ordenadas = [...muestrasPp].sort((a, b) => a - b);
  const pctl = (q: number) => ordenadas[Math.min(ordenadas.length - 1, Math.floor(q * ordenadas.length))];
  const media = muestrasPp.reduce((a, b) => a + b, 0) / muestrasPp.length;

  return {
    runs,
    probCepeda: cepedaWins / runs,
    probAbelardo: 1 - cepedaWins / runs,
    margenPpMedia: media,
    margenPpP10: pctl(0.10),
    margenPpP50: pctl(0.50),
    margenPpP90: pctl(0.90),
    muestrasPp,
  };
}
