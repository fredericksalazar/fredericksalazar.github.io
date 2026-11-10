# Feature Specification: Modo claro y modo oscuro en todo el sitio

**Feature Branch**: `feature/dark-mode`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "quiero implementar en todo el website el modo dark y el modo light, vamos a agregar en el sidebar derecho una seccion para que el usuario pueda seleccionar el modo de la pagina web con las siguientes especificaciones:
1 - detectar automáticamente el modo del usuario, es decir si es dark entonces activa la web en modo dark y si es light entonces el modo claro actual
2 - en el sidebar el usuario puede seleccionar que quiere, puede ser usarlo en modo dark, light o automático
3 - la nueva seccion de botones debe estar en el sidebar derecho debajo de la linea horizontal que divide el nombre de los Kpis
4 - cada selector debe tener un icono respectivo"

## Contexto de producto *(obligatorio por la constitución, principio I)*

- **Objetivo:** autoridad (principal) y monetización por arrastre. Un sitio que se
  adapta a la preferencia visual del visitante proyecta el mismo rigor de
  ingeniería que el autor demuestra en el Observatorio y mejora la permanencia y
  la percepción de calidad de toda la marca.
- **Pilar:** transversal a P1 (CV digital), P2 (Proyectos), P3 (Observatorio) y
  P4 (Blog); no se limita a una sola página.
- **Audiencias:** A1 y A2 (reclutadores y líderes técnicos, que convierten) y
  A3, A4 y A5 (comunidad, ciudadanía y buscadores/asistentes, que amplifican).
- **KPIs:** K3 · Tráfico orgánico (mayor permanencia y menor rebote por confort
  visual) y K5 · Autoridad (percepción de calidad e ingeniería del sitio). K4 ·
  Conversiones se ve favorecido indirectamente al mantener al visitante más tiempo
  frente a los CTAs.

> **Nota de gobernanza:** el sistema de diseño vigente y el principio IV de la
> constitución declaran hoy una identidad de **solo modo claro** (fondo blanco).
> Esta feature amplía esa identidad visual; su implementación requiere la enmienda
> correspondiente de `agents/DESIGN-SYSTEM.md`
> y de `agents/PRODUCT.md` (PRD-04) aprobada por el autor. La spec describe el
> comportamiento esperado; la aprobación del cambio de identidad es una decisión
> del autor.

## Clarifications

### Session 2026-11-10

- Q: El sitio solo tiene un sidebar global fijo a la izquierda; ¿dónde debe ir exactamente la sección de tema que pediste en el "sidebar derecho"? → A: Bajo el perfil, sobre los KPIs (en el sidebar existente, justo debajo de la línea horizontal que separa el nombre/perfil del autor de la fila de KPIs rápidos).
- Q: ¿Los tres selectores de tema deben mostrar solo el ícono o también una etiqueta de texto visible? → A: Ícono + etiqueta (cada opción muestra su ícono y el texto visible Automático/Claro/Oscuro).
- Q: ¿Qué criterio de color debe seguir el modo oscuro para conservar la identidad de marca? → A: Azul de marca + grises oscuros (fondo y superficies en grises muy oscuros, no negro puro, conservando el azul de marca como acento).
- Q: En modo oscuro, ¿cómo deben tratarse las imágenes y logos que hoy tienen fondo blanco o claro? → A: Ajustar solo cuando haga falta (no invertir fotos ni logos; aplicar contenedores, bordes o fondos sutiles únicamente donde el fondo claro rompa el contraste).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El sitio respeta la preferencia del sistema desde la primera visita (Priority: P1)

Un visitante que nunca ha estado en el sitio entra con su sistema operativo o
navegador configurado en modo oscuro. El sitio se muestra directamente en modo
oscuro, sin que el visitante tenga que hacer nada. Si su sistema está en modo
claro, el sitio se muestra con el aspecto claro actual. La detección ocurre antes
de que el contenido sea visible, de modo que no hay un destello del tema
equivocado.

**Why this priority**: es la especificación explícita del autor (punto 1) y el
comportamiento por defecto que todo visitante experimenta. Sin esto, el selector
manual carece de una base coherente.

**Independent Test**: abrir cualquier página del sitio en un dispositivo con el
sistema en modo oscuro y en otro con modo claro, sin preferencia guardada, y
verificar que cada uno muestra el tema correspondiente desde el primer pintado y
sin destellos.

**Acceptance Scenarios**:

1. **Given** un visitante sin preferencia guardada y un sistema operativo en modo
   oscuro, **When** abre cualquier página del sitio, **Then** la página se muestra
   en modo oscuro y ningún elemento queda ilegible.
