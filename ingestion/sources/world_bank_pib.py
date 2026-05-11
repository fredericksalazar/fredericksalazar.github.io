"""Ingester World Bank — PIB Colombia.

Fuente local: data/raw/world_bank/macro_economics_indicators_2026.csv
Columnas: total_gdp_million, gdp_variation, total_gdp_percapita, poblacion,
          deuda_publica, ingresos_tributarios, gini
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

COLUMNAS_WB = [
    "total_gdp_million",
    "gdp_variation",
    "total_gdp_percapita",
    "poblacion",
    "deuda_publica",
    "ingresos_tributarios",
    "gini",
    "international_reserves",
]


def leer_pib(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col = df_col[["year"] + COLUMNAS_WB].dropna()
    df_col["year"] = df_col["year"].astype(int)
    df_col = df_col[df_col["year"] >= 1960]
    df_col["periodo"] = df_col["year"].astype(str) + "-12"

    mask = df_col[["total_gdp_million", "total_gdp_percapita"]].apply(
        lambda row: any(v != 0.0 for v in row), axis=1
    )
    df_col = df_col[mask]

    return (
        df_col[["periodo"] + COLUMNAS_WB]
        .sort_values("periodo")
        .reset_index(drop=True)
    )
