/**
 * indexnow-submit.mjs
 * Notifica a Bing / Yandex (protocolo IndexNow) que hay URLs nuevas o
 * actualizadas para que las rastreen en minutos en vez de días.
 *
 * Uso:
 *   node scripts/indexnow-submit.mjs                      # envía todo el sitemap (dist/)
 *   node scripts/indexnow-submit.mjs https://.../url1/ …  # envía solo esas URLs
 *
 * La key vive en public/<KEY>.txt y se despliega en la raíz del dominio, que es
 * como IndexNow verifica la propiedad del sitio. Si rotas la key, actualiza
 * KEY y renombra ese archivo.
 */

import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const HOST = "fredericksalazar.github.io";
const KEY = "aeb181390d48395bb82bebbb1cb0c903";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DIST = "dist";

const locsFrom = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

/** URLs desde dist/ si existe (build local); si no, desde el sitemap en vivo (CI post-deploy). */
async function urlsFromSitemap() {
  const urls = new Set();
  const keep = (u) => u.includes(`//${HOST}/`) && !u.endsWith(".xml");

  let hasDist = true;
  try { await access(DIST); } catch { hasDist = false; }

  if (hasDist) {
    const files = (await readdir(DIST)).filter(
      (f) => f.startsWith("sitemap") && f.endsWith(".xml"),
    );
    for (const f of files) {
      for (const u of locsFrom(await readFile(join(DIST, f), "utf8")))
        if (keep(u)) urls.add(u);
    }
  } else {
    // Sin dist/ (job de deploy): seguir el sitemap-index publicado.
    const index = await (await fetch(`https://${HOST}/sitemap-index.xml`)).text();
    for (const sm of locsFrom(index)) {
      for (const u of locsFrom(await (await fetch(sm)).text()))
        if (keep(u)) urls.add(u);
    }
  }
  return [...urls];
}

async function main() {
  const cliUrls = process.argv.slice(2).filter((a) => a.startsWith("http"));
  const urlList = cliUrls.length ? cliUrls : await urlsFromSitemap();

  if (!urlList.length) {
    console.error("IndexNow: no hay URLs para enviar (¿corriste `npm run build`?).");
    process.exit(1);
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });

  // IndexNow responde 200 (OK) o 202 (aceptado, en cola). Otros → error.
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow OK (${res.status}): ${urlList.length} URL(s) enviadas.`);
  } else {
    console.error(`IndexNow fallo ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("IndexNow error:", e);
  process.exit(1);
});
