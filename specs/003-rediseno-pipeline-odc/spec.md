# Feature Specification: Rediseño y desacoplamiento del pipeline de datos del Observatorio (odc-data-pipeline)

**Feature Branch**: `feature/odc-data-pipeline`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "Rediseño completo del flujo de datos del Observatorio de Datos de Colombia. Extraer toda la lógica de ingesta y procesamiento del repositorio web personal y migrarla —junto con los dos notebooks del Banco Mundial— hacia un repositorio independiente y privado (`/Users/frederick/GitHub/odc-data-pipeline`), gobernado por un catálogo declarativo (`config/data-sources.yaml`), con ingesta modular por fuente y dataset ejecutable por pasos en automatización, almacenamiento estructurado (`data/raw/[source]/[dataset]/`, `data/processed/`, `data/metadata/`) e integración de series anuales y mensuales conservando el contrato JSON del Observatorio y preparando los activos para futuros productos de datos, APIs y modelos de ML/IA."

## Contexto de producto *(Constitution Check G1)*

| Campo | Valor |
|---|---|
| Objetivo | **O1 · Autoridad** (demostrar ingeniería de datos de nivel producción con pipelines limpios, trazables y resilientes) y **O2 · Monetización** (proteger los activos de datos procesados y prepararlos como productos de datos para APIs, consultoría y modelos de ML/IA) |
| Pilares | **P3 · Observatorio de Datos de Colombia** (dashboards económicos, elecciones y calculadoras); **P4 · Blog** (series recurrentes e informes que consumen datos y comparativos del Observatorio); **P2 · Proyectos** |
| KPI | **K6 · Frescura del Observatorio** (≤ 45 días en series mensuales sin intervención manual ni notebooks externas) y **K5 · Autoridad** |
| Principios de producto | **PRD-02** (credibilidad antes que volumen), **PRD-05** (rigor de datos: fuente oficial, fecha de corte y metodología visibles), **PRD-08** (simplicidad y mantenibilidad) |
| Reglas que toca | **ARQ-01** (sitio estático), **ARQ-02** (una sola fuente de verdad por dato en `public/data/*.json`), **ARQ-11** (pipelines reproducibles), **ARQ-18** (sin regresión de datos publicados), **ARQ-19** (reutilización ante todo); **REGLA 1, 5, 6 y 7** del Observatorio; Principios **I, II, III, V y VI** de la constitución |
| Módulos afectados | **Repositorio privado `odc-data-pipeline`** (creación completa de arquitectura de datos); **Repositorio web `fredericksalazar.github.io`** (desacoplamiento total de `ingestion/`, `pipeline/`, `scripts/build-comparativo.mjs`, `data/raw/`, `data/processed/`, `.github/workflows/ingest-monthly.yml` y actualización de `agents/ARCHITECTURE.md`, `agents/AGENTS.md` y `src/lib/observatorio/ARCHITECTURE.md`) |

---

## Clarifications

### Session 2026-10-17

- Q1: ¿Cómo se debe ingestar el indicador de Esperanza de Vida (`life_expectancy_women` y `life_expectancy_men`) que antes venía de un CSV manual? → **A (Opción A):** Descargar directamente desde la API oficial del Banco Mundial usando los indicadores `SP.DYN.LE00.FE.IN` (mujeres) y `SP.DYN.LE00.MA.IN` (hombres), mapeados en `config/data-sources.yaml` y ejecutados por `worldBank-ingesta.py`, eliminando el archivo manual `life_expectancy_dataset.csv`.
- Q2: ¿Cómo se entregan los archivos `data_*.json` generados en el repositorio privado `odc-data-pipeline` hacia `public/data/` del repositorio público `fredericksalazar.github.io`? → **A (Opción A):** Mediante un step automático en GitHub Actions dentro de `odc-data-pipeline` que, tras superar las validaciones de esquema y no regresión, publica únicamente los archivos JSON finales (`data_*.json`) en `public/data/` del repositorio web.
- Q3: ¿Cuál es el alcance respecto a los pipelines de `pipeline/elecciones`, `pipeline/salario_minimo` y `pipeline/ingresos` que hoy viven en el repositorio web? → **A (Opción B):** Se migran **todos** (`elecciones`, `salario_minimo` e `ingresos`, además de DANE, BanRep, Banco Mundial y comparativos) a `odc-data-pipeline` dentro de esta misma especificación, retirando por completo toda lógica de datos (`ingestion/` y `pipeline/`) del repositorio web.
- Q4: ¿Cómo debe procesarse la descarga y extracción de los archivos ZIP de microdatos de la GEIH en `odc-data-pipeline`? → **A:** Flujo automatizado en el step de GEIH: (1) descargar el archivo ZIP, (2) descomprimirlo, (3) eliminar las carpetas redundantes `dat/` y `sav/`, (4) conservar exclusivamente los archivos de la carpeta `csv/`, y (5) mover los datos CSV a `data/raw/dane/geih/` descartando el ZIP original y las carpetas intermedias para optimizar el almacenamiento.
- Q5: ¿Qué método de autenticación en GitHub Actions se debe configurar en `odc-data-pipeline` para permitir el push automático de los archivos `data_*.json` hacia `fredericksalazar.github.io`? → **A (Opción A):** Fine-Grained Personal Access Token (PAT) o Deploy Key con permisos de escritura restringidos exclusivamente al repositorio `fredericksalazar.github.io`, configurado como secret `WEB_REPO_TOKEN` en `odc-data-pipeline`.

