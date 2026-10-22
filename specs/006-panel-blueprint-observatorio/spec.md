# Feature Specification: Contenedor reutilizable con estética blueprint y unificación visual de la Home del Observatorio

**Feature Branch**: `006-panel-blueprint-observatorio`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "me gusta ese formato de card grande de contenido que creaste en la card 2 con el fondo tipo blueprint sutil, quiero que la apliques a los demas componentes a los indicadores, al quienes somos, ese deberia ser un componentes nuevo reutilizable, para implementar esto vamos a seguir el sddc ai fluency, entonces por favor iniciemos"

## Contexto de producto *(obligatorio por la constitución, principio I)*

- **Objetivo:** autoridad (principal) y monetización por arrastre: consolidar una
  interfaz de nivel editorial e institucional en la puerta de entrada del
  Observatorio de Datos de Colombia que refuerce la percepción de ingeniería y
  precisión del autor.
- **Pilar:** P3 · Observatorio de Datos de Colombia (con conexión directa hacia
  P4 Blog y P1 CV a través de las secciones de publicaciones e identidad).
- **Audiencias:** A4 (ciudadanos, periodistas, estudiantes) y A2 (líderes técnicos y
  directivos) que visitan la portada del Observatorio.
- **KPIs:** K4 Conversiones (clics hacia dashboards de indicadores, informes,
  artículos del blog y perfil del autor) y K5 Autoridad (percepción de calidad y
  rigor del Observatorio).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lectura estructurada de la portada en contenedores blueprint unificados (Priority: P1)

Un visitante entra a la portada del Observatorio (`/observatorio/`) y recorre sus
tres grandes bloques de contenido: **01 · Indicadores clave ("Cómo va Colombia")**,
**02 · Últimas publicaciones** y **03 · Quiénes somos + Misión y Visión**. Cada
uno de estos tres bloques se presenta dentro del mismo formato de gran contenedor
editorial con estética blueprint sutil (fondo degradado blanco a azul hielo muy
suave, retícula de puntos difuminada, halo radial superior derecho, borde azul
traslúcido y esquinas redondeadas amplias), logrando que la página se sienta
cohesiva, ordenada, fresca y claramente estructurada por zonas.

**Why this priority**: es el objetivo central pedido por el autor para dar unidad
visual y jerarquía profesional a las secciones principales de la Home del
Observatorio.

**Independent Test**: abrir `/observatorio/` en escritorio y móvil y verificar que
las secciones 01 (Indicadores), 02 (Últimas publicaciones) y 03 (Quiénes somos y
Misión/Visión) comparten exactamente el mismo patrón visual de contenedor
blueprint sin romper la legibilidad de las tarjetas internas.

**Acceptance Scenarios**:

1. **Given** un visitante en `/observatorio/`, **When** visualiza la sección 01 de
   indicadores clave ("Cómo va Colombia"), **Then** la sección completa (cabecera +
   cuadrícula de 8 indicadores) está envuelta en el contenedor de estética
   blueprint sutil y las 8 tarjetas blancas destacan con contraste limpio sobre el
   fondo del contenedor.
2. **Given** un visitante en `/observatorio/`, **When** baja a la sección 02 de
   "Últimas publicaciones" y a la sección 03 de "Quiénes somos + Misión y Visión",
   **Then** ambas secciones utilizan el mismo contenedor blueprint con el mismo
   radio, borde, retícula sutil y espaciado interior.
3. **Given** las tarjetas internas de "Nuestra misión" y "Nuestra visión" dentro de
   la sección 03, **When** se muestran sobre el contenedor blueprint, **Then** sus
   superficies mantienen contraste claro (fondo blanco limpio) para diferenciarse
   de la superficie del contenedor padre.

---

### User Story 2 - Comprender qué hace el Observatorio y visualizar su arquitectura de datos en vivo (Priority: P1)

Debajo de la sección **03 · Quiénes somos + Misión y Visión**, el visitante
encuentra dos secciones adicionales dentro del mismo lenguaje de paneles
blueprint:
- **04 · Qué hacemos ("Seis capacidades, una infraestructura")**: presenta las 6
  capacidades clave del Observatorio (Consolidación de fuentes, Series históricas,
  Actualización automatizada, Visualización clara, Análisis e interpretación,
  Acceso centralizado) en una cuadrícula limpia de tarjetas blancas.
- **05 · Cómo funciona ("Del dato disperso al indicador histórico")**: una pieza
  visual e interactiva de ingeniería ("mapa de arquitectura blueprint animado")
  que muestra cómo las fuentes oficiales (DANE, BanRep, Banco Mundial,
  MinHacienda/DIAN, Datos Abiertos) se conectan mediante cables/rutas animadas con
  pulsos de datos luminosos que atraviesan las 6 fases del pipeline (`01
  Recolección` → `02 Normalización` → `03 Transformación` → `04 Estructuración` →
  `05 Versionado` → `06 Almacenamiento`) hasta desembocar en el nodo final del
  **Dashboard público (`/observatorio/`)**.

