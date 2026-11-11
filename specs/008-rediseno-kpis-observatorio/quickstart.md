# Quickstart: validación del rediseño de los indicadores clave

**Feature**: `008-rediseno-kpis-observatorio` · **Date**: 2026-11-10 · **Plan**: [plan.md](./plan.md)

Guía para comprobar de punta a punta que el panel "Cómo va Colombia" cumple la
spec. No hay pruebas automáticas ni visuales en el proyecto; la validación combina
`npx astro check`, `npm run build` y revisión en navegador. Para el contrato de DOM y
de interacción ver [`contracts/kpi-card-contract.md`](./contracts/kpi-card-contract.md);
para las derivaciones y estados, [`data-model.md`](./data-model.md).

## 0. Prerrequisitos y línea base

```bash
npm run dev
```

La portada queda en `http://localhost:4321/observatorio/` (si el puerto está
ocupado, Astro usa el siguiente).

**Antes de tocar código**, registrar la línea base (para SC-004 y SC-010):

1. Captura de las 8 tarjetas actuales en claro y oscuro: de ahí salen los valores,
   periodos y cambios contra los que se compara.
2. En las herramientas del navegador (pestaña Red, caché desactivada): número de
   peticiones, tiempo de carga y peticiones a `public/data/*.json` de `/observatorio/`.
3. Anotar el volumen reciente del evento `home_indicador_click` en GA4, si el autor
   lo consulta (R7).

## 1. Comprobaciones automáticas

```bash
npx astro check
```

```bash
npm run build
```

Esperado: `astro check` sin errores nuevos; `build` exitoso, con el verificador de
enlaces internos en verde (ningún destino de las tarjetas cambia).

Búsqueda de restos (debe dar **cero** resultados en `src/`):

```bash
grep -rnE "sparkline|spark-|GRUPOS|GrupoIndicador" src
```

Y comprobación de que no quedan colores sueltos nuevos en los archivos tocados:
ninguna cifra ni hex suelto en `IndicadorClaveCard.astro`, `FilaIndicadoresClave.astro`,
`indicadores-clave.ts` ni `kpi-lectura.ts` fuera de los tokens y de `COLORS`.

## 2. Matriz de validación en navegador

Marcar cada fila como pasa / falla / no verificado. Repetir las filas visuales en
**tema claro y oscuro** (selector del sidebar) y a **1440, 768 y 375 px**.

### Historia 1 · Leer de un vistazo

| # | Qué probar | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir `/observatorio/` y mirar cada tarjeta sin interactuar | Se ven nombre, valor con unidad, periodo, cambio en una línea, gráfico y "Fuente: …". Nada más, salvo "Dato no reciente" si aplica (SC-001). |
| 2 | Contar elementos de texto fuera del gráfico por tarjeta | 5 como máximo (hoy 8–9). |
| 3 | Medir el gráfico | Ancho completo de la tarjeta, 150 px o más de alto, y es el elemento de mayor área (SC-002). El último punto está resaltado. |
| 4 | Buscar lo eliminado | No hay pill de grupo, índice 01–08, caja alrededor del gráfico ni enlace "Ver dashboard…" aparte; no hay contenedores anidados. |
| 5 | Forma de cada gráfico | Inflación: línea con banda 2–4 %. Tasa BanRep: escalones. Desempleo, dólar y PIB por habitante: línea con área. Crecimiento del PIB: barras desde cero. Cuenta corriente: barras que cuelgan de cero. Salario mínimo: escalera desde cero. |
| 6 | Referencias | Rótulo a la izquierda con formato "Etiqueta · valor". Solo la banda de la meta es verde; las demás son grises. |
| 7 | Comparación interanual / hace un año | Desempleo, dólar, PIB por habitante y salario mínimo muestran el marcador hueco del periodo de comparación. |
| 8 | Pulsar el nombre de cada indicador | Navega al mismo dashboard que hoy (inflación y tasa → `/observatorio/inflacion/`; empleo; monetario; PIB; calculadora del salario). |
| 9 | Prueba con 5 personas (SC-003) | Al menos 4 identifican valor, periodo y si subió o bajó en menos de 5 s para un indicador elegido por quien evalúa. *Prueba manual del autor.* |

