/**
 * optimize-images.mjs
 * Recomprime y redimensiona en sitio las imágenes raster de public/images/.
 *
 * - Mantiene formato y ruta (PNG→PNG, JPG→JPG) para no romper referencias ni
 *   las imágenes usadas como og:image (donde WebP rompe previews en algunas
 *   redes y `og:image:type` está fijado a image/png).
 * - Cap de ancho a MAX_WIDTH (no agranda). Solo sobrescribe si el resultado es
 *   más liviano que el original.
 *
 * Uso:
 *   node scripts/optimize-images.mjs            # optimiza in situ
 *   node scripts/optimize-images.mjs --dry-run  # solo reporta, no escribe
 */
import sharp from "sharp";
import { readdir, stat, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = "public/images";
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const PNG_QUALITY = 82;
const DRY_RUN = process.argv.includes("--dry-run");

const RASTER = new Set([".png", ".jpg", ".jpeg"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function optimize(file) {
  const ext = extname(file).toLowerCase();
  if (!RASTER.has(ext)) return null;

  const before = (await stat(file)).size;
  const img = sharp(file, { failOn: "error" });
  const meta = await img.metadata();

  let pipeline = img;
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  if (ext === ".png") {
    pipeline = pipeline.png({ palette: true, quality: PNG_QUALITY, effort: 10, compressionLevel: 9 });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }

  const out = await pipeline.toBuffer();
  if (out.length >= before) return { file, before, after: before, skipped: true };

  if (!DRY_RUN) await writeFile(file, out);
  return { file, before, after: out.length, skipped: false };
}

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;
const rows = [];

for await (const file of walk(ROOT)) {
  try {
    const res = await optimize(file);
    if (!res) continue;
    totalBefore += res.before;
    totalAfter += res.after;
    if (!res.skipped) {
      changed++;
      rows.push(res);
    }
  } catch (err) {
    console.error(`ERROR ${file}: ${err.message}`);
  }
}

rows.sort((a, b) => b.before - a.before);
const kb = (n) => (n / 1024).toFixed(0).padStart(6) + "KB";
for (const r of rows.slice(0, 25)) {
  const pct = (100 * (1 - r.after / r.before)).toFixed(0);
  console.log(`${kb(r.before)} → ${kb(r.after)}  (-${pct}%)  ${r.file}`);
}

console.log("\n" + (DRY_RUN ? "[DRY RUN] " : "") + `Optimizadas ${changed} imágenes`);
console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB ` +
  `(-${(100 * (1 - totalAfter / totalBefore)).toFixed(0)}%)`);
