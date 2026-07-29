"""Genera la portada og:image (1200x630) del articulo sobre el precio del dolar.

Reproduce la "card 01" del sector monetario del Observatorio — la TRM peso/dolar
mensual — y le superpone un titular llamativo. Lee public/data/data_externo.json
para mantener las cifras sincronizadas con el dato mas reciente del pipeline.
Salida: public/images/blog/precio-dolar-colombia-julio-2026-cover.png

Uso: python3 scripts/build-dolar-cover.py
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

AZUL = "#2563eb"       # marca
VERDE = "#00a050"      # caida del dolar / peso fuerte
INK = "#1f2328"
MUTED = "#636c76"
BG = "#ffffff"
GRID = "#e6e9ec"

MESES = {
    "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
    "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
    "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre",
}


def periodo_to_date(p: str) -> date:
    y, m = p.split("-")
    return date(int(y), int(m), 1)


def fmt_pesos(v: float) -> str:
    return "$" + f"{int(round(v)):,}".replace(",", ".")


def construir() -> None:
    data = json.loads(Path("public/data/data_externo.json").read_text(encoding="utf-8"))
    serie = [r for r in data["serie"] if r.get("trm") is not None]
    serie = sorted(serie, key=lambda r: r["periodo"])  # ascendente

    xs = [periodo_to_date(r["periodo"]) for r in serie]
    ys = [r["trm"] for r in serie]

    actual = data["indicadores"]["trm"]["actual"]
    valor = actual["valor"]
    anio, mes = actual["periodo"].split("-")
    etiqueta = f"{MESES[mes].capitalize()} {anio}"

    fig = plt.figure(figsize=(12, 6.3), dpi=100)
    fig.patch.set_facecolor(BG)

    # -- Titular clickbait (banda superior) --------------------------------
    fig.text(0.055, 0.935, "OBSERVATORIO DE DATOS DE COLOMBIA",
             color=AZUL, fontsize=13, fontweight="bold", family="DejaVu Sans")
    fig.text(0.055, 0.845, "El dolar se derrumbo en Colombia",
             color=INK, fontsize=33, fontweight="bold", family="DejaVu Sans")
    fig.text(0.055, 0.765, "La TRM cayo a su nivel mas bajo desde antes de la pandemia",
             color=MUTED, fontsize=15.5, family="DejaVu Sans")

    # -- Grafico de la TRM (card 01) ---------------------------------------
    ax = fig.add_axes([0.055, 0.11, 0.89, 0.55])
    ax.set_facecolor(BG)
    ax.plot(xs, ys, color=AZUL, linewidth=2.6)
    ax.fill_between(xs, ys, min(ys) - 150, color=AZUL, alpha=0.06)

    ax.set_ylim(min(ys) - 150, max(ys) + 250)
    ax.grid(axis="y", color=GRID, linewidth=1)
    ax.set_axisbelow(True)
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(GRID)
    ax.tick_params(length=0, labelsize=11, colors=MUTED)
    ax.set_yticks([2000, 3000, 4000, 5000])
    ax.set_yticklabels(["$2.000", "$3.000", "$4.000", "$5.000"])

    # pico historico
    i_max = ys.index(max(ys))
    ax.annotate(f"Pico: {fmt_pesos(max(ys))}",
                xy=(xs[i_max], ys[i_max]), xytext=(xs[i_max], max(ys) + 200),
                ha="center", va="center", fontsize=12, fontweight="bold", color=MUTED)

    # callout del dato actual
    ax.annotate(f"{etiqueta}: {fmt_pesos(valor)}",
                xy=(xs[-1], ys[-1]), xytext=(xs[-1], min(ys) + 350),
                ha="right", va="center", fontsize=14, fontweight="bold", color=VERDE,
                arrowprops=dict(arrowstyle="-", color=VERDE, lw=1.6))

    fig.text(0.945, 0.045, "fredericksalazar.github.io",
             color=MUTED, fontsize=12, ha="right", family="DejaVu Sans")

    out = Path("public/images/blog/precio-dolar-colombia-julio-2026-cover.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=BG)
    plt.close(fig)

    # Aplanar a RGB (sin canal alfa) para maxima compatibilidad con los
    # scrapers de redes sociales — WhatsApp en particular falla con PNG RGBA.
    Image.open(out).convert("RGB").save(out, "PNG", optimize=True)

    mode = Image.open(out).mode
    print(f"OK -> {out}  ({out.stat().st_size // 1024} KB, {mode})  TRM {valor} ({etiqueta})")


if __name__ == "__main__":
    construir()
