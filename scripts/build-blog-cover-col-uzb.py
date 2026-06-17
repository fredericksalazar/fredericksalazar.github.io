"""Genera la portada og:image del artículo Colombia vs Uzbekistán (1200x630).

Lee public/data/data_comparativo_col_uzb.json para mantener el marcador y las
cifras sincronizados con el dataset. Salida:
public/images/blog/colombia-vs-uzbekistan-cover.png

Uso: python3 scripts/build-blog-cover-col-uzb.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

DATA = Path("public/data/data_comparativo_col_uzb.json")
OUT = Path("public/images/blog/colombia-vs-uzbekistan-cover.png")

CO = "#2563eb"
UZ = "#16a34a"
INK = "#1f2328"
MUTED = "#636c76"
BG = "#ffffff"

d = json.loads(DATA.read_text(encoding="utf-8"))
ind = d["indicadores"]


def gana_co(key: str) -> bool:
    i = ind[key]
    return (i["colombia"] > i["uzbekistan"]) if i["mejor"] == "mayor" else (i["colombia"] < i["uzbekistan"])


score_co = sum(1 for k in ind if ind[k]["colombia"] is not None and ind[k]["uzbekistan"] is not None and gana_co(k))
score_uz = sum(1 for k in ind if ind[k]["colombia"] is not None and ind[k]["uzbekistan"] is not None and not gana_co(k))

fig = plt.figure(figsize=(12, 6.3), dpi=100)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 1200)
ax.set_ylim(0, 630)
ax.axis("off")

# Franjas laterales de color
ax.add_patch(FancyBboxPatch((0, 0), 14, 630, boxstyle="square,pad=0", facecolor=CO, edgecolor="none"))
ax.add_patch(FancyBboxPatch((1186, 0), 14, 630, boxstyle="square,pad=0", facecolor=UZ, edgecolor="none"))

# Eyebrow
ax.text(60, 560, "OBSERVATORIO DE DATOS DE COLOMBIA", color=CO, fontsize=15, fontweight="bold", family="DejaVu Sans")

# Título
ax.text(60, 500, "Colombia  vs  Uzbekistán", color=INK, fontsize=44, fontweight="bold", family="DejaVu Sans")
ax.text(60, 458, "El partido que también se juega con datos del Banco Mundial", color=MUTED, fontsize=18, family="DejaVu Sans")

# Marcador
ax.text(300, 330, "Colombia", color=CO, fontsize=22, fontweight="bold", ha="center", family="DejaVu Sans")
ax.text(900, 330, "Uzbekistán", color=UZ, fontsize=22, fontweight="bold", ha="center", family="DejaVu Sans")
ax.text(300, 250, str(score_co), color=CO, fontsize=120, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
ax.text(900, 250, str(score_uz), color=UZ, fontsize=120, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
ax.text(600, 250, "–", color=MUTED, fontsize=80, fontweight="bold", ha="center", va="center", family="DejaVu Sans")
ax.text(600, 150, "indicadores liderados", color=MUTED, fontsize=14, ha="center", family="DejaVu Sans")

# Stats destacados
pib = ind["pib_percapita"]
gini = ind["gini"]
desem = ind["desempleo"]


def chip(x, titulo, co_val, uz_val):
    ax.text(x, 90, titulo, color=MUTED, fontsize=12, ha="center", family="DejaVu Sans")
    ax.text(x, 62, co_val, color=CO, fontsize=15, fontweight="bold", ha="center", family="DejaVu Sans")
    ax.text(x, 38, uz_val, color=UZ, fontsize=15, fontweight="bold", ha="center", family="DejaVu Sans")


chip(220, "PIB per cápita", f"US$ {pib['colombia']:,.0f}", f"US$ {pib['uzbekistan']:,.0f}")
chip(600, "Desigualdad (Gini)", f"{gini['colombia']:.1f}", f"{gini['uzbekistan']:.1f}")
chip(980, "Desempleo", f"{desem['colombia']:.1f} %", f"{desem['uzbekistan']:.1f} %")

ax.text(1140, 30, "fredericksalazar.github.io", color=MUTED, fontsize=12, ha="right", family="DejaVu Sans")

OUT.parent.mkdir(parents=True, exist_ok=True)
fig.savefig(OUT, facecolor=BG)
print(f"OK → {OUT}  ({OUT.stat().st_size // 1024} KB)  marcador {score_co}-{score_uz}")
