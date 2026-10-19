# Tasks: Rediseño y desacoplamiento del pipeline de datos del Observatorio (odc-data-pipeline)

**Input**: Implementation plan from `specs/003-rediseno-pipeline-odc/plan.md`  
**Feature Branch**: `feature/odc-data-pipeline` | **Date**: 2026-10-17

---

## Phase 1: Setup (Estructura base del repositorio independiente)

**Purpose**: Inicialización del entorno, dependencias y estructura de directorios en `/Users/frederick/GitHub/odc-data-pipeline/`.

- [x] T001 Crear estructura de directorios (`config/`, `data/raw/`, `data/processed/master/`, `data/processed/observatorio/`, `data/metadata/`, `pipeline/ingesta/`, `pipeline/processing/`, `pipeline/utils/`, `tests/`, `.github/workflows/`) en `/Users/frederick/GitHub/odc-data-pipeline/`
- [x] T002 [P] Definir dependencias del pipeline (`pandas>=2.2,<3`, `requests>=2.31,<3`, `wbgapi>=0.2`, `pyyaml>=6.0`, `openpyxl>=3.1,<4`, `pytest>=8,<9`) en `/Users/frederick/GitHub/odc-data-pipeline/requirements.txt`
- [x] T003 [P] Copiar catálogo oficial de países y grupos de ingreso a `/Users/frederick/GitHub/odc-data-pipeline/data/metadata/countries_master.csv`
- [x] T004 [P] Configurar `.gitignore` en `/Users/frederick/GitHub/odc-data-pipeline/.gitignore` excluyendo `.venv/`, `__pycache__/`, `.pytest_cache/`, `*.tmp` y archivos temporales de descarga

---

## Phase 2: Foundational (Catálogo declarativo y utilidades compartidas)

**Purpose**: Infraestructura central y utilidades requeridas por todas las fuentes e historias de usuario.

**⚠️ CRITICAL**: Ninguna tarea de ingesta o procesamiento puede comenzar sin este bloque completado.

