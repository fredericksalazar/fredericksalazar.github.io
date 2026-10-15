# Feature Specification: Estandarizar los gráficos de línea

**Feature Branch**: `feature/001-estandarizar-graficos`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Estandarizar los gráficos de línea del Observatorio. Hoy solo algunos gráficos de línea permiten cambiar entre vista de línea y de barras, y las etiquetas de las líneas de referencia (promedio, máximo, mínimo, meta) aparecen unas a la izquierda y otras a la derecha, tapando el dato más reciente. Queremos que el visitante tenga la misma experiencia en todos los gráficos: todo gráfico de línea ofrece el cambio Línea ↔ Barras, y todas las etiquetas de referencia van a la izquierda con el mismo formato. Debe cumplir UI-08 y UI-10 de agents/DESIGN-SYSTEM.md y el principio III (reutilización) de la constitución. Objetivo: autoridad (O1). Pilar: Observatorio y Blog. Contribuye a la consistencia visual (PRD-04) y a la credibilidad del Observatorio como fuente citable (KPI de autoridad)."

## Contexto de producto *(Constitution Check G1)*

| Campo | Valor |
|---|---|
| Objetivo | O1 · Autoridad |
| Pilares | Observatorio de Datos de Colombia; Blog (los mismos gráficos se publican en artículos) |
| KPI | Autoridad: credibilidad del Observatorio como fuente citable y enlazable |
| Principios de producto | PRD-04 (una sola identidad visual) |
| Reglas que cumple | UI-08, UI-10 (`agents/DESIGN-SYSTEM.md`); principio III de la constitución |
| Módulos afectados | Observatorio (gráficos); Blog (artículos que incrustan esos gráficos) |

**Situación actual:** de aproximadamente 25 gráficos que muestran series como
línea, solo 3 permiten cambiar a barras, y existen al menos dos formas distintas
de hacer ese cambio. Las etiquetas de referencia se ubican en lados distintos
según el gráfico, y en algunos casos tapan el último dato publicado, que es el
más importante para el lector.

## Clarifications

### Session 2026-10-14

- Q: Al unificar las líneas de referencia, ¿cambia solo la etiqueta o también la línea (color, grosor, trazo)? → A: Etiqueta y línea según la sección 6.4 de DESIGN-SYSTEM; las referencias con significado propio (p. ej. la meta de inflación) conservan su color semántico.
- Q: Cuando dos etiquetas de referencia quedan muy juntas, ¿cómo se muestran? → A: Se combinan en una sola etiqueta (p. ej. "Promedio · 6,1 % · Meta · 6,0 %").
- Q: ¿Se mide en Google Analytics el uso del cambio Línea ↔ Barras? → A: No, sin medición en esta feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Etiquetas de referencia que no tapan el dato reciente (Priority: P1)

Un visitante abre un gráfico del Observatorio que muestra el promedio, el máximo,
el mínimo o una meta. Todas esas etiquetas aparecen del lado izquierdo, con el
mismo formato ("Etiqueta · valor"), y el tramo más reciente de la serie, a la
derecha, queda despejado.

**Why this priority**: el último dato es la razón principal por la que alguien
consulta el Observatorio. Si una etiqueta lo tapa, el gráfico falla en su función
básica y resta credibilidad. Además es el cambio de menor riesgo y mayor
visibilidad.

**Independent Test**: abrir cada gráfico que tenga líneas de referencia y
comprobar que todas sus etiquetas están a la izquierda, con el mismo formato, y
que ninguna se superpone al último punto de la serie.

**Acceptance Scenarios**:

1. **Given** un gráfico con línea de promedio, **When** el visitante lo abre,
   **Then** la etiqueta del promedio aparece a la izquierda del área del gráfico
   con el formato "Promedio · valor".
2. **Given** un gráfico con meta (p. ej. meta de inflación), **When** el
   visitante lo abre, **Then** la etiqueta de la meta aparece a la izquierda con
   el mismo formato que las demás referencias.
3. **Given** cualquier gráfico con referencias, **When** el visitante mira el
   tramo más reciente de la serie, **Then** ninguna etiqueta de referencia lo
   cubre.