---

## Diagnóstico de la situación actual y alcance de la migración

1. **Acoplamiento en el repositorio web:**
   - Actualmente el código de ingesta (`ingestion/sources/`), procesamiento (`ingestion/processing/`), pipelines complementarios (`pipeline/elecciones/`, `pipeline/ingresos/`, `pipeline/salario_minimo/`), datos crudos (`data/raw/`) y consolidados (`data/processed/`) viven dentro del repositorio público del sitio web (`fredericksalazar.github.io`). Esto expone los datos procesados maestros, mezcla responsabilidades (frontend estático vs. ingeniería de datos) y dificulta escalar hacia nuevos productos de datos.
2. **Proceso fragmentado para el Banco Mundial:**
   - Los indicadores del Banco Mundial se descargan y unifican fuera del repositorio mediante dos notebooks manuales (`macro_economics_ingestion.ipynb` y `macro_economics_processed.ipynb`), cuyo resultado (`macro_economics_indicators_2026.csv`) se copia manualmente a `data/raw/world_bank/`.
   - El notebook de ingesta reemplaza valores faltantes por `0.0` (`.fillna(0.0)`), lo que produce variaciones ficticias de `-100.0` y obliga a los lectores posteriores a usar parches (`PLACEHOLDERS = (0.0, -100.0)`).
3. **Código duplicado y mezcla de responsabilidades en los exportadores:**
   - Los scripts `export_*.py` repiten funciones idénticas de serialización, cálculo de diferencias y construcción de bloques de indicadores, y algunos invocan descargas en vivo dentro de la fase de exportación (por ejemplo, `export_empleo.py` descarga DANE GEIH directamente).
   - Existen dos productores de comparativos (`scripts/build-comparativo.mjs` e `ingestion/processing/export_comparativo.py`); se consolidará un único productor en Python dentro de `odc-data-pipeline`.
4. **Falta de un catálogo único de fuentes:**
   - Las URLs, hojas de Excel, códigos de flujo SDMX, IDs de microdatos GEIH, páginas de Wikipedia y códigos de indicadores del Banco Mundial están dispersos como constantes dentro de múltiples archivos Python.

### Inventario completo de fuentes y datasets incluidos

