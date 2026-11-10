---

description: "Task list for feature 007-tema-claro-oscuro"
---

# Tasks: Modo claro y modo oscuro en todo el sitio

**Input**: Design documents from `/specs/007-tema-claro-oscuro/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/theme-contract.md`, `quickstart.md`

**Tests**: No se generan tareas de test automatizado: la spec no solicita TDD y el
proyecto no tiene framework de pruebas. La validación es manual (`quickstart.md`)
más `npx astro check` y `npm run build`.

**Organization**: tareas agrupadas por historia de usuario para implementar y
validar cada una de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias
  pendientes).
- **[Story]**: historia de usuario (`US1`–`US4`).
- Todas las rutas son exactas respecto de la raíz del repositorio.

## Path Conventions

- Sitio Astro único: `src/`, `public/`, `specs/`.
- No hay backend ni tests automatizados.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: confirmar el punto de partida y que no se agreguen dependencias.

- [x] T001 Verificar la rama `feature/dark-mode`, ejecutar `npx astro check` y `npm run build` para registrar la línea base, y confirmar que `package.json`/`package-lock.json` no cambian (sin dependencias nuevas).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tokens, pre-pintado, metadatos y módulo de estado que bloquean todas
las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase.

- [x] T002 Agregar la paleta oscura y los tokens semánticos nuevos (superficies, acento de texto/relleno, gráficos, blueprint, estados y sombras) en `src/layouts/BaseLayout.astro`, bajo `:root[data-theme="dark"]`, según `data-model.md` §4.1–4.6; conservar los valores claros actuales sin cambios.
- [x] T003 Agregar en `src/layouts/BaseLayout.astro` el script inline de pre-pintado: leer `localStorage['theme-preference']` en `try/catch`, validar que sea `auto`, `light` o `dark`, resolver con `matchMedia('(prefers-color-scheme: dark)')`, establecer `data-theme` (`light` o `dark`) y `data-theme-preference`, actualizar `meta[name="theme-color"]` y re-aplicar en `astro:after-swap`.
- [x] T004 Agregar `color-scheme: light`/`dark` en `src/layouts/BaseLayout.astro` y `<meta name="color-scheme" content="light dark">` + `theme-color` en `src/components/SEOHead.astro`; mantener `msapplication-TileColor` en `#2563eb`.
- [x] T005 [P] Crear `src/lib/theme-client.ts` con `ThemePreference` (`auto` \| `light` \| `dark`), `ResolvedTheme` (`light` \| `dark`), `THEME_STORAGE_KEY = 'theme-preference'`, `getPreference()`, `setPreference()`, `resolveTheme()`, `applyTheme()`, `initTheme()` y `onThemeChange()`; todo acceso a storage en `try/catch` y `initTheme()` idempotente con `window.__themeBound`.

**Checkpoint**: tokens, pre-pintado, metadatos y módulo listos; las historias
pueden comenzar.

---

## Phase 3: User Story 1 - El sitio respeta la preferencia del sistema desde la primera visita (Priority: P1)

**Goal**: detectar el tema del sistema antes del primer pintado, sin destellos, y
reaccionar en vivo cuando el sistema cambia en modo automático.

**Independent Test**: abrir el sitio en un sistema claro y en uno oscuro sin
preferencia guardada; verificar el tema correcto desde el primer pintado. Con el
sitio abierto en automático, cambiar el tema del sistema y verificar el cambio
sin recargar. Repetir sin JavaScript.

### Implementation for User Story 1

- [x] T006 [US1] Agregar en `src/lib/theme-client.ts` el listener de `matchMedia('(prefers-color-scheme: dark)')`; re-resolver y aplicar solo cuando `preference === 'auto'`.
- [x] T007 [US1] Emitir `document.dispatchEvent(new CustomEvent('themechange', { detail: { theme, preference } }))` en `src/lib/theme-client.ts` cuando cambie el tema resuelto; la emisión debe ser idempotente y no debe ejecutarse en el pre-pintado inicial.
- [x] T008 [US1] Agregar en `src/layouts/BaseLayout.astro` el fallback sin JavaScript `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { …tokens oscuros…; color-scheme: dark; } }`, reutilizando los mismos valores de T002.
- [ ] T009 [US1] Validar US1 con `quickstart.md` filas 1–5 (sistema claro/oscuro sin preferencia, cambio del sistema en automático, sin JavaScript, storage bloqueado) y registrar el resultado.

