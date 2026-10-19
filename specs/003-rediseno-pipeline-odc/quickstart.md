# Quickstart: Validación y Ejecución de `odc-data-pipeline`

**Feature**: `specs/003-rediseno-pipeline-odc` | **Date**: 2026-10-17

Esta guía describe cómo levantar el entorno local de `odc-data-pipeline`, ejecutar las ingestas y procesamientos de forma modular y validar la paridad de los contratos JSON con el sitio web `fredericksalazar.github.io`.

---

## 1. Configuración del Entorno Local (`odc-data-pipeline`)

Desde el directorio de trabajo del nuevo repositorio:

```bash
cd /Users/frederick/GitHub/odc-data-pipeline

# 1. Crear entorno virtual Python 3.12 (o >=3.11)
python3.12 -m venv .venv
source .venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt
```

---

## 2. Comandos de Ejecución Modular

### 2.1 Ingesta por Fuente y Dataset

Cada script permite consultar fuentes individuales o datasets puntuales:

```bash
# Ingesta BanRep (tasa de interés y TRM)
python -m pipeline.ingesta.banrep_ingesta --dataset tasas_interes
python -m pipeline.ingesta.banrep_ingesta --dataset trm

# Ingesta Banco Mundial (18 indicadores con wbgapi)
python -m pipeline.ingesta.world_bank_ingesta

# Ingesta DANE (boletines mensuales)
python -m pipeline.ingesta.dane_ingesta --dataset ipc
python -m pipeline.ingesta.dane_ingesta --dataset empleo
python -m pipeline.ingesta.dane_ingesta --dataset comercio

# Ingesta DANE (microdatos GEIH - flujo optimizado)
python -m pipeline.ingesta.dane_ingesta --dataset geih_ocupados

# Ingesta Wikipedia (Salario mínimo y Elecciones)
python -m pipeline.ingesta.wikipedia_ingesta --dataset salario_minimo
python -m pipeline.ingesta.wikipedia_ingesta --dataset elecciones
```

### 2.2 Procesamiento e Integración

Generación de tablas maestras y contratos del Observatorio:

```bash
# Construir tablas maestras (global multi-país, colombia anual y mensual)
python -m pipeline.processing.build_master_tables

# Generar contratos JSON individuales
python -m pipeline.processing.build_inflacion
python -m pipeline.processing.build_empleo
python -m pipeline.processing.build_pib
python -m pipeline.processing.build_comercio
python -m pipeline.processing.build_externo
python -m pipeline.processing.build_demografia
python -m pipeline.processing.build_comparativo
python -m pipeline.processing.build_salario_minimo
python -m pipeline.processing.build_ingresos
python -m pipeline.processing.build_elecciones

# O ejecutar el orquestador unificado
python -m pipeline.main
```

---

## 3. Suite de Pruebas y Validación de Contratos

```bash
# Ejecutar tests de ingesta, procesamiento y validación de JSON
pytest tests/ -v
```

Las pruebas validan automáticamente:
1. Parseo sin errores de `config/data-sources.yaml`.
2. Orden estrictamente descendente en todas las series temporales (`serie[0].periodo > serie[1].periodo`).
3. Ausencia total de `NaN`, `0.0` artificiales o `-100.0` espurios en campos sin dato (REGLA 7).
4. Coherencia de los deltas y variaciones con las frecuencias correspondientes.
5. Validación contra guardas de no regresión (ARQ-18).

---

## 4. Validación de Integración con el Repositorio Web (`fredericksalazar.github.io`)

Una vez generados los JSON en `odc-data-pipeline/data/processed/observatorio/`:

```bash
# 1. Sincronizar los JSON al repositorio web (simulando el step de GitHub Actions)
cp -r /Users/frederick/GitHub/odc-data-pipeline/data/processed/observatorio/*.json /Users/frederick/GitHub/fredericksalazar.github.io/public/data/

# 2. En el repositorio web, verificar que Astro compile con 0 errores
cd /Users/frederick/GitHub/fredericksalazar.github.io
npx astro check
npm run build

# 3. Revisión visual local
npm run dev
# Abrir http://localhost:4321/observatorio/, /observatorio/empleo/, /calculadoras/cuanto-ganas/, etc.
```
