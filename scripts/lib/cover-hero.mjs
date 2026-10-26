/**
 * cover-hero.mjs — Base compartida de las portadas og:image (1200x630) con el
 * diseño del HERO del Observatorio: fondo "blueprint light" (gradiente + puntos
 * + orbes), el mapa real de Colombia (public/images/co.svg) a la derecha con
 * halo y capitales, y el pie de marca. Cada script solo aporta el panel
 * izquierdo (badge, título, subtítulo).
 *
 * Rasteriza con sharp a PNG RGB (sin canal alfa, aplanado sobre blanco) para
 * máxima compatibilidad con los scrapers de redes sociales (ARQ-10).
 *
 * Usado por: build-inflacion-cover-hero.mjs, build-pib-cover-hero.mjs,
 * build-observatorio-home-cover.mjs.
 */

import { readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

export const W = 1200;
export const H = 630;

export const AZUL = "#2563eb";
export const INK = "#1f2328";
export const MUTED = "#475569";
export const MUTED2 = "#64748b";
export const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Capitales principales (coords en el espacio 1000x1000 del co.svg) para
// reproducir los puntos luminosos del hero.
const CAPITALES = [
  [509.6, 506.3], [443.2, 404.2], [392.4, 552.0], [465.0, 196.2],
  [546.1, 399.6], [504.7, 300.2], [571.5, 323.7], [318.1, 663.6],
  [546.2, 570.8], [441.3, 599.3],
];

export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Badge verde "Datos Públicos · Colombia" del panel izquierdo (coordenadas locales). */
export const badgeSvg = (texto = "Datos Públicos · Colombia") =>
  `<rect x="0" y="84" width="262" height="34" rx="17" fill="#22c55e" fill-opacity="0.09" stroke="#22c55e" stroke-opacity="0.35"/>
    <circle cx="22" cy="101" r="4.5" fill="#22c55e"/>
    <text x="38" y="106" font-family="${FONT}" font-size="14" font-weight="700" fill="#15803d">${esc(texto)}</text>`;

/** SVG completo de la portada; `panelIzquierdo` va trasladado a x=64. */
export async function coverHeroSvg(panelIzquierdo) {
  // ── Mapa: leer co.svg, liberar fill/stroke y quedarnos con el contenido ──
  let mapa = await readFile("public/images/co.svg", "utf8");
  mapa = mapa
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sfill="#6f9c76"/gi, "")
    .replace(/\sstroke="#ffffff"/gi, "")
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  // Mapa: escala 0.46 sobre 1000x1000 → 460px, centrado en el panel derecho.
  const MS = 0.46, MX = 648, MY = 86;
  const toX = (cx) => MX + MS * cx;
  const toY = (cy) => MY + MS * cy;

  const dots = CAPITALES.map(([cx, cy], i) => {
    const x = toX(cx).toFixed(1), y = toY(cy).toFixed(1);
    if (i === 0) { // Bogotá (capital del país): más grande, con anillo
      return `<circle cx="${x}" cy="${y}" r="15" fill="#ffffff" opacity="0.22"/>` +
             `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.9"/>` +
             `<circle cx="${x}" cy="${y}" r="4.2" fill="#ffffff"/>`;
    }
    return `<circle cx="${x}" cy="${y}" r="10" fill="#ffffff" opacity="0.16"/>` +
           `<circle cx="${x}" cy="${y}" r="3.3" fill="#ffffff"/>`;
  }).join("");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.6" stop-color="#fafbff"/>
      <stop offset="1" stop-color="#f5f8ff"/>
    </linearGradient>
    <radialGradient id="orbTL" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2563eb" stop-opacity="0.14"/>
      <stop offset="0.7" stop-color="#2563eb" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orbBR" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#3b82f6" stop-opacity="0.12"/>
      <stop offset="0.7" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2563eb" stop-opacity="0.24"/>
      <stop offset="0.4" stop-color="#60a5fa" stop-opacity="0.12"/>
      <stop offset="0.72" stop-color="#60a5fa" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mapfill" gradientUnits="userSpaceOnUse" x1="500" y1="150" x2="500" y2="880">
      <stop offset="0" stop-color="#2f62ea"/>
      <stop offset="1" stop-color="#1a3a9c"/>
    </linearGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.1" cy="1.1" r="0.95" fill="#0047ab"/>
    </pattern>
    <radialGradient id="maskgrad" cx="0.5" cy="0.5" r="0.62">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#000000"/>
    </radialGradient>
    <mask id="dotmask"><rect width="${W}" height="${H}" fill="url(#maskgrad)"/></mask>
  </defs>

  <!-- Fondo blueprint light -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)" opacity="0.26" mask="url(#dotmask)"/>
  <ellipse cx="70" cy="40" rx="300" ry="300" fill="url(#orbTL)"/>
  <ellipse cx="1030" cy="600" rx="340" ry="340" fill="url(#orbBR)"/>
  <circle cx="1080" cy="560" r="360" fill="none" stroke="#2563eb" stroke-opacity="0.08"/>
  <circle cx="1110" cy="600" r="440" fill="none" stroke="#2563eb" stroke-opacity="0.05"/>

  <!-- Panel derecho: halo + mapa de Colombia + capitales -->
  <ellipse cx="878" cy="318" rx="250" ry="250" fill="url(#halo)"/>
  <g transform="translate(${MX},${MY}) scale(${MS})" fill="url(#mapfill)" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round">
    ${mapa}
  </g>
  ${dots}

  <!-- Panel izquierdo -->
  <g transform="translate(64,0)">
    ${panelIzquierdo}
  </g>

  <!-- Footer / marca -->
  <text x="64" y="598" font-family="${FONT}" font-size="13" font-weight="700" fill="${AZUL}" letter-spacing="1.5" opacity="0.85">OBSERVATORIO DE DATOS DE COLOMBIA</text>
  <text x="${W - 64}" y="598" font-family="${FONT}" font-size="13" fill="${MUTED2}" text-anchor="end">fredericksalazar.github.io</text>
</svg>`;
}

/** Rasteriza el SVG a PNG RGB 1200x630 en `out` y devuelve una línea de resumen. */
export async function escribirCoverPng(svg, out) {
  await mkdir(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg))
    .flatten({ background: "#ffffff" }) // sin canal alfa (WhatsApp)
    .png({ compressionLevel: 9 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  const { size } = await sharp(out).toBuffer({ resolveWithObject: true }).then((r) => r.info);
  return `${out}  ${meta.width}x${meta.height} ${meta.channels}ch  ${(size / 1024).toFixed(1)} KB`;
}
