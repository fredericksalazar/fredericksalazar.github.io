# Feature Specification: Landing page (Home) del Observatorio de Datos de Colombia

**Feature Branch**: `005-landing-observatorio`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Generación de landing page para el Observatorio de Datos de Colombia. El Observatorio está construido con pestañas de dominio (datos, gráficos e indicadores socioeconómicos de fuentes como Banco Mundial, DANE y Banco de la República) y ya se actualiza solo. Falta una página Home que integre visualmente los indicadores más importantes, genere tracción y visibilidad en internet y permita que un directivo empresarial o un ciudadano del común vea 'cómo va la empresa Colombia' de un vistazo, aplicando buenas prácticas UX/UI y basándose en evidencia de otros observatorios de datos."

## Contexto de producto *(obligatorio por la constitución, principio I)*

- **Objetivo:** autoridad (principal) y, por arrastre, monetización: la Home es la
  puerta de entrada pública que demuestra la capacidad de ingeniería de datos del
  autor y lleva tráfico hacia los demás pilares.
- **Pilar:** P3 · Observatorio de Datos de Colombia (con caminos hacia P4 Blog y
  P1 CV, según PRD-01).
- **Audiencias:** A4 (ciudadanos, periodistas, estudiantes) y A2 (líderes y
  directivos) como lectores; A5 (buscadores y asistentes de IA) como canal.
- **KPIs:** K1 Impresiones orgánicas, K3 Tráfico orgánico, K5 Autoridad (enlaces y
  citas al Observatorio), K4 Conversiones (clics hacia dashboards, blog y perfil) y
  K6 Frescura (visible en la Home).

## Clarifications

### Session 2026-10-19

- Q: ¿La Home reemplaza `/observatorio/` o vive en otra URL? → A: Reemplaza
  `/observatorio/`; el dashboard de inflación pasa a una subpágina propia.
- Q: ¿Semáforo evaluativo o solo referencia objetiva? → A: Solo referencia
  objetiva (meta oficial, promedio de 20 años o valor de hace un año), sin
  juicios de valor.
- Refinamiento del autor tras implementar (2026-10-19): se eliminan (1) la
  tarjeta de resumen automático bajo el hero, (2) la sección "Explora por tema",
  por redundante con los indicadores y el menú del Observatorio, y (3) el bloque
  "Datos abiertos (JSON)": el autor no quiere facilitar la descarga directa de
  los JSON procesados, así que el JSON-LD de la Home tampoco declara
  `distribution`. Los JSON siguen siendo públicos porque los gráficos los cargan
  en el navegador; solo se dejan de enlazar y anunciar. En una segunda ronda el
  autor pidió quitar también `distribution`/`DataDownload` del JSON-LD de todos
  los dashboards, las páginas de elecciones y el informe "Historia de Colombia".
- Q: ¿Qué artículos del blog entran en "Lo más reciente"? → A: Los etiquetados
  "Observatorio de Datos" y también los comparativos "Colombia vs rival"
  (etiqueta "Banco Mundial").

## Situación actual

- La URL `/observatorio/` hoy **no es una portada**: es el dashboard de
  "Inflación vs Tasa de interés". El resto de dominios vive en subpáginas
  (`empleo`, `comercio`, `monetario`, `pib`, `demografia`), más `informes` y
  `acerca`, enlazadas desde un menú horizontal.
- No existe una vista que resuma el estado del país en todos los dominios a la vez;
  quien llega debe recorrer pestaña por pestaña.
- Los datasets publicados ya exponen, por indicador, el valor actual, el periodo,
  el cambio frente al periodo anterior y la fuente oficial, que es lo que la Home
  necesita. No hay dataset fiscal (el hero actual menciona "Sector Fiscal" sin
  datos que lo respalden).

## Evidencia de referencia (investigación)

Patrones observados en observatorios y portales estadísticos, y cómo se traducen
en requisitos de esta spec:

