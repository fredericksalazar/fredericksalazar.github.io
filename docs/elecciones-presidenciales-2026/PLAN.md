# Plan de implementación — Análisis Elecciones Presidenciales Colombia 2026 (1ª vuelta) con comparativo 2022

> **Este documento es la especificación completa para implementar un nuevo módulo del sitio.** Está escrito para ser ejecutado por un agente de IA partiendo de cero (sin contexto previo de la conversación). Sigue las fases en orden. Cada fase tiene criterios de aceptación explícitos.

---

## 0. Lectura obligatoria antes de empezar

1. **`src/lib/observatorio/ARCHITECTURE.md`** — Reglas vinculantes del Observatorio (pipeline → JSON → Astro/Plotly). El nuevo módulo **reutiliza esta arquitectura**: chart-defs registrados, `Chart.astro` único, datos en `public/data/*.json`, lectura via `data-client.ts`.
2. **`CLAUDE.md`** en raíz — Convenciones del proyecto.
3. Los archivos ya existentes en el observatorio (`src/components/observatorio/*`, `src/lib/observatorio/*`, `src/pages/observatorio/*`) — son la referencia visual y técnica. **No duplicar componentes, reutilizarlos.**

**No empezar a escribir código hasta haber leído esos tres puntos completos.**

---

## 1. Contexto y objetivo

### 1.1 Objetivo funcional

Crear un módulo en el sitio personal de Frederick Salazar dedicado al análisis estadístico-descriptivo de las **elecciones presidenciales de Colombia 2026** (primera vuelta), con un componente comparativo contra **primera vuelta 2022** y un módulo separado de **segunda vuelta 2022** (para entender el comportamiento entre vueltas).

### 1.2 Objetivo estratégico

- Ampliar el portafolio público de análisis políticos de datos abiertos (ya existe `analisis-elecciones-colombia` para el Congreso).
- Posicionar el dominio para keywords electorales colombianas en SEO.
- Reutilizar al máximo la infraestructura del Observatorio para no duplicar código.

### 1.3 Lo que NO incluye este plan

- Predicciones / modelos ML (este es un análisis descriptivo, no predictivo).
- Datos en tiempo real durante la jornada electoral (los datos consumidos son post-resultados oficiales).
- Análisis de redes sociales o sentimientos (queda como proyecto separado, ya existe el de 2022).

---

## 2. Alcance funcional — 12 bloques de análisis

Cada bloque corresponde a una sección visual en la página `/elecciones-presidenciales/2026/`. **El orden de los bloques es el orden de aparición.**

| # | Bloque | Tipo de visual | Datos requeridos |
|---|---|---|---|
| 1 | **Análisis general 2026** — totales: votos, válidos, nulos, no marcados, censo, participación, abstención | KPI Row + 2 charts (barra apilada de composición + comparativo histórico) | Resultados oficiales 2026 1ªV |
| 2 | **Votos por candidato 2026** | Barra horizontal ordenada descendente | Resultados oficiales 2026 1ªV |
| 3 | **Mapa Colombia 2026 — ganador por departamento** | Choropleth departamental coloreado por candidato/partido ganador | Resultados oficiales 2026 1ªV + GeoJSON deptos |
| 4 | **Mapa Colombia 2026 — ganador por municipio** | Choropleth municipal coloreado por candidato/partido ganador | Resultados oficiales 2026 1ªV + GeoJSON municipios |
| 5 | **(Numerado 6 en el requerimiento)** — Comparativo de indicadores generales 2022 1ªV vs 2026 1ªV | KPI row dual + barras lado a lado | Resultados 2022 1ªV + 2026 1ªV |
| 6 | **Agrupación por ideología y comparativo 2022 vs 2026** | Donut/Treemap por bloque ideológico × 2 + diferencia | Catálogo candidatos con ideología asignada |
| 7 | **Mapa de variación 2022→2026 — departamento y municipio** | Dos choropleths con `Δ ideología dominante` (gana/pierde por bloque) | Joins entre datasets electorales + GeoJSON |
| 8 | **Costo de votos vs umbral presidencial** | Barras horizontales: distancia (en votos) a la mayoría simple o al umbral de paso a 2ª vuelta | Resultados 2026 1ªV |
| 9 | **Segunda vuelta 2022: cómo se reconfiguraron los votos entre vueltas** | Sankey (origen partido 1ªV → destino 2ªV) + mapa "de dónde salieron los votos del ganador 2ªV" | Resultados 2022 1ªV + 2022 2ªV |
| 10 | **Polarización 2026 vs 2022** | Índice de polarización (cálculo propio) + gráfico de evolución | Datasets 1ªV 2022 y 2026 |
| 11 | **Financiación de campañas — inversión, ROI por voto, reposición** | Tabla + 2 charts: ROI ($ invertido / voto obtenido) + reposición proyectada | CNE Cuentas Claras |

> El requerimiento original lista 12 bloques, pero los items 3 y 8 del requerimiento (mapas geográficos) son **dos visualizaciones de un mismo bloque temático**. Mantengo 11 secciones para evitar repetición visual; si el usuario prefiere mantener separados los mapas 2026 puro y los mapas de variación, son 12 secciones. **Default: 11 secciones consolidadas. Confirmar con el usuario antes de cambiar.**

---

## 3. Decisiones arquitectónicas

### 3.1 Ubicación en el sitio

- **Nueva sección top-level**: `/elecciones-presidenciales/` (no anidada bajo `/observatorio/` ni `/proyectos/`).
- Página principal: `/elecciones-presidenciales/2026/` (primera vuelta 2026).
- Páginas adicionales para futuro: `/elecciones-presidenciales/2026-segunda-vuelta/` (cuando ocurra) y `/elecciones-presidenciales/2022/` (archivo histórico, opcional v2).
- Página acerca: `/elecciones-presidenciales/acerca/`.

### 3.2 Reutilización de arquitectura observatorio

- **ChartDefs**: nuevo archivo `src/lib/observatorio/chart-defs/elecciones-presidenciales.ts` registrado en `chart-defs/index.ts`. Todos los charts del módulo viven ahí.
- **Componentes**: reutilizar `Chart.astro`, `ChartContainer.astro`, `PageHeader.astro`, `KpiRow.astro`, `IndicadorCard.astro`, `IndicadorPanel.astro`, `GlosarioGrid.astro`, `DashboardFooter.astro`, `PlotlyLoader.astro`.
- **Nuevo sub-nav**: crear `src/components/observatorio/EleccionesNav.astro` (paralelo a `DashboardNav.astro`) con tabs: "2026 — 1ª vuelta", "2022 — 1ª vuelta", "2022 — 2ª vuelta", "Acerca". El usuario puede empezar con solo la tab de 2026.
- **Tokens visuales**: usar `COLORS`, `FONT`, `baseLayout()` de `src/lib/observatorio/charts.ts`. **Añadir tokens nuevos para colores de partidos/bloques** (ver §4.4).

