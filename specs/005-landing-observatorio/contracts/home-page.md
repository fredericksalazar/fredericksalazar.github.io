# Contrato UI · Home del Observatorio (`/observatorio/`)

Contrato observable de la página: estructura, contenido en el HTML inicial y
comportamiento. Lo verifican `quickstart.md` y `/speckit-analyze`.

## 1. Orden de secciones

```
1. <Hero> + <MapaColombia slot="visual" />
     badge "Datos públicos · Colombia", h1 propio, subtítulo propio,
     kpis: 3 cifras de contexto (población, datasets publicados, años de historia)
     tags propios de la Home
2. <DashboardNav active="inicio" />          nuevo ítem "Inicio" primero
3. .observatorio-container
   3.1 Panel "Cómo va Colombia"               section[aria-labelledby]
         h2 por grupo: Precios y dinero · Actividad y bienestar · Empleo ·
         Sector externo · Contexto
         <IndicadorClaveCard> × 8
   3.2 Sección "Lo más reciente"              h2 + 4 publicaciones (Card existente)
   3.3 Sección "Datos en los que puedes confiar"
         fuentes oficiales, cómo se actualiza, metodología (Acerca),
         licencia CC BY 4.0, cita sugerida (sin enlaces a los JSON)
   3.4 Bloque de autor                        AuthorBio existente + CTA perfil
   3.5 <DashboardFooter />                    fuentes, cobertura
   (Refinamiento 2026-10-19: sin resumen en PageHeader, sin "Explora por tema",
    sin bloque de descarga de JSON ni `distribution` en el JSON-LD.)
4. <PlotlyLoader />                            una sola vez
5. JSON-LD: DataCatalog (+ Dataset × 7) y WebPage; BreadcrumbList vía BaseLayout
```

## 2. `IndicadorClaveCard.astro` (componente nuevo)

```ts
interface Props {
  indicador: IndicadorClave;   // data-model sección 2
}
```

**HTML inicial (sin JS) DEBE contener:** nombre, valor formateado con unidad,
periodo (`<time datetime="YYYY-MM">`), cambio ("subió 0,03 pp vs ago. 2026"),
frase de referencia, explicación, enlace a la fuente oficial (`rel="noopener"`,
nueva pestaña) y enlace al dominio ("Ver dashboard de …").

**Reglas visuales:**
- Cambio y referencia en gris neutro (`--color-text-secondary`); nunca rojo o
  verde (Q2).
- Flecha ↑ / ↓ / → con `aria-hidden`; el texto ("subió", "bajó", "sin cambio")
  la acompaña siempre.
- Hueco de la sparkline: alto fijo de 48 px para evitar saltos de layout; sin
  JS queda vacío sin romper la tarjeta.
- Toda la tarjeta es un solo destino de foco (enlace al dominio); la fuente es un
  enlace secundario aparte.
- Etiqueta "Dato no reciente" cuando `frescura === "no-reciente"`.
- Solo tokens de DESIGN-SYSTEM sección 2 (UI-01).

## 3. `Chart.astro` · variante `sparkline`

```ts
interface Props {
  id: ChartId;
  embedded?: boolean;
  variant?: "card" | "sparkline";   // nuevo; por defecto "card"
}
```

- `variant="sparkline"`: no envuelve en `ChartContainer` (sin título, pregunta ni
  fuente), contenedor de 48 px de alto, `role="img"` y `aria-label` del def
  (p. ej. "Tendencia de la inflación anual en los últimos 24 meses").
- Los defs `spark-*` los genera `makeSparkline()` y se registran en
  `chart-defs/index.ts`; ocupan `vistas: ["linea"]` (sin interruptor, excepción
  UI-08 aprobada en el plan).
- Layout: `baseLayout()` con ejes ocultos, márgenes 0, `config.staticPlot: true`,
  línea de 2 px `COLORS.brand`, punto final marcado.

## 4. `DashboardNav.astro`

- Lista de ítems tomada de `DOMINIOS` en `home.ts`.
- Nuevo primer ítem `{ slug: "inicio", label: "Inicio", href: urls.observatorio() }`.
- "Inflación vs Tasa" → `urls.observatorioSub('inflacion')`, `slug` sin cambios
  (`inflacion-tasa`).

## 5. Metadatos

| Campo | Valor |
|---|---|
| `title` | "Indicadores económicos de Colombia hoy · Observatorio" (≤ 60) |
| `description` | ≤ 160 caracteres (research R10) |
| `image` | `/images/observatorio-home.png` (PNG 1200×630) |
| `breadcrumbs` | `trail(sectionCrumb.observatorio)` |
| canonical | `https://fredericksalazar.github.io/observatorio/` |

## 6. Dashboard de inflación (`/observatorio/inflacion/`)

- Mismo contenido que la `index.astro` actual; cambian: `DashboardNav active`
  igual, `breadcrumbs={trail(sectionCrumb.observatorio, { name: 'Inflación y tasas', url: absUrls.observatorioSub('inflacion') })}`,
  JSON-LD `url`/`mainEntityOfPage` con `absUrls.observatorioSub('inflacion')`, y
  un enlace de vuelta "← Todos los indicadores" hacia la Home.

## 7. Analítica

Los enlaces de tarjetas, dominios y publicaciones llevan `data-ga-event`
(`home_indicador_click`, `home_dominio_click`, `home_publicacion_click`) con
`data-ga-*` del destino, para medir K4 y SC-007.
