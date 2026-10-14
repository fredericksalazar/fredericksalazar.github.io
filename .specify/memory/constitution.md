<!--
SYNC IMPACT REPORT (temporal: revisar y borrar antes del commit)
- Cambio de versión: plantilla sin ratificar → 1.0.0 (ratificación inicial)
- Principios definidos (antes eran marcadores de plantilla):
  [PRINCIPLE_1_NAME] → I. Valor de producto
  [PRINCIPLE_2_NAME] → II. Integridad de datos y del autor
  [PRINCIPLE_3_NAME] → III. Reutilización ante todo
  [PRINCIPLE_4_NAME] → IV. Consistencia visual
  [PRINCIPLE_5_NAME] → V. Estático, indexable y accesible
  (nuevo)            → VI. Trabajo con IA según AI Fluency
- Secciones agregadas: Restricciones técnicas; Flujo de desarrollo y quality gates
  (incluye la lista de verificación "Constitution Check"); Gobernanza completa.
- Secciones eliminadas: ninguna.
- Plantillas revisadas:
  ✅ .specify/templates/plan-template.md: su sección "Constitution Check" lee las
     compuertas de este archivo; compatible sin cambios.
  ✅ .specify/templates/spec-template.md: compatible; el requisito de declarar
     objetivo/pilar/KPI se aplica desde el principio I.
  ✅ .specify/templates/tasks-template.md: compatible; la definición de terminado
     se aplica desde el principio VI.
  ⚠ Pendiente opcional: personalizar spec-template.md con campos fijos de
     objetivo/pilar/KPI y módulos afectados (no requerido para cumplir).
- TODOs diferidos: ninguno.
-->

# Constitución de fredericksalazar.github.io

Sitio de marca personal de Frederick Salazar que integra CV digital, proyectos, el
Observatorio de Datos de Colombia y un blog. Persigue dos objetivos encadenados:
**autoridad** (ser reconocido entre los 20 ingenieros y científicos de datos más
importantes de Colombia) y **monetización** (convertir esa autoridad en clientes de
consultoría).

Esta constitución no repite el detalle técnico ni de producto: lo vuelve
**vinculante**. El detalle vive en:

- `agents/PRODUCT.md`: objetivos, audiencias, pilares, KPIs y reglas `PRD-NN`.
- `agents/ARCHITECTURE.md`: stack, módulos, capa de datos y reglas `ARQ-NN`.
- `agents/DESIGN-SYSTEM.md`: tokens, layout, hero, gráficos, componentes y reglas `UI-NN`.
- `src/lib/observatorio/ARCHITECTURE.md`: reglas del módulo Observatorio.
- `agents/AGENTS.md`: guía operativa para agentes de IA.

Las palabras **DEBE**, **NO DEBE** y **PUEDE** tienen sentido normativo.

## Core Principles

### I. Valor de producto

- Toda feature (spec) DEBE declarar a qué **objetivo** (autoridad o monetización),
  **pilar** (CV y servicios, proyectos, Observatorio, blog) y **KPI** de
  `agents/PRODUCT.md` contribuye. Una feature que no contribuye a ninguno NO DEBE
  construirse.
- Toda página DEBE ofrecer un siguiente paso en el embudo atraer → demostrar →
  convertir y dejar claro quién es el autor.
- Se elige siempre la solución más simple que cumple el objetivo; una
  funcionalidad sin objetivo ni KPI se rechaza aunque sea fácil de hacer.

**Razón:** el sitio es un producto con un fin medible. Sin este filtro el esfuerzo
se dispersa en funcionalidades que no posicionan ni generan clientes.

### II. Integridad de datos y del autor

- NO DEBE inventarse nada: ni cifras, ni series, ni empresas, cargos,
  certificaciones, casos de clientes o logros del autor.
- Todo dato cuantitativo DEBE nacer en un pipeline y publicarse en
  `public/data/*.json`; NO DEBE escribirse a mano en `.astro` o `.ts`.
- Todo dato publicado DEBE mostrar su fuente oficial, su fecha de corte y, cuando
  aplique, su metodología.
- Un pipeline NO DEBE reemplazar un dataset publicado por uno más pobre (ARQ-18).
- El contenido electoral DEBE ser políticamente neutral, y el interés comercial
  NO DEBE alterar datos, análisis ni conclusiones.