| Referente | Patrón observado | Se traduce en |
|---|---|---|
| CBS Países Bajos · *Business Cycle Tracer* | Un conjunto acotado (13) de indicadores macro agrupados por tema (confianza, economía, mercado laboral); los contracíclicos (desempleo) se leen invertidos; cada gráfico lleva al detalle. | FR-003, FR-005, FR-007 |
| INE España · Panel de indicadores de coyuntura | Resume en una sola imagen los indicadores generales y sectoriales de la economía. | FR-001, FR-002 |
| Boletín de indicadores del Banco de la República | Agrupa los indicadores por sector real, financiero, fiscal y externo. | FR-005 |
| Biblioteca de la Cámara de los Comunes (UK) · *Economic Indicators* | Secciones: crecimiento, precios y salarios, mercado laboral, finanzas, comercio y tasa de cambio. | FR-005 |
| Tableros macro (patrón de tarjeta) | Tarjeta con último dato, cambio frente al periodo anterior, tendencia de ~24 periodos y enlace a la fuente oficial. | FR-003, FR-004 |
| Nielsen Norman Group · dashboards y procesamiento preatentivo | Un tablero de resumen da información "de un vistazo"; la cantidad se codifica con longitud y posición; el color fuerte se reserva para lo que importa. | FR-002, FR-006, SC-001 |
| Guías de diseño de dashboards ejecutivos | 4 a 7 KPIs principales arriba; luego tendencias; luego detalle. | FR-002, FR-003 |
| Our World in Data | Datos y gráficos con licencia abierta, citables y fáciles de encontrar; exploradores por tema. | FR-010, FR-012 |
| Google · datos estructurados `Dataset`/`DataCatalog` | Marcar la página de aterrizaje de un catálogo de datos con `DataCatalog` y cada conjunto con `Dataset` para aparecer en Dataset Search. | FR-015 |

