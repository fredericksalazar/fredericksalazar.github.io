"""Consolidación: diffs mes a mes, clasificación, spread."""

from __future__ import annotations

from typing import Literal

import pandas as pd

VariationType = Literal["subio", "bajo", "igual"]
EPSILON = 0.001  # tolerancia para evitar ruido de coma flotante


def clasificar_variacion(dif: float | None, eps: float = EPSILON) -> VariationType | None:
    """Clasifica una diferencia como subió/bajó/igual."""
    if dif is None or pd.isna(dif):
        return None
    if dif > eps:
        return "subio"
    if dif < -eps:
        return "bajo"
    return "igual"


def calcular_diffs(df: pd.DataFrame, columnas: list[str]) -> pd.DataFrame:
    """Añade columnas {col}_dif y {col}_var para cada métrica.

    Asume df ordenado cronológicamente por 'periodo'.
    """
    df = df.sort_values("periodo").reset_index(drop=True)
    for col in columnas:
        dif_col = f"{col}_dif"
        var_col = f"{col}_var"
        df[dif_col] = (df[col] - df[col].shift(1)).round(4)
        df[var_col] = df[dif_col].apply(clasificar_variacion)
    return df


def calcular_spread(df: pd.DataFrame) -> pd.DataFrame:
    """Calcula spread = tasa_interes - inflacion_anual y su variación."""
    df = df.copy()
    df["spread"] = (df["tasa_interes"] - df["inflacion_anual"]).round(4)
    df["spread_dif"] = (df["spread"] - df["spread"].shift(1)).round(4)
    df["spread_var"] = df["spread_dif"].apply(clasificar_variacion)
    return df


def merge_fuentes(df_banrep: pd.DataFrame, df_dane: pd.DataFrame) -> pd.DataFrame:
    """Une ambas fuentes por periodo (YYYY-MM)."""
    df = df_dane.merge(df_banrep, on="periodo", how="outer")
    return df.sort_values("periodo").reset_index(drop=True)


def consolidar(df_banrep: pd.DataFrame, df_dane: pd.DataFrame) -> pd.DataFrame:
    """Pipeline completo: merge → diffs → spread.

    Devuelve solo filas donde existen ambos indicadores y spread es calculable.
    """
    df = merge_fuentes(df_banrep, df_dane)
    df = calcular_diffs(df, ["inflacion_anual", "tasa_interes"])
    df = calcular_spread(df)
    df = df.dropna(subset=["inflacion_anual", "tasa_interes"]).reset_index(drop=True)
    df = calcular_diffs(df, ["inflacion_mensual"])

    column_order = [
        "periodo",
        "inflacion_anual", "inflacion_anual_dif", "inflacion_anual_var",
        "inflacion_mensual", "inflacion_mensual_dif", "inflacion_mensual_var",
        "tasa_interes", "tasa_interes_dif", "tasa_interes_var",
        "spread", "spread_dif", "spread_var",
    ]
    return df[[c for c in column_order if c in df.columns]]
