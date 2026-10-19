/**
 * build-observatorio-home-cover.mjs
 * Portada og:image (1200x630) de la Home del Observatorio (`/observatorio/`),
 * con el diseño del HERO compartido en lib/cover-hero.mjs.
 *
 * Sin cifras a propósito: la Home se actualiza sola y una cifra en la imagen
 * quedaría vieja en las vistas previas de redes (spec 005, T031).
 *   Salida: public/images/observatorio-home.png
 *
 * Uso: node scripts/build-observatorio-home-cover.mjs
 */

import { AZUL, FONT, MUTED, badgeSvg, coverHeroSvg, escribirCoverPng } from "./lib/cover-hero.mjs";

async function main() {
  const svg = await coverHeroSvg(`${badgeSvg()}

    <text x="0" y="198" font-family="${FONT}" font-size="50" font-weight="700" fill="${AZUL}" letter-spacing="-1">Observatorio de Datos</text>
    <text x="0" y="260" font-family="${FONT}" font-size="50" font-weight="700" fill="${AZUL}" letter-spacing="-1">de Colombia</text>

    <text x="2" y="322" font-family="${FONT}" font-size="21" fill="${MUTED}">Inflación, empleo, PIB y dólar en un vistazo.</text>
    <text x="2" y="354" font-family="${FONT}" font-size="21" fill="${MUTED}">Fuentes oficiales · Actualización automática</text>`);

  console.log(`OK -> ${await escribirCoverPng(svg, "public/images/observatorio-home.png")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