- Si un dato o una información no existe, el trabajo DEBE detenerse y avisarse al
  autor; no se rellena con supuestos.

**Razón:** la credibilidad es lo que el sitio vende. Un solo dato falso o un logro
inflado destruye la autoridad que sostiene ambos objetivos.

### III. Reutilización ante todo

- Cada pieza (dato, cálculo, gráfico, componente, estilo) DEBE definirse una sola
  vez y reutilizarse por referencia (ARQ-19).
- Antes de crear algo DEBE buscarse en el catálogo de componentes de
  `agents/DESIGN-SYSTEM.md` y en los `ChartDef` registrados.
- Un gráfico DEBE publicarse con `<Chart id="…">` en cualquier página o post y NO
  DEBE copiarse su definición.
- Si dos piezas solo difieren en parámetros, DEBE crearse una fábrica
  (patrón `makeComparativoSet`).
- Se abstrae a partir de la segunda repetición con la misma razón de cambio; no se
  crean abstracciones especulativas.

**Razón:** un sitio de un solo autor solo escala si cada mejora se hace una vez y
se propaga a todas partes.

### IV. Consistencia visual

- Toda interfaz DEBE cumplir las reglas `UI-NN` de `agents/DESIGN-SYSTEM.md`.
- Identidad fija: fondo blanco, azul de marca `#2563eb`, tipografía única Google
  Sans Flex y solo los tokens definidos (sin valores sueltos).
- Toda página de sección DEBE usar el componente `Hero` con subtítulo y tags
  propios; el Observatorio y las calculadoras usan `MapaColombia` como visual.
- Todo gráfico DEBE ir en card; todo gráfico de línea DEBE tener el toggle
  Línea ↔ Barras; las etiquetas de líneas de referencia DEBEN ir a la izquierda.
- Antes de crear un gráfico, el agente DEBE preguntar al autor qué color asignar,
  ofreciendo el azul de marca y la paleta categórica.

**Razón:** una identidad visual consistente es parte de la marca y transmite el
rigor de un ingeniero de datos.

### V. Estático, indexable y accesible

- El sitio DEBE seguir siendo estático (SSG en GitHub Pages): sin backend, base de
  datos ni secretos en el cliente (ARQ-01).
- El contenido de valor (textos, KPIs, metadatos, JSON-LD) DEBE estar en el HTML
  inicial; lo interactivo es una mejora, no un requisito.
- El SEO DEBE centralizarse en `lib/seo.ts`, `SEOHead` y `lib/urls.ts` (ARQ-03,
  ARQ-04).
- Toda página DEBE cumplir la accesibilidad mínima (un solo `h1`, foco visible,
  `aria-label` en gráficos y controles, respeto a `prefers-reduced-motion`).
- Solo se cargan los scripts de terceros listados en `agents/ARCHITECTURE.md`.

**Razón:** buscadores y asistentes de IA son el principal canal de adquisición;
un sitio estático, rápido e indexable maximiza el alcance con costo cero.

### VI. Trabajo con IA según AI Fluency

El trabajo con agentes de IA sigue las cuatro competencias del marco AI Fluency:

- **Delegación.** El autor decide objetivos, reglas, colores, el contenido que se
  publica y las excepciones a esta constitución, y administra git. El agente
  propone, implementa y verifica; NO DEBE crear ramas, commits, merges ni push.
- **Descripción.** Todo trabajo no trivial DEBE partir de una spec de Spec Kit y
  de los documentos de `agents/`. Es **trivial** una corrección de texto, de un
  dato con fuente o de un estilo puntual que no cambia comportamiento ni
  estructura; lo trivial no requiere spec.
- **Discernimiento.** Una tarea solo está terminada si pasa: `npx astro check` sin
  errores nuevos, `npm run build` exitoso, `pytest ingestion/tests/` si se tocó el
  pipeline, revisión visual si se tocó interfaz, y documentos de `agents/`
  actualizados si cambió algo descrito en ellos. Los fallos DEBEN reportarse tal
  como son.
