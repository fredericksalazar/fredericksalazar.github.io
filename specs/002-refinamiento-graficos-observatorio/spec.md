# Feature Specification: Refinamiento gráfico del Observatorio

**Feature Branch**: `feature/ui-refinement`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Vamos a hacer una serie de ajustes y refinamientos gráficos a la página del Observatorio. 1) Los gráficos de líneas tienen la opción de cambiar entre líneas o barras con un botón que activa uno u otro; quiero que ese objeto sea un toggle button. 2) Todos los gráficos de barras que tienen soporte para color de presidente deben iniciar con el color por defecto: el toggle 'Color por presidente' debe ir desactivado y es el usuario quien lo activa si lo desea. 3) El gráfico 1 de Empleo (histórico del desempleo en Colombia) debe tener las líneas de máximo, mínimo y promedio. 4) Los gráficos 1, 2 y 3 de Comercio Exterior deben tener también las líneas de máximo, mínimo y promedio. 5) El gráfico 4 de PIB debe tener las líneas estadísticas máximo, mínimo y promedio. 6) El gráfico 3 de Demografía también debe tener las líneas estadísticas máximo, mínimo y promedio."

## Contexto de producto *(Constitution Check G1)*

| Campo | Valor |
|---|---|
| Objetivo | O1 · Autoridad |
| Pilares | Observatorio de Datos de Colombia; Blog (los mismos gráficos se incrustan en artículos) |
| KPI | Autoridad: credibilidad del Observatorio como fuente citable y enlazable |
| Principios de producto | PRD-04 (una sola identidad visual) |
| Reglas que toca | UI-08 (control Línea ↔ Barras), UI-10 (etiquetas de referencia a la izquierda), UI-12 (accesibilidad); principios III y IV de la constitución |
| Módulos afectados | Observatorio (gráficos, su control de vista y el estilo de todas las líneas de máximo/mínimo/promedio); Blog (artículos que incrustan esos gráficos) |

**Gráficos objetivo de las líneas estadísticas** (numeración visible en cada
página del Observatorio):

| Página | Panel | Gráfico |
|---|---|---|
| Empleo | 01 | Desempleo histórico de Colombia |
| Comercio Exterior | 01 | Exportaciones de Colombia (% del PIB) |
| Comercio Exterior | 02 | Importaciones colombianas (% del PIB) |
| Comercio Exterior | 03 | Balanza comercial (% del PIB) |
| PIB | 04 | Deuda pública como % del PIB |
| Inflación vs Tasa | 01 | Inflación histórica de Colombia (se suma a la meta BanRep) |
| Inflación vs Tasa | 06 | Diferencial tasa BanRep − inflación (pp) |

**Fuera de alcance:** el gráfico 03 de Demografía (esperanza de vida) queda sin
líneas estadísticas por decisión del autor (ver Clarifications).

**Situación actual:**

