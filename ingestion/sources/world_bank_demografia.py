"""Ingester World Bank — Demografía Colombia.

Fuente local: data/raw/world_bank/macro_economics_indicators_2026.csv
Columnas: poblacion, life_expectancy_women, life_expectancy_men, gini

A diferencia de `world_bank_pib.leer_pib`, este reader NO hace `dropna` global:
cada indicador demográfico tiene cobertura distinta (población 1960→2024,
esperanza de vida 1960→2022, Gini ~1995→2023). Se conservan todas las filas con
al menos un dato y se nulifican por columna los placeholders del CSV (0,00 y
-100,00) — REGLA 7 del Observatorio (nulls explícitos, no ceros espurios).
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

COLUMNAS_DEMO = [
    "poblacion",
    "life_expectancy_women",
    "life_expectancy_men",
    "gini",
]

# Valores que el CSV usa como "sin dato" y deben tratarse como NaN.
PLACEHOLDERS = (0.0, -100.0)


def leer_demografia(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col["year"] = df_col["year"].astype(int)
    df_col = df_col[df_col["year"] >= 1960]
    df_col["periodo"] = df_col["year"].astype(str) + "-12"

    out = df_col[["periodo"] + COLUMNAS_DEMO].copy()
    for col in COLUMNAS_DEMO:
        out[col] = pd.to_numeric(out[col], errors="coerce")
        out[col] = out[col].mask(out[col].isin(PLACEHOLDERS))

    return (
        out.dropna(subset=COLUMNAS_DEMO, how="all")
        .sort_values("periodo")
        .reset_index(drop=True)
    )