### Historia 2 · Fuente y significado bajo demanda

| # | Qué probar | Resultado esperado |
| --- | --- | --- |
| 10 | Abrir y cerrar "Fuente: …" con ratón, con toque y con Intro/Espacio | Se abre y se cierra; el estado expandido se anuncia a tecnologías de asistencia. |
| 11 | Contenido del detalle | Explicación sencilla, frase de posición frente a la referencia, fuente oficial como enlace, indicador medido, fecha de corte, ventana de la serie y enlace al dashboard. |
| 12 | Detalle cerrado | El nombre corto de la fuente y el periodo siguen visibles. |
| 13 | Sin JavaScript (desactivarlo en las herramientas del navegador) | Valores, periodos, cambios, fuentes y el contenido del detalle siguen legibles (SC-008). Faltan el gráfico y la lectura. |
| 14 | "Dato no reciente" | Para verlo, forzar temporalmente una fecha futura en la llamada a `buildIndicadoresClave()` de `index.astro`, comprobar la etiqueta junto al periodo y **revertir**. La lógica de frescura no cambia. |

### Historia 3 · Lectura sincronizada por fila

| # | Qué probar | Resultado esperado |
| --- | --- | --- |
| 15 | Fila "Cada mes": mover el cursor por un gráfico | Las 4 tarjetas muestran valor y periodo del mismo punto; el cursor sigue al puntero. |
| 16 | Fila "Cada año": ídem | Igual; el título de cada fila muestra la ventana de su eje compartido. |
| 17 | Periodo sin dato | En la fila anual, mover hasta 2026: las 3 series del Banco Mundial muestran "—" y "Aún sin dato publicado para esta fecha"; el salario mínimo sí tiene valor. Mover hasta el inicio: "Fuera de la ventana de esta serie". |
| 18 | Teclado | Tab enfoca la zona de lectura; ←/→ avanzan un punto; Inicio/Fin saltan; Escape restablece; el foco es visible. El lector de pantalla anuncia periodo y valor (probar con VoiceOver). |
| 19 | Toque (emulación de móvil y un teléfono real) | Tocar o arrastrar lee la fecha; unos segundos después de soltar, las tarjetas vuelven al dato vigente; el desplazamiento vertical de la página sigue funcionando. |
| 20 | Salir del gráfico con el ratón / perder el foco | Todas las tarjetas vuelven al dato vigente. |
| 21 | Posición del cursor | Con la zona enfocada, pulsar **Fin**: el cursor queda sobre el marcador del dato vigente (tolerancia de 2 px) en las 8 tarjetas, en ambos temas y a los 3 anchos. |
| 22 | Cambiar de tema 5 veces y volver a leer | Los gráficos se redibujan en el tema correcto; la lectura sigue funcionando y una pulsación de ← mueve **un** punto, no dos (sin listeners duplicados). |
| 23 | Navegar a otra página y volver (View Transitions) | La lectura sigue funcionando; sin errores en consola. |
| 24 | Coincidencia de periodos (SC-009) | En 10 lecturas aleatorias por entrada (ratón, toque, teclado), las 4 tarjetas de la fila muestran siempre el mismo periodo. |

### Historia 4 · Pantallas, temas y accesibilidad