| Fuente (`source_name`) | Dataset (`dataset_name`) | Origen / Naturaleza | Frecuencia | Destino en el Observatorio (`public/data/`) |
|---|---|---|---|---|
| **dane** | `ipc_variacion` | Anexo Excel mensual (`VarNal`) | Mensual (desde 2003) | `data_inflacion.json` |
| **dane** | `ipc_indices` | Anexo Excel mensual (`IndicesIPC`) | Mensual (desde 2003) | `data_inflacion.json` |
| **dane** | `geih_mercado_laboral` | Anexo Excel mensual GEIH + serie histórica CNPV 2018 | Mensual (desde 2001) | `data_empleo.json` |
| **dane** | `geih_formalidad` | Anexo Excel mensual de informalidad GEIH | Mensual (desde 2007) | `data_empleo.json` |
| **dane** | `geih_microdatos_ocupados` | Microdatos GEIH catálogo 853 (`INGLABO`, `FEX_C18`, `OFICIO_C8`) + umbrales clases sociales DANE | Anual (módulos mensuales apilados) | `data_ingresos.json`, `data_salarios_cargos.json` |
| **dane** | `exportaciones_omc` | Anexo Excel mensual OMC CUCI Rev. 3 | Mensual | `data_comercio.json` |
| **dane** | `exportaciones_tradicionales` | Anexo Excel mensual Café, Carbón, Petróleo y No tradicionales | Mensual (desde 1995) | `data_comercio.json` |
| **dane** | `importaciones_omc` | Anexo Excel mensual OMC CUCI Rev. 3 | Mensual | `data_comercio.json` |
| **banrep** | `tasas_interes` | Servicio SDMX (`DF_CBR_MONTHLY_HIST`) | Mensual (desde 2000) | `data_inflacion.json` |
| **banrep** | `trm` | Servicio SDMX (`DF_TRM_DAILY_HIST`, agregada a promedio mensual) | Diaria → Mensual (desde 2000) | `data_externo.json` |
| **world_bank** | 18 indicadores macroeconómicos globales (`gdp`, `gdp_variation`, `gdp_percapita`, `gdp_percapita_variation`, `inflation`, `exports`, `imports`, `inversion_extranjera`, `reservas_internacionales`, `deuda_externa`, `desempleo`, `poblacion`, `cuenta_corriente`, `deuda_publica`, `ingresos_tributarios`, `gini`, `life_expectancy_women`, `life_expectancy_men`) | API oficial del Banco Mundial (todos los países en `countries_master.csv`) | Anual (desde 1960) | `data_pib.json`, `data_empleo.json`, `data_comercio.json`, `data_externo.json`, `data_demografia.json`, `data_comparativo_col_<key>.json` y activo maestro multi-país |
| **wikipedia** | `salario_minimo` | Anexo histórico de decretos de SMMLV y auxilio de transporte en Colombia (validado con anclas oficiales) | Anual (desde 1984) | `data_salario_minimo.json` |
| **wikipedia** | `elecciones_presidenciales` | Resultados departamentales y municipales de elecciones presidenciales (2022 1V/2V, 2026 1V/2V) | Por evento electoral | `data_pres_2022_1v.json`, `data_pres_2022_2v.json`, `data_pres_2026_1v.json`, `data_pres_2026_2v.json`, `data_pres_2026_2v_municipios.json`, `data_pres_candidatos.json`, `data_pres_comparativo.json`, `data_pres_geografia.json` |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo centralizado e ingesta modular por fuente y dataset (Priority: P1)

Como ingeniero y propietario de la plataforma de datos, necesito que todas las fuentes de datos (`dane`, `banrep`, `world_bank`, `wikipedia`) y sus respectivos datasets estén declarados en un único archivo de configuración (`config/data-sources.yaml`), y que cada fuente tenga su propio módulo de ingesta con funciones independientes por dataset, de modo que pueda ejecutar, monitorear o reintentar cualquier descarga de forma aislada y almacenar los datos crudos estandarizados en `data/raw/[source_name]/[dataset_name]/`.

**Why this priority**: Es la base de toda la arquitectura. Sin el catálogo declarativo ni la separación limpia entre fuentes y datasets en `data/raw/`, no es posible automatizar por pasos (steps) ni eliminar la dependencia de las notebooks manuales del Banco Mundial.

**Independent Test**: Ejecutar de forma individual la función de ingesta de cada fuente (`dane`, `banrep`, `world_bank`, `wikipedia`) para un dataset específico leyendo únicamente `config/data-sources.yaml`, y verificar que se crea el archivo correspondiente en `data/raw/[source_name]/[dataset_name]/` con esquema estandarizado y sin alterar los demás datasets.

**Acceptance Scenarios**:

