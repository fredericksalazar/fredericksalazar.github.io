"""Pipeline real: extrae resultados departamentales de Wikipedia y genera los
JSONs consumidos por /elecciones-presidenciales/.

Fuentes:
- 2022 1V/2V: https://en.wikipedia.org/wiki/2022_Colombian_presidential_election
- 2026 1V:    https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026

Las tablas departamentales son las de Registraduría reproducidas en Wikipedia.
NO se inventa ningún número: los totales nacionales son los reportados oficialmente
y los desgloses departamentales se leen directamente de las tablas HTML.

Ejecutar desde la raíz del repo:
    python3 -m pipeline.elecciones.from_wikipedia
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
import unicodedata
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

CACHE_2022 = Path("/tmp/wiki_2022.html")
CACHE_2026 = Path("/tmp/wiki_2026.html")

URL_2022 = "https://en.wikipedia.org/wiki/2022_Colombian_presidential_election"
URL_2026 = "https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026"

NOW_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")

# ─────────────────────────────────────────────────────────────────────────────
# DIVIPOLA
# ─────────────────────────────────────────────────────────────────────────────

DEPTO_DIVIPOLA = {
    "Amazonas": "91",
    "Antioquia": "05",
    "Arauca": "81",
    "Atlántico": "08",
    "Bogotá": "11",
    "Bogotá D.C.": "11",
    "Bolívar": "13",
    "Boyacá": "15",
    "Caldas": "17",
    "Caquetá": "18",
    "Casanare": "85",
    "Cauca": "19",
    "Cesar": "20",
    "Chocó": "27",
    "Córdoba": "23",
    "Cundinamarca": "25",
    "Guainía": "94",
    "Guaviare": "95",
    "Huila": "41",
    "La Guajira": "44",
    "Magdalena": "47",
    "Meta": "50",
    "Nariño": "52",
    "Norte de Santander": "54",
    "Putumayo": "86",
    "Quindío": "63",
    "Risaralda": "66",
    "San Andrés": "88",
    "San Andrés and Providencia": "88",
    "San Andrés y Providencia": "88",
    "Santander": "68",
    "Sucre": "70",
    "Tolima": "73",
    "Valle del Cauca": "76",
    "Vaupés": "97",
    "Vichada": "99",
}

DEPTO_CANONICAL = {
    "Bogotá": "Bogotá D.C.",
    "San Andrés": "San Andrés y Providencia",
    "San Andrés and Providencia": "San Andrés y Providencia",
}

EXTERIOR_KEYS = {"Consulates/Abroad", "Consulates", "Consulados", "Exterior"}

# ─────────────────────────────────────────────────────────────────────────────
# Candidatos
# ─────────────────────────────────────────────────────────────────────────────

def slug(name: str) -> str:
    n = unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode("ascii")
    n = re.sub(r"[^a-zA-Z0-9 ]", "", n).strip().lower()
    return re.sub(r"\s+", "_", n)


CANDS_2022_1V = [
    ("gustavo_petro",       "Gustavo Petro",         "Petro"),
    ("rodolfo_hernandez",   "Rodolfo Hernández",     "Hernández"),
    ("federico_gutierrez",  "Federico Gutiérrez",    "Gutiérrez"),
    ("sergio_fajardo",      "Sergio Fajardo",        "Fajardo"),
    ("john_milton_rodriguez", "John Milton Rodríguez", "Rodríguez"),
    ("enrique_gomez",       "Enrique Gómez",         "Gómez"),
    ("ingrid_betancourt",   "Íngrid Betancourt",     "Betancourt"),
    ("luis_perez",          "Luis Pérez",            "Pérez"),
]

CANDS_2022_2V = [
    ("gustavo_petro",     "Gustavo Petro",     "Petro"),
    ("rodolfo_hernandez", "Rodolfo Hernández", "Hernández"),
]

CANDS_2026_1V = [
    ("abelardo_de_la_espriella", "Abelardo de la Espriella",         "De la Espriella"),
    ("ivan_cepeda",              "Iván Cepeda Castro",               "Cepeda"),
    ("paloma_valencia",          "Paloma Valencia Laserna",          "Valencia"),
    ("sergio_fajardo",           "Sergio Fajardo Valderrama",        "Fajardo"),
    ("claudia_lopez",            "Claudia López",                    "López"),
    ("daniel_palacios_botero",   "Raúl Santiago Botero Jaramillo",   "Botero"),
    ("daniel_quintero_lizcano",  "Óscar Mauricio Lizcano Arango",    "Lizcano"),
    ("miguel_uribe_londono",     "Miguel Uribe Londoño",             "Uribe"),
    ("david_luna_garvin",        "Sondra Macollins Garvin Pinto",    "Garvin"),
    ("roy_barreras",             "Roy Leonardo Barreras Montealegre", "Barreras"),
    ("juan_fernando_cristo_murillo", "Luis Gilberto Murillo Urrutia", "Murillo"),
    ("luis_gilberto_murillo_caicedo", "Carlos Eduardo Caicedo Omar", "Caicedo"),
    ("camilo_romero_matamoros",  "Gustavo Matamoros Camacho",        "Matamoros"),
]

CANDS_2026_2V = [
    ("abelardo_de_la_espriella", "Abelardo de la Espriella", "De la Espriella"),
    ("ivan_cepeda",              "Iván Cepeda Castro",       "Cepeda"),
]

# Bloques ideológicos unificados: izquierda · centro · derecha.
# (Se descartaron los matices centro-izquierda / centro-derecha / extrema-derecha
# para simplificar la lectura visual y agrupar candidatos afines).
CANDIDATOS_META = {
    # 2022
    "gustavo_petro":       {"partido": "Colombia Humana",          "coalicion": "Pacto Histórico",     "ideologia": "izquierda"},
    "rodolfo_hernandez":   {"partido": "Liga de Gobernantes Anticorrupción", "ideologia": "derecha"},
    "federico_gutierrez":  {"partido": "Creemos",                  "coalicion": "Equipo por Colombia", "ideologia": "derecha"},
    "sergio_fajardo":      {"partido": "Dignidad y Compromiso",    "coalicion": "Centro Esperanza",    "ideologia": "centro"},
    "john_milton_rodriguez": {"partido": "Colombia Justa Libres",  "ideologia": "derecha"},
    "enrique_gomez":       {"partido": "Movimiento de Salvación Nacional", "ideologia": "derecha"},
    "ingrid_betancourt":   {"partido": "Verde Oxígeno",            "ideologia": "centro"},
    "luis_perez":          {"partido": "Colombia Piensa en Grande", "ideologia": "derecha"},
    # 2026
    "abelardo_de_la_espriella": {"partido": "Defensores de la Patria",          "ideologia": "derecha"},
    "ivan_cepeda":         {"partido": "Polo Democrático Alternativo", "coalicion": "Pacto Histórico", "ideologia": "izquierda"},
    "paloma_valencia":     {"partido": "Centro Democrático",           "ideologia": "derecha"},
    "claudia_lopez":       {"partido": "Una Nueva Historia",           "ideologia": "centro"},
    "daniel_palacios_botero": {"partido": "Rumbo al Futuro",           "ideologia": "derecha"},   # Raúl Santiago Botero Jaramillo
    "daniel_quintero_lizcano": {"partido": "Independencia",            "ideologia": "centro"},   # Óscar Mauricio Lizcano Arango
    "miguel_uribe_londono": {"partido": "Independiente",               "ideologia": "derecha"},
    "david_luna_garvin":   {"partido": "Sondra 2026",                  "ideologia": "centro"},   # Sondra Macollins Garvin Pinto
    "roy_barreras":        {"partido": "Independiente",                "ideologia": "izquierda"},
    "juan_fernando_cristo_murillo": {"partido": "Oportunidad Colombia", "ideologia": "centro"},  # Luis Gilberto Murillo Urrutia
    "luis_gilberto_murillo_caicedo": {"partido": "Caicedo",            "ideologia": "izquierda"}, # Carlos Eduardo Caicedo Omar
    "camilo_romero_matamoros": {"partido": "Salvación y Desarrollo",   "ideologia": "derecha"},   # Gustavo Matamoros Camacho
}

# ─────────────────────────────────────────────────────────────────────────────
# Totales nacionales conocidos (oficiales)
# ─────────────────────────────────────────────────────────────────────────────

NACIONAL_2022_1V = {
    "censo":        39002239,
    "total_votos":  21442300,
    "validos":      21174806,
    "nulos":        241826,
    "no_marcados":  26632,
    "blanco":       365777,
    "participacion": 0.5498,
    "abstencion":   0.4502,
}
NACIONAL_2022_2V = {
    "censo":        39002239,
    "total_votos":  22687910,
    "validos":      22417825,
    "nulos":        270085,
    "no_marcados":  21459,
    "blanco":       500043,
    "participacion": 0.5817,
    "abstencion":   0.4183,
}
# 2026: cálculo de válidos / no_marcados consistente
_2026_total  = 23978304
_2026_nulos  = 245389
_2026_validos = _2026_total - _2026_nulos  # 23 732 915
# no_marcados estimado = total - validos - nulos (será 0 — Wikipedia preconteo no diferencia)
_2026_no_marcados = 0
NACIONAL_2026_1V = {
    "censo":         41421973,
    "total_votos":   _2026_total,
    "validos":       _2026_validos,
    "nulos":         _2026_nulos,
    "no_marcados":   _2026_no_marcados,
    "blanco":        406970,
    "participacion": 0.5788,
    "abstencion":    0.4212,
}

RANK_2022_1V = {
    "gustavo_petro":      (8527768, 0.4034),
    "rodolfo_hernandez":  (5953209, 0.2817),
    "federico_gutierrez": (5058010, 0.2394),
    "sergio_fajardo":     (888585,  0.0418),
}
RANK_2022_2V = {
    "gustavo_petro":     (11281013, 0.5044),
    "rodolfo_hernandez": (10580412, 0.4731),
}
RANK_2026_1V_TOP4 = {
    "abelardo_de_la_espriella": (10361499, 0.4374),
    "ivan_cepeda":              (9688361,  0.4090),
    "paloma_valencia":          (1639685,  0.0692),
    "sergio_fajardo":           (1009073,  0.0426),
}

# 2026 2V — preconteo Registraduría (≈99,99 % mesas) reproducido en Wikipedia (es).
# Totales nacionales de la tabla "sortable" de candidatos.
NACIONAL_2026_2V = {
    "censo":         41421973,   # mismo censo electoral que 1V (Registraduría)
    "total_votos":   26343135,
    "validos":       26092873,
    "nulos":         220763,
    "no_marcados":   29499,
    "blanco":        426801,
    "participacion": round(26343135 / 41421973, 4),   # 0.636
    "abstencion":    round(1 - 26343135 / 41421973, 4),
}
RANK_2026_2V = {
    "abelardo_de_la_espriella": (12959515, 0.4966),
    "ivan_cepeda":              (12708695, 0.4870),
}

# ─────────────────────────────────────────────────────────────────────────────
# HTML helpers
# ─────────────────────────────────────────────────────────────────────────────

def ensure_html(path: Path, url: str) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    print(f"  Descargando {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    path.write_text(html, encoding="utf-8")
    return html


def parse_table(html_t: str):
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html_t, re.DOTALL)
    out = []
    for r in rows:
        cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, re.DOTALL)
        clean = [
            re.sub(r"<[^>]+>", "", c)
            .replace("&nbsp;", " ")
            .replace("&#160;", " ")
            .replace("\xa0", "")
            .replace(",", ".")
            .strip()
            for c in cells
        ]
        out.append(clean)
    return out


def get_wikitables(html: str):
    return re.findall(
        r'<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>(.*?)</table>', html, re.DOTALL
    )


def to_int_votes(s: str) -> int:
    """Parsea una celda 'Votos': elimina puntos (separador miles tras cleaner) y no-dígitos."""
    s = re.sub(r"[^\d]", "", s or "")
    return int(s) if s else 0


def to_pct(s: str) -> float:
    """Parsea una celda '%' como fracción 0..1."""
    s = re.sub(r"[^\d.]", "", s or "")
    if not s or s == ".":
        return 0.0
    try:
        return float(s) / 100.0
    except ValueError:
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Extracción por elección
# ─────────────────────────────────────────────────────────────────────────────

def extract_depto_rows(rows, n_candidatos: int, has_blanco_col: bool = True):
    """Devuelve lista de (nombre_depto, [votos_por_candidato], votos_blanco_o_None).

    Filas reales empiezan tras 3 filas de encabezado (header, vicepres/empty, Votos/%).
    Cada candidato consume 2 columnas (Votos, %). El blanco también 2 columnas.
    """
    data_rows = []
    for r in rows[3:]:
        if not r or not r[0]:
            continue
        name = r[0]
        # Filas tipo source/total/exterior se manejan después
        if len(r) < 1 + n_candidatos * 2:
            continue
        votes = []
        for i in range(n_candidatos):
            votes.append(to_int_votes(r[1 + i * 2]))
        blanco = None
        if has_blanco_col and len(r) >= 1 + (n_candidatos + 1) * 2:
            blanco = to_int_votes(r[1 + n_candidatos * 2])
        data_rows.append((name, votes, blanco))
    return data_rows


def build_depto_aggregates(depto_rows, candidatos_ids, candidatos_meta):
    """Construye lista ElectoralAggDepto. depto_rows: (name, [votes], blanco_or_None)."""
    deptos_out = []
    no_mapeados = []
    for raw_name, votes, _blanco in depto_rows:
        if raw_name in EXTERIOR_KEYS:
            continue
        if raw_name not in DEPTO_DIVIPOLA:
            no_mapeados.append(raw_name)
            continue
        cod = DEPTO_DIVIPOLA[raw_name]
        nombre = DEPTO_CANONICAL.get(raw_name, raw_name)
        vpc = {cid: int(v) for cid, v in zip(candidatos_ids, votes)}
        total_validos = sum(vpc.values())
        # ganador
        ganador_id = max(vpc, key=lambda k: vpc[k]) if total_validos else candidatos_ids[0]
        ganador_ideologia = candidatos_meta.get(ganador_id, {}).get("ideologia", "centro")
        # votos por ideología
        vpi = {b: 0 for b in [
            "izquierda", "centro", "derecha"
        ]}
        for cid, v in vpc.items():
            ideo = candidatos_meta.get(cid, {}).get("ideologia", "centro")
            vpi[ideo] = vpi.get(ideo, 0) + v
        deptos_out.append({
            "cod_depto": cod,
            "nombre_depto": nombre,
            "ganador_id": ganador_id,
            "ganador_ideologia": ganador_ideologia,
            "votos_por_candidato": vpc,
            "votos_por_ideologia": vpi,
            "total_validos": total_validos,
            "total_votos": total_validos,  # sin blanco/nulos detallados por depto
            "censo": 0,
            "participacion": 0.0,
        })
    deptos_out.sort(key=lambda d: d["cod_depto"])
    return deptos_out, no_mapeados


def polarizacion_por_bloques(resultados_dict, candidatos_meta):
    """
    Calcula el Índice de Polarización Ideológica (IPI).
    IPI = (1 - share_centro) - (share_derecha - share_izquierda)^2
    Mide la concentración de votos en los extremos (Izquierda y Derecha)
    y el equilibrio de fuerzas entre ellos, penalizando la existencia del Centro.
    Rango: [0, 1].
    - 0: Toda la población está en el Centro (consenso absoluto).
    - 1: Población dividida 50% Izquierda y 50% Derecha (bipolarización pura).
    """
    bloque_share = {"izquierda": 0.0, "centro": 0.0, "derecha": 0.0}
    total = sum(resultados_dict.values())
    if total == 0:
        return 0.0
    for cid, votos in resultados_dict.items():
        ideo = candidatos_meta.get(cid, {}).get("ideologia", "centro")
        if ideo in bloque_share:
            bloque_share[ideo] += votos / total
    s_izq = bloque_share["izquierda"]
    s_cen = bloque_share["centro"]
    s_der = bloque_share["derecha"]
    suma = s_izq + s_cen + s_der
    if suma > 0:
        s_izq /= suma
        s_cen /= suma
        s_der /= suma
    return (1.0 - s_cen) - (s_der - s_izq) ** 2


# ─────────────────────────────────────────────────────────────────────────────
# Construcción de cada elección
# ─────────────────────────────────────────────────────────────────────────────

def build_2022_1v(html: str):
    tables = get_wikitables(html)
    rows = parse_table(tables[4])
    cand_ids = [c[0] for c in CANDS_2022_1V]
    depto_rows = extract_depto_rows(rows, n_candidatos=8, has_blanco_col=True)

    # Suma departamental para los 4 "otros" (Rodríguez, Gómez, Betancourt, Pérez)
    suma_por_cand = {cid: 0 for cid in cand_ids}
    for _name, votes, _blanco in depto_rows:
        for cid, v in zip(cand_ids, votes):
            suma_por_cand[cid] += v

    resultados = []
    # Top 4 con valores oficiales
    for cid, (votos, pct) in RANK_2022_1V.items():
        resultados.append({"id": cid, "votos": votos, "porcentaje": round(pct, 4)})
    # Otros 4: suma departamental
    for cid in ["john_milton_rodriguez", "enrique_gomez", "ingrid_betancourt", "luis_perez"]:
        v = suma_por_cand[cid]
        pct = v / NACIONAL_2022_1V["validos"]
        resultados.append({"id": cid, "votos": v, "porcentaje": round(pct, 4)})
    resultados.sort(key=lambda r: -r["votos"])

    deptos, no_map = build_depto_aggregates(depto_rows, cand_ids, CANDIDATOS_META)

    # Polarización con resultados nacionales
    res_dict = {r["id"]: r["votos"] for r in resultados}
    polar = polarizacion_por_bloques(res_dict, CANDIDATOS_META)

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {
                    "nombre": "Wikipedia (en) — tabla de Registraduría",
                    "url": URL_2022,
                },
                "registraduria": {
                    "nombre": "Registraduría Nacional del Estado Civil",
                    "url": "https://www.registraduria.gov.co/",
                },
            },
            "definiciones": {"estado": "escrutinio_definitivo"},
            "cobertura": {
                "eleccion": "2022-1v",
                "fecha": "2022-05-29",
                "total_registros": len(deptos),
            },
        },
        "eleccion": {"anio": 2022, "vuelta": 1, "fecha": "2022-05-29"},
        "resultados": resultados,
        "agregados": {
            "nacional": {
                "censo": NACIONAL_2022_1V["censo"],
                "total_votos": NACIONAL_2022_1V["total_votos"],
                "validos": NACIONAL_2022_1V["validos"],
                "nulos": NACIONAL_2022_1V["nulos"],
                "no_marcados": NACIONAL_2022_1V["no_marcados"],
                "participacion": NACIONAL_2022_1V["participacion"],
                "abstencion": NACIONAL_2022_1V["abstencion"],
            },
            "departamentos": deptos,
            "municipios": [],
        },
        "indicadores": {"polarizacion": round(polar, 4)},
        "_no_mapeados": no_map,
    }


def build_2022_2v(html: str):
    tables = get_wikitables(html)
    rows = parse_table(tables[5])
    cand_ids = [c[0] for c in CANDS_2022_2V]
    depto_rows = extract_depto_rows(rows, n_candidatos=2, has_blanco_col=True)

    resultados = [
        {"id": cid, "votos": v, "porcentaje": round(p, 4)}
        for cid, (v, p) in RANK_2022_2V.items()
    ]
    resultados.sort(key=lambda r: -r["votos"])
    deptos, no_map = build_depto_aggregates(depto_rows, cand_ids, CANDIDATOS_META)
    res_dict = {r["id"]: r["votos"] for r in resultados}
    polar = polarizacion_por_bloques(res_dict, CANDIDATOS_META)

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {
                    "nombre": "Wikipedia (en) — tabla de Registraduría",
                    "url": URL_2022,
                },
                "registraduria": {
                    "nombre": "Registraduría Nacional del Estado Civil",
                    "url": "https://www.registraduria.gov.co/",
                },
            },
            "definiciones": {"estado": "escrutinio_definitivo"},
            "cobertura": {
                "eleccion": "2022-2v",
                "fecha": "2022-06-19",
                "total_registros": len(deptos),
            },
        },
        "eleccion": {"anio": 2022, "vuelta": 2, "fecha": "2022-06-19"},
        "resultados": resultados,
        "agregados": {
            "nacional": {
                "censo": NACIONAL_2022_2V["censo"],
                "total_votos": NACIONAL_2022_2V["total_votos"],
                "validos": NACIONAL_2022_2V["validos"],
                "nulos": NACIONAL_2022_2V["nulos"],
                "no_marcados": NACIONAL_2022_2V["no_marcados"],
                "participacion": NACIONAL_2022_2V["participacion"],
                "abstencion": NACIONAL_2022_2V["abstencion"],
            },
            "departamentos": deptos,
            "municipios": [],
        },
        "indicadores": {"polarizacion": round(polar, 4)},
        "_no_mapeados": no_map,
    }


def build_2026_1v(html: str):
    tables = get_wikitables(html)
    rows = parse_table(tables[12])
    cand_ids = [c[0] for c in CANDS_2026_1V]
    # Layout: [Depto] + 13 * (Votos, %) + (Blanco, %) + Nulos + NoMarcados + Total + %Particip
    depto_rows_raw = rows[3:]
    depto_rows = []
    for r in depto_rows_raw:
        if not r or not r[0]:
            continue
        name = r[0]
        if name in {"Votos", "%"}:  # encabezados que se colaron
            continue
        if len(r) < 1 + 13 * 2:
            continue
        votes = [to_int_votes(r[1 + i * 2]) for i in range(13)]
        depto_rows.append((name, votes, None))

    # Sumas departamentales para los 9 "otros"
    suma_por_cand = {cid: 0 for cid in cand_ids}
    for _name, votes, _ in depto_rows:
        for cid, v in zip(cand_ids, votes):
            suma_por_cand[cid] += v

    resultados = []
    for cid, (votos, pct) in RANK_2026_1V_TOP4.items():
        resultados.append({"id": cid, "votos": votos, "porcentaje": round(pct, 4)})
    others = ["claudia_lopez", "daniel_palacios_botero", "daniel_quintero_lizcano",
              "miguel_uribe_londono", "david_luna_garvin", "roy_barreras",
              "juan_fernando_cristo_murillo", "luis_gilberto_murillo_caicedo",
              "camilo_romero_matamoros"]
    for cid in others:
        v = suma_por_cand[cid]
        pct = v / NACIONAL_2026_1V["validos"] if NACIONAL_2026_1V["validos"] else 0.0
        resultados.append({"id": cid, "votos": v, "porcentaje": round(pct, 4)})
    resultados.sort(key=lambda r: -r["votos"])

    deptos, no_map = build_depto_aggregates(depto_rows, cand_ids, CANDIDATOS_META)

    res_dict = {r["id"]: r["votos"] for r in resultados}
    polar = polarizacion_por_bloques(res_dict, CANDIDATOS_META)

    # Distancias a mayoría simple
    mayoria = math.ceil(NACIONAL_2026_1V["validos"] / 2) + 1
    distancias = {r["id"]: max(0, mayoria - r["votos"]) for r in resultados}

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {
                    "nombre": "Wikipedia (es) — tabla de Registraduría (preconteo)",
                    "url": URL_2026,
                },
                "registraduria": {
                    "nombre": "Registraduría Nacional del Estado Civil",
                    "url": "https://www.registraduria.gov.co/",
                },
            },
            "definiciones": {"estado": "preconteo"},
            "cobertura": {
                "eleccion": "2026-1v",
                "fecha": "2026-05-31",
                "total_registros": len(deptos),
            },
        },
        "eleccion": {"anio": 2026, "vuelta": 1, "fecha": "2026-05-31"},
        "resultados": resultados,
        "agregados": {
            "nacional": {
                "censo": NACIONAL_2026_1V["censo"],
                "total_votos": NACIONAL_2026_1V["total_votos"],
                "validos": NACIONAL_2026_1V["validos"],
                "nulos": NACIONAL_2026_1V["nulos"],
                "no_marcados": NACIONAL_2026_1V["no_marcados"],
                "participacion": NACIONAL_2026_1V["participacion"],
                "abstencion": NACIONAL_2026_1V["abstencion"],
            },
            "departamentos": deptos,
            "municipios": [],
        },
        "indicadores": {
            "polarizacion": round(polar, 4),
            "costo_votos": {"mayoria_simple": mayoria, "distancias": distancias},
        },
        "_no_mapeados": no_map,
    }


def _find_depto_table_2026_2v(html: str):
    """Localiza la tabla departamental de 2ª vuelta 2026 por contenido.

    Distintivo: contiene una fila 'Antioquia' con el layout de 2 candidatos
    (fila corta), a diferencia de la tabla de 1ª vuelta (13 candidatos → fila
    larga). Las tablas se devuelven en orden de documento, así que la de 1V
    (que aparece antes) se descarta por longitud.
    """
    for t in get_wikitables(html):
        rows = parse_table(t)
        for r in rows:
            if r and r[0] == "Antioquia" and 9 <= len(r) <= 14:
                return rows
    return None


def build_2026_2v(html: str):
    rows = _find_depto_table_2026_2v(html)
    if rows is None:
        raise RuntimeError(
            "No se encontró la tabla departamental de 2ª vuelta 2026 en el HTML "
            "(¿el caché es anterior al 21-jun-2026?)."
        )
    cand_ids = [c[0] for c in CANDS_2026_2V]

    # Layout de cada fila tras limpiar:
    # [Depto, DE_votos, DE_%, CEP_votos, CEP_%, blanco, blanco_%, nulos, no_marcados, total, total_%]
    depto_rows = []
    for r in rows:
        if not r or not r[0]:
            continue
        name = r[0]
        if name in {"Votos", "%", "Departamentos"}:
            continue
        if name not in DEPTO_DIVIPOLA and name not in EXTERIOR_KEYS:
            continue
        if len(r) < 1 + 2 * 2:
            continue
        votes = [to_int_votes(r[1]), to_int_votes(r[3])]
        blanco = to_int_votes(r[5]) if len(r) > 5 else None
        depto_rows.append((name, votes, blanco))

    # Norte de Santander viene vacío en el preconteo reproducido en Wikipedia →
    # se imputa por residual contra el total nacional (que incluye el exterior).
    nat_de = RANK_2026_2V["abelardo_de_la_espriella"][0]
    nat_cep = RANK_2026_2V["ivan_cepeda"][0]
    ext_de = ext_cep = sum_de = sum_cep = 0
    nds_idx = None
    for i, (name, votes, _b) in enumerate(depto_rows):
        if name in EXTERIOR_KEYS:
            ext_de += votes[0]; ext_cep += votes[1]
        elif name == "Norte de Santander":
            nds_idx = i
        else:
            sum_de += votes[0]; sum_cep += votes[1]
    nds_imputado = False
    if nds_idx is not None and depto_rows[nds_idx][1] == [0, 0]:
        depto_rows[nds_idx] = (
            "Norte de Santander",
            [nat_de - ext_de - sum_de, nat_cep - ext_cep - sum_cep],
            None,
        )
        nds_imputado = True

    deptos, no_map = build_depto_aggregates(depto_rows, cand_ids, CANDIDATOS_META)

    resultados = [
        {"id": cid, "votos": v, "porcentaje": round(p, 4)}
        for cid, (v, p) in RANK_2026_2V.items()
    ]
    resultados.sort(key=lambda r: -r["votos"])
    res_dict = {r["id"]: r["votos"] for r in resultados}
    polar = polarizacion_por_bloques(res_dict, CANDIDATOS_META)

    definiciones = {"estado": "preconteo"}
    if nds_imputado:
        definiciones["nota_norte_de_santander"] = (
            "Votos de Norte de Santander imputados por residual contra el total "
            "nacional: el preconteo reproducido aún no publicaba su desglose."
        )

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {
                    "nombre": "Wikipedia (es) — tabla de Registraduría (preconteo segunda vuelta)",
                    "url": URL_2026,
                },
                "registraduria": {
                    "nombre": "Registraduría Nacional del Estado Civil",
                    "url": "https://resultados.registraduria.gov.co/v2/resultados/0/00",
                },
            },
            "definiciones": definiciones,
            "cobertura": {
                "eleccion": "2026-2v",
                "fecha": "2026-06-21",
                "total_registros": len(deptos),
            },
        },
        "eleccion": {"anio": 2026, "vuelta": 2, "fecha": "2026-06-21"},
        "resultados": resultados,
        "agregados": {
            "nacional": {
                "censo": NACIONAL_2026_2V["censo"],
                "total_votos": NACIONAL_2026_2V["total_votos"],
                "validos": NACIONAL_2026_2V["validos"],
                "nulos": NACIONAL_2026_2V["nulos"],
                "no_marcados": NACIONAL_2026_2V["no_marcados"],
                "participacion": NACIONAL_2026_2V["participacion"],
                "abstencion": NACIONAL_2026_2V["abstencion"],
            },
            "departamentos": deptos,
            "municipios": [],
        },
        "indicadores": {"polarizacion": round(polar, 4)},
        "_no_mapeados": no_map,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Outputs auxiliares
# ─────────────────────────────────────────────────────────────────────────────

def build_candidatos():
    def fila(cid, nombre):
        m = CANDIDATOS_META.get(cid, {})
        f = {"id": cid, "nombre": nombre, "partido": m.get("partido", "—"), "ideologia": m.get("ideologia", "centro")}
        if "coalicion" in m:
            f["coalicion"] = m["coalicion"]
        if m.get("_revision_requerida"):
            f["_revision_requerida"] = True
        return f

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "curacion_autor": {
                    "nombre": "Curación del autor",
                    "url": "https://github.com/fredericksalazar/fredericksalazar.github.io",
                }
            },
            "definiciones": {
                "ideologia": "Clasificación analítica del autor basada en trayectoria pública.",
                "bloques": ["izquierda", "centro", "derecha"],
            },
            "cobertura": {"elecciones": ["2022-1v", "2022-2v", "2026-1v", "2026-2v"]},
        },
        "candidatos": {
            "2022-1v": [fila(cid, nm) for cid, nm, _ in CANDS_2022_1V],
            "2022-2v": [fila(cid, nm) for cid, nm, _ in CANDS_2022_2V],
            "2026-1v": [fila(cid, nm) for cid, nm, _ in CANDS_2026_1V],
            "2026-2v": [fila(cid, nm) for cid, nm, _ in CANDS_2026_2V],
        },
    }


def build_geografia(d2022_1v, d2022_2v, d2026_1v, d2026_2v):
    def project(d):
        return [
            {
                "cod_depto": x["cod_depto"],
                "nombre_depto": x["nombre_depto"],
                "ganador_id": x["ganador_id"],
                "ganador_ideologia": x["ganador_ideologia"],
                "total_validos": x["total_validos"],
                "participacion": x.get("participacion", 0.0),
            }
            for x in d["agregados"]["departamentos"]
        ]
    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {"nombre": "Wikipedia — tablas Registraduría", "url": URL_2022 + " / " + URL_2026},
            },
            "definiciones": {"nivel": "departamento"},
            "cobertura": {"elecciones": ["2022-1v", "2022-2v", "2026-1v", "2026-2v"]},
        },
        "departamentos_2022_1v": project(d2022_1v),
        "departamentos_2022_2v": project(d2022_2v),
        "departamentos_2026_1v": project(d2026_1v),
        "departamentos_2026_2v": project(d2026_2v),
    }


def build_comparativo(d2022_1v, d2026_1v):
    p22 = d2022_1v["indicadores"]["polarizacion"]
    p26 = d2026_1v["indicadores"]["polarizacion"]

    # delta por departamento (share por bloque) entre 2022_1v y 2026_1v
    def shares_por_ideo(deptos_list):
        out = {}
        for d in deptos_list:
            total = d["total_validos"] or 1
            out[d["cod_depto"]] = {k: v / total for k, v in d["votos_por_ideologia"].items()}
        return out

    s22 = shares_por_ideo(d2022_1v["agregados"]["departamentos"])
    s26 = shares_por_ideo(d2026_1v["agregados"]["departamentos"])

    serie_dep = []
    cods = sorted(set(s22.keys()) & set(s26.keys()))
    name_by_cod = {d["cod_depto"]: d["nombre_depto"] for d in d2026_1v["agregados"]["departamentos"]}
    for cod in cods:
        delta = {}
        for k in s26[cod]:
            delta[k] = round(s26[cod].get(k, 0) - s22[cod].get(k, 0), 4)
        serie_dep.append({"cod_depto": cod, "nombre_depto": name_by_cod.get(cod, cod), "delta_por_ideologia": delta})

    return {
        "metadata": {
            "ultima_actualizacion": NOW_ISO,
            "fuentes": {
                "wikipedia": {"nombre": "Wikipedia — tablas Registraduría", "url": URL_2022 + " / " + URL_2026},
            },
            "definiciones": {"polarizacion": "Índice de dispersión por bloque ideológico (0..1)."},
            "cobertura": {"elecciones": ["2022-1v", "2026-1v"]},
        },
        "nacional": {
            "polarizacion_2022": p22,
            "polarizacion_2026": p26,
            "delta": round(p26 - p22, 4),
        },
        "serie_departamentos": serie_dep,
        "serie_municipios": [],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("→ Cargando HTMLs cacheados …")
    html_2022 = ensure_html(CACHE_2022, URL_2022)
    html_2026 = ensure_html(CACHE_2026, URL_2026)

    print("→ Construyendo 2022 1V …")
    d_2022_1v = build_2022_1v(html_2022)
    print(f"   {len(d_2022_1v['agregados']['departamentos'])} deptos, no_mapeados={d_2022_1v.pop('_no_mapeados')}")

    print("→ Construyendo 2022 2V …")
    d_2022_2v = build_2022_2v(html_2022)
    print(f"   {len(d_2022_2v['agregados']['departamentos'])} deptos, no_mapeados={d_2022_2v.pop('_no_mapeados')}")

    print("→ Construyendo 2026 1V …")
    d_2026_1v = build_2026_1v(html_2026)
    print(f"   {len(d_2026_1v['agregados']['departamentos'])} deptos, no_mapeados={d_2026_1v.pop('_no_mapeados')}")

    print("→ Construyendo 2026 2V …")
    d_2026_2v = build_2026_2v(html_2026)
    print(f"   {len(d_2026_2v['agregados']['departamentos'])} deptos, no_mapeados={d_2026_2v.pop('_no_mapeados')}")

    print("→ Catálogo de candidatos …")
    cands = build_candidatos()

    print("→ Geografía compacta …")
    geo = build_geografia(d_2022_1v, d_2022_2v, d_2026_1v, d_2026_2v)

    print("→ Comparativo 2022 vs 2026 …")
    comp = build_comparativo(d_2022_1v, d_2026_1v)

    # ─── Escribir
    outputs = {
        "data_pres_2022_1v.json":   d_2022_1v,
        "data_pres_2022_2v.json":   d_2022_2v,
        "data_pres_2026_1v.json":   d_2026_1v,
        "data_pres_2026_2v.json":   d_2026_2v,
        "data_pres_candidatos.json": cands,
        "data_pres_geografia.json": geo,
        "data_pres_comparativo.json": comp,
    }
    for fname, payload in outputs.items():
        path = OUT / fname
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        size_kb = path.stat().st_size / 1024
        print(f"   ✓ {fname}  ({size_kb:.1f} KB)")

    print("\nResumen:")
    print(f"  2022 1V polarización = {d_2022_1v['indicadores']['polarizacion']}")
    print(f"  2022 2V polarización = {d_2022_2v['indicadores']['polarizacion']}")
    print(f"  2026 1V polarización = {d_2026_1v['indicadores']['polarizacion']}")
    print(f"  2026 2V polarización = {d_2026_2v['indicadores']['polarizacion']}")
    print(f"  Top-2 2026 2V: {[(r['id'], r['votos']) for r in d_2026_2v['resultados'][:2]]}")
    print(f"  Top-3 2022 1V: {[(r['id'], r['votos']) for r in d_2022_1v['resultados'][:3]]}")
    print(f"  Top-3 2022 2V: {[(r['id'], r['votos']) for r in d_2022_2v['resultados'][:3]]}")
    print(f"  Top-3 2026 1V: {[(r['id'], r['votos']) for r in d_2026_1v['resultados'][:3]]}")


if __name__ == "__main__":
    main()