---

### User Story 2 - Cambiar cualquier gráfico de línea a barras (Priority: P2)

Un visitante que lee un gráfico de línea prefiere comparar valores período por
período. En la cabecera del gráfico encuentra el control "Línea | Barras" y, al
elegir "Barras", la misma serie se muestra como barras, conservando las líneas de
referencia. Puede volver a "Línea" cuando quiera.

**Why this priority**: da al lector control sobre cómo leer los datos y unifica
la experiencia en todo el sitio; es más trabajo que la historia 1 porque afecta a
más gráficos.

**Independent Test**: abrir cualquier gráfico de línea incluido en el alcance,
usar el control para cambiar a barras y volver a línea, y comprobar que los datos,
el título, la fuente y las referencias no cambian.

**Acceptance Scenarios**:

1. **Given** un gráfico de línea dentro del alcance, **When** el visitante lo
   abre, **Then** ve el control "Línea | Barras" en la cabecera, a la derecha,
   con "Línea" activo.
2. **Given** el gráfico en vista de línea, **When** el visitante elige "Barras",
   **Then** la serie se muestra como barras con los mismos valores y las mismas
   líneas de referencia.
3. **Given** el gráfico en vista de barras, **When** el visitante elige "Línea",
   **Then** vuelve a la vista original sin recargar la página.
4. **Given** varios gráficos en la misma página, **When** el visitante cambia uno
   a barras, **Then** los demás no cambian.

---

### User Story 3 - La misma experiencia en el blog (Priority: P3)

Un lector de un artículo del blog que incluye un gráfico del Observatorio obtiene
exactamente el mismo comportamiento (etiquetas a la izquierda y control Línea |
Barras) que en el Observatorio, porque es el mismo gráfico.

**Why this priority**: es consecuencia directa de las historias 1 y 2 al reutilizar
el mismo gráfico; solo requiere verificación.

**Independent Test**: abrir un artículo que incrusta un gráfico de línea del
Observatorio y comprobar el mismo comportamiento que en su página de origen.

**Acceptance Scenarios**:

1. **Given** un artículo que incrusta un gráfico de línea del Observatorio,
   **When** el lector lo abre, **Then** ve el mismo control y las mismas
   etiquetas que en el Observatorio.

---

### Edge Cases

- **Series con valores faltantes:** al pasar a barras, los períodos sin dato
  quedan vacíos (no se muestran como cero).
- **Gráficos con varias series de línea:** en vista de barras, las series se
  muestran agrupadas por período y conservan sus colores.
- **Gráficos mixtos** (barras y línea a la vez, o dos ejes): sí llevan el control
  Línea | Barras; al elegir "Barras" solo las series que son línea pasan a barras,
  las que ya eran barras no cambian, y en doble eje cada serie conserva su eje.
- **Gráficos que ya tienen otros controles** (p. ej. el selector de presidentes
  o rangos de tiempo): el control Línea | Barras convive con ellos en la cabecera
  sin desplazarlos ni duplicarse.
- **Pantallas estrechas:** el control sigue visible y usable en móvil.
- **Etiquetas de referencia muy próximas** (p. ej. promedio y meta casi iguales):
  si se superpondrían, se combinan en una sola etiqueta a la izquierda con ambos
  textos separados por " · " (p. ej. "Promedio · 6,1 % · Meta · 6,0 %"); cada
  línea se sigue dibujando por separado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todas las etiquetas de líneas de referencia (promedio, máximo,
  mínimo, meta y cualquier otra referencia horizontal) DEBEN ubicarse en el lado
  izquierdo del área del gráfico.
- **FR-002**: Todas las etiquetas de referencia DEBEN tener el mismo formato:
  texto "Etiqueta · valor", valor en formato numérico colombiano (coma decimal),
  tamaño, colores y fondo definidos en la sección 6.4 de `agents/DESIGN-SYSTEM.md`.
  Las **líneas** de referencia también se unifican según esa sección: Máx rojo,
  Promedio gris, Mín verde, trazo discontinuo de 1,5 px. Las referencias con
  significado propio (p. ej. la meta de inflación y su banda) conservan su color
  semántico, pero su etiqueta sigue el mismo formato y posición.
