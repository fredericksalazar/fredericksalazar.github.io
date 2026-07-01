/**
 * build-comparativo.mjs
 * Genera los datasets "Colombia vs <rival>" (public/data/data_comparativo_col_<key>.json)
 * a partir de la API v2 del Banco Mundial (World Development Indicators), para los
 * artículos comparativos del blog.
 *
 * Contrato de salida: ver `ComparativoData` en src/lib/observatorio/types.ts
 *   metadata { fuente, oponente{nombre,bandera,color}, cobertura, ultima_actualizacion, nota }
 *   indicadores: 10 keys con { anio, colombia, oponente, unidad, label, mejor }
 *   series:      10 keys, lista de { anio, colombia, oponente } por año (null = sin dato)
 *
 * El indicador (resumen del marcador) usa el ÚLTIMO año con dato real en AMBOS países.
 * Placeholders (0 en niveles, -100, '', null) se tratan como nulos.
 *
 * Uso:
 *   node scripts/build-comparativo.mjs prt            # solo Portugal
 *   node scripts/build-comparativo.mjs               # todos los rivales definidos abajo
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "data");

const FIRST_YEAR = 1960;

/** Rivales soportados. `color` = serie del oponente (azul #2563eb = Colombia). */
const RIVALES = {
  uzb: { iso3: "UZB", nombre: "Uzbekistán", bandera: "🇺🇿", color: "#16a34a" },
  cog: { iso3: "COD", nombre: "RD Congo", bandera: "🇨🇩", color: "#d97706" },
  prt: { iso3: "PRT", nombre: "Portugal", bandera: "🇵🇹", color: "#dc2626" },
  gha: { iso3: "GHA", nombre: "Ghana", bandera: "🇬🇭", color: "#ce1126" },
};

/**
 * Definición de los 10 indicadores. `code` es el indicador WDI para AMBOS países,
 * salvo que se especifique `codeOponente` (caso deuda: el stock de deuda externa
 * % GNI sólo existe para países de ingreso bajo/medio, no para Portugal).
 * `scale` transforma el valor crudo a la unidad almacenada.
 */
const INDICADORES = [
  { key: "pib_percapita", code: "NY.GDP.PCAP.CD", unidad: "USD", label: "PIB per cápita", mejor: "mayor" },
  { key: "pib_total", code: "NY.GDP.MKTP.CD", unidad: "millones USD", label: "PIB total", mejor: "mayor", scale: (v) => v / 1e6 },
  { key: "poblacion", code: "SP.POP.TOTL", unidad: "habitantes", label: "Población", mejor: "mayor" },
  { key: "inflacion", code: "FP.CPI.TOTL.ZG", unidad: "%", label: "Inflación", mejor: "menor" },
  { key: "desempleo", code: "SL.UEM.TOTL.ZS", unidad: "%", label: "Desempleo", mejor: "menor" },
  { key: "gini", code: "SI.POV.GINI", unidad: "índice 0–100", label: "Desigualdad (Gini)", mejor: "menor" },
  { key: "esperanza_vida", code: "SP.DYN.LE00.IN", unidad: "años", label: "Esperanza de vida", mejor: "mayor" },
  { key: "apertura", code: "NE.TRD.GNFS.ZS", unidad: "% del PIB", label: "Apertura comercial", mejor: "mayor" },
  {
    // Deuda externa stocks (% del INB). Sólo cubre países de ingreso bajo/medio:
    // Colombia/Uzbekistán/RD Congo sí; Portugal (high-income) NO está en WDI, así que
    // para Portugal esta fila queda nula y se omite del marcador y del artículo.
    key: "deuda_externa",
    code: "DT.DOD.DECT.GN.ZS",
    unidad: "% del PIB",
    label: "Deuda externa",
    mejor: "menor",
  },
  { key: "ied", code: "BX.KLT.DINV.WD.GD.ZS", unidad: "% del PIB", label: "Inversión extranjera directa", mejor: "mayor" },
];

/** Indicadores en niveles donde un 0 exacto es placeholder, no dato real. */
const ZERO_IS_NULL = new Set(["pib_percapita", "pib_total", "poblacion", "esperanza_vida", "gini"]);