- [x] T005 Crear catálogo declarativo normativo de todas las fuentes y datasets en `/Users/frederick/GitHub/odc-data-pipeline/config/data-sources.yaml` según `contracts/data-sources-schema.md`
- [x] T006 [P] Implementar cargador y validador del catálogo YAML en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/utils/config_loader.py`
- [x] T007 [P] Implementar cliente HTTP con reintentos exponenciales, timeouts y user-agent identificado en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/utils/http_client.py`
- [x] T008 [P] Implementar funciones comunes de contrato JSON (`_scalar` para floats/NaN, cálculo de deltas por frecuencia, clasificador de variación `sube`/`baja`/`estable` y guardas de no regresión ARQ-18) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/utils/json_contract.py`
- [x] T009 Crear pruebas unitarias del cargador de configuración en `/Users/frederick/GitHub/odc-data-pipeline/tests/test_config.py`

**Checkpoint**: Base lista: el catálogo se valida y las utilidades compartidas están disponibles para la ingesta.

---

## Phase 3: User Story 1 - Ingesta modular por fuente y dataset (Priority: P1) 🎯 MVP

**Goal**: Implementar la ingesta modular para DANE, BanRep, Banco Mundial (18 indicadores con `wbgapi`) y Wikipedia (Salario Mínimo y Elecciones), almacenando los datos crudos estandarizados en `data/raw/[source]/[dataset]/`.

**Independent Test**: Ejecutar cada script de ingesta por CLI para un dataset específico (`python -m pipeline.ingesta.<script> --dataset <id>`) y verificar que genera el CSV correspondiente en `data/raw/` con esquema válido y sin errores.

- [x] T010 [P] [US1] Implementar módulo de ingesta BanRep (TPM mensual y TRM promediada) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/ingesta/banrep_ingesta.py`
- [x] T011 [P] [US1] Implementar módulo de ingesta Banco Mundial (descarga de los 18 indicadores vía `wbgapi` y cruce con `countries_master.csv`) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/ingesta/world_bank_ingesta.py`
- [x] T012 [P] [US1] Implementar módulo de ingesta DANE para IPC (Variación e Índices) y Comercio Exterior (OMC y tradicionales) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/ingesta/dane_ingesta.py`
- [x] T013 [US1] Extender `/Users/frederick/GitHub/odc-data-pipeline/pipeline/ingesta/dane_ingesta.py` con el boletín mensual GEIH y el flujo de microdatos en 5 pasos (descargar ZIP, descomprimir, eliminar `dat/` y `sav/`, conservar `.csv` y mover a `data/raw/dane/geih/`)
- [x] T014 [P] [US1] Implementar módulo de ingesta Wikipedia para Salario Mínimo y Elecciones Presidenciales con validación por anclas oficiales en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/ingesta/wikipedia_ingesta.py`
- [x] T015 [US1] Crear pruebas unitarias de ingesta y validación de snapshots crudos en `/Users/frederick/GitHub/odc-data-pipeline/tests/test_ingesta.py`

**Checkpoint**: Todos los datasets crudos se descargan de forma independiente y se guardan estandarizados en `data/raw/`.

---

## Phase 4: User Story 2 - Integración y generación de contratos del Observatorio (Priority: P1)

**Goal**: Transformar los datos crudos en tablas maestras analíticas (`data/processed/master/`) y generar la totalidad de los contratos JSON (`data_*.json`) en `data/processed/observatorio/` garantizando nulos reales (REGLA 7), orden descendente (REGLA 5) y compatibilidad total con la web.

**Independent Test**: Ejecutar los scripts de procesamiento y validar con `pytest tests/test_contracts.py` que todos los JSON generados cumplen el contrato de tipos del Observatorio y no contienen ceros espurios ni `NaN`.

- [x] T016 [US2] Implementar consolidación de tablas maestras (`master_world_bank_global.csv`, `master_colombia_anual.csv`, `master_colombia_mensual.csv`) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_master_tables.py`
- [x] T017 [P] [US2] Implementar generador de `data_inflacion.json` (IPC + BanRep TPM + spread) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_inflacion.py`
- [x] T018 [P] [US2] Implementar generador de `data_empleo.json` (GEIH mensual + respaldo anual) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_empleo.py`
- [x] T019 [P] [US2] Implementar generador de `data_pib.json` (PIB, crecimiento, per cápita, deuda pública, Gini) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_pib.py`
- [x] T020 [P] [US2] Implementar generador de `data_comercio.json` (totales OMC, matriz de productos y tradicionales) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_comercio.py`
- [x] T021 [P] [US2] Implementar generador de `data_externo.json` (TRM mensual + reservas, cuenta corriente, IED y deuda externa anuales) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_externo.py`
- [x] T022 [P] [US2] Implementar generador de `data_demografia.json` (población, esperanza de vida mujeres/hombres y Gini con coberturas independientes) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_demografia.py`
- [x] T023 [P] [US2] Implementar generador de comparativos `data_comparativo_col_<key>.json` en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_comparativo.py`
- [x] T024 [P] [US2] Implementar generador de `data_salario_minimo.json` en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_salario_minimo.py`
- [x] T025 [P] [US2] Implementar generador de `data_ingresos.json` y `data_salarios_cargos.json` (a partir de los microdatos GEIH limpios) en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_ingresos.py`
- [x] T026 [P] [US2] Implementar generador de datasets electorales `data_pres_*.json` en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/processing/build_elecciones.py`
- [x] T027 [US2] Implementar orquestador principal del pipeline en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/main.py`
- [x] T028 [US2] Crear suite de pruebas de contrato y no regresión en `/Users/frederick/GitHub/odc-data-pipeline/tests/test_contracts.py`

**Checkpoint**: Todos los archivos `data_*.json` se generan correctamente en `data/processed/observatorio/` y pasan los tests de contrato.

---

## Phase 5: User Story 3 - CI/CD en GitHub Actions, entrega automática y desacoplamiento web (Priority: P2)

**Goal**: Configurar el workflow automatizado por steps en `odc-data-pipeline`, habilitar la sincronización automática hacia `fredericksalazar.github.io/public/data/` y limpiar completamente los pipelines del repositorio web.

**Independent Test**: Ejecutar el workflow en GitHub Actions de `odc-data-pipeline`, comprobar la sincronización de los JSON en `public/data/` de `fredericksalazar.github.io`, y verificar que `npx astro check` y `npm run build` en el repo web pasen al 100 % sin las carpetas `ingestion/` ni `pipeline/`.

- [x] T029 [US3] Crear workflow de GitHub Actions con steps modulares (ingesta, procesamiento, tests y sync a la web con `WEB_REPO_TOKEN`) en `/Users/frederick/GitHub/odc-data-pipeline/.github/workflows/data_pipeline.yml`
- [x] T030 [US3] Crear script de sincronización local/verificación entre repositorios en `/Users/frederick/GitHub/odc-data-pipeline/pipeline/utils/sync_to_web.py`
- [x] T031 [US3] Sincronizar todos los JSON generados hacia `/Users/frederick/GitHub/fredericksalazar.github.io/public/data/` y validar paridad
- [x] T032 [US3] Eliminar carpetas obsoletas (`ingestion/`, `pipeline/`, `data/raw/`, `data/processed/`, `.github/workflows/ingest-monthly.yml` y `scripts/build-comparativo.mjs`) en `/Users/frederick/GitHub/fredericksalazar.github.io/`
- [x] T033 [US3] Actualizar documentación de arquitectura en `/Users/frederick/GitHub/fredericksalazar.github.io/agents/ARCHITECTURE.md`, `/Users/frederick/GitHub/fredericksalazar.github.io/agents/AGENTS.md` y `/Users/frederick/GitHub/fredericksalazar.github.io/src/lib/observatorio/ARCHITECTURE.md`
- [x] T034 [US3] Ejecutar `npx astro check` y `npm run build` en `/Users/frederick/GitHub/fredericksalazar.github.io/` confirmando 0 errores de compilación y enlaces íntegros

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final, documentación y cierre del feature.

- [x] T035 [P] Redactar documentación técnica completa del nuevo pipeline en `/Users/frederick/GitHub/odc-data-pipeline/README.md`
- [x] T036 Validar end-to-end con los escenarios de `specs/003-rediseno-pipeline-odc/quickstart.md`
- [x] T037 Re-verificar checklist de calidad en `specs/003-rediseno-pipeline-odc/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Sin dependencias — inicializa `odc-data-pipeline`.
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEA todas las historias de usuario.
- **User Story 1 (Phase 3)**: Depende de Phase 2 — Genera los datos crudos en `data/raw/`.
- **User Story 2 (Phase 4)**: Depende de Phase 3 — Procesa y genera los contratos JSON en `data/processed/observatorio/`.
- **User Story 3 (Phase 5)**: Depende de Phase 4 — Automatiza GitHub Actions y desacopla el repo web.
- **Polish (Phase 6)**: Depende de Phase 5 — Cierre y verificación final.

