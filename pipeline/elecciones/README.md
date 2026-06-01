# Pipeline de Elecciones Presidenciales

Genera los JSONs consumidos por el módulo `/elecciones-presidenciales/`.

## Requisitos

- Python 3.11+
- `pip install -r requirements.txt` (pandas, jsonschema)

## Ejecutar

Desde la raíz del repo:

```bash
python3 -m pipeline.elecciones.from_wikipedia
python3 -m pipeline.elecciones.validar_jsons
```

`from_wikipedia.py` lee los HTMLs cacheados en `/tmp/wiki_2022.html` y
`/tmp/wiki_2026.html` (o los descarga si no existen) y extrae los desgloses
departamentales reales de Registraduría. El antiguo `generar_jsons.py` quedó
como `generar_jsons_mock.py` solo a modo de referencia de schema.

Esto regenera todos los `public/data/data_pres_*.json`.

## Estructura

- `config.py` — paths y constantes globales.
- `fuentes.py` — URLs y descargas de datos crudos.
- `aliases_partidos.json` — diccionario de normalización de nombres de partidos/candidatos.
- `normalizar_resultados.py` — CSV de Registraduría → DataFrame canónico.
- `ideologia.py` — asignación curada de bloque ideológico a cada candidato.
- `agregar_geografico.py` — sumas por departamento y municipio (códigos DIVIPOLA).
- `derivar_indicadores.py` — polarización, distancia a mayoría, comparativos 2022/2026.
- `derivar_financiacion.py` — ROI por voto y reposición CNE.
- `generar_jsons.py` — orquesta todo y escribe a `public/data/`.
- `validar_jsons.py` — valida que cada JSON cumple su contrato (§7 del plan).

## Datos crudos

Se descargan a `data/raw/registraduria/` y `data/raw/cne/`. Estos directorios
NO se versionan: cada quien descarga lo que necesite. Ver `fuentes.py` para las
URLs canónicas.

## Estado actual

Los JSONs en `public/data/` actualmente contienen valores **placeholder** /
preconteo. Cuando la Registraduría publique escrutinio definitivo 2026 1ª
vuelta, descargar el CSV oficial y volver a ejecutar `generar_jsons.py`.