async function fetchWB(iso3, code) {
  const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${code}?format=json&per_page=400`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WB ${iso3}/${code} → HTTP ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json[1] : null;
  const map = new Map();
  if (rows) {
    for (const r of rows) {
      const y = Number(r.date);
      const v = r.value;
      if (v !== null && v !== undefined && v !== "") map.set(y, Number(v));
    }
  }
  return map;
}

function clean(key, v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  if (v === -100) return null; // placeholder de la API
  if (ZERO_IS_NULL.has(key) && v === 0) return null;
  return v;
}

async function construir(key) {
  const rival = RIVALES[key];
  if (!rival) throw new Error(`Rival desconocido: ${key}`);
  console.log(`\n→ ${rival.nombre} (${rival.iso3})`);

  const series = {};
  const indicadores = {};
  let lastYearGlobal = FIRST_YEAR;

  for (const ind of INDICADORES) {
    const [colMap, opMap] = await Promise.all([
      fetchWB("COL", ind.code),
      fetchWB(rival.iso3, ind.code),
    ]);

    const scale = ind.scale ?? ((v) => v);
    const lastYear = Math.max(
      FIRST_YEAR,
      ...[...colMap.keys(), ...opMap.keys()].filter((y) => Number.isFinite(y)),
    );
    lastYearGlobal = Math.max(lastYearGlobal, lastYear);

    const puntos = [];
    let coincideAnio = null;
    let coincideCo = null;
    let coincideOp = null;
    for (let y = FIRST_YEAR; y <= lastYear; y++) {
      const co = clean(ind.key, colMap.has(y) ? scale(colMap.get(y)) : null);
      const op = clean(ind.key, opMap.has(y) ? scale(opMap.get(y)) : null);
      puntos.push({ anio: y, colombia: round(co), oponente: round(op) });
      if (co !== null && op !== null) {
        coincideAnio = y;
        coincideCo = co;
        coincideOp = op;
      }
    }
    series[ind.key] = puntos;
    indicadores[ind.key] = {
      anio: coincideAnio,
      colombia: round(coincideCo),
      oponente: round(coincideOp),
      unidad: ind.unidad,
      label: ind.label,
      mejor: ind.mejor,
    };
    console.log(
      `   ${ind.key.padEnd(15)} último común ${coincideAnio ?? "—"}  CO=${fmt(coincideCo)}  OP=${fmt(coincideOp)}`,
    );
  }

  const sinDeudaOp = indicadores.deuda_externa.oponente === null;
  const notaDeuda = sinDeudaOp
    ? " El Banco Mundial sólo publica la deuda externa (% del INB) para países de ingreso bajo y medio, por lo que esa fila se omite para este rival."
    : "";

  const data = {
    metadata: {
      fuente: {
        nombre: "Banco Mundial — World Development Indicators",
        url: "https://databank.worldbank.org/source/world-development-indicators",
      },
      oponente: { nombre: rival.nombre, bandera: rival.bandera, color: rival.color },
      cobertura: { primer_anio: FIRST_YEAR, ultimo_anio: lastYearGlobal },
      ultima_actualizacion: new Date().toISOString().slice(0, 10),
      nota:
        "Cada indicador usa el último año con dato disponible en ambos países; el año se indica en cada fila. Placeholders de la API (0 y -100) tratados como nulos." +
        notaDeuda,
    },
    indicadores,
    series,
  };

  const out = join(OUT_DIR, `data_comparativo_col_${key}.json`);
  writeFileSync(out, JSON.stringify(data, null, 2) + "\n", "utf-8");
  const kb = Math.round(JSON.stringify(data).length / 1024);
  console.log(`   ✓ ${out}  (${kb} KB)`);
}

function round(v) {
  if (v === null || v === undefined) return null;
  return Math.abs(v) >= 1000 ? Math.round(v) : Math.round(v * 100) / 100;
}
function fmt(v) {
  return v === null || v === undefined ? "—" : v.toLocaleString("es-CO");
}

async function main() {
  const args = process.argv.slice(2).filter((a) => RIVALES[a]);
  const keys = args.length ? args : Object.keys(RIVALES);
  for (const k of keys) await construir(k);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
