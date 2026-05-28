"""Exportador JSON para el dashboard de Sector Externo y Monetario.

Estructura de data_externo.json:
{
  "metadata": { fuentes, cobertura, ... },
  "indicadores": {
    "trm":              { actual: {periodo, valor, variacion, delta}, unidad: "COP/USD" },
    "reservas_netas":   { actual: {...}, unidad: "mil M USD" },
    "cuenta_corriente": { actual: {...}, unidad: "% PIB" },
    "ied":              { actual: {...}, unidad: "% PIB" },
    "deuda_externa":    { actual: {...}, unidad: "% PIB" }
  },
  "serie": [{ periodo, trm, trm_delta, trm_variacion, reservas_netas, ..., cuenta_corriente, ... }],
  "historico": {
    "trm":              { "<YYYY>": <float>, ... },
    "reservas_netas":   { "<YYYY>": <float>, ... },
    "cuenta_corriente": { "<YYYY>": <float>, ... },
    "ied":              { "<YYYY>": <float>, ... },
    "deuda_externa":    { "<YYYY>": <float>, ... }
  }
}
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ingestion.processing.consolidate import EPSILON, clasificar_variacion

JSON_FILENAME = "data_externo.json"

COLUMNAS_VALOR = ["trm", "reservas_netas", "cuenta_corriente", "ied", "deuda_externa"]
COLUMNAS_MENSUALES = ["trm"]
COLUMNAS_ANUALES = ["reservas_netas", "cuenta_corriente", "ied", "deuda_externa"]


def _scalar(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _calcular_diffs(df: pd.DataFrame) -> pd.DataFrame:
    """Calcula deltas y variaciones por columna.

    Columnas mensuales (TRM): diff fila a fila tras ordenar por periodo.
    Columnas anuales (reservas, cuenta_corriente, ied, deuda_externa): diff
    contra el valor anterior NO-NULO de la propia columna (anios sucesivos),
    no contra la fila inmediatamente anterior del df (que es mensual y puede
    estar vacia).
    """
    for col in COLUMNAS_VALOR:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.sort_values("periodo").reset_index(drop=True)

    for col in COLUMNAS_VALOR:
        if col not in df.columns:
            df[col] = None
        delta_col = f"{col}_delta"
        var_col = f"{col}_variacion"

        if col in COLUMNAS_MENSUALES:
            df[delta_col] = (df[col] - df[col].shift(1)).round(4)
        else:
            # Anual: comparar contra el valor anterior NO-NULO de la columna
            prev_non_null = df[col].ffill().shift(1)
            # Solo aplicar diff donde la fila actual tiene valor (anios con dato anual)
            df[delta_col] = (df[col] - prev_non_null).round(4)
            df.loc[df[col].isna(), delta_col] = pd.NA

        df[var_col] = df[delta_col].apply(clasificar_variacion)
    return df


def _bloque_indicador(df: pd.DataFrame, columna_valor: str, unidad: str) -> dict:
    """Toma la ultima fila donde la columna tiene valor (no-null).

    Necesario porque mezclamos series mensuales (trm) con anuales
    (cuenta_corriente, ied, deuda_externa, reservas): la ultima fila global
    suele tener nulls en los campos anuales.
    """
    sub = df[df[columna_valor].notna()]
    if sub.empty:
        return {
            "actual": {"periodo": None, "valor": None, "variacion": None, "delta": None},
            "unidad": unidad,
        }
    ultimo = sub.iloc[-1]
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
        "trm": _scalar(row.get("trm")),
        "trm_delta": _scalar(row.get("trm_delta")),
        "trm_variacion": _scalar(row.get("trm_variacion")),
        "reservas_netas": _scalar(row.get("reservas_netas")),
        "reservas_netas_delta": _scalar(row.get("reservas_netas_delta")),
        "reservas_netas_variacion": _scalar(row.get("reservas_netas_variacion")),
        "cuenta_corriente": _scalar(row.get("cuenta_corriente")),
        "cuenta_corriente_delta": _scalar(row.get("cuenta_corriente_delta")),
        "cuenta_corriente_variacion": _scalar(row.get("cuenta_corriente_variacion")),
        "ied": _scalar(row.get("ied")),
        "ied_delta": _scalar(row.get("ied_delta")),
        "ied_variacion": _scalar(row.get("ied_variacion")),
        "deuda_externa": _scalar(row.get("deuda_externa")),
        "deuda_externa_delta": _scalar(row.get("deuda_externa_delta")),
        "deuda_externa_variacion": _scalar(row.get("deuda_externa_variacion")),
    }


def _build_historico(df: pd.DataFrame) -> dict:
    """Construye el bloque historico.

    - TRM: promedio anual de todos los meses del año.
    - Reservas: valor de diciembre (cierre de año).
    - WB (cuenta_corriente, ied, deuda_externa): copia directa.
    """
    historico: dict = {col: {} for col in COLUMNAS_VALOR}

    for _, row in df.iterrows():
        year = row["periodo"][:4]
        for col in COLUMNAS_VALOR:
            if col not in df.columns:
                continue
            val = row.get(col)
            if val is None or (isinstance(val, float) and math.isnan(val)):
                continue
            if isinstance(val, (int, float)):
                val = float(val)
            else:
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    continue
            if col == "trm":
                if year in historico["trm"]:
                    historico["trm"][year].append(val)
                else:
                    historico["trm"][year] = [val]
            elif col == "reservas_netas":
                if row["periodo"].endswith("-12"):
                    historico["reservas_netas"][year] = round(float(val), 3)
            else:
                historico[col][year] = round(float(val), 2)

    for col in COLUMNAS_VALOR:
        if col == "trm":
            for year, vals in historico["trm"].items():
                historico["trm"][year] = round(sum(vals) / len(vals), 2)
        else:
            for year in list(historico[col].keys()):
                v = historico[col][year]
                if isinstance(v, list):
                    historico[col][year] = round(sum(v) / len(v), 2)

    return historico


def generar_externo_json(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    repo_root = path.parent.parent.parent

    # 1. BanRep TRM (mensual)
    from ingestion.sources.banrep_trm import fetch as fetch_trm
    try:
        df_trm = fetch_trm(start_year=2003, raw_root=repo_root / "data" / "raw")
    except Exception:
        df_trm = pd.DataFrame(columns=["periodo", "trm"])

    # 2. World Bank externo (anual): cuenta_corriente, ied, deuda_externa, reservas_netas
    from ingestion.sources.world_bank_externo import leer_externo
    csv_wb = repo_root / "data" / "raw" / "world_bank" / "macro_economics_indicators_2026.csv"
    df_wb = leer_externo(csv_wb) if csv_wb.exists() else pd.DataFrame()

    # 3. Outer merge por periodo
    if df_trm.empty and df_wb.empty:
        df = pd.DataFrame(columns=["periodo"] + COLUMNAS_VALOR)
    elif df_trm.empty:
        df = df_wb.copy()
    elif df_wb.empty:
        df = df_trm.copy()
    else:
        df = df_trm.merge(df_wb, on="periodo", how="outer")
    df = df.sort_values("periodo").reset_index(drop=True)

    # 5. Calcular deltas/variaciones
    df = _calcular_diffs(df)

    # 6. Historico
    historico = _build_historico(df)

    # 7. Construir payload
    payload = {
        "metadata": {
            "ultima_actualizacion": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "fuentes": {
                "banrep_trm": {
                    "nombre": "Banco de la Republica — TRM",
                    "url": "https://www.banrep.gov.co/es/estadisticas/trm",
                    "indicador": "Tasa Representativa del Mercado (promedio mensual)",
                },
                "banco_mundial": {
                    "nombre": "Banco Mundial — WDI",
                    "url": "https://data.worldbank.org/country/CO",
                    "indicador": "Cuenta corriente, IED, deuda externa (% PIB) y reservas internacionales (USD)",
                },
                "calculo_propio": {
                    "nombre": "Calculo propio — pipeline observatorio",
                    "url": "https://github.com/fredericksalazar/fredericksalazar.github.io",
                    "indicador": "Agregaciones mensuales y derivaciones",
                },
            },
            "definiciones": {
                "trm": "Tasa Representativa del Mercado USD/COP, promedio mensual del cierre diario.",
                "reservas_netas": "Activos externos netos del Banco de la Republica, en miles de millones de USD.",
                "cuenta_corriente": "Saldo de cuenta corriente como porcentaje del PIB (WDI BN.CAB.XOKA.GD.ZS).",
                "ied": "Inversion extranjera directa, ingresos netos, como porcentaje del PIB (WDI BX.KLT.DINV.WD.GD.ZS).",
                "deuda_externa": "Stock de deuda externa total como porcentaje del INB (WDI DT.DOD.DECT.GN.ZS).",
                "variacion": "subio | bajo | igual respecto al periodo anterior",
                "epsilon_variacion": EPSILON,
            },
            "cobertura": {
                "primer_periodo": _scalar(df["periodo"].iloc[0]) if len(df) > 0 else "",
                "ultimo_periodo": _scalar(df["periodo"].iloc[-1]) if len(df) > 0 else "",
                "total_registros": len(df),
                "granularidad": "mensual",
            },
        },
        "indicadores": {
            "trm": _bloque_indicador(df, columna_valor="trm", unidad="COP/USD"),
            "reservas_netas": _bloque_indicador(df, columna_valor="reservas_netas", unidad="mil M USD"),
            "cuenta_corriente": _bloque_indicador(df, columna_valor="cuenta_corriente", unidad="% PIB"),
            "ied": _bloque_indicador(df, columna_valor="ied", unidad="% PIB"),
            "deuda_externa": _bloque_indicador(df, columna_valor="deuda_externa", unidad="% PIB"),
        },
        "serie": [_serie_fila(row) for _, row in df.iloc[::-1].iterrows()],
        "historico": historico,
    }

    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent.parent
    out = repo / "public" / "data" / JSON_FILENAME
    generar_externo_json(out)
    print(f"Generado: {out.relative_to(repo)}")