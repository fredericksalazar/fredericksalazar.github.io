# Research & Technical Decisions: Rediseño del pipeline de datos (odc-data-pipeline)

**Feature**: `specs/003-rediseno-pipeline-odc` | **Date**: 2026-10-17

## 1. Decisiones técnicas de arquitectura e ingesta

### D1: Formato y validación del catálogo de fuentes (`config/data-sources.yaml`)

- **Decisión**: Utilizar YAML estándar parseado con `PyYAML` y validado mediante modelos tipados simples (`dataclasses` o esquema dict validado) en `pipeline/utils/config_loader.py`.
- **Razón**: Permite declarar proveedores (`dane`, `banrep`, `world_bank`, `wikipedia`) y sus datasets con sintaxis limpia y legible por humanos. Desacopla 100 % las URLs, endpoints SDMX, hojas de Excel y parámetros de los scripts de Python.
- **Alternativas consideradas**:
  - *JSON config*: Menos legible para edición humana y sin soporte nativo de comentarios explicativos.
  - *Hardcoding en Python*: Lo que existe hoy; no escalable y viola la separación entre configuración y código.

---

### D2: Migración de los notebooks del Banco Mundial a script modular (`worldBank-ingesta.py`)

- **Decisión**: Reemplazar por completo los dos notebooks (`macro_economics_ingestion.ipynb` y `macro_economics_processed.ipynb`) por un módulo de ingesta en Python que utilice la librería oficial `wbgapi` para descargar de forma tabular los 18 indicadores requeridos (los 16 macroeconómicos + 2 de esperanza de vida `SP.DYN.LE00.FE.IN` y `SP.DYN.LE00.MA.IN`).
- **Razón**: Elimina la necesidad de ejecutar notebooks manualmente y de mantener el archivo manual `life_expectancy_dataset.csv`. Se cruza directamente con `data/metadata/countries_master.csv` para filtrar agregados regionales y enriquecer la información geográfica.
- **Alternativas consideradas**:
  - *Seguir corriendo los notebooks*: Requiere ejecución manual fuera de CI/CD, propenso a olvidos y desactualizaciones.
  - *Descargar ZIPs masivos de WDI*: Descargas lentas de cientos de megabytes con parseo complejo de metadata. `wbgapi` entrega datos limpios directamente desde la API oficial.

---

### D3: Ingesta DANE con manejo de fallos y flujo optimizado de microdatos GEIH

- **Decisión**:
  1. *Boletines y anexos mensuales (IPC, GEIH empleo, Comercio)*: Descarga mediante `requests` con sesión reintentable (backoff exponencial ante 5xx/429), parseo con `openpyxl` y retroceso ordenado de hasta 4 meses si el archivo del mes corriente aún no está publicado (HTTP 404).
  2. *Microdatos anuales GEIH (`geih_microdatos_ocupados`)*: Flujo optimizado de 5 pasos acordado en `speckit-clarify`:
     - Descarga del ZIP del catálogo 853 a `/tmp`.
     - Descompresión en `/tmp`.
     - Eliminación inmediata de las carpetas redundantes `dat/` y `sav/`.
     - Conservación exclusiva de los archivos `.csv` del módulo Ocupados.
     - Traslado de los `.csv` a `data/raw/dane/geih/` y eliminación del archivo ZIP original.
- **Razón**: Evita saturar el repositorio con formatos redundantes y garantiza resiliencia cuando el DANE publica con demoras.
- **Alternativas consideradas**:
  - *Conservar los ZIPs completos de 780 MB*: Sobrecarga el repositorio y consume almacenamiento innecesario.
  - *Fallar el pipeline ante 404 del DANE*: Rompería las corridas mensuales; el retroceso ordenado garantiza conservar los últimos datos oficiales disponibles.

---

### D4: Ingesta BanRep mediante servicio web SDMX oficial (`banrep-ingesta.py`)

- **Decisión**: Consumir el endpoint REST SDMX-ML 2.1 oficial del Banco de la República (`https://totoro.banrep.gov.co/nsi-jax-ws/rest/data/`) para TPM (`DF_CBR_MONTHLY_HIST`) y TRM (`DF_TRM_DAILY_HIST`), parseando el XML con `xml.etree.ElementTree` nativo y agregando la TRM diaria a promedio mensual.
- **Razón**: Es el servicio web oficial y normativo del banco central de Colombia (ISO 17369:2013). No requiere autenticación y ofrece alta estabilidad.
- **Alternativas consideradas**:
  - *Scraping de páginas HTML de BanRep*: Extremadamente frágil ante cambios de diseño web.

---

### D5: Ingesta Wikipedia con protección por valores ancla (`wikipedia-ingesta.py`)

- **Decisión**: Mantener el patrón validado de extraer mediante la API de MediaWiki (`action=parse`) el histórico de Salario Mínimo (desde 1984) y las tablas de resultados electorales presidenciales (2022 y 2026), validando estrictamente contra valores ancla oficiales (`ANCLAS_SMLV`, `ANCLAS_AUXILIO`, totales nacionales de Registraduría y códigos DIVIPOLA).
- **Razón**: La Registraduría bloquea descargas automatizadas (HTTP 403). Las tablas de Wikipedia son editadas con base en boletines oficiales, y las anclas protegen contra cualquier intento de vandalismo o cambio de formato.
- **Alternativas consideradas**:
  - *Descarga directa de Registraduría*: Bloqueada por WAF de Registraduría.

---

### D6: Desacoplamiento y arquitectura Medallion simplificada

- **Decisión**:
  - `data/raw/[source]/[dataset]/`: Tablas crudas en CSV o Parquet sin cruces.
  - `data/processed/master/`: Tablas maestras unificadas analíticas (anual global, anual Colombia, mensual Colombia) con valores nulos explícitos (`NaN`/`null`, sin ceros espurios).
  - `data/processed/observatorio/`: Contratos JSON (`data_*.json`) idénticos a los actuales para máxima velocidad en la web.
- **Razón**: Prepara los datos para ser consumidos tanto por el sitio web como por futuros modelos de Machine Learning y APIs comerciales de datos.
- **Alternativas consideradas**:
  - *Generar JSONs directamente desde raw*: Mantiene la lógica acoplada e impide reutilizar los datos integrados para otros proyectos.

---

### D7: Mecanismo de entrega continua y sincronización hacia la web pública

- **Decisión**: Configurar un workflow en GitHub Actions de `odc-data-pipeline` que, tras ejecutar los steps de ingesta, procesamiento y pruebas de contrato con `pytest`, use un step de entrega autenticado con Fine-Grained PAT o Deploy Key (`WEB_REPO_TOKEN`) para hacer commit y push únicamente de los archivos `data_*.json` en la carpeta `public/data/` de `fredericksalazar.github.io` (solo si hay diffs reales).
- **Razón**: El repositorio `odc-data-pipeline` permanece 100 % privado (código, fuentes y datos crudos protegidos), mientras que el sitio web público recibe automáticamente los datos actualizados sin requerir servidores intermedios ni backend dinámico (ARQ-01 y ARQ-02).
- **Alternativas consideradas**:
  - *Sincronización manual*: Depende de la intervención humana y bloquea la actualización continua.
  - *Hacer público odc-data-pipeline*: Expone el valor comercial y el código del pipeline.