**Why this priority**: demuestra visualmente el diferenciador de ingeniería de
datos del autor (pilar P3 y principio "Constructor" de `PRODUCT.md`), haciendo
tangible cómo opera el pipeline de extremo a extremo.

**Independent Test**: desplazarse a las secciones 04 y 05 en `/observatorio/` y
verificar que las 6 capacidades se leen con claridad y que el diagrama blueprint
animado muestra los nodos de fuentes, el flujo animado por las 6 etapas del
pipeline y la llegada al nodo de salida del dashboard, adaptándose en móvil y
respetando `prefers-reduced-motion`.

**Acceptance Scenarios**:

1. **Given** un visitante en `/observatorio/` debajo de la sección 03, **When**
   visualiza la sección 04 ("Qué hacemos"), **Then** ve la cabecera con índice
   `04` y las 6 tarjetas de capacidades con su número, ícono lineal, título y
   descripción sobre fondo blanco limpio dentro de un `PanelBlueprint`.
2. **Given** un visitante en la sección 05 ("Cómo funciona"), **When** observa el
   mapa blueprint de arquitectura, **Then** distingue tres zonas conectadas:
   (a) Nodos de Fuentes Oficiales a la izquierda, (b) el motor central con las 6
   fases del pipeline conectadas en serie, y (c) el nodo de salida del Dashboard a
   la derecha, con partículas/pulsos animados que recorren las conexiones.
3. **Given** un usuario con `prefers-reduced-motion: reduce`, **When** visualiza la
   sección 05, **Then** el diagrama muestra todas las conexiones y nodos de forma
   estática y legible sin animaciones en movimiento.

---

### User Story 3 - Reutilización de componentes en el catálogo del sistema de diseño (Priority: P2)

Cuando el autor o un agente de IA necesite envolver una sección destacada del
Observatorio o del sitio con este formato de gran tarjeta de contenido tipo
blueprint, dispone de un único componente reutilizable documentado en el catálogo
del sistema de diseño, sin duplicar reglas de fondo, retícula ni halos en cada
página (principio III de la constitución y regla ARQ-19).

**Why this priority**: garantiza mantenibilidad y cumplimiento estricto de la
regla de oro del sistema de diseño ("cada patrón existe una vez como componente",
ARQ-19 y UI-11).

**Independent Test**: inspeccionar el código de la portada del Observatorio y el
catálogo en `agents/DESIGN-SYSTEM.md` para comprobar que las tres secciones usan
el mismo componente contenedor y que no existen estilos duplicados de retícula o
halo en la página.

**Acceptance Scenarios**:

1. **Given** el nuevo componente contenedor en el catálogo, **When** se invoca en
   las secciones 01, 02 y 03 de `/observatorio/`, **Then** renderiza el contenedor
   con soporte para atributos de accesibilidad (`id`, `aria-label` o
   `aria-labelledby`) y contenido libre mediante slot.
2. **Given** el documento `agents/DESIGN-SYSTEM.md`, **When** se revisa la sección
   8 (Catálogo de componentes reutilizables) y la sección 5.5 (Portada del
   Observatorio), **Then** el componente aparece registrado y documentado.

---

### Edge Cases

- **Contraste de tarjetas hijas sobre el contenedor blueprint**: como el contenedor
  tiene una transición suave de blanco a azul hielo (`#f0f5ff`), todas las tarjetas
  hijas (`IndicadorClaveCard`, `Card` de blog y tarjetas de Misión/Visión) deben
  tener superficie blanca sólida (`--color-sidebar`) y borde definido para no
  perder separación visual.
- **Pantallas móviles (`≤ 768px` y `≤ 640px`)**: el contenedor reduce su padding
  interior y su radio de borde (de `24px` a `18px` en móvil, según sección 2.4 de
  `DESIGN-SYSTEM.md`) para aprovechar el ancho disponible sin desbordamiento
  horizontal.
- **Preferencia de movimiento reducido (`prefers-reduced-motion: reduce`)**: los
  elementos decorativos del contenedor son estáticos y cualquier transición en
  controles o tarjetas internas se desactiva respetando la configuración del
  usuario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un componente contenedor reutilizable de
  sección con estética blueprint sutil (superficie con gradiente suave blanco a
  azul claro, retícula de puntos con máscara radial, halo azul difuminado en la
  esquina superior derecha, borde azul traslúcido de 1 px, radio XL de `24px` en
  escritorio y L de `18px` en móvil, y sombra suave nivel 2).