1. **Given** el archivo `config/data-sources.yaml` con el mapa de fuentes (`dane`, `banrep`, `world_bank`, `wikipedia`) y sus datasets (`url`, `type`, `frequency`, `description` y metadatos propios), **When** se consulta la configuración de cualquier dataset, **Then** el sistema obtiene su ruta, parámetros y descripción sin tener URLs ni códigos quemados en la lógica de descarga.
2. **Given** la fuente `world_bank` configurada con los 18 indicadores (los 16 originales más `life_expectancy_women` `SP.DYN.LE00.FE.IN` y `life_expectancy_men` `SP.DYN.LE00.MA.IN`), **When** se ejecuta la ingesta del Banco Mundial en el pipeline, **Then** se descargan automáticamente los datos de todos los países del catálogo `data/metadata/countries_master.csv` y se guardan en `data/raw/world_bank/[dataset_name]/` sin requerir notebooks ni archivos manuales externos.
3. **Given** las fuentes `dane`, `banrep` y `wikipedia`, **When** se invoca la función de un dataset específico (por ejemplo `ipc_variacion`, `ipc_indices`, `geih_mercado_laboral`, `geih_formalidad`, `geih_microdatos_ocupados`, `exportaciones_omc`, `importaciones_omc`, `trm`, `tasas_interes`, `salario_minimo` o `elecciones_presidenciales`), **Then** solo se consulta ese dataset y se almacena su resultado crudo en `data/raw/[source_name]/[dataset_name]/`.
4. **Given** un fallo temporal en una fuente externa (por ejemplo caída de un anexo del DANE o timeout en una API), **When** corre la función de ingesta de ese dataset, **Then** el sistema registra el error claramente sin sobrescribir ni corromper el último archivo válido existente en `data/raw/[source_name]/[dataset_name]/`.

---

### User Story 2 - Integración de series anuales y mensuales y generación de contratos para el Observatorio (Priority: P1)

Como propietario del Observatorio y creador de futuros productos de datos, necesito que el módulo de procesamiento (`pipeline/processing/`) lea únicamente los archivos de `data/raw/` y `data/metadata/`, integre adecuadamente las series de distinta naturaleza temporal (históricos anuales desde 1960 y series mensuales desde 2000/2003) y produzca en `data/processed/` tanto los datasets maestros unificados como la totalidad de los archivos JSON de contrato que consume el sitio web, manteniendo intacta su estructura actual para que los gráficos y calculadoras carguen con máxima velocidad y sin cambios rotos.

**Why this priority**: Garantiza que el rediseño no rompa el Observatorio, las calculadoras ni los dashboards electorales en producción (cumpliendo el contrato JSON actual) y al mismo tiempo materializa los datasets integrados limpios en el repositorio privado para futuros modelos de ML, IA y APIs.

**Independent Test**: Ejecutar los módulos de `pipeline/processing/` a partir de `data/raw/` (sin conexión a internet) y validar mediante pruebas automatizadas que se generan los datasets integrados y todos los archivos `data_*.json` cumpliendo al 100 % el contrato de tipos, orden descendente, formato `"YYYY-MM"` y manejo explícito de nulos del Observatorio.

**Acceptance Scenarios**:

1. **Given** los archivos crudos de los 18 indicadores en `data/raw/world_bank/`, **When** se ejecuta el procesamiento de integración macroeconómica, **Then** se genera en `data/processed/` el dataset consolidado multi-país (equivalente al antiguo `macro_economics_indicators_2026.csv`, generado íntegramente dentro del pipeline) y las tablas maestras de Colombia (anual y mensual).
2. **Given** los datos integrados en `data/processed/` y `data/raw/`, **When** se ejecutan las funciones de generación del Observatorio (`inflacion`, `empleo`, `pib`, `comercio`, `externo`, `demografia`, `comparativo`, `salario_minimo`, `ingresos` y `elecciones`), **Then** cada archivo JSON producido mantiene exactamente la estructura actual (`metadata`, `indicadores`, `serie` descendente `"YYYY-MM"`, `historico` anual y estructuras específicas de cada dominio).
3. **Given** indicadores donde se combinan series mensuales (DANE/BanRep) con series anuales (Banco Mundial), **When** se procesan las diferencias (`delta`), variaciones (`sube`, `baja`, `estable`) y valores actuales (`indicadores.<id>.actual`), **Then** los cálculos respetan la frecuencia propia de cada indicador (mensual mes-a-mes o interanual según el dominio; anual año-a-año contra el último año no nulo) y representan los datos faltantes con `null` explícito (nunca con `0.0` ni `-100.0` espurios).
4. **Given** un dataset previamente publicado con granularidad mensual hasta un periodo $T$, **When** una fuente falla y el procesamiento produciría un resultado con menor granularidad o un periodo anterior a $T$, **Then** la guarda de no regresión conserva el archivo vigente y emite una alerta sin degradar los datos publicados (ARQ-18).

---

### User Story 3 - Orquestación por pasos (steps) en GitHub Actions, entrega automática y desacoplamiento total del repositorio web (Priority: P2)