Fuentes: [CBS · Business Cycle Dashboard](https://www.cbs.nl/en-gb/background/2008/50/business-cycle-dashboard-february-2016),
[INE · datos económicos](https://ine.es/covid/covid_economia.htm),
[INCP · boletín de indicadores BanRep](https://incp.org.co/publicaciones/infoincp-publicaciones/informacion-para-empresas/entorno/economico/2015/09/el-banco-de-la-republica-emite-el-boletin-de-indicadores-economicos/),
[House of Commons · UK economic indicators (abr. 2024)](https://www.niassembly.gov.uk/globalassets/documents/committees/2022-2027/finance/reports/draft-executive-budget-2024-25/non-departmental-papers/hoc-uk-economic-and-financial-indicators--26april2024.pdf),
[UK macro dashboard](https://freedomisntfree.co.uk/uk-macro-dashboard),
[NN/g · Dashboards: preattentive](https://www.nngroup.com/articles/dashboards-preattentive/),
[FusionCharts · Dashboard best practices](https://www.fusioncharts.com/blog/dashboard-design-best-practices/),
[Our World in Data · motivación](https://ourworldindata.org/motivation),
[Google · Dataset structured data](https://developers.google.com/search/docs/data-types/dataset).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "¿Cómo va Colombia?" en menos de un minuto (Priority: P1)

Una directiva de una empresa mediana (o un ciudadano curioso) entra a la Home del
Observatorio desde Google o desde un enlace compartido. Sin hacer clic, ve arriba
un panel con los indicadores clave del país: cada uno con su valor actual, si subió o bajó, desde cuándo es el
dato, una tendencia corta y una referencia que le dice si el número es "alto" o
"bajo" (meta oficial o promedio histórico). Con eso se forma una idea del
"estado de la empresa Colombia".

**Why this priority**: es la razón de ser de la página y la propuesta de valor
pedida por el autor. Sola, ya entrega una portada útil y citable.

**Independent Test**: abrir la Home y, sin interactuar, responder correctamente
cinco preguntas: inflación actual, tasa del BanRep, desempleo, crecimiento del PIB
y dólar (TRM), cada una con su periodo.

**Acceptance Scenarios**:

1. **Given** que los datasets están publicados, **When** un visitante abre la Home
   en escritorio, **Then** ve los indicadores clave sin desplazarse
   más de una pantalla por debajo del hero.
2. **Given** un indicador del panel, **When** el visitante lo mira, **Then** ve
   valor, unidad, periodo del dato, dirección del cambio (subió/bajó/igual con su
   magnitud), tendencia reciente y fuente oficial.
3. **Given** un indicador "contracíclico" como el desempleo, **When** sube,
   **Then** la señal visual solo indica que subió y cuánto, sin presentarlo como
   bueno o malo, y muestra su posición frente al promedio histórico.
4. **Given** que el visitante usa un lector de pantalla o desactiva JavaScript,
   **When** carga la Home, **Then** obtiene los mismos valores, periodos y fuentes
   como texto.

---

### User Story 2 - Del resumen al detalle (Priority: P2)

Tras ver el panel, el visitante quiere profundizar en un tema (por ejemplo,
empleo). Cada indicador del panel lleva al dashboard que lo explica, y el menú
del Observatorio da acceso a todos los dominios.

**Why this priority**: convierte la visita en navegación (K4) y distribuye
autoridad interna hacia los dashboards (K1, K3).

**Independent Test**: desde la Home, llegar en un clic a cada dominio publicado y,
desde cada tarjeta del panel, al dashboard correspondiente.

**Acceptance Scenarios**:

1. **Given** la Home, **When** el visitante hace clic en un indicador del panel,
   **Then** llega al dashboard del dominio de ese indicador.
2. **Given** el menú del Observatorio en la Home, **When** el visitante lo
   recorre, **Then** encuentra todos los dashboards publicados (Inflación y
   tasas, Empleo, Comercio exterior, Monetario, PIB, Demografía), Informes y
   Acerca.

---

### User Story 3 - Confianza y frescura (Priority: P2)

Un periodista quiere saber si puede citar el Observatorio. La Home muestra cuándo
se actualizó cada dato, de qué fuentes oficiales vienen (DANE, Banco de la
República, Banco Mundial), cómo se procesan (enlace a "Acerca") y quién está
detrás, además de cómo citarlo.

**Why this priority**: la credibilidad es lo que el sitio vende (principio II);
sin ella no hay enlaces ni citas (K5).

**Independent Test**: desde la Home identificar, para cualquier indicador, fuente
y fecha de corte, y encontrar una forma de citar el Observatorio.

**Acceptance Scenarios**:

1. **Given** la Home, **When** se revisa un indicador, **Then** su fuente oficial y
   su periodo son visibles junto al valor.
2. **Given** un dataset con más días sin actualizarse que el umbral de frescura
   (K6), **When** se genera la Home, **Then** ese indicador se marca como
   "dato no reciente" en lugar de presentarse como actual.
3. **Given** la Home, **When** el visitante busca cómo citar los datos,
   **Then** encuentra la referencia sugerida y la licencia.

---

### User Story 4 - Descubrimiento en buscadores y redes (Priority: P3)

Alguien busca "indicadores económicos de Colombia hoy" o comparte la Home en
WhatsApp o LinkedIn. La página aparece con un título y una descripción claros, una
imagen de vista previa propia y datos estructurados que la identifican como
catálogo de datos del autor.

**Why this priority**: la tracción pedida por el autor depende de buscadores y
asistentes de IA (A5), pero depende de que P1–P3 existan.

**Independent Test**: validar los datos estructurados con la herramienta oficial
de resultados enriquecidos y revisar la vista previa al compartir la URL.

**Acceptance Scenarios**:

1. **Given** la Home publicada, **When** se valida su marcado estructurado,
   **Then** se reconoce un catálogo de datos con sus conjuntos de datos, creador,
   licencia y fecha de modificación, sin errores.
2. **Given** la URL de la Home, **When** se comparte en una red social, **Then**
   se muestra la imagen y la descripción propias de la Home.

---

### User Story 5 - Lo último publicado y siguiente paso (Priority: P3)

Un lector recurrente vuelve a la Home y ve los informes y artículos más recientes
del Observatorio, y un camino visible hacia el perfil profesional del autor.

**Why this priority**: retiene visitantes (A3, A4) y abre el embudo hacia
conversión (PRD-01, K4).

**Independent Test**: comprobar que la Home lista las publicaciones más recientes
del Observatorio y ofrece al menos un enlace al perfil del autor.

**Acceptance Scenarios**:

1. **Given** que hay un informe nuevo publicado, **When** se genera la Home,
   **Then** aparece entre lo más reciente sin edición manual de la Home.
2. **Given** la Home, **When** el visitante llega al final, **Then** encuentra
   quién construye el Observatorio y un enlace a su perfil o a contactarlo.

---

### Edge Cases

- **Indicador sin dato** (p. ej. informalidad hoy en `null`): no se muestra en el
  panel o se muestra como "sin dato", nunca como 0.
- **Periodicidades distintas** (mensual, trimestral, anual): cada tarjeta muestra
  su propio periodo; el resumen no mezcla periodos sin decirlo.
- **Dataset desactualizado** más allá del umbral de frescura: se señala como "dato
  no reciente".
- **Falla la carga de las tendencias** (sin conexión o sin JavaScript): valores,
  periodos y fuentes siguen visibles; solo se pierde la mini tendencia.
- **Pantallas pequeñas**: el panel se reorganiza en una o dos columnas sin
  desplazamiento horizontal de la página.
- **Indicador que cambia de sentido** (desempleo, inflación por encima de la meta):
  la señal de dirección es descriptiva y no confunde "subió" con "mejoró".
- **Visitante que llega a `/observatorio/` buscando el dashboard de inflación**
  (enlaces externos antiguos o resultados de búsqueda): encuentra inflación y tasa
  en el primer bloque de la Home y un enlace directo a su dashboard.
- **Contenido electoral** enlazado desde la Home: se presenta de forma neutral,
  sin destacar candidatos.

## Requirements *(mandatory)*

### Functional Requirements

**Ubicación y estructura**

- **FR-001**: La Home del Observatorio DEBE publicarse en `/observatorio/`,
  reemplazando el dashboard actual de "Inflación vs Tasa", que pasa a una
  subpágina propia del Observatorio con todo su contenido intacto.
- **FR-001a**: Al mover el dashboard de inflación, DEBEN actualizarse todos los
  enlaces internos que hoy apuntan a `/observatorio/` buscando inflación (menú del
  Observatorio, artículos del blog, informes, calculadoras), y quien llegue a la
  nueva Home buscando inflación DEBE encontrarla en el primer bloque de indicadores
  y a un clic de su dashboard. Ningún enlace interno puede quedar roto.
- **FR-002**: La Home DEBE seguir el patrón de página de sección del sitio: hero
  propio del Observatorio (badge, título único de página, subtítulo y etiquetas
  propios, mapa de Colombia como visual) y menú horizontal del Observatorio, con
  una entrada para la propia Home.
- **FR-003**: Debajo del hero y del menú, la Home DEBE mostrar un **panel de
  indicadores clave** de entre 6 y 9 indicadores. *(Refinamiento 2026-10-19: se
  retiró el resumen automático en frases.)*

**Panel de indicadores clave**

- **FR-004**: Cada indicador del panel DEBE mostrar: nombre en lenguaje sencillo,
  valor actual con unidad, periodo del dato, dirección y magnitud del cambio frente
  al periodo anterior, una tendencia reciente, la fuente oficial y una línea que
  explique qué significa el número para una persona no experta.
- **FR-005**: El panel DEBE agrupar los indicadores por tema siguiendo la
  convención de los referentes: **Precios y dinero** (inflación anual, tasa de
  intervención BanRep), **Actividad y bienestar** (crecimiento del PIB, PIB per
  cápita), **Empleo** (tasa de desempleo) y **Sector externo** (TRM, balanza
  comercial o cuenta corriente) y **Contexto** (salario mínimo). La población
  se muestra como cifra de contexto en el hero.
- **FR-006**: Cada indicador DEBE mostrar una referencia objetiva que permita
  juzgar el valor: la meta oficial cuando exista (inflación: meta del 3 % con
  rango 2–4 %); el promedio de los últimos 20 años del propio dataset cuando no
  exista meta; o, en series nominales con tendencia (TRM, PIB per cápita en USD
  corrientes, salario mínimo), el valor de hace un año.
  La Home NO DEBE emitir juicios de valor (semáforos ni etiquetas de
  "favorable/desfavorable"): describe la posición del dato frente a su referencia
  ("por encima de la meta", "bajo su promedio histórico") y deja la
  interpretación al lector.
- **FR-007**: La señal de dirección DEBE ser descriptiva ("subió/bajó/igual" y
  su magnitud) y NO DEBE usar colores ni símbolos que impliquen "mejoró/empeoró",
  para no confundir el sentido en indicadores contracíclicos (desempleo,
  inflación).
- **FR-008**: Cada indicador del panel DEBE enlazar al dashboard del dominio que
  lo explica.
- **FR-009**: Los valores, periodos y fuentes del panel y del resumen DEBEN estar
  presentes en el contenido inicial de la página (legibles sin ejecutar scripts);
  las tendencias son una mejora visual.

**Navegación por dominios y contenido**

- **FR-010**: Cada dashboard publicado DEBE quedar a un clic desde la Home a
  través del menú del Observatorio y de los enlaces de cada tarjeta del panel.
  Toda cifra del hero muestra su periodo y su fuente. *(Refinamiento 2026-10-19:
  se retiró la grilla "Explora por tema" por redundante.)*
- **FR-011**: La Home DEBE listar automáticamente las publicaciones más recientes
  del Observatorio: los informes del catálogo y los artículos del blog del cluster
  "Colombia en datos", identificados por las etiquetas "Observatorio de Datos"
  (informes mensuales, dólar) o "Banco Mundial" (serie "Colombia vs rival"), sin
  edición manual al publicar una nueva.
- **FR-012**: La Home DEBE incluir una sección de confianza: fuentes oficiales
  utilizadas, cómo se actualizan los datos, enlace a la metodología ("Acerca"),
  licencia de reutilización y referencia sugerida para citar. *(Refinamiento
  2026-10-19: la Home no enlaza ni anuncia la descarga de los JSON procesados.)*
- **FR-013**: La Home DEBE identificar al autor y ofrecer un siguiente paso hacia
  su perfil profesional o contacto (PRD-01).

**Visibilidad y SEO**

- **FR-014**: La Home DEBE tener título, descripción e imagen de vista previa
  propios, orientados a búsquedas como "indicadores económicos de Colombia" y
  "cómo va la economía de Colombia".
- **FR-015**: La Home DEBE declarar datos estructurados de catálogo de datos que
  agrupe los conjuntos publicados, con creador, licencia, cobertura temporal y
  fecha de última modificación tomadas de los datasets.
- **FR-016**: La Home DEBE estar incluida en el mapa del sitio, en `llms.txt` y en
  la miga de pan del Observatorio, y los dashboards DEBEN enlazar de vuelta a ella.

**Integridad de datos y diseño**

- **FR-017**: Toda cifra de la Home DEBE provenir de los datasets publicados;
  ninguna se escribe a mano.
- **FR-018**: Un indicador sin dato DEBE ocultarse o mostrarse como "sin dato";
  un indicador cuyo dataset supere el umbral de frescura DEBE marcarse como "dato
  no reciente".
- **FR-019**: La Home DEBE cumplir la identidad visual y las reglas de diseño del
  sitio (tokens, tipografía, gráficos en card, color consultado al autor antes de
  crear cualquier gráfico nuevo) y reutilizar los componentes existentes antes de
  crear nuevos.
- **FR-020**: La Home DEBE cumplir la accesibilidad mínima del sitio: un solo
  título principal, foco visible, descripciones accesibles en gráficos y
  controles, contraste suficiente y respeto a la preferencia de movimiento
  reducido.

### Key Entities *(include if feature involves data)*

- **Indicador clave**: métrica destacada en el panel. Atributos: nombre sencillo,
  valor, unidad, periodo, cambio frente al periodo anterior, sentido (procíclico o
  contracíclico), referencia (meta oficial o promedio histórico), fuente, dominio
  al que pertenece y explicación de una línea.
- **Dominio del Observatorio**: área temática con su dashboard (Inflación y tasas,
  Empleo, Comercio, Monetario y externo, PIB, Demografía). Atributos: nombre,
  descripción, dato estrella, fecha de actualización, enlace.
- **Dataset publicado**: conjunto de datos producido por el pipeline. Atributos:
  fuentes oficiales, cobertura temporal, granularidad, fecha de última
  actualización.
- **Publicación reciente**: informe o artículo del Observatorio. Atributos:
  título, fecha, enlace, tipo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una prueba con al menos 5 personas no expertas, el 80 % responde
  correctamente, en menos de 60 segundos y sin hacer clic, el valor y el periodo
  de inflación, tasa BanRep, desempleo, crecimiento del PIB y TRM.
- **SC-002**: El 100 % de las cifras visibles en la Home coincide con el dataset
  publicado del que proviene y muestra fuente y periodo.
- **SC-003**: El panel de indicadores clave es visible sin desplazarse más de una
  pantalla por debajo del hero en escritorio (1366×768) y se lee sin
  desplazamiento horizontal en móvil (375 px de ancho).
- **SC-004**: Cada dominio publicado es alcanzable desde la Home en un clic.
- **SC-005**: Los datos estructurados de la Home pasan la validación oficial de
  resultados enriquecidos sin errores.
- **SC-006**: La Home obtiene 90 o más en accesibilidad y en SEO en una auditoría
  estándar de calidad web, y su contenido principal se muestra en menos de 2,5 s
  en una conexión móvil típica.
- **SC-007**: A los 90 días de publicada, la Home acumula impresiones orgánicas
  para consultas genéricas del tipo "indicadores económicos Colombia" (K1) y al
  menos el 30 % de sus visitas continúa hacia un dashboard, informe o artículo (K4).

## Assumptions

- Los indicadores del panel salen de los datasets ya publicados (inflación,
  empleo, PIB, comercio, externo, demografía, salario mínimo). Valores de
  referencia a la fecha: inflación 6,28 % (sep. 2026), tasa BanRep 12 %
  (sep. 2026), desempleo 9,36 % (ago. 2026), crecimiento del PIB 2,64 % (2025),
  TRM 3.219,79 (oct. 2026). Si para un indicador deseado no hay dato (p. ej.
  informalidad, sector fiscal o PIB trimestral), queda fuera del panel y se avisa
  al autor; no se rellena.
- El sector fiscal no tiene dataset; la Home no lo presenta como dominio hasta
  que exista.
- El umbral de "dato no reciente" es el de K6: 45 días para series mensuales; para
  series anuales se asume 15 meses desde el cierre del periodo.
- El nombre de la nueva URL del dashboard de inflación (p. ej.
  `/observatorio/inflacion/`) y la forma de tratar los enlaces externos antiguos
  en un sitio estático se definen en el plan; la URL `/observatorio/` conserva su
  autoridad acumulada porque sigue existiendo, ahora como Home.
- La licencia de reutilización es CC BY 4.0, la misma que ya declaran los
  dashboards.
- El promedio de referencia usa una ventana fija de los últimos 20 años de la
  serie publicada de cada dataset y se documenta en la metodología.
- Cada indicador declara su propia periodicidad (mensual o anual), porque un
  mismo dataset puede mezclar ambas (p. ej. `externo`: TRM mensual y cuenta
  corriente anual).
- La Home no agrega cuentas, suscripciones con backend ni formularios: el sitio
  sigue siendo estático. Un boletín por correo queda fuera de alcance.
- No se agregan dependencias nuevas; las tendencias reutilizan la capacidad de
  gráficos existente. Los colores de cualquier gráfico nuevo se consultan al autor
  en el plan.
- Las pruebas con usuarios de SC-001 las organiza el autor con personas de su
  entorno.
