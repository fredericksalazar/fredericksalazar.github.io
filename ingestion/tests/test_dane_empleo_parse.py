"""Tests del parser del anexo GEIH (dane_empleo._parse_anexo)."""
from __future__ import annotations

import io

import openpyxl

from ingestion.sources import dane_empleo


def _anexo(meses: list[str], td: list[float]) -> bytes:
    """Arma un anexo mínimo con el layout de la hoja 'Total nacional'."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Total nacional"
    for _ in range(11):
        ws.append([None])
    ws.append(["Concepto", 2020] + [None] * (len(meses) - 1) + [None])
    ws.append([None] + meses + [None])  # columna final vacía, como en DANE
    ws.append(["Tasa Global de Participación (TGP)"] + [60.0] * len(meses))
    ws.append(["Tasa de Ocupación (TO)"] + [50.0] * len(meses))
    ws.append(["Tasa de Desocupación (TD)"] + td)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_meses_con_asterisco_no_corren_la_serie():
    # DANE marca mar-jul 2020 con '*'; antes se descartaban y todo lo
    # posterior quedaba leído 5 columnas a la izquierda.
    meses = ["Feb", "Mar*", "Abr*", "May*", "Jun*", "Jul*", "Ago"]
    td = [12.0, 13.0, 20.0, 21.0, 20.5, 20.9, 17.4]

    df = dane_empleo._parse_anexo(_anexo(meses, td)).set_index("periodo")

    assert list(df.index) == [f"2020-{m:02d}" for m in range(2, 9)]
    assert df.loc["2020-04", "tasa_desempleo"] == 20.0
    assert df.loc["2020-08", "tasa_desempleo"] == 17.4