Como ingeniero de datos, necesito que el repositorio privado `odc-data-pipeline` ejecute todo el flujo mediante GitHub Actions donde cada fuente de ingesta y cada proceso de transformación sea un `step` visible e independiente, publique automáticamente los archivos `data_*.json` resultantes hacia `public/data/` del repositorio web `fredericksalazar.github.io`, y deje el repositorio público de la web completamente limpio de scripts de ingesta/procesamiento y datos crudos.

**Why this priority**: Cumple el objetivo de arquitectura, mantenibilidad y protección de los datos procesados, dando observabilidad paso a paso en CI/CD y dejando el repositorio web dedicado exclusivamente a la capa de presentación estática.

**Independent Test**: Disparar el flujo de trabajo en `odc-data-pipeline`, verificar que cada step de ingesta, procesamiento, validación y entrega se visualiza por separado en la ejecución, y comprobar en `fredericksalazar.github.io` que `npx astro check` y `npm run build` pasan exitosamente sin las carpetas `ingestion/` ni `pipeline/`.

**Acceptance Scenarios**:

1. **Given** el flujo automatizado en `.github/workflows/` dentro de `odc-data-pipeline`, **When** se ejecuta de forma programada o manual, **Then** cada fuente/dataset de ingesta y cada etapa de procesamiento y validación se ejecuta como un `step` individual claramente identificable en el registro de ejecución.
2. **Given** una corrida exitosa con cambios en los archivos `data_*.json`, **When** finaliza la etapa de pruebas de contrato y no regresión en GitHub Actions de `odc-data-pipeline`, **Then** un step de entrega sincroniza automáticamente únicamente los archivos `data_*.json` hacia `public/data/` de `fredericksalazar.github.io`.
3. **Given** los módulos en `pipeline/ingesta/`, `pipeline/processing/` y `pipeline/utils/`, **When** un desarrollador humano revisa el código, **Then** encuentra funciones directas, legibles, con nombres descriptivos y sin abstracciones innecesarias ni lógica duplicada.
4. **Given** el repositorio web `fredericksalazar.github.io` tras la migración, **When** se inspecciona su árbol de archivos y se ejecuta el build del sitio, **Then** ya no existen `ingestion/`, `pipeline/`, `scripts/build-comparativo.mjs`, `data/raw/`, `data/processed/` ni `.github/workflows/ingest-monthly.yml` en el repo web, y todas las páginas, gráficos y calculadoras del sitio siguen funcionando a partir de `public/data/*.json`.

---

### Edge Cases

- **Mes en curso aún no publicado por el DANE (HTTP 404 en anexo mensual):** Los boletines del DANE (IPC, GEIH, Comercio) se publican con rezago de varias semanas. Si el archivo del mes actual aún no existe, la función de ingesta debe retroceder ordenadamente a los meses previos disponibles (hasta el último publicado) sin romper el pipeline.
- **Valores faltantes en indicadores del Banco Mundial (p. ej. Gini o años recientes sin reporte):** A diferencia del antiguo notebook que rellenaba vacíos con `0.0` (generando caídas falsas de `-100 %`), el pipeline debe distinguir entre un valor real igual a `0.0` y un dato no reportado (`NaN` / `null`), garantizando que ningún JSON publicado contenga ceros espurios (REGLA 7).
- **Caída parcial de una fuente durante la corrida automatizada:** Si BanRep y Banco Mundial responden correctamente pero el servidor del DANE está en mantenimiento, los steps de BanRep y Banco Mundial deben completarse y actualizar sus respectivos activos, mientras que los datasets dependientes del DANE conservan su último snapshot válido y su último JSON publicado sin degradarse (ARQ-18).
- **Cruce de granularidades (series mensuales desde 2000/2003 con series anuales desde 1960):** Al construir datasets como `data_externo.json` o `data_empleo.json`, los años históricos previos a la serie mensual o las columnas anuales ancladas a `"YYYY-12"` no deben contaminar el cálculo de `delta` de las columnas mensuales ni dejar en `null` el bloque `actual` de un indicador anual cuando el último mes de la tabla solo tiene datos mensuales.
- **Descartes de agregados regionales del Banco Mundial:** La API del Banco Mundial devuelve más de 260 códigos de economía (incluyendo agregados como "Mundo", "América Latina", "Ingreso alto"). El cruce con `data/metadata/countries_master.csv` debe filtrar estrictamente los países válidos y aplicar las normalizaciones de nombres de país establecidas.
- **Protección contra vandalismo o cambios de tabla en fuentes de Wikipedia (`salario_minimo`, `elecciones`):** El procesamiento debe conservar las validaciones por valores ancla (`ANCLAS_SMLV`, `ANCLAS_AUXILIO`, totales nacionales de Registraduría y códigos DIVIPOLA) y abortar la sobreescritura del JSON específico si las anclas fallan.
- **Datasets de baja frecuencia o ejecución bajo demanda (`elecciones`, `geih_microdatos_ocupados`):** El workflow en GitHub Actions debe permitir ejecutar el flujo periódico mensual (BanRep, DANE boletines, Banco Mundial, Salario Mínimo) sin obligar a re-descargar en cada corrida mensual archivos pesados de eventos cerrados (como los ~780 MB de microdatos GEIH o elecciones pasadas), habilitándolos mediante parámetros de `workflow_dispatch` o steps condicionales.

