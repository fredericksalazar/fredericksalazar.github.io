# Sistema de diseño · fredericksalazar.github.io

> **Qué es este documento:** el lenguaje visual y de interacción del sitio. Define
> tokens, layout, el patrón de hero, el Observatorio, los gráficos y el catálogo de
> componentes reutilizables. Es vinculante para cualquier persona o agente de IA
> que cree o modifique interfaz. Las reglas `UI-NN` no son negociables.
>
> **Precedencia:** `.specify/memory/constitution.md` → [`PRODUCT.md`](./PRODUCT.md)
> → [`ARCHITECTURE.md`](./ARCHITECTURE.md) → este documento → documentos de módulo.
>
> **Regla de oro:** antes de crear una pieza visual nueva, se busca en el catálogo
> (sección 8) y se reutiliza (ARQ-19). Una pieza nueva requiere spec.
>
> Las marcas **⚑ DECIDIR** son valores que el autor aún debe fijar.
>
> Versión 0.3.0 · Borrador · 2026-10-19 (feature 005: portada del Observatorio, `IndicadorClaveCard`, sparklines)

---

## 1. Principios visuales

1. **Blanco y azul de marca.** Fondo claro, superficies blancas y un único color
   de acento: el azul `#2563eb`. El resto de colores existe solo para datos o
   estados.
2. **Una sola tipografía:** Google Sans Flex en todo el sitio.
3. **Estética "blueprint":** retícula de puntos, gradientes azules muy suaves y
   arcos finos. Transmite ingeniería y precisión.
4. **Los datos son protagonistas:** la interfaz se retira (bordes de 1 px, grises
   suaves) para que las cifras y los gráficos destaquen.
5. **Consistencia por reutilización:** cada patrón existe una vez como componente.
6. **Solo modo claro** (`color-scheme: light`). No hay modo oscuro.

## 2. Tokens

Los tokens viven como variables CSS en `:root` dentro de
`src/layouts/BaseLayout.astro`. Es el **único** lugar donde se definen; los
componentes los consumen con `var(--…)` y nunca escriben valores sueltos.

### 2.1 Color de interfaz

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#f6f8fa` | Fondo general de la página |
| `--color-sidebar` | `#ffffff` | Superficies: sidebar, cards, paneles |
| `--color-border` | `#d0d7de` | Bordes de 1 px y divisores |
| `--color-hover` | `#eaeef2` | Fondo de elementos al pasar el cursor |
| `--color-active-bg` | `rgba(37, 99, 235, 0.08)` | Fondo de elemento activo (navegación) |
| `--color-text-primary` | `#1f2328` | Títulos y texto principal |
| `--color-text-secondary` | `#424a53` | Párrafos y texto de apoyo |
| `--color-text-muted` | `#636c76` | Metadatos, fuentes, etiquetas |
| `--color-accent` | `#2563eb` | **Azul de marca:** enlaces, títulos de hero, cifras clave, estado activo |
| `--color-accent-hover` | `#1d4ed8` | Hover de enlaces y botones |
| `--color-accent-glow` | `rgba(37, 99, 235, 0.15)` | Sombras y halos azules |
| `--color-tag-bg` / `-border` / `-text` | `#eaeef2` / `#d0d7de` / `#424a53` | Etiquetas `.tag` |

**Colores de estado** (solo para mensajes y callouts, nunca como serie de un
gráfico):

| Estado | Borde / ícono | Texto |
|---|---|---|
| Éxito / disponible | `#16a34a` | `#15803d` |
| Aviso | `#d97706` | `#b45309` |
| Importante / error | `#dc2626` | `#b91c1c` |

### 2.2 Tipografía

- **Familia única:** `'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif`,
  cargada desde Google Fonts con pesos `100..900` (en `SEOHead.astro`).
- **Cifras:** en KPIs, tablas y valores numéricos se usa
  `font-variant-numeric: tabular-nums` para que los dígitos se alineen. No se
  usa una fuente monoespaciada para cifras.
- **Código:** solo los bloques de código usan la monoespaciada del sistema
  (`ui-monospace, monospace`).

