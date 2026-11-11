# Implementation Plan: Rediseño de los indicadores clave del Observatorio

**Branch**: `008-rediseno-kpis-observatorio` *(nombre de referencia; el autor maneja git)* | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-rediseno-kpis-observatorio/spec.md`

**Note**: Este plan se ejecuta con `speckit-plan`; su definición describe el flujo de trabajo.

## Summary

Rediseñar las 8 tarjetas del panel "Cómo va Colombia" de `/observatorio/` para que
el gráfico sea el cuerpo de la tarjeta (150 px, ancho completo, forma propia por
indicador, referencia dibujada), con tres niveles de información (dato → contexto
→ detalle), dos filas por ritmo de publicación (mensual y anual) con eje de tiempo
compartido y lectura sincronizada por fila con cursor, toque o teclado.

**Enfoque técnico (decisión central, ver `research.md` R1):** los gráficos siguen
siendo `ChartDef` renderizados con Plotly y publicados con `<Chart id>`, de modo que
se **respetan** ARQ-07, ARQ-19, REGLA 2 y el principio III de la constitución sin
nuevas excepciones de arquitectura. Cambian de miniatura de 48 px a gráfico de
150 px por indicador, con una fábrica nueva que elige la forma. La lectura
sincronizada es una capa de interacción propia (módulo cliente pequeño) montada
sobre cada gráfico, que no depende de los eventos de Plotly. La tarjeta, el detalle
(`<details>` nativo) y todas las cifras siguen renderizándose en build. No hay
dependencias ni datos nuevos.

La alternativa "SVG generado en build" se evaluó y se descarta como base del plan
(la spec 005 ya la había rechazado por violar la REGLA 2); queda documentada como
opción que solo el autor puede aprobar.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto · Astro 6.4.8 · Node.js >= 22.12

**Primary Dependencies**: Astro, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`,
Plotly.js 2.35.2 `basic` por CDN (ya cargado en la portada por los sparklines).
**Sin dependencias nuevas.**

**Storage**: N/A. Las cifras salen de `public/data/*.json` (leídas en build por
`data.ts` para el texto de la tarjeta y en el cliente por `data-client.ts` para los
gráficos, con la caché compartida existente). Ningún dataset cambia.

**Testing**: `npx astro check` (tipos), `npm run build` (incluye el verificador de
enlaces internos) y verificación en navegador con `npm run dev` según
[`quickstart.md`](./quickstart.md): auditoría de contraste, comparación de cifras
contra los JSON, recorrido con teclado, anchos 1440 / 768 / 375 px y ambos temas. El
proyecto no tiene framework de pruebas unitarias ni visuales y no se agrega uno.

**Target Platform**: sitio SSG multipágina en GitHub Pages; navegadores modernos con
CSS custom properties, Pointer Events y `<details>` nativo. Sin JavaScript el panel conserva todas las cifras, cambios,
fuentes y el detalle; solo faltan el gráfico y la lectura (spec FR-020).

**Project Type**: sitio web estático (Astro SSG), sin backend ni islas de framework.

**Performance Goals**: la portada no debe percibirse más lenta que hoy (SC-010):
mismo número de instancias de Plotly (8, `staticPlot`), mismo bundle `basic`, una
sola descarga por dataset gracias a la caché de `loadDatasets`. Sin cambios de
layout al montar el gráfico (altura reservada de 150 px).

**Constraints**: estático y sin secretos (ARQ-01); cifras solo desde los JSON
(ARQ-02); contenido de valor en el HTML inicial (PRD-03); contraste AA en ambos
temas; solo tokens (UI-01, UI-13); scripts idempotentes y compatibles con View
Transitions (ARQ-08); el modo claro del resto de la portada no cambia.