---

## Requirements *(mandatory)*

### Functional Requirements

**Arquitectura del repositorio `odc-data-pipeline` y configuración**

- **FR-001**: El pipeline completo DEBE residir en el repositorio independiente `/Users/frederick/GitHub/odc-data-pipeline` con la siguiente estructura base de directorios:
  - `config/data-sources.yaml`
  - `data/raw/[source_name]/[dataset_name]/`
  - `data/processed/`
  - `data/metadata/`
  - `pipeline/ingesta/`
  - `pipeline/processing/`
  - `pipeline/utils/`
  - `.github/workflows/`
- **FR-002**: El archivo `config/data-sources.yaml` DEBE ser la única fuente de configuración declarativa de todas las fuentes de datos (`dane`, `banrep`, `world_bank`, `wikipedia`) y sus datasets, especificando como mínimo para cada dataset: `url` (o plantilla de URL/código de indicador), `type`, `frequency` y `description`, además de los parámetros específicos del dataset (como hoja de cálculo, código de serie o año inicial).
- **FR-003**: El directorio `data/metadata/` DEBE almacenar los catálogos maestros de referencia (incluyendo `countries_master.csv` para el cruce geográfico y de grupo de ingreso del Banco Mundial, catálogos DIVIPOLA/partidos para elecciones, umbrales de clases sociales y metadatos de los bloques narrativos/futbolísticos de comparativos) y el manifiesto de control de ejecución del pipeline.

**Capa de ingesta (`pipeline/ingesta/` y `data/raw/`)**

- **FR-004**: Cada fuente de datos DEBE contar con su propio script de ingesta independiente dentro de `pipeline/ingesta/`:
  - `dane-ingesta.py` para todos los datasets del DANE (`ipc_variacion`, `ipc_indices`, `geih_mercado_laboral`, `geih_formalidad`, `geih_microdatos_ocupados`, `exportaciones_omc`, `exportaciones_tradicionales`, `importaciones_omc`).
  - `banrep-ingesta.py` para todos los datasets del Banco de la República (`tasas_interes`, `trm`).
  - `worldBank-ingesta.py` para todos los datasets del Banco Mundial (reemplazando por completo a `macro_economics_ingestion.ipynb`).
  - `wikipedia-ingesta.py` para los datasets extraídos de Wikipedia (`salario_minimo`, `elecciones_presidenciales`).
- **FR-005**: Dentro de cada script de ingesta, cada dataset configurado en `config/data-sources.yaml` DEBE estar implementado como una función independiente e invocable individualmente desde la línea de comandos (pasando el nombre del dataset como argumento), de modo que el flujo de CI/CD pueda ejecutar cada dataset o fuente como un `step` separado.
- **FR-006**: Toda función de ingesta DEBE almacenar su salida cruda estandarizada en formato CSV dentro de la ruta `data/raw/[source_name]/[dataset_name]/[file_name].csv`. Para los microdatos anuales de la GEIH (`geih_microdatos_ocupados`), la función DEBE seguir el flujo de extracción optimizado: (1) descargar el archivo ZIP temporalmente, (2) descomprimirlo, (3) eliminar las carpetas redundantes `dat/` y `sav/`, (4) conservar exclusivamente los archivos de la carpeta `csv/`, y (5) mover los archivos CSV resultantes a `data/raw/dane/geih/` eliminando el archivo ZIP original para mantener el repositorio limpio y sin duplicación de formatos.
- **FR-007**: La ingesta del Banco Mundial (`worldBank-ingesta.py`) DEBE descargar los 18 indicadores directamente desde la API oficial del Banco Mundial, incluyendo `SP.DYN.LE00.FE.IN` (`life_expectancy_women`) y `SP.DYN.LE00.MA.IN` (`life_expectancy_men`), eliminando por completo la dependencia del archivo manual `life_expectancy_dataset.csv`.

