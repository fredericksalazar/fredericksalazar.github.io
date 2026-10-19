# Contract: Data Sources Schema (`config/data-sources.yaml`)

**Feature**: `specs/003-rediseno-pipeline-odc` | **Date**: 2026-10-17

Este documento define el esquema normativo del archivo `config/data-sources.yaml` en `odc-data-pipeline`. Cualquier nuevo dataset o proveedor agregado en el futuro debe cumplir esta especificación.

## 1. Esquema YAML

```yaml
# odc-data-pipeline — Catálogo de Fuentes de Datos
data_sources:
  dane:
    provider_name: "DANE — Departamento Administrativo Nacional de Estadística"
    provider_url: "https://www.dane.gov.co"
    datasets:
      ipc_variacion:
        description: "Variación mensual y año corrido del IPC nacional"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/IPC/{mes}{anio}/anex-IPC-Variacion-{mes}{anio}.xlsx"
        sheet: "VarNal"
        start_year: 2003
        fallback_months: 4

      ipc_indices:
        description: "Índices IPC base dic-2018=100 para cálculo de variación interanual"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/IPC/{mes}{anio}/anex-IPC-Indices-{mes}{anio}.xlsx"
        sheet: "IndicesIPC"
        start_year: 2003
        fallback_months: 4

      geih_mercado_laboral:
        description: "Mercado laboral nacional GEIH (TGP, TO, TD)"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/GEIH/anex-GEIH-{mes}{anio}.xlsx"
        fallback_months: 4

      geih_formalidad:
        description: "Medición de informalidad laboral mensual"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/GEIH/anex-GEIH-formalidad-{mes}{anio}.xlsx"
        fallback_months: 4

      geih_microdatos_ocupados:
        description: "Microdatos GEIH catálogo 853 para ocupados y salarios"
        frequency: "anual"
        type: "zip_catalog"
        catalog_id: 853
        base_download_url: "https://microdatos.dane.gov.co/index.php/catalog/{catalog_id}/download/{file_id}"
        extraction_flow: "unzip_strip_dat_sav_keep_csv"
        target_year: 2025

      exportaciones_omc:
        description: "Exportaciones totales y agrupaciones OMC CUCI Rev. 3"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/EXPORTACIONES/anex-EXPORTACIONES-SerieTotalesProductosOMCAgrCUCIR3-{mes}{anio}.xlsx"

      exportaciones_tradicionales:
        description: "Exportaciones tradicionales (café, carbón, petróleo) y no tradicionales"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/EXPORTACIONES/anex-EXPORTACIONES-SerieCafeCarbonPetroleoNotradicionales-{mes}{anio}.xlsx"

      importaciones_omc:
        description: "Importaciones CIF totales y por grandes grupos OMC"
        frequency: "mensual"
        type: "xlsx"
        url_template: "https://www.dane.gov.co/files/operaciones/IMP/anex-IMP-ProductosOMCAgrCUCI3-{mes}{anio}.xlsx"

  banrep:
    provider_name: "Banco de la República de Colombia"
    provider_url: "https://www.banrep.gov.co"
    datasets:
      tasas_interes:
        description: "Tasa de intervención de política monetaria (TPM mensual)"
        frequency: "mensual"
        type: "sdmx_xml"
        url: "https://totoro.banrep.gov.co/nsi-jax-ws/rest/data/ESTAT,DF_CBR_MONTHLY_HIST,1.0/all/ALL/?startPeriod=2000&dimensionAtObservation=TIME_PERIOD&detail=full"
        flow_id: "DF_CBR_MONTHLY_HIST"
        start_year: 2000

      trm:
        description: "Tasa Representativa del Mercado diaria (promediada a mensual)"
        frequency: "diaria_a_mensual"
        type: "sdmx_xml"
        url: "https://totoro.banrep.gov.co/nsi-jax-ws/rest/data/ESTAT,DF_TRM_DAILY_HIST,1.0/all/ALL/?startPeriod=2000&dimensionAtObservation=TIME_PERIOD&detail=full"
        flow_id: "DF_TRM_DAILY_HIST"
        start_year: 2000

  world_bank:
    provider_name: "Banco Mundial — World Development Indicators"
    provider_url: "https://data.worldbank.org"
    datasets:
      macro_economics:
        description: "Indicadores macroeconómicos y sociales globales para todos los países"
        frequency: "anual"
        type: "rest_json"
        api: "wbgapi"
        start_year: 1960
        master_countries: "data/metadata/countries_master.csv"
        indicators:
          NY.GDP.MKTP.CD: "total_gdp"
          NY.GDP.MKTP.KD.ZG: "gdp_variation"
          NY.GDP.PCAP.CD: "total_gdp_percapita"
          NY.GDP.PCAP.KD.ZG: "gdp_percapita_variation"
          FP.CPI.TOTL.ZG: "inflation_rate"
          NE.EXP.GNFS.ZS: "exports_of_goods_and_services"
          NE.IMP.GNFS.ZS: "imports_of_goods_and_services"
          BX.KLT.DINV.WD.GD.ZS: "foreign_direct_investment"
          FI.RES.TOTL.CD: "international_reserves"
          DT.DOD.DECT.CD: "external_debt"
          SL.UEM.TOTL.ZS: "unemployment_rate"
          SP.POP.TOTL: "poblacion"
          BN.CAB.XOKA.GD.ZS: "cuenta_corriente"
          GC.DOD.TOTL.GD.ZS: "deuda_publica"
          GC.TAX.TOTL.GD.ZS: "ingresos_tributarios"
          SI.POV.GINI: "gini"
          SP.DYN.LE00.FE.IN: "life_expectancy_women"
          SP.DYN.LE00.MA.IN: "life_expectancy_men"

  wikipedia:
    provider_name: "Wikipedia en español / inglés (fuentes compiladas de decretos y Registraduría)"
    provider_url: "https://es.wikipedia.org"
    datasets:
      salario_minimo:
        description: "Histórico de SMMLV y auxilio de transporte en Colombia"
        frequency: "anual"
        type: "wikipedia_api"
        page: "Anexo:Salario_mínimo_en_Colombia"
        start_year: 1984
        validation_anchors:
          1984: 11298
          2000: 260100
          2010: 515000
          2022: 1000000
          2025: 1423500
          2026: 1750905

      elecciones_presidenciales:
        description: "Resultados oficiales departamentales y municipales de elecciones presidenciales"
        frequency: "electoral"
        type: "wikipedia_api"
        pages:
          2022: "https://en.wikipedia.org/wiki/2022_Colombian_presidential_election"
          2026: "https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026"
```

## 2. Reglas de Validación

1. **Campos obligatorios:** Todo dataset debe tener `description`, `frequency` y `type`.
2. **Inmutabilidad de contratos:** Ningún script de ingesta debe tener URLs codificadas en duro en Python; debe leerlas exclusivamente de este archivo a través de `pipeline.utils.config_loader`.
3. **Manejo de variables:** Las plantillas de URL usan `{mes}` (tres letras en español: `ene`, `feb`, etc.) y `{anio}` (cuatro dígitos).
