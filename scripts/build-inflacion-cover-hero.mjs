/**
 * build-inflacion-cover-hero.mjs
 * Portada og:image (1200x630) del informe mensual de inflación con el diseño del
 * HERO del Observatorio: fondo "blueprint light" (gradiente + puntos + orbes),
 * el mapa real de Colombia (public/images/co.svg) a la derecha con halo y
 * capitales, y el título a la izquierda.
 *
 * Genera un SVG y lo rasteriza con sharp a PNG RGB (sin canal alfa, aplanado
 * sobre blanco) para máxima compatibilidad con los scrapers de redes sociales
 * (Facebook, X, WhatsApp, Telegram, Reddit, LinkedIn). Tamaño exacto 1200x630.
 *
 * Lee public/data/data_inflacion.json para sincronizar mes y cifras con el
 * último dato del pipeline. El nombre de salida se deriva del período, de modo
 * que cada informe conserva su propia portada.
 *   Salida: public/images/blog/inflacion-tasas-colombia-<mes>-<anio>-cover.png
 *
 * Uso: node scripts/build-inflacion-cover-hero.mjs
 */

import { readFile } from "node:fs/promises";
import { AZUL, FONT, MUTED, badgeSvg, coverHeroSvg, escribirCoverPng } from "./lib/cover-hero.mjs";

const MESES = {
  "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
  "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
  "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre",
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n, d) => n.toFixed(d).replace(".", ",");

async function main() {
  const data = JSON.parse(await readFile("public/data/data_inflacion.json", "utf8"));
  const ind = data.indicadores;
  const periodo = ind.inflacion_anual.actual.periodo;
  const [anio, mes] = periodo.split("-");
  const mesNombre = MESES[mes];
  const etiqueta = `${cap(mesNombre)} ${anio}`;
  const inflacion = ind.inflacion_anual.actual.valor; // 6.25
  const tasa = ind.tasa_interes.actual.valor;          // 12.0
  const spread = ind.spread.actual.valor;              // 5.75

  // Panel izquierdo: badge + título + subtítulo + KPIs (fondo y mapa: lib/cover-hero.mjs)
  const svg = await coverHeroSvg(`${badgeSvg()}

    <text x="0" y="198" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">Análisis de Inflación</text>
    <text x="0" y="256" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">y tasas de interés</text>
    <text x="0" y="314" font-family="${FONT}" font-size="46" font-weight="700" fill="${AZUL}" letter-spacing="-1">${cap(mesNombre)} ${anio}</text>

    <text x="2" y="372" font-family="${FONT}" font-size="20" fill="${MUTED}">Inflación anual <tspan font-weight="700" fill="${AZUL}">${fmt(inflacion, 2)}%</tspan>  ·  Tasa BanRep <tspan font-weight="700" fill="${AZUL}">${fmt(tasa, 1)}%</tspan></text>
    <text x="2" y="402" font-family="${FONT}" font-size="20" fill="${MUTED}">Tasa real (spread) <tspan font-weight="700" fill="${AZUL}">${fmt(spread, 2)} pp</tspan></text>`);

  const out = `public/images/blog/inflacion-tasas-colombia-${mesNombre}-${anio}-cover.png`;
  console.log(`OK -> ${await escribirCoverPng(svg, out)}  (${etiqueta})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