### 3.3 Sidebar global

Agregar entrada en `src/components/Sidebar.astro` entre "Observatorio" y "Blog":

```ts
{
  label: 'Elecciones',
  href: '/elecciones-presidenciales/',
  icon: `<svg ...>` // urna o boleta, ver §6.1
}
```

Redirige al index del módulo, que es la página de 2026 1ª vuelta.

### 3.4 Cumplimiento de reglas observatorio

Esto **no es opcional**:
- **REGLA 1**: Toda serie cuantitativa vive en `public/data/data_*.json`. Cero hardcoding de cifras electorales en `.astro` o `.ts` (salvo el fallback de `fuentes.ts`).
- **REGLA 2**: Charts cargan datos vía `fetch` a través de `loadDatasets()`. Editar un valor del JSON debe reflejarse sin recompilar.
- **REGLA 3**: KPIs y JSON-LD son build-time (vía `data.ts`).
- **REGLA 4**: No crear componentes Chart-específicos. Todo via `ChartDef`.
- **REGLA 8**: Nunca `fetch('/data/...')` directo desde componente.
- **REGLA 11-15**: Tokens centralizados, `baseLayout()` siempre, `ariaLabel` siempre, `height` en el def.

---

## 4. Fuentes de datos

### 4.1 Resultados electorales oficiales

| Fuente | URL | Cubre | Formato |
|---|---|---|---|
| **Registraduría Nacional — Datos Abiertos** | https://www.datos.gov.co/browse?q=presidencia | 2022 y elecciones anteriores | CSV |
| **Registraduría — Resultados** | https://resultados.registraduria.gov.co | 2026 1ª vuelta cuando publique | HTML / API JSON |
| **Portal Datos Abiertos Colombia** | https://www.datos.gov.co/Educaci-n/Resultados-Elecci-n-Presidente-2022/i7gj-43cb | 2022 1ªV y 2ªV por mesa | CSV |

**Acción específica**: descargar a `data/raw/registraduria/`:
- `resultados_presidente_2022_1v.csv` (por mesa con código DIVIPOLA)
- `resultados_presidente_2022_2v.csv`
- `resultados_presidente_2026_1v.csv` (cuando publique; si no está, dejar pipeline ejecutable pero con dataset vacío y `disabled: true` en la nav)

### 4.2 DIVIPOLA y GeoJSON

| Fuente | URL | Uso |
|---|---|---|
| **DANE — DIVIPOLA** | https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/nomenclaturas-y-clasificaciones/clasificaciones/divipola | Catálogo oficial de códigos depto/municipio |
| **GeoJSON departamentos** | https://github.com/john-guerra/colombia.geo.json | Geometría simplificada para choropleth |
| **GeoJSON municipios** | https://github.com/marcovega/colombia-json o https://github.com/danfelles/colombia-geojson | Geometría municipal (cuidado: archivos pesados, >5 MB) |

**Acción específica**:
- Descargar y simplificar GeoJSONs (mapshaper) a un tamaño objetivo de < 1 MB para departamentos y < 3 MB para municipios.
- Guardar como `public/geo/colombia-departamentos.geo.json` y `public/geo/colombia-municipios.geo.json`.
- Los IDs en cada feature deben ser el **código DIVIPOLA** (2 dígitos para departamento, 5 dígitos para municipio, incluyendo el cero a la izquierda — usar string, no number).

### 4.3 Financiación de campañas

| Fuente | URL | Cubre | Notas |
|---|---|---|---|
| **CNE — Cuentas Claras** | https://cuentasclaras.gov.co | Reportes oficiales de ingresos/gastos de campaña | Requiere scraping o descarga manual de reportes; no hay API pública estable |
| **CNE — Resoluciones de reposición** | https://www.cne.gov.co | Valor por voto válido para reposición | PDF; extraer manualmente |
| **MOE — Observatorio de financiación** | https://moe.org.co | Datos consolidados de transparencia electoral | Útil como segunda fuente / validación |

**Acción específica**: para 2026 puede que los reportes no estén consolidados al momento de la implementación. Estrategia:
- Si los datos definitivos existen → consumir y graficar.
- Si solo hay reportes parciales → usarlos con disclaimer visible en el bloque 11 ("Datos parciales a [fecha]").
- Si no hay datos → renderizar el bloque con estado `data-state="pending"` y mensaje explicativo.

### 4.4 Catálogo de candidatos e ideología

Crear archivo manual curado por el autor: `public/data/data_candidatos_presidenciales.json`. Contiene la metadata de cada candidato (foto, partido, ideología, alianzas, etc.) para 2022 1ªV, 2022 2ªV y 2026 1ªV.

Clasificación ideológica analítica (no oficial), usando las mismas categorías que el análisis del Congreso 2026:
- `izquierda` (rojo `#dc2626`)
- `centro-izquierda` (naranja `#ea580c`)
- `centro` (amarillo `#eab308`)
- `centro-derecha` (azul claro `#60a5fa`)
- `derecha` (azul `#2563eb`)
- `extrema-derecha` (azul oscuro `#1e3a8a`) — solo si aplica

Estos colores se añaden a `COLORS` en `src/lib/observatorio/charts.ts` bajo `COLORS.ideologia.{izquierda, centro, ...}`.

---

## 5. Estructura de archivos a crear

### 5.1 Datos crudos y pipeline

```
data/raw/registraduria/                                  # Datos descargados
  resultados_presidente_2022_1v.csv
  resultados_presidente_2022_2v.csv
  resultados_presidente_2026_1v.csv                      # Si está disponible
data/raw/cne/
  cuentas_claras_2026.csv
  resolucion_reposicion_2026.pdf

pipeline/elecciones/                                     # Scripts Python
  __init__.py
  config.py                                              # Paths, constantes
  fuentes.py                                             # URLs y descargas
  normalizar_resultados.py                               # CSV → DataFrame normalizado
  ideologia.py                                           # Asignación catalogada
  agregar_geografico.py                                  # Sumas por depto/municipio
  derivar_indicadores.py                                 # Polarización, participación, etc.
  derivar_financiacion.py                                # ROI, reposición
  generar_jsons.py                                       # Escribe public/data/*.json
  README.md
```