**Checkpoint**: US1 funciona de forma independiente; el tema automático es
correcto desde el primer pintado.

---

## Phase 4: User Story 2 - El visitante elige el tema desde el sidebar (Priority: P1)

**Goal**: ofrecer un selector accesible de tres opciones, con ícono y etiqueta,
ubicado debajo del divisor del perfil y antes de los KPIs, que cambie todo el
sitio al instante.

**Independent Test**: localizar la sección en el sidebar, comprobar las tres
opciones con íconos y etiquetas, el estado activo, el cambio inmediato y la
operación con teclado en escritorio y móvil.

### Implementation for User Story 2

- [x] T010 [US2] Crear `src/components/ThemeToggle.astro` con tres radios nativos (`name="theme-preference"`, valores `auto`, `light`, `dark`), íconos SVG inline (monitor, sol, luna) con `aria-hidden="true"`, etiquetas visibles `Automático`/`Claro`/`Oscuro`, grupo `role="radiogroup"` con `aria-label="Tema de la página"`, estado activo con `:checked` y foco visible con `:focus-visible`.
- [x] T011 [US2] Insertar `<ThemeToggle />` en `src/components/Sidebar.astro` inmediatamente después de `.sidebar__profile` y antes de `.sidebar__stats`; agregar estilos responsive para que el selector siga visible y usable cuando el sidebar se convierte en barra superior (≤768 px).
- [x] T012 [US2] Conectar el selector en `src/components/ThemeToggle.astro` con `setPreference()` de `src/lib/theme-client.ts`; sincronizar el radio marcado desde `initTheme()` y en `astro:page-load`, garantizar exactamente una opción marcada y evitar listeners duplicados.
- [ ] T013 [US2] Validar US2 con `quickstart.md` filas 6–10 (ubicación, tres opciones, íconos+etiquetas, estado activo, cambio inmediato, automático).

**Checkpoint**: US1 y US2 funcionan juntas; el visitante puede anular el modo
automático.

---

## Phase 5: User Story 3 - La elección del visitante se conserva (Priority: P2)

**Goal**: persistir la preferencia manual entre páginas, recargas y visitas, y
manejarla con seguridad cuando el almacenamiento falla.

**Independent Test**: elegir Oscuro, navegar por tres páginas, recargar y
reabrir; la elección se conserva. Borrar datos vuelve a Automático. Bloquear el
storage no genera errores.

### Implementation for User Story 3

- [x] T014 [US3] Persistir `theme-preference` en `setPreference()` de `src/lib/theme-client.ts` con `try/catch`; normalizar valores inválidos a `auto` (regla: `theme-preference` solo puede ser `auto`, `light` o `dark`) y escribir `auto` explícitamente cuando el visitante elija Automático.
- [x] T015 [US3] Agregar en `src/lib/theme-client.ts` el listener de `storage` para la clave `theme-preference`; re-leer y aplicar en otras pestañas, y volver a `auto` cuando `event.key === null` (clear).
- [ ] T016 [US3] Validar US3 con `quickstart.md` filas 11–16 (persistencia entre páginas, recarga, reapertura, borrar datos, valor inválido, otra pestaña).

**Checkpoint**: la preferencia persiste y el sitio se recupera de storage
bloqueado o inválido.

---

## Phase 6: User Story 4 - El tema cubre todo el sitio de forma accesible (Priority: P2)

**Goal**: migrar todos los colores de tema a tokens, adaptar hero/blueprint,
gráficos, mapas, código e imágenes, y cumplir accesibilidad, móvil, impresión y
reducción de movimiento.

**Independent Test**: recorrer una página representativa de cada pilar en ambos
temas y comprobar contraste, foco, teclado, móvil, reduced motion, gráficos,
mapas, código, imágenes e impresión.

### Token migration

