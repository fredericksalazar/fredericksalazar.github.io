"""Orquestador del pipeline de ingesta del Observatorio Económico Colombia.

Encadena: BanRep → DANE → consolidación → export CSV + JSON.

Uso:
    python -m ingestion.main
    python -m ingestion.main --start-year 2003 --no-snapshot
    python -m ingestion.main --dry-run
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from ingestion.exceptions import FuenteNoDisponibleError
from ingestion.processing.consolidate import consolidar
from ingestion.processing.export import (
    CSV_FILENAME,
    JSON_FILENAME,
    actualizar_historico_csv,
    generar_observatorio_json,
)
from ingestion.sources import banrep, dane_ipc

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = REPO_ROOT / "data"
DEFAULT_WEB_DATA_DIR = REPO_ROOT / "src" / "data"

logger = logging.getLogger("observatorio")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="ingestion",
        description="Pipeline de ingesta del Observatorio Económico Colombia",
    )
    p.add_argument("--start-year", type=int, default=2003,
                   help="Año inicial del histórico (default: 2003)")
    p.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR,
                   help="Directorio de datos crudos y procesados")
    p.add_argument("--web-data-dir", type=Path, default=DEFAULT_WEB_DATA_DIR,
                   help="Directorio donde Astro lee el JSON")
    p.add_argument("--no-snapshot", action="store_true",
                   help="No guardar snapshots crudos en data/raw/")
    p.add_argument("--dry-run", action="store_true",
                   help="Ejecutar pipeline sin escribir archivos")
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args(argv)


def run(args: argparse.Namespace) -> int:
    logger.info("Descargando BanRep (tasa de intervención)...")
    df_banrep = banrep.fetch(start_year=args.start_year)
    logger.info("BanRep: %d filas (%s → %s)",
                len(df_banrep), df_banrep["periodo"].iloc[0], df_banrep["periodo"].iloc[-1])

    logger.info("Descargando DANE (IPC)...")
    df_dane = dane_ipc.fetch(start_year=args.start_year)
    logger.info("DANE: %d filas (%s → %s)",
                len(df_dane), df_dane["periodo"].iloc[0], df_dane["periodo"].iloc[-1])

    if not args.no_snapshot and not args.dry_run:
        raw_root = args.data_dir / "raw"
        snap_banrep = banrep.save_snapshot(df_banrep, raw_root)
        snap_dane = dane_ipc.save_snapshot(df_dane, raw_root)
        logger.info("Snapshot BanRep: %s", snap_banrep.relative_to(REPO_ROOT))
        logger.info("Snapshot DANE: %s", snap_dane.relative_to(REPO_ROOT))

    logger.info("Consolidando...")
    df = consolidar(df_banrep, df_dane)
    logger.info("Histórico unificado: %d filas (%s → %s)",
                len(df), df["periodo"].iloc[0], df["periodo"].iloc[-1])

    ultimo = df.iloc[-1]
    logger.info(
        "Último periodo %s — Inflación anual: %.2f%% (%s) | Tasa: %.2f%% (%s) | Spread: %.2f (%s)",
        ultimo["periodo"],
        ultimo["inflacion_anual"], ultimo["inflacion_anual_var"],
        ultimo["tasa_interes"], ultimo["tasa_interes_var"],
        ultimo["spread"], ultimo["spread_var"],
    )

    if args.dry_run:
        logger.info("[dry-run] No se escribieron archivos.")
        return 0

    csv_path = args.data_dir / "processed" / CSV_FILENAME
    _, cambios = actualizar_historico_csv(df, csv_path)
    logger.info("CSV: %s %s", csv_path.relative_to(REPO_ROOT),
                "(actualizado)" if cambios else "(sin cambios)")

    json_path = args.web_data_dir / JSON_FILENAME
    generar_observatorio_json(df, json_path)
    logger.info("JSON: %s", json_path.relative_to(REPO_ROOT))

    return 0


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    try:
        return run(args)
    except FuenteNoDisponibleError as e:
        logger.error("Fuente no disponible: %s", e)
        return 2
    except Exception:
        logger.exception("Error inesperado")
        return 1


if __name__ == "__main__":
    sys.exit(main())