**Escala tipográfica:**

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | `clamp(2.5rem, 5.2vw, 5.5rem)` | 700 | Título del hero (`h1`) |
| XL | `1.7rem` | 700 | Título de panel o sección (`h2`) |
| L | `1.3rem` | 700 | Subtítulos (`h3`), títulos en móvil |
| KPI | `2rem` | 700 | Valor de KPI |
| Lead | `1.05rem` | 400 | Entradillas |
| Base | `1rem` | 400 | Párrafos (interlineado 1.6–1.7) |
| S | `0.85rem` | 400–600 | Texto secundario, preguntas de gráfico |
| XS | `0.72rem` | 600–700 | Eyebrows, etiquetas de KPI, pills (MAYÚSCULAS con `letter-spacing` 0.08–0.14em en eyebrows) |
| 2XS | `0.65rem` | 600–700 | Microetiquetas |

Pesos permitidos: 400, 500, 600, 700 y 800 (solo cifras destacadas).

### 2.3 Espaciado

Escala en `rem`: `0.25 · 0.5 · 0.75 · 1 · 1.25 · 1.5 · 2 · 2.5 · 3`.
Separación estándar entre bloques de página: `1.5rem`. Padding de cards: `1.25rem`
(chart-card) y `2rem 2.25rem` (paneles); en móvil `1.25rem`.

### 2.4 Bordes redondeados

| Nivel | Valor | Uso |
|---|---|---|
| S | `6px` | Botones pequeños, toggles internos |
| M | `12px` | Chart-card, cards de contenido |
| L | `18px` | Cards de calculadora; paneles en móvil |
| XL | `24px` | `IndicadorPanel`, `PageHeader` |
| Pill | `999px` | Pills, badges del hero, chips |
| Círculo | `50%` | Avatares, puntos |

### 2.5 Sombras

| Nivel | Valor | Uso |
|---|---|---|
| 1 | `0 1px 2px rgba(15, 23, 42, 0.04)` | Pills y elementos en reposo |
| 2 | `0 4px 16px rgba(15, 23, 42, 0.04)` | Card en hover |
| 3 | `0 6px 16px var(--color-accent-glow)` | Elemento destacado en hover (pills, tags) |

### 2.6 Breakpoints

| Nombre | Ancho máximo | Qué cambia |
|---|---|---|
| Móvil S | `480px` | Ajustes finos de componentes |
| Móvil | `640px` | Contenedores a ancho completo |
| Tablet | `768px` | **Sidebar pasa a barra superior**, hero a una columna sin visual |
| Laptop | `1024px` | Grillas de 3 a 2 columnas |

No se crean breakpoints nuevos fuera de esta tabla.

### 2.7 Movimiento

- Transiciones de interfaz: `0.15s`–`0.25s ease`.
- Entradas del hero: `fadeInUp` escalonado (0–0.4 s).
- Animaciones decorativas (pulsos del mapa, halo) son sutiles y nunca bloquean
  la lectura.
- Todo movimiento se desactiva con `@media (prefers-reduced-motion: reduce)`.

### 2.8 Capas (z-index)

| Capa | Valor |
|---|---|
| Navegación sticky del Observatorio / Elecciones | 30 |
| Sidebar | 100 |
| Botón de plegar sidebar | 101 |
| Skip-link | 9999 |
| Capas internas del hero | `--z-hero-bg` 0 · `--z-hero-visual` 1 · `--z-hero-content` 2 · `--z-hero-partners` 3 |

## 3. Layout maestro

```
┌───────────────┬─────────────────────────────────────────────────────┐
│               │  HERO ZONE  (blueprint · título · visual)           │
│   SIDEBAR     ├─────────────────────────────────────────────────────┤
│   (240 px)    │  Navegación de dominio (si el dominio la tiene)     │
│               ├─────────────────────────────────────────────────────┤
│  Perfil       │                                                     │
│  Estadísticas │  ZONA DE CONTENIDO                                  │
│  Navegación   │  secciones · cards · gráficos                       │
│  global       │                                                     │
│  Redes        │                                                     │
│               ├─────────────────────────────────────────────────────┤
│               │  Footer                                             │
└───────────────┴─────────────────────────────────────────────────────┘
```

