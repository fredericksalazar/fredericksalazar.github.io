#!/usr/bin/env python3
"""
migrate.py
Migra todo el contenido de fredericksalazar.wordpress.com a archivos Markdown
listos para usarse en Astro con Content Collections.

Genera:
  src/content/blog/{slug}.md       — 20 artículos del blog
  src/content/proyectos/{slug}.md  — 6 proyectos
  public/images/blog/              — imágenes de artículos
  public/images/proyectos/         — imágenes de proyectos
"""

import re
import os
import html
import time
import urllib.parse
from pathlib import Path

import requests
from markdownify import markdownify as md

# ── Configuración ──────────────────────────────────────────────────────────────
SITE     = "fredericksalazar.wordpress.com"
API      = f"https://public-api.wordpress.com/wp/v2/sites/{SITE}"
ROOT     = Path(__file__).parent

BLOG_OUT      = ROOT / "src/content/blog"
PROJECTS_OUT  = ROOT / "src/content/proyectos"
IMG_BLOG      = ROOT / "public/images/blog"
IMG_PROJECTS  = ROOT / "public/images/proyectos"

PROJECTS_PARENT_ID = 35  # ID de la página "Proyectos" en WordPress

for d in [BLOG_OUT, PROJECTS_OUT, IMG_BLOG, IMG_PROJECTS]:
    d.mkdir(parents=True, exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Astro-Migration/1.0"})

# ── Helpers de red ─────────────────────────────────────────────────────────────

def fetch(url, params=None, retries=3):
    for attempt in range(retries):
        try:
            r = SESSION.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == retries - 1:
                print(f"  ⚠️  Error {url}: {e}")
                return None
            time.sleep(2 ** attempt)


def download_image(url, dest_dir):
    """Descarga una imagen y retorna su ruta local relativa a /public."""
    try:
        # Obtener URL sin parámetros de resize de WordPress (?w=300 o -300x200)
        clean_url = re.sub(r'\?.*$', '', url)
        clean_url = re.sub(r'-\d+x\d+(\.[a-zA-Z0-9]+)$', r'\1', clean_url)

        filename = Path(urllib.parse.urlparse(clean_url).path).name
        if not filename or '.' not in filename:
            return url  # no es imagen válida

        local = dest_dir / filename
        if not local.exists():
            r = SESSION.get(clean_url, timeout=30, stream=True)
            r.raise_for_status()
            local.write_bytes(r.content)
            size_kb = local.stat().st_size // 1024
            print(f"      ⬇  {filename} ({size_kb} KB)")

        # Ruta relativa a public/
        rel = local.relative_to(ROOT / "public")
        return "/" + str(rel).replace("\\", "/")
    except Exception as e:
        print(f"      ⚠️  No se pudo descargar {url}: {e}")
        return url


# ── Procesamiento de HTML ──────────────────────────────────────────────────────

def process_images(raw_html, dest_dir):
    """Descarga imágenes embebidas y reemplaza sus URLs por rutas locales."""
    pattern = re.compile(
        r'(<img[^>]+src=")([^"]+)(")',
        re.IGNORECASE
    )
    def replacer(m):
        prefix, url, suffix = m.group(1), m.group(2), m.group(3)
        if url.startswith("data:") or "gravatar.com" in url:
            return m.group(0)
        local = download_image(url, dest_dir)
        return prefix + local + suffix

    return pattern.sub(replacer, raw_html)


def clean_html(raw):
    """Elimina comentarios de bloques Gutenberg y entidades HTML innecesarias."""
    # Eliminar comentarios de bloques WordPress
    cleaned = re.sub(r'<!--\s*/?wp:[^>-]*-->', '', raw)
    # Eliminar atributos de clase de WordPress que no sirven en MD
    cleaned = re.sub(r'\s+class="[^"]*"', '', cleaned)
    cleaned = re.sub(r'\s+style="[^"]*"', '', cleaned)
    return cleaned


def to_markdown(html_content):
    """Convierte HTML a Markdown limpio."""
    return md(
        html_content,
        heading_style="atx",
        bullets="-",
        strip=["script", "style", "form", "noscript"],
    ).strip()


def clean_excerpt(raw):
    """Limpia el excerpt HTML y lo trunca a 155 chars."""
    text = re.sub(r'<[^>]+>', '', raw)
    text = html.unescape(text).strip()
    text = re.sub(r'\s+', ' ', text)
    if len(text) > 155:
        text = text[:152].rstrip() + "..."
    return text.replace('"', "'").replace('\n', ' ')


def extract_first_image(markdown_body):
    """Extrae la primera imagen del markdown para usarla como imagen destacada."""
    m = re.search(r'!\[.*?\]\((/images/[^)]+)\)', markdown_body)
    return m.group(1) if m else ""


# ── Frontmatter ───────────────────────────────────────────────────────────────

def blog_frontmatter(post, image_path=""):
    title   = html.unescape(post['title']['rendered']).replace('"', "'").replace('&nbsp;', ' ').strip()
    excerpt = clean_excerpt(post.get('excerpt', {}).get('rendered', ''))
    date    = post['date'][:10]

    lines = [
        "---",
        f'titulo: "{title}"',
        f"fecha: {date}",
        f'descripcion: "{excerpt}"',
        "etiquetas: []",
        'autor: "Frederick Salazar"',
    ]
    if image_path:
        lines.append(f'imagen: "{image_path}"')
    lines += ["draft: false", "---"]
    return "\n".join(lines)


def project_frontmatter(page, image_path=""):
    title   = html.unescape(page['title']['rendered']).replace('"', "'").replace('&nbsp;', ' ').strip()
    excerpt = clean_excerpt(page.get('excerpt', {}).get('rendered', ''))

    lines = [
        "---",
        f'titulo: "{title}"',
        f'descripcion: "{excerpt}"',
        "tecnologias: []",
        'github: ""',
        'demo: ""',
    ]
    if image_path:
        lines.append(f'imagen: "{image_path}"')
    lines += ["destacado: false", "orden: 99", "---"]
    return "\n".join(lines)


# ── Fetch ──────────────────────────────────────────────────────────────────────

def fetch_all_posts():
    print("📥 Descargando artículos del blog...")
    posts, page = [], 1
    while True:
        batch = fetch(f"{API}/posts", params={
            "per_page": 20, "page": page, "status": "publish",
            "_fields": "id,slug,title,date,excerpt,content",
        })
        if not batch:
            break
        posts.extend(batch)
        print(f"   Página {page}: {len(batch)} artículos")
        if len(batch) < 20:
            break
        page += 1
    print(f"   ✅ Total: {len(posts)} artículos\n")
    return posts


def fetch_project_pages():
    print("📥 Descargando páginas de proyectos...")
    pages = fetch(f"{API}/pages", params={
        "per_page": 100, "status": "publish",
        "parent": PROJECTS_PARENT_ID,
        "_fields": "id,slug,title,date,excerpt,content",
    })
    pages = pages or []
    print(f"   ✅ Total: {len(pages)} proyectos\n")
    return pages


# ── Migración ──────────────────────────────────────────────────────────────────

def migrate_posts(posts):
    print("─" * 50)
    print(f"📝 Migrando {len(posts)} artículos del blog...\n")
    ok = 0
    for i, post in enumerate(posts, 1):
        slug = post['slug']
        print(f"  [{i}/{len(posts)}] {slug}")

        raw   = post.get('content', {}).get('rendered', '')
        if not raw.strip():
            print("    ⚠️  Contenido vacío, omitiendo")
            continue

        # Descargar imágenes y reemplazar URLs
        raw_with_local = process_images(raw, IMG_BLOG)
        # Limpiar HTML
        clean = clean_html(raw_with_local)
        # Convertir a Markdown
        body  = to_markdown(clean)
        # Imagen destacada
        img   = extract_first_image(body)
        # Frontmatter
        fm    = blog_frontmatter(post, img)

        out = BLOG_OUT / f"{slug}.md"
        out.write_text(fm + "\n\n" + body + "\n", encoding="utf-8")
        ok += 1

    print(f"\n  ✅ Blog migrado: {ok}/{len(posts)} artículos")


def migrate_projects(pages):
    print("\n" + "─" * 50)
    print(f"📦 Migrando {len(pages)} proyectos...\n")
    ok = 0
    for i, page in enumerate(pages, 1):
        slug = page['slug']
        print(f"  [{i}/{len(pages)}] {slug}")

        raw   = page.get('content', {}).get('rendered', '')
        if not raw.strip():
            print("    ⚠️  Contenido vacío, omitiendo")
            continue

        raw_with_local = process_images(raw, IMG_PROJECTS)
        clean = clean_html(raw_with_local)
        body  = to_markdown(clean)
        img   = extract_first_image(body)
        fm    = project_frontmatter(page, img)

        out = PROJECTS_OUT / f"{slug}.md"
        out.write_text(fm + "\n\n" + body + "\n", encoding="utf-8")
        ok += 1

    print(f"\n  ✅ Proyectos migrados: {ok}/{len(pages)}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 50)
    print("🚀  WordPress → Astro Migration Tool")
    print(f"    Sitio: {SITE}")
    print("=" * 50 + "\n")

    posts   = fetch_all_posts()
    projects = fetch_project_pages()

    migrate_posts(posts)
    migrate_projects(projects)

    # Resumen final
    blog_files     = list(BLOG_OUT.glob("*.md"))
    project_files  = list(PROJECTS_OUT.glob("*.md"))
    img_blog       = list(IMG_BLOG.iterdir())
    img_proj       = list(IMG_PROJECTS.iterdir())

    print("\n" + "=" * 50)
    print("✅  MIGRACIÓN COMPLETA")
    print(f"   📝 Blog posts:  {len(blog_files)} archivos en src/content/blog/")
    print(f"   📦 Proyectos:   {len(project_files)} archivos en src/content/proyectos/")
    print(f"   🖼  Imágenes:   {len(img_blog)} blog + {len(img_proj)} proyectos")
    print("\n📌 Próximos pasos:")
    print("   1. Revisar .md generados y completar tecnologias[], github, demo en proyectos")
    print("   2. Agregar etiquetas[] relevantes a los artículos del blog")
    print("   3. Ejecutar: npm run dev")
    print("=" * 50)


if __name__ == "__main__":
    main()
