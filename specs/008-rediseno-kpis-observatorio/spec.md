# Feature Specification: Rediseño de los indicadores clave del Observatorio

**Feature Branch**: `008-rediseno-kpis-observatorio` *(nombre de referencia; el autor maneja git y decide la rama)*

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Esta es la imagen actual de los kpis del observatorio. A mí la verdad no me gusta el diseño implementado, me parece que está sobrecargado, poca importancia a las imágenes. Quiero una propuesta de rediseño de los kpis, un nuevo modelo de KPIs para mostrar cada uno. Sorpréndeme." La propuesta de diseño aprobada por el autor está en la maqueta navegable https://claude.ai/artifact/4p1aVBaZjwXozViL6W1HRB (archivo local: `kpis-rediseno.html`, en la carpeta de trabajo de la sesión).

## Contexto de producto *(obligatorio por la constitución, principio I)*

- **Objetivo:** autoridad (principal) y monetización por arrastre. El panel de
  indicadores es lo primero que ve quien llega a `/observatorio/`; un panel claro
  y visual demuestra criterio de ingeniería y de comunicación de datos, y hace que
  el Observatorio sea una fuente que se cita.
- **Pilar:** P3 · Observatorio de Datos de Colombia (con camino hacia los
  dashboards de dominio, según PRD-01).
- **Audiencias:** A4 (ciudadanos, periodistas y estudiantes, que son quienes leen
  el panel), A2 (líderes técnicos y directivos, que lo usan para evaluar el
  criterio del autor) y A5 (buscadores y asistentes de IA, que dependen de que las
  cifras estén en el HTML inicial).
- **KPIs:**
  - K5 · Autoridad (enlaces y citas al Observatorio): un panel más legible y
    citable.
  - K4 · Conversiones (clics hacia los dashboards): el nombre de cada indicador
    pasa a ser el enlace a su dashboard.
  - K6 · Frescura del Observatorio: el periodo de cada dato y la etiqueta de
    "dato no reciente" siguen siempre visibles.
  - K3 · Tráfico orgánico: favorecido de forma indirecta, por mayor permanencia
    en la portada.

> **Nota de gobernanza:** esta feature **enmienda** requisitos de la spec
> `005-landing-observatorio` (agrupación por tema, contenido de cada tarjeta y
> presentación de la referencia: ver sección *Enmiendas a la spec 005*) y obliga a
> reescribir las excepciones aprobadas de las reglas UI-07 y UI-08 de
> `agents/DESIGN-SYSTEM.md`, que hoy se justifican por "miniatura de 48 px".
> Ambas cosas requieren aprobación del autor.

## Clarifications

### Session 2026-11-10

- Q: ¿De qué color se dibuja la banda del rango meta del Banco de la República en la
  tarjeta de inflación? → A: En el verde que el sistema de diseño ya define para la
  meta (el mismo que usa el dashboard de inflación), no en gris. La banda es una
  zona de referencia oficial;
  la línea del dato sigue en azul esté dentro o fuera de ella.
- Q: ¿Qué azul usa la serie en tema oscuro? → A: Un azul más claro (`#3b82f6`) para
  asegurar contraste. Es una excepción documentada, acotada al azul de marca, a la
  regla "los colores de series no cambian con el tema".
- Q: ¿Cómo se resuelve que "Sector externo" quede repartido entre las dos filas? →
  A: Repartido sin rótulo temático (la propuesta aprobada): el dólar en "Cada mes" y
  la cuenta corriente en "Cada año"; cada tarjeta ya enlaza a su dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leer de un vistazo cómo va cada indicador (Priority: P1)

Una persona llega a `/observatorio/` y, sin leer párrafos, entiende para cada uno
de los 8 indicadores cuánto vale hoy, de cuándo es ese dato, si subió o bajó y
dónde está respecto de su referencia (la meta del Banco de la República, su
promedio de 20 años o el valor de hace un año). El gráfico de la serie es el
elemento principal de cada tarjeta: ocupa todo el ancho y es lo más grande de la
tarjeta, y la referencia aparece dibujada sobre él, no solo escrita. La tarjeta
muestra tres niveles de información (dato, contexto y detalle) y nada más: no hay
etiquetas de grupo, numeración, cajas dentro de cajas ni un enlace aparte que
repita el nombre.

