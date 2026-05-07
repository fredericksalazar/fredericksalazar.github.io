"""Exportadores: CSV histórico (idempotente) + JSON consumido por la app web.

Estructura del JSON publicado en src/data/observatorio.json:

{
  "metadata": {
    "ultima_actualizacion": ISO timestamp UTC,
    "fuentes":     { inflacion: {...}, tasa_interes: {...} },
    "definiciones": { spread, variacion, epsilon_variacion },
    "cobertura":    { primer_periodo, ultimo_periodo, total_registros }
  },
  "indicadores": {                          ← KPI cards
    "inflacion_anual":  { actual: {periodo, valor, variacion, delta}, unidad },
    "inflacion_mensual": {...},
    "tasa_interes":     {...},
    "spread":           {...}
  },
  "serie": [                                ← una fila por periodo, orden descendente (más reciente primero)
    {
      "periodo": "yyyy-mm",
      "inflacion_anual": float, "inflacion_anual_delta": float|null, "inflacion_anual_variacion": "subio|bajo|igual"|null,
      "inflacion_mensual": float, "inflacion_mensual_delta": float|null, "inflacion_mensual_variacion": str|null,
      "tasa_interes": float, "tasa_interes_delta": float|null, "tasa_interes_variacion": str|null,
      "spread": float, "spread_delta": float|null, "spread_variacion": str|null
    },
    ...
  ]
}
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import EPSILON
from ingestion.processing.historico import leer_inflacion_historica
from ingestion.sources import banrep, dane_ipc

CSV_FILENAME = "indicadores-observatorio-economico-colombia.csv"
JSON_FILENAME = "data_inflacion.json"


def actualizar_historico_csv(df_nuevo: pd.DataFrame, path: Path) -> tuple[Path, bool]:
    """Mergea df_nuevo con el CSV existente (idempotente).

    Si el periodo ya existía, prevalecen los nuevos valores (publicaciones revisadas).
    """
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        df_actual = pd.read_csv(path, dtype={"periodo": str})
        df_combinado = pd.concat([df_actual, df_nuevo], ignore_index=True)
        df_combinado = (
            df_combinado.drop_duplicates(subset=["periodo"], keep="last")
            .sort_values("periodo")
            .reset_index(drop=True)
        )
        cambios = not df_combinado.equals(df_actual)
    else:
        df_combinado = df_nuevo.sort_values("periodo").reset_index(drop=True)
        cambios = True

    df_combinado.to_csv(path, index=False)
    return path, cambios


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


CSV_COL_TO_JSON_KEY = {
    "periodo": "periodo",
    "inflacion_anual": "inflacion_anual",
    "inflacion_anual_dif": "inflacion_anual_delta",
    "inflacion_anual_var": "inflacion_anual_variacion",
    "inflacion_mensual": "inflacion_mensual",
    "inflacion_mensual_dif": "inflacion_mensual_delta",
    "inflacion_mensual_var": "inflacion_mensual_variacion",
    "tasa_interes": "tasa_interes",
    "tasa_interes_dif": "tasa_interes_delta",
    "tasa_interes_var": "tasa_interes_variacion",
    "spread": "spread",
    "spread_dif": "spread_delta",
    "spread_var": "spread_variacion",
}


def _fila_a_dict(row: pd.Series) -> dict:
    return {
        json_key: _scalar(row[csv_col])
        for csv_col, json_key in CSV_COL_TO_JSON_KEY.items()
        if csv_col in row.index
    }


def _bloque_indicador(
    df: pd.DataFrame,
    *,
    columna_valor: str,
    columna_var: str,
    columna_dif: str,
    unidad: str,
) -> dict:
    ultimo = df.iloc[-1]
    return {
        "actual": {
            "periodo": _scalar(ultimo["periodo"]),
            "valor": _scalar(ultimo[columna_valor]),
            "variacion": _scalar(ultimo[columna_var]),
            "delta": _scalar(ultimo[columna_dif]),
        },
        "unidad": unidad,
    }


def generar_observatorio_json(df: pd.DataFrame, path: Path) -> Path:
    """Genera el JSON consumido por la app Astro."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df = df.sort_values("periodo").reset_index(drop=True)

    # Cargar datos históricos del World Bank
    csv_world_bank = path.parent.parent.parent / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    historico = {}
    if csv_world_bank.exists():
        historico = leer_inflacion_historica(csv_world_bank)

    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "inflacion": {
                    "nombre": dane_ipc.FUENTE_NOMBRE,
                    "url": dane_ipc.FUENTE_URL,
                    "indicador": dane_ipc.INDICADOR_NOMBRE,
                },
                "tasa_interes": {
                    "nombre": banrep.FUENTE_NOMBRE,
                    "url": banrep.FUENTE_URL,
                    "indicador": banrep.INDICADOR_NOMBRE,
                },
            },
            "definiciones": {
                "spread": "tasa_interes − inflacion_anual (tasa de interés real ex-post, en puntos porcentuales)",
                "variacion": "subio | bajo | igual respecto al mes inmediatamente anterior",
                "epsilon_variacion": EPSILON,
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]),
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]),
                "total_registros": len(df),
            },
        },
        "indicadores": {
            "inflacion_anual": _bloque_indicador(
                df,
                columna_valor="inflacion_anual",
                columna_var="inflacion_anual_var",
                columna_dif="inflacion_anual_dif",
                unidad="%",
            ),
            "inflacion_mensual": _bloque_indicador(
                df,
                columna_valor="inflacion_mensual",
                columna_var="inflacion_mensual_var",
                columna_dif="inflacion_mensual_dif",
                unidad="%",
            ),
            "tasa_interes": _bloque_indicador(
                df,
                columna_valor="tasa_interes",
                columna_var="tasa_interes_var",
                columna_dif="tasa_interes_dif",
                unidad="%",
            ),
            "spread": _bloque_indicador(
                df,
                columna_valor="spread",
                columna_var="spread_var",
                columna_dif="spread_dif",
                unidad="pp",
            ),
        },
        "serie": [_fila_a_dict(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path
