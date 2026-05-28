"""Ingester World Bank - Sector Externo Colombia.

Fuente local: data/raw/world_bank/macro_economics_indicators_2026.csv
Columnas:
  - cuenta_corriente             (% PIB)  WDI BN.CAB.XOKA.GD.ZS
  - foreign_direct_investment    (% PIB)  WDI BX.KLT.DINV.WD.GD.ZS
  - external_debt_pct_gdp        (% PIB)  WDI DT.DOD.DECT.GN.ZS
  - international_reserves       (USD)    WDI FI.RES.TOTL.CD

Las reservas en el CSV vienen en USD; se convierten a miles de millones USD
(division por 1e9) para presentacion mas legible en el dashboard.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

COLUMNAS_CSV = [
    "cuenta_corriente",
    "foreign_direct_investment",
    "external_debt_pct_gdp",
    "international_reserves",
]


def leer_externo(csv_path: Path) -> pd.DataFrame:
    """Devuelve DataFrame anual con columnas [periodo, cuenta_corriente, ied, deuda_externa, reservas_netas].

    - cuenta_corriente, ied, deuda_externa: porcentaje del PIB.
    - reservas_netas: miles de millones de USD.
    Dato anual; filtra anios con todos los campos en cero/nulos.
    """
    df = pd.read_csv(csv_path, sep=";", decimal=",")
    df_col = df[df["country_name"] == "COLOMBIA"].copy()
    df_col = df_col[["year"] + COLUMNAS_CSV].copy()
    df_col["year"] = df_col["year"].astype(int)
    df_col = df_col[df_col["year"] >= 1960]
    df_col["periodo"] = df_col["year"].astype(str) + "-12"

    df_col = df_col.rename(columns={
        "foreign_direct_investment": "ied",
        "external_debt_pct_gdp": "deuda_externa",
        "international_reserves": "reservas_netas",
    })

    df_col["reservas_netas"] = (df_col["reservas_netas"] / 1e9).round(2)

    cols_final = ["cuenta_corriente", "ied", "deuda_externa", "reservas_netas"]
    # Filtra filas donde TODOS los campos son cero o nulos (anios sin publicar).
    # `v != 0.0` evalua True para NaN: por eso convertimos NaN -> 0 antes.
    df_check = df_col[cols_final].fillna(0.0)
    mask = df_check.apply(lambda row: any(v != 0.0 for v in row), axis=1)
    df_col = df_col[mask]

    return (
        df_col[["periodo"] + cols_final]
        .sort_values("periodo")
        .reset_index(drop=True)
    )