**Why this priority**: es la razón del rediseño. Hoy la tarjeta apila entre 8 y 9
elementos de texto con el mismo peso y reduce el gráfico a una miniatura de 48 px;
sin resolver esto, el resto de la feature no aporta.

**Independent Test**: abrir `/observatorio/` y, para cada una de las 8 tarjetas,
identificar sin interactuar el valor, su periodo, el sentido del cambio y la
posición frente a la referencia; comprobar que el gráfico es el elemento de mayor
área de la tarjeta y que no existen los elementos eliminados.

**Acceptance Scenarios**:

1. **Given** la portada del Observatorio, **When** el visitante mira una tarjeta,
   **Then** ve, sin interactuar, el nombre del indicador, su valor con unidad, el
   periodo del dato, el cambio frente al periodo de comparación en una sola línea,
   el gráfico de la serie y el nombre corto de la fuente.
2. **Given** una tarjeta, **When** el visitante la observa, **Then** el gráfico
   ocupa todo el ancho de la tarjeta, con una altura mínima de 150 px, y resalta el
   último punto como dato vigente.
3. **Given** el indicador "Inflación anual", **When** se muestra su gráfico,
   **Then** el rango meta del Banco de la República (2 % a 4 %) aparece dibujado
   como una banda rotulada, y el visitante ve si el último punto queda dentro o
   fuera de ella sin leer una frase.
4. **Given** una tarjeta, **When** el visitante la inspecciona, **Then** no
   aparecen la etiqueta de grupo temático, el índice numérico 01–08, la caja que
   encerraba la miniatura ni un enlace "Ver dashboard de…" separado del nombre.
5. **Given** el nombre de un indicador, **When** el visitante lo pulsa, **Then**
   navega al dashboard que lo explica (el mismo destino que hoy).
6. **Given** los 8 indicadores, **When** el visitante los compara, **Then** cada
   uno usa la forma de gráfico que corresponde a su naturaleza (tabla de formas en
   *Key Entities*), y no todos son la misma línea.

---

### User Story 2 - Consultar la fuente y el significado bajo demanda (Priority: P1)

Quien quiere verificar un dato o entender qué mide abre el detalle de la tarjeta
con un botón rotulado con el nombre corto de la fuente. El detalle muestra, en
lenguaje sencillo, qué significa el indicador, dónde está el valor frente a su
referencia, la fuente oficial con enlace, el indicador exacto que se mide, la fecha
de corte, la ventana de la serie y el acceso al dashboard. El nombre corto de la
fuente y el periodo del dato nunca se esconden.

**Why this priority**: la constitución (principio II) y PRD-05 exigen fuente oficial
y fecha de corte visibles en todo dato publicado. Simplificar la tarjeta no puede
costar rigor; por eso esta historia es P1 junto con la anterior.

**Independent Test**: en cada tarjeta, abrir y cerrar el detalle con ratón, con
toque y con teclado; verificar su contenido completo y que el nombre corto de la
fuente y el periodo son visibles sin abrirlo.

**Acceptance Scenarios**:

1. **Given** una tarjeta con el detalle cerrado, **When** el visitante la mira,
   **Then** ve el nombre corto de la fuente y el periodo del dato sin interactuar.
2. **Given** el botón de detalle, **When** el visitante lo activa con ratón, toque
   o teclado, **Then** el detalle se abre, el botón comunica a las tecnologías de
   asistencia que está expandido y un segundo accionar lo cierra.
3. **Given** el detalle abierto, **When** el visitante lo lee, **Then** encuentra la
   explicación en lenguaje sencillo, la frase de posición frente a la referencia,
   el nombre oficial de la fuente como enlace, el indicador medido, la fecha de
   corte, la ventana de la serie y el enlace al dashboard del indicador.
4. **Given** un lector sin JavaScript o un buscador, **When** carga la página,
   **Then** el contenido del detalle está presente en la página aunque esté
   cerrado.
5. **Given** un indicador cuyo dataset supera el umbral de frescura, **When** se
   muestra su tarjeta, **Then** el periodo lleva la etiqueta "dato no reciente".

---

### User Story 3 - Comparar indicadores de una misma fila en la misma fecha (Priority: P2)