- **Sidebar (izquierda, fijo):** contiene **solo dominios globales**: perfil,
  estadísticas (años, certificaciones, proyectos), navegación principal (Inicio,
  Experiencia, Certificaciones, Proyectos, Observatorio, Elecciones,
  Calculadoras, Blog) y redes. Ancho `240px`. Se puede plegar con el botón del
  borde; el estado se recuerda en `localStorage`. En `≤ 768px` se convierte en
  barra superior y no se pliega.
- **Zona de contenido (derecha):** todo lo demás. Las páginas de sección usan
  `fullWidth={true}` para que el hero ocupe todo el ancho; el contenido debajo
  vive en su propio contenedor (en el Observatorio: `97%` de ancho, máximo
  `1800px`).
- La navegación **propia de un dominio** (p. ej. pestañas del Observatorio)
  nunca va en el sidebar: va como menú horizontal bajo el hero (sección 5.3).

## 4. Hero zone (patrón obligatorio)

Toda página de sección empieza con el componente `Hero.astro`. **Nunca se
construye un hero propio.**

### 4.1 Anatomía

```
┌────────────────────────────────────────────────────────────────────┐
│ · · · · · · · · · · · · retícula blueprint · · · · · · · · · · · · │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐ │
│  │ ● Badge de contexto         │  │                              │ │
│  │                             │  │      VISUAL DEL DOMINIO      │ │
│  │ Título grande en azul       │  │  (mapa, imagen, ilustración) │ │
│  │                             │  │       con halo azul          │ │
│  │ Subtítulo (máx. 480 px)     │  │                              │ │
│  │                             │  │                              │ │
│  │ valor    valor    valor     │  │                              │ │
│  │ KPI 1    KPI 2    KPI 3     │  │                              │ │
│  │                             │  │                              │ │
│  │ (pill) (pill) (pill)        │  │                              │ │
│  └─────────────────────────────┘  └──────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│ CLOUD PARTNERS │  AWS   Google Cloud   Azure   Databricks  (opc.)  │
└────────────────────────────────────────────────────────────────────┘
         45 %                                  55 %
```

| Elemento | Prop | Especificación |
|---|---|---|
| Fondo | — | Gradiente blanco → `#f5f8ff`, dos halos radiales azules (7–8 % de opacidad), retícula de puntos `#0047ab` cada 22 px al 28 % con máscara elíptica, dos orbes difuminados y dos arcos de 1 px en la esquina inferior derecha. Borde inferior azul al 8 %. |
| Badge | `badge` | Pill verde suave con punto pulsante. Texto corto: **Contexto · Colombia** (p. ej. "Mercado Laboral · Colombia", "Credenciales verificadas"). |
| Título | `title` | `h1`, tamaño Display, peso 700, color azul de marca, interlineado 0.96. Único `h1` de la página. |
| Subtítulo | `subtitle` | 1 rem, `#475569`, máx. 480 px. **Específico de la página**: nunca se copia de otra. |
| KPIs | `kpis` | 2 a 4 cifras: valor 2 rem azul + etiqueta XS en mayúsculas. Las cifras vienen de datos (nunca escritas a mano si existen en un JSON o colección). |
| Tags | `tags` | Pills blancas con borde azul al 18 %; suben 2 px en hover. Deben describir **esta** página. |
| Visual | slot `visual` | Elemento del dominio con halo azul difuminado detrás. Se oculta en `≤ 768px`. |
| Partners | `showPartners` | Franja de logos cloud. **Solo en páginas del CV** (inicio, experiencia, certificaciones). En el resto: `showPartners={false}`. |
| Animación | — | Entrada escalonada `fadeInUp` del contenido y `fadeInRight` del visual. |
| Altura | — | `min-height: 680px` en escritorio; automática en móvil. |

### 4.2 Visual por dominio

| Dominio | Visual del hero |
|---|---|
| Inicio | Retrato + contenido propio vía slot `content` (nombre en dos líneas, rol, tagline) |
| Experiencia | Logos de empresas |
| Certificaciones | Imagen de credenciales |
| Proyectos | Variante `hero--constellation` |
| **Observatorio y sus subpáginas** | **`<MapaColombia />`** (sección 5.2) |
| **Calculadoras** | **`<MapaColombia />`** + KPIs del dato que usa la calculadora |
| Informes | Portada del informe o ilustración SVG de documentos |
| Acerca del Observatorio | Ilustración SVG propia |
| Elecciones | Sin visual: el hero muestra solo badge, título y subtítulo (decisión del autor) |
| Blog (índice) | Visual propio del blog |