**Capa de procesamiento e integración (`pipeline/processing/` y `data/processed/`)**

- **FR-008**: Los scripts de `pipeline/processing/` DEBEN leer exclusivamente desde `data/raw/` y `data/metadata/`; ningún script de procesamiento puede realizar llamadas de red ni descargas directas desde las fuentes externas.
- **FR-009**: El módulo de procesamiento DEBE replicar y mejorar la integración del antiguo `macro_economics_processed.ipynb`, unificando los 18 indicadores del Banco Mundial con el catálogo de países (`countries_master.csv`), aplicando las correcciones de nombres de países y calculando `total_gdp_million`, `gdp_percapita_variation` y `external_debt_pct_gdp` en un dataset consolidado dentro de `data/processed/`.
- **FR-010**: El módulo de procesamiento DEBE integrar las series históricas anuales y las series mensuales de Colombia en una estructura optimizada dentro de `data/processed/`, preservando los valores faltantes como nulos reales (`null` / `NaN`) sin introducir `0.0` ni `-100.0` artificiales en períodos sin dato (REGLA 7).
- **FR-011**: El módulo de procesamiento DEBE generar todos los archivos JSON que consume el sitio web (`data_inflacion.json`, `data_empleo.json`, `data_pib.json`, `data_comercio.json`, `data_externo.json`, `data_demografia.json`, `data_comparativo_col_<key>.json`, `data_salario_minimo.json`, `data_ingresos.json`, `data_salarios_cargos.json` y `data_pres_*.json`) respetando estrictamente el contrato actual definido en `src/lib/observatorio/types.ts` (`metadata`, `indicadores`, `serie` en orden descendente con `periodo: "YYYY-MM"`, `historico` anual y estructuras específicas de cada dominio).
- **FR-012**: La lógica común de construcción del contrato JSON (formateo escalar sin `NaN`, cálculo de deltas según frecuencia mensual o anual, clasificación de variación `sube`/`baja`/`estable`, armado del bloque `indicadores` y validación de no regresión ARQ-18) DEBE centralizarse en `pipeline/utils/` mediante funciones simples, legibles por humanos y sin duplicación entre scripts (ARQ-19).

**Orquestación, entrega al Observatorio y limpieza del repositorio web**

- **FR-013**: El repositorio `odc-data-pipeline` DEBE incluir el workflow en `.github/workflows/` que ejecute de forma secuencial y visible: (1) los steps de ingesta por fuente/dataset, (2) los steps de procesamiento e integración, (3) las pruebas automatizadas de calidad y no regresión de los datos, y (4) la persistencia de los datos actualizados.
- **FR-014**: Tras superar las pruebas de contrato y no regresión, un step automático en GitHub Actions dentro de `odc-data-pipeline` DEBE publicar únicamente los archivos JSON finales (`data_*.json`) hacia el directorio `public/data/` del repositorio web `fredericksalazar.github.io` cuando existan cambios reales, autenticándose mediante un Fine-Grained PAT o Deploy Key configurado como secret `WEB_REPO_TOKEN` con permisos de escritura restringidos exclusivamente a `fredericksalazar.github.io`.
- **FR-015**: Una vez validada la paridad de los JSON generados por `odc-data-pipeline`, se DEBEN retirar del repositorio web `fredericksalazar.github.io` las carpetas `ingestion/`, `pipeline/`, `data/raw/`, `data/processed/`, el script duplicado `scripts/build-comparativo.mjs` y el workflow `.github/workflows/ingest-monthly.yml`, dejando el repositorio web 100 % libre de pipelines de datos.
- **FR-016**: Los documentos de arquitectura del repositorio web (`agents/ARCHITECTURE.md`, `agents/AGENTS.md` y `src/lib/observatorio/ARCHITECTURE.md`) DEBEN actualizarse para reflejar que el productor oficial de todos los datasets es el repositorio `odc-data-pipeline`, resolviendo además las deudas técnicas #1, #3 y #4 de `agents/ARCHITECTURE.md`.

