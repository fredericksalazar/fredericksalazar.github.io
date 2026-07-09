"""Genera la portada og:image (1200x630) del informe mensual de inflación y tasas.

Reproduce la "card 5" del dashboard del Observatorio — el diferencial entre la
tasa del BanRep y la inflación (barras rojas = freno, verdes = acelerador) — y le
superpone un titular llamativo. Lee public/data/data_inflacion.json para mantener
las cifras sincronizadas con el dato más reciente del pipeline.
Salida: public/images/blog/inflacion-tasas-colombia-junio-2026-cover.png

Uso: python3 scripts/build-inflacion-cover.py
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

ROJO = "#d62728"       # freno (tasa real positiva)
VERDE = "#00a050"      # acelerador (tasa real negativa)
AZUL = "#2563eb"       # marca
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


def construir() -> None:
    data = json.loads(Path("public/data/data_inflacion.json").read_text(encoding="utf-8"))
    serie = [r for r in data["serie"]
             if r["inflacion_anual"] is not None and r["tasa_interes"] is not None]
    serie = sorted(serie, key=lambda r: r["periodo"])  # ascendente

    xs = [periodo_to_date(r["periodo"]) for r in serie]
    ys = [round(r["tasa_interes"] - r["inflacion_anual"], 2) for r in serie]
    colors = [ROJO if v > 0 else VERDE if v < 0 else MUTED for v in ys]

    actual = data["indicadores"]["spread"]["actual"]
    spread = actual["valor"]
    anio, mes = actual["periodo"].split("-")
    etiqueta = f"{MESES[mes].capitalize()} {anio}"

    fig = plt.figure(figsize=(12, 6.3), dpi=100)
    fig.patch.set_facecolor(BG)

    # ── Titular clickbait (banda superior) ────────────────────────────────
    fig.text(0.055, 0.935, "OBSERVATORIO DE DATOS DE COLOMBIA",
             color=AZUL, fontsize=13, fontweight="bold", family="DejaVu Sans")
    fig.text(0.055, 0.845, "El dinero nunca había estado tan caro",
             color=INK, fontsize=33, fontweight="bold", family="DejaVu Sans")
    fig.text(0.055, 0.765, "El freno del Banco de la República a la economía tocó su nivel más alto en 22 años",
             color=MUTED, fontsize=15.5, family="DejaVu Sans")

    # ── Gráfico del diferencial (card 5) ──────────────────────────────────
    ax = fig.add_axes([0.055, 0.11, 0.89, 0.55])
    ax.set_facecolor(BG)
    ax.bar(xs, ys, width=24, color=colors, linewidth=0)
    ax.axhline(0, color=INK, linewidth=1.4)

    ax.set_ylim(-6, 7)
    ax.grid(axis="y", color=GRID, linewidth=1)
    ax.set_axisbelow(True)
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(GRID)
    ax.tick_params(length=0, labelsize=11, colors=MUTED)
    ax.set_yticks([-4, -2, 0, 2, 4, 6])
    ax.set_yticklabels(["-4", "-2", "0", "+2", "+4", "+6 pp"])

    # etiquetas de referencia dentro del área
    ax.text(xs[3], 6.2, "Freno  ·  crédito caro, tasa real positiva",
            color=ROJO, fontsize=12, fontweight="bold", va="center")
    ax.text(xs[3], -5.1, "Acelerador  ·  tasa real negativa",
            color=VERDE, fontsize=12, fontweight="bold", va="center")

    # callout del dato actual
    ax.annotate(f"{etiqueta}: +{spread:.2f} pp".replace(".", ","),
                xy=(xs[-1], ys[-1]), xytext=(xs[-1], 6.4),
                ha="right", va="center", fontsize=13, fontweight="bold", color=ROJO,
                arrowprops=dict(arrowstyle="-", color=ROJO, lw=1.4))

    fig.text(0.945, 0.045, "fredericksalazar.github.io",
             color=MUTED, fontsize=12, ha="right", family="DejaVu Sans")

    out = Path("public/images/blog/inflacion-tasas-colombia-junio-2026-cover.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=BG)
    plt.close(fig)

    # Aplanar a RGB (sin canal alfa) para máxima compatibilidad con los
    # scrapers de redes sociales — WhatsApp en particular falla con PNG RGBA.
    Image.open(out).convert("RGB").save(out, "PNG", optimize=True)

    mode = Image.open(out).mode
    print(f"OK -> {out}  ({out.stat().st_size // 1024} KB, {mode})  spread {spread} pp (max serie)")


if __name__ == "__main__":
    construir()
