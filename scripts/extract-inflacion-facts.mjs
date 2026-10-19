/**
 * extract-inflacion-facts.mjs
 * Extractor determinista de cifras e indicadores para el informe mensual de inflación.
 *
 * Lee public/data/data_inflacion.json, evalúa si el corte más reciente ya fue publicado
 * y emite una ficha de hechos JSON estructurada (InflationFacts) lista para el generador.
 *
 * Uso:
 *   node scripts/extract-inflacion-facts.mjs
 *   node scripts/extract-inflacion-facts.mjs --force
 *   node scripts/extract-inflacion-facts.mjs --output <ruta-archivo.json>
 */

import { readFile, access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

const MESES = {
  "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
  "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
  "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre",
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtEs = (n, dec = 2) => n.toFixed(dec).replace(".", ",");

function getVariacion(delta) {
  if (Math.abs(delta) < 0.001) return "igual";
  return delta > 0 ? "subio" : "bajo";
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function extractInflationFacts(options = {}) {
  const force = options.force || process.argv.includes("--force");
  const dataRaw = await readFile("public/data/data_inflacion.json", "utf8");
  const data = JSON.parse(dataRaw);

  const periodoActual = data.indicadores.inflacion_anual.actual.periodo; // "2026-09"
  const [anioActual, mesActual] = periodoActual.split("-");
  const mesActualNombre = MESES[mesActual];
  const etiquetaActual = `${cap(mesActualNombre)} ${anioActual}`;

  const postSlug = `inflacion-tasas-interes-colombia-${mesActualNombre}-${anioActual}`;
  const postPath = `src/content/blog/${postSlug}.mdx`;
  const coverRelative = `/images/blog/inflacion-tasas-colombia-${mesActualNombre}-${anioActual}-cover.png`;
  const canonicalUrl = `https://fredericksalazar.github.io/blog/${postSlug}/`;

  const yaPublicado = await fileExists(postPath);
  if (yaPublicado && !force) {
    return {
      status: "UP_TO_DATE",
      periodo_actual: {
        periodo: periodoActual,
        mes_num: mesActual,
        mes_nombre: mesActualNombre,
        anio: anioActual,
        etiqueta: etiquetaActual,
      },
      mensaje: `El informe para el periodo ${etiquetaActual} ya existe en ${postPath}. Usa --force para forzar la ficha.`,
      rutas: {
        archivo_post: postPath,
        imagen_cover: coverRelative,
        url_canonica: canonicalUrl,
      },
    };
  }

  // Serie histórica ordenada cronológicamente (más antiguo -> más reciente)
  const serieAsc = [...data.serie]
    .filter((r) => r.inflacion_anual !== null && r.tasa_interes !== null)
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  const idxActual = serieAsc.findIndex((r) => r.periodo === periodoActual);
  if (idxActual === -1) {
    throw new Error(`No se encontró el registro para el periodo ${periodoActual} en serie`);
  }

  const recActual = serieAsc[idxActual];
  const recAnterior = idxActual > 0 ? serieAsc[idxActual - 1] : recActual;

  // Registro de hace 12 meses
  const [yA, mA] = periodoActual.split("-").map(Number);
  const periodoInteranual = `${yA - 1}-${String(mA).padStart(2, "0")}`;
  const idxInteranual = serieAsc.findIndex((r) => r.periodo === periodoInteranual);
  const recInteranual = idxInteranual !== -1 ? serieAsc[idxInteranual] : recAnterior;

  const [anioAnt, mesAnt] = recAnterior.periodo.split("-");
  const mesAntNombre = MESES[mesAnt];
  const [anioInt, mesInt] = recInteranual.periodo.split("-");
  const mesIntNombre = MESES[mesInt];

  // Cálculo de indicadores y deltas
  function buildIndicador(campo) {
    const vAct = recActual[campo];
    const vAnt = recAnterior[campo];
    const vInt = recInteranual[campo];
    const dMes = round2(vAct - vAnt);
    const dAno = round2(vAct - vInt);
    return {
      valor: vAct,
      delta_mes: dMes,
      variacion_mes: getVariacion(dMes),
      delta_ano: dAno,
      variacion_ano: getVariacion(dAno),
    };
  }

  const inflacionAnual = buildIndicador("inflacion_anual");
  const inflacionMensual = buildIndicador("inflacion_mensual");
  const tasaInteres = buildIndicador("tasa_interes");
  const spread = buildIndicador("spread");

  // Efecto base (mes saliente de hace 1 año vs mes entrante)
  const inflacionSaliente = recInteranual.inflacion_mensual;
  const inflacionEntrante = recActual.inflacion_mensual;
  let direccionEfecto = "neutro";
  if (inflacionEntrante > inflacionSaliente) direccionEfecto = "alza";
  else if (inflacionEntrante < inflacionSaliente) direccionEfecto = "baja";

  // Contexto del año (todos los cortes del anioActual hasta el corte actual)
  const serieAno = serieAsc.filter((r) => r.periodo.startsWith(`${anioActual}-`));
  const valoresAnuales = serieAno.map((r) => r.inflacion_anual);
  const maxAno = Math.max(...valoresAnuales);
  const minAno = Math.min(...valoresAnuales);
  const esMaximoAno = inflacionAnual.valor >= maxAno;
  const esMinimoAno = inflacionAnual.valor <= minAno;

  // Meses consecutivos de estabilidad de tasa
  let mesesTasaEstable = 1;
  const tasaRef = recActual.tasa_interes;
  for (let i = idxActual - 1; i >= 0; i--) {
    if (Math.abs(serieAsc[i].tasa_interes - tasaRef) < 0.001) {
      mesesTasaEstable++;
    } else {
      break;
    }
  }

  let tendenciaTasa = "pausa";
  if (tasaInteres.delta_mes > 0) tendenciaTasa = "subida";
  else if (tasaInteres.delta_mes < 0) tendenciaTasa = "bajada";

  const fmtTasa = (n) => (n % 1 === 0 ? `${n.toFixed(1).replace(".", ",")}%` : `${fmtEs(n)}%`);

  // Tabla comparativa formateada
  const comparativo = [
    {
      indicador: "Inflación anual",
      valor_ano_anterior: `${fmtEs(recInteranual.inflacion_anual)}%`,
      valor_mes_anterior: `${fmtEs(recAnterior.inflacion_anual)}%`,
      valor_actual: `${fmtEs(recActual.inflacion_anual)}%`,
    },
    {
      indicador: "Inflación mensual",
      valor_ano_anterior: `${fmtEs(recInteranual.inflacion_mensual)}%`,
      valor_mes_anterior: `${fmtEs(recAnterior.inflacion_mensual)}%`,
      valor_actual: `${fmtEs(recActual.inflacion_mensual)}%`,
    },
    {
      indicador: "Tasa BanRep",
      valor_ano_anterior: fmtTasa(recInteranual.tasa_interes),
      valor_mes_anterior: fmtTasa(recAnterior.tasa_interes),
      valor_actual: fmtTasa(recActual.tasa_interes),
    },
    {
      indicador: "Tasa real (spread)",
      valor_ano_anterior: `${fmtEs(recInteranual.spread)} pp`,
      valor_mes_anterior: `${fmtEs(recAnterior.spread)} pp`,
      valor_actual: `${fmtEs(recActual.spread)} pp`,
    },
  ];

  return {
    status: "NEEDS_POST",
    periodo_actual: {
      periodo: periodoActual,
      mes_num: mesActual,
      mes_nombre: mesActualNombre,
      anio: anioActual,
      etiqueta: etiquetaActual,
    },
    periodo_anterior: {
      periodo: recAnterior.periodo,
      mes_num: mesAnt,
      mes_nombre: mesAntNombre,
      anio: anioAnt,
      etiqueta: `${cap(mesAntNombre)} ${anioAnt}`,
    },
    periodo_interanual: {
      periodo: recInteranual.periodo,
      mes_num: mesInt,
      mes_nombre: mesIntNombre,
      anio: anioInt,
      etiqueta: `${cap(mesIntNombre)} ${anioInt}`,
    },
    indicadores: {
      inflacion_anual: inflacionAnual,
      inflacion_mensual: inflacionMensual,
      tasa_interes: tasaInteres,
      spread: spread,
    },
    efecto_base: {
      mes_saliente_nombre: mesIntNombre,
      mes_saliente_anio: String(anioInt),
      inflacion_saliente: inflacionSaliente,
      inflacion_entrante: inflacionEntrante,
      direccion_efecto: direccionEfecto,
    },
    contexto: {
      es_maximo_ano: esMaximoAno,
      es_minimo_ano: esMinimoAno,
      meses_tasa_estable: mesesTasaEstable,
      tendencia_tasa: tendenciaTasa,
    },
    comparativo,
    rutas: {
      archivo_post: postPath,
      imagen_cover: coverRelative,
      url_canonica: canonicalUrl,
    },
  };
}

async function main() {
  const outArgIdx = process.argv.indexOf("--output");
  const facts = await extractInflationFacts();

  const jsonStr = JSON.stringify(facts, null, 2);
  if (outArgIdx !== -1 && process.argv[outArgIdx + 1]) {
    await writeFile(process.argv[outArgIdx + 1], jsonStr, "utf8");
    console.log(`Ficha guardada en ${process.argv[outArgIdx + 1]}`);
  } else {
    console.log(jsonStr);
  }
}

if (process.argv[1]?.endsWith("extract-inflacion-facts.mjs")) {
  main().catch((err) => {
    console.error("Error en extract-inflacion-facts:", err);
    process.exit(1);
  });
}
