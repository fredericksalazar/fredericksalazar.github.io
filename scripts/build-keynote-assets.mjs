// Genera los HTML de fondo (blueprint) y portada (mapa Colombia) que replican
// el hero del sitio, listos para renderizar a PNG 1920×1080 con Chrome headless.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const root = process.cwd();
const outDir = path.join(os.homedir(), "Desktop", "keynote-plantilla", "assets");
fs.mkdirSync(outDir, { recursive: true });

// ── Mapa de Colombia: misma limpieza que MapaColombia.astro ──
let svg = fs.readFileSync(path.join(root, "public/images/co.svg"), "utf-8");
svg = svg
  .replace(/<\?xml[^>]*\?>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/viewbox=/gi, "viewBox=")
  .replace(/\sfill="#6f9c76"/g, "")
  .replace(/\sstroke="#ffffff"/g, "");

const capitales = [
  { cx: 509.6, cy: 506.3, size: "major" },
  { cx: 443.2, cy: 404.2, size: "mid" },
  { cx: 392.4, cy: 552.0, size: "mid" },
  { cx: 546.1, cy: 399.6, size: "mid" },
  { cx: 465.0, cy: 196.2, size: "mid" },
  { cx: 504.7, cy: 300.2 }, { cx: 492.9, cy: 215.8 }, { cx: 593.5, cy: 155.2 },
  { cx: 544.0, cy: 233.8 }, { cx: 426.9, cy: 321.0 }, { cx: 466.4, cy: 292.8 },
  { cx: 442.8, cy: 471.0 }, { cx: 414.9, cy: 471.6 }, { cx: 428.7, cy: 511.1 },
  { cx: 554.7, cy: 462.8 }, { cx: 451.9, cy: 540.8 }, { cx: 441.3, cy: 599.3 },
  { cx: 546.2, cy: 570.8 }, { cx: 637.5, cy: 464.1 }, { cx: 670.1, cy: 403.8 },
  { cx: 571.5, cy: 323.7 }, { cx: 758.7, cy: 491.8 }, { cx: 318.1, cy: 663.6 },
  { cx: 367.0, cy: 612.1 }, { cx: 378.5, cy: 455.5 }, { cx: 515.2, cy: 706.2 },
  { cx: 429.6, cy: 716.3 }, { cx: 681.3, cy: 692.0 }, { cx: 609.0, cy: 644.7 },
  { cx: 777.8, cy: 602.0 }, { cx: 650.4, cy: 801.6, size: "mid" },
  { cx: 124.8, cy: 99.0 },
];

const dots = capitales.map((c) => {
  const r = c.size === "major" ? 9 : c.size === "mid" ? 6.5 : 4.5;
  const ring = c.size === "major"
    ? `<circle cx="${c.cx}" cy="${c.cy}" r="14" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>`
    : "";
  return `${ring}<circle cx="${c.cx}" cy="${c.cy}" r="${r}" fill="#ffffff" stroke="rgba(255,255,255,0.4)" stroke-width="1" style="filter:drop-shadow(0 0 4px rgba(255,255,255,0.6))"/>`;
}).join("");

// Fondo blueprint común (replica .hero + .hero::before + orbs + arcs)
const blueprintCSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1920px;height:1080px;overflow:hidden}
  .hero{position:relative;width:1920px;height:1080px;overflow:hidden;
    background:
      radial-gradient(ellipse 70% 60% at 90% -10%, rgba(37,99,235,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at -10% 110%, rgba(96,165,250,0.08) 0%, transparent 60%),
      linear-gradient(180deg,#ffffff 0%,#fafbff 60%,#f5f8ff 100%);}
  .hero::before{content:"";position:absolute;inset:0;
    background-image:radial-gradient(circle,#0047ab 0.9px,transparent 1.1px);
    background-size:22px 22px;opacity:0.28;
    -webkit-mask-image:radial-gradient(ellipse 110% 90% at 50% 50%,black 55%,transparent 100%);
    mask-image:radial-gradient(ellipse 110% 90% at 50% 50%,black 55%,transparent 100%);}
  .orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
  .orb-tl{top:-120px;left:-120px;width:360px;height:360px;
    background:radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)}
  .orb-br{bottom:-80px;right:5%;width:400px;height:400px;
    background:radial-gradient(circle,rgba(59,130,246,0.10) 0%,transparent 70%)}
  .arc{position:absolute;border-radius:50%;border:1px solid rgba(37,99,235,0.12);
    bottom:-200px;right:-60px;width:500px;height:500px}
  .arc2{bottom:-240px;right:-20px;width:600px;height:600px;border-color:rgba(37,99,235,0.07)}
`;

const heroLayers = `
  <div class="orb orb-tl"></div>
  <div class="orb orb-br"></div>
  <div class="arc"></div>
  <div class="arc arc2"></div>
`;

// 1) Fondo blueprint limpio (para diapositivas de contenido)
fs.writeFileSync(path.join(outDir, "fondo-blueprint.html"), `<!doctype html><html><head><meta charset="utf-8"><style>${blueprintCSS}</style></head><body><div class="hero">${heroLayers}</div></body></html>`);

// 2) Portada con mapa de Colombia centrado (sin texto: el texto se pone en Keynote)
const mapCSS = `
  .map-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1}
  .map{position:relative;width:760px;height:760px;
    animation:none;}
  .map svg{width:760px;height:760px;fill:rgba(15,67,163,0.92);
    stroke:rgba(255,255,255,0.55);stroke-width:0.6;stroke-linejoin:round}
  .map svg #points,.map svg #label_points{display:none}
  .overlay{position:absolute;top:0;left:0;width:760px;height:760px;overflow:visible}
`;
const mapHtml = `<div class="map">${svg}<svg class="overlay" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g>${dots}</g></svg></div>`;

// 2a) Portada con mapa CENTRADO
fs.writeFileSync(path.join(outDir, "portada-mapa.html"), `<!doctype html><html><head><meta charset="utf-8"><style>${blueprintCSS}${mapCSS}</style></head><body><div class="hero">${heroLayers}<div class="map-wrap">${mapHtml}</div></div></body></html>`);

// 2b) Portada estilo HERO: mapa a la derecha, izquierda libre para el título
const mapRightCSS = `.map-wrap{justify-content:flex-end;padding-right:90px}`;
fs.writeFileSync(path.join(outDir, "portada-hero.html"), `<!doctype html><html><head><meta charset="utf-8"><style>${blueprintCSS}${mapCSS}${mapRightCSS}</style></head><body><div class="hero">${heroLayers}<div class="map-wrap">${mapHtml}</div></div></body></html>`);

console.log("HTML escrito en", outDir);