### 5.2 Datos publicados (público)

```
public/data/
  data_pres_2026_1v.json                                 # Resultados 1ªV 2026
  data_pres_2022_1v.json                                 # Resultados 1ªV 2022
  data_pres_2022_2v.json                                 # Resultados 2ªV 2022
  data_pres_candidatos.json                              # Catálogo candidatos + ideología
  data_pres_comparativo.json                             # Joins precalculados 2022 vs 2026
  data_pres_geografia.json                               # Agregados depto + municipio
  data_pres_financiacion.json                            # CNE Cuentas Claras

public/geo/
  colombia-departamentos.geo.json
  colombia-municipios.geo.json
```

### 5.3 Tipos y data-client

```
src/lib/observatorio/types.ts                            # Extender con tipos electorales
src/lib/observatorio/data.ts                             # Añadir getPresidenciales*()
src/lib/observatorio/data-client.ts                      # Añadir loadPres*Asc()
src/lib/observatorio/derivations-elecciones.ts           # NUEVO — joins y cálculos
src/lib/observatorio/chart-defs/elecciones-presidenciales.ts  # NUEVO — todos los ChartDefs
src/lib/observatorio/chart-defs/index.ts                 # Registrar nuevos defs
```

### 5.4 Componentes Astro

```
src/components/Sidebar.astro                             # Modificar: añadir entrada "Elecciones"
src/components/observatorio/EleccionesNav.astro          # NUEVO — sub-nav del módulo
src/components/observatorio/MapaChoropleth.astro         # NUEVO o adaptación — ver §11
src/components/observatorio/CandidatoCard.astro          # NUEVO — card por candidato (foto + partido + ideología)
src/components/observatorio/FinanciacionTabla.astro      # NUEVO — tabla CNE
```

### 5.5 Páginas

```
src/pages/elecciones-presidenciales/
  index.astro                                            # Redirect server-side a /2026/
  2026.astro                                             # Página principal — 11 secciones
  2022.astro                                             # Opcional v2 — 1ª vuelta 2022 standalone
  2022-segunda-vuelta.astro                              # 2ª vuelta 2022
  acerca.astro                                           # Metodología, fuentes, limitaciones
```

---

## 6. Fase a fase — Implementación

### Fase 1 — Datos y pipeline (sin frontend)

**Objetivo**: dejar todos los JSONs en `public/data/` con el contrato correcto, listos para ser consumidos. **Hasta que esta fase no esté completa, no se toca código de Astro.**

#### 1.1 Inventario y descarga

1. Crear `data/raw/registraduria/` y `data/raw/cne/`.
2. Descargar manualmente o vía script:
   - `resultados_presidente_2022_1v.csv` desde datos.gov.co.
   - `resultados_presidente_2022_2v.csv` desde datos.gov.co.
   - `resultados_presidente_2026_1v.csv` desde Registraduría (o dejar placeholder si aún no publicado).
3. Verificar columnas esperadas en cada CSV: `cod_depto`, `cod_mpio`, `mesa`, `candidato`, `partido`, `votos`. Si el nombre difiere, documentarlo en `pipeline/elecciones/normalizar_resultados.py`.

#### 1.2 Normalización

Crear `pipeline/elecciones/normalizar_resultados.py`:

- Lee cada CSV.
- Normaliza nombres de candidato y partido (mayúsculas/tildes/aliases). Producir un diccionario maestro en `pipeline/elecciones/aliases_partidos.json`.
- Convierte `cod_depto` y `cod_mpio` a string con ceros a la izquierda (DIVIPOLA).
- Agrega columnas: `total_votos_validos`, `total_votos_no_marcados`, `total_votos_nulos`, `total_votos_inscritos` (= potencial sufragantes), `total_votos`, `participacion = total_votos / censo`.
- Exporta `df_2022_1v.parquet`, `df_2022_2v.parquet`, `df_2026_1v.parquet` en `data/processed/`.

#### 1.3 Catálogo de candidatos

Crear manualmente `public/data/data_pres_candidatos.json`:

```json
{
  "metadata": {
    "ultima_actualizacion": "2026-MM-DDTHH:MM:SS+00:00",
    "fuentes": { "registraduria": { ... }, "curacion_autor": { ... } },
    "definiciones": {
      "ideologia": "Clasificación analítica del autor basada en trayectoria pública.",
      "bloques": ["izquierda", "centro-izquierda", "centro", "centro-derecha", "derecha", "extrema-derecha"]
    },
    "cobertura": { "elecciones": ["2022-1v", "2022-2v", "2026-1v"] }
  },
  "candidatos": {
    "2026-1v": [
      {
        "id": "candidato-x",
        "nombre": "Nombre Apellido",
        "partido": "Partido X",
        "coalicion": "Pacto Y",
        "ideologia": "izquierda",
        "foto": "/images/elecciones/candidato-x.jpg"
      }
    ],
    "2022-1v": [...],
    "2022-2v": [...]
  }
}
```

Las fotos van a `public/images/elecciones/`. Si no hay foto, usar avatar genérico (la convención de cada partido se elige por el autor).

#### 1.4 Agregados geográficos

Crear `pipeline/elecciones/agregar_geografico.py`:

- Por elección (2022-1v, 2022-2v, 2026-1v): produce dos agregados.
- **Por departamento** (`cod_depto`): `{ cod_depto, votos_por_candidato: {id: votos}, ganador_id, ganador_ideologia, total_validos, participacion }`.
- **Por municipio** (`cod_mpio`): mismas columnas.
- Exporta:
  - `data_pres_2026_1v.json` (estructura completa, ver §7).
  - `data_pres_2022_1v.json`.
  - `data_pres_2022_2v.json`.
  - `data_pres_geografia.json` (estructura compacta solo con agregados depto/municipio para los mapas).

#### 1.5 Comparativo 2022 vs 2026 e ideología

Crear `pipeline/elecciones/derivar_indicadores.py`:

- Reúne 2022-1v y 2026-1v.
- Calcula índice de polarización por elección. **Definición usada**: índice basado en la dispersión de votos entre bloques ideológicos.

  ```
  P = sum( |share_bloque - 1/N_bloques| ) / 2   # Index of dissimilarity ajustado
  ```

  Documentar la fórmula exacta en `pipeline/elecciones/derivar_indicadores.py` y en la página `acerca.astro`.

