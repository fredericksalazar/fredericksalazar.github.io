# Contrato de interfaz: tarjeta, fila y lectura de los indicadores clave

**Feature**: `008-rediseno-kpis-observatorio` · **Date**: 2026-11-10 · **Plan**: [plan.md](../plan.md) · **Modelo**: [data-model.md](../data-model.md)

El sitio es estático y no expone APIs. Los contratos de esta feature son
**contratos de interfaz de usuario**: la estructura de DOM y ARIA que producen los
componentes, el contrato del `ChartDef`, y el contrato entre el `ChartDef` y el
módulo de lectura. Fijan lo que la implementación debe producir y lo que la
verificación puede comprobar; no contienen código de implementación.

## 1. Fila de indicadores (`FilaIndicadoresClave`)

Se usa dos veces en el panel "Cómo va Colombia": una por ritmo.

```text
<section data-fila-indicadores="mensual|anual" aria-labelledby="fila-{ritmo}-titulo">
  <header>
    <h3 id="fila-{ritmo}-titulo">Cada mes | Cada año</h3>
    <p>{ventanaTexto}</p>
    <p>Pista de uso (solo en la fila mensual y solo con JS): "Recorre un gráfico ←/→ y toda la fila lee la misma fecha"</p>
  </header>
  <div>  ← grilla 4 / 2 / 1 columnas (sin roles de lista: cada tarjeta es un <article>)
    <IndicadorClaveCard /> × 4
  </div>
</section>
```

| Atributo / elemento | Regla |
| --- | --- |
| `data-fila-indicadores` | Valor `mensual` o `anual`; es el identificador del grupo de lectura. |
| Título de fila | `h3`. El título del panel sigue siendo `h2` ("Cómo va Colombia"); cada tarjeta usa `h4` para el nombre del indicador. |
| Grilla | 4 columnas; 2 hasta `1024px`; 1 hasta `640px` (DESIGN-SYSTEM 2.6 y 5.5). Sin desplazamiento horizontal a 375 px. |
| Pista de teclado | Texto informativo; no debe ser el único modo de descubrir la interacción. |

## 2. Tarjeta (`IndicadorClaveCard`)

### 2.1 Estructura (HTML inicial, sin JavaScript)

```text
<article data-indicador="{id}" aria-labelledby="ind-{id}">
  ── NIVEL 1 · DATO ─────────────────────────────────────────────
  <h4 id="ind-{id}">
    <a href="{def.href}"
       aria-label="{nombre}. {destino}"
       data-ga-event="home_indicador_click"
       data-ga-indicador="{id}" data-ga-destino="{href}">
      {nombre} <flecha aria-hidden>
    </a>
  </h4>
  <p>
    <span data-kpi-valor>{valor con unidad}</span>
    <time data-kpi-periodo datetime="{periodo}">{periodo formateado}</time>
    [si frescura = no-reciente] <span>Dato no reciente</span>
  </p>

  ── NIVEL 2 · CONTEXTO ─────────────────────────────────────────
  <p data-kpi-contexto>
    <span aria-hidden>↑|↓|→</span> <span class="sr">Subió|Bajó|Sin cambio</span>
    {magnitud} frente a {periodo de comparación}
  </p>
  <div data-kpi-lectura  ...(ver 2.3)...>
    <Chart id="kpi-{id}" variant="kpi" />      ← 150 px, ancho completo
    <span data-kpi-cursor hidden>…</span>      ← línea + punto (solo JS)
  </div>

  ── NIVEL 3 · DETALLE ──────────────────────────────────────────
  <details>
    <summary>Fuente: {nombre corto}</summary>
    <p>{explicación en lenguaje sencillo}</p>
    <p>{frase de posición frente a la referencia}.</p>
    <p><a href="{fuente.url}" target="_blank" rel="noopener">{fuente.nombre}</a>
       <small>{fuente.indicador} · Corte {periodo} · Serie {ventana}</small></p>
    <p><a href="{def.href}">{destino} →</a></p>
  </details>
</article>
```

### 2.2 Reglas de la tarjeta