- [x] T017 [P] [US4] Migrar las clases utilitarias globales de `src/layouts/BaseLayout.astro` (`.tag`, `.pill`, `.badge`, `.skip-link`, enlaces, `code/pre`, foco y sombras) a tokens; usar `--color-accent-text`/`--color-accent-text-hover` para texto y `--color-accent-fill`/`--color-accent-fill-hover` para rellenos.
- [x] T018 [P] [US4] Migrar superficies, inputs, tablas, resultados, bordes y texto de `src/styles/global.css` a tokens; conservar los colores de datos/series.
- [x] T019 [P] [US4] Migrar a tokens los componentes compartidos `src/components/Sidebar.astro`, `Footer.astro`, `Card.astro`, `Callout.astro`, `AuthorBio.astro`, `BlogFilters.astro`, `ShareButtons.astro`, `TableOfContents.astro`, `ReadingProgress.astro`, `blog/MarcadorEconomico.astro` y `blog/MarcadorFutbol.astro`.
- [x] T020 [P] [US4] Migrar `src/components/Hero.astro` (fondo blueprint, puntos, arcos, bordes y contenedores de partners) a `--color-blueprint-*`; no invertir logos.
- [x] T021 [P] [US4] Migrar los contenedores del Observatorio `src/components/observatorio/PanelBlueprint.astro`, `PipelineBlueprint.astro`, `BandaOscura.astro`, `PageHeader.astro`, `KpiRow.astro`, `DashboardFooter.astro`, `GlosarioGrid.astro` e `IndicadorPanel.astro` a tokens.
- [x] T022 [P] [US4] Migrar los componentes interactivos del Observatorio `src/components/observatorio/MapaColombia.astro`, `InformePopup.astro`, `IndicadorCard.astro`, `IndicadorClaveCard.astro`, `DashboardNav.astro`, `EleccionesNav.astro` y `ChartContainer.astro` a tokens.
- [x] T023 [P] [US4] Migrar `src/pages/index.astro`, `src/pages/experiencia.astro`, `src/pages/certificaciones.astro` y `src/pages/404.astro` a tokens.
- [x] T024 [P] [US4] Migrar `src/pages/proyectos/index.astro`, `src/pages/proyectos/[slug].astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/blog/archivo.astro`, `src/pages/blog/tags.astro` y `src/pages/blog/tag/[tag].astro` a tokens.
- [x] T025 [P] [US4] Migrar `src/pages/calculadoras/index.astro`, `src/pages/calculadoras/cuanto-ganas.astro`, `src/pages/calculadoras/en-que-colombia-naciste.astro` y `src/pages/calculadoras/sueldo-vs-inflacion.astro` a tokens.
- [x] T026 [P] [US4] Migrar `src/pages/observatorio/index.astro`, `acerca.astro`, `comercio.astro`, `demografia.astro`, `empleo.astro`, `inflacion.astro`, `monetario.astro`, `pib.astro`, `informes/index.astro` e `informes/[slug].astro` a tokens.
- [x] T027 [P] [US4] Migrar `src/pages/elecciones-presidenciales/index.astro`, `2022.astro`, `2022-segunda-vuelta.astro`, `2026.astro` y `2026-segunda-vuelta.astro` a tokens.
- [x] T028 [US4] Ajustar contenedores de imágenes/logos (sin invertirlos) en `src/components/Hero.astro`, `AuthorBio.astro`, `Sidebar.astro`, `src/pages/proyectos/[slug].astro` y `src/pages/blog/[slug].astro`; usar `--color-surface` o bordes sutiles solo donde el fondo claro rompa el contraste.

### Charts, maps, code and media