- Calcula variación por depto/municipio: para cada zona, `Δ share` por bloque ideológico 2022 vs 2026. Resultado: `data_pres_comparativo.json` con `serie_departamentos`, `serie_municipios` y agregados nacionales.

- Calcula también:
  - Polarización por departamento.
  - "Departamento más volátil" (cambio absoluto mayor entre vueltas).
  - "Departamentos que cambiaron de bloque ideológico ganador".

#### 1.6 Costo de votos (bloque 8)

En `derivar_indicadores.py`:

- Define el **umbral presidencial** como `mayoria_simple = 50% + 1 voto`, calculado sobre `total_validos`.
- También calcula el **umbral de paso a 2ª vuelta** = candidato más votado por debajo del 50% **y** segundo más votado (suponiendo ningún candidato pase del 50%).
- Para cada candidato 2026 1ªV: `distancia_a_mayoria_simple = mayoria_simple - votos_obtenidos`.
- Exporta en `data_pres_2026_1v.json` bajo `indicadores.costo_votos`.

#### 1.7 Financiación (bloque 11)

Crear `pipeline/elecciones/derivar_financiacion.py`:

- Cargar `data/raw/cne/cuentas_claras_2026.csv` (descarga manual desde Cuentas Claras).
- Estructura: por candidato: `ingresos_reportados`, `gastos_reportados`, `fuentes_ingreso`, `top_gastos`.
- Calcular ROI: `costo_por_voto = gastos_reportados / votos_obtenidos`.
- Calcular reposición esperada: `reposicion = votos_validos_obtenidos * valor_por_voto_cne` (el `valor_por_voto_cne` viene de `data/raw/cne/resolucion_reposicion_2026.pdf`, extraído manualmente, en COP).
- Solo candidatos que superan el umbral CNE (típicamente 4% de votos válidos) reciben reposición. Aplicar filtro.
- Exporta `data_pres_financiacion.json`.

#### 1.8 Generar JSONs definitivos

Crear `pipeline/elecciones/generar_jsons.py` que ejecuta todo lo anterior y escribe a `public/data/`. **Cada JSON cumple el contrato de §7**.

#### 1.9 GeoJSONs

1. Descargar departamentos y municipios de los repos referenciados.
2. Validar que los IDs de cada feature sean código DIVIPOLA (string).
3. Simplificar con `mapshaper` o `topojson-simplify` hasta:
   - Departamentos: archivo final < 1 MB.
   - Municipios: archivo final < 3 MB.
4. Guardar como `public/geo/colombia-departamentos.geo.json` y `public/geo/colombia-municipios.geo.json`.

**Criterio de aceptación Fase 1**:
- Todos los JSON en `public/data/` validan con un schema simple (ver §7).
- `python -m pipeline.elecciones.generar_jsons` corre sin error.
- Los GeoJSONs pesan dentro del objetivo.
- `npm run dev` aún arranca sin errores (no se ha tocado código frontend todavía).

---

### Fase 2 — Tipos y data-client

#### 2.1 Tipos

Extender `src/lib/observatorio/types.ts` con:

```ts
export interface CandidatoPres {
  id: string;
  nombre: string;
  partido: string;
  coalicion?: string;
  ideologia: IdeologiaBloque;
  foto?: string;
}
export type IdeologiaBloque = "izquierda" | "centro-izquierda" | "centro" | "centro-derecha" | "derecha" | "extrema-derecha";

export interface ResultadoCandidato {
  id: string;
  votos: number;
  share: number;
}

export interface ElectoralAggDepto {
  cod_depto: string;
  nombre_depto: string;
  ganador_id: string;
  ganador_ideologia: IdeologiaBloque;
  votos_por_candidato: Record<string, number>;
  votos_por_ideologia: Record<IdeologiaBloque, number>;
  total_validos: number;
  total_votos: number;
  censo: number;
  participacion: number;
}

export interface ElectoralAggMpio extends Omit<ElectoralAggDepto, "cod_depto" | "nombre_depto"> {
  cod_mpio: string;
  nombre_mpio: string;
  cod_depto: string;
}

export interface PresEleccionData {
  metadata: ObservatorioMetadata;
  eleccion: { anio: number; vuelta: 1 | 2; fecha: string };
  resultados: ResultadoCandidato[];
  agregados: {
    nacional: { censo: number; total_votos: number; validos: number; nulos: number; no_marcados: number; participacion: number; abstencion: number };
    departamentos: ElectoralAggDepto[];
    municipios: ElectoralAggMpio[];
  };
  indicadores: {
    polarizacion: number;
    costo_votos?: { mayoria_simple: number; distancias: Record<string, number> };
  };
}

export interface PresCandidatosData {
  metadata: ObservatorioMetadata;
  candidatos: {
    "2022-1v": CandidatoPres[];
    "2022-2v": CandidatoPres[];
    "2026-1v": CandidatoPres[];
  };
}

export interface PresComparativoData {
  metadata: ObservatorioMetadata;
  nacional: { polarizacion_2022: number; polarizacion_2026: number; delta: number };
  serie_departamentos: Array<{ cod_depto: string; nombre_depto: string; delta_por_ideologia: Record<IdeologiaBloque, number> }>;
  serie_municipios: Array<{ cod_mpio: string; nombre_mpio: string; delta_por_ideologia: Record<IdeologiaBloque, number> }>;
}

export interface PresFinanciacionData {
  metadata: ObservatorioMetadata;
  valor_por_voto_cop: number;
  candidatos: Array<{
    id: string;
    nombre: string;
    ingresos_reportados: number;
    gastos_reportados: number;
    votos_obtenidos: number;
    costo_por_voto: number;
    reposicion_esperada: number | null;
    supera_umbral_reposicion: boolean;
  }>;
}
```

#### 2.2 data.ts (build-time / SEO)

Extender `src/lib/observatorio/data.ts` con:

```ts
const pres2026_1v = readPublicJSON<PresEleccionData>("data_pres_2026_1v");
const pres2022_1v = readPublicJSON<PresEleccionData>("data_pres_2022_1v");
const pres2022_2v = readPublicJSON<PresEleccionData>("data_pres_2022_2v");
const presCandidatos = readPublicJSON<PresCandidatosData>("data_pres_candidatos");
const presComparativo = readPublicJSON<PresComparativoData>("data_pres_comparativo");
const presFinanciacion = readPublicJSON<PresFinanciacionData>("data_pres_financiacion");

export const getPres2026_1v = (): PresEleccionData => pres2026_1v;
export const getPres2022_1v = (): PresEleccionData => pres2022_1v;
export const getPres2022_2v = (): PresEleccionData => pres2022_2v;
export const getPresCandidatos = (): PresCandidatosData => presCandidatos;
export const getPresComparativo = (): PresComparativoData => presComparativo;
export const getPresFinanciacion = (): PresFinanciacionData => presFinanciacion;
```