| # | Qué probar | Resultado esperado |
| --- | --- | --- |
| 25 | Columnas por fila | 4 a 1440 px, 2 a 768 px, 1 a 375 px (SC-006). |
| 26 | Desplazamiento horizontal a 375 px | Ninguno. |
| 27 | Cifras largas | "US$8.562", "$1.750.905" y "$3.221,74" no se cortan ni desbordan a 1024 px ni a 375 px. |
| 28 | Contraste (SC-005) | Auditoría de contraste de texto y de elementos gráficos en ambos temas: 4.5:1 en texto normal y 3:1 en texto grande y gráficos. En oscuro, la serie se ve en el azul más claro. |
| 29 | Tarjeta vs fondo en oscuro | Se distingue por luminosidad, no por sombra. |
| 30 | Recorrido solo con teclado (SC-007) | Se llega a cada nombre, zona de lectura y `summary`, con foco visible en ambos temas. |
| 31 | Movimiento reducido (emular en las herramientas del navegador) | Sin transiciones ni animación del cursor. |
| 32 | Impresión | El panel se imprime legible en claro, sin depender del tema. |
| 33 | Jerarquía de títulos | `h2` del panel, `h3` de cada fila, `h4` de cada indicador; un solo `h1` en la página. |

### Datos y no regresión

| # | Qué probar | Resultado esperado |
| --- | --- | --- |
| 34 | Comparar valor, periodo, cambio y frase de referencia de las 8 tarjetas contra `public/data/*.json` (`indicadores.<campo>.actual`, `referencia`) y contra la línea base | Cero diferencias (SC-004). |
| 35 | Series | El último punto de cada gráfico coincide con el valor vigente de su tarjeta. |
| 36 | Pestaña Red | Cada dataset se descarga una sola vez, Plotly se carga una vez y no hay `fetch` directo a `/data/` (SC-010). |
| 37 | Rendimiento percibido | Peticiones y tiempo de carga de la portada comparables con la línea base (SC-010). |
| 38 | Analítica | Pulsar el nombre emite `home_indicador_click` con `data-ga-indicador` y `data-ga-destino` correctos. |
| 39 | Resto de la portada | Hero, "Últimas publicaciones", "Quiénes somos", "Qué hacemos" y "Cómo funciona" se ven idénticos a la línea base en ambos temas (FR-023). |
| 40 | Sin cambios en datos | `git status` no muestra cambios en `public/data/` ni en `package.json`/`package-lock.json`. |

## 3. Documentos vivos

Comprobar que se actualizaron (DoD del plan):

- `agents/DESIGN-SYSTEM.md`: sección 5.5, catálogo, UI-07, UI-08, sección 2.9 y token
  `--color-chart-serie`.
- `src/lib/observatorio/ARCHITECTURE.md`: árbol de archivos (`kpi-lectura.ts`,
  `indicadores-clave.ts`; `sparkline.ts` retirado).
- `agents/ARCHITECTURE.md`, solo si el módulo cliente nuevo se menciona en 5.4.

## 4. Registro de resultados

Al terminar, anotar aquí (o en `tasks.md`) qué filas pasaron, cuáles fallaron y cuáles
quedaron sin verificar (por ejemplo: toque en un dispositivo real, lector de pantalla,
prueba con personas, comparación de analítica en GA4), sin maquillar los fallos.

### 4.1 Línea base (T001 — antes de tocar código)

HTML inicial respaldado en `scratch/baseline_observatorio.html`. Valores, periodos, cambios y referencias de las 8 tarjetas vigentes:

| # | `id` | Nombre | Valor | Periodo | Cambio | Ventana | Frase de referencia | Fuente |
|---|---|---|---|---|---|---|---|---|
| 01 | `inflacion-anual` | Inflación anual | `6,30 %` | `Oct 2026` | `↑ Subió 0,02 pp frente a Sep 2026` | `Nov 2024 — Oct 2026` | `Por encima del rango meta del BanRep (2–4 %)` | `DANE — Departamento Administrativo Nacional de Estadística` |
| 02 | `tasa-banrep` | Tasa de intervención BanRep | `12,25 %` | `Oct 2026` | `↑ Subió 0,25 pp frente a Sep 2026` | `Nov 2024 — Oct 2026` | `Por encima de su promedio de 20 años (6,32 %)` | `Banco de la República de Colombia` |
| 03 | `crecimiento-pib` | Crecimiento del PIB | `2,64 %` | `2025` | `↑ Subió 1,15 pp frente a 2024` | `2006 — 2025` | `Por debajo de su promedio de 20 años (3,55 %)` | `Banco Mundial — World Development Indicators` |
| 04 | `pib-percapita` | PIB por habitante | `US$8.562` | `2025` | `↑ Subió US$611 frente a 2024` | `2006 — 2025` | `7,7 % más alto que hace un año (US$7.951)` | `Banco Mundial — World Development Indicators` |
| 05 | `desempleo` | Tasa de desempleo | `8,02 %` | `Sep 2026` | `↓ Bajó 0,15 pp frente a Sep 2025` | `Oct 2024 — Sep 2026` | `Por debajo de su promedio de 20 años (10,88 %)` | `DANE — Departamento Administrativo Nacional de Estadística` |
| 06 | `trm` | Dólar (TRM) | `$3.221,74` | `Nov 2026` | `↑ Subió $22,83 frente a Oct 2026` | `Dic 2024 — Nov 2026` | `14,9 % más bajo que hace un año ($3.786,18)` | `Banco de la Republica — TRM` |
| 07 | `cuenta-corriente` | Cuenta corriente | `-2,41 %` | `del PIB · 2025` | `↓ Bajó 0,72 pp frente a 2024` | `2006 — 2025` | `Por encima de su promedio de 20 años (-3,56 % del PIB)` | `Banco Mundial — WDI` |
| 08 | `salario-minimo` | Salario mínimo | `$1.750.905` | `2026` | `↑ Subió $327.405 frente a 2025` | `2007 — 2026` | `23,0 % más alto que hace un año ($1.423.500)` | `Ministerio del Trabajo — decretos anuales de salario mínimo (compilación Wikipedia)` |

- **Peticiones a `public/data/*.json` en `/observatorio/`**: 5 datasets únicos descargados en runtime por la caché de `loadDatasets` (`data_inflacion.json`, `data_pib.json`, `data_empleo.json`, `data_externo.json`, `data_salario_minimo.json`), más 1 carga de Plotly `basic` desde CDN.
- **Build inicial**: 168 páginas compiladas en ~3.4 s; 0 enlaces internos rotos.

### 4.2 Alcance del retiro (T002)

- `grep -rnE "sparkline|spark-|GRUPOS|GrupoIndicador|\.grupo|grupo:" src agents scripts public`:
  - Código: apariciones únicamente en `src/components/observatorio/IndicadorClaveCard.astro`, `src/components/observatorio/Chart.astro`, `src/lib/observatorio/chart-defs/sparkline.ts`, `src/lib/observatorio/chart-defs/index.ts` y `src/lib/observatorio/home.ts` (más un gradiente decorativo `id="bp-spark-area"` en `PipelineBlueprint.astro` y `MATRIZ_GRUPOS` en `comercio.ts`, ambos ajenos a esta feature).
  - Documentación: `src/lib/observatorio/ARCHITECTURE.md`, `agents/ARCHITECTURE.md` y `agents/DESIGN-SYSTEM.md`.
- `grep -rn "IndicadorClaveCard" src`:
  - Solo en `src/components/observatorio/IndicadorClaveCard.astro`, `src/pages/observatorio/index.astro`, `src/lib/observatorio/chart-defs/sparkline.ts` y `src/lib/observatorio/ARCHITECTURE.md`.
- **Conclusión**: ningún consumidor externo bloquea el retiro de `sparkline.ts`, `GRUPOS`, `GrupoIndicador` ni `.grupo`.

### 4.3 Validación de US1 y US2 (T017, T019)

