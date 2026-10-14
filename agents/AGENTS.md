# Guía para agentes de IA · fredericksalazar.github.io

Este archivo aplica a cualquier agente de IA, sin importar el proveedor. Léelo
completo antes de proponer o hacer cualquier cambio. Es un índice: el detalle
vive en los documentos que enlaza.

## 1. Qué leer y en qué orden

| # | Documento | Qué define |
|---|---|---|
| 1 | `.specify/memory/constitution.md` | Principios no negociables *(pendiente de redactar)* |
| 2 | `agents/PRODUCT.md` | Por qué existe el sitio: objetivos, audiencias, pilares, KPIs, reglas PRD |
| 3 | `agents/ARCHITECTURE.md` | Cómo está construido: stack, módulos, datos, reglas ARQ |
| 4 | `agents/DESIGN-SYSTEM.md` | Cómo se ve: tokens, hero, Observatorio, gráficos, componentes, reglas UI |
| 5 | Documento del módulo | Por ejemplo `src/lib/observatorio/ARCHITECTURE.md` (obligatorio para el Observatorio) |

Si dos documentos se contradicen, manda el que aparece primero. No resuelvas la
contradicción por tu cuenta: avísale al autor.

**Lectura mínima según la tarea:**

| Tarea | Lee además de este archivo |
|---|---|
| Contenido del blog | PRODUCT (contenido, SEO, tono) |
| Interfaz, páginas o componentes | DESIGN-SYSTEM y ARCHITECTURE |
| Gráficos o datos del Observatorio | DESIGN-SYSTEM (gráficos), ARCHITECTURE y el documento del Observatorio |
| Pipelines de datos | ARCHITECTURE (capa de datos) |
| Nueva funcionalidad | Todos, en orden |

## 2. Comandos

- `npm run dev` — servidor local (Node >=22.12)
- `npm run build` — build + verificador de enlaces internos
- `npx astro check` — verificación de tipos
- `pytest ingestion/tests/` — tests del pipeline del Observatorio
- `python -m ingestion.main` — pipeline de ingesta

## 3. Reglas operativas

- **Git es del autor.** No crees ramas, commits, merges ni push.
- **No inventes nada.** Ni datos (toda cifra viene de un pipeline y vive en
  `public/data/*.json`) ni información del autor. Si algo no existe, el trabajo
  queda bloqueado: avísalo.
- **Reutiliza antes de crear** (ARQ-19): busca en el catálogo de componentes de
  DESIGN-SYSTEM y en los `ChartDef` existentes. Un gráfico se reutiliza con
  `<Chart id="…">`, nunca se copia.
- **Pregunta el color** antes de crear un gráfico: ofrece el azul de marca por
  defecto y la paleta categórica de DESIGN-SYSTEM.
- **Enlaces internos** solo con `src/lib/urls.ts`.
- **Idioma:** español (es-CO) en UI, contenido y documentación.
- **Ante la duda, pregunta** antes de romper una regla.

## 4. Flujo de trabajo (Spec-Driven Development)

Todo cambio que no sea trivial sigue el ciclo de Spec Kit, cuyas skills se
llaman así:

`speckit-specify` → `speckit-clarify` → `speckit-plan` → `speckit-tasks`
→ `speckit-analyze` → `speckit-implement` → `speckit-converge`

- Las specs viven en `specs/NNN-nombre/`.
- Toda spec declara a qué objetivo o pilar y a qué KPI de PRODUCT contribuye.
- El plan verifica las reglas ARQ y UI; una excepción se justifica y la aprueba
  el autor.
- **Trivial** = corrección de texto, de un dato con fuente o de un estilo puntual,
  sin cambiar comportamiento ni estructura. Lo trivial no requiere spec.

## 5. Antes de dar una tarea por terminada

1. `npx astro check` sin errores nuevos.
2. `npm run build` exitoso.
3. Si tocaste el pipeline: `pytest ingestion/tests/`.
4. Si tocaste interfaz: revisión visual con `npm run dev`.
5. Si cambiaste algo descrito en `agents/`, actualiza ese documento.
6. Informa al autor qué cambió, qué verificaste y qué quedó pendiente, sin
   maquillar los fallos.
