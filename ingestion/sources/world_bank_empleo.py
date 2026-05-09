"""Ingester World Bank — tasa de desempleo anual de Colombia.

Fuente local: data/raw/world_bank/macro_economics_indicators_2026.csv
Columna: unemployment_rate
Cobertura útil: 2001 → último año reportado.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

FUENTE_NOMBRE = "Banco Mundial — World Development Indicators"
FUENTE_URL = "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=CO"
INDICADOR_NOMBRE = "Tasa de desempleo modelada por la OIT (% PEA, anual)"


def leer_desempleo_historico(csv_path: Path) -> dict[str, float]:
    """Devuelve dict {año: tasa_desempleo} para Colombia.

    Filtra años con valor 0 o NaN (datos incompletos).
    """
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col = df_col[["year", "unemployment_rate"]].dropna()
    df_col = df_col[df_col["unemployment_rate"] > 0]
    df_col["year"] = df_col["year"].astype(int).astype(str)
    return dict(zip(df_col["year"], df_col["unemployment_rate"].round(2)))


def fetch_anual(csv_path: Path) -> pd.DataFrame:
    """Devuelve DataFrame con columnas [periodo (yyyy-12), tasa_desempleo].

    Los periodos se anclan a diciembre de cada año para que sean compatibles
    con la convención YYYY-MM del resto del observatorio.
    """
    historico = leer_desempleo_historico(csv_path)
    rows = [
        {"periodo": f"{year}-12", "tasa_desempleo": valor}
        for year, valor in sorted(historico.items())
    ]
    return pd.DataFrame(rows)
