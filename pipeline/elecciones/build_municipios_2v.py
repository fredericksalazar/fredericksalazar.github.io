#!/usr/bin/env python3
"""Construye el dataset municipal del balotaje 2026 (2ª vuelta).

Entrada:
  - resultados_100_municipios_2026.csv  (raíz del repo): preconteo por municipio
    con CÓDIGOS DE LA REGISTRADURÍA (Antioquia=01, Meta=52, ...), no DANE.
  - public/geo/colombia-municipios.geo.json: polígonos DANE 2018 (MGN) con el
    código DIVIPOLA en `properties.MPIO_CCNCT` (Antioquia=05, Meta=50, ...).

Salida:
  - public/data/data_pres_2026_2v_municipios.json

El reto es que el CSV viene con codificación Registraduría y el GeoJSON con
codificación DANE. El join se hace mapeando el código de departamento
Registraduría → DANE (33 entradas) y luego emparejando el municipio por NOMBRE
normalizado dentro del departamento (exacto → sin paréntesis → alias → substring
→ difuso). El resultado se materializa con el código DANE para que el runtime
una el JSON con el GeoJSON por `MPIO_CCNCT` directamente.
"""
from __future__ import annotations

import csv
import json
import re
import unicodedata
import difflib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_IN = ROOT / "resultados_100_municipios_2026.csv"
GEO_IN = ROOT / "public" / "geo" / "colombia-municipios.geo.json"
OUT = ROOT / "public" / "data" / "data_pres_2026_2v_municipios.json"

NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Código de departamento Registraduría → DANE.
REG2DANE = {
    "01": "05", "03": "08", "05": "13", "07": "15", "09": "17", "11": "19",
    "12": "20", "13": "23", "15": "25", "16": "11", "17": "27", "19": "41",
    "21": "47", "23": "52", "24": "66", "25": "54", "26": "63", "27": "68",
    "28": "70", "29": "73", "31": "76", "40": "81", "44": "18", "46": "85",
    "48": "44", "50": "94", "52": "50", "54": "95", "56": "88", "60": "91",
    "64": "86", "68": "97", "72": "99",
}