#### 2.3 data-client.ts (runtime / charts)

Extender:

```ts
export const loadPres2026_1v = () => load<PresEleccionData>("data_pres_2026_1v");
export const loadPres2022_1v = () => load<PresEleccionData>("data_pres_2022_1v");
export const loadPres2022_2v = () => load<PresEleccionData>("data_pres_2022_2v");
export const loadPresCandidatos = () => load<PresCandidatosData>("data_pres_candidatos");
export const loadPresComparativo = () => load<PresComparativoData>("data_pres_comparativo");
export const loadPresFinanciacion = () => load<PresFinanciacionData>("data_pres_financiacion");

// Añadir a DatasetName y a un nuevo objeto ASC_LOADERS (estos NO son series temporales, no necesitan .reverse).
export type DatasetName = "inflacion" | "pib" | "comercio" | "empleo" | "externo"
  | "pres-2026-1v" | "pres-2022-1v" | "pres-2022-2v"
  | "pres-candidatos" | "pres-comparativo" | "pres-financiacion";
```

**Criterio de aceptación Fase 2**: `npx astro check` pasa sin errores.

---

### Fase 3 — Sidebar y sub-navegación

#### 3.1 Sidebar global

Modificar `src/components/Sidebar.astro` — añadir entre `Observatorio` y `Blog`:

