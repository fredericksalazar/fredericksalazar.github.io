"""Pipeline: extrae el histórico del salario mínimo mensual legal vigente (SMMLV)
de Colombia y genera public/data/data_salario_minimo.json.

Fuente:
- https://es.wikipedia.org/wiki/Anexo:Salario_m%C3%ADnimo_en_Colombia
  (tabla compilada de los decretos anuales del Ministerio del Trabajo /
  Gobierno nacional; el salario mínimo se fija por decreto cada diciembre).

La serie publicada arranca en 1984, año en que el salario mínimo quedó
unificado para todos los sectores de la economía (antes había valores por
sector/zona y la tabla solo trae muestras por década).

NO se inventa ningún número: los valores se leen de la tabla y se validan
contra un conjunto de anclas tomadas directamente de los decretos. Si un
ancla no coincide o la serie deja de ser monótona no decreciente, el
pipeline falla en vez de publicar datos corruptos.

Ejecutar desde la raíz del repo:
    python3 -m pipeline.salario_minimo.from_wikipedia
"""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

JSON_FILENAME = "data_salario_minimo.json"
CACHE = Path("/tmp/wiki_salario_minimo.html")

PAGE = "Anexo:Salario_mínimo_en_Colombia"
API_URL = (
    "https://es.wikipedia.org/w/api.php?action=parse"
    f"&page={urllib.parse.quote(PAGE)}&format=json&formatversion=2&prop=text"
)

FUENTE_URL = "https://es.wikipedia.org/wiki/Anexo:Salario_m%C3%ADnimo_en_Colombia"

PRIMER_ANIO = 1984
NOW_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")

# Valores ancla verificados contra los decretos anuales (Mintrabajo /
# Gobierno nacional). Si la tabla de Wikipedia es vandalizada o cambia de
# estructura, el pipeline aborta.
ANCLAS_SMLV = {
    1984: 11_298,
    2000: 260_100,
    2010: 515_000,
    2022: 1_000_000,
    2025: 1_423_500,
    2026: 1_750_905,  # Decretos 1469/1470 del 29-dic-2025
}
ANCLAS_AUXILIO = {
    2025: 200_000,
    2026: 249_095,
}