2. **Given** un visitante sin preferencia guardada y un sistema operativo en modo
   claro, **When** abre cualquier página del sitio, **Then** la página se muestra
   con el aspecto claro actual, sin cambios visuales perceptibles respecto de hoy.
3. **Given** un visitante con el sitio abierto en modo automático, **When** cambia
   el tema de su sistema operativo, **Then** el sitio cambia al nuevo tema sin
   recargar la página.

---

### User Story 2 - El visitante elige el tema desde el sidebar (Priority: P1)

Dentro del sidebar del sitio, justo debajo de la línea horizontal que separa el
nombre/perfil del autor de la fila de KPIs rápidos (años, certificaciones,
proyectos), el visitante encuentra una sección con tres opciones: **Automático**,
**Claro** y **Oscuro**. Cada opción tiene su propio ícono y su etiqueta de texto
visible, y muestra cuál está activa. Al elegir una opción, todo el sitio cambia
de tema de inmediato.

**Why this priority**: es la interacción central pedida por el autor (puntos 2,
3 y 4). Sin el selector, el usuario no puede anular la detección automática.

**Independent Test**: localizar la sección de tema en el sidebar, verificar que
existen exactamente tres opciones con íconos distintos, que la opción vigente se
distingue visualmente y que al pulsar cada opción el sitio cambia de tema.

**Acceptance Scenarios**:

1. **Given** un visitante en cualquier página, **When** observa el sidebar,
   **Then** encuentra una sección de tema ubicada inmediatamente debajo de la
   línea horizontal que separa el perfil del autor de la fila de KPIs rápidos.
2. **Given** la sección de tema visible, **When** el visitante la inspecciona,
   **Then** ve tres opciones —Automático, Claro y Oscuro—, cada una con un ícono
   propio y distinto.
3. **Given** el sitio en modo claro, **When** el visitante elige "Oscuro",
   **Then** todo el sitio cambia a modo oscuro de inmediato y la opción "Oscuro"
   queda marcada como activa.
4. **Given** el sitio en modo oscuro, **When** el visitante elige "Claro",
   **Then** todo el sitio vuelve al aspecto claro actual y la opción "Claro" queda
   marcada como activa.
5. **Given** el visitante había elegido un tema manual, **When** elige
   "Automático", **Then** el sitio vuelve a seguir la preferencia del sistema y la
   opción "Automático" queda marcada como activa.

---

### User Story 3 - La elección del visitante se conserva (Priority: P2)

El visitante que eligió un tema manual (por ejemplo, oscuro) navega a otras
páginas, recarga el sitio o vuelve días después y encuentra su elección
conservada. Su elección manual prevalece sobre la preferencia del sistema hasta
que él mismo la cambie a "Automático".

**Why this priority**: sin persistencia, el selector se vuelve inútil en un sitio
de múltiples páginas y la experiencia se siente rota en cada navegación.

**Independent Test**: elegir "Oscuro", navegar entre al menos tres páginas
distintas, recargar y volver a abrir el sitio; el tema debe seguir siendo oscuro y
la opción "Oscuro" debe seguir marcada.

**Acceptance Scenarios**:

1. **Given** un visitante que eligió "Oscuro", **When** navega a otra página del
   sitio, **Then** la nueva página se muestra en modo oscuro sin destellos.
2. **Given** un visitante que eligió "Claro", **When** recarga el navegador,
   **Then** el sitio sigue en modo claro.
3. **Given** un visitante que eligió "Automático", **When** vuelve a abrir el
   sitio en un sistema con preferencia oscura, **Then** el sitio se muestra en
   modo oscuro.
4. **Given** un visitante que borra los datos de navegación, **When** vuelve a
   abrir el sitio, **Then** el sitio vuelve al comportamiento automático por
   defecto.

---

### User Story 4 - El tema cubre todo el sitio de forma accesible (Priority: P2)

El visitante recorre páginas del CV, proyectos, Observatorio (dashboards,
informes y elecciones), calculadoras, blog, formularios, tarjetas, tablas,
gráficos y mensajes de estado. Todos los elementos se ven legibles y coherentes
en ambos temas, con contraste suficiente, foco visible y sin animaciones que
molesten. El sitio sigue funcionando si el usuario navega con teclado o si tiene
activada la reducción de movimiento.

**Why this priority**: el autor pidió "en todo el website". Un tema que solo
cubre la portada produce una experiencia incoherente y puede afectar la
credibilidad.

**Independent Test**: recorrer una muestra representativa de páginas de cada
pilar (inicio, experiencia, proyectos, Observatorio, calculadoras y blog) en
ambos temas y comprobar legibilidad, contraste, foco de teclado y ausencia de
elementos con fondo o texto "pegados" al tema anterior.

