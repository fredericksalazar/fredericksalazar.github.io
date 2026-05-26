"""Ingester BanRep — Tasa de intervención de política monetaria (TPM mensual).

Consume el servicio web SDMX oficial documentado en:
https://suameca.banrep.gov.co/archivos/webservices/documento_tecnico_ws_consumo_sdmx.pdf
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
    "ESTAT,DF_CBR_MONTHLY_HIST,1.0/all/ALL/"
)
TIMEOUT_SECONDS = 30
NS = {"generic": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/generic"}

FUENTE = "banrep"
INDICADOR = "tasa-interes"
FUENTE_NOMBRE = "Banco de la República de Colombia"
FUENTE_URL = "https://www.banrep.gov.co/es/estadisticas/tasas-de-interes-de-politica-monetaria"
INDICADOR_NOMBRE = "Tasa de intervención de política monetaria (TPM)"


def _build_session() -> requests.Session:
    """Sesión con retries y backoff para tolerar 5xx transitorios del endpoint SDMX."""
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
    """Devuelve (df, periodo) del último snapshot disponible, o None si no hay ninguno."""
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
    """Descarga la serie histórica mensual de la tasa de intervención.

    Si el endpoint falla tras los reintentos y se pasa ``raw_root``, intenta
    devolver el último snapshot guardado (modo degradado, log de warning).

    Returns:
        DataFrame con columnas [periodo: str YYYY-MM, tasa_interes: float],
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
                    "BanRep no disponible (%s) — usando snapshot %s (modo degradado)",
                    fetch_error, periodo,
                )
                return df_snap
        raise FuenteNoDisponibleError("BanRep", fetch_error)

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as e:
        raise FuenteNoDisponibleError("BanRep", f"XML inválido: {e}") from e

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
        rows.append({"periodo": periodo, "tasa_interes": valor})

    if not rows:
        raise FuenteNoDisponibleError("BanRep", "El XML no contiene observaciones")

    df = pd.DataFrame(rows).drop_duplicates(subset=["periodo"]).sort_values("periodo")
    df = df.reset_index(drop=True)

    # Filtrar al rango pedido (el servicio a veces ignora startPeriod parcialmente)
    df = df[df["periodo"] >= f"{start_year}-01"].reset_index(drop=True)

    return df


def save_snapshot(df: pd.DataFrame, raw_root: Path) -> Path:
    """Guarda snapshot crudo en data/raw/{fuente}/{indicador}/{indicador}_{yyyy-mm}.csv."""
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