**Para un dominio nuevo:** se usa `<Hero>` con badge, título, subtítulo propio,
tags propios y un visual del dominio; si el dominio es de datos de Colombia, el
visual es `<MapaColombia />`.

### 4.3 Páginas de detalle y editoriales

El índice del blog (`/blog/`) es una página de sección y usa `<Hero>`.

Los artículos del blog (`/blog/[slug]/`), las fichas de proyecto
(`/proyectos/[slug]/`) y los listados secundarios del blog (etiquetas, archivo)
usan una **cabecera editorial** (título `h1`, metadatos y descripción) en lugar
del hero, para que el contenido aparezca de inmediato.

## 5. Observatorio

### 5.1 Estructura de una subpágina

Todas las subpáginas del Observatorio siguen este orden, sin excepciones:

```
1. <Hero> con <MapaColombia slot="visual" />   badge de dominio, título, subtítulo y tags propios
2. <DashboardNav active="…" />                 menú horizontal sticky
3. Contenedor .observatorio-container
   3.1 <PageHeader eyebrow="Actualizado · {periodo}">   resumen en una frase con cifras en <strong>
   3.2 <KpiRow />                              KPIs del momento (build-time, SEO)
   3.3 <IndicadorPanel numero="01"…>           un panel por indicador, numerados 01, 02…
         slot text   → explicación en lenguaje sencillo
         slot visual → <Chart id="…" embedded />
   3.4 <GlosarioGrid />                        términos clave
   3.5 <DashboardFooter />                     fuentes, definiciones, cobertura
4. <PlotlyLoader />                            una sola vez
5. JSON-LD Dataset + Article
```

### 5.2 Hero con el mapa de Colombia

`MapaColombia.astro` es la firma visual del Observatorio:

- **Mapa real** de Colombia (`public/images/co.svg`) en SVG, relleno azul profundo
  `rgba(15, 67, 163, 0.92)` con divisiones departamentales en blanco al 55 %.
- **32 capitales** como puntos blancos con resplandor; **Bogotá** destacada (punto
  mayor, anillo y brillo); Medellín, Cali, Bucaramanga y Barranquilla en tamaño
  medio.
- **Pulsos tipo sonar** (ondas concéntricas blancas) que salen de las capitales
  con retrasos distintos: transmite "datos vivos de todo el país".
- Entra con un fundido y una leve escala (1.4 s). Máximo 750 × 750 px, centrado
  en la columna derecha del hero, con el halo azul del hero detrás.
- Es decorativo (`aria-hidden`) y se oculta en móvil junto con el visual del hero.

### 5.3 Menú horizontal del dominio

`DashboardNav.astro` (Observatorio) y `EleccionesNav.astro` (Elecciones):

- Barra **sticky** pegada arriba (`z-index: 30`), fondo blanco al 92 % con
  desenfoque, borde inferior de 1 px.
- Ítems en fila, texto `0.88rem` peso 500 en gris secundario; contenido centrado
  hasta `1280px`.
- **Hover:** texto azul y subrayado azul al 30 %.
- **Activo:** texto azul, peso 600, subrayado azul de 2 px y un punto azul de
  6 px antes del texto.
- En pantallas estrechas el menú se desplaza horizontalmente.
- Toda subpágina nueva se agrega a este menú.

### 5.4 Panel de indicador

`IndicadorPanel.astro`: card blanca, borde 1 px, radio XL (24 px), padding
`2rem 2.25rem`.

- **Cabecera:** número grande (`3rem`, peso 800, azul al 32 %), eyebrow azul en
  mayúsculas, título `h2` (XL) y entradilla.
- **Texto:** párrafos de hasta 90 caracteres de ancho; viñetas con marcador azul;
  cifras en `<strong>`.
- **Visual:** el gráfico (`embedded`).
- **Pie:** "Fuente:" con enlace azul, separado por un borde de 1 px.

### 5.5 Portada del Observatorio (`/observatorio/`)

La Home sigue la sección 5.1 (Hero con mapa, menú, footer), pero sin
`PageHeader` ni paneles numerados: presenta directamente los indicadores clave.
No enlaza la descarga de los JSON procesados (decisión del autor).

