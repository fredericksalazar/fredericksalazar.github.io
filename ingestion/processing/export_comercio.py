"""Exportador JSON para el dashboard de Comercio Exterior.

Estructura de data_comercio.json:
{
  "metadata": { fuentes, cobertura, ... },
  "indicadores": {
    "exportaciones": { actual: {..., delta: YoY}, unidad: "% PIB" },
    "importaciones": {...},
    "balanza_comercial": {...},
    "apertura": {...},
    "ied": {...}
  },
  "serie": [{ periodo, exportaciones, exportaciones_delta, ..., balanza_comercial, apertura, ied }],
  "historico": { "1960": {...} },
  "matriz_exportaciones": { "combustibles": {...}, "agropecuarios": {...}, ... },
  "matriz_importaciones": { "manufacturas": {...}, ... }
}
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import EPSILON, clasificar_variacion

JSON_FILENAME = "data_comercio.json"

COLUMNAS_VALOR = ["exportaciones", "importaciones", "balanza_comercial", "apertura", "ied"]


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _calcular_diffs(df: pd.DataFrame) -> pd.DataFrame:
    """Diffs interanuales (shift 1 porque los datos son anuales)."""
    df = df.sort_values("periodo").reset_index(drop=True)
    for col in COLUMNAS_VALOR:
        delta_col = f"{col}_delta"
        var_col = f"{col}_variacion"
        df[delta_col] = (df[col] - df[col].shift(1)).round(4)
        df[var_col] = df[delta_col].apply(clasificar_variacion)
    return df


def _bloque_indicador(df: pd.DataFrame, columna_valor: str, unidad: str) -> dict:
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
        "exportaciones": _scalar(row.get("exportaciones")),
        "exportaciones_delta": _scalar(row.get("exportaciones_delta")),
        "exportaciones_variacion": _scalar(row.get("exportaciones_variacion")),
        "importaciones": _scalar(row.get("importaciones")),
        "importaciones_delta": _scalar(row.get("importaciones_delta")),
        "importaciones_variacion": _scalar(row.get("importaciones_variacion")),
        "balanza_comercial": _scalar(row.get("balanza_comercial")),
        "balanza_comercial_delta": _scalar(row.get("balanza_comercial_delta")),
        "balanza_comercial_variacion": _scalar(row.get("balanza_comercial_variacion")),
        "apertura": _scalar(row.get("apertura")),
        "apertura_delta": _scalar(row.get("apertura_delta")),
        "apertura_variacion": _scalar(row.get("apertura_variacion")),
        "ied": _scalar(row.get("ied")),
        "ied_delta": _scalar(row.get("ied_delta")),
        "ied_variacion": _scalar(row.get("ied_variacion")),
    }


def generar_comercio_json(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    repo_root = path.parent.parent.parent

    # 1. World Bank
    from ingestion.sources.world_bank_comercio import leer_comercio
    csv_wb = repo_root / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    df = leer_comercio(csv_wb) if csv_wb.exists() else pd.DataFrame()

    # 2. Renombrar columnas
    df = df.rename(columns={
        "exports_of_goods_and_services": "exportaciones",
        "imports_of_goods_and_services": "importaciones",
        "cuenta_corriente": "balanza_comercial",
        "foreign_direct_investment": "ied",
    })

    # 3. Calcular derivados
    df["apertura"] = (df["exportaciones"] + df["importaciones"]).round(4)
    df = _calcular_diffs(df)

    # 4. Histórico (año → valores)
    historico: dict[str, float] = {}
    for _, row in df.iterrows():
        year = row["periodo"][:4]
        if year not in historico:
            for col in COLUMNAS_VALOR:
                val = row[col]
                if val is not None and val != 0:
                    key = f"{year}_{col}"
                    continue
            # Simplificado: guardamos exportaciones como proxy histórico
            pass

    # Construir histórico simple: año → exportaciones
    for _, row in df.iterrows():
        year = row["periodo"][:4]
        v = row["exportaciones"]
        if v is not None and v != 0:
            historico[year] = round(v, 2)

    # 5. Intentar DANE (degradación graceful)
    matriz_exp: dict = {}
    matriz_imp: dict = {}
    productos_trad: dict = {}
    try:
        from ingestion.sources.dane_comercio import (
            fetch_omc_exportaciones,
            fetch_omc_importaciones,
            fetch_productos_tradicionales,
            resumir_por_anio,
        )
        exp_omc = fetch_omc_exportaciones()
        imp_omc = fetch_omc_importaciones()
        prod_trad = fetch_productos_tradicionales()
        if exp_omc:
            matriz_exp = resumir_por_anio(exp_omc) or {}
        if imp_omc:
            matriz_imp = resumir_por_anio(imp_omc) or {}
        if prod_trad:
            productos_trad = resumir_por_anio(prod_trad) or {}
    except Exception:
        pass

    # 6. Construir payload
    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "comercio": {
                    "nombre": "Banco Mundial — World Development Indicators",
                    "url": "https://data.worldbank.org/",
                    "indicador": "Exportaciones e importaciones de bienes y servicios (% del PIB)",
                },
                "dane": {
                    "nombre": "DANE — Comercio Internacional",
                    "url": "https://www.dane.gov.co/index.php/estadisticas-por-tema/comercio-internacional",
                    "indicador": "Exportaciones e importaciones (OMC, Balanza Comercial)",
                },
            },
            "definiciones": {
                "balanza_comercial": "cuenta corriente del Banco Mundial (% PIB). Negativa = déficit.",
                "apertura": "exportaciones + importaciones (% PIB). Refleja grado de integración al comercio mundial.",
                "variacion": "subio | bajo | igual respecto al año inmediatamente anterior",
                "epsilon_variacion": EPSILON,
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]) if len(df) > 0 else "",
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]) if len(df) > 0 else "",
                "total_registros": len(df),
                "granularidad": "anual",
            },
        },
        "indicadores": {
            "exportaciones": _bloque_indicador(df, columna_valor="exportaciones", unidad="% PIB"),
            "importaciones": _bloque_indicador(df, columna_valor="importaciones", unidad="% PIB"),
            "balanza_comercial": _bloque_indicador(df, columna_valor="balanza_comercial", unidad="% PIB"),
            "apertura": _bloque_indicador(df, columna_valor="apertura", unidad="% PIB"),
            "ied": _bloque_indicador(df, columna_valor="ied", unidad="% PIB"),
        },
        "serie": [_serie_fila(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
        "matriz_exportaciones": matriz_exp,
        "matriz_importaciones": matriz_imp,
        "productos_tradicionales": productos_trad,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent.parent
    out = repo / "src" / "data" / JSON_FILENAME
    generar_comercio_json(out)
    print(f"Generado: {out.relative_to(repo)}")
