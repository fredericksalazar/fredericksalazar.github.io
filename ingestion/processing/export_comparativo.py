"""Exporta datasets comparativos "Colombia vs <oponente>" para el blog.

Lee el CSV crudo del Banco Mundial (todos los países) ya presente en el repo y,
para cada oponente del registro `OPONENTES`, filtra COLOMBIA y el oponente,
nulifica los placeholders (0.0 y -100 → null, REGLA 7 del Observatorio) y emite
`public/data/data_comparativo_col_<key>.json`.

Para agregar un rival nuevo: añade una entrada a `OPONENTES` y vuelve a correr.

Contrato de salida (genérico, campo `oponente` en vez del nombre del país):
{
  "metadata": { fuente, oponente: {nombre, bandera}, cobertura, ultima_actualizacion, nota },
  "indicadores": { "<id>": { anio, colombia, oponente, unidad, label, mejor } },
  "series":      { "<id>": [ { anio, colombia, oponente }, ... ] }
}

Uso: python3 -m ingestion.processing.export_comparativo
"""

from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

CSV_PATH = Path("data/raw/world_bank/macro_economics_indicators_2026.csv")
OUT_DIR = Path("public/data")

PLACEHOLDERS = {0.0, -100.0}

# key, país en el CSV, nombre visible, bandera (emoji), color de marca de la serie
OPONENTES = [
    {"key": "uzb", "pais": "UZBEKISTAN", "nombre": "Uzbekistán", "bandera": "🇺🇿", "color": "#16a34a"},
    {"key": "cog", "pais": "REPUBLIC DEMOCRATIC OF CONGO", "nombre": "RD Congo", "bandera": "🇨🇩", "color": "#d97706"},
]

# id, label, unidad, mejor("mayor"|"menor"), columnas[], combinacion("valor"|"promedio"|"suma")
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


def exportar(op: dict, rows: list[dict]) -> None:
    por_pais = {
        "colombia": {int(r["year"]): r for r in rows if r["country_name"] == "COLOMBIA"},
        "oponente": {int(r["year"]): r for r in rows if r["country_name"] == op["pais"]},
    }
    anios = sorted(set(por_pais["colombia"]) | set(por_pais["oponente"]))

    series: dict[str, list[dict]] = {}
    indicadores: dict[str, dict] = {}

    for ind_id, label, unidad, mejor, cols, modo in INDICADORES:
        serie = []
        for y in anios:
            co_row = por_pais["colombia"].get(y)
            op_row = por_pais["oponente"].get(y)
            co = _combinar(co_row, cols, modo) if co_row else None
            opv = _combinar(op_row, cols, modo) if op_row else None
            if co is None and opv is None:
                continue
            serie.append({
                "anio": y,
                "colombia": _redondear(co, ind_id),
                "oponente": _redondear(opv, ind_id),
            })
        series[ind_id] = serie

        snap = next(
            (p for p in reversed(serie)
             if p["colombia"] is not None and p["oponente"] is not None),
            None,
        )
        indicadores[ind_id] = {
            "anio": snap["anio"] if snap else None,
            "colombia": snap["colombia"] if snap else None,
            "oponente": snap["oponente"] if snap else None,
            "unidad": unidad,
            "label": label,
            "mejor": mejor,
        }

    cobertura_anios = [
        p["anio"] for s in series.values() for p in s
        if p["colombia"] is not None and p["oponente"] is not None
    ]

    out = {
        "metadata": {
            "fuente": {
                "nombre": "Banco Mundial — World Development Indicators",
                "url": "https://databank.worldbank.org/source/world-development-indicators",
            },
            "oponente": {"nombre": op["nombre"], "bandera": op["bandera"], "color": op["color"]},
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

    out_path = OUT_DIR / f"data_comparativo_col_{op['key']}.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nOK → {out_path}  (Colombia vs {op['nombre']})")
    for ind_id, _l, _u, mejor, *_ in INDICADORES:
        d = indicadores[ind_id]
        lider = "—"
        if d["colombia"] is not None and d["oponente"] is not None:
            co_gana = (d["colombia"] > d["oponente"]) if mejor == "mayor" else (d["colombia"] < d["oponente"])
            lider = "Colombia" if co_gana else op["nombre"]
        print(f"  {ind_id:16} {str(d['anio']):>6}  CO={d['colombia']}  OP={d['oponente']}  → {lider}")


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8"), delimiter=";"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for op in OPONENTES:
        exportar(op, rows)


if __name__ == "__main__":
    main()