```
1. <Hero> + <MapaColombia />        KPIs de contexto, cada uno con periodo y fuente
2. <DashboardNav active="inicio" />
3. "Cómo va Colombia"               un h2 por grupo · <IndicadorClaveCard> × 8
4. "Lo más reciente"                <BandaOscura> · <Card variant="blog"> × 4 (automático)
5. "Datos en los que puedes confiar" fuentes, actualización, licencia y cita
6. <AuthorBio> + CTA al perfil
7. <DashboardFooter>
```

- **Sin juicios de valor:** el cambio ("subió/bajó X frente a {periodo}") y la
  referencia (meta oficial, promedio de 20 años o hace un año) van en gris
  neutro; nunca rojo/verde ni "mejor/peor".
- **Frescura:** la etiqueta "Dato no reciente" usa el color de aviso (sección 2.1)
  y siempre lleva texto.
- **Grillas:** el panel ocupa 4 columnas lógicas (cada grupo tantas como tarjetas)
  y pasa a 2 columnas en `≤ 1024px` y a 1 en `≤ 640px`.

## 6. Gráficos

### 6.1 Siempre en formato card

Todo gráfico se presenta dentro de una card. Hay dos formatos, ambos ya
existentes:

| Contexto | Contenedor |
|---|---|
| Página de dashboard (Observatorio, Elecciones) | `IndicadorPanel` con `<Chart id embedded />` dentro (la card es el panel) |
| Cualquier otro lugar (blog, calculadoras, páginas nuevas) | `<Chart id="…" />` sin `embedded`: genera la **chart-card** |

**Anatomía de la chart-card** (`ChartContainer.astro`): fondo blanco, borde 1 px,
radio M (12 px), padding `1.25rem`; en hover el borde pasa a azul al 30 % con
sombra nivel 2.

```
┌─────────────────────────────────────────────────────┐
│ Título del gráfico             Ver en barras [◯─] │  ← controles a la derecha
│ Pregunta que responde el gráfico                    │
│                                                     │
│  Máx · 12,5 % ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  Prom · 6,1 % · · · · · · · · · · · · · · · · · ·   │
│            ╱╲    ╱╲___                              │
│  ─────────╱──╲__╱─────╲_____                        │
│  Mín · 1,2 % ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
├─────────────────────────────────────────────────────┤
│ Fuente: DANE                                        │
└─────────────────────────────────────────────────────┘
```

Estados: **cargando** (skeleton animado sobre el lienzo) y **error** (mensaje +
botón "Reintentar"). Los maneja el componente; ningún gráfico los reimplementa.

### 6.2 Interruptor "Ver en barras"

**Todo gráfico de línea** incluye el interruptor "Ver en barras" en la cabecera,
a la derecha: apagado = línea (vista inicial), encendido = barras. Usa el mismo
marcado y estilo que los demás interruptores de cabecera (`.pres-toggle`), con
`role="switch"` y `aria-label`, y su texto se ve también en móvil (la cabecera
envuelve si no cabe). Hay **una sola implementación**:

- La receta lo **declara** con `vistas: ["linea", "barras"]` en su `ChartDef`
  (activación explícita). No escribe HTML del control ni trazas de barras.
- `Chart.astro` dibuja el control, guarda la vista de cada gráfico (inicial:
  "Línea") y convierte las trazas con `aVista()` de `charts.ts`: las series de
  línea pasan a barras con su mismo color, las áreas auxiliares se ocultan, las
  barras existentes no cambian y, si quedan varias series, se agrupan lado a
  lado (también en doble eje). Los períodos sin dato quedan como huecos.