- **Filas 1–8 (US1)**:
  - Dos `FilaIndicadoresClave` renderizadas en `dist/observatorio/index.html`: `"Cada mes"` (`Últimos 24 meses de cada serie sobre un mismo eje, Oct 2024 — Nov 2026`, 4 indicadores) y `"Cada año"` (`Últimos 20 años de cada serie sobre un mismo eje, 2006 — 2026`, 4 indicadores).
  - Formas de gráfico verificadas en `indicadoresClave`:
    - `kpi-inflacion`: línea lineal + área (`0.16`) + banda verde `Rango meta BanRep · 2–4 %` + 2 líneas punteadas en 2 % y 4 % + marcador vigente.
    - `kpi-tasa-banrep`: escalón (`shape: "hvh"`) + línea punteada `Prom 20 años · 6,32 %` + marcador vigente.
    - `kpi-desempleo`: línea lineal + línea punteada `Prom 20 años · 10,88 %` + marcador hueco de comparación interanual (`Sep 2025`) + marcador vigente.
    - `kpi-trm`: línea lineal + línea punteada `Hace un año · $3.786,18` + marcador hueco (`Nov 2025`) + marcador vigente.
    - `kpi-pib`: barras (`0.42` y última en `1.0`) + línea de cero + línea punteada `Prom 20 años · 3,55 %`.
    - `kpi-pib-percapita`: línea lineal + línea punteada `Hace un año · US$7.951` + marcador hueco (`2024`) + marcador vigente.
    - `kpi-cuenta-corriente`: barras (`0.42` y última en `1.0`) + línea de cero + línea punteada `Prom 20 años · -3,56 %`.
    - `kpi-salario-minimo`: escalón (`shape: "hvh"`) desde 0 (`rangoY[0] === 0`) + línea punteada `Hace un año · $1.423.500` + marcador hueco (`2025`) + marcador vigente.
  - Eliminados verificados (`0` apariciones en `dist/observatorio/index.html`): `.ind-clave__grupo`, `.ind-clave__idx`, `.ind-clave__spark`, `.ind-clave__cta`.
  - Fila 9 (prueba con 5 personas, SC-003): pendiente de ejecución manual por el autor.
- **Filas 10–14 (US2)**:
  - `<details class="ind-clave__detalle">` cerrado por defecto (`0` atributos `open` iniciales), con `<summary>Fuente: {nombreCorto}</summary>` (`DANE`, `Banco de la República de Colombia`, `Banco Mundial`, `Banco de la Republica`, `Ministerio del Trabajo`).
  - Contenido en el HTML inicial sin JavaScript: explicación en lenguaje sencillo, frase de referencia terminada en punto, enlace externo a la fuente oficial con `<small>{indicador} · Corte {periodo} · Serie {ventana}</small>` y enlace secundario `{destino} →` sin atributos `data-ga-*`.
  - Etiqueta `"Dato no reciente"` verificada invocando `buildIndicadoresClave(..., new Date("2030-01-01T00:00:00Z"))`: los 8 indicadores devuelven `frescura === "no-reciente"` y renderizan `<span class="ind-clave__alerta">Dato no reciente</span>`.

### 4.4 Validación de US3 (T025)

- **Eje compartido y lectura sincronizada (`derivations.ts` + `kpi-lectura.ts`)**:
  - `ejeCompartido` mensual: 26 periodos (`2024-10` a `2026-11`).
  - `ejeCompartido` anual: 21 periodos (`2006-12` a `2026-12`).
  - Verificación de `lecturaEnPeriodo`:
    - `crecimiento-pib` en `2026-12` → `{ tipo: "sin-publicar" }` (`—` y `"Aún sin dato publicado para esta fecha"`).
    - `salario-minimo` en `2026-12` → `{ tipo: "vigente", valor: 1750905 }` (`"Es el dato vigente"`).
    - `salario-minimo` en `2006-12` → `{ tipo: "fuera-de-ventana" }` (`—` y `"Fuera de la ventana de esta serie"`).
  - Verificación geométrica (`posicionDe` ↔ `periodoEnX`) en las 8 tarjetas y 3 anchos (`320 px`, `340 px`, `327 px`): `0` discrepancias de periodo en todos los puntos y `0,00 px` de error en el último periodo (`Fin`).
  - Idempotencia de `registrarLectura`: re-registro por cambio de tema actualiza la geometría en el mismo `EstadoTarjeta` sin duplicar listeners (`tarjetas.has(reg.id)`) y reinicia la fila a `reposo`.
  - Pendiente de prueba física por el autor: toque en teléfono móvil real (regreso a los 2,5 s).

