"""Genera la portada 9:16 (1080x1920) del video de análisis de inflación.

Replica el Hero del Observatorio (blueprint light + mapa de Colombia con las 32
capitales) reusando los mismos assets y tokens del sitio: `public/images/co.svg`,
las coordenadas de `MapaColombia.astro` y la fuente Google Sans Flex. Se renderiza
con Chrome headless porque es la única forma de honrar la tipografía real.

Las cifras salen de public/data/data_inflacion.json, así que la portada queda
sincronizada con el dato del pipeline.

Salida: public/images/social/inflacion-junio-2026-9x16.png

Uso: python3 scripts/build-video-cover.py
"""

from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

W, H = 1080, 1920
OUT = Path("public/images/social/inflacion-junio-2026-9x16.png")

MESES = {
    "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
    "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
    "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre",
}


def limpiar_mapa() -> str:
    """Misma limpieza que hace MapaColombia.astro sobre el SVG de simplemaps."""
    svg = Path("public/images/co.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r"<!--[\s\S]*?-->", "", svg)
    svg = re.sub(r"viewbox=", "viewBox=", svg, flags=re.I)
    svg = svg.replace(' fill="#6f9c76"', "").replace(' stroke="#ffffff"', "")
    return svg.strip()


def leer_capitales() -> list[dict]:
    """Extrae cx/cy/size del arreglo `capitales` de MapaColombia.astro.

    `size` es opcional en el componente (por defecto "small"), así que la
    captura del grupo tiene que serlo también o se pierden 27 de las 32.
    """
    src = Path("src/components/observatorio/MapaColombia.astro").read_text(encoding="utf-8")
    filas = re.findall(
        r'\{\s*name:\s*"([^"]+)",\s*cx:\s*([\d.]+),\s*cy:\s*([\d.]+),(?:\s*size:\s*"(\w+)",)?',
        src,
    )
    if len(filas) != 32:
        raise SystemExit(f"Se esperaban 32 capitales en MapaColombia.astro, se hallaron {len(filas)}")
    return [{"name": n, "cx": float(x), "cy": float(y), "size": s or "small"} for n, x, y, s in filas]


def puntos_svg(capitales: list[dict]) -> str:
    radios = {"major": 9, "mid": 6.5, "small": 4.5}
    out = []
    for c in capitales:
        if c["size"] == "major":
            out.append(f'<circle cx="{c["cx"]}" cy="{c["cy"]}" r="14" class="mc-dot-ring"/>')
        r = radios.get(c["size"], 4.5)
        glow = ' filter="url(#mc-glow)"' if c["size"] == "major" else ""
        out.append(f'<circle cx="{c["cx"]}" cy="{c["cy"]}" r="{r}" class="mc-dot"{glow}/>')
    return "\n".join(out)


def construir() -> None:
    data = json.loads(Path("public/data/data_inflacion.json").read_text(encoding="utf-8"))
    ind = data["indicadores"]
    inflacion = ind["inflacion_anual"]["actual"]["valor"]
    tasa = ind["tasa_interes"]["actual"]["valor"]
    anio, mes = ind["inflacion_anual"]["actual"]["periodo"].split("-")
    mes_txt = MESES[mes]

    fmt = lambda v: f"{v:.2f}".rstrip("0").rstrip(".").replace(".", ",")

    html = f"""<!doctype html>
<html lang="es-CO"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..900&display=swap" rel="stylesheet">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{
    width:{W}px; height:{H}px; overflow:hidden; position:relative;
    font-family:"Google Sans Flex","Google Sans",system-ui,sans-serif;
    background:
      radial-gradient(ellipse 70% 40% at 90% -6%, rgba(37,99,235,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 60% 35% at -10% 106%, rgba(96,165,250,0.10) 0%, transparent 60%),
      linear-gradient(180deg,#ffffff 0%,#fafbff 55%,#f5f8ff 100%);
  }}
  /* Blueprint dots del Hero, escalados al lienzo 2x */
  body::before {{
    content:""; position:absolute; inset:0; z-index:0;
    background-image:radial-gradient(circle,#0047ab 1.2px,transparent 1.5px);
    background-size:30px 30px; opacity:.26;
    -webkit-mask-image:radial-gradient(ellipse 110% 90% at 50% 45%,black 55%,transparent 100%);
  }}
  .orb {{ position:absolute; border-radius:50%; filter:blur(90px); z-index:0; }}
  .orb--tl {{ top:-160px; left:-160px; width:520px; height:520px;
    background:radial-gradient(circle,rgba(37,99,235,.14) 0%,transparent 70%); }}
  .orb--br {{ bottom:-120px; right:-80px; width:560px; height:560px;
    background:radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%); }}

  .wrap {{ position:relative; z-index:2; height:100%;
    display:flex; flex-direction:column; padding:132px 84px 190px; }}

  .badge {{ display:inline-flex; align-items:center; gap:14px; align-self:flex-start;
    padding:16px 30px; background:rgba(34,197,94,.08); border:2px solid rgba(34,197,94,.3);
    border-radius:100px; font-size:26px; font-weight:600; color:#15803d; letter-spacing:.01em; }}
  .badge__pulse {{ width:14px; height:14px; background:#22c55e; border-radius:50%; }}

  .title {{ margin-top:54px; font-size:92px; font-weight:700; line-height:.96;
    letter-spacing:-.03em; color:#2563eb; }}

  .punch {{ margin-top:38px; font-size:128px; font-weight:700; line-height:.92;
    letter-spacing:-.035em; color:#1f2328; }}
  .punch em {{ font-style:normal; color:#2563eb; }}

  .rule {{ margin-top:42px; width:150px; height:8px; border-radius:99px;
    background:#2563eb; opacity:.85; }}

  /* ── Mapa: capa decorativa, fuera del flujo (como el visual del Hero) ── */
  .map {{ position:absolute; z-index:1; left:50%; top:790px;
    width:900px; height:900px; transform:translateX(-50%);
    filter:drop-shadow(0 24px 60px rgba(15,67,163,.18));
    -webkit-mask-image:radial-gradient(ellipse 78% 78% at 50% 44%,black 62%,transparent 100%); }}
  .map svg {{ position:absolute; inset:0; width:100%; height:100%; }}
  .map__base svg {{ fill:rgba(15,67,163,.92); stroke:rgba(255,255,255,.55);
    stroke-width:.6; stroke-linejoin:round; }}
  .map__base #points, .map__base #label_points {{ display:none; }}
  .mc-dot {{ fill:#fff; stroke:rgba(255,255,255,.4); stroke-width:1;
    filter:drop-shadow(0 0 4px rgba(255,255,255,.6)); }}
  .mc-dot-ring {{ fill:none; stroke:rgba(255,255,255,.45); stroke-width:1.5; }}

  /* ── KPIs ── */
  .kpis {{ margin-top:auto; display:flex; gap:26px; }}
  .kpi {{ flex:1; background:#fff; border:2px solid rgba(37,99,235,.18); border-radius:28px;
    padding:30px 34px; box-shadow:0 4px 20px rgba(15,23,42,.05); }}
  .kpi__value {{ font-size:64px; font-weight:700; color:#2563eb; line-height:1;
    letter-spacing:-.02em; }}
  .kpi__label {{ margin-top:12px; font-size:23px; font-weight:600; color:#636c76;
    text-transform:uppercase; letter-spacing:.08em; }}

  .foot {{ margin-top:40px; display:flex; justify-content:space-between; align-items:center;
    font-size:24px; color:#636c76; }}
  .foot strong {{ color:#2563eb; font-weight:700; letter-spacing:.06em;
    text-transform:uppercase; font-size:22px; }}
</style></head>
<body>
  <div class="orb orb--tl"></div>
  <div class="orb orb--br"></div>

  <div class="map">
    <div class="map__base">{limpiar_mapa()}</div>
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="mc-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter></defs>
      {puntos_svg(leer_capitales())}
    </svg>
  </div>

  <div class="wrap">
    <span class="badge"><span class="badge__pulse"></span>Datos Públicos · Colombia</span>

    <h1 class="title">Análisis inflación<br>{mes_txt} {anio}</h1>
    <div class="punch">Todo es<br><em>más caro.</em></div>
    <div class="rule"></div>

    <div class="kpis">
      <div class="kpi">
        <div class="kpi__value">{fmt(inflacion)}%</div>
        <div class="kpi__label">Inflación anual</div>
      </div>
      <div class="kpi">
        <div class="kpi__value">{fmt(tasa)}%</div>
        <div class="kpi__label">Tasa BanRep</div>
      </div>
    </div>

    <div class="foot">
      <strong>Observatorio de Datos</strong>
      <span>fredericksalazar.github.io</span>
    </div>
  </div>
</body></html>"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        tmp = f.name

    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", f"--window-size={W},{H}",
        "--virtual-time-budget=12000",          # espera a que baje la webfont
        f"--screenshot={OUT.resolve()}", f"file://{tmp}",
    ], check=True, capture_output=True)

    print(f"OK → {OUT}  ({OUT.stat().st_size // 1024} KB)  {W}x{H}  "
          f"inflación {inflacion}% · tasa {tasa}%")


if __name__ == "__main__":
    construir()