- El cambio entre línea y barras se hace con dos botones contiguos ("Línea" |
  "Barras"), mientras que otros controles del mismo encabezado (p. ej. "Color por
  presidente") son un interruptor. El visitante ve dos lenguajes de control
  distintos en la misma card.
- Algunos gráficos de barras arrancan con el color por presidente encendido
  (p. ej. inflación histórica), y otros apagado. No hay una regla única.
- De los siete gráficos objetivo, el de desempleo histórico y el de inflación
  histórica solo muestran el promedio, y los demás no muestran ninguna línea
  estadística.

## Clarifications

### Session 2026-10-15

- Q: ¿Cómo se llama el interruptor de vista y cuál es su estado por defecto? → A: "Ver en barras"; apagado = línea (vista por defecto), encendido = barras.
- Q: ¿Sobre qué rango se calculan máximo, mínimo y promedio? → A: Sobre toda la serie publicada en el gráfico, no sobre una ventana de años.
- Q: ¿Qué colores usan las líneas de máximo, mínimo y promedio? → A: Gris neutro `#64748b` para las tres; se distinguen por la etiqueta ("Máx", "Mín", "Prom") y el trazo (discontinuo en máximo y mínimo, punteado en promedio). No se usa rojo/verde para no asignar "bueno/malo" a los extremos.
- Q: ¿El gris neutro aplica solo a los seis gráficos nuevos o a todos los que ya muestran máximo/mínimo/promedio? → A: A todos (Observatorio y blog); la meta BanRep conserva su verde punteado por tener significado propio.
- Q: El gráfico 03 de Demografía (esperanza de vida) tiene dos series (mujeres y hombres) y no hay serie total, ¿sobre qué se calculan las líneas? → A: A ese gráfico no se le agregan líneas estadísticas; queda fuera de alcance.
- Q: ¿Qué texto llevan las etiquetas de las líneas estadísticas? → A: "Máx", "Mín" y "Prom" en todo el sitio; desaparece "Promedio histórico" de los gráficos históricos.
- Q: (refinamiento posterior a la implementación) ¿Qué otros gráficos llevan Máx/Mín/Prom? → A: Inflación vs Tasa 01 (inflación histórica) y 06 (diferencial); en el 06 las líneas se calculan sobre el diferencial, no sobre la inflación superpuesta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver máximo, mínimo y promedio en los gráficos clave (Priority: P1)

Un visitante abre la página de Inflación vs Tasa, Empleo, Comercio Exterior o PIB y, en
los gráficos objetivo, ve de inmediato el valor máximo, el mínimo y el promedio
de toda la serie publicada, cada uno con su línea de referencia y su etiqueta a
la izquierda ("Máx · valor", "Mín · valor", "Prom · valor").

**Why this priority**: es el cambio que más valor de lectura agrega: permite
ubicar el dato actual frente a sus extremos históricos sin calcular nada, lo que
refuerza al Observatorio como fuente citable. Es independiente de los otros dos
cambios.

**Independent Test**: abrir cada uno de los siete gráficos objetivo y comprobar
que muestra las tres líneas, que los valores coinciden con el máximo, el mínimo
y el promedio de la serie publicada y que las etiquetas están a la izquierda.

**Acceptance Scenarios**:

1. **Given** la página de Empleo, **When** el visitante ve el panel 01
   (desempleo histórico), **Then** el gráfico muestra las líneas de máximo,
   mínimo y promedio con sus etiquetas a la izquierda y el formato de la serie
   (porcentaje).
2. **Given** la página de Comercio Exterior, **When** el visitante ve los paneles
   01, 02 y 03, **Then** cada gráfico muestra sus propias líneas de máximo, mínimo
   y promedio, calculadas sobre su propia serie.
3. **Given** la página de PIB, **When** el visitante ve el panel 04 (deuda
   pública), **Then** el gráfico muestra las líneas de máximo, mínimo y promedio.
4. **Given** un gráfico objetivo que ofrece vista de línea y de barras (deuda
   pública), **When** el visitante cambia entre vistas, **Then** las tres líneas estadísticas se mantienen
   visibles y en la misma posición.
5. **Given** un gráfico objetivo que ya tenía otra referencia (p. ej. la línea de
   cero de la balanza comercial), **When** se muestran las líneas estadísticas,
   **Then** la referencia previa se conserva y ninguna etiqueta tapa a otra.

---

### User Story 2 - Color por presidente apagado al cargar (Priority: P2)

Un visitante abre cualquier gráfico de barras que ofrece "Color por presidente".
El gráfico carga con el color por defecto (azul de marca) y el interruptor
"Color por presidente" aparece apagado. Si el visitante lo enciende, las barras
se colorean por presidente y aparece la leyenda; si lo apaga, vuelve al color
por defecto.

**Why this priority**: da una primera lectura limpia y neutral del dato, y deja
la lectura política (por gobierno) como una decisión explícita del visitante, en
línea con la neutralidad que exige la constitución. Es independiente de las
otras historias.

**Independent Test**: recorrer todos los gráficos que ofrecen "Color por
presidente" (en el Observatorio y en los artículos del blog que los incrustan) y
comprobar que todos cargan en el color por defecto con el interruptor apagado.

**Acceptance Scenarios**:

1. **Given** un gráfico de barras con soporte de color por presidente, **When**
   la página carga, **Then** las barras se ven en el color por defecto, el
   interruptor está apagado y la leyenda de presidentes está oculta.
2. **Given** ese mismo gráfico, **When** el visitante enciende el interruptor,
   **Then** las barras se colorean por presidente y se muestra la leyenda.
3. **Given** un gráfico de línea que ofrece color por presidente solo en vista de
   barras, **When** el visitante cambia a barras, **Then** el interruptor aparece
   apagado y el gráfico conserva el color por defecto hasta que lo encienda.
4. **Given** el gráfico de inflación histórica (que hoy arranca coloreado),
   **When** la página carga, **Then** arranca en el color por defecto como todos
   los demás.

---

### User Story 3 - Cambiar entre línea y barras con un interruptor (Priority: P3)

Un visitante quiere ver un gráfico de línea como barras. En el encabezado de la
card encuentra un interruptor con el mismo estilo que "Color por presidente".
Apagado, el gráfico se ve como línea; encendido, como barras. Todos los controles
del encabezado de la card hablan el mismo lenguaje visual.

**Why this priority**: mejora la consistencia visual (PRD-04) sin cambiar lo que
el visitante puede hacer; por eso va después de las dos historias que cambian lo
que el visitante ve.

**Independent Test**: abrir cualquier gráfico de línea del Observatorio o del
blog, comprobar que el control de vista es un interruptor, que alterna entre
línea y barras y que se opera con teclado.

**Acceptance Scenarios**:

1. **Given** un gráfico de línea, **When** la página carga, **Then** el
   encabezado muestra un interruptor de vista apagado y el gráfico se ve como
   línea.
2. **Given** ese gráfico, **When** el visitante enciende el interruptor, **Then**
   el gráfico se redibuja como barras; al apagarlo, vuelve a línea.
3. **Given** un gráfico con ambos interruptores (vista y color por presidente),
   **When** el visitante los ve, **Then** ambos tienen el mismo estilo, tamaño y
   alineación en el encabezado.
4. **Given** un visitante que navega con teclado o lector de pantalla, **When**
   llega al interruptor de vista, **Then** puede activarlo con el teclado, el foco
   es visible y el control anuncia su nombre y su estado (encendido/apagado).
5. **Given** un gráfico incrustado en un artículo del blog, **When** el visitante
   lo abre, **Then** el control de vista es el mismo interruptor que en el
   Observatorio.

---

### Edge Cases

- **Serie con valores negativos** (balanza comercial): máximo, mínimo y promedio
  se calculan sobre los valores con signo; el mínimo puede quedar por debajo de
  cero y debe coexistir con la línea de cero existente.
- **Etiquetas muy juntas**: si dos referencias quedan casi al mismo nivel (p. ej.
  promedio y máximo en una serie plana, o el promedio cerca de la línea de cero),
  se aplica la regla ya acordada en la spec 001: se combinan en una sola etiqueta.
- **Valores vacíos en la serie**: los años sin dato no cuentan para el máximo, el
  mínimo ni el promedio.
- **Máximo o mínimo repetido**: si el valor extremo se repite en varios años, se
  muestra una sola línea con ese valor.
- **Textos que asumen el color por presidente encendido**: descripciones como
  "Coloreada por presidente" o "Activa el color por presidente" deben seguir siendo
  ciertas con el interruptor apagado al cargar.
- **Promedio y meta BanRep juntos** (p. ej. inflación): ambos llevan trazo
  punteado; se distinguen por color (gris vs. verde) y por la etiqueta. Si quedan
  cerca, se combinan en una sola etiqueta según la regla de la spec 001.
- **Gráfico con solo vista de línea o solo de barras**: si un gráfico no ofrece
  las dos vistas, no muestra el interruptor de vista.
- **Cambio de vista con color por presidente encendido**: al volver a línea, el
  color por presidente se apaga (comportamiento actual) y el interruptor de color
  vuelve a apagado.

## Requirements *(mandatory)*

### Functional Requirements

**Líneas estadísticas (Historia 1)**

- **FR-001**: Los siete gráficos objetivo (Inflación vs Tasa 01 y 06; Empleo 01;
  Comercio Exterior 01, 02 y 03; PIB 04) DEBEN mostrar tres líneas de referencia: máximo,
  mínimo y promedio de toda la serie publicada en ese gráfico.
- **FR-002**: Los valores de las líneas DEBEN calcularse a partir de los datos
  publicados del gráfico; no se escriben a mano.
- **FR-003**: Las etiquetas DEBEN ir a la izquierda del área del gráfico, con el
  formato "Etiqueta · valor" y la unidad y los decimales de la serie (UI-10).
- **FR-004**: Las tres líneas y sus etiquetas DEBEN usar el gris neutro
  `#64748b`; se distinguen por el texto de la etiqueta y por el trazo:
  discontinuo en máximo y mínimo, punteado en el promedio. No se usa color para
  sugerir que un extremo es bueno o malo. Excepción: una etiqueta combinada
  (spec 001) usa la tinta de texto `#475569`.
- **FR-004b**: Las etiquetas DEBEN decir exactamente "Máx", "Mín" y "Prom" en
  todos los gráficos del sitio (sin variantes como "Promedio" o "Promedio
  histórico").
- **FR-004a**: El estilo de FR-004 DEBE aplicarse a TODOS los gráficos del sitio
  que muestran máximo, mínimo o promedio (no solo a los siete objetivo), desde una
  sola definición; la meta BanRep conserva su verde punteado.
- **FR-005**: Las líneas estadísticas DEBEN mantenerse en ambas vistas (línea y
  barras).
- **FR-006**: Las referencias que un gráfico objetivo ya tenía (p. ej. la línea de
  cero de la balanza comercial) DEBEN conservarse.

**Color por presidente (Historia 2)**

- **FR-007**: Todo gráfico que ofrece "Color por presidente" DEBE cargar con el
  color por defecto, el interruptor apagado y la leyenda de presidentes oculta,
  sin excepciones.
- **FR-008**: Al encender el interruptor, el gráfico DEBE colorearse por
  presidente y mostrar la leyenda; al apagarlo, DEBE volver al color por defecto y
  ocultar la leyenda.
- **FR-009**: Los textos descriptivos de los gráficos afectados (pregunta,
  descripción accesible, lead del panel) NO DEBEN afirmar que el gráfico ya se
  muestra coloreado por presidente al cargar.

**Interruptor de vista (Historia 3)**

- **FR-010**: En todo gráfico que ofrece vista de línea y de barras, el control de
  vista DEBE ser un interruptor (encendido/apagado) en lugar de dos botones.
- **FR-011**: El interruptor de vista DEBE tener el mismo estilo visual que el
  interruptor "Color por presidente" (forma, tamaño, colores, tipografía y
  alineación en el encabezado de la card).
- **FR-012**: El interruptor de vista DEBE tener una etiqueta visible que indique
  qué hace al encenderse ("Ver en barras"); apagado, el gráfico se muestra como
  línea, y encendido, como barras.
- **FR-013**: El interruptor de vista DEBE ser operable con teclado, tener foco
  visible y exponer a tecnologías de asistencia su nombre y su estado (UI-12).
- **FR-014**: El cambio DEBE aplicarse a todos los gráficos con dos vistas, en el
  Observatorio y en los artículos del blog que los incrustan, a partir de una sola
  definición del control (principio III).

**Documentación**

- **FR-015**: La documentación de diseño y del módulo del Observatorio DEBE
  actualizarse para describir: el interruptor de vista (UI-08), la regla de que el
  color por presidente arranca apagado, el nuevo color y trazo de las líneas de
  máximo, mínimo y promedio (sección 6.4 de DESIGN-SYSTEM) y la lista de gráficos
  con líneas estadísticas.

### Key Entities

- **Línea estadística**: referencia horizontal de un gráfico (máximo, mínimo o
  promedio) con un valor calculado a partir de la serie publicada y una etiqueta
  "Etiqueta · valor".
- **Interruptor de vista**: control binario del encabezado de la card que alterna
  la representación de una serie entre línea (apagado) y barras (encendido).
- **Interruptor "Color por presidente"**: control binario que alterna entre el
  color por defecto (apagado, estado inicial) y el color por gobierno con su
  leyenda (encendido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los 7 gráficos objetivo (7 de 7) muestran las líneas de máximo,
  mínimo y promedio, y sus valores coinciden con los de la serie publicada.
- **SC-002**: El 100 % de los gráficos con "Color por presidente" cargan con el
  color por defecto y el interruptor apagado (0 excepciones).
- **SC-003**: El 100 % de los gráficos con dos vistas usan el interruptor de vista;
  no queda ningún control de vista de dos botones en el sitio.
- **SC-004**: El 100 % de los controles de vista se pueden activar solo con
  teclado y anuncian su estado a un lector de pantalla.
- **SC-005**: En ninguno de los 7 gráficos objetivo una etiqueta de referencia
  tapa a otra ni al último dato de la serie.
- **SC-006**: El 100 % de los gráficos del sitio con máximo, mínimo o promedio
  muestran esas líneas en gris neutro; ninguno las muestra en rojo o verde.
- **SC-007**: Ningún gráfico pierde funcionalidad: todo lo que hoy se puede hacer
  (cambiar de vista, colorear por presidente, ver referencias existentes) se sigue
  pudiendo hacer.

## Assumptions

- **Numeración**: "gráfico N" se refiere al número de panel visible en cada
  página (01, 02…). En Comercio Exterior, los gráficos de participación por grupo
  OMC no tienen número y no cuentan.
- **Estilo del interruptor de vista**: se reutiliza el interruptor existente de
  "Color por presidente" como modelo; no se crea un estilo nuevo.
- **Vista inicial**: la vista con la que arranca cada gráfico no cambia.
- **Interruptores en móvil**: todos los interruptores de la cabecera (vista,
  color por presidente, "Mostrar inflación") muestran su texto también en móvil;
  la cabecera envuelve a otra línea si no cabe.
- **Alcance del color por presidente**: aplica a todos los gráficos que hoy ofrecen
  el interruptor, en cualquier página o artículo, no solo en el Observatorio.
- **Sin datos nuevos**: la feature no agrega ni modifica datasets; solo cambia cómo
  se presentan los datos existentes.
- **Sin medición**: no se agrega medición de uso de los interruptores en Google
  Analytics (igual que en la spec 001).
- **Colores**: el color de las líneas estadísticas se consultó al autor
  (ver Clarifications); `#64748b` ya existe en el sistema de diseño, así que no se
  introduce un token nuevo.
- **Dependencia**: se apoya en lo construido en la spec 001 (control de vista
  único, generador único de líneas de referencia y regla de etiquetas combinadas).
