#!/usr/bin/env node
/**
 * Post-build link checker.
 *
 * Política: el sitio usa `trailingSlash: 'always'` (ver astro.config.mjs).
 * Todos los `href="/..."` internos deben:
 *   - Terminar en `/` (rutas de página), o
 *   - Apuntar a un archivo real (.xml, .txt, .ico, .svg, .png, .jpg, .webp,
 *     .pdf, .json, etc.).
 *
 * Si encuentra cualquier href interno que no cumpla, el build falla con un
 * informe de archivos y líneas afectadas.
 *
 * Ejecutado automáticamente tras `astro build` (ver package.json → build).
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const EXEMPT_FILE_EXTENSIONS = /\.(xml|txt|ico|svg|png|jpe?g|webp|gif|pdf|json|woff2?|ttf|otf|css|js|mjs|map|avif|wasm)$/i;
const HREF_REGEX = /\bhref\s*=\s*"(\/[^"#?]*?)(\?[^"#]*)?(#[^"]*)?"/g;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function isOffender(path) {
  if (path === '/') return false;                  // home — válido sin slash
  if (path.endsWith('/')) return false;            // ya termina en slash
  if (EXEMPT_FILE_EXTENSIONS.test(path)) return false; // archivo real
  return true;
}

const files = await walk(DIST);
const offenders = new Map(); // file → Set<path>

for (const file of files) {
  const html = await readFile(file, 'utf8');
  let match;
  HREF_REGEX.lastIndex = 0;
  while ((match = HREF_REGEX.exec(html)) !== null) {
    const path = match[1];
    if (isOffender(path)) {
      const rel = relative(DIST, file);
      if (!offenders.has(rel)) offenders.set(rel, new Set());
      offenders.get(rel).add(path);
    }
  }
}

if (offenders.size === 0) {
  const total = files.length;
  console.log(`✓ Internal links OK — ${total} archivos HTML escaneados, 0 enlaces internos sin trailing slash.`);
  process.exit(0);
}

console.error('\n✗ Internal links FAIL — se encontraron enlaces internos sin trailing slash:');
console.error('  (esto provoca redirecciones 301 que degradan el SEO)\n');
let count = 0;
for (const [file, paths] of offenders) {
  console.error(`  ${file}`);
  for (const p of paths) {
    console.error(`    → href="${p}"  (debería ser "${p}/")`);
    count++;
  }
}
console.error(`\nTotal: ${count} enlace(s) en ${offenders.size} archivo(s).`);
console.error('Solución: usa los helpers de src/lib/urls.ts en lugar de template literals.\n');
process.exit(1);