**Scale/Scope**: 8 indicadores, 2 filas, 1 página. Archivos tocados: 1 componente
reescrito, 1 componente nuevo, 1 ChartDef nuevo (reemplaza a `sparkline.ts`), 1
módulo cliente nuevo, y ajustes menores en `home.ts`, `derivations.ts`,
`charts.ts`, `theme-colors.ts`, `Chart.astro`, `BaseLayout.astro`, `index.astro` y
tres documentos de `agents/` y del módulo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Compuerta | Resultado | Evidencia / nota |
| --- | --- | --- | --- |
| G1 | ¿La spec declara objetivo, pilar y KPI de `PRODUCT.md`? | **Pass** | `spec.md` → Contexto de producto: autoridad; P3; K5, K4, K6 (K3 indirecto). |
| G2 | ¿Todo dato nuevo viene de un pipeline y muestra fuente y fecha? ¿Nada inventado? | **Pass** | No hay datos nuevos (FR-019, SC-010). Fuente corta y periodo siempre visibles; fuente oficial y fecha de corte en el detalle. El catálogo solo añade metadata de presentación (`forma`, `desdeCero`), no cifras. |
| G3 | ¿Se reutilizó lo existente en vez de duplicar? | **Pass** | Se reutilizan `Chart.astro`, `baseLayout()`, `lineasReferencia()`, `META_BANREP`, `RANGO_META_BANREP`, `COLORS`, `chartTheme()`, `valoresNoNulos()`, `referenciaIndicador()`, la caché de `loadDatasets` y el patrón de fábrica de `makeSparkline`. Único componente nuevo: `FilaIndicadoresClave` (se usa dos veces: fila mensual y anual), que se agrega al catálogo (UI-11). |
| G4 | ¿La interfaz cumple las reglas `UI-NN`? | **Pass con excepciones** | Tokens, hero y menú sin cambios; color consultado al autor (spec, sesión 2026-11-10: azul de marca, banda meta verde, azul claro en oscuro; maqueta aprobada para el resto). Cuatro excepciones se registran en *Complexity Tracking*: UI-08 y UI-07 (reformulación de las de la spec 005), la serie en azul claro en oscuro y la banda meta en verde. |
| G5 | ¿Sigue siendo estático, con el contenido de valor en el HTML y accesible? | **Pass** | Cifras, cambios, fuentes y detalle en build; `<details>` funciona sin JS; gráfico y lectura son mejora. Gráfico con `role="img"` y descripción; zona de lectura como `slider` operable con teclado. |
| G6 | ¿Se respetan las reglas `ARQ-NN` y no hay dependencias nuevas sin justificar? | **Pass** | Cero dependencias. ARQ-02, ARQ-07, ARQ-08, ARQ-15, ARQ-16 y ARQ-19 se cumplen (R1, R4). |
| G7 | ¿Las tareas incluyen la definición de terminado y la actualización de `agents/`? | **Pass** | Ver *Definition of Done* y *Documentos vivos*; `speckit-tasks` debe incluir ambos. |

**Resultado:** las 7 compuertas pasan. Las desviaciones están acotadas a diseño
(UI-07, UI-08, color de serie, banda meta verde) y requieren la aprobación
explícita del autor (*Complexity Tracking*).

## Project Structure

### Documentation (this feature)