- [x] T029 [US4] Crear `src/lib/observatorio/theme-colors.ts` con `ChartTheme`, `chartTheme()` y `getMapboxStyle()`; leer `getComputedStyle(document.documentElement)` y usar valores claros como fallback sin DOM; `getMapboxStyle()` devuelve `carto-darkmatter` en oscuro y `white-bg` en claro.
- [x] T030 [US4] Refactorizar `src/lib/observatorio/charts.ts`: `COLORS.textPrimary/textMuted/border` como getters, `FONT.family/size/color` como getters, y `baseLayout()` usando `chartTheme()` para `font`, `xaxis`, `yaxis` y `hoverlabel`; si existe `overrides.mapbox`, reemplazar solo `style` por `getMapboxStyle()`.
- [x] T031 [P] [US4] Reemplazar los literales neutros de `src/lib/observatorio/chart-defs/analisis-electoral.ts` (`#636c76`, `#475569`, `#1f2328`, `#d0d7de`, `#64748b`, `#1e293b`, `#0f172a`, `#f1f5f9`, `#e2e8f0`, `#cbd5e1`) por `COLORS.*`/`chartTheme()`; conservar colores de series.
- [x] T032 [P] [US4] Reemplazar los literales neutros de `src/lib/observatorio/chart-defs/elecciones-presidenciales.ts` por `COLORS.*`/`chartTheme()` y aplicar `getMapboxStyle()` a los 9 mapas; conservar colores de candidatos/partidos.
- [x] T033 [P] [US4] Reemplazar los literales neutros del resto de `src/lib/observatorio/chart-defs/*.ts` (inflación, comercio, empleo, PIB, monetario, demografía, etc.) por `COLORS.*`/`chartTheme()`; conservar colores de series.
- [x] T034 [US4] Agregar `reactPlotly(elementId, spec)` en `src/lib/observatorio/plotly-mount.ts`: si el gráfico no está montado, delegar en `mountPlotly`; si está montado, usar `Plotly.react` y mantener el estado `ready`.
- [x] T035 [US4] Agregar el listener de `themechange` en `src/components/observatorio/Chart.astro`: reconstruir cada gráfico con datos cacheados, preservar la vista línea/barras, reconstruir los slots de cabecera/pie sin duplicar controles, llamar `reactPlotly` y re-bindear los controles; registrar el listener una sola vez.
- [x] T036 [P] [US4] Configurar Shiki con temas duales en `astro.config.mjs` (`themes: { light: 'github-light', dark: 'github-dark' }`, `defaultColor: false`) y agregar las reglas `.astro-code`/`.astro-code span` para `html[data-theme="dark"]` en `src/styles/global.css`.
- [x] T037 [P] [US4] Agregar estilos de impresión y reducción de movimiento en `src/layouts/BaseLayout.astro` y `src/components/ThemeToggle.astro`: `@media print` fuerza tokens claros y oculta el selector; `prefers-reduced-motion: reduce` desactiva transiciones de tema.
- [ ] T038 [US4] Validar US4 con `quickstart.md` filas 17–40 (teclado, lector de pantalla, reduced motion, contraste, móvil, páginas de cada pilar, gráficos, mapas, código, imágenes, impresión) y registrar el resultado.

**Checkpoint**: todo el sitio, incluidos gráficos, mapas y código, es legible en
ambos temas y cumple accesibilidad.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: documentación viva, auditoría final y validación completa.

- [x] T039 [P] Actualizar `agents/DESIGN-SYSTEM.md` con la paleta oscura, los tokens nuevos, la regla de tema, `ThemeToggle` en el catálogo y las notas de contraste.
- [x] T040 [P] Actualizar `agents/PRODUCT.md` (PRD-04) para permitir la identidad de dos temas y referenciar `specs/007-tema-claro-oscuro/spec.md`.
- [x] T041 [P] Actualizar `agents/ARCHITECTURE.md` con `theme-client.ts`, `theme-colors.ts`, `reactPlotly`, Shiki dual theme y la confirmación de que no hay dependencias nuevas.
- [x] T042 [P] Actualizar `agents/AGENTS.md` con el QA/DoD de tema si corresponde.
- [x] T043 Ejecutar `npx astro check` y corregir cualquier error de tipos nuevo.
- [x] T044 Ejecutar `npm run build` y corregir errores de build o enlaces internos (`scripts/check-internal-links.mjs`).
- [x] T045 Auditar `src/` con `grep -rn "#[0-9a-fA-F]\{3,8\}" src` y migrar cualquier literal de tema olvidado; documentar los literales que se conservan por ser colores de series/estados intencionales.
- [ ] T046 Ejecutar la matriz completa de `quickstart.md` y registrar pass/fail; corregir regresiones.
- [x] T047 Verificar que no haya dependencias ni secretos nuevos (`git diff -- package.json package-lock.json` vacío) y que la nota de enmienda de la constitución siga en `specs/007-tema-claro-oscuro/plan.md`.

---

## Estado de implementación (2026-11-10)

- Implementación completa (T001–T008, T010–T012, T014–T015, T017–T037,
  T039–T045, T047). `npx astro check` 0 errores y `npm run build` OK.
- Verificado con auditoría automática en navegador (tema oscuro, 24 páginas):
  sin superficies claras residuales ni texto de tema con contraste < AA, salvo
  chips con texto blanco sobre color fijo (`.about-profile__status`,
  `.card__tipo--*`, `.tipo-mini--*`) que ya fallaban igual en claro.
- 72 gráficos en 11 páginas renderizan sin error en oscuro; el cambio de tema
  en vivo re-renderiza gráficos y mapas (`carto-darkmatter`) conservando la
  vista línea/barras y sin duplicar controles.