# Alias municipales (dept DANE, nombre CSV normalizado sin paréntesis) → nombre DANE normalizado.
# Solo para casos que el emparejado automático no resuelve por sí solo.
ALIAS = {
    ("05", "ANTIOQUIA"): "SANTA FE DE ANTIOQUIA",
    ("05", "BOLIVAR"): "CIUDAD BOLIVAR",
    ("05", "CARMEN DE VIBORAL"): "EL CARMEN DE VIBORAL",
    ("05", "DON MATIAS"): "DONMATIAS",
    ("05", "SAN ANDRES"): "SAN ANDRES DE CUERQUIA",
    ("05", "SAN PEDRO"): "SAN PEDRO DE LOS MILAGROS",
    ("05", "SAN VICENTE"): "SAN VICENTE FERRER",
    ("05", "SANTUARIO"): "EL SANTUARIO",
    ("05", "PUERTO NARE LA MAGDALENA"): "PUERTO NARE",
    ("05", "YONDO CASABE"): "YONDO",
    ("13", "ARROYO HONDO"): "ARROYOHONDO",
    ("13", "RIOVIEJO"): "RIO VIEJO",
    ("13", "CARTAGENA"): "CARTAGENA DE INDIAS",
    ("15", "GUICAN"): "GUICAN DE LA SIERRA",
    ("15", "VILLA DE LEIVA"): "VILLA DE LEYVA",
    ("19", "CAUCA"): "PAEZ",
    ("23", "PURISIMA"): "PURISIMA DE LA CONCEPCION",
    ("25", "UBATE"): "VILLA DE SAN DIEGO DE UBATE",
    ("27", "EL CARMEN"): "EL CARMEN DE ATRATO",
    ("52", "TUMACO"): "SAN ANDRES DE TUMACO",
    ("54", "CUCUTA"): "SAN JOSE DE CUCUTA",
    ("68", "EL CARMEN"): "EL CARMEN DE CHUCURI",
    ("70", "SINCE"): "SAN LUIS DE SINCE",
    ("70", "TOLU"): "SANTIAGO DE TOLU",
    ("73", "MARIQUITA"): "SAN SEBASTIAN DE MARIQUITA",
    ("76", "BUGA"): "GUADALAJARA DE BUGA",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().upper()
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def strip_paren(s: str) -> str:
    # Quita desde el primer '(' (también captura paréntesis truncados del scraping).
    return re.sub(r"\(.*$", "", s).strip()


def build_geo_index():
    geo = json.loads(GEO_IN.read_text(encoding="utf-8"))
    exact: dict[tuple[str, str], str] = {}
    dept_names: dict[str, list[str]] = {}
    code_name: dict[str, str] = {}
    for f in geo["features"]:
        p = f["properties"]
        d, code, name = p["DPTO_CCDGO"], p["MPIO_CCNCT"], p["MPIO_CNMBR"]
        nm = norm(name)
        exact[(d, nm)] = code
        dept_names.setdefault(d, []).append(nm)
        code_name[code] = name
    return exact, dept_names, code_name


def match(dane_d: str, raw: str, exact, dept_names):
    n = norm(raw)
    if (dane_d, n) in exact:
        return exact[(dane_d, n)], "exact"
    ns = norm(strip_paren(raw))
    if (dane_d, ns) in exact:
        return exact[(dane_d, ns)], "paren"
    alias = ALIAS.get((dane_d, ns))
    if alias and (dane_d, alias) in exact:
        return exact[(dane_d, alias)], "alias"
    names = dept_names.get(dane_d, [])
    cands = [nm for nm in names if ns and (ns in nm or nm in ns)]
    if len(cands) == 1:
        return exact[(dane_d, cands[0])], "substr"
    close = difflib.get_close_matches(ns, names, n=1, cutoff=0.82)
    if close:
        return exact[(dane_d, close[0])], "fuzzy"
    if cands:
        best = difflib.get_close_matches(ns, cands, n=1, cutoff=0)
        if best:
            return exact[(dane_d, best[0])], "substr-multi"
    return None, None


def main() -> None:
    exact, dept_names, code_name = build_geo_index()

    municipios = []
    seen: set[str] = set()
    unmatched: list[tuple[str, str, str]] = []
    consulados = {"votos_abelardo": 0, "votos_cepeda": 0, "votos_blanco": 0}

    with CSV_IN.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            ab = int(r["votos_abelardo"] or 0)
            cep = int(r["votos_cepeda"] or 0)
            blanco = int(r["votos_blanco"] or 0)
            nulos = int(r["votos_nulos"] or 0)
            no_marcados = int(r["tarjetones_no_marcados"] or 0)
            if r["cod_depto"] == "88":  # CONSULADOS: voto exterior, sin geometría.
                consulados["votos_abelardo"] += ab
                consulados["votos_cepeda"] += cep
                consulados["votos_blanco"] += blanco
                continue
            dane_d = REG2DANE.get(r["cod_depto"])
            cod, _how = match(dane_d, r["nombre_mpio"], exact, dept_names) if dane_d else (None, None)
            if not cod or cod in seen:
                unmatched.append((r["cod_depto"], r["nombre_depto"], r["nombre_mpio"]))
                continue
            seen.add(cod)
            validos = ab + cep + blanco
            sufragado = validos + nulos + no_marcados  # total de tarjetones depositados
            no_positivo = blanco + nulos + no_marcados  # voto sin candidato (desafección)
            ganador = "abelardo_de_la_espriella" if ab >= cep else "ivan_cepeda"
            municipios.append({
                "cod_mpio": cod,                       # DIVIPOLA DANE (5 dígitos)
                "nombre_mpio": code_name[cod],
                "cod_depto": dane_d,
                "nombre_depto": r["nombre_depto"],
                "votos_abelardo": ab,
                "votos_cepeda": cep,
                "votos_blanco": blanco,
                "votos_nulos": nulos,
                "votos_no_marcados": no_marcados,
                "total_validos": validos,
                "total_sufragado": sufragado,
                "ganador_id": ganador,
                "share_abelardo": round(ab / validos, 4) if validos else None,
                "share_cepeda": round(cep / validos, 4) if validos else None,
                "margen_pp": round((ab - cep) / validos, 4) if validos else None,
                "share_no_positivo": round(no_positivo / sufragado, 4) if sufragado else None,
            })

    municipios.sort(key=lambda m: m["cod_mpio"])

    total_ab = sum(m["votos_abelardo"] for m in municipios)
    total_cep = sum(m["votos_cepeda"] for m in municipios)
    gana_ab = sum(1 for m in municipios if m["ganador_id"] == "abelardo_de_la_espriella")

    payload = {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "registraduria": {
                    "nombre": "Registraduría Nacional del Estado Civil",
                    "url": "https://resultados.registraduria.gov.co/v2/resultados/0/00",
                    "indicador": "Preconteo segunda vuelta por municipio",
                },
                "geojson": {
                    "nombre": "DANE — Marco Geoestadístico Nacional 2018 (municipios)",
                    "url": "https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/marco-geoestadistico-nacional-mgn",
                    "indicador": "Polígonos municipales DIVIPOLA",
                },
                "calculo_propio": {
                    "nombre": "Cálculo propio",
                    "url": "https://github.com/fredericksalazar/fredericksalazar.github.io",
                    "indicador": "Join Registraduría↔DANE por nombre y agregados",
                },
            },
            "definiciones": {
                "total_validos": "votos_abelardo + votos_cepeda + votos_blanco",
                "total_sufragado": "total_validos + votos_nulos + votos_no_marcados",
                "share_abelardo": "votos_abelardo / total_validos",
                "share_cepeda": "votos_cepeda / total_validos",
                "margen_pp": "(votos_abelardo - votos_cepeda) / total_validos",
                "share_no_positivo": "(blanco + nulos + no_marcados) / total_sufragado (desafección)",
                "ganador_id": "candidato con más votos en el municipio",
            },
            "cobertura": {
                "primer_periodo": "2026-06",
                "ultimo_periodo": "2026-06",
                "total_registros": len(municipios),
                "granularidad": "municipal",
            },
            "nota": (
                "Cifras de preconteo. El voto consular (exterior) no tiene geometría "
                "municipal y se reporta aparte. Áreas no municipalizadas de la Amazonía "
                "sin polígono en el MGN 2018 quedan sin color."
            ),
        },
        "eleccion": {"anio": 2026, "vuelta": 2, "fecha": "2026-06-21"},
        "resumen_nacional": {
            "votos_abelardo": total_ab,
            "votos_cepeda": total_cep,
            "municipios_abelardo": gana_ab,
            "municipios_cepeda": len(municipios) - gana_ab,
            "voto_exterior": consulados,
        },
        "municipios": municipios,
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK · municipios={len(municipios)} · sin emparejar={len(unmatched)}")
    print(f"   gana Abelardo en {gana_ab}, Cepeda en {len(municipios) - gana_ab}")
    if unmatched:
        print("   sin emparejar (sin polígono en MGN 2018):")
        for u in unmatched:
            print("    ", u)
    print(f"-> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
