"""Procesamiento de datos históricos del World Bank.

Lee el CSV de indicadores macroeconómicos, filtra Colombia
y devuelve un dict año → inflación para anexar al JSON.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


def leer_inflacion_historica(csv_path: Path) -> dict[str, float]:
    """Lee el CSV de World Bank y devuelve dict {año: inflación} para Colombia.

    Filtra registros con inflation_rate == 0 o NaN (datos incompletos).
    """
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col = df_col[["year", "inflation_rate"]].dropna()
    df_col = df_col[df_col["inflation_rate"] > 0]
    df_col["year"] = df_col["year"].astype(int).astype(str)
    return dict(zip(df_col["year"], df_col["inflation_rate"].round(2)))