- **FR-003**: Ninguna etiqueta de referencia DEBE cubrir el último dato de la
  serie ni superponerse a otra etiqueta; las etiquetas que se superpondrían se
  combinan en una sola.
- **FR-004**: Todo gráfico de línea dentro del alcance DEBE ofrecer el control
  "Línea | Barras" en su cabecera, a la derecha, con "Línea" como vista inicial.
- **FR-005**: Al cambiar de vista, el gráfico DEBE conservar los mismos datos,
  título, fuente, colores y líneas de referencia.
- **FR-006**: El cambio de vista DEBE ocurrir sin recargar la página y DEBE
  afectar solo al gráfico en el que se usa.
- **FR-007**: El control DEBE ser accesible: operable con teclado y con el estado
  activo anunciado a tecnologías de asistencia.
- **FR-008**: Existe **una sola** forma de ofrecer el cambio Línea | Barras y
  **una sola** forma de generar las etiquetas de referencia en todo el sitio; las
  implementaciones alternativas existentes DEBEN reemplazarse por esa forma única
  (principio III de la constitución).
- **FR-009**: Los gráficos del blog que reutilizan gráficos del Observatorio
  DEBEN heredar el comportamiento sin cambios propios.
- **FR-010**: El alcance son **los gráficos del Observatorio** (sus dashboards de
  inflación y tasas, monetario, PIB, empleo, comercio y demografía). Los gráficos
  que existen solo en el blog, como los comparativos "Colombia vs rival", quedan
  fuera de esta feature.
- **FR-011**: La documentación afectada en `agents/` DEBE actualizarse si el
  cambio altera algo descrito en ella.

### Key Entities

- **Gráfico de línea**: visualización de una o más series a lo largo del tiempo,
  identificada por un id único y reutilizable en cualquier página.
- **Línea de referencia**: valor horizontal de contexto (promedio, máximo,
  mínimo, meta) con su etiqueta.
- **Vista**: modo de presentación del gráfico (línea o barras), elegido por el
  visitante.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los gráficos del Observatorio con líneas de referencia
  muestran sus etiquetas a la izquierda y con el mismo formato.
- **SC-002**: El 100 % de los gráficos de línea dentro del alcance ofrecen el
  control "Línea | Barras" (hoy: 3 de unos 25).
- **SC-003**: En ningún gráfico del Observatorio una etiqueta de referencia cubre
  el último dato.
- **SC-004**: Existe una única forma de implementar el cambio de vista y una única
  forma de generar etiquetas de referencia (hoy hay al menos dos de cada una).
- **SC-005**: Un visitante cambia de vista en un solo clic y el gráfico responde
  de inmediato, sin recargar la página.
- **SC-006**: No hay regresiones: todos los gráficos de las páginas afectadas
  siguen cargando con sus datos, y el sitio compila sin errores nuevos.

## Assumptions

- La vista inicial de todo gráfico de línea es "Línea".
- La preferencia de vista no se recuerda entre visitas ni entre gráficos.
- El uso del cambio de vista no se mide en analítica (decisión del autor).
- El alcance no incluye mapas, gráficos de barras puros, de áreas apiladas,
  matrices ni gráficos de pastel; no se les agrega el control.
- No se agregan líneas de referencia nuevas a gráficos que hoy no las tienen;
  solo se unifica la posición y el formato de las existentes.
- Los gráficos de las páginas de elecciones están fuera del alcance porque no son
  gráficos de línea de serie temporal.
- Los comparativos "Colombia vs rival" (solo en el blog) están fuera del alcance
  por decisión del autor; quedan pendientes para una feature posterior y, mientras
  tanto, son una excepción conocida a UI-08 y UI-10.
- Los artículos del blog que incrustan gráficos del Observatorio reciben el cambio
  automáticamente, porque reutilizan el mismo gráfico (historia 3).
- No cambian los datos, los colores de las series ni los textos de los gráficos.