### Parallel Opportunities [P]
- **En Phase 1**: T002, T003 y T004 se pueden ejecutar en paralelo.
- **En Phase 2**: T006, T007 y T008 se pueden implementar en paralelo una vez creado `config/data-sources.yaml`.
- **En Phase 3 (US1)**: T010 (BanRep), T011 (Banco Mundial), T012 (DANE) y T014 (Wikipedia) son completamente independientes y se pueden implementar en paralelo.
- **En Phase 4 (US2)**: Tras T016 (tablas maestras), todos los generadores `build_*.py` (T017 a T026) son paralelizables.
- **En Phase 6**: T035 se puede redactar en paralelo a las pruebas finales.

---

## Implementation Strategy

### MVP (Phases 1, 2 y 3)
1. Completar Setup e infraestructura base en `odc-data-pipeline`.
2. Crear `config/data-sources.yaml` y utilidades compartidas.
3. Implementar ingesta modular y validar que todas las fuentes descargan a `data/raw/`.

### Entrega Completa (Phases 4, 5 y 6)
4. Implementar procesamiento de tablas maestras y generadores de los 12 contratos JSON.
5. Ejecutar suite de pruebas de contrato `pytest tests/test_contracts.py`.
6. Configurar GitHub Actions y sincronizar a `fredericksalazar.github.io/public/data/`.
7. Retirar pipelines y datos crudos del repo web y verificar con `npx astro check` y `npm run build`.
