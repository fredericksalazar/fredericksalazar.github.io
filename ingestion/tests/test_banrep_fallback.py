"""Tests del modo degradado de banrep.fetch cuando el endpoint SDMX falla."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pandas as pd
import pytest
import requests

from ingestion.exceptions import FuenteNoDisponibleError
from ingestion.sources import banrep


def _http_error(*_, **__):
    raise requests.ConnectionError("upstream 500")


def _write_snapshot(raw_root: Path, periodo: str) -> None:
    snap_dir = raw_root / banrep.FUENTE / banrep.INDICADOR
    snap_dir.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame({"periodo": [periodo], "tasa_interes": [9.25]})
    df.to_csv(snap_dir / f"{banrep.INDICADOR}_{periodo}.csv", index=False)


def test_fallback_to_latest_snapshot_when_endpoint_fails(tmp_path: Path, caplog):
    _write_snapshot(tmp_path, "2026-03")
    _write_snapshot(tmp_path, "2026-04")

    with patch.object(banrep.requests.Session, "get", side_effect=_http_error):
        with caplog.at_level("WARNING", logger="observatorio"):
            df = banrep.fetch(start_year=2003, raw_root=tmp_path)

    assert list(df.columns) == ["periodo", "tasa_interes"]
    assert df["periodo"].iloc[0] == "2026-04"
    assert any("modo degradado" in r.message for r in caplog.records)


def test_raises_when_endpoint_fails_and_no_snapshot(tmp_path: Path):
    with patch.object(banrep.requests.Session, "get", side_effect=_http_error):
        with pytest.raises(FuenteNoDisponibleError):
            banrep.fetch(start_year=2003, raw_root=tmp_path)


def test_raises_when_endpoint_fails_and_no_raw_root_provided():
    with patch.object(banrep.requests.Session, "get", side_effect=_http_error):
        with pytest.raises(FuenteNoDisponibleError):
            banrep.fetch(start_year=2003)
