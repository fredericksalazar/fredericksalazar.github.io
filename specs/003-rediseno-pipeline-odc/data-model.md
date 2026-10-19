# Data Model: Rediseño del pipeline de datos (odc-data-pipeline)

**Feature**: `specs/003-rediseno-pipeline-odc` | **Date**: 2026-10-17

## 1. Modelo de Configuración (`config/data-sources.yaml`)

```yaml
data_sources:
  <source_id>:
    provider_name: string            # Nombre oficial del proveedor (DANE, BanRep, etc.)
    provider_url: string             # URL principal institucional
    datasets:
      <dataset_id>:
        description: string          # Descripción del indicador/dataset
        frequency: string            # "mensual" | "anual" | "diaria_a_mensual" | "electoral"
        type: string                 # "xlsx" | "sdmx_xml" | "rest_json" | "wikipedia_api"
        url: string                  # URL fija o endpoint base
        url_template: string         # (Opcional) Plantilla con variables {mes}, {anio}, etc.
        sheet: string                # (Opcional para Excel) Nombre de la hoja
        start_year: int              # (Opcional) Año inicial de la serie
        indicators: dict             # (Opcional para World Bank) Mapeo código -> nombre interno
        params: dict                 # Parámetros adicionales específicos
```

### Entidades y fuentes mapeadas

1. **`dane`**:
   - `ipc_variacion`: `type: xlsx`, hoja `VarNal`, mensual desde 2003.
   - `ipc_indices`: `type: xlsx`, hoja `IndicesIPC`, mensual desde 2003.
   - `geih_mercado_laboral`: `type: xlsx`, boletín mensual nacional (TGP, TO, TD).
   - `geih_formalidad`: `type: xlsx`, anexo de informalidad mensual.
   - `geih_microdatos_ocupados`: `type: zip_catalog`, microdatos catálogo 853 con módulos Ocupados.
   - `exportaciones_omc`: `type: xlsx`, totales y sectores OMC.
   - `exportaciones_tradicionales`: `type: xlsx`, café, carbón, petróleo y no tradicionales.
   - `importaciones_omc`: `type: xlsx`, importaciones OMC.
2. **`banrep`**:
   - `tasas_interes`: `type: sdmx_xml`, flujo `DF_CBR_MONTHLY_HIST` desde 2000.
   - `trm`: `type: sdmx_xml`, flujo `DF_TRM_DAILY_HIST` (agregación promedio mensual).
3. **`world_bank`**:
   - `macro_economics`: `type: rest_json` vía `wbgapi`, 18 indicadores anuales para todos los países desde 1960.
4. **`wikipedia`**:
   - `salario_minimo`: `type: wikipedia_api`, histórico SMMLV y auxilio de transporte desde 1984.
   - `elecciones_presidenciales`: `type: wikipedia_api`, resultados 2022 y 2026 (1V y 2V).

---

## 2. Capa de Datos Crudos (`data/raw/`)

Estructura de directorios: `data/raw/[source_name]/[dataset_name]/[file_name].csv`

| Archivo Crudo | Columnas Principales | Tipo | Descripción |
|---|---|---|---|
| `dane/ipc_variacion/ipc_variacion.csv` | `periodo`, `inflacion_mensual`, `inflacion_anio_corrido` | Temporal mensual | Variaciones directas del DANE |
| `dane/ipc_indices/ipc_indices.csv` | `periodo`, `indice_ipc` | Temporal mensual | Índice base dic-2018 para variación interanual |
| `dane/geih_mercado_laboral/geih_empleo.csv` | `periodo`, `tasa_desempleo`, `tgp`, `to`, `subempleo` | Temporal mensual | Indicadores laborales oficiales |
| `dane/geih_formalidad/geih_formalidad.csv` | `periodo`, `informalidad` | Temporal mensual | Tasa de informalidad nacional |
| `dane/geih/ocupados_2025_*.csv` | `INGLABO`, `FEX_C18`, `OFICIO_C8` | Microdatos anuales | Microdatos filtrados tras descompresión limpia |
| `dane/comercio_exportaciones/exportaciones.csv` | `periodo`, `exportaciones_totales`, `tradicionales`, `no_tradicionales` | Temporal mensual | Exportaciones en miles USD |
| `dane/comercio_importaciones/importaciones.csv` | `periodo`, `importaciones_totales` | Temporal mensual | Importaciones CIF en miles USD |
| `banrep/tasas_interes/tasas_interes.csv` | `periodo`, `tasa_interes` | Temporal mensual | Tasa de intervención de política monetaria |
| `banrep/trm/trm.csv` | `periodo`, `trm` | Temporal mensual | Tasa representativa promedio mensual |
| `world_bank/[indicador]/[indicador].csv` | `country_code`, `year`, `valor` | Anual multi-país | 18 tablas individuales descargadas por API |
| `wikipedia/salario_minimo/salario_minimo.csv` | `year`, `smlv`, `auxilio_transporte` | Anual nacional | Decretos históricos verificados con anclas |
| `wikipedia/elecciones/presidenciales_*.csv` | `departamento`, `divipola`, `candidato`, `votos`, `porcentaje` | Electoral | Desgloses validados contra totales oficiales |