```text
specs/008-rediseno-kpis-observatorio/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y alternativas
├── data-model.md        # Fase 1: entidades, derivaciones y estados
├── quickstart.md        # Fase 1: guía de validación end-to-end
├── contracts/
│   └── kpi-card-contract.md   # Fase 1: contrato de DOM, ARIA, teclado, ChartDef y módulo de lectura
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (lo crea speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/observatorio/
│   ├── IndicadorClaveCard.astro      # REESCRIBIR: tres niveles, nombre-enlace, <details>, zona de lectura
│   ├── FilaIndicadoresClave.astro    # NUEVO: título de fila, ventana del eje, grilla 4/2/1
│   └── Chart.astro                   # variante "sparkline" → "kpi" (150 px, sin card, sin título propio)
├── lib/observatorio/
│   ├── home.ts                       # + FormaGrafico, `forma`/`desdeCero` por indicador, nombreCortoFuente(),
│   │                                 #   agrupación por periodicidad; retirar GRUPOS/`grupo` si queda sin uso
│   ├── derivations.ts                # + ejeCompartido(), lecturaEnPeriodo() (funciones puras, REGLA 10)
│   ├── charts.ts                     # + COLORS.serie (lee el token del tema)
│   ├── theme-colors.ts               # + `serie` y `superficie` en chartTheme()
│   ├── kpi-lectura.ts                # NUEVO: controlador cliente de lectura sincronizada por fila
│   └── chart-defs/
│       ├── indicadores-clave.ts      # NUEVO: makeIndicadorClaveChart() (reemplaza sparkline.ts)
│       ├── sparkline.ts              # ELIMINAR (único consumidor: la tarjeta)
│       └── index.ts                  # registrar `kpi-*` en lugar de `spark-*`
├── layouts/BaseLayout.astro          # + token --color-chart-serie (claro, oscuro y sin-JS)
└── pages/observatorio/index.astro    # dos filas, sin índice 01–08; limpiar estilos del panel

agents/DESIGN-SYSTEM.md               # sección 5.5, catálogo, UI-07/UI-08 y excepción de color (2.9)
agents/ARCHITECTURE.md                # solo si cambia lo descrito (módulos, ARQ)
src/lib/observatorio/ARCHITECTURE.md  # árbol de archivos: kpi-lectura.ts, indicadores-clave.ts
```

**Structure Decision:** se mantiene la estructura de Astro. Se añaden 3 archivos
(`FilaIndicadoresClave.astro`, `kpi-lectura.ts`, `indicadores-clave.ts`) y se elimina
1 (`sparkline.ts`). No hay carpetas ni proyectos nuevos.

## Complexity Tracking

> **Aprobadas por el autor el 2026-11-10**, junto con la técnica de dibujo con
> Plotly (research R1); la alternativa de SVG en build queda descartada.
>
> Excepciones que requieren **aprobación explícita del autor** (constitución,
> *Quality gates*). Las dos primeras reformulan excepciones ya aprobadas en la
> spec 005; las dos últimas ya se acordaron en la spec 008 y aquí se registran
> formalmente.

| Violación | Por qué es necesaria | Alternativa más simple rechazada |
| --- | --- | --- |
| **UI-08**: los gráficos de línea `kpi-*` no llevan el interruptor "Ver en barras". La excepción de la spec 005 se justificaba por "48 px, sin ejes, estáticas"; eso deja de ser cierto. Nueva justificación: cada indicador tiene asignada su forma de gráfico y el interruptor vive en el dashboard de dominio al que enlaza la tarjeta. | Un interruptor por tarjeta añade 8 controles al componente que esta feature despeja y contradice SC-001 (≤ 5 textos por tarjeta) y la historia 1. | Poner el interruptor en las 8 tarjetas: más ruido y un segundo modo de lectura que rompe la lectura sincronizada por fila. |
| **UI-07**: el gráfico vive dentro de la tarjeta del indicador y no en un `ChartContainer` propio. Se reformula la excepción de la spec 005 de "sparklines `spark-*`" a "gráficos `kpi-*`". | La tarjeta ya es la card y aporta título, fuente y detalle; envolver el gráfico en otra card anida cards, lo que prohíbe FR-005. | Usar `ChartContainer`: duplicaría título y fuente y anidaría una card dentro de otra. |
| **Color de serie (DESIGN-SYSTEM 2.9)**: la serie usa `#3b82f6` en tema oscuro en lugar de `#2563eb`, contra la regla "los colores de series no cambian con el tema". Acotada al azul de marca y, en este plan, a los gráficos `kpi-*`. | Con `#2563eb` el contraste sobre la tarjeta oscura ronda 3:1 y la serie se apaga. Decidido por el autor en la spec (FR-014). | Mantener `#2563eb`: contraste insuficiente para el elemento principal de la tarjeta. |
| **Banda meta en verde (DESIGN-SYSTEM 5.5 y spec 005, FR-006/FR-007)**: la sección 5.5 dice que la referencia va "en gris neutro; nunca rojo/verde". La banda del rango meta se dibuja en el verde de meta del sistema (`COLORS.metaBanda`, `META_BANREP`). | Decidido por el autor en la spec (FR-013): es la misma zona oficial que ya muestra el dashboard de inflación. La línea del dato no cambia de color y no hay etiquetas de juicio (FR-026). | Banda en gris (la propuesta inicial): descartada por el autor. |