- Si la receta tiene controles propios (p. ej. "Mostrar inflación", "Color por
  presidente"), redibuja **solo** con `ctx.render(trazas)` dentro de
  `onMount(target, ctx)`, para respetar la vista elegida. Las recetas nunca
  llaman a `Plotly.react` ni a `Plotly.restyle`. El interruptor "Color por
  presidente" es único: `chart-defs/color-presidente.ts`, y **siempre arranca
  apagado** (color por defecto, leyenda oculta): colorear por gobierno es una
  decisión del visitante.
- Para una serie temporal simple, la traza estándar es `trazaLinea()` de
  `charts.ts`.

Estilo del control: fondo `#f1f5f9`, borde `#e2e8f0`, radio 8 px; botones de
`0.75rem` peso 600 en gris; el activo en blanco con sombra suave; foco visible
con contorno azul de 2 px; `aria-pressed` refleja la vista activa.

**Excepción conocida:** los comparativos "Colombia vs rival" del blog aún no
tienen el control ni las etiquetas a la izquierda (fuera del alcance de la
feature 001, decisión del autor).

### 6.3 Color en gráficos

**Color por defecto: azul de marca `#2563eb`.** Un gráfico de una sola serie
siempre es azul, salvo que tenga un color semántico (tabla de abajo).

**Protocolo para agentes de IA:** antes de crear un gráfico, el agente **pregunta
al autor qué color asignar**, ofreciendo el azul por defecto y la paleta
categórica. No elige colores por su cuenta.

**Paleta categórica** (para varias series; se asigna **en este orden fijo**, nunca
salteado). Validada para daltonismo, contraste ≥ 3:1 sobre blanco y separación
visual entre colores vecinos:

| Orden | Nombre | Hex |
|---|---|---|
| 1 | Azul de marca | `#2563eb` |
| 2 | Naranja | `#ea580c` |
| 3 | Violeta | `#7c3aed` |
| 4 | Verde azulado | `#0d9488` |
| 5 | Ocre | `#a16207` |
| 6 | Magenta | `#db2777` |

Más de 6 series no se resuelven con un séptimo color: se agrupan en "Otros"
(gris `#64748b`) o se divide en varios gráficos.

**Colores semánticos** (fijos para un significado; definidos en `COLORS` de
`charts.ts`):

| Significado | Color |
|---|---|
| Inflación | `#dc2626` |
| Deflación / dentro de meta / acelerador | `#16a34a` |
| Tasa de interés | `#2563eb` |
| Sector externo / TRM | `#ea580c` |
| Freno (spread restrictivo) | `rgba(220, 38, 38, 0.18)` |
| Banda de meta (2–4 %) | `rgba(34, 197, 94, 0.08)` (`COLORS.metaBanda`) |
| Meta BanRep (3 %) | `#16a34a`, línea **punteada**; constante única `META_BANREP` |
| Ideología: izquierda / centro / derecha | `#dc2626` / `#16a34a` / `#2563eb` |
| Clases sociales: pobreza / vulnerable / media / alta | `#ef4444` / `#f97316` / `#22c55e` / `#3b82f6` |

**Escalas para mapas:**

- **Secuencial** (magnitud): un solo tono azul, de claro a oscuro: `#dbeafe` →
  `#93c5fd` → `#60a5fa` → `#2563eb` → `#1d4ed8` → `#1e3a8a`.
- **Divergente** (a favor / en contra): rojo `#dc2626` ↔ gris neutro `#e5e7eb` ↔
  azul `#2563eb`. El punto medio siempre es gris.

**Reglas:** el color sigue a la entidad, no a su posición (si se filtra una serie,
las demás no cambian de color); el texto de valores y leyendas va en tintas de
texto, no en el color de la serie; nunca arcoíris.

Todo color nuevo de gráfico se agrega a `COLORS` y a esta sección; nunca un hex
suelto dentro de un `ChartDef`.

### 6.4 Etiquetas de datos y líneas de referencia

- **Todas las etiquetas de líneas de referencia van a la izquierda del gráfico**
  (`x: 0`, `xanchor: "left"`): promedio, máximo, mínimo, meta y cualquier otra.
  Así quedan alineadas con el eje Y y no tapan el tramo más reciente de la serie,
  que es el de la derecha.
- Formato del texto: `Etiqueta · valor` (p. ej. `Prom · 6,1 %`), tamaño
  `10px`, color de su línea, fondo blanco al 90 %, borde `#cbd5e1` de 1 px.
- Etiquetas fijas en todo el sitio: **Máx**, **Mín** y **Prom** (sin variantes
  como "Promedio" o "Promedio histórico").
- Color: gris neutro `#64748b` para las tres, sin sugerir que un extremo es bueno
  o malo; se distinguen por etiqueta y trazo: **Máx** y **Mín** discontinuas,
  **Prom** punteada; 1.5 px.
- **Meta BanRep:** verde `#16a34a`, línea **punteada** (se distingue de Máx y Mín
  por color y trazo, del Prom por el color, y de todas por la etiqueta, que es la
  señal principal). Se usa siempre la constante
  `META_BANREP` de `charts.ts`; ninguna receta redefine la meta.
- **Etiquetas cercanas:** si dos referencias quedan a menos del 6 % del rango
  visible del eje Y, se combinan en una sola etiqueta
  (`Prom · 6,1% · Meta BanRep · 3%`) en tinta de texto `#475569`. Si la
  receta fija `yaxis.range`, lo pasa como `rangoY`.
- Se generan **solo** con `lineasReferencia(valores, opciones)` de `charts.ts`
  (máximo, mínimo y promedio activables, `extra`, `formato`, `sufijo`,
  `decimales`, `rangoY`); no se escriben a mano.
- Números en formato es-CO (coma decimal) con `toLocaleString("es-CO")`.
- Las anotaciones de **eventos** con flecha (p. ej. "Pandemia", "COVID") no son
  líneas de referencia: señalan un punto de la serie y conservan su posición.

### 6.5 Ejes, fondo y tooltip

- Todo layout empieza con `baseLayout()` de `charts.ts`.
- Fondo transparente; sin grilla vertical; grilla horizontal muy suave
  (`rgba(208, 215, 220, 0.4)`); línea del eje X en `#d0d7de`.
- Ticks de `11px` en gris muted; texto general `12px` Google Sans Flex.
- Sufijo del eje Y explícito: `%` por defecto; otras unidades lo sobrescriben.
- Tooltip: fondo blanco, borde `#d0d7de`, texto `12px`.
- Altura definida en el `ChartDef` (`height`), nunca con CSS en la página.
- Línea de serie de `2.2px`; relleno bajo la línea al 6 % del color.
- Se permite el doble eje Y cuando el gráfico compara dos medidas de distinta
  escala (patrón de `poblacionPib` o `pibComercio`); cada eje lleva su unidad.

### 6.6 Accesibilidad de gráficos

- `ariaLabel` obligatorio en el `ChartDef`.
- Con 2 o más series hay leyenda; la identidad nunca depende solo del color.
- Cada gráfico tiene título y una pregunta que responde.

## 7. Patrones de página

| Tipo de página | Estructura |
|---|---|
| Sección del CV | `Hero` (con partners) → secciones con `section-label` + título → cards |
| Dashboard de datos | Sección 5.1 |
| Calculadora | `Hero` con mapa y KPIs → formulario en card → resultados en cards → FAQ |
| Listado principal (proyectos, blog) | `Hero` → filtros → grilla de `Card` |
| Listado secundario (etiquetas, archivo) | Cabecera editorial → grilla o lista |
| Detalle (post, proyecto) | Cabecera editorial → contenido → autor → relacionados |

## 8. Catálogo de componentes reutilizables

Antes de crear algo, se usa lo que existe.

| Componente | Ubicación | Para qué |
|---|---|---|
| `BaseLayout` | `layouts/` | Layout único: sidebar, contenido, footer, SEO |
| `Hero` | `components/` | Hero zone de toda página de sección |
| `Card` | `components/` | Cards de proyecto, blog, relacionado y certificación (`variant`, `layout`) |
| `Callout` | `components/` | Notas en contenido: `nota`, `tip`, `aviso`, `importante` |
| `AuthorBio`, `ShareButtons`, `TableOfContents`, `ReadingProgress` | `components/` | Piezas del artículo |
| `BlogFilters` | `components/` | Filtros del listado del blog |
| `MapaColombia` | `components/observatorio/` | Visual del hero de datos de Colombia |
| `DashboardNav`, `EleccionesNav` | `components/observatorio/` | Menú horizontal de dominio |
| `PageHeader` | `components/observatorio/` | Resumen del estado actual |
| `KpiRow`, `IndicadorCard` | `components/observatorio/` | Fila de KPIs |
| `BandaOscura` | `components/observatorio/` | Sección de contraste a todo el ancho (azul marino, retícula y orbes, texto claro). Usada en Acerca y en "Lo más reciente" de la Home |
| `IndicadorClaveCard` | `components/observatorio/` | Tarjeta de indicador clave de la Home: valor, periodo, cambio y referencia neutrales, fuente y sparkline |
| `IndicadorPanel` | `components/observatorio/` | Panel narrativo con gráfico |
| `Chart` + `ChartContainer` | `components/observatorio/` | Gráfico por id y su card; `variant="sparkline"` para mini tendencias dentro de otra card |
| `GlosarioGrid` | `components/observatorio/` | Glosario |
| `DashboardFooter` | `components/observatorio/` | Fuentes, definiciones y cobertura |
| `PlotlyLoader` | `components/observatorio/` | Carga de Plotly (una vez por página) |
| `MarcadorEconomico`, `MarcadorFutbol`, `FaqSchema` | `components/blog/` | Piezas MDX del blog |

**Clases utilitarias globales** (en `BaseLayout`): `.tag`, `.pill`, `.badge`
(`--data-analysis`, `--ml`, `--software`, `--data-engineering`), `.section-label`.

## 9. Iconografía e imágenes

- **Íconos:** SVG en línea, `viewBox="0 0 24 24"`, trazo `2`, extremos y uniones
  redondeados, color `currentColor`, tamaño 16–20 px. Estilo lineal uniforme.
- **Imágenes:** en `public/images/`; se optimizan con
  `node scripts/optimize-images.mjs` antes de publicarse.
- **og:image:** PNG 1200 × 630 con la estética del hero (blueprint, mapa o
  gráfico del Observatorio y titular). Los scripts `scripts/build-*-cover.*`
  generan las portadas.

## 10. Accesibilidad

- Contraste de texto AA como mínimo.
- Foco visible: `outline: 2px solid var(--color-accent); outline-offset: 2px`.
- Un solo `h1` por página (el del hero o la cabecera editorial).
- Skip-link "Saltar al contenido".
- `aria-label` en navegación, gráficos y controles sin texto.
- Respeto a `prefers-reduced-motion`.

## 11. Reglas de UI

| ID | Regla |
|---|---|
| **UI-01** | Solo se usan los tokens de la sección 2; no hay colores, tamaños, radios, sombras ni breakpoints sueltos. Un valor nuevo se agrega primero como token. |
| **UI-02** | Una sola tipografía: Google Sans Flex. |
| **UI-03** | Layout maestro: sidebar izquierdo solo para dominios globales; contenido a la derecha. |
| **UI-04** | Toda página de sección usa `<Hero>` con subtítulo y tags propios; nunca se copia el texto de otro hero. |
| **UI-05** | El Observatorio, sus subpáginas y las calculadoras usan `<MapaColombia />` como visual del hero. Elecciones no lleva visual. |
| **UI-06** | La navegación de un dominio va en un menú horizontal sticky bajo el hero, con el patrón de la sección 5.3. |
| **UI-07** | Todo gráfico se muestra en card: `IndicadorPanel` en dashboards o chart-card en el resto. *Excepción aprobada (spec 005, 2026-10-19): las sparklines `spark-*` viven dentro de `IndicadorClaveCard`, que es su card.* |
| **UI-08** | Todo gráfico de línea tiene el interruptor "Ver en barras" (apagado = línea), declarado con `vistas: ["linea", "barras"]` en su `ChartDef`. *Excepción aprobada (spec 005, 2026-10-19): las sparklines `spark-*` (48 px, sin ejes, estáticas) no llevan interruptor.* |
| **UI-09** | Color por defecto azul de marca; varias series con la paleta categórica en orden fijo; el agente pregunta el color al autor antes de crear un gráfico. |
| **UI-10** | Las etiquetas de líneas de referencia (promedio, máximo, mínimo, meta) van a la izquierda del gráfico. |
| **UI-11** | Antes de crear un componente se revisa el catálogo de la sección 8; uno nuevo requiere spec y se agrega al catálogo. |
| **UI-12** | Cumplir la sección 10 de accesibilidad. |

## 12. Mantenimiento

- Se actualiza en la misma feature que cambie un token, un patrón o un componente
  del catálogo.
- Versionado: MAJOR si cambia la identidad (color de marca, tipografía, layout
  maestro); MINOR si se agrega un token, componente o regla; PATCH si se aclara.
