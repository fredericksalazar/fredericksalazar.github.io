"""Ingester BanRep — TRM (Tasa Representativa del Mercado).

Consume el servicio web SDMX oficial documentado en:
https://suameca.banrep.gov.co/archivos/webservices/documento_tecnico_ws_consumo_sdmx.pdf

Dataflow DF_TRM_DAILY_HIST contiene observaciones diarias historicas. Se
agregan a promedio mensual antes de emitir, manteniendo coherencia con la
granularidad mensual del resto del observatorio.
"""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from ingestion.exceptions import FuenteNoDisponibleError

logger = logging.getLogger("observatorio")

ENDPOINT = (
    "https://totoro.banrep.gov.co/nsi-jax-ws/rest/data/"
    "ESTAT,DF_TRM_DAILY_HIST,1.0/all/ALL/"
)
TIMEOUT_SECONDS = 30
NS = {"generic": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/generic"}

FUENTE = "banrep"
INDICADOR = "trm"
FUENTE_NOMBRE = "Banco de la República de Colombia"
FUENTE_URL = "https://www.banrep.gov.co/es/estadisticas/trm"
INDICADOR_NOMBRE = "Tasa Representativa del Mercado (TRM, COP/USD)"


def _build_session() -> requests.Session:
    retry = Retry(
        total=5,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def _load_latest_snapshot(raw_root: Path) -> tuple[pd.DataFrame, str] | None:
    snap_dir = raw_root / FUENTE / INDICADOR
    if not snap_dir.is_dir():
        return None
    candidates = sorted(snap_dir.glob(f"{INDICADOR}_*.csv"))
    if not candidates:
        return None
    latest = candidates[-1]
    df = pd.read_csv(latest)
    periodo = latest.stem.removeprefix(f"{INDICADOR}_")
    return df, periodo


def fetch(
    start_year: int = 2003,
    end_year: int | None = None,
    raw_root: Path | None = None,
) -> pd.DataFrame:
    """Descarga la serie diaria de la TRM y la agrega a promedio mensual.

    Returns:
        DataFrame con columnas [periodo: str YYYY-MM, trm: float],
        ordenado cronológicamente.
    """
    if end_year is None:
        end_year = datetime.now(timezone.utc).year + 1

    params = {
        "startPeriod": str(start_year),
        "endPeriod": str(end_year + 1),
        "dimensionAtObservation": "TIME_PERIOD",
        "detail": "full",
    }

    fetch_error: str | None = None
    try:
        session = _build_session()
        resp = session.get(
            ENDPOINT,
            params=params,
            timeout=TIMEOUT_SECONDS,
            headers={"User-Agent": "observatorio-economico-colombia/0.1"},
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        fetch_error = f"HTTP error: {e}"

    if fetch_error is not None:
        if raw_root is not None:
            snapshot = _load_latest_snapshot(raw_root)
            if snapshot is not None:
                df_snap, periodo = snapshot
                logger.warning(
                    "BanRep TRM no disponible (%s) — usando snapshot %s (modo degradado)",
                    fetch_error, periodo,
                )
                return df_snap
        raise FuenteNoDisponibleError("BanRep TRM", fetch_error)

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as e:
        raise FuenteNoDisponibleError("BanRep TRM", f"XML inválido: {e}") from e

    rows: list[dict] = []
    for obs in root.iter(f"{{{NS['generic']}}}Obs"):
        dim = obs.find("generic:ObsDimension", NS)
        val = obs.find("generic:ObsValue", NS)
        if dim is None or val is None:
            continue
        periodo = dim.get("value")
        valor_str = val.get("value")
        if not periodo or not valor_str:
            continue
        try:
            valor = float(valor_str)
        except ValueError:
            continue
        rows.append({"periodo": periodo, "trm": valor})

    if not rows:
        raise FuenteNoDisponibleError("BanRep TRM", "El XML no contiene observaciones")

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["periodo"])

    # Normalizar periodo a "YYYY-MM": el endpoint puede devolver
    # "YYYY-MM-DD" (con guiones) o "YYYYMMDD" (compacto). En ambos casos
    # truncamos a los primeros 6 caracteres significativos del mes.
    sample = df["periodo"].iloc[0]
    if "-" in sample:
        df["periodo"] = df["periodo"].str[:7]
    elif len(sample) == 8 and sample.isdigit():
        df["periodo"] = df["periodo"].str[:4] + "-" + df["periodo"].str[4:6]
    elif len(sample) == 6 and sample.isdigit():
        df["periodo"] = df["periodo"].str[:4] + "-" + df["periodo"].str[4:6]

    df = df.groupby("periodo", as_index=False)["trm"].mean().round(2)
    df = df.sort_values("periodo").reset_index(drop=True)
    df = df[df["periodo"] >= f"{start_year}-01"].reset_index(drop=True)

    return df


def save_snapshot(df: pd.DataFrame, raw_root: Path) -> Path:
    out_dir = raw_root / FUENTE / INDICADOR
    out_dir.mkdir(parents=True, exist_ok=True)
    ultimo = df["periodo"].iloc[-1]
    path = out_dir / f"{INDICADOR}_{ultimo}.csv"
    df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    df = fetch(start_year=2003)
    print(f"Filas: {len(df)}")
    print(df.head())
    print("...")
    print(df.tail())