**Decisión que NO es una violación pero merece revisión del autor:** la tarjeta deja
de ser un "enlace estirado" (hoy toda la tarjeta navega al dashboard); pasa a serlo
solo el nombre, porque la zona del gráfico es interactiva. Puede afectar los clics
del evento `home_indicador_click` (K4). Ver *Risks*.

## Phase 0: Outline & Research

**Output**: [`research.md`](./research.md)

Decisiones (detalle y alternativas en `research.md`):

1. **R1 · Técnica de dibujo:** `ChartDef` + Plotly estático por indicador, publicado
   con `<Chart id variant="kpi">`; descartados SVG en build y SVG en cliente.
2. **R2 · Eje compartido:** función pura que une las ventanas de la fila y se usa
   igual en build (título de fila) y en cliente (gráficos).
3. **R3 · Forma por indicador:** mapeo a trazas y formas de Plotly, reutilizando
   `lineasReferencia()` y el patrón de banda de `inflacion.ts`.
4. **R4 · Lectura sincronizada:** capa propia con mapeo píxel → periodo por
   geometría explícita (márgenes y rangos fijos), estados y teclado.
5. **R5 · Detalle:** `<details>`/`<summary>` nativo.
6. **R6 · Tokens y color:** `--color-chart-serie`; banda verde y referencias grises
   ya existen.