```ts
{
  label: 'Elecciones',
  href: '/elecciones-presidenciales/',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v6H4z"/><path d="M4 14h16v6H4z"/><circle cx="8" cy="7" r="1"/><circle cx="8" cy="17" r="1"/></svg>`,
}
```

(Icono = urna estilizada. Si el agente prefiere otro icono Lucide-style, OK siempre que sea SVG inline sin dependencias.)

#### 3.2 Sub-nav del módulo

Crear `src/components/observatorio/EleccionesNav.astro` clonando la estructura de `DashboardNav.astro` con tabs:

```ts
const dashboards: DashboardItem[] = [
  { slug: "2026-1v", label: "2026 · 1ª Vuelta", href: "/elecciones-presidenciales/2026/" },
  { slug: "2022-1v", label: "2022 · 1ª Vuelta", href: "/elecciones-presidenciales/2022/", disabled: true, badge: "Próx." },
  { slug: "2022-2v", label: "2022 · 2ª Vuelta", href: "/elecciones-presidenciales/2022-segunda-vuelta/" },
  { slug: "acerca", label: "Acerca", href: "/elecciones-presidenciales/acerca/" },
];
```

#### 3.3 Redirect del index del módulo

`src/pages/elecciones-presidenciales/index.astro` — server redirect:

```astro
---
return Astro.redirect("/elecciones-presidenciales/2026/", 302);
---
```

(O renderizar un hub con cards si el usuario lo prefiere; default: redirect.)

**Criterio de aceptación Fase 3**: el sidebar muestra "Elecciones", click navega a `/elecciones-presidenciales/2026/` (página todavía vacía pero responde 200).

---

### Fase 4 — ChartDefs (uno por sección)

Crear `src/lib/observatorio/chart-defs/elecciones-presidenciales.ts` con un `ChartDef` por cada visualización. **Todos los IDs en kebab-case y registrados en `chart-defs/index.ts`.**

| Bloque | Chart ID | Tipo Plotly | Datasets |
|---|---|---|---|
| 1 | `pres-2026-composicion-votos` | `pie` (donut) | `pres-2026-1v` |
| 1 | `pres-2026-participacion-historico` | `bar` | `pres-2026-1v`, `pres-2022-1v` |
| 2 | `pres-2026-votos-candidato` | `bar` horizontal | `pres-2026-1v`, `pres-candidatos` |
| 3 | `pres-2026-mapa-depto-ganador` | `choropleth` GeoJSON | `pres-2026-1v` |
| 4 | `pres-2026-mapa-mpio-ganador` | `choropleth` GeoJSON | `pres-2026-1v` |
| 5 | `pres-comparativo-2022-2026-kpi` | KPI cards (no Plotly, ver §10) | build-time |
| 5 | `pres-comparativo-2022-2026-bar` | `bar` agrupadas | `pres-2026-1v`, `pres-2022-1v` |
| 6 | `pres-ideologia-2026` | `pie` donut | `pres-2026-1v`, `pres-candidatos` |
| 6 | `pres-ideologia-2022` | `pie` donut | `pres-2022-1v`, `pres-candidatos` |
| 6 | `pres-ideologia-comparativo` | `bar` agrupadas | `pres-comparativo` |
| 7 | `pres-mapa-variacion-depto` | `choropleth` con diverging scale | `pres-comparativo` |
| 7 | `pres-mapa-variacion-mpio` | `choropleth` con diverging scale | `pres-comparativo` |
| 8 | `pres-distancia-mayoria` | `bar` horizontal | `pres-2026-1v`, `pres-candidatos` |
| 9 | `pres-2v-sankey` | `sankey` | `pres-2022-1v`, `pres-2022-2v`, `pres-candidatos` |
| 9 | `pres-2v-mapa-flujo` | `choropleth` | `pres-2022-2v`, `pres-2022-1v` |
| 10 | `pres-polarizacion-evolucion` | `bar` 2 puntos + delta callout | `pres-comparativo` |
| 10 | `pres-polarizacion-mapa` | `choropleth` | `pres-comparativo` |
| 11 | `pres-financiacion-roi` | `bar` horizontal | `pres-financiacion`, `pres-candidatos` |
| 11 | `pres-financiacion-reposicion` | `bar` horizontal | `pres-financiacion`, `pres-candidatos` |

**Patrón por ChartDef**:

```ts
export const pres2026VotosCandidato: ChartDef = {
  id: "pres-2026-votos-candidato",
  titulo: "Votos por candidato — 2026 1ª vuelta",
  pregunta: "¿Cómo se distribuyeron los votos válidos entre los candidatos?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-1v", "pres-candidatos"],
  height: 420,
  ariaLabel: "Barras horizontales con votos por candidato presidencial Colombia 2026 primera vuelta",
  build({ "pres-2026-1v": eleccion, "pres-candidatos": cat }) {
    const candidatos = cat!.candidatos["2026-1v"];
    const sorted = [...eleccion!.resultados].sort((a, b) => b.votos - a.votos);
    const x = sorted.map(r => r.votos);
    const y = sorted.map(r => candidatos.find(c => c.id === r.id)?.nombre ?? r.id);
    const colors = sorted.map(r => COLORS.ideologia[candidatos.find(c => c.id === r.id)?.ideologia ?? "centro"]);
    return {
      traces: [{ type: "bar", orientation: "h", x, y, marker: { color: colors } }],
      layout: baseLayout({
        yaxis: { autorange: "reversed", tickfont: { size: 11, color: COLORS.textMuted }, automargin: true },
        xaxis: { tickformat: ",.0f", ticksuffix: "" },
        margin: { l: 180, r: 24, t: 16, b: 40 },
      }),
    };
  },
};
```

**Registrar todos en `chart-defs/index.ts`** siguiendo el patrón existente.

**Criterio de aceptación Fase 4**: `npx astro check` pasa. Los charts no se renderizan todavía (no hay página), pero el registry está completo.

---

### Fase 5 — Página `/elecciones-presidenciales/2026/`

Crear `src/pages/elecciones-presidenciales/2026.astro` siguiendo la estructura de las páginas observatorio (referencia: `src/pages/observatorio/comercio.astro`):

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Hero from "../../components/Hero.astro";
import EleccionesNav from "../../components/observatorio/EleccionesNav.astro";
import PlotlyLoader from "../../components/observatorio/PlotlyLoader.astro";
import KpiRow from "../../components/observatorio/KpiRow.astro";
import PageHeader from "../../components/observatorio/PageHeader.astro";
import IndicadorPanel from "../../components/observatorio/IndicadorPanel.astro";
import Chart from "../../components/observatorio/Chart.astro";
import DashboardFooter from "../../components/observatorio/DashboardFooter.astro";
import { getPres2026_1v, getPresComparativo, getPresFinanciacion } from "../../lib/observatorio/data";

const eleccion = getPres2026_1v();
const comparativo = getPresComparativo();
const financiacion = getPresFinanciacion();
const fecha = eleccion.eleccion.fecha;

const kpis = [
  { titulo: "Censo electoral", valor: eleccion.agregados.nacional.censo, formato: "compact" },
  { titulo: "Participación", valor: eleccion.agregados.nacional.participacion, formato: "percent" },
  { titulo: "Votos válidos", valor: eleccion.agregados.nacional.validos, formato: "compact" },
  { titulo: "Polarización", valor: eleccion.indicadores.polarizacion, formato: "decimal" },
];

const jsonLd = { /* Dataset + Article, ver §13 */ };
---
<BaseLayout
  title="Elecciones Presidenciales Colombia 2026 — Análisis 1ª Vuelta"
  description="Análisis estadístico descriptivo de los resultados de la primera vuelta presidencial de Colombia 2026, con comparativo contra 2022. Mapas departamentales y municipales, financiación, polarización."
  fullWidth={true}
>
  <Hero
    eyebrow={`Actualizado · ${fecha}`}
    title="Elecciones Presidenciales 2026"
    subtitle="Primera vuelta · Análisis descriptivo, geoespacial y comparativo con 2022"
  />
  <EleccionesNav active="2026-1v" />
  <PlotlyLoader />

  <main class="observatorio-container">
    <KpiRow indicadores={kpis} />

    {/* Bloque 1 */}
    <IndicadorPanel titulo="1. Panorama general 2026" lead="Cómo votó Colombia: censo, participación, votos válidos, nulos y no marcados.">
      <Chart id="pres-2026-composicion-votos" embedded={true} />
      <Chart id="pres-2026-participacion-historico" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 2 */}
    <IndicadorPanel titulo="2. Votos por candidato" lead="Distribución total de votos válidos.">
      <Chart id="pres-2026-votos-candidato" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 3 */}
    <IndicadorPanel titulo="3. Mapa por departamento" lead="Color del candidato ganador en cada departamento.">
      <Chart id="pres-2026-mapa-depto-ganador" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 4 */}
    <IndicadorPanel titulo="4. Mapa por municipio" lead="Mismo análisis a granularidad municipal.">
      <Chart id="pres-2026-mapa-mpio-ganador" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 5 */}
    <IndicadorPanel titulo="5. Comparativo 2022 vs 2026 — indicadores generales" lead="Cómo cambió la participación, la abstención y el peso de los bloques entre ciclos.">
      <Chart id="pres-comparativo-2022-2026-bar" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 6 */}
    <IndicadorPanel titulo="6. Bloques ideológicos — 2022 vs 2026" lead="Agrupando candidatos por ideología, ¿hacia dónde se movió el país?">
      <div class="charts-row-2">
        <Chart id="pres-ideologia-2022" embedded={true} />
        <Chart id="pres-ideologia-2026" embedded={true} />
      </div>
      <Chart id="pres-ideologia-comparativo" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 7 */}
    <IndicadorPanel titulo="7. Mapa de variación ideológica 2022→2026" lead="Dónde creció cada bloque y dónde se contrajo.">
      <Chart id="pres-mapa-variacion-depto" embedded={true} />
      <Chart id="pres-mapa-variacion-mpio" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 8 */}
    <IndicadorPanel titulo="8. Distancia a la mayoría presidencial" lead="Cuántos votos le faltaron a cada candidato para llegar al 50% + 1.">
      <Chart id="pres-distancia-mayoria" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 9 */}
    <IndicadorPanel titulo="9. Cómo se reconfiguraron los votos entre vueltas en 2022" lead="De dónde salieron los votos del ganador de la segunda vuelta 2022, y qué nos dice eso de cara a 2026.">
      <Chart id="pres-2v-sankey" embedded={true} />
      <Chart id="pres-2v-mapa-flujo" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 10 */}
    <IndicadorPanel titulo="10. Polarización del país" lead="Índice de polarización 2026 vs 2022 y su distribución territorial.">
      <Chart id="pres-polarizacion-evolucion" embedded={true} />
      <Chart id="pres-polarizacion-mapa" embedded={true} />
    </IndicadorPanel>

    {/* Bloque 11 */}
    <IndicadorPanel titulo="11. Financiación de campañas" lead="Cuánto invirtió cada campaña, qué tan eficiente fue su voto y cuánto recibirá por reposición.">
      <Chart id="pres-financiacion-roi" embedded={true} />
      <Chart id="pres-financiacion-reposicion" embedded={true} />
    </IndicadorPanel>

    <DashboardFooter
      fuentes={[
        { nombre: "Registraduría Nacional del Estado Civil", url: "https://www.registraduria.gov.co/" },
        { nombre: "CNE — Cuentas Claras", url: "https://cuentasclaras.gov.co" },
        { nombre: "DANE — DIVIPOLA", url: "https://www.dane.gov.co/" },
        { nombre: "Cálculo propio", url: "https://github.com/fredericksalazar/fredericksalazar.github.io" },
      ]}
      cobertura={`Última actualización: ${eleccion.metadata.ultima_actualizacion}`}
    />
  </main>

  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
</BaseLayout>

<style>
  .observatorio-container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 2rem; }
  .charts-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) { .charts-row-2 { grid-template-columns: 1fr; } }
</style>
```

