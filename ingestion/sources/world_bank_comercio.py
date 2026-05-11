"""Ingester World Bank — Comercio Exterior Colombia.

Fuente local: data/raw/world_bank/macro_economics_indicators_2026.csv
Columnas: exports_of_goods_and_services, imports_of_goods_and_services,
          cuenta_corriente, foreign_direct_investment
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

COLUMNAS = [
    "exports_of_goods_and_services",
    "imports_of_goods_and_services",
    "cuenta_corriente",
    "foreign_direct_investment",
]


def leer_comercio(csv_path: Path) -> pd.DataFrame:
    """Devuelve DataFrame con columnas [periodo, exports, imports, cuenta_corr, ied]."""
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col = df_col[["year"] + COLUMNAS].dropna()
    df_col["year"] = df_col["year"].astype(int)
    df_col = df_col[df_col["year"] >= 1960]
    df_col["periodo"] = df_col["year"].astype(str) + "-12"

    mask = df_col[COLUMNAS].apply(
        lambda row: any(v != 0.0 for v in row), axis=1
    )
    df_col = df_col[mask]

    return (
        df_col[["periodo"] + COLUMNAS]
        .sort_values("periodo")
        .reset_index(drop=True)
    )
