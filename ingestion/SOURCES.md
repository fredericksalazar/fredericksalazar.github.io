# Fuentes de datos — Observatorio Económico Colombia

Resultado del spike (T1). Documenta las fuentes oficiales identificadas, sus formatos, URLs estables y cobertura histórica. Es el contrato técnico que consumen los ingesters de `sources/`.

---

## 1. Tasa de intervención de política monetaria (BanRep)

**Fuente**: Banco de la República de Colombia — Servicio web SDMX oficial
**Documentación**: [Guía técnica SDMX BanRep, agosto 2025 v3.0](https://suameca.banrep.gov.co/archivos/webservices/documento_tecnico_ws_consumo_sdmx.pdf)

### Endpoint

```
https://totoro.banrep.gov.co/nsi-jax-ws/rest/data/ESTAT,DF_CBR_MONTHLY_HIST,1.0/all/ALL/?startPeriod=2000&endPeriod=2027&dimensionAtObservation=TIME_PERIOD&detail=full
```

| Componente | Valor |
|---|---|
| Endpoint base | `https://totoro.banrep.gov.co/nsi-jax-ws/rest/data` |
| AGENCY_ID | `ESTAT` |
| FLOW_ID | `DF_CBR_MONTHLY_HIST` (Tasa Política Monetaria mensual histórica — promedio mensual) |
| VERSION | `1.0` |
| `startPeriod` / `endPeriod` | `YYYY` (endPeriod es exclusivo, usar año siguiente) |
| `dimensionAtObservation` | `TIME_PERIOD` |
| `detail` | `full` |

### Formato de respuesta

XML SDMX-ML 2.1. Las observaciones tienen esta forma:

```xml
<generic:Obs>
  <generic:ObsDimension value="2026-03" />
  <generic:ObsValue value="10.25" />
  <generic:Attributes>
    <generic:Value id="OBS_STATUS" value="A" />
  </generic:Attributes>
</generic:Obs>
```

- `value` del `ObsDimension` ya viene en formato `YYYY-MM` — perfecto.
- `OBS_STATUS = A` significa "Valor Normal" (transmisión OK).
- Unidad: porcentaje anual (PA).
- Frecuencia: mensual (promedio de tasas diarias del mes).

### Cobertura confirmada
- Inicio: **2000-01**
- Fin: el mes corriente publicado (ej. `2026-03` al hacer el spike).
- Verificación: el endpoint devolvió datos continuos sin gaps al consultar 2000–2027.

### Notas operativas
- No requiere autenticación.
- Endpoint estable (parte de SDMX ISO 17369:2013).
- Si por algún motivo `MONTHLY_HIST` no responde, alternativas: `DF_CBR_DAILY_HIST` y agregamos a mensual nosotros.

---

## 2. IPC / Inflación (DANE)

**Fuente**: DANE — anexos estadísticos publicados con cada boletín mensual del IPC.
**Página**: <https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-al-consumidor-ipc/ipc-historico>

DANE no expone API REST. Publica archivos Excel mensuales en URL predecible. **Cada archivo mensual contiene la serie histórica completa**, así que basta con descargar el del mes más reciente.

### Patrón de URLs

```
https://www.dane.gov.co/files/operaciones/IPC/{mes}{anio}/anex-IPC-Variacion-{mes}{anio}.xlsx
https://www.dane.gov.co/files/operaciones/IPC/{mes}{anio}/anex-IPC-Indices-{mes}{anio}.xlsx
```

Donde `{mes}` es la abreviatura en español de tres letras en minúscula:
`ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic`

Y `{anio}` es el año a 4 dígitos. Ejemplo: `mar2026`.

### Archivos relevantes

| Archivo | Contenido | Sheet | Sirve para |
|---|---|---|---|
| `anex-IPC-Variacion-{mes}{anio}.xlsx` | Variación porcentual mensual + acumulado año corrido | `VarNal` | **Inflación mensual** |
| `anex-IPC-Indices-{mes}{anio}.xlsx` | Índices base dic-2018=100, serie de empalme | `IndicesIPC` | Calcular **inflación anual** (Δ% interanual) |

### Estructura de los archivos

Layout pivotado: **filas = meses, columnas = años**.

Variación (`VarNal`):
- Fila 7: header con los años (2003, 2004, ..., año actual)
- Filas 8-19: meses Enero a Diciembre (variación porcentual mensual)
- Fila 20: "En año corrido" (acumulado)
- Cobertura: **2003-01 al mes corriente**

Índices (`IndicesIPC`):
- Misma estructura
- Cobertura: **2003-01 al mes corriente**
- Permite calcular variación anual: `(idx_t / idx_t-12 − 1) × 100`

### Cobertura confirmada
- Inicio: **2003-01** (limitación oficial de la serie de empalme actual base dic-2018)
- Fin: mes inmediatamente anterior al de publicación (DANE publica entre días 5-9 del mes siguiente)

### Notas operativas
- Los archivos pesan ≈ 36 KB (variación) y ≈ 40 KB (índices).
- Descarga directa con `requests` + parseo con `openpyxl` o `pandas`.
- El archivo se publica el mismo día del comunicado de prensa mensual.
- Si la URL del mes objetivo aún no existe (404), reintentar al día siguiente; el ingester debe degradar elegantemente y no romper.

---

## 3. Decisión sobre cobertura del histórico unificado

| Fuente | Disponible desde |
|---|---|
| BanRep TPM mensual | 2000-01 |
| DANE IPC empalme | 2003-01 |

**Recomendación**: comenzar el histórico unificado en **2003-01**, donde ambas series tienen cobertura oficial. Los años 2000-2002 quedarían con tasa BanRep pero sin inflación DANE oficial — alteraría la fila histórica con datos parciales y arruinaría el cálculo de spread.

Si más adelante se quiere cobertura 2000-2002, hay series IPC base 2008 publicadas por DANE pero requieren empalme manual. Lo dejamos fuera del MVP.

---

## 4. Resumen de contratos para los ingesters

### `sources/banrep.py` — `fetch(desde, hasta) -> DataFrame`
- Retorna `DataFrame[periodo: str (YYYY-MM), tasa_interes: float]`
- Hace GET al endpoint SDMX, parsea XML, extrae `(ObsDimension.value, ObsValue.value)`
- Guarda snapshot crudo en `data/raw/banrep/{yyyy-mm}.csv`

### `sources/dane_ipc.py` — `fetch(desde, hasta) -> DataFrame`
- Retorna `DataFrame[periodo: str (YYYY-MM), inflacion_mensual: float, inflacion_anual: float]`
- Descarga ambos xlsx (Variación + Índices) del mes más reciente disponible
- Despivota la matriz mes×año a serie de tiempo
- Calcula `inflacion_anual` como `(idx_t / idx_t-12 - 1) * 100`
- Guarda snapshots crudos en `data/raw/dane/{yyyy-mm}.csv`

### Llave de unificación
`periodo` = `YYYY-MM` (string). Es la llave primaria del histórico consolidado.
