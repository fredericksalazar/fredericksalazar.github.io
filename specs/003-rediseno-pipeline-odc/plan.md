# Implementation Plan: Rediseño y desacoplamiento del pipeline de datos del Observatorio (odc-data-pipeline)

**Branch**: `feature/odc-data-pipeline` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-rediseno-pipeline-odc/spec.md`

## Summary

Rediseño completo de la arquitectura de datos del Observatorio de Datos de Colombia:
1. **Desacoplamiento total**: Extracción de toda la lógica de ingesta (`ingestion/`), pipelines complementarios (`pipeline/`), scripts duplicados (`scripts/build-comparativo.mjs`), datos crudos y consolidados (`data/raw/`, `data/processed/`) fuera del repositorio web `fredericksalazar.github.io`, migrándolos al repositorio privado independiente `/Users/frederick/GitHub/odc-data-pipeline`.
2. **Catálogo declarativo**: Centralización de todas las fuentes (`dane`, `banrep`, `world_bank`, `wikipedia`) y datasets en `config/data-sources.yaml`.
3. **Automatización de notebooks y 18 indicadores del Banco Mundial**: Reemplazo de `macro_economics_ingestion.ipynb` y `macro_economics_processed.ipynb` por `worldBank-ingesta.py` con `wbgapi` (incluyendo esperanza de vida para mujeres y hombres), eliminando archivos manuales.
4. **Flujo de microdatos optimizado**: Descompresión limpia de los microdatos de la GEIH descartando carpetas `.dat`/`.sav` y conservando exclusivamente los `.csv`.
5. **Generación rigurosa de contratos**: Normalización de nulos reales (`null` sin ceros ni `-100.0` espurios, REGLA 7) y emisión de contratos JSON idénticos a los actuales en `data/processed/observatorio/`.
6. **Entrega continua con GitHub Actions**: Workflow modular por steps que ejecuta pruebas y publica automáticamente solo los `data_*.json` hacia `public/data/` en `fredericksalazar.github.io` mediante el secret `WEB_REPO_TOKEN`.

---

## Technical Context

**Language/Version**: Python 3.12 (CI y desarrollo local; mínimo Python 3.11) en `odc-data-pipeline`; TypeScript estricto / Astro 6 en `fredericksalazar.github.io`.

**Primary Dependencies**:
- `odc-data-pipeline`: `pandas>=2.2,<3`, `requests>=2.31,<3`, `wbgapi>=0.2`, `pyyaml>=6.0`, `openpyxl>=3.1,<4`, `pytest>=8,<9`.
- `fredericksalazar.github.io`: Sin dependencias nuevas (se eliminan dependencias de Python del repo web).

**Storage**:
- `data/raw/[source]/[dataset]/`: CSVs y tablas crudas sin cruces.
- `data/processed/master/`: Tablas maestras unificadas (`master_world_bank_global.csv`, `master_colombia_anual.csv`, `master_colombia_mensual.csv`).
- `data/processed/observatorio/`: Contratos JSON listos para publicación.
- `data/metadata/`: Catálogo `countries_master.csv`, manifiesto de ejecución y tablas de referencia.

**Testing**: `pytest tests/ -v` en `odc-data-pipeline` (cobertura de fuentes, transformaciones, validación de esquemas y guardas de no regresión ARQ-18); `npx astro check` y `npm run build` en el repo web.

**Target Platform**: Linux (GitHub Actions ubuntu-latest) y macOS local; entrega estática en GitHub Pages.

**Project Type**: Plataforma de ingeniería de datos (ETL/ELT modular) + sitio web estático desacoplado.

**Performance Goals**: Ejecución del pipeline completo en GitHub Actions en <5 minutos para corridas mensuales; tiempo de lectura de gráficos en el frontend <100ms vía fetch estático.

**Constraints**:
- El repositorio web debe permanecer 100 % estático (ARQ-01) y consumir datos exclusivamente desde `public/data/*.json` (ARQ-02).
- Cero valores faltantes representados con ceros o `-100.0` (REGLA 7).
- Ninguna regresión de datos en los JSON publicados (ARQ-18).
- Código legible por humanos en funciones modulares sin clases innecesarias (PRD-08).

**Scale/Scope**: 4 proveedores (`dane`, `banrep`, `world_bank`, `wikipedia`), 15+ datasets, ~14.190 filas multi-país desde 1960, ~250 meses de histórico mensual y 12 contratos JSON para el sitio web.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Resultado | Evidencia |
|---|---|---|---|
| **G1** | ¿Objetivo, pilar y KPI de `PRODUCT.md` declarados? | ✅ | Spec declara O1 (Autoridad), O2 (Monetización), Pilares P3 (Observatorio) y P4 (Blog), y KPI K6 (Frescura del Observatorio) y K5 (Autoridad). |
| **G2** | ¿Todo dato viene de pipeline con fuente oficial y sin inventar nada? | ✅ | Todas las cifras provienen de DANE, BanRep, Banco Mundial y decretos oficiales en Wikipedia. Se corrigen los ceros ficticios garantizando la REGLA 7 y el Principio II. |
| **G3** | ¿Se reutiliza lo existente en vez de duplicar? | ✅ | Se unifica la lógica de deltas y serialización en `pipeline/utils/json_contract.py` (eliminando la sextuplicación actual); se unifica el productor de comparativos eliminando `scripts/build-comparativo.mjs` (ARQ-19). |
| **G4** | ¿La interfaz cumple las reglas UI-NN? | ✅ | Los contratos JSON preservan exactamente la estructura requerida por los componentes de UI (`Chart.astro`, `KpiRow`, `IndicadorPanel`, calculadoras). No hay cambios en la capa visual. |
| **G5** | ¿Sigue siendo estático con contenido de valor en HTML y accesible? | ✅ | El sitio web sigue siendo 100 % estático generado por Astro; los JSON se sincronizan a `public/data/` para lectura build-time y client-side (ARQ-01, ARQ-02, REGLA 2 y 3). |
| **G6** | ¿Se respetan las reglas ARQ-NN y no hay dependencias sin justificar? | ✅ | Se cumple ARQ-11 (pipelines reproducibles), ARQ-18 (no regresión), ARQ-13 (documentación neutral). Se eliminan dependencias de Python del repositorio web. |
| **G7** | ¿Las tareas incluyen definición de terminado y actualización de `agents/`? | ✅ | El plan incluye la actualización de `agents/ARCHITECTURE.md`, `agents/AGENTS.md` y `src/lib/observatorio/ARCHITECTURE.md` para reflejar el nuevo repositorio. |

**Re-check post-diseño:** Sin violaciones; todas las compuertas aprobadas. *Complexity Tracking* vacío.

---

## Project Structure

### Documentation (este feature)

```text
specs/003-rediseno-pipeline-odc/
├── plan.md                          # Este documento de planificación
├── research.md                      # Decisiones técnicas y de arquitectura
├── data-model.md                    # Modelo de configuración, raw, master y contratos
├── quickstart.md                    # Guía de ejecución, pruebas y validación
├── contracts/
│   ├── data-sources-schema.md       # Esquema normativo de config/data-sources.yaml
│   └── observatorio-json-contracts.md # Especificación de contratos JSON
└── checklists/
    └── requirements.md              # Validación de calidad de la especificación
```

### Repositorio Privado: `/Users/frederick/GitHub/odc-data-pipeline/`

```text
odc-data-pipeline/
├── .github/
│   └── workflows/
│       └── data_pipeline.yml        # Orquestación CI/CD (steps modulares + sync web)
├── config/
│   └── data-sources.yaml            # Catálogo centralizado de fuentes y datasets
├── data/
│   ├── raw/
│   │   ├── dane/
│   │   │   ├── ipc_variacion/
│   │   │   ├── ipc_indices/
│   │   │   ├── geih_mercado_laboral/
│   │   │   ├── geih_formalidad/
│   │   │   ├── geih/                # CSVs de ocupados tras descompresión limpia
│   │   │   ├── exportaciones/
│   │   │   └── importaciones/
│   │   ├── banrep/
│   │   │   ├── tasas_interes/
│   │   │   └── trm/
│   │   ├── world_bank/
│   │   │   └── [18 datasets]/
│   │   └── wikipedia/
│   │       ├── salario_minimo/
│   │       └── elecciones/
│   ├── processed/
│   │   ├── master/                  # Tablas analíticas unificadas (anual, mensual, global)
│   │   └── observatorio/            # data_*.json generados y listos para entrega
│   └── metadata/
│       ├── countries_master.csv     # Catálogo oficial de países
│       └── ingestion_manifest.json  # Manifiesto de estado y coberturas
├── pipeline/
│   ├── __init__.py
│   ├── main.py                      # Orquestador general CLI
│   ├── ingesta/
│   │   ├── __init__.py
│   │   ├── banrep_ingesta.py        # Funciones modulares por dataset BanRep
│   │   ├── dane_ingesta.py          # Funciones modulares por dataset DANE
│   │   ├── world_bank_ingesta.py    # Ingesta wbgapi (18 indicadores)
│   │   └── wikipedia_ingesta.py     # Ingesta Salario Mínimo y Elecciones
│   ├── processing/
│   │   ├── __init__.py
│   │   ├── build_master_tables.py   # Construye tablas analíticas unificadas
│   │   ├── build_inflacion.py       # Emite data_inflacion.json
│   │   ├── build_empleo.py          # Emite data_empleo.json
│   │   ├── build_pib.py             # Emite data_pib.json
│   │   ├── build_comercio.py        # Emite data_comercio.json
│   │   ├── build_externo.py         # Emite data_externo.json
│   │   ├── build_demografia.py      # Emite data_demografia.json
│   │   ├── build_comparativo.py     # Emite data_comparativo_col_<key>.json
│   │   ├── build_salario_minimo.py  # Emite data_salario_minimo.json
│   │   ├── build_ingresos.py        # Emite data_ingresos.json y salarios_cargos.json
│   │   └── build_elecciones.py      # Emite data_pres_*.json
│   └── utils/
│       ├── __init__.py
│       ├── config_loader.py         # Lector y validador de data-sources.yaml
│       ├── http_client.py           # Descarga resiliente con reintentos
│       ├── json_contract.py         # Serializador, diferencias y formato de contrato
│       └── validators.py            # Validador de no regresión y esquema
├── tests/
│   ├── test_config.py               # Valida data-sources.yaml
│   ├── test_ingesta.py              # Pruebas unitarias de ingesta
│   ├── test_processing.py           # Pruebas de integración y consolidación
│   └── test_contracts.py            # Valida paridad de contratos JSON
├── requirements.txt                 # Dependencias fijadas del pipeline
└── README.md                        # Documentación técnica del repositorio
```

### Repositorio Público: `/Users/frederick/GitHub/fredericksalazar.github.io/`

```text
fredericksalazar.github.io/
├── public/data/                     # CONTRATO: recibe los JSON finales de odc-data-pipeline
│   ├── data_inflacion.json
│   ├── data_empleo.json
│   ├── data_pib.json
│   ├── data_comercio.json
│   ├── data_externo.json
│   ├── data_demografia.json
│   ├── data_comparativo_col_*.json
│   ├── data_salario_minimo.json
│   ├── data_ingresos.json
│   ├── data_salarios_cargos.json
│   └── data_pres_*.json
├── agents/
│   ├── ARCHITECTURE.md              # Actualizado: documenta odc-data-pipeline y resuelve deudas
│   └── AGENTS.md                    # Actualizado: comandos de datos delegados al nuevo repo
├── src/lib/observatorio/
│   └── ARCHITECTURE.md              # Actualizado: referencia a odc-data-pipeline
├── [ELIMINADO] ingestion/           # Retirado por completo del repo web
├── [ELIMINADO] pipeline/            # Retirado por completo del repo web
├── [ELIMINADO] data/raw/            # Retirado por completo del repo web
├── [ELIMINADO] data/processed/      # Retirado por completo del repo web
├── [ELIMINADO] scripts/build-comparativo.mjs # Retirado (unificado en odc-data-pipeline)
└── [ELIMINADO] .github/workflows/ingest-monthly.yml # Retirado (vive en odc-data-pipeline)
```

**Structure Decision**: Separación estricta de repositorios según el principio de responsabilidad única. El repositorio web solo mantiene la capa de presentación SSG, consumiendo los JSON estáticos generados por el repositorio privado `odc-data-pipeline`.

---

## Complexity Tracking

> **Sin violaciones a la constitución.** Toda la arquitectura sigue las reglas ARQ-01, ARQ-02, ARQ-11, ARQ-18, ARQ-19 y las reglas del Observatorio.

---

## Orden de Implementación Sugerido

1. **Fase 1 — Estructura base y utilidades en `odc-data-pipeline`**:
   - Crear estructura de carpetas en `/Users/frederick/GitHub/odc-data-pipeline`.
   - Copiar catálogo `countries_master.csv` a `data/metadata/`.
   - Crear `config/data-sources.yaml` según [contracts/data-sources-schema.md](./contracts/data-sources-schema.md).
   - Implementar `pipeline/utils/config_loader.py`, `http_client.py` y `json_contract.py`.
2. **Fase 2 — Módulos de ingesta modular (`pipeline/ingesta/`)**:
   - `world_bank_ingesta.py`: Descarga de los 18 indicadores con `wbgapi` y cruce con países.
   - `banrep_ingesta.py`: Consumo SDMX de TPM y TRM.
   - `dane_ingesta.py`: Descarga de boletines IPC, Empleo, Comercio y flujo optimizado de GEIH microdatos.
   - `wikipedia_ingesta.py`: Extracción de Salario Mínimo y Elecciones con anclas.
3. **Fase 3 — Módulos de procesamiento y generación de contratos (`pipeline/processing/`)**:
   - `build_master_tables.py`: Fusión analítica de tablas maestras.
   - Exportadores `build_*.py` para cada uno de los contratos JSON.
4. **Fase 4 — Suite de pruebas y validación de paridad (`tests/`)**:
   - Implementar `tests/test_contracts.py` comparando los JSON generados contra los vigentes en la web para garantizar paridad exacta de esquema y datos.
5. **Fase 5 — Orquestación GitHub Actions (`.github/workflows/data_pipeline.yml`)**:
   - Configurar steps modulares, ejecución de tests y step de entrega automática a `fredericksalazar.github.io/public/data/`.
6. **Fase 6 — Limpieza y actualización del repositorio web**:
   - Eliminar `ingestion/`, `pipeline/`, `data/raw/`, `data/processed/`, scripts redundantes y workflow mensual.
   - Actualizar `agents/ARCHITECTURE.md`, `agents/AGENTS.md` y `src/lib/observatorio/ARCHITECTURE.md`.
   - Ejecutar `npx astro check` y `npm run build` para validar que el sitio sigue funcionando al 100 %.