El panel se organiza en dos filas según el ritmo con que se publican los datos:
"Cada mes" (inflación, tasa del Banco de la República, desempleo y dólar) y "Cada
año" (crecimiento del PIB, PIB por habitante, cuenta corriente y salario mínimo).
Las cuatro tarjetas de una fila comparten el mismo eje de tiempo. Cuando el
visitante recorre el gráfico de una tarjeta, con el cursor, con el dedo o con las
flechas del teclado, las cuatro tarjetas de la fila muestran el valor y la fecha
de ese mismo periodo. Así se ve, por ejemplo, qué pasaba con la tasa de interés y
el dólar cuando la inflación tocó su punto más alto.

**Why this priority**: es la idea distintiva del rediseño y reemplaza la
agrupación temática por una que cambia cómo se lee el dato (mensual frente a
anual), pero el panel ya es útil sin ella (Historia 1).

**Independent Test**: recorrer el gráfico de una tarjeta mensual y de una anual con
ratón, con toque y con teclado; verificar que las cuatro tarjetas de la fila leen la
misma fecha y que, al salir, todas vuelven a su dato vigente.

**Acceptance Scenarios**:

1. **Given** una fila, **When** el visitante la mira, **Then** ve un título de fila
   ("Cada mes" o "Cada año") y la ventana de tiempo que cubre su eje compartido.
2. **Given** el cursor sobre el gráfico de una tarjeta de la fila, **When** lo
   mueve a lo largo del eje, **Then** las cuatro tarjetas de la fila muestran el
   valor y el periodo correspondientes a esa posición.
3. **Given** un indicador que no tiene dato en el periodo seleccionado, **When** se
   recorre ese periodo, **Then** su tarjeta muestra "—" y explica si el dato aún no
   está publicado o queda fuera de su ventana, sin inventar un valor.
4. **Given** el gráfico enfocado con el teclado, **When** el visitante usa las
   flechas, Inicio y Fin, **Then** la lectura se desplaza un periodo, al primero o
   al último, y Escape devuelve todas las tarjetas a su dato vigente.
5. **Given** un dispositivo táctil, **When** el visitante toca o arrastra sobre un
   gráfico, **Then** la fila lee esa fecha y, un instante después de soltar, vuelve
   al dato vigente.
6. **Given** que el cursor sale del gráfico o el foco se pierde, **When** ocurre,
   **Then** todas las tarjetas de la fila vuelven a mostrar su dato vigente.

---

### User Story 4 - Usar el panel en cualquier pantalla, tema y modo de acceso (Priority: P2)

El visitante abre el panel en un teléfono, una tableta o un escritorio, en tema
claro u oscuro, con teclado, con lector de pantalla o con reducción de movimiento
activada. El panel sigue siendo legible, completo y operable en todos los casos.

**Why this priority**: el sitio ya promete accesibilidad (PRD-03, constitución
principio V) y dos temas (spec 007); un rediseño que rompa alguno es una regresión.

**Independent Test**: abrir la portada a 1440, 768 y 375 px de ancho, en ambos
temas, recorrer todas las tarjetas solo con teclado y comprobar contraste, foco y
ausencia de desplazamiento horizontal.

**Acceptance Scenarios**:

1. **Given** un ancho de pantalla de escritorio, **When** se muestra el panel,
   **Then** cada fila tiene cuatro columnas; en tableta, dos; en teléfono, una.
2. **Given** un teléfono de 375 px de ancho, **When** se abre la portada, **Then**
   no hay desplazamiento horizontal y el nombre, el valor y el periodo de cada
   tarjeta se leen completos.
3. **Given** el tema oscuro, **When** se muestra el panel, **Then** textos, ejes,
   referencias, líneas y el punto vigente cumplen el contraste mínimo y las
   tarjetas se distinguen del fondo.
4. **Given** un visitante que navega con teclado, **When** recorre el panel,
   **Then** puede llegar a cada nombre-enlace, a cada gráfico y a cada botón de
   detalle, con foco visible en ambos temas.
5. **Given** un lector de pantalla, **When** enfoca un gráfico, **Then** oye el
   indicador, el periodo y el valor de la posición actual, y los cambios al
   recorrerlo.
6. **Given** reducción de movimiento activada en el sistema, **When** el visitante
   interactúa con el panel, **Then** no hay animaciones ni transiciones que
   molesten.

---

### Edge Cases

- **Indicador sin dato:** se oculta o se muestra como "sin dato", como hoy; nunca
  se rellena con un valor supuesto.