**Criterio de aceptación Fase 5**: la página carga, los 11 paneles aparecen con sus headers, los charts se montan (estado `ready` no `error`). Si algún dato falta, el chart muestra estado `pending` con mensaje sin romper el resto.

---

### Fase 6 — Mapas coropléticos (detalle técnico crítico)

Plotly soporta `choroplethmapbox` y `choropleth` con GeoJSON inline o por URL. **Decisión: usar `choroplethmapbox` con `geojson` cargado como URL del propio sitio.**

**Patrón del ChartDef `pres-2026-mapa-depto-ganador`**:

```ts
export const pres2026MapaDeptoGanador: ChartDef = {
  id: "pres-2026-mapa-depto-ganador",
  titulo: "Ganador por departamento — 2026 1ª vuelta",
  pregunta: "¿Quién ganó en cada departamento?",
  fuenteTexto: "Registraduría · GeoJSON departamentos (john-guerra)",
  datasets: ["pres-2026-1v", "pres-candidatos"],
  height: 720,
  ariaLabel: "Mapa coroplético de Colombia con el candidato ganador por departamento",
  async build({ "pres-2026-1v": e, "pres-candidatos": cat }) {
    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json());
    const candidatos = cat!.candidatos["2026-1v"];
    const ideoToColor = (id: IdeologiaBloque) => COLORS.ideologia[id];

    // Mapa código DIVIPOLA → ganador
    const ganadorPorDepto = new Map(e!.agregados.departamentos.map(d => [d.cod_depto, d]));

    const locations: string[] = [];
    const z: number[] = [];     // 0-N índice de ideología para colorscale discreta
    const text: string[] = [];

    const ideoOrder: IdeologiaBloque[] = ["izquierda","centro-izquierda","centro","centro-derecha","derecha","extrema-derecha"];
    const colorscale = ideoOrder.map((id, i) => [i/(ideoOrder.length-1), ideoToColor(id)]);

    for (const feat of geojson.features) {
      const cod = String(feat.properties.DPTO || feat.id);
      const agg = ganadorPorDepto.get(cod);
      if (!agg) continue;
      locations.push(cod);
      z.push(ideoOrder.indexOf(agg.ganador_ideologia));
      const nombreGanador = candidatos.find(c => c.id === agg.ganador_id)?.nombre ?? agg.ganador_id;
      text.push(`<b>${agg.nombre_depto}</b><br>Ganador: ${nombreGanador}<br>Participación: ${(agg.participacion*100).toFixed(1)}%`);
    }

    return {
      traces: [{
        type: "choroplethmapbox",
        geojson,
        locations,
        z,
        featureidkey: "properties.DPTO",  // ajustar según el campo real del GeoJSON
        colorscale,
        zmin: 0,
        zmax: ideoOrder.length - 1,
        showscale: false,
        text,
        hoverinfo: "text",
        marker: { line: { width: 0.5, color: "white" } },
      }],
      layout: baseLayout({
        mapbox: {
          style: "white-bg",
          center: { lat: 4.5, lon: -73.0 },
          zoom: 4.2,
        },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        xaxis: { visible: false },
        yaxis: { visible: false },
      }),
    };
  },
};
```

**Atención**:
1. **`featureidkey`** debe coincidir con la propiedad real del GeoJSON usado. Verificar abriendo el archivo y confirmando si los códigos están en `properties.DPTO`, `properties.cod_depto`, `id`, etc. Documentar esto en el header del archivo `elecciones-presidenciales.ts`.
2. **Leyenda discreta**: como `choroplethmapbox` no admite leyenda categórica nativa, agregar leyenda HTML manual vía `headerHtml` del ChartDef, mostrando los chips de cada bloque ideológico con su color.
3. **Performance del mapa municipal**: el GeoJSON municipal es grande (~3 MB). El chart-def hace `fetch` una vez y cachea en `cache` (compartida vía `data-client.ts`). Considerar **lazy-load**: solo cargar el municipio cuando el bloque 4 entra al viewport (Intersection Observer). Si esto requiere extender `Chart.astro`, documentarlo como tradeoff en el código.

**Criterio de aceptación Fase 6**: los 4 mapas (depto/municipio × 2026 puro / variación) cargan visualmente correctos. Hover muestra tooltip. Performance del mapa municipal aceptable (< 2 s desde click en el panel).

---

### Fase 7 — Bloque 11 (Financiación)

Si los datos de Cuentas Claras no están disponibles aún:
- Renderizar el panel con un `IndicadorPanel` que indique "Datos en proceso de consolidación por el CNE. Se actualizará tan pronto se publique."
- El ChartDef `pres-financiacion-roi` debe leer un JSON que puede tener `candidatos: []`. En ese caso, `build()` devuelve `{ traces: [], layout: baseLayout(), pregunta: "Esperando datos oficiales del CNE." }`.

Cuando los datos estén disponibles, simplemente regenerar el JSON con el pipeline y el chart se llena solo (REGLA 2).

---

### Fase 8 — Página `/elecciones-presidenciales/2022-segunda-vuelta/`

Página standalone para la segunda vuelta 2022. Estructura ligera:
- Hero.
- KPIs: resultado final, participación, abstención.
- 3 charts: votos por candidato, mapa departamento ganador, sankey desde 1ªV.
- Reusa los mismos `ChartDef` (el sankey del bloque 9 ya cubre esto).

---

### Fase 9 — Página `/elecciones-presidenciales/acerca/`

Documenta:
- Fuentes (lista completa con URLs).
- Metodología:
  - Cómo se asignó la ideología a cada candidato.
  - Fórmula exacta del índice de polarización.
  - Cómo se calcularon costo por voto y reposición.
- Limitaciones (datos preconteo vs escrutinio definitivo, candidatos sin foto, etc.).
- Licencia de los datos.