**Acceptance Scenarios**:

1. **Given** cualquier página del sitio en modo oscuro, **When** el visitante lee
   títulos, párrafos, metadatos, tablas y etiquetas, **Then** todo el texto es
   legible y mantiene una jerarquía visual clara.
2. **Given** una página con gráficos, **When** se muestra en modo oscuro,
   **Then** ejes, etiquetas, líneas de referencia y leyendas siguen siendo
   legibles y distinguibles.
3. **Given** un visitante que navega con teclado, **When** recorre la sección de
   tema y el resto de controles, **Then** el foco es visible en ambos temas y
   todos los controles son operables con teclado.
4. **Given** un visitante con la reducción de movimiento activa en su sistema,
   **When** cambia de tema, **Then** el cambio no produce animaciones ni
   transiciones molestas.
5. **Given** un visitante en un dispositivo móvil, **When** abre el sitio,
   **Then** el selector de tema sigue siendo accesible y usable en la barra
   superior en la que se convierte el sidebar.

---

### Edge Cases

- **Primera visita sin JavaScript:** el sitio debe mostrar el tema acorde a la
  preferencia del sistema; la selección manual es una mejora que requiere
  scripting.
- **Cambio del tema del sistema mientras el sitio está abierto en modo
  automático:** el sitio se actualiza sin recargar.
- **Almacenamiento local bloqueado o en modo privado:** el sitio debe funcionar
  con el comportamiento automático sin errores visibles.
- **Navegación interna fluida entre páginas:** el tema no debe parpadear ni
  reiniciarse al cambiar de página.
- **Preferencia guardada inválida o desconocida:** el sistema debe volver al modo
  automático.
- **Imágenes, logos o ilustraciones con fondo claro:** no se invierten fotos ni
  logos; se aplican contenedores, bordes o fondos sutiles solo cuando el fondo
  claro rompa el contraste en modo oscuro.
- **Informes PDF o contenido descargable:** se mantienen como documentos
  independientes; el tema del sitio no altera su contenido.
- **Impresión:** el sitio debe imprimirse de forma legible, preferentemente en
  claro, sin depender del tema seleccionado.
- **Alto contraste del sistema o preferencias de accesibilidad:** el sitio debe
  respetar esas preferencias y no imponer colores que las rompan.
- **Páginas con estilos propios (hero, paneles blueprint, marcadores, popups):**
  deben adaptarse al tema sin perder su identidad ni su contraste.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE detectar la preferencia de tema del usuario
  (oscuro o claro) en la primera visita y aplicar el tema correspondiente.
- **FR-002**: El sistema DEBE aplicar el tema detectado antes de mostrar el
  contenido, evitando un destello del tema equivocado.
- **FR-003**: El sidebar DEBE incluir una sección de selección de tema ubicada
  inmediatamente debajo de la línea horizontal que separa el perfil/nombre del
  autor de la fila de KPIs rápidos.
- **FR-004**: La sección de tema DEBE ofrecer exactamente tres opciones:
  Automático, Claro y Oscuro.
- **FR-005**: Cada opción de la sección de tema DEBE tener un ícono propio y
  distinto, acompañado de una etiqueta de texto visible (Automático, Claro u
  Oscuro).
- **FR-006**: La sección de tema DEBE indicar de forma visible cuál opción está
  activa, tanto visual como semánticamente para tecnologías de asistencia.
- **FR-007**: Al elegir "Claro" u "Oscuro", el sitio completo DEBE cambiar de
  tema de inmediato, sin recargar la página.
- **FR-008**: Al elegir "Automático", el sitio DEBE volver a seguir la preferencia
  del sistema y actualizarse si esa preferencia cambia.
- **FR-009**: La elección manual del visitante DEBE conservarse entre páginas,
  recargas y visitas posteriores, y DEBE prevalecer sobre la preferencia del
  sistema.
- **FR-010**: Si no existe una elección manual, el comportamiento por defecto
  DEBE ser Automático.
- **FR-011**: El tema DEBE aplicarse a todo el sitio: CV, proyectos, Observatorio
  (dashboards, informes y elecciones), calculadoras, blog, navegación, tarjetas,
  tablas, formularios, gráficos, popups y mensajes de estado.
- **FR-012**: En modo claro, el sitio DEBE conservar el aspecto visual actual.
- **FR-013**: En modo oscuro, todo el texto, ícono y control DEBE mantener
  contraste suficiente para ser legible.
- **FR-014**: El cambio de tema DEBE respetar la preferencia de reducción de
  movimiento del sistema, sin animaciones molestas.