- **Dataset con dato no reciente:** el periodo lleva la etiqueta "dato no
  reciente" junto al valor, sin esconder el valor.
- **Series de distinta longitud en una misma fila** (por ejemplo, el salario mínimo
  ya tiene dato de 2026 y las series del Banco Mundial llegan a 2025): el eje
  compartido cubre todas y las tarjetas sin dato en ese periodo lo indican.
- **Valores negativos** (crecimiento del PIB en 2020, cuenta corriente): se dibujan
  respecto de una línea de cero visible.
- **Dato del mes en curso parcial** (el dólar): se muestra como publica el
  dataset, con su periodo; no se completa ni se reescribe.
- **Cambio igual a cero o sin periodo de comparación:** la línea de cambio dice
  "Sin cambio" o se omite; no se muestran flechas ni magnitudes inventadas.
- **Sin JavaScript:** los valores, periodos, cambios, fuentes y el contenido del
  detalle siguen siendo legibles; el gráfico y la lectura sincronizada son una
  mejora (spec 005, FR-009).
- **Cifras largas en columnas angostas** (salario mínimo, PIB por habitante): el
  valor no se corta ni desborda la tarjeta.
- **Cambio de tema con el panel abierto:** el gráfico y su referencia se adaptan al
  tema sin recargar la página.
- **Impresión:** el panel se imprime legible en claro, sin depender del tema.

## Requirements *(mandatory)*

### Functional Requirements

**Estructura del panel**

- **FR-001**: La portada del Observatorio DEBE seguir mostrando, bajo el hero y el
  menú, el panel "Cómo va Colombia" con los mismos 8 indicadores que hoy: inflación
  anual, tasa de intervención del Banco de la República, crecimiento del PIB, PIB
  por habitante, tasa de desempleo, dólar (TRM), cuenta corriente y salario
  mínimo.
- **FR-002**: El panel DEBE organizarse en dos filas según el ritmo de publicación:
  "Cada mes" (inflación anual, tasa del Banco de la República, desempleo y dólar) y
  "Cada año" (crecimiento del PIB, PIB por habitante, cuenta corriente y salario
  mínimo). Cada fila DEBE llevar su título y la ventana de tiempo que cubre su eje
  compartido.
- **FR-003**: Las tarjetas de una misma fila DEBEN compartir el mismo eje de
  tiempo, de modo que un mismo periodo ocupe la misma posición horizontal en todas.

**Contenido de la tarjeta**

- **FR-004**: Cada tarjeta DEBE organizarse en tres niveles: **dato** (nombre del
  indicador, valor actual con unidad y periodo del dato), **contexto** (el cambio
  frente al periodo de comparación en una sola línea y el gráfico de la serie) y
  **detalle** (contenido que se abre bajo demanda, ver FR-016).
- **FR-005**: La tarjeta NO DEBE incluir la etiqueta de grupo temático, el índice
  numérico, la caja que encierra la miniatura del gráfico ni un enlace "Ver
  dashboard de…" separado del nombre. NO DEBE haber contenedores anidados dentro de
  la tarjeta.
