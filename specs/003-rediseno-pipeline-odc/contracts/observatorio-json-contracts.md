# Contract: Observatorio JSON Contracts (`public/data/*.json`)

**Feature**: `specs/003-rediseno-pipeline-odc` | **Date**: 2026-10-17

Este documento detalla el contrato exacto de los archivos JSON emitidos por `odc-data-pipeline` hacia `public/data/` en `fredericksalazar.github.io`. El frontend de Astro y los componentes de Plotly dependen estrictamente de estas estructuras según [src/lib/observatorio/ARCHITECTURE.md](file:///Users/frederick/GitHub/fredericksalazar.github.io/src/lib/observatorio/ARCHITECTURE.md).

---

## 1. Estructura General Normativa

Todo dataset emitido por el pipeline debe cumplir:

```typescript
interface ObservatorioDataset<TSerieRow> {
  metadata: {
    ultima_actualizacion: string; // ISO 8601 UTC
    fuentes: Record<string, {
      nombre: string;
      url: string;
      indicador?: string;
    }>;
    definiciones: Record<string, string | number>;
    cobertura: {
      primer_periodo: string; // "YYYY-MM" o "YYYY"
      ultimo_periodo: string; // "YYYY-MM" o "YYYY"
      total_registros: number;
      granularidad?: "anual" | "mensual";
    };
    notas?: string;
  };
  indicadores: Record<string, {
    actual: {
      periodo: string | null;
      valor: number | null;
      variacion: "sube" | "baja" | "estable" | null;
      delta: number | null;
    };
    unidad: string;
  }>;
  serie: TSerieRow[]; // DESCENDENTE: período más reciente en el índice 0
  historico?: Record<string, number | Record<string, number>>; // "YYYY" -> valor
}
```

---

## 2. Inventario de Contratos Específicos

### 2.1 `data_inflacion.json`
- **Frecuencia:** Mensual (desde 2003).
- **Indicadores clave:**
  - `inflacion_anual`: % interanual IPC.
  - `tasa_interes`: % tasa de política monetaria BanRep.
  - `spread`: Tasa BanRep − Inflación anual (en puntos porcentuales).
  - `inflacion_mensual`: % variación mes a mes.
- **Serie:** `[{ periodo, inflacion_anual, inflacion_mensual, tasa_interes, spread, ... deltas y variaciones }]`

### 2.2 `data_empleo.json`
- **Frecuencia:** Mensual (GEIH, con respaldo histórico anual).
- **Indicadores clave:** `tasa_desempleo`, `tgp`, `to`, `informalidad`.
- **Serie:** `[{ periodo, tasa_desempleo, tgp, to, informalidad, ... deltas YoY }]`
- **Guarda ARQ-18:** Si la fuente DANE falla, no degrada a la serie anual si el JSON vigente ya tiene datos mensuales.

### 2.3 `data_pib.json`
- **Frecuencia:** Anual (`YYYY-12`, desde 1960).
- **Indicadores clave:** `pib_total` (miles de millones USD), `crecimiento_pib` (%), `pib_percapita` (USD), `deuda_publica` (% PIB), `gini` (pts).
- **Serie:** `[{ periodo: "YYYY-12", pib_total, crecimiento_pib, ... }]`

### 2.4 `data_comercio.json`
- **Frecuencia:** Mensual.
- **Indicadores clave:** `exportaciones` (miles USD), `importaciones` (miles USD), `balanza` (miles USD).
- **Campos adicionales de dominio:**
  - `omc`: participación y montos por grupos OMC (agropecuarios, combustibles y manufacturas).
  - `tradicionales`: café, carbón, petróleo vs no tradicionales.

### 2.5 `data_externo.json`
- **Frecuencia:** Mixta (TRM mensual; reservas, cuenta corriente, IED, deuda externa anuales).
- **Indicadores clave:** `trm` (COP/USD), `reservas_netas` (mil M USD), `cuenta_corriente` (% PIB), `ied` (% PIB), `deuda_externa` (% PIB).

### 2.6 `data_demografia.json`
- **Frecuencia:** Anual (`YYYY-12`, desde 1960).
- **Indicadores clave:** `poblacion`, `life_expectancy_women`, `life_expectancy_men`, `gini`.
- **Regla de nulos:** Acepta que los indicadores tengan coberturas temporales diferentes sin descartar filas completas con `dropna`.

### 2.7 `data_comparativo_col_<key>.json`
- **Formato:**
  - `metadata`: `{ fuente, oponente: { nombre, bandera, color }, cobertura, ultima_actualizacion }`
  - `indicadores`: `{ <id>: { anio, colombia, oponente, unidad, label, mejor } }`
  - `series`: `{ <id>: [{ anio, colombia, oponente }, ...] }`

### 2.8 `data_salario_minimo.json`
- **Frecuencia:** Anual (desde 1984).
- **Campos:** `smlv`, `auxilio_transporte`, `smlv_total`, variaciones nominales y reales frente a inflación.

### 2.9 `data_ingresos.json` y `data_salarios_cargos.json`
- **Consumo:** Calculadora de percentil y clase social (`/calculadoras/cuanto-ganas/`).
- **Campos de `data_ingresos.json`:** `smlv_referencia`, `indicadores` (`mediana`, `promedio`, `pct_hasta_1smlv`), `percentiles` (1 a 99), `clases` (umbrales y distribución de pobreza, vulnerable, media, alta).
- **Campos de `data_salarios_cargos.json`:** Diccionario de códigos CIUO-08 a 2 dígitos con `mediana`, `promedio`, `p25`, `p75`, `p90`, `muestra`, `nombre` y `slug`.

### 2.10 `data_pres_*.json`
- **Consumo:** `/elecciones-presidenciales/`.
- **Estructura:** Totales nacionales de escrutinio/preconteo, votos válidos, blancos, nulos, participación, y arrays departamentales y municipales con códigos DIVIPOLA.

---

## 3. Reglas de Validación de Contrato en `odc-data-pipeline`

1. **REGLA 5 — Serie descendente:** El índice 0 siempre debe tener el período más reciente.
2. **REGLA 6 — Formato de período:** Siempre `"YYYY-MM"` para mensuales y `"YYYY-12"` para anuales.
3. **REGLA 7 — Nulls explícitos:** Todo valor faltante debe serializarse como `null` en JSON; nunca `0`, `"NA"`, ni `NaN`.
4. **ARQ-18 — Guarda de no regresión:** Ningún exportador puede emitir un JSON con menor cantidad de registros o un período más antiguo que el archivo existente en producción.