- **Pendiente de validación manual** (T009, T013, T016, T038, T046): cambio de
  tema del sistema operativo en vivo (el emulador no dispara `change` de
  `matchMedia`), teclado y lector de pantalla, móvil ≤768 px, impresión, otra
  pestaña (`storage`) y bloques de código Shiki (hoy ningún contenido tiene
  bloques de código).
- Pendiente de gobernanza: enmienda de la constitución (principio IV) con
  `speckit-constitution`, a aprobar por el autor.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de T001; bloquea todas las historias.
- **User Stories (Phase 3–6)**: dependen de Phase 2.
  - US1 y US2 (P1) pueden ir en paralelo si se separan los archivos, pero US2
    usa `theme-client` de T005.
  - US3 (P2) depende de T005 y de la persistencia base.
  - US4 (P2) depende de T002 (tokens) y de US1/US2 para validar el cambio de
    tema en gráficos y componentes.
- **Polish (Phase 7)**: depende de todas las historias deseadas.

### User Story Dependencies

- **US1**: después de Phase 2; no depende de US2.
- **US2**: después de Phase 2; usa `theme-client` pero es independiente de US1.
- **US3**: después de Phase 2; puede integrarse con US2 pero se prueba sola.
- **US4**: después de Phase 2; necesita US1/US2 para el cambio dinámico, pero la
  migración de tokens puede avanzar en paralelo.

### Within Each User Story

- Tokens y pre-pintado antes de la UI.
- Componente antes de la integración en el sidebar.
- Persistencia antes de la validación de recarga.
- Migración de tokens antes de la validación visual.
- Gráficos: helper → `charts.ts` → chart-defs → `reactPlotly` → `Chart.astro`.

### Parallel Opportunities

- T005 puede ejecutarse en paralelo con T002–T004 (archivo distinto).
- T017–T027 son grupos de archivos distintos: pueden ir en paralelo entre sí.
- T029 puede ir en paralelo con T017–T028 (archivo nuevo).
- T031–T033 pueden ir en paralelo después de T030 (archivos distintos).
- T034 puede ir en paralelo con T029–T033 (archivo distinto).
- T036 puede ir en paralelo con T037 (archivos distintos).
- T039–T042 son documentos distintos: pueden ir en paralelo.

---

## Parallel Example: User Story 4 token migration

```bash
# Lanzar la migración de grupos de archivos distintos en paralelo:
Task: "Migrar src/styles/global.css a tokens"
Task: "Migrar src/components/Sidebar.astro y componentes compartidos"
Task: "Migrar src/pages/calculadoras/*.astro a tokens"
Task: "Migrar src/pages/observatorio/*.astro a tokens"
Task: "Migrar src/pages/elecciones-presidenciales/*.astro a tokens"
```

## Parallel Example: Charts

```bash
# Después de T030:
Task: "Reemplazar neutros en chart-defs/analisis-electoral.ts"
Task: "Reemplazar neutros en chart-defs/elecciones-presidenciales.ts"
Task: "Reemplazar neutros en el resto de chart-defs/*.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1 (T001).
2. Completar Phase 2 (T002–T005).
3. Completar US1 (T006–T009) y US2 (T010–T013).
4. **STOP and VALIDATE**: primera visita automática + selector funcional.
5. Desplegar/demostrar si está listo.

> US1 y US2 son ambas P1: sin US2 el visitante no puede elegir; sin US1 el
> selector no tiene una base automática. El MVP las incluye juntas.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → validar detección automática.
3. US2 → validar selector y cambio inmediato.
4. US3 → validar persistencia.
5. US4 → validar todo el sitio, gráficos, mapas, código e imágenes.
6. Polish → documentación y matriz completa.

### Parallel Team Strategy

1. Un desarrollador completa Phase 1–2.
2. Después de Phase 2:
   - Dev A: US1 + US2 (estado y selector).
   - Dev B: US3 (persistencia).
   - Dev C: US4 (migración de tokens y gráficos).
3. Integrar y validar con `quickstart.md`.

---

## Notes

- `[P]` indica archivos distintos y sin dependencias pendientes.
- Cada historia debe poder validarse sola con su `Independent Test`.
- No se agregan dependencias ni tests automatizados.
- Los colores de series de datos se conservan; solo se adaptan los neutros de
  tema.
- El modo claro debe quedar visualmente igual al actual.
- Los logos y fotos no se invierten.
- Commit después de cada tarea o grupo lógico, solo si el autor lo pide.