- **FR-002**: El componente contenedor DEBE aceptar identificadores y atributos de
  accesibilidad (`id`, `ariaLabel`, `ariaLabelledby`, `class`) y proyectar su
  contenido interno de forma flexible sin imponer una única disposición de filas o
  columnas.
- **FR-003**: En la portada del Observatorio (`/observatorio/`), la sección **01 ·
  Indicadores clave ("Cómo va Colombia")** DEBE presentarse dentro de este
  componente contenedor reutilizable, incluyendo su cabecera (índice `01`, eyebrow,
  título y badge de fecha de actualización) y la cuadrícula de 8 tarjetas
  `IndicadorClaveCard`.
- **FR-004**: En la portada del Observatorio (`/observatorio/`), la sección **02 ·
  Últimas publicaciones** DEBE presentarse usando el mismo componente contenedor
  reutilizable, eliminando la implementación ad-hoc previa en la página.
- **FR-005**: En la portada del Observatorio (`/observatorio/`), la sección **03 ·
  Quiénes somos + Misión y Visión** DEBE presentarse dentro del mismo componente
  contenedor reutilizable, ajustando las tarjetas internas de Misión y Visión a
  superficie blanca sólida para garantizar contraste limpio sobre el fondo
  blueprint del contenedor.
- **FR-006**: En la portada del Observatorio (`/observatorio/`), debajo de la
  sección 03, DEBE incluirse la sección **04 · Qué hacemos ("Seis capacidades, una
  infraestructura")** dentro de `PanelBlueprint`, mostrando las 6 capacidades del
  Observatorio en tarjetas blancas de 3 columnas en escritorio, 2 en tablet y 1 en
  móvil.
- **FR-007**: Debajo de la sección 04, DEBE incluirse la sección **05 · Cómo
  funciona ("Del dato disperso al indicador histórico")** dentro de
  `PanelBlueprint`, incorporando el componente reutilizable
  `PipelineBlueprint.astro` que visualiza en un lienzo blueprint animado las
  fuentes oficiales conectadas a las 6 fases del pipeline hasta el dashboard
  final, con soporte accesible (`role="img"`, `aria-label` descriptivo y lista
  ordenada de pasos) y desactivación de animaciones bajo
  `prefers-reduced-motion: reduce`.
- **FR-008**: Los nuevos componentes reutilizables (`PanelBlueprint` y
  `PipelineBlueprint`) DEBEN registrarse en el catálogo de componentes de
  `agents/DESIGN-SYSTEM.md` (sección 8 y sección 5.5) y en
  `src/lib/observatorio/ARCHITECTURE.md` (sección 2), cumpliendo las reglas UI-11 y
  ARQ-19.
- **FR-009**: La página DEBE mantener intactos todos los datos cuantitativos,
  enlaces internos con `urls.ts`, metadatos SEO, JSON-LD `DataCatalog` y
  accesibilidad vigentes.

### Key Entities *(include if feature involves data)*

- **Contenedor Blueprint de Sección (`SeccionBlueprint` / `PanelBlueprint`)**:
  pieza visual contenedora de nivel de sección que encapsula un bloque temático de
  la página (cabecera + contenido en grilla o columnas) bajo la estética blueprint
  de marca.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las 3 secciones principales de `/observatorio/` (01 Indicadores
  clave, 02 Últimas publicaciones, 03 Quiénes somos + Misión y Visión) se
  renderizan utilizando una única definición de componente contenedor, con 0
  bloques CSS duplicados para el fondo blueprint, la retícula de puntos o el halo
  en `src/pages/observatorio/index.astro`.
- **SC-002**: La verificación de tipos (`npx astro check`) finaliza con 0 errores y
  0 advertencias nuevas, y el build de producción (`npm run build`) junto con el
  verificador de enlaces internos pasan al 100 %.
- **SC-003**: En resoluciones de escritorio (`1440px`), tablet (`768px`) y móvil
  (`375px`), las tres secciones mantienen alineación consistente, contraste legible
  (cumpliendo nivel AA) entre las tarjetas blancas internas y el contenedor, y 0
  píxeles de desbordamiento horizontal.

## Assumptions

- El componente contenedor sigue el mismo patrón de diseño y API que
  `BandaOscura.astro` (`id`, `ariaLabel`, `ariaLabelledby`, `class` y `<slot />`),
  ubicándose en `src/components/observatorio/` para mantener coherencia con el
  catálogo actual.
- El pie técnico `DashboardFooter` permanece fuera de los tres contenedores
  numerados como cierre institucional de la página.
- No se crean ni modifican gráficos (`ChartDef`), por lo que no se requieren nuevos
  colores de series ni cambios en contratos de datos JSON.