def fetch_html() -> str:
    if CACHE.exists():
        return CACHE.read_text(encoding="utf-8")
    req = urllib.request.Request(API_URL, headers={"User-Agent": "observatorio-pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    text = payload["parse"]["text"]
    CACHE.write_text(text, encoding="utf-8")
    return text


def _clean_cell(raw: str) -> str:
    """Quita refs, tags y entidades de una celda; devuelve texto plano."""
    raw = re.sub(r"<sup\b.*?</sup>", "", raw, flags=re.DOTALL)
    raw = re.sub(r"<[^>]+>", "", raw)
    raw = html.unescape(raw)
    return raw.replace("\xa0", " ").strip()


def _parse_cop(texto: str) -> int | None:
    """Convierte '$1 160 000', '$162.000' o '' en entero COP, o None."""
    digits = re.sub(r"\D", "", texto)
    if not digits:
        return None
    valor = int(digits)
    return valor if valor >= 100 else None


def parse_tabla(html_text: str) -> dict[int, dict[str, int | None]]:
    """Devuelve {año: {smlv, auxilio, total}} para años >= PRIMER_ANIO.

    Columnas de la tabla (índice entre <td>): 0 tasa de cambio, 1 salario
    diario, 2 salario mensual, 3 variación, 4 inflación, 5 US$, 6 COP 2020,
    7 auxilio de transporte, 8 salario + auxilio.
    """
    filas: dict[int, dict[str, int | None]] = {}
    for tr in re.split(r"<tr\b", html_text):
        m = re.search(r"<th[^>]*>\s*(\d{4})\b", tr)
        if not m:
            continue
        anio = int(m.group(1))
        if anio < PRIMER_ANIO:
            continue
        celdas = [_clean_cell(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.DOTALL)]
        if len(celdas) < 3:
            continue
        smlv = _parse_cop(celdas[2])
        if smlv is None:
            raise ValueError(f"Fila {anio}: no se pudo leer el salario mensual ({celdas[2]!r})")
        auxilio = _parse_cop(celdas[7]) if len(celdas) > 7 else None
        total = _parse_cop(celdas[8]) if len(celdas) > 8 else None
        filas[anio] = {"smlv": smlv, "auxilio": auxilio, "total": total}
    return filas


def validar(filas: dict[int, dict[str, int | None]]) -> None:
    anios = sorted(filas)
    esperados = list(range(PRIMER_ANIO, max(anios) + 1))
    if anios != esperados:
        faltan = sorted(set(esperados) - set(anios))
        raise ValueError(f"Serie incompleta, faltan años: {faltan}")
    for anio, valor in ANCLAS_SMLV.items():
        leido = filas[anio]["smlv"]
        if leido != valor:
            raise ValueError(f"Ancla SMLV {anio}: esperado {valor}, leído {leido}")
    for anio, valor in ANCLAS_AUXILIO.items():
        leido = filas[anio]["auxilio"]
        if leido != valor:
            raise ValueError(f"Ancla auxilio {anio}: esperado {valor}, leído {leido}")
    valores = [filas[a]["smlv"] for a in anios]
    for prev, cur in zip(valores, valores[1:]):
        if cur < prev:  # el SMLV nunca ha bajado nominalmente
            raise ValueError("La serie dejó de ser monótona no decreciente: posible tabla corrupta")


def clasificar_variacion(delta: float | None) -> str:
    if delta is None:
        return "sin-dato"
    if delta > 0:
        return "subio"
    if delta < 0:
        return "bajo"
    return "igual"


def construir_json(filas: dict[int, dict[str, int | None]]) -> dict:
    anios = sorted(filas)
    serie = []
    for anio in anios:
        fila = filas[anio]
        prev = filas.get(anio - 1)
        delta = fila["smlv"] - prev["smlv"] if prev else None
        variacion_pct = round(delta / prev["smlv"] * 100, 2) if prev else None
        serie.append({
            "periodo": f"{anio}-12",
            "salario_minimo": fila["smlv"],
            "salario_minimo_delta": delta,
            "salario_minimo_variacion": clasificar_variacion(delta),
            "variacion_pct": variacion_pct,
            "auxilio_transporte": fila["auxilio"],
            "total_con_auxilio": fila["total"],
        })
    serie.reverse()  # contrato: descendente, más reciente primero

    actual = serie[0]
    ultimo_anio = anios[-1]
    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "salario_minimo": {
                    "nombre": "Ministerio del Trabajo — decretos anuales de salario mínimo (compilación Wikipedia)",
                    "url": FUENTE_URL,
                    "indicador": "Salario mínimo mensual legal vigente (SMMLV)",
                },
                "calculo_propio": {
                    "nombre": "Cálculo propio — Observatorio de Datos de Colombia",
                    "url": "https://fredericksalazar.github.io/observatorio/",
                    "indicador": "Variación porcentual anual",
                },
            },
            "definiciones": {
                "unidad": "Pesos colombianos corrientes (COP) por mes",
                "variacion": "Variación porcentual respecto al año inmediatamente anterior",
                "nota_1984": "La serie inicia en 1984, año de unificación del salario mínimo para todos los sectores",
            },
            "cobertura": {
                "primer_periodo": f"{PRIMER_ANIO}-12",
                "ultimo_periodo": f"{ultimo_anio}-12",
                "total_registros": len(serie),
                "granularidad": "anual",
            },
            "notas": (
                "El salario mínimo en Colombia se fija por decreto para periodos de un año. "
                "Valores nominales en pesos corrientes; el auxilio de transporte aplica a "
                "quienes devengan hasta dos SMMLV."
            ),
        },
        "indicadores": {
            "salario_minimo": {
                "actual": {
                    "periodo": actual["periodo"],
                    "valor": actual["salario_minimo"],
                    "variacion": actual["salario_minimo_variacion"],
                    "delta": actual["salario_minimo_delta"],
                },
                "unidad": "COP",
            },
            "auxilio_transporte": {
                "actual": {
                    "periodo": actual["periodo"],
                    "valor": actual["auxilio_transporte"],
                    "variacion": "sin-dato",
                    "delta": None,
                },
                "unidad": "COP",
            },
            "variacion_anual": {
                "actual": {
                    "periodo": actual["periodo"],
                    "valor": actual["variacion_pct"],
                    "variacion": actual["salario_minimo_variacion"],
                    "delta": None,
                },
                "unidad": "%",
            },
        },
        "serie": serie,
        "historico": {str(a): filas[a]["smlv"] for a in anios},
        "historico_auxilio": {str(a): filas[a]["auxilio"] for a in anios if filas[a]["auxilio"] is not None},
    }


def main() -> int:
    html_text = fetch_html()
    filas = parse_tabla(html_text)
    validar(filas)
    data = construir_json(filas)
    destino = OUT / JSON_FILENAME
    destino.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    cob = data["metadata"]["cobertura"]
    print(f"OK → {destino} ({cob['primer_periodo']} … {cob['ultimo_periodo']}, {cob['total_registros']} registros)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
