"""Exportador JSON para el dashboard de PIB.

Estructura de data_pib.json:
{
  "metadata": { fuentes, cobertura, ... },
  "indicadores": {
    "pib_total": { actual: {..., delta: YoY}, unidad: "miles de millones USD" },
    "crecimiento_pib": {...},
    "pib_percapita": {...},
    "poblacion": {...},
    "deuda_publica": {...},
    "gini": {...}
  },
  "serie": [...],
  "historico": { "1960": {...} }
}
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import EPSILON, clasificar_variacion

JSON_FILENAME = "data_pib.json"

COLUMNAS_VALOR = [
    "pib_total",
    "crecimiento_pib",
    "pib_percapita",
    "poblacion",
    "deuda_publica",
    "gini",
]


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _calcular_diffs(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("periodo").reset_index(drop=True)
    for col in COLUMNAS_VALOR:
        delta_col = f"{col}_delta"
        var_col = f"{col}_variacion"
        df[delta_col] = (df[col] - df[col].shift(1)).round(4)
        df[var_col] = df[delta_col].apply(clasificar_variacion)
    return df


def _bloque_indicador(df: pd.DataFrame, columna_valor: str, unidad: str) -> dict:
    ultimo = df.iloc[-1]
    return {
        "actual": {
            "periodo": _scalar(ultimo["periodo"]),
            "valor": _scalar(ultimo[columna_valor]),
            "variacion": _scalar(ultimo[f"{columna_valor}_variacion"]),
            "delta": _scalar(ultimo[f"{columna_valor}_delta"]),
        },
        "unidad": unidad,
    }


def _serie_fila(row: pd.Series) -> dict:
    return {
        "periodo": _scalar(row["periodo"]),
        "pib_total": _scalar(row.get("pib_total")),
        "pib_total_delta": _scalar(row.get("pib_total_delta")),
        "pib_total_variacion": _scalar(row.get("pib_total_variacion")),
        "crecimiento_pib": _scalar(row.get("crecimiento_pib")),
        "crecimiento_pib_delta": _scalar(row.get("crecimiento_pib_delta")),
        "crecimiento_pib_variacion": _scalar(row.get("crecimiento_pib_variacion")),
        "pib_percapita": _scalar(row.get("pib_percapita")),
        "pib_percapita_delta": _scalar(row.get("pib_percapita_delta")),
        "pib_percapita_variacion": _scalar(row.get("pib_percapita_variacion")),
        "poblacion": _scalar(row.get("poblacion")),
        "poblacion_delta": _scalar(row.get("poblacion_delta")),
        "poblacion_variacion": _scalar(row.get("poblacion_variacion")),
        "deuda_publica": _scalar(row.get("deuda_publica")),
        "deuda_publica_delta": _scalar(row.get("deuda_publica_delta")),
        "deuda_publica_variacion": _scalar(row.get("deuda_publica_variacion")),
        "gini": _scalar(row.get("gini")),
        "gini_delta": _scalar(row.get("gini_delta")),
        "gini_variacion": _scalar(row.get("gini_variacion")),
    }


def generar_pib_json(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    repo_root = path.parent.parent.parent

    from ingestion.sources.world_bank_pib import leer_pib
    csv_wb = repo_root / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    df = leer_pib(csv_wb) if csv_wb.exists() else pd.DataFrame()

    df = df.rename(columns={
        "total_gdp_million": "pib_total_raw",
        "gdp_variation": "crecimiento_pib",
        "total_gdp_percapita": "pib_percapita",
        "poblacion": "poblacion",
        "deuda_publica": "deuda_publica",
        "ingresos_tributarios": "ingresos_tributarios",
        "gini": "gini",
    })

    # PIB total en miles de millones USD
    df["pib_total"] = (df["pib_total_raw"] / 1000).round(2)

    df = _calcular_diffs(df)

    # Histórico simple
    historico: dict[str, float] = {}
    for _, row in df.iterrows():
        year = row["periodo"][:4]
        v = row["pib_total"]
        if v is not None and v > 0:
            historico[year] = round(v, 2)

    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "pib": {
                    "nombre": "Banco Mundial — World Development Indicators",
                    "url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=CO",
                    "indicador": "Producto Interno Bruto (USD corrientes), crecimiento y PIB per cápita",
                },
                "dane": {
                    "nombre": "DANE — Cuentas Nacionales",
                    "url": "https://www.dane.gov.co/index.php/estadisticas-por-tema/cuentas-nacionales",
                    "indicador": "PIB nacional trimestral y anual",
                },
            },
            "definiciones": {
                "pib_total": "Producto Interno Bruto en miles de millones de USD corrientes (Banco Mundial).",
                "crecimiento_pib": "Variación porcentual anual del PIB real.",
                "pib_percapita": "PIB dividido por la población (USD corrientes).",
                "deuda_publica": "Deuda del gobierno general como porcentaje del PIB.",
                "gini": "Coeficiente de Gini (0 = igualdad perfecta, 100 = desigualdad total).",
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]) if len(df) > 0 else "",
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]) if len(df) > 0 else "",
                "total_registros": len(df),
            },
        },
        "indicadores": {
            "pib_total": _bloque_indicador(df, columna_valor="pib_total", unidad="miles de millones USD"),
            "crecimiento_pib": _bloque_indicador(df, columna_valor="crecimiento_pib", unidad="%"),
            "pib_percapita": _bloque_indicador(df, columna_valor="pib_percapita", unidad="USD"),
            "poblacion": _bloque_indicador(df, columna_valor="poblacion", unidad="personas"),
            "deuda_publica": _bloque_indicador(df, columna_valor="deuda_publica", unidad="% PIB"),
            "gini": _bloque_indicador(df, columna_valor="gini", unidad="pts"),
        },
        "serie": [_serie_fila(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent.parent
    out = repo / "src" / "data" / JSON_FILENAME
    generar_pib_json(out)
    print(f"Generado: {out.relative_to(repo)}")
