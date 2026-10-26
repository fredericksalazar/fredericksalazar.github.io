/**
 * build-pib-cover-hero.mjs
 * Portada og:image (1200x630) del análisis anual del PIB con el mismo diseño
 * HERO de los informes de inflación (fondo, mapa y pie: lib/cover-hero.mjs).
 *
 * Lee public/data/data_pib.json para sincronizar año y cifras con el último
 * dato del pipeline. El nombre de salida se deriva del año, de modo que cada
 * análisis conserva su propia portada.
 *   Salida: public/images/blog/pib-colombia-<anio>-cover.png
 *
 * Uso: node scripts/build-pib-cover-hero.mjs
 */

import { readFile } from "node:fs/promises";
import { AZUL, FONT, MUTED, badgeSvg, coverHeroSvg, escribirCoverPng } from "./lib/cover-hero.mjs";

// Formato es-CO: punto de miles, coma decimal
const fmt = (n, d) => n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });

async function main() {
  const data = JSON.parse(await readFile("public/data/data_pib.json", "utf8"));
  const ind = data.indicadores;
  const anio = ind.pib_total.actual.periodo.slice(0, 4);
  const pibMillones = ind.pib_total.actual.valor * 1000; // miles de millones → millones
  const crecimiento = ind.crecimiento_pib.actual.valor;  // 2.64
  const percapita = ind.pib_percapita.actual.valor;      // 8561.62

  // Panel izquierdo: badge + título + subtítulo + KPIs
  const svg = await coverHeroSvg(`${badgeSvg()}

    <text x="0" y="198" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">Análisis del PIB</text>
    <text x="0" y="256" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">de Colombia</text>
    <text x="0" y="314" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">${anio}</text>

    <text x="2" y="372" font-family="${FONT}" font-size="20" fill="${MUTED}">PIB <tspan font-weight="700" fill="${AZUL}">USD ${fmt(pibMillones, 0)} M</tspan>  ·  Crecimiento <tspan font-weight="700" fill="${AZUL}">${fmt(crecimiento, 2)}%</tspan></text>
    <text x="2" y="402" font-family="${FONT}" font-size="20" fill="${MUTED}">PIB per cápita <tspan font-weight="700" fill="${AZUL}">USD ${fmt(percapita, 0)}</tspan></text>`);

  const out = `public/images/blog/pib-colombia-${anio}-cover.png`;
  console.log(`OK -> ${await escribirCoverPng(svg, out)}  (${anio})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
