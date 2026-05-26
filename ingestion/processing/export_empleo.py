"""Exportador JSON para el dashboard de Empleo.

Estructura del JSON publicado en src/data/data_empleo.json:

{
  "metadata": {
    "ultima_actualizacion": ISO timestamp UTC,
    "fuentes": { empleo: {...}, historico: {...} },
    "definiciones": { variacion, epsilon_variacion },
    "cobertura": { primer_periodo, ultimo_periodo, total_registros, granularidad },
    "notas": "..."
  },
  "indicadores": {
    "tasa_desempleo": { actual: {periodo, valor, variacion, delta}, unidad },
    "tgp": {...},
    "to": {...},
    "informalidad": {...}
  },
  "serie": [periodo, tasa_desempleo, tasa_desempleo_delta, tasa_desempleo_variacion, ...],
  "historico": { "2001": 15.0, ... }
}
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import EPSILON, clasificar_variacion

JSON_FILENAME = "data_empleo.json"

COLUMNAS_VALOR = ["tasa_desempleo", "tgp", "to", "subempleo", "informalidad"]


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _calcular_diffs(df: pd.DataFrame) -> pd.DataFrame:
    """Añade columnas {col}_delta y {col}_variacion para cada indicador.
    
    Comparación interanual (shift 12): variación respecto al mismo mes del año anterior.
    Práctica estándar internacional (DANE, BLS, Eurostat) para eliminar estacionalidad.
    """
    df = df.sort_values("periodo").reset_index(drop=True)
    for col in COLUMNAS_VALOR:
        delta_col = f"{col}_delta"
        var_col = f"{col}_variacion"
        df[delta_col] = (df[col] - df[col].shift(12)).round(4)
        df[var_col] = df[delta_col].apply(clasificar_variacion)
    return df


def _bloque_indicador(
    df: pd.DataFrame,
    *,
    columna_valor: str,
    unidad: str,
) -> dict:
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
        "tasa_desempleo": _scalar(row.get("tasa_desempleo")),
        "tasa_desempleo_delta": _scalar(row.get("tasa_desempleo_delta")),
        "tasa_desempleo_variacion": _scalar(row.get("tasa_desempleo_variacion")),
        "tgp": _scalar(row.get("tgp")),
        "tgp_delta": _scalar(row.get("tgp_delta")),
        "tgp_variacion": _scalar(row.get("tgp_variacion")),
        "to": _scalar(row.get("to")),
        "to_delta": _scalar(row.get("to_delta")),
        "to_variacion": _scalar(row.get("to_variacion")),
        "subempleo": _scalar(row.get("subempleo")),
        "subempleo_delta": _scalar(row.get("subempleo_delta")),
        "subempleo_variacion": _scalar(row.get("subempleo_variacion")),
        "informalidad": _scalar(row.get("informalidad")),
        "informalidad_delta": _scalar(row.get("informalidad_delta")),
        "informalidad_variacion": _scalar(row.get("informalidad_variacion")),
    }


def generar_empleo_json(path: Path) -> Path:
    """Genera data_empleo.json combinando DANE GEIH + World Bank histórico."""
    path.parent.mkdir(parents=True, exist_ok=True)
    repo_root = path.parent.parent.parent

    # 1. DANE GEIH (mensual, fuente primaria)
    try:
        from ingestion.sources.dane_empleo import fetch as fetch_dane
        df_dane = fetch_dane()
    except Exception:
        df_dane = pd.DataFrame()
    if df_dane.empty:
        df_dane = pd.DataFrame(columns=COLUMNAS_VALOR + ["periodo"])

    # 2. World Bank (anual, complemento histórico)
    try:
        from ingestion.sources.world_bank_empleo import fetch_anual, leer_desempleo_historico
    except ImportError:
        fetch_anual = lambda _: pd.DataFrame()  # type: ignore[assignment]
        leer_desempleo_historico = lambda _: {}  # type: ignore[assignment]
    csv_wb = repo_root / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    df_wb = fetch_anual(csv_wb) if csv_wb.exists() else pd.DataFrame()
    historico = leer_desempleo_historico(csv_wb) if csv_wb.exists() else {}

    # 3. Merge: DANE tiene precedencia sobre WB en periodos solapados
    if not df_dane.empty and not df_wb.empty:
        df = pd.concat([df_wb, df_dane], ignore_index=True)
        df = df.drop_duplicates(subset=["periodo"], keep="last")
    elif not df_dane.empty:
        df = df_dane
    elif not df_wb.empty:
        df = df_wb
    else:
        df = pd.DataFrame(columns=COLUMNAS_VALOR + ["periodo"])

    # Asegurar que todas las columnas existan (WB solo tiene tasa_desempleo)
    for col in COLUMNAS_VALOR:
        if col not in df.columns:
            df[col] = float("nan")
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.sort_values("periodo").reset_index(drop=True)

    # 4. Calcular diffs y variaciones
    df = _calcular_diffs(df)

    # 5. Armar payload
    try:
        from ingestion.sources.dane_empleo import FUENTE_NOMBRE as DANE_NOMBRE, FUENTE_URL as DANE_URL, INDICADOR_NOMBRE
    except ImportError:
        DANE_NOMBRE = "DANE — Gran Encuesta Integrada de Hogares (GEIH)"
        DANE_URL = "https://www.dane.gov.co/index.php/estadisticas-por-tema/mercado-laboral/empleo-y-desempleo"
        INDICADOR_NOMBRE = "Mercado laboral — GEIH"
    try:
        from ingestion.sources.world_bank_empleo import FUENTE_NOMBRE as WB_NOMBRE, FUENTE_URL as WB_URL, INDICADOR_NOMBRE as WB_INDICADOR
    except ImportError:
        WB_NOMBRE = "Banco Mundial — World Development Indicators"
        WB_URL = "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=CO"
        WB_INDICADOR = "Tasa de desempleo modelada por la OIT"

    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "empleo": {
                    "nombre": DANE_NOMBRE,
                    "url": DANE_URL,
                    "indicador": INDICADOR_NOMBRE,
                },
                "historico": {
                    "nombre": WB_NOMBRE,
                    "url": WB_URL,
                    "indicador": WB_INDICADOR,
                },
            },
            "definiciones": {
                "variacion": "subio | bajo | igual respecto al periodo inmediatamente anterior",
                "epsilon_variacion": EPSILON,
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]) if len(df) > 0 else "",
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]) if len(df) > 0 else "",
                "total_registros": len(df),
                "granularidad": "mensual" if not df_dane.empty else "anual",
            },
            "notas": (
                "Datos mensuales provenientes de la GEIH (DANE). "
                "Datos anuales históricos del Banco Mundial (OMS/OIT). "
                "El pipeline intenta DANE primero; si no está disponible "
                "degrada a solo Banco Mundial."
            ),
        },
        "indicadores": {
            "tasa_desempleo": _bloque_indicador(df, columna_valor="tasa_desempleo", unidad="%"),
            "tgp": _bloque_indicador(df, columna_valor="tgp", unidad="%"),
            "to": _bloque_indicador(df, columna_valor="to", unidad="%"),
            "subempleo": _bloque_indicador(df, columna_valor="subempleo", unidad="%"),
            "informalidad": _bloque_indicador(df, columna_valor="informalidad", unidad="%"),
        },
        "serie": [_serie_fila(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent.parent
    out = repo / "public" / "data" / JSON_FILENAME
    generar_empleo_json(out)
    print(f"Generado: {out.relative_to(repo)}")