| # | Regla | Spec |
| --- | --- | --- |
| K-01 | Sin pill de grupo, sin índice numérico, sin caja alrededor del gráfico, sin enlace "Ver dashboard" separado del nombre, sin contenedores anidados. | FR-005 |
| K-02 | El nombre es el único enlace al dashboard en los niveles 1 y 2 y lleva los atributos `data-ga-*` que hoy tiene el enlace de destino. El enlace dentro del detalle es un acceso secundario (sin `data-ga-*`). | FR-006, R7 |
| K-03 | El valor es el texto de mayor tamaño de la tarjeta; unidad y periodo son menores. Cifras largas ("US$8.562", "$1.750.905") no se cortan ni desbordan en 4 columnas a 1024 px ni a 375 px. | FR-007, FR-024 |
| K-04 | El periodo y el nombre corto de la fuente están visibles sin interactuar. | FR-018 |
| K-05 | La dirección del cambio está como texto para tecnologías de asistencia; ningún color ni símbolo implica "mejoró/empeoró". | FR-008, FR-026 |
| K-06 | Todo el contenido de los niveles 1–3 está en el HTML inicial y es legible sin scripts; `<details>` cerrado no oculta el contenido a buscadores. | FR-020 |
| K-07 | A lo sumo cinco elementos de texto fuera del gráfico sin interactuar: nombre, valor, periodo, cambio y fuente corta (más la etiqueta "Dato no reciente" cuando aplica). | SC-001 |
| K-08 | Solo tokens del sistema de diseño; en oscuro la tarjeta se distingue del fondo por luminosidad. | FR-023 |

### 2.3 Zona de lectura (`[data-kpi-lectura]`)

Contenedor del gráfico que recibe puntero, toque y teclado.

| Atributo | Valor |
| --- | --- |
| `tabindex` | `0` |
| `role` | `slider` |
| `aria-orientation` | `horizontal` |
| `aria-label` | "Recorrer la serie de {nombre en minúsculas}, {ventana}" |
| `aria-valuemin` / `aria-valuemax` | `0` / `{número de puntos de la serie − 1}` |
| `aria-valuenow` | Índice del punto leído (en reposo, el último) |
| `aria-valuetext` | "{periodo}: {valor con unidad}" |
| `touch-action` | `pan-y` (el desplazamiento vertical de la página sigue funcionando) |
| Foco | Anillo visible en ambos temas (`--color-focus`) |

El gráfico de Plotly dentro conserva `role="img"` y la descripción del `ChartDef`
(`ariaLabel`). Sin JavaScript la zona queda inerte y sin `slider` útil; no debe
interferir con el resto de la tarjeta.

## 3. Mapa de interacción de la lectura

| Entrada | Efecto | Estado resultante |
| --- | --- | --- |
| Ratón sobre la zona (`pointermove`) | Lee el periodo bajo el cursor | `leyendo(i)` |
| Ratón fuera de la zona (`pointerleave`) | Restablece | `reposo` |
| Toque o arrastre (`pointerdown`/`pointermove`) | Lee el periodo bajo el dedo | `leyendo(i)` |
| Soltar un toque (`pointerup`/`pointercancel`) | Restablece tras 2,5 s | `reposo` |
| `←` / `↓` | Un punto atrás en la serie propia | `leyendo(i)` |
| `→` / `↑` | Un punto adelante | `leyendo(i)` |
| `Inicio` / `Fin` | Primer / último punto de la serie propia | `leyendo(i)` |
| `Escape` | Restablece | `reposo` |
| Pérdida de foco | Restablece | `reposo` |
| Cambio de tema | Re-render del gráfico; restablece | `reposo` |

`←`, `→`, `↑`, `↓`, `Inicio` y `Fin` llaman a `preventDefault()` solo cuando la
zona tiene el foco. Con `prefers-reduced-motion`, el cursor se mueve sin animación.

### Salida por tarjeta durante `leyendo(i)`

| Elemento | Contenido |
| --- | --- |
| `[data-kpi-valor]` | Valor del periodo `i` con unidad (es-CO) o "—". |
| `[data-kpi-periodo]` | Periodo `i` formateado. |
| `[data-kpi-contexto]` | "Es el dato vigente", o "Dato vigente: {valor} · {periodo}", o la causa del vacío: "Aún sin dato publicado para esta fecha" / "Fuera de la ventana de esta serie". |
| Cursor | Línea vertical en la posición del periodo y punto sobre la serie (oculto si no hay dato). |

## 4. Contrato del `ChartDef` (`kpi-{id}`)

Fábrica `makeIndicadorClaveChart(def)`; registro `indicadoresClave: ChartDef[]` en
`chart-defs/index.ts` (reemplaza a `sparklines`).