### 4.5 Validación de US4 y Auditoría de Contraste (T027, T028)

- **Auditoría de contraste WCAG 2.1 (claro `#ffffff` y oscuro `#1a2438`)**:
  - `--color-text-primary`: `15.79:1` (claro) / `13.48:1` (oscuro) — PASA AA (≥ 4.5:1).
  - `--color-text-secondary`: `9.01:1` (claro) / `9.77:1` (oscuro) — PASA AA (≥ 4.5:1).
  - `--color-text-muted`: `5.32:1` (claro) / `5.56:1` (oscuro) — PASA AA (≥ 4.5:1).
  - `--color-accent-text`: `5.17:1` (claro) / `5.91:1` (oscuro) — PASA AA (≥ 4.5:1).
  - `--color-text-success` (rótulo `"Rango meta BanRep · 2–4 %"`): `5.02:1` (claro) / `8.97:1` (oscuro) — PASA AA (≥ 4.5:1).
  - `--color-chart-serie` (traza y marcadores `kpi-*`): `#2563eb` en claro (`5.17:1`) / `#3b82f6` en oscuro (`4.12:1`) — PASA AA gráfico (≥ 3.0:1).
  - `--color-chart-reference` (líneas punteadas de referencia): `4.76:1` (claro) / `5.56:1` (oscuro) — PASA AA (≥ 3.0:1).
  - `META_BANREP.color` (`#16a34a`, bordes punteados de la banda): `3.30:1` (claro) / `4.71:1` (oscuro) — PASA AA gráfico (≥ 3.0:1).
- **Responsivo, jerarquía y movimiento reducido**:
  - Grilla de 4 columnas en escritorio, 2 en `≤ 1024px` y 1 en `≤ 640px`.
  - Tipografía del valor con `clamp(1.375rem, 1.8vw, 1.75rem)` y `tabular-nums`: sin desborde en `"US$8.562"`, `"$1.750.905"` ni `"$3.221,74"`.
  - Jerarquía de encabezados en `/observatorio/`: un único `<h1>`, `<h2>` para `"Cómo va Colombia"`, dos `<h3>` (`"Cada mes"`, `"Cada año"`) y ocho `<h4>` (uno por indicador).
  - Reglas `@media (prefers-reduced-motion: reduce)` y `@media print` incluidas en `IndicadorClaveCard.astro` y `FilaIndicadoresClave.astro`.
  - Pendiente de prueba manual con lector de pantalla (VoiceOver) por el autor.

### 4.6 Datos, no regresión y limpieza final (T034–T037)

- **Comparación contra la línea base (T001) y `public/data/*.json`**: las 8 tarjetas en `dist/observatorio/index.html` conservan exactamente los mismos valores, periodos, cambios, frases de referencia, nombres/URLs de fuente y atributos `data-ga-*` que la línea base (`0` diferencias).
- **Último punto de cada gráfico**: verificado programáticamente que el último punto de las 8 series construidas por `indicadoresClave` coincide con el valor vigente del indicador.
- **Red y caché**: ningún `fetch` directo; los 8 `ChartDef` usan `loadDatasets` con caché compartida en memoria (`data-client.ts`), descargando una sola vez cada uno de los 5 JSON (`inflacion`, `pib`, `empleo`, `externo`, `salario_minimo`) y una sola instancia de `<PlotlyLoader />`.
- **Retiro de código obsoleto**: `grep -rnE "sparkline|spark-|GRUPOS|GrupoIndicador" src` no arroja ningún resultado de sparklines ni de grupos de la Home; `src/lib/observatorio/chart-defs/sparkline.ts` fue eliminado.
- **Verificación de tipos y build**:
  - `npx astro check`: **0 errores, 0 warnings** (119 archivos).
  - `npm run build`: **168 páginas construidas**, verificador de enlaces internos con **0 errores**.
  - `git status`: sin cambios en `public/data/*.json`, `package.json` ni `package-lock.json`.