### Key Entities

- **Catálogo de Fuentes (`data-sources.yaml`)**: Mapa declarativo que agrupa proveedores de datos (`dane`, `banrep`, `world_bank`, `wikipedia`) y define para cada dataset su origen (`url`), formato (`type`), periodicidad (`frequency`), descripción (`description`) y parámetros de extracción.
- **Snapshot Crudo (`data/raw/[source]/[dataset]/[file].csv`)**: Tabla en formato CSV producida por una función de ingesta para un único dataset de una fuente, con esquema limpio y sin cruces con otras fuentes.
- **Dataset Maestro Integrado (`data/processed/*.csv`)**: Tabla analítica consolidada (a nivel global multi-país o nacional de Colombia, anual o mensual) lista para consumo interno, entrenamiento de modelos de ML/IA o exposición vía APIs futuras.
- **Contrato JSON del Observatorio (`data_*.json`)**: Archivo JSON optimizado para lectura rápida por los gráficos del sitio web y renderizado SEO en build-time, compuesto por `metadata` (fuentes, definiciones, cobertura, fecha de corte), `indicadores` (último valor, delta y variación), `serie` (descendente `"YYYY-MM"`) e `historico` anual.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las fuentes y datasets del Observatorio, Calculadoras, Comparativos y Elecciones (`dane`, `banrep`, `world_bank` con sus 18 indicadores, y `wikipedia`) están declarados en `config/data-sources.yaml` y cuentan con su función de ingesta independiente en `odc-data-pipeline` (0 notebooks o archivos CSV externos manuales requeridos para actualizar el Observatorio).
- **SC-002**: El 100 % de los archivos JSON generados por el nuevo pipeline (`data_inflacion.json`, `data_empleo.json`, `data_pib.json`, `data_comercio.json`, `data_externo.json`, `data_demografia.json`, `data_comparativo_col_<key>.json`, `data_salario_minimo.json`, `data_ingresos.json`, `data_salarios_cargos.json` y `data_pres_*.json`) pasan la validación de esquema del Observatorio sin romper ningún gráfico, calculadora ni KPI en `npx astro check` y `npm run build`.
- **SC-003**: 0 valores faltantes se codifican como `0.0` o `-100.0` espurios en las series generadas; el 100 % de las ausencias de dato se representan como `null` en los JSON finales.
- **SC-004**: Ante la indisponibilidad simulada de cualquiera de las fuentes externas, el 100 % de los JSON previamente publicados conservan su cobertura y granularidad vigente sin degradarse (cumplimiento total de ARQ-18).
- **SC-005**: El repositorio público `fredericksalazar.github.io` reduce en un 100 % las carpetas de pipelines de datos (`ingestion/`, `pipeline/`) y snapshots crudos/intermedios (`data/raw/`, `data/processed/`), conservando únicamente los JSON públicos de contrato en `public/data/`.

---

## Assumptions

- El repositorio `/Users/frederick/GitHub/odc-data-pipeline` ya existe localmente y será el único lugar donde viva el código Python del pipeline y el almacenamiento de `data/raw/`, `data/processed/` y `data/metadata/`.
- El catálogo `countries_master.csv` existente hoy en `/Users/frederick/GitHub/data-projects/macro_economics_indicators/data/in/countries_master.csv` se copiará a `/Users/frederick/GitHub/odc-data-pipeline/data/metadata/countries_master.csv` como referencia geográfica oficial para cruzar los datos del Banco Mundial.
- Para la entrega automática en GitHub Actions desde `odc-data-pipeline` hacia `fredericksalazar.github.io`, el workflow usará un Fine-Grained Personal Access Token (PAT) o Deploy Key configurado como secret `WEB_REPO_TOKEN` con permisos de escritura restringidos exclusivamente a `fredericksalazar.github.io`.
- El formato de los archivos JSON consumidos por el frontend de Astro (`public/data/data_*.json`) se mantiene sin cambios estructurales para garantizar compatibilidad total con los componentes actuales del Observatorio (`data.ts`, `data-client.ts`, `types.ts` y `chart-defs/`).
- El código en `pipeline/ingesta/`, `pipeline/processing/` y `pipeline/utils/` se escribirá con funciones modulares, tipado claro y estilo directo y legible por humanos, evitando metaprogramación o jerarquías de clases complejas.
- Git es administrado exclusivamente por el autor en ambos repositorios (`ARQ-17`).