- **Diligencia.** El autor revisa y responde por todo lo que se publica. Los
  cambios DEBEN ser trazables (spec → plan → tareas → código) y el agente DEBE
  informar qué cambió, qué verificó y qué quedó pendiente.

**Razón:** la IA acelera el trabajo, pero la marca es del autor; la
responsabilidad y la última palabra no se delegan.

## Restricciones técnicas

- **Stack:** Astro (SSG) + TypeScript estricto + MDX, Plotly por CDN para
  gráficos, pipelines en Python 3.12, hosting y CI en GitHub Pages y GitHub
  Actions. Versiones y detalle en `agents/ARCHITECTURE.md`.
- **Dependencias:** toda dependencia nueva (npm, pip o CDN) o subida de versión
  mayor DEBE pasar por una spec con justificación (ARQ-12); primero se prefiere la
  plataforma (CSS y Web APIs).
- **Datos:** el contrato de los JSON del Observatorio se define en
  `src/lib/observatorio/ARCHITECTURE.md`; cambiarlo requiere spec.
- **Idioma:** español de Colombia (es-CO) en interfaz, contenido y documentación.
- **Agentes:** la guía para agentes vive en `agents/` y `.specify/`, sin depender
  de un proveedor. `CLAUDE.md` es solo un puntero (ARQ-13).

## Flujo de desarrollo y quality gates

**Ciclo obligatorio para trabajo no trivial** (skills de Spec Kit):

`speckit-specify` → `speckit-clarify` → `speckit-plan` → `speckit-tasks`
→ `speckit-analyze` → `speckit-implement` → `speckit-converge`

- Las specs viven en `specs/NNN-nombre/`.
- `speckit-clarify` y `speckit-analyze` son obligatorios cuando la spec toca más de
  un módulo o cambia datos publicados.

**Constitution Check** (compuerta de `speckit-plan`, antes y después del diseño).
Cada plan DEBE responder sí a todo:

| # | Compuerta | Principio |
|---|---|---|
| G1 | ¿La spec declara objetivo, pilar y KPI de `PRODUCT.md`? | I |
| G2 | ¿Todo dato nuevo viene de un pipeline y muestra fuente y fecha? ¿Nada inventado? | II |
| G3 | ¿Se reutilizó lo existente (componentes, `ChartDef`, fábricas) en vez de duplicar? | III |
| G4 | ¿La interfaz cumple las reglas `UI-NN` (tokens, hero, card, toggle, etiquetas, color consultado)? | IV |
| G5 | ¿Sigue siendo estático, con el contenido de valor en el HTML y accesible? | V |
| G6 | ¿Se respetan las reglas `ARQ-NN` y no hay dependencias nuevas sin justificar? | V, Restricciones |
| G7 | ¿Las tareas incluyen la definición de terminado y la actualización de `agents/`? | VI |

**Excepciones:** una violación solo se acepta si se registra en la sección
*Complexity Tracking* del `plan.md` con su justificación y la alternativa más
simple descartada, y el autor la aprueba explícitamente.

## Governance

- **Supremacía y precedencia:** esta constitución prevalece sobre cualquier otra
  práctica. Ante contradicciones, el orden es: constitución → `agents/PRODUCT.md`
  → `agents/ARCHITECTURE.md` → `agents/DESIGN-SYSTEM.md` → documentos de módulo.
  El documento de menor rango se corrige; nadie resuelve la contradicción por su
  cuenta.
- **Enmiendas:** solo el autor enmienda esta constitución, usando la skill
  `speckit-constitution`. Cada enmienda registra el cambio de versión y la fecha.
- **Versionado semántico:** MAJOR si se elimina o redefine un principio o una
  regla de gobernanza; MINOR si se agrega un principio o sección o se amplía
  materialmente; PATCH si se aclara la redacción.
- **Revisión de cumplimiento:** `speckit-plan` aplica el Constitution Check;
  `speckit-analyze` y `speckit-converge` verifican la coherencia entre spec, plan,
  tareas, código y esta constitución.
- **Documentos vivos:** todo cambio que afecte algo descrito en `agents/` DEBE
  actualizar ese documento en la misma feature.
- **Guía operativa:** `agents/AGENTS.md` traduce esta constitución a instrucciones
  diarias para cualquier agente de IA.

**Version**: 1.0.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-14
