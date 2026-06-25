"""Genera las portadas og:image de los artículos "Colombia vs <oponente>" (1200x630).

Lee cada public/data/data_comparativo_col_<key>.json para mantener el marcador y
las cifras sincronizados, y toma nombre/color del oponente desde el propio JSON.
Salida: public/images/blog/colombia-vs-<slug>-cover.png

Uso: python3 scripts/build-blog-cover.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

CO = "#2563eb"
INK = "#1f2328"
MUTED = "#636c76"
BG = "#ffffff"

# key del dataset → slug del archivo de portada
PORTADAS = {"uzb": "uzbekistan", "cog": "rd-congo", "prt": "portugal"}


def gana_co(i: dict) -> bool:
    return (i["colombia"] > i["oponente"]) if i["mejor"] == "mayor" else (i["colombia"] < i["oponente"])


def construir(key: str, slug: str) -> None:
    data = json.loads(Path(f"public/data/data_comparativo_col_{key}.json").read_text(encoding="utf-8"))
    ind = data["indicadores"]
    op = data["metadata"]["oponente"]
    OP = op["color"]
    nombre = op["nombre"]

    validos = [i for i in ind.values() if i["colombia"] is not None and i["oponente"] is not None]
    score_co = sum(1 for i in validos if gana_co(i))
    score_op = len(validos) - score_co

    fig = plt.figure(figsize=(12, 6.3), dpi=100)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1200)
    ax.set_ylim(0, 630)
    ax.axis("off")

    ax.add_patch(FancyBboxPatch((0, 0), 14, 630, boxstyle="square,pad=0", facecolor=CO, edgecolor="none"))
    ax.add_patch(FancyBboxPatch((1186, 0), 14, 630, boxstyle="square,pad=0", facecolor=OP, edgecolor="none"))

    ax.text(60, 560, "OBSERVATORIO DE DATOS DE COLOMBIA", color=CO, fontsize=15, fontweight="bold", family="DejaVu Sans")
    ax.text(60, 500, f"Colombia  vs  {nombre}", color=INK, fontsize=44, fontweight="bold", family="DejaVu Sans")
    ax.text(60, 458, "El partido que también se juega con datos del Banco Mundial", color=MUTED, fontsize=18, family="DejaVu Sans")

    ax.text(300, 330, "Colombia", color=CO, fontsize=22, fontweight="bold", ha="center", family="DejaVu Sans")
    ax.text(900, 330, nombre, color=OP, fontsize=22, fontweight="bold", ha="center", family="DejaVu Sans")
    ax.text(300, 250, str(score_co), color=CO, fontsize=120, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
    ax.text(900, 250, str(score_op), color=OP, fontsize=120, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
    ax.text(600, 250, "–", color=MUTED, fontsize=80, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
    ax.text(600, 150, "indicadores liderados", color=MUTED, fontsize=14, ha="center", family="DejaVu Sans")

    pib, gini, desem = ind["pib_percapita"], ind["gini"], ind["desempleo"]

    def chip(x, titulo, co_val, op_val):
        ax.text(x, 90, titulo, color=MUTED, fontsize=12, ha="center", family="DejaVu Sans")
        ax.text(x, 62, co_val, color=CO, fontsize=15, fontweight="bold", ha="center", family="DejaVu Sans")
        ax.text(x, 38, op_val, color=OP, fontsize=15, fontweight="bold", ha="center", family="DejaVu Sans")

    chip(220, "PIB per cápita", f"US$ {pib['colombia']:,.0f}", f"US$ {pib['oponente']:,.0f}")
    chip(600, "Desigualdad (Gini)", f"{gini['colombia']:.1f}", f"{gini['oponente']:.1f}")
    chip(980, "Desempleo", f"{desem['colombia']:.1f} %", f"{desem['oponente']:.1f} %")

    ax.text(1140, 30, "fredericksalazar.github.io", color=MUTED, fontsize=12, ha="right", family="DejaVu Sans")

    out = Path(f"public/images/blog/colombia-vs-{slug}-cover.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=BG)
    plt.close(fig)
    print(f"OK → {out}  ({out.stat().st_size // 1024} KB)  marcador Colombia {score_co}-{score_op} {nombre}")


def main() -> None:
    for key, slug in PORTADAS.items():
        construir(key, slug)


if __name__ == "__main__":
    main()