7. **R7 · Analítica y navegación:** `data-ga-*` pasa al nombre-enlace.
8. **R8 · Migración y retiro:** `sparkline.ts`, `spark-*`, `GRUPOS`.
9. **R9 · Responsive, movimiento y tema.**
10. **R10 · Rendimiento.**

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` completo.

**Outputs**:

- [`data-model.md`](./data-model.md): extensiones del catálogo, forma y referencia
  por indicador, fila y eje compartido, geometría del gráfico, estado de la lectura
  y reglas de formato.
- [`contracts/kpi-card-contract.md`](./contracts/kpi-card-contract.md): estructura
  de DOM y ARIA de la tarjeta y de la fila, atributos `data-*`, mapa de teclado,
  contrato del `ChartDef` (`kpi-*`) y API del módulo `kpi-lectura`.
- [`quickstart.md`](./quickstart.md): matriz de validación manual y comandos.

## Post-Design Constitution Check

*Re-evaluación tras el diseño de Fase 1.*

| # | Compuerta | Resultado | Nota post-diseño |
| --- | --- | --- | --- |
| G1 | Objetivo, pilar y KPI | **Pass** | Sin cambios. |
| G2 | Datos con fuente, nada inventado | **Pass** | El diseño no introduce cifras: los rótulos de referencia se calculan con `referenciaIndicador()` y las series salen de los datasets. |
| G3 | Reutilización | **Pass** | `makeIndicadorClaveChart` es la evolución de la fábrica `makeSparkline`, no una copia; `FilaIndicadoresClave` evita duplicar la fila. |
| G4 | Reglas UI | **Pass con excepciones** | Las cuatro de *Complexity Tracking*; pendientes de aprobación. |
| G5 | Estático, indexable, accesible | **Pass** | El contrato fija el HTML inicial, el `slider` accesible, el foco visible y `prefers-reduced-motion`. |
| G6 | ARQ y dependencias | **Pass** | Sin dependencias; ningún dato en el HTML fuera de las cifras ya permitidas por REGLA 3. |
| G7 | DoD y documentos vivos | **Pass** | Definidos abajo. |

## Risks & Mitigations

| Riesgo | Mitigación |
| --- | --- |
| La capa de lectura mapea píxel → periodo y debe coincidir con el área de dibujo de Plotly. | Márgenes y rangos de ejes explícitos en el `ChartDef` (no se usan APIs internas de Plotly); `quickstart.md` verifica que el cursor cae sobre el punto correspondiente en las 8 tarjetas y en ambos temas. |
| Las etiquetas de referencia (anotaciones de Plotly) no replican la tipografía de la maqueta (sin halo de texto) y pueden chocar con la serie. | Se reutiliza `lineasReferencia()`, que ya combina etiquetas cercanas y las ubica a la izquierda (UI-10); revisión visual en ambos temas y a 375 px. |
| La tarjeta deja de ser un enlace estirado: puede bajar el CTR del evento `home_indicador_click` (K4). | El nombre sigue siendo un enlace con destino accesible y conserva los atributos `data-ga-*`; se compara el evento antes y después de publicar. Si cae, se evalúa un enlace estirado que excluya la zona del gráfico. |
| `<details>` se ve distinto entre navegadores (marcador del `summary`). | Se oculta el marcador nativo y se dibuja un ícono propio con tokens; prueba en Chromium, Firefox y Safari. |
| Cada gráfico necesita el eje de toda la fila y por tanto los datasets de la fila. | Los `datasets` del def incluyen los de la fila; `loadDatasets` deduplica, y `quickstart.md` verifica en la pestaña de red que no hay descargas repetidas. |
| Re-render por cambio de tema vuelve a ejecutar `onMount` y duplicaría listeners. | El registro de lectura es idempotente por id de gráfico (ARQ-08); el estado de lectura se reinicia al cambiar de tema. |
| Gráfico ausente sin JavaScript o si falla el CDN. | Esperado y permitido por FR-020; la zona de 150 px muestra el estado de error con reintento ya existente de `Chart.astro` y el texto de la tarjeta sigue completo. |
| Eje compartido deja huecos en series más cortas (salario con 2026, resto con 2025). | Es el comportamiento especificado (FR-015, escenario 3): se muestra "—" y la causa sin inventar valores. |

## Definition of Done

- [x] `npx astro check` sin errores nuevos.
- [x] `npm run build` exitoso (incluye el verificador de enlaces internos).
- [x] Cifras, periodos, cambios y referencias de las 8 tarjetas idénticos a los JSON
      y a los que muestra hoy el panel (SC-004).
- [x] Revisión visual en tema claro y oscuro a 1440, 768 y 375 px; contraste AA
      (SC-005, SC-006).
- [x] Recorrido solo con teclado: nombres, zonas de lectura y detalles (SC-007).
- [x] Sin JavaScript: valores, periodos, cambios, fuentes y detalle legibles (SC-008).
- [x] Lectura sincronizada con ratón, toque y teclado en ambas filas (SC-009).
- [x] Sin datasets nuevos ni modificados; sin dependencias nuevas (SC-010).
- [x] Aprobación explícita del autor de las cuatro excepciones de *Complexity
      Tracking* (2026-11-10).

## Documentos vivos que debe actualizar la implementación

- `agents/DESIGN-SYSTEM.md`: sección 5.5 (portada del Observatorio: el esquema
  pasa de "grilla 4 columnas × 8" a dos filas, y la frase "referencia en gris
  neutro; nunca rojo/verde" debe admitir la banda verde de la meta como única
  excepción), catálogo (`FilaIndicadoresClave`, `IndicadorClaveCard`, variante
  `kpi` de `Chart`), UI-07 y UI-08 (excepciones reformuladas), sección 2.9
  (excepción del azul de serie) y el token `--color-chart-serie` en la sección
  2.1.1.
- `src/lib/observatorio/ARCHITECTURE.md`: árbol de archivos y mención de
  `kpi-lectura.ts` e `indicadores-clave.ts`; retiro de `sparkline.ts`.
- `agents/ARCHITECTURE.md`: solo si el módulo cliente nuevo merece mención en 5.4.
- Spec 005: nota de enmienda en la tabla de requisitos (ya declarada en la spec 008).
