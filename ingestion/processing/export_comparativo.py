"""Exporta el dataset comparativo Colombia vs Uzbekistán para el blog.

Lee el CSV crudo del Banco Mundial (todos los países) ya presente en el repo,
filtra COLOMBIA y UZBEKISTAN, nulifica los placeholders (0.0 y -100 → null,
REGLA 7 del Observatorio) y emite `public/data/data_comparativo_col_uzb.json`.

Contrato de salida:
{
  "metadata": { fuente, cobertura, paises, ultima_actualizacion },
  "indicadores": {            # snapshot del último año con dato real en AMBOS países
    "<id>": { anio, colombia, uzbekistan, unidad, label, mejor }
  },
  "series": {                 # serie anual ascendente para los gráficos
    "<id>": [ { anio, colombia, uzbekistan }, ... ]
  }
}

Uso: python3 -m ingestion.processing.export_comparativo
"""

from __future__ import annotations

import csv
import json
from datetime import date, timezone, datetime
from pathlib import Path

CSV_PATH = Path("data/raw/world_bank/macro_economics_indicators_2026.csv")
OUT_PATH = Path("public/data/data_comparativo_col_uzb.json")

PLACEHOLDERS = {0.0, -100.0}

# id, label, unidad, mejor("mayor"|"menor"), columnas[], combinacion
# combinacion: "valor" (1 col), "promedio" (media de cols), "suma" (suma de cols)
INDICADORES = [
    ("pib_percapita", "PIB per cápita", "USD", "mayor", ["total_gdp_percapita"], "valor"),
    ("pib_total", "PIB total", "millones USD", "mayor", ["total_gdp_million"], "valor"),
    ("poblacion", "Población", "habitantes", "mayor", ["poblacion"], "valor"),
    ("inflacion", "Inflación", "%", "menor", ["inflation_rate"], "valor"),
    ("desempleo", "Desempleo", "%", "menor", ["unemployment_rate"], "valor"),
    ("gini", "Desigualdad (Gini)", "índice 0–100", "menor", ["gini"], "valor"),
    ("esperanza_vida", "Esperanza de vida", "años", "mayor",
     ["life_expectancy_men", "life_expectancy_women"], "promedio"),
    ("apertura", "Apertura comercial", "% del PIB", "mayor",
     ["exports_of_goods_and_services", "imports_of_goods_and_services"], "suma"),
    ("deuda_externa", "Deuda externa", "% del PIB", "menor", ["external_debt_pct_gdp"], "valor"),
    ("ied", "Inversión extranjera directa", "% del PIB", "mayor",
     ["foreign_direct_investment"], "valor"),
]

PAISES = {"colombia": "COLOMBIA", "uzbekistan": "UZBEKISTAN"}


def _num(raw: str | None) -> float | None:
    if raw is None:
        return None
    s = raw.strip().replace(",", ".")
    if not s:
        return None
    try:
        v = float(s)
    except ValueError:
        return None
    return None if v in PLACEHOLDERS else v


def _combinar(row: dict, cols: list[str], modo: str) -> float | None:
    vals = [_num(row.get(c)) for c in cols]
    if any(v is None for v in vals):
        return None
    if modo == "promedio":
        return sum(vals) / len(vals)
    if modo == "suma":
        return sum(vals)
    return vals[0]


def _redondear(v: float | None, ind_id: str) -> float | int | None:
    if v is None:
        return None
    if ind_id in ("poblacion", "pib_total"):
        return int(round(v))
    return round(v, 2)


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8"), delimiter=";"))
    por_pais = {
        clave: {int(r["year"]): r for r in rows if r["country_name"] == nombre}
        for clave, nombre in PAISES.items()
    }
    anios = sorted(set(por_pais["colombia"]) | set(por_pais["uzbekistan"]))

    series: dict[str, list[dict]] = {}
    indicadores: dict[str, dict] = {}

    for ind_id, label, unidad, mejor, cols, modo in INDICADORES:
        serie = []
        for y in anios:
            co_row = por_pais["colombia"].get(y)
            uz_row = por_pais["uzbekistan"].get(y)
            co = _combinar(co_row, cols, modo) if co_row else None
            uz = _combinar(uz_row, cols, modo) if uz_row else None
            if co is None and uz is None:
                continue
            serie.append({
                "anio": y,
                "colombia": _redondear(co, ind_id),
                "uzbekistan": _redondear(uz, ind_id),
            })
        series[ind_id] = serie

        # snapshot: último año con dato real en AMBOS
        snap = next(
            (p for p in reversed(serie)
             if p["colombia"] is not None and p["uzbekistan"] is not None),
            None,
        )
        indicadores[ind_id] = {
            "anio": snap["anio"] if snap else None,
            "colombia": snap["colombia"] if snap else None,
            "uzbekistan": snap["uzbekistan"] if snap else None,
            "unidad": unidad,
            "label": label,
            "mejor": mejor,
        }

    cobertura_anios = [
        p["anio"] for s in series.values() for p in s
        if p["colombia"] is not None and p["uzbekistan"] is not None
    ]

    out = {
        "metadata": {
            "fuente": {
                "nombre": "Banco Mundial — World Development Indicators",
                "url": "https://databank.worldbank.org/source/world-development-indicators",
            },
            "paises": {"colombia": "Colombia", "uzbekistan": "Uzbekistán"},
            "cobertura": {
                "primer_anio": min(cobertura_anios),
                "ultimo_anio": max(cobertura_anios),
            },
            "ultima_actualizacion": datetime.now(timezone.utc).date().isoformat(),
            "nota": (
                "Cada indicador usa el último año con dato disponible en ambos países; "
                "el año se indica en cada fila. Placeholders del CSV (0 y -100) tratados como nulos."
            ),
        },
        "indicadores": indicadores,
        "series": series,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    # Resumen en consola
    print(f"OK → {OUT_PATH}")
    for ind_id, _l, unidad, mejor, *_ in INDICADORES:
        d = indicadores[ind_id]
        lider = "—"
        if d["colombia"] is not None and d["uzbekistan"] is not None:
            co_gana = (d["colombia"] > d["uzbekistan"]) if mejor == "mayor" else (d["colombia"] < d["uzbekistan"])
            lider = "Colombia" if co_gana else "Uzbekistán"
        print(f"  {ind_id:16} {str(d['anio']):>6}  CO={d['colombia']}  UZ={d['uzbekistan']}  → {lider}")


if __name__ == "__main__":
    main()
