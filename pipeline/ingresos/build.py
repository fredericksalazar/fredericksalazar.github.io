"""Pipeline: distribución del ingreso laboral en Colombia + clases sociales DANE.

Genera:
  - public/data/data_ingresos.json        ← percentiles del ingreso laboral de
    ocupados (GEIH) + umbrales y distribución de clases sociales (DANE).
  - public/data/data_salarios_cargos.json ← estadísticas salariales por grupo
    ocupacional CIUO-08 A.C. (2 dígitos).

Fuentes:
  1. Microdatos GEIH 2025 — DANE, catálogo 853 (acceso directo):
     https://microdatos.dane.gov.co/index.php/catalog/853
     Módulo "Ocupados": INGLABO (ingreso laboral mensual), FEX_C18 (factor de
     expansión), OFICIO_C8 (ocupación CIUO-08 A.C.).
     Los ZIP mensuales se descargan a data/raw/geih/AAAA-MM.zip (este script
     los descarga si faltan; también acepta descarga manual — REGLA 1: nunca
     se inventan datos).
  2. Clases sociales — DANE, comunicado de pobreza monetaria y clases
     sociales 2024 (sep-2025):
     https://www.dane.gov.co/files/operaciones/PM/cp-PMClasesSociales-2024.pdf
     Umbrales de ingreso per cápita del hogar/mes (metodología López-Calva &
     Ortiz-Juárez adaptada por el DANE) y distribución de la población.

Validaciones (falla ruidosa si no se cumplen):
  - Percentiles estrictamente monótonos.
  - Mediana nacional en rango plausible frente al boletín GEIH.
  - Muestra mínima total y por cargo (no se publica basura estadística).
  - La distribución de clases suma 100 ± 0,1.

Ejecutar desde la raíz del repo:
    python3 -m pipeline.ingresos.build
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import unicodedata
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "geih"
OUT = ROOT / "public" / "data"

NOW_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")

ANIO_GEIH = 2025
MESES_IDS = {
    "2025-01": 24263, "2025-02": 24264, "2025-03": 24267, "2025-04": 24269,
    "2025-05": 24268, "2025-06": 24266, "2025-07": 24265, "2025-08": 24307,
    "2025-09": 24324, "2025-10": 24382, "2025-11": 24406, "2025-12": 24463,
}
DOWNLOAD_URL = "https://microdatos.dane.gov.co/index.php/catalog/853/download/{id}"

# SMLV del año de la GEIH — debe coincidir con public/data/data_salario_minimo.json
SMLV_PATH = OUT / "data_salario_minimo.json"

N_MIN_TOTAL = 200_000      # registros muestrales mínimos del año apilado
N_MIN_CARGO = 200          # muestra mínima para publicar un grupo ocupacional
MEDIANA_PLAUSIBLE = (900_000, 2_500_000)  # rango sanidad vs boletín GEIH

# ── Clases sociales DANE 2024 (comunicado sep-2025, valores textuales) ──────
CLASES = {
    "anio": 2024,
    "unidad": "COP per cápita mensual del hogar",
    "umbrales": {
        # Línea de pobreza monetaria nacional 2024 (DANE usa 25 líneas
        # diferenciadas; esta es la nacional de referencia).
        "pobreza_hasta": 460_198,
        "vulnerable_hasta": 897_987,
        "media_hasta": 4_835_315,
    },
    "distribucion": {"pobreza": 31.8, "vulnerable": 30.5, "media": 34.4, "alta": 3.3},
}

# ── CIUO-08 A.C. — grandes subgrupos (2 dígitos) ────────────────────────────
CIUO_2D = {
    "11": ("Miembros del poder ejecutivo, legislativo y directores de administración pública", "Altos directivos del Estado"),
    "12": ("Directores administradores y comerciales", "Directores administrativos y comerciales"),
    "13": ("Directores y gerentes de producción y operaciones", "Gerentes de producción y operaciones"),
    "14": ("Gerentes de hoteles, restaurantes, comercios y otros servicios", "Gerentes de comercio y servicios"),
    "21": ("Profesionales de las ciencias y de la ingeniería", "Profesionales de ciencias e ingeniería"),
    "22": ("Profesionales de la salud", "Profesionales de la salud"),
    "23": ("Profesionales de la enseñanza", "Profesionales de la enseñanza"),
    "24": ("Especialistas en organización de la administración pública y de empresas", "Especialistas en administración y finanzas"),
    "25": ("Profesionales de tecnología de la información y las comunicaciones", "Profesionales TIC"),
    "26": ("Profesionales en derecho, en ciencias sociales y culturales", "Profesionales en derecho y ciencias sociales"),
    "31": ("Técnicos y profesionales del nivel medio de las ciencias y la ingeniería", "Técnicos de ciencias e ingeniería"),
    "32": ("Técnicos y profesionales del nivel medio de la salud", "Técnicos de la salud"),
    "33": ("Técnicos y profesionales del nivel medio en operaciones financieras y administrativas", "Técnicos financieros y administrativos"),
    "34": ("Técnicos y profesionales del nivel medio de servicios jurídicos, sociales y culturales", "Técnicos de servicios sociales y culturales"),
    "35": ("Técnicos de la tecnología de la información y las comunicaciones", "Técnicos TIC"),
    "41": ("Oficinistas", "Oficinistas"),
    "42": ("Empleados en trato directo con el público", "Empleados de atención al público"),
    "43": ("Empleados contables y encargados del registro de materiales", "Empleados contables y de inventarios"),
    "44": ("Otro personal de apoyo administrativo", "Personal de apoyo administrativo"),
    "51": ("Trabajadores de los servicios personales", "Trabajadores de servicios personales"),
    "52": ("Vendedores", "Vendedores"),
    "53": ("Trabajadores de los cuidados personales", "Trabajadores del cuidado"),
    "54": ("Personal de los servicios de protección", "Personal de seguridad y protección"),
    "61": ("Agricultores y trabajadores calificados de explotaciones agropecuarias", "Agricultores calificados"),
    "62": ("Trabajadores forestales calificados, pescadores y cazadores", "Trabajadores forestales y pescadores"),
    "63": ("Trabajadores agropecuarios de subsistencia", "Agricultores de subsistencia"),
    "71": ("Oficiales y operarios de la construcción", "Operarios de la construcción"),
    "72": ("Oficiales y operarios de la metalurgia y la construcción mecánica", "Operarios de metalurgia y mecánica"),
    "73": ("Artesanos y operarios de las artes gráficas", "Artesanos y artes gráficas"),
    "74": ("Trabajadores especializados en electricidad y electrotecnología", "Electricistas y electrotécnicos"),
    "75": ("Operarios del procesamiento de alimentos, confección y madera", "Operarios de alimentos, confección y madera"),
    "81": ("Operadores de instalaciones fijas y máquinas", "Operadores de máquinas e instalaciones"),
    "82": ("Ensambladores", "Ensambladores"),
    "83": ("Conductores de vehículos y operadores de equipos pesados", "Conductores y operadores de equipo pesado"),
    "91": ("Limpiadores y asistentes", "Personal de limpieza"),
    "92": ("Peones agropecuarios, pesqueros y forestales", "Peones agropecuarios"),
    "93": ("Peones de la minería, la construcción, la industria y el transporte", "Peones de industria y construcción"),
    "94": ("Ayudantes de preparación de alimentos", "Ayudantes de cocina"),
    "95": ("Vendedores ambulantes de servicios y afines", "Vendedores ambulantes"),
    "96": ("Recolectores de desechos y otras ocupaciones elementales", "Recolectores y ocupaciones elementales"),
}
EXCLUIR_PREFIJOS = ("01", "02", "03")  # fuerzas militares: muestra marginal


def slugify(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s


def descargar_faltantes() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for mes, id_ in MESES_IDS.items():
        destino = RAW / f"{mes}.zip"
        if destino.exists() and zipfile.is_zipfile(destino):
            continue
        url = DOWNLOAD_URL.format(id=id_)
        print(f"Descargando {mes} ← {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "observatorio-pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=1800) as resp, open(destino, "wb") as f:
            while chunk := resp.read(1 << 20):
                f.write(chunk)


def _miembro_ocupados(zf: zipfile.ZipFile) -> str:
    """Encuentra el CSV del módulo Ocupados (sin confundir con 'No ocupados')."""
    candidatos = []
    for name in zf.namelist():
        base = Path(name).name.lower()
        if base.endswith(".csv") and base.replace("_", " ").startswith("ocupados"):
            candidatos.append(name)
    if len(candidatos) != 1:
        raise ValueError(f"Esperaba 1 CSV 'Ocupados', encontré {candidatos} en {zf.filename}")
    return candidatos[0]


def _to_float(v: str) -> float | None:
    v = v.strip().replace(",", ".")
    if not v or v in {".", "NA"}:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def leer_ocupados() -> list[tuple[float, float, str]]:
    """Devuelve [(inglabo, fex, oficio_2d)] de todos los meses disponibles."""
    filas: list[tuple[float, float, str]] = []
    zips = sorted(RAW.glob("*.zip"))
    if not zips:
        raise FileNotFoundError(f"No hay ZIPs de la GEIH en {RAW}")
    for zpath in zips:
        with zipfile.ZipFile(zpath) as zf:
            member = _miembro_ocupados(zf)
            with zf.open(member) as fh:
                # Los CSV de la GEIH vienen en latin-1 (Ñ, tildes).
                texto = io.TextIOWrapper(fh, encoding="latin-1")
                reader = csv.reader(texto, delimiter=";")
                header = next(reader)
                header_norm = [h.strip().upper().strip('"').lstrip("﻿") for h in header]
                try:
                    i_ing = header_norm.index("INGLABO")
                    i_fex = header_norm.index("FEX_C18")
                    i_ofi = header_norm.index("OFICIO_C8")
                except ValueError as e:
                    raise ValueError(f"Columna faltante en {zpath.name}/{member}: {e}") from e
                n_mes = 0
                for row in reader:
                    if len(row) <= max(i_ing, i_fex, i_ofi):
                        continue
                    ing = _to_float(row[i_ing])
                    fex = _to_float(row[i_fex])
                    if ing is None or fex is None or ing <= 0 or fex <= 0:
                        continue
                    oficio = row[i_ofi].strip().strip('"')
                    oficio_2d = oficio.zfill(4)[:2] if oficio and oficio.isdigit() else ""
                    filas.append((ing, fex, oficio_2d))
                    n_mes += 1
                print(f"  {zpath.name}: {n_mes:,} ocupados con ingreso")
    return filas


def percentil_ponderado(valores_ordenados: list[tuple[float, float]], total_peso: float, p: float) -> float:
    """Percentil p (0-100) ponderado; valores_ordenados = [(valor, peso)] asc."""
    objetivo = total_peso * p / 100
    acumulado = 0.0
    for valor, peso in valores_ordenados:
        acumulado += peso
        if acumulado >= objetivo:
            return valor
    return valores_ordenados[-1][0]


def stats_ponderadas(pares: list[tuple[float, float]]) -> dict:
    orden = sorted(pares)
    total = sum(p for _, p in orden)
    suma = sum(v * p for v, p in orden)
    return {
        "orden": orden,
        "total_peso": total,
        "promedio": suma / total,
        "mediana": percentil_ponderado(orden, total, 50),
        "p25": percentil_ponderado(orden, total, 25),
        "p75": percentil_ponderado(orden, total, 75),
        "p90": percentil_ponderado(orden, total, 90),
    }


def pct_hasta(orden: list[tuple[float, float]], total: float, umbral: float) -> float:
    acum = sum(p for v, p in orden if v <= umbral)
    return acum / total * 100


def smlv_del_anio(anio: int) -> int:
    data = json.loads(SMLV_PATH.read_text(encoding="utf-8"))
    valor = data["historico"].get(str(anio))
    if not valor:
        raise ValueError(f"SMLV de {anio} no está en {SMLV_PATH}")
    return int(valor)


def validar(percentiles: dict[str, float], mediana: float, n_total: int) -> None:
    vals = [percentiles[str(p)] for p in range(1, 100)]
    for a, b in zip(vals, vals[1:]):
        if b < a:
            raise ValueError("Percentiles no monótonos: cálculo corrupto")
    lo, hi = MEDIANA_PLAUSIBLE
    if not (lo <= mediana <= hi):
        raise ValueError(f"Mediana {mediana:,.0f} fuera del rango plausible {lo:,}-{hi:,}")
    if n_total < N_MIN_TOTAL:
        raise ValueError(f"Muestra total insuficiente: {n_total:,} < {N_MIN_TOTAL:,}")
    suma_clases = sum(CLASES["distribucion"].values())
    if abs(suma_clases - 100.0) > 0.1:
        raise ValueError(f"Distribución de clases no suma 100: {suma_clases}")


def main() -> int:
    descargar_faltantes()
    filas = leer_ocupados()
    n_total = len(filas)
    print(f"Total ocupados con ingreso ({ANIO_GEIH}): {n_total:,}")

    pares = [(ing, fex) for ing, fex, _ in filas]
    st = stats_ponderadas(pares)
    percentiles = {
        str(p): round(percentil_ponderado(st["orden"], st["total_peso"], p))
        for p in range(1, 100)
    }
    smlv = smlv_del_anio(ANIO_GEIH)
    pct_1smlv = round(pct_hasta(st["orden"], st["total_peso"], smlv), 1)
    pct_2smlv = round(pct_hasta(st["orden"], st["total_peso"], 2 * smlv), 1)
    validar(percentiles, st["mediana"], n_total)

    fuentes = {
        "geih": {
            "nombre": "DANE — Gran Encuesta Integrada de Hogares (GEIH), microdatos 2025",
            "url": "https://microdatos.dane.gov.co/index.php/catalog/853",
            "indicador": "Ingreso laboral mensual de ocupados (INGLABO, ponderado por FEX_C18)",
        },
        "clases": {
            "nombre": "DANE — Pobreza monetaria y clases sociales 2024",
            "url": "https://www.dane.gov.co/files/operaciones/PM/cp-PMClasesSociales-2024.pdf",
            "indicador": "Umbrales de clases sociales por ingreso per cápita del hogar",
        },
        "calculo_propio": {
            "nombre": "Cálculo propio — Observatorio de Datos de Colombia",
            "url": "https://fredericksalazar.github.io/observatorio/",
            "indicador": "Percentiles ponderados y agregados por ocupación",
        },
    }
    periodo = f"{ANIO_GEIH}-12"

    data_ingresos = {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": fuentes,
            "definiciones": {
                "ingreso": "Ingreso laboral mensual de ocupados en COP corrientes (INGLABO)",
                "percentil": "Porcentaje de ocupados que gana hasta ese valor (ponderado por factor de expansión)",
                "clases": "Clasificación DANE por ingreso per cápita del hogar (López-Calva & Ortiz-Juárez)",
            },
            "cobertura": {
                "primer_periodo": f"{ANIO_GEIH}-01",
                "ultimo_periodo": periodo,
                "total_registros": n_total,
                "granularidad": "anual",
            },
            "notas": (
                "Percentiles del ingreso laboral de ocupados calculados sobre los 12 meses "
                f"de la GEIH {ANIO_GEIH} apilados, ponderados por el factor de expansión. "
                "Los umbrales de clases sociales son del año 2024 (último publicado por el DANE)."
            ),
        },
        "indicadores": {
            "mediana": {
                "actual": {"periodo": periodo, "valor": round(st["mediana"]), "variacion": "sin-dato", "delta": None},
                "unidad": "COP",
            },
            "promedio": {
                "actual": {"periodo": periodo, "valor": round(st["promedio"]), "variacion": "sin-dato", "delta": None},
                "unidad": "COP",
            },
            "pct_hasta_1smlv": {
                "actual": {"periodo": periodo, "valor": pct_1smlv, "variacion": "sin-dato", "delta": None},
                "unidad": "%",
            },
            "pct_hasta_2smlv": {
                "actual": {"periodo": periodo, "valor": pct_2smlv, "variacion": "sin-dato", "delta": None},
                "unidad": "%",
            },
        },
        "percentiles": percentiles,
        "clases": CLASES,
        "smlv_referencia": {"anio": ANIO_GEIH, "valor": smlv},
    }

    # ── por cargo ──
    por_cargo: dict[str, list[tuple[float, float]]] = {}
    for ing, fex, ofi in filas:
        if ofi in CIUO_2D and not ofi.startswith(EXCLUIR_PREFIJOS):
            por_cargo.setdefault(ofi, []).append((ing, fex))

    peso_total_pais = st["total_peso"]
    cargos = []
    for codigo, pares_cargo in por_cargo.items():
        if len(pares_cargo) < N_MIN_CARGO:
            continue
        sc = stats_ponderadas(pares_cargo)
        nombre, corto = CIUO_2D[codigo]
        cargos.append({
            "codigo": codigo,
            "slug": slugify(corto),
            "nombre": nombre,
            "nombre_corto": corto,
            "mediana": round(sc["mediana"]),
            "p25": round(sc["p25"]),
            "p75": round(sc["p75"]),
            "p90": round(sc["p90"]),
            "promedio": round(sc["promedio"]),
            "n_muestra": len(pares_cargo),
            "share_empleo_pct": round(sc["total_peso"] / peso_total_pais * 100, 2),
        })
    cargos.sort(key=lambda c: -c["mediana"])
    slugs = [c["slug"] for c in cargos]
    if len(slugs) != len(set(slugs)):
        raise ValueError("Slugs de cargos duplicados")

    data_cargos = {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": fuentes,
            "definiciones": {
                "grupo": "Gran subgrupo ocupacional CIUO-08 A.C. (2 dígitos)",
                "n_minimo": N_MIN_CARGO,
            },
            "cobertura": {
                "primer_periodo": f"{ANIO_GEIH}-01",
                "ultimo_periodo": periodo,
                "total_registros": len(cargos),
                "granularidad": "anual",
            },
            "notas": (
                "Solo se publican grupos ocupacionales con muestra anual >= "
                f"{N_MIN_CARGO} ocupados con ingreso reportado. Se excluyen las fuerzas militares."
            ),
        },
        "indicadores": {
            "mediana_nacional": {
                "actual": {"periodo": periodo, "valor": round(st["mediana"]), "variacion": "sin-dato", "delta": None},
                "unidad": "COP",
            },
        },
        "smlv_referencia": {"anio": ANIO_GEIH, "valor": smlv},
        "cargos": cargos,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "data_ingresos.json").write_text(
        json.dumps(data_ingresos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "data_salarios_cargos.json").write_text(
        json.dumps(data_cargos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"OK → data_ingresos.json (mediana ${st['mediana']:,.0f}, ≤1 SMLV {pct_1smlv}%, n={n_total:,})")
    print(f"OK → data_salarios_cargos.json ({len(cargos)} grupos ocupacionales)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