---

## 3. Capa Maestra Procesada (`data/processed/master/`)

1. **`master_world_bank_global.csv`** (Reemplazo oficial de `macro_economics_indicators_2026.csv`):
   - **Llave primaria:** `(country_code, year)`.
   - **Dimensiones:** `country_code`, `region_name`, `sub_region_name`, `intermediate_region`, `country_name`, `income_group`, `year`.
   - **Métricas:** 18 indicadores del Banco Mundial normalizados con nulos reales (`NaN`), más `total_gdp_million`, `gdp_percapita_variation` y `external_debt_pct_gdp`.
   - **Alcance:** ~14.190 filas para más de 200 países desde 1960.
2. **`master_colombia_anual.csv`**:
   - **Llave primaria:** `year` (o `periodo: "YYYY-12"`).
   - **Contenido:** Indicadores anuales unificados de Colombia (PIB, deuda pública, población, Gini, balanza comercial anual, desempleo anual).
3. **`master_colombia_mensual.csv`**:
   - **Llave primaria:** `periodo: "YYYY-MM"`.
   - **Contenido:** Fusión mensual de inflación, tasa BanRep, TRM, empleo GEIH y comercio exterior desde 2003.

---

## 4. Contratos de Entrega para el Observatorio (`data/processed/observatorio/`)

Estos archivos son generados en `odc-data-pipeline` y sincronizados automáticamente a `public/data/` en `fredericksalazar.github.io`:

| Archivo JSON | Estructura Principal | Consumidores Web |
|---|---|---|
| `data_inflacion.json` | `metadata`, `indicadores (inflacion_anual, tasa_interes, spread)`, `serie (YYYY-MM descendente)`, `historico` | `/observatorio/` (home del Observatorio), calculadoras y blog |
| `data_empleo.json` | `metadata`, `indicadores (tasa_desempleo, tgp, to, informalidad)`, `serie`, `historico` | `/observatorio/empleo/`, calculadoras |
| `data_pib.json` | `metadata`, `indicadores (pib_total, crecimiento_pib, pib_percapita, deuda_publica, gini)`, `serie`, `historico` | `/observatorio/pib/` |
| `data_comercio.json` | `metadata`, `indicadores (exportaciones, importaciones, balanza)`, `serie`, `matrices (omc, tradicionales)` | `/observatorio/comercio/` |
| `data_externo.json` | `metadata`, `indicadores (trm, reservas_netas, cuenta_corriente, ied, deuda_externa)`, `serie`, `historico` | `/observatorio/monetario/` |
| `data_demografia.json` | `metadata`, `indicadores (poblacion, esperanza_vida_mujeres, esperanza_vida_hombres, gini)`, `serie` | `/observatorio/demografia/` |
| `data_comparativo_col_<key>.json` | `metadata`, `indicadores (comparativa vs oponente)`, `series` | Artículos de series del blog ("Colombia vs rival") |
| `data_salario_minimo.json` | `metadata`, `indicadores`, `serie`, `historico` | `/calculadoras/sueldo-vs-inflacion/`, `/calculadoras/cuanto-ganas/` |
| `data_ingresos.json` | `metadata`, `indicadores (mediana, promedio)`, `percentiles`, `clases_sociales` | `/calculadoras/cuanto-ganas/` |
| `data_salarios_cargos.json` | `metadata`, `cargos (distribución por código CIUO-08)` | `/calculadoras/cuanto-ganas/` |
| `data_pres_*.json` | `metadata`, `candidatos`, `resultados`, `departamentos`, `municipios` | `/elecciones-presidenciales/` (2022 y 2026) |

Todas las series temporales cumplen estrictamente:
- Orden descendente (período más reciente primero).
- Identificador de período `YYYY-MM`.
- Valores faltantes como `null` explícito (sin ceros ni `-100.0` artificiales).
- Deltas calculados según frecuencia (mensual intermensual o interanual; anual interanual contra el último valor no nulo).