- **FR-006**: El nombre de cada indicador DEBE ser el enlace a su dashboard (mismo
  destino que hoy) y su nombre accesible DEBE incluir el texto de destino ("Ver
  dashboard de …").
- **FR-007**: El valor DEBE ser el texto más destacado de la tarjeta; la unidad y
  el periodo DEBEN quedar subordinados al valor.
- **FR-008**: La línea de cambio DEBE ser descriptiva: dirección, magnitud y
  periodo de comparación ("Subió 0,25 pp frente a Sep 2026"). La dirección DEBE
  estar disponible como texto para tecnologías de asistencia, y la línea NO DEBE
  usar colores ni símbolos que impliquen "mejoró" o "empeoró" (spec 005, FR-007).

**Gráfico**

- **FR-009**: El gráfico DEBE ocupar todo el ancho de la tarjeta, tener una altura
  mínima de 150 px, ser el elemento de mayor área de la tarjeta y resaltar el
  último punto como dato vigente.
- **FR-010**: Cada indicador DEBE usar la forma de gráfico definida en la tabla de
  *Key Entities* (línea con área, escalones, barras desde cero, barras que cuelgan
  de cero o escalera anual).
- **FR-011**: La referencia de cada indicador (rango meta, promedio de 20 años o
  valor de hace un año) DEBE dibujarse sobre el gráfico con una etiqueta a la
  izquierda con el formato "Etiqueta · valor", y la frase que describe la posición
  del dato frente a ella DEBE seguir disponible en el detalle. Las referencias de
  promedio y de hace un año DEBEN dibujarse en gris neutro; la banda del rango meta,
  según FR-013.
- **FR-012**: Cuando el cambio se mide contra el mismo periodo del año anterior, o
  la referencia es el valor de hace un año, el punto de comparación DEBE quedar
  marcado en el gráfico.
- **FR-013**: La banda del rango meta del Banco de la República DEBE dibujarse en el
  verde que el sistema de diseño define para la meta, con su rótulo. La banda describe una zona de referencia oficial: la línea del dato NO
  DEBE cambiar de color según esté dentro o fuera de ella, y la tarjeta NO DEBE
  añadir etiquetas de "favorable" o "desfavorable" (spec 005, FR-006).
- **FR-014**: El color de la serie DEBE ser el azul de marca por defecto; en tema
  oscuro DEBE ser un azul más claro (`#3b82f6`) que mantenga un contraste mínimo de
  3:1 sobre la tarjeta. Esta es una excepción documentada, acotada al azul de marca,
  a la regla "los colores de series no cambian con el tema".

**Lectura sincronizada**

- **FR-015**: Al recorrer el gráfico de una tarjeta con cursor, toque o teclado, las
  cuatro tarjetas de la fila DEBEN mostrar el valor y el periodo correspondientes
  al mismo punto del eje. Un indicador sin dato en ese periodo DEBE mostrar "—" y
  explicar la causa sin inventar un valor. Al salir del gráfico, perder el foco o
  pulsar Escape, todas las tarjetas DEBEN volver a su dato vigente; en
  dispositivos táctiles, un instante después de soltar.
- **FR-016**: El gráfico DEBE poder enfocarse con teclado y recorrerse con las
  flechas (un periodo), Inicio y Fin; DEBE comunicar a las tecnologías de
  asistencia el indicador, el periodo y el valor de la posición actual, y su foco
  DEBE ser visible en ambos temas.

**Detalle y rigor de datos**

- **FR-017**: Cada tarjeta DEBE incluir un botón rotulado con el nombre corto de la
  fuente ("Fuente: …") que abre y cierra el detalle con ratón, toque o teclado y
  comunica su estado expandido o contraído. El detalle DEBE contener: la
  explicación en lenguaje sencillo, la frase de posición frente a la referencia, el
  nombre oficial de la fuente como enlace, el indicador exacto medido, la fecha de
  corte, la ventana de la serie y el enlace al dashboard.
- **FR-018**: El nombre corto de la fuente y el periodo del dato DEBEN estar
  visibles sin interacción en todas las tarjetas (PRD-05, constitución principio
  II). Un indicador cuyo dataset supere el umbral de frescura DEBE llevar la
  etiqueta "dato no reciente" junto al periodo.
- **FR-019**: Toda cifra, periodo, cambio, referencia, serie y fuente del panel
  DEBE provenir de los datasets publicados; ninguna se escribe a mano. Los valores
  mostrados DEBEN ser idénticos a los de hoy. Esta feature NO DEBE requerir datos
  nuevos del pipeline ni modificar los datasets.
- **FR-020**: Los valores, periodos, cambios, nombres de fuente y el contenido del
  detalle DEBEN estar presentes en el contenido inicial de la página, legibles sin
  ejecutar scripts; el gráfico y la lectura sincronizada son una mejora.
- **FR-021**: Un indicador sin dato DEBE ocultarse o mostrarse como "sin dato";
  nunca se rellena con un valor supuesto.

**Agrupación**

- **FR-022**: El panel NO DEBE llevar rótulos temáticos: "Sector externo" queda
  repartido entre las dos filas (dólar en "Cada mes", cuenta corriente en "Cada
  año") y cada tarjeta enlaza al dashboard de su dominio.

**Identidad, accesibilidad y responsive**

- **FR-023**: El panel DEBE usar únicamente los tokens del sistema de diseño y
  funcionar en tema claro y oscuro con contraste de 4.5:1 para texto normal y 3:1
  para texto grande y elementos gráficos; en tema oscuro las tarjetas DEBEN
  distinguirse del fondo por luminosidad (spec 007). El aspecto del resto de la
  portada NO DEBE cambiar.
- **FR-024**: El panel DEBE mostrar cuatro columnas por fila en escritorio, dos en
  tableta y una en teléfono, sin desplazamiento horizontal a 375 px, y sin cortar
  ni desbordar valores largos.
- **FR-025**: El panel DEBE mantener una jerarquía de títulos coherente (título del
  panel, título de cada fila y nombre de cada indicador) y respetar la preferencia
  de reducción de movimiento.
- **FR-026**: La referencia y la dirección del cambio NO DEBEN usar color para
  juzgar si un valor es favorable o desfavorable (spec 005, FR-006 y FR-007). La
  banda verde de la meta (FR-013) es la única referencia con color propio y solo
  señala la zona oficial, no evalúa el dato.

### Enmiendas a la spec 005

Esta feature reemplaza los siguientes requisitos de `005-landing-observatorio`; el
resto de esa spec sigue vigente.

| Requisito 005 | Hoy dice | Cambia a |
| --- | --- | --- |
| FR-004 | Cada tarjeta muestra nombre, valor, periodo, cambio, tendencia, fuente y una línea de significado. | Lo mismo en tres niveles: la tendencia pasa a ser el gráfico principal y el significado, la fuente completa y el enlace pasan al detalle (FR-004, FR-017). |
| FR-005 | Agrupación por tema (Precios y dinero, Actividad y bienestar, Empleo, Sector externo, Contexto). | Agrupación por ritmo de publicación, sin rótulos temáticos (FR-002, FR-022). |
| FR-006 | La referencia se muestra como frase. | La referencia se dibuja en el gráfico; la frase sigue disponible en el detalle (FR-011). |
| FR-008 | Un enlace al dashboard en cada tarjeta. | El nombre del indicador es ese enlace (FR-006). |

### Key Entities *(include if feature involves data)*

- **Indicador clave:** una de las 8 cifras del panel. Tiene nombre en lenguaje
  sencillo, valor actual con unidad, periodo, cambio frente a un periodo de
  comparación, serie reciente, referencia, fuente y dashboard destino. Todo se
  deriva de los datasets publicados.
- **Serie:** valores recientes del indicador (últimos 24 meses o últimos 20 años).
  Es la materia del gráfico.
- **Referencia:** punto de comparación objetivo del indicador, de tres tipos: rango
  meta oficial (inflación), promedio de 20 años (tasa, desempleo, crecimiento del
  PIB, cuenta corriente) o valor de hace un año (dólar, PIB por habitante, salario
  mínimo).
- **Ritmo de publicación:** mensual o anual; define a qué fila pertenece un
  indicador y su eje de tiempo compartido.
- **Lectura:** periodo que el visitante selecciona al recorrer un gráfico; en
  una fila, todas las tarjetas muestran el valor de esa lectura.
- **Detalle de la tarjeta:** información de apoyo (significado, posición frente a
  la referencia, fuente oficial, indicador medido, fecha de corte, ventana de la
  serie, enlace al dashboard).
- **Forma del gráfico:** cada indicador tiene la suya:

| Indicador | Ritmo | Forma | Referencia dibujada |
| --- | --- | --- | --- |
| Inflación anual | Mensual | Línea con área | Banda del rango meta (2–4 %) |
| Tasa de intervención del Banco de la República | Mensual | Escalones | Promedio de 20 años |
| Tasa de desempleo | Mensual | Línea con área | Promedio de 20 años y punto de comparación del año anterior |
| Dólar (TRM) | Mensual | Línea con área | Valor de hace un año |
| Crecimiento del PIB | Anual | Barras desde cero | Promedio de 20 años |
| PIB por habitante | Anual | Línea con área | Valor de hace un año |
| Cuenta corriente | Anual | Barras que cuelgan de cero | Promedio de 20 años |
| Salario mínimo | Anual | Escalera anual desde cero | Valor de hace un año |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sin interactuar, cada tarjeta muestra como máximo cinco elementos de
  texto fuera del gráfico (nombre, valor, periodo, cambio y fuente corta), frente a
  los 8–9 actuales.
- **SC-002**: El gráfico es el elemento de mayor área en las 8 tarjetas, ocupa todo
  su ancho y mide al menos 150 px de alto (hoy, 48 px).
- **SC-003**: En una prueba con 5 personas que no conocen el panel, al menos 4
  identifican en menos de 5 segundos, para un indicador elegido por quien evalúa,
  su valor, su periodo y si subió o bajó.
- **SC-004**: El 100 % de los valores, periodos, cambios, referencias y series del
  panel coincide con los datasets publicados (cero diferencias) y con los valores
  que muestra hoy el panel.
- **SC-005**: El 100 % de los textos y elementos gráficos del panel cumple el
  contraste mínimo (4.5:1 texto normal, 3:1 texto grande y gráficos) en tema claro
  y en tema oscuro.
- **SC-006**: El panel se usa sin desplazamiento horizontal a 375 px de ancho y se
  muestra en 4, 2 y 1 columnas en escritorio, tableta y teléfono respectivamente.
- **SC-007**: El 100 % de los gráficos y botones de detalle es alcanzable y operable
  solo con teclado, con foco visible en ambos temas.
- **SC-008**: Con scripts desactivados, el 100 % de valores, periodos, cambios,
  fuentes y contenido de detalle sigue legible en la página.
- **SC-009**: Al recorrer el gráfico de cualquier tarjeta, las cuatro tarjetas de la
  fila muestran el mismo periodo en el 100 % de las pruebas con ratón, toque y
  teclado, y vuelven a su dato vigente al salir.
- **SC-010**: La feature no añade ni modifica ningún dataset del Observatorio, y la
  portada no se percibe más lenta que hoy al cargar (el contenido principal
  aparece al mismo tiempo o antes).

## Assumptions

- El panel conserva su lugar en la portada (bajo el hero y el menú del
  Observatorio, dentro del contenedor blueprint) y su encabezado "Cómo va
  Colombia" con la fecha de actualización.
- Los 8 indicadores, sus textos de significado, sus fuentes, sus enlaces y sus
  referencias son los actuales; esta feature cambia solo su presentación.
- La ventana de la serie es la actual: últimos 24 meses para los indicadores
  mensuales y últimos 20 años para los anuales.
- La tasa del Banco de la República se publica como promedio mensual, por lo que en
  los meses de cambio los escalones muestran valores intermedios; no se dispone de
  las fechas exactas de decisión y esta feature no las requiere.
- El dato del dólar del mes en curso es un promedio parcial y se muestra tal como
  lo publica el dataset.
- La maqueta aprobada es la referencia de diseño (formas, filas, niveles y
  lectura sincronizada); los detalles finos se resuelven en el plan.
- La técnica con que se dibuja el gráfico es una decisión del plan. Si exige una
  excepción a las reglas de arquitectura o de diseño vigentes (por ejemplo,
  dibujar las series al construir el sitio en vez de cargarlas en el cliente), el
  autor debe aprobarla.
- El umbral de "dato no reciente" es el actual del Observatorio.
- Los dashboards destino no cambian.

## Dependencies

- **Aprobación del autor** de las enmiendas a la spec 005 (tabla anterior). Las tres
  clarificaciones de diseño ya están resueltas (sesión 2026-11-10).
- **Reescritura de las reglas UI-07 y UI-08** en `agents/DESIGN-SYSTEM.md`: sus
  excepciones aprobadas (spec 005, 2026-10-19) se justifican por "miniatura de
  48 px, sin ejes, estáticas", y eso deja de ser cierto. La nueva justificación es
  que cada indicador tiene asignada su forma de gráfico.
- **Excepción documentada** en `agents/DESIGN-SYSTEM.md` (sección 2.9) a la regla
  "los colores de series no cambian con el tema", para el azul de marca en tema
  oscuro (FR-014).
- **Actualización de documentos vivos:** `agents/DESIGN-SYSTEM.md` (sección 5.5 y
  catálogo de componentes) y, si cambia el modelo de datos del panel,
  `agents/ARCHITECTURE.md`.
- **Componentes afectados:** la tarjeta de indicador clave, el catálogo de
  indicadores clave del Observatorio, la página de la portada del Observatorio y
  las definiciones de las miniaturas de tendencia.
- **Spec 007 (tema claro/oscuro):** el panel debe consumir los tokens de ambos
  temas y reaccionar al cambio de tema.
- **Datasets existentes** del Observatorio (inflación, empleo, PIB, externo y
  salario mínimo) con su contrato actual; sin cambios.