| Campo | Valor |
| --- | --- |
| `id` | `kpi-{id}` (p. ej. `kpi-inflacion-anual`). |
| `titulo` | "Tendencia · {nombre}" (se conserva el patrón). |
| `datasets` | Los de **todos los indicadores de la fila** del indicador (para el eje compartido). |
| `height` | `150`. |
| `vistas` | `["linea"]`: sin interruptor "Ver en barras" (excepción UI-08 reformulada). |
| `ariaLabel` | "Tendencia de {nombre en minúsculas} en {ventana}". |
| `build(data)` | Arma trazas y layout según `forma` y referencia (ver `research.md` R3); fija márgenes, `xaxis.range` y `yaxis.range` explícitos; `staticPlot: true`; sin barra de herramientas. |
| `onMount(target, ctx)` | Llama a `registrarLectura(…)` con la geometría (ver 5). |

Reglas del layout:

- Empieza con `baseLayout()` (REGLA 12) y los colores salen de `COLORS` /
  `chartTheme()` (REGLA 11); ningún hex suelto.
- Eje X: fecha, rango explícito, marcas solo de año, sin grilla vertical.
- Eje Y: oculto, rango explícito.
- Rótulos de referencia a la izquierda con formato `Etiqueta · valor` (UI-10).
- La serie usa `COLORS.serie` (azul de marca; más claro en oscuro).

## 5. API del módulo `kpi-lectura.ts`

Módulo cliente; lógica pura de mapeo y lectura en funciones sin DOM, efectos en un
registro idempotente (ARQ-08).

| Función | Entrada | Efecto |
| --- | --- | --- |
| `registrarLectura(reg)` | `reg`: `{ id, destino (elemento del gráfico), fila (ritmo), geometria, formatear }` | Registra o **actualiza** el gráfico en su fila por `id`; engancha una sola vez los listeners de la zona de lectura; la primera vez, guarda el contenido inicial de la tarjeta. Si el gráfico se re-renderiza, solo actualiza la geometría. |
| `leer(fila, indice \| null)` | Índice del eje compartido o `null` | Pasa la fila a `leyendo(i)` o a `reposo` y actualiza las 4 tarjetas. Idempotente: no hace nada si el estado no cambia. |
| `periodoEnX(geometria, x)` | Posición X en px dentro de la zona | Devuelve el periodo más cercano del eje compartido (interpolación lineal sobre el área de dibujo). |
| `posicionDe(geometria, periodo, valor)` | Periodo y valor | Devuelve la posición del cursor y del punto. |

Garantías:

- Una bandera global (`window.__kpiLecturaBound`) protege los listeners globales;
  se re-engancha en `astro:page-load` (ARQ-08).
- Nunca llama a `fetch`; no lee JSON; usa solo la geometría y la serie que recibe del
  `ChartDef` (REGLAS 8 y 9).
- Nunca muestra un valor que no esté en la serie recibida.

## 6. Tokens

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-chart-serie` (**nuevo**) | `#2563eb` | `#3b82f6` | Línea, área, barras y punto del dato vigente de los gráficos `kpi-*`. Definido en los tres bloques (claro, oscuro, sin JS). |
| `--color-chart-reference` | existente | existente | Líneas y rótulos de promedio y de "hace un año". |
| `--color-chart-axis`, `--color-chart-text`, `--color-chart-muted` | existentes | existentes | Eje X, línea de cero y textos. |
| `--color-focus` | existente | existente | Foco de la zona de lectura y de `summary`. |
| `--color-surface`, `--color-border`, `--color-text-*`, `--color-accent-text` | existentes | existentes | Tarjeta, nombre, valor, periodo y enlaces. |
| Verde de meta | `COLORS.metaBanda` / `META_BANREP.color` | ídem | Única referencia con color propio (banda del rango meta). |

## 7. Compatibilidad y no regresión

| Tema | Contrato |
| --- | --- |
| View Transitions | Scripts idempotentes; `registrarLectura` se vuelve a ejecutar tras `astro:page-load` sin duplicar listeners. |
| Cambio de tema | `Chart.astro` re-renderiza el gráfico; `onMount` actualiza la geometría; la fila vuelve a `reposo`. |
| Sin JavaScript | Valores, periodos, cambios, fuentes y detalle legibles; sin gráfico ni lectura. |
| Analítica | El evento `home_indicador_click` y sus atributos `data-ga-*` se conservan en el enlace del nombre. |
| Enlaces internos | Solo `src/lib/urls.ts` (ARQ-03); los destinos son los mismos de hoy. |
| Datos | Ningún dataset cambia; ninguna cifra se escribe a mano (ARQ-02). |