- **FR-015**: La sección de tema DEBE ser operable con teclado, tener foco visible
  y etiquetas accesibles.
- **FR-016**: El selector DEBE seguir siendo accesible y usable cuando el sidebar
  se convierte en barra superior en pantallas pequeñas.
- **FR-017**: El comportamiento automático DEBE funcionar aun cuando el
  almacenamiento del navegador esté bloqueado, sin errores visibles.
- **FR-018**: El sitio NO DEBE perder contenido, funcionalidad ni indexabilidad a
  causa del tema; el contenido de valor DEBE seguir presente en el HTML inicial.
- **FR-019**: Los gráficos DEBEN adaptar sus colores de ejes, etiquetas, líneas de
  referencia y leyendas para seguir siendo legibles en ambos temas.
- **FR-020**: La preferencia de tema NO DEBE alterar la fuente de los datos, las
  cifras publicadas ni el contenido editorial.
- **FR-021**: El modo oscuro DEBE conservar el azul de marca como color de acento
  y usar fondo y superficies en grises muy oscuros, no en negro puro.
- **FR-022**: En modo oscuro, las fotos y logos NO DEBEN invertirse; solo se
  ajustan con contenedores, bordes o fondos sutiles cuando el fondo claro rompa
  el contraste.

### Key Entities

- **Preferencia de tema:** elección del visitante; puede ser `automático`,
  `claro` u `oscuro`. Persiste entre sesiones y prevalece sobre el sistema cuando
  es manual.
- **Preferencia del sistema:** estado oscuro/claro del sistema operativo o
  navegador; se usa como valor por defecto y en modo automático.
- **Tema activo:** tema que el sitio está mostrando en un momento dado (claro u
  oscuro), derivado de la preferencia manual o de la del sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las páginas del sitio se muestra correctamente en ambos
  temas, sin texto ilegible ni elementos con colores fuera de contraste.
- **SC-002**: En la primera visita, el tema coincide con la preferencia del
  sistema en el 100 % de los casos probados (oscuro y claro).
- **SC-003**: El tema correcto es visible desde el primer pintado en al menos el
  99 % de las cargas, sin destello perceptible del tema equivocado.
- **SC-004**: Un visitante puede cambiar de tema en un máximo de dos
  interacciones desde cualquier página.
- **SC-005**: La elección manual se conserva en el 100 % de las navegaciones,
  recargas y reaperturas del sitio mientras no se borren los datos del navegador.
- **SC-006**: Las tres opciones de tema muestran ícono y etiqueta de texto
  visibles, y su estado activo se distingue sin ambigüedad.
- **SC-007**: Todo el texto y los controles cumplen un contraste mínimo de 4.5:1
  para texto normal y 3:1 para texto grande e íconos, en ambos temas.
- **SC-008**: El selector de tema es operable con teclado y anuncia su estado a
  tecnologías de asistencia en el 100 % de los casos.
- **SC-009**: El sitio no presenta errores visibles ni funcionalidad rota cuando
  el almacenamiento del navegador está bloqueado.
- **SC-010**: El cambio de tema no altera cifras, fuentes, metadatos ni
  contenido indexable del sitio.

## Assumptions

- El sitio cuenta con un único sidebar global fijo (hoy a la izquierda). La
  sección de tema se coloca en ese sidebar, justo debajo de la línea horizontal
  que separa el perfil/nombre del autor de la fila de KPIs rápidos (años,
  certificaciones, proyectos), y antes de dicha fila.
- "Modo claro actual" significa que el aspecto visual actual se conserva sin
  cambios perceptibles; el modo oscuro es la novedad.
- La preferencia manual se guarda en el navegador del visitante; no hay cuentas
  de usuario ni sincronización entre dispositivos (el sitio es estático).
- El tema por defecto es Automático hasta que el visitante elija otra opción.
- Los documentos descargables (por ejemplo, informes PDF) no forman parte del
  tema del sitio.
- La detección automática y el cambio en vivo dependen de las capacidades del
  navegador; en navegadores muy antiguos se aplica un tema por defecto legible.

## Dependencies

- Aprobación del autor para ampliar la identidad visual de "solo modo claro" a
  dos temas, con la consiguiente actualización de `agents/DESIGN-SYSTEM.md` y
  `agents/PRODUCT.md` (PRD-04) y de la gobernanza de la constitución (principio
  IV).
- Los tokens de color del sistema de diseño deben poder expresarse en ambos
  temas; hoy están definidos en un único lugar central.
- Los componentes con estilos propios (hero, paneles blueprint, gráficos,
  marcadores, popups, formularios) deben revisarse para que consuman los tokens
  del tema.
