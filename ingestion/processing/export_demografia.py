"""Exportador JSON para el dashboard Demográfico.

Estructura de data_demografia.json (contrato del Observatorio):
{
  "metadata": { ultima_actualizacion, fuentes, definiciones, cobertura },
  "indicadores": {
    "poblacion": { actual: {periodo, valor, variacion, delta}, unidad: "personas" },
    "esperanza_vida_mujeres": {..., unidad: "años"},
    "esperanza_vida_hombres": {..., unidad: "años"},
    "gini": {..., unidad: "pts"}
  },
  "serie": [...]            # DESCENDENTE (más reciente primero)
  "historico": { "1960": <poblacion>, ... }
}

A diferencia del PIB, el "actual" de cada indicador toma el ÚLTIMO período con
dato NO nulo (la cobertura difiere por métrica), evitando exponer 0.0 espurios.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import clasificar_variacion

JSON_FILENAME = "data_demografia.json"

COLUMNAS_VALOR = [
    "poblacion",
    "crecimiento_poblacion",
    "esperanza_vida_mujeres",
    "esperanza_vida_hombres",
    "brecha_esperanza_vida",
    "gini",
]


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _calcular_diffs(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("periodo").reset_index(drop=True)
    for col in COLUMNAS_VALOR:
        df[f"{col}_delta"] = (df[col] - df[col].shift(1)).round(4)
        df[f"{col}_variacion"] = df[f"{col}_delta"].apply(clasificar_variacion)
    return df


def _bloque_indicador(df: pd.DataFrame, columna_valor: str, unidad: str) -> dict:
    """Indicador 'actual' = última fila con dato NO nulo en la columna."""
    validos = df[df[columna_valor].notna()]
    if len(validos) == 0:
        return {
            "actual": {"periodo": None, "valor": None, "variacion": None, "delta": None},
            "unidad": unidad,
        }
    ultimo = validos.iloc[-1]
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
    fila = {"periodo": _scalar(row["periodo"])}
    for col in COLUMNAS_VALOR:
        fila[col] = _scalar(row.get(col))
        fila[f"{col}_delta"] = _scalar(row.get(f"{col}_delta"))
        fila[f"{col}_variacion"] = _scalar(row.get(f"{col}_variacion"))
    return fila


def generar_demografia_json(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    repo_root = path.parent.parent.parent

    from ingestion.sources.world_bank_demografia import leer_demografia
    csv_wb = repo_root / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    df = leer_demografia(csv_wb) if csv_wb.exists() else pd.DataFrame()

    df = df.rename(columns={
        "life_expectancy_women": "esperanza_vida_mujeres",
        "life_expectancy_men": "esperanza_vida_hombres",
    })

    # Cálculo propio: brecha de esperanza de vida (mujeres − hombres)
    df["brecha_esperanza_vida"] = (
        df["esperanza_vida_mujeres"] - df["esperanza_vida_hombres"]
    ).round(2)

    # Cálculo propio: tasa de crecimiento poblacional anual (% YoY)
    df = df.sort_values("periodo").reset_index(drop=True)
    df["crecimiento_poblacion"] = (df["poblacion"].pct_change() * 100).round(2)

    df = _calcular_diffs(df)

    # Histórico anual de población (para el chart con toggle por presidente)
    historico: dict[str, float] = {}
    for _, row in df.iterrows():
        valor = _scalar(row.get("poblacion"))
        if valor is not None and valor > 0:
            historico[row["periodo"][:4]] = int(valor)

    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "banco_mundial": {
                    "nombre": "Banco Mundial — World Development Indicators",
                    "url": "https://data.worldbank.org/country/colombia",
                    "indicador": "Población total, esperanza de vida al nacer (hombres/mujeres) y coeficiente de Gini",
                },
                "calculo_propio": {
                    "nombre": "Cálculo propio · Banco Mundial",
                    "url": "https://data.worldbank.org/country/colombia",
                    "indicador": "Brecha de esperanza de vida (mujeres − hombres)",
                },
            },
            "definiciones": {
                "poblacion": "Población total de Colombia a mitad de año (personas).",
                "crecimiento_poblacion": "Tasa de crecimiento poblacional anual, variación porcentual respecto al año anterior.",
                "esperanza_vida_mujeres": "Esperanza de vida al nacer de las mujeres (años).",
                "esperanza_vida_hombres": "Esperanza de vida al nacer de los hombres (años).",
                "brecha_esperanza_vida": "Diferencia en años entre la esperanza de vida de mujeres y hombres.",
                "gini": "Coeficiente de Gini (0 = igualdad perfecta, 100 = desigualdad total).",
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]) if len(df) > 0 else "",
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]) if len(df) > 0 else "",
                "total_registros": len(df),
                "granularidad": "anual",
            },
        },
        "indicadores": {
            "poblacion": _bloque_indicador(df, "poblacion", "personas"),
            "esperanza_vida_mujeres": _bloque_indicador(df, "esperanza_vida_mujeres", "años"),
            "esperanza_vida_hombres": _bloque_indicador(df, "esperanza_vida_hombres", "años"),
            "gini": _bloque_indicador(df, "gini", "pts"),
        },
        "serie": [_serie_fila(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent.parent
    out = repo / "public" / "data" / JSON_FILENAME
    generar_demografia_json(out)
    print(f"Generado: {out.relative_to(repo)}")