Texto plano + componentes existentes. No necesita charts.

---

## 7. Contrato del JSON (canónico)

Todos los JSONs electorales **deben** cumplir:

```ts
{
  metadata: {
    ultima_actualizacion: string,         // ISO 8601
    fuentes: Record<string, { nombre, url, indicador }>,
    definiciones: Record<string, string | number>,
    cobertura: {
      eleccion: "2026-1v" | "2022-1v" | "2022-2v",
      fecha: string,                      // YYYY-MM-DD de la elección
      total_registros: number,
    },
  },
  // ... payload específico por tipo de dataset (ver §2.1)
}
```

**Validación**: añadir un script `pipeline/elecciones/validar_jsons.py` que verifica con `jsonschema` que cada JSON cumple su contrato antes de copiarlo a `public/data/`.

---

## 8. SEO y JSON-LD

Cada página del módulo incluye `<script type="application/ld+json">` con:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Dataset",
      "name": "Resultados Elecciones Presidenciales Colombia 2026 — 1ª Vuelta",
      "description": "Dataset consolidado de los resultados oficiales de la primera vuelta presidencial de Colombia 2026, agregado por departamento y municipio, con metadata de candidatos.",
      "creator": { "@type": "Person", "name": "Frederick Salazar", "url": "https://fredericksalazar.github.io/" },
      "isBasedOn": [
        { "@type": "CreativeWork", "name": "Registraduría Nacional del Estado Civil", "url": "https://www.registraduria.gov.co/" },
        { "@type": "CreativeWork", "name": "CNE — Cuentas Claras", "url": "https://cuentasclaras.gov.co" }
      ],
      "spatialCoverage": { "@type": "Place", "name": "Colombia" },
      "temporalCoverage": "2026-05-29/2026-05-29",
      "license": "https://creativecommons.org/licenses/by/4.0/"
    },
    {
      "@type": "Article",
      "headline": "Análisis Elecciones Presidenciales Colombia 2026 — 1ª Vuelta",
      "datePublished": "2026-06-XX",
      "author": { "@type": "Person", "name": "Frederick Salazar" },
      "about": [
        { "@type": "Event", "name": "Elecciones Presidenciales Colombia 2026" },
        { "@type": "Place", "name": "Colombia" }
      ]
    }
  ]
}
```

**Keywords objetivo** (para meta description y h1 sin canibalizar contenido del Congreso):
- "elecciones presidenciales colombia 2026 análisis"
- "resultados presidenciales colombia 2026 primera vuelta"
- "mapa votos presidenciales colombia 2026"
- "financiación campañas presidenciales colombia 2026"
- "polarización colombia 2026 vs 2022"

---

## 9. Checklist final de aceptación

Antes de cerrar el módulo, validar punto por punto:

### Datos
- [ ] `python -m pipeline.elecciones.generar_jsons` corre sin error y regenera todos los JSONs.
- [ ] `python -m pipeline.elecciones.validar_jsons` pasa para los 6 JSONs.
- [ ] GeoJSON departamentos < 1 MB; municipios < 3 MB.
- [ ] Cada JSON tiene su `metadata.fuentes` con URL real (no placeholder).

### Frontend
- [ ] `npx astro check` pasa con 0 errores.
- [ ] `npm run build` pasa.
- [ ] `npm run dev` levanta sin warnings.
- [ ] La sidebar muestra "Elecciones" y navega a `/elecciones-presidenciales/2026/`.
- [ ] El sub-nav del módulo cambia de tab activa correctamente entre `2026-1v`, `2022-2v`, `acerca`.
- [ ] Los 11 bloques renderizan en `/elecciones-presidenciales/2026/`. Ningún chart queda en `data-state="error"`.
- [ ] Mapas departamento y municipio cargan visualmente correctos, con hover funcionando.
- [ ] Tooltips muestran nombre del depto/municipio, ganador y participación.
- [ ] Leyenda discreta de ideologías visible sobre cada mapa.

### Arquitectura
- [ ] Cero hex colors sueltos en `chart-defs/elecciones-presidenciales.ts` — todo viene de `COLORS`.
- [ ] Cero `fetch('/data/...')` directos desde `.astro` (solo a través de `data-client.ts`).
- [ ] Editar manualmente un valor en `public/data/data_pres_*.json` se refleja al recargar sin recompilar (REGLA 2).
- [ ] El nuevo entry de `chart-defs/index.ts` no rompe ningún chart anterior del observatorio.

### SEO
- [ ] Cada página del módulo tiene `<title>`, `<meta description>` y JSON-LD propio.
- [ ] La página principal (`/2026/`) está en el sitemap.
- [ ] Páginas opcionales (`2022.astro` mientras esté `disabled`) están en `noindex` o no se generan estáticamente.

### Documentación
- [ ] `pipeline/elecciones/README.md` documenta cómo correr el pipeline.
- [ ] `src/pages/elecciones-presidenciales/acerca.astro` documenta fuentes, metodología y limitaciones.

---

## 10. Notas finales y decisiones que deben confirmarse antes de empezar

1. **Disponibilidad de datos 2026**: la fecha actual del proyecto es **2026-06-01**. La primera vuelta presidencial colombiana suele ser el último domingo de mayo. Confirmar antes de descargar que la Registraduría ya publicó el escrutinio (no solo el pre-conteo). Si solo hay pre-conteo, marcar el dataset con `definiciones.estado = "preconteo"` y mostrarlo en la página como disclaimer.

2. **Catálogo manual de candidatos**: las fotos, partidos, alianzas e **ideología** son curados manualmente por el autor (Frederick). El agente que implemente este plan **no debe inventar** clasificaciones; debe pausar y pedir al autor el archivo `data_pres_candidatos.json` o las fotos faltantes.

3. **Valor de reposición CNE**: debe extraerse de la resolución oficial del CNE para 2026 (PDF). Si esa resolución no se ha publicado, usar el valor 2022 (~$4.064 COP/voto) **claramente etiquetado como "valor 2022 — pendiente actualización"**.

4. **Decisión confirmable**: ¿11 bloques consolidados (recomendado) o 12 bloques tal cual el requerimiento original? **Default: 11.**

5. **Iteración**: este módulo puede crecer (2026 2ªV cuando ocurra, archivo histórico 2018, etc.). La arquitectura propuesta soporta esto sin cambios — solo nuevos JSON + nuevos ChartDefs + nuevas tabs en `EleccionesNav.astro`.

---

**Fin del plan.** Cualquier desviación de este documento debe consultarse antes de implementar.
