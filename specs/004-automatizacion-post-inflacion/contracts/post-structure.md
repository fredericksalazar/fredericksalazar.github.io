# Post Structure Contract: Informe Mensual de Inflación

Cada artículo generado automáticamente en `src/content/blog/inflacion-tasas-interes-colombia-<mes>-<anio>.mdx` DEBE seguir estrictamente esta estructura:

```markdown
---
titulo: "Inflación en Colombia <mes> <año>: <gancho_principal_con_cifras>"
tituloSeo: "Inflación en Colombia <mes> <año>: <inflacion>% y tasa BanRep <tasa>%"
fecha: <YYYY-MM-DD>
descripcion: "<resumen de 1 párrafo de máximo 160 caracteres con cifras clave>"
etiquetas: ["Inflación", "Colombia", "Economía", "Banco de la República", "Tasas de Interés", "Observatorio de Datos"]
autor: "Frederick Salazar"
imagen: "/images/blog/inflacion-tasas-colombia-<mes>-<año>-cover.png"
draft: false
tipo: "analisis"
destacado: true
resumen: "<resumen ejecutivo de 2 a 3 oraciones>"
---

import Chart from "../../components/observatorio/Chart.astro";
import PlotlyLoader from "../../components/observatorio/PlotlyLoader.astro";
import FaqSchema from "../../components/blog/FaqSchema.astro";

<PlotlyLoader />

<FaqSchema items={[
  { q: "¿Cuánto fue la inflación en Colombia en <mes> de <año>?", a: "..." },
  { q: "¿Cuál es la tasa de interés del Banco de la República en <mes> de <año>?", a: "..." },
  { q: "¿Por qué <subió/bajó/se mantuvo> la inflación anual en <mes>?", a: "..." },
  { q: "¿Cuál es la meta de inflación del Banco de la República?", a: "La meta es del 3% anual, con un rango de tolerancia de ±1 punto porcentual (entre 2% y 4%). Con <inflacion>%, la inflación está..." },
  { q: "¿Qué significa que la tasa real (spread) esté en <spread> puntos?", a: "..." },
]} />

[Párrafo introductorio contextualizando el dato del mes frente al mes anterior y la meta del BanRep]

[Enlace contextualizado al Observatorio de Datos de Colombia (/observatorio/)]

## Los números de <mes> de <año>

- **Inflación anual: <valor>%** — [comparativa mes anterior y récord del año]
- **Inflación mensual: <valor>%** — [comparativa mes anterior]
- **Tasa de intervención del BanRep: <valor>%** — [situación de la tasa]
- **Tasa real (spread): <valor> puntos** — [explicación del spread]

## La inflación <repunte / descenso / estabilidad>

<Chart id="inflacion-anual" embedded={true} />

[Análisis de la serie anual y enlace al análisis histórico /blog/visualizacion-inflacion-vs-tasas-interes-colombia/]

### De dónde viene la variación de <mes>: El efecto base

[Explicación pedagógica de la variación mensual y del efecto base (mes que sale hace 12 meses vs mes que entra)]

## La respuesta del Banco de la República: <pausa / ajuste> en <tasa>%

<Chart id="tasa-interes" embedded={true} />

[Explicación de la política monetaria y el costo del crédito]

## <Mes> <año> frente a <mes> <año anterior>: la foto del año

| Indicador | <Mes> <año anterior> | <Mes anterior> <año> | <Mes> <año> |
|---|---|---|---|
| Inflación anual | ...% | ...% | **...%** |
| Inflación mensual | ...% | ...% | **...%** |
| Tasa BanRep | ...% | ...% | **...%** |
| Tasa real (spread) | ... pp | ... pp | **... pp** |

[Interpretación de la tabla a 12 meses]

## El freno monetario: comportamiento del spread

<Chart id="spread" embedded={true} />

[Lectura pedagógica del spread: freno (positivo/rojo) vs acelerador (negativo/verde)]

## Qué significa para tu bolsillo

- **El crédito...**
- **El ahorro...**
- **Los precios...**
- **Decisiones financieras...**

## Conclusión

[Párrafo final sintetizando el balance y apuntando al dashboard /observatorio/]

## Preguntas frecuentes

### ¿Cuánto fue la inflación en Colombia en <mes> de <año>?
...

### ¿Cuál es la tasa de interés del Banco de la República en <mes> de <año>?
...

### ¿Por qué <subió/bajó> la inflación anual en <mes>?
...

### ¿Cuál es la meta de inflación del Banco de la República?
...

### ¿Qué significa que la tasa real (spread) esté en <spread> puntos?
...

## Fuentes y metodología

Los datos provienen de fuentes públicas y verificables: la **inflación (IPC)** del [DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-al-consumidor-ipc) y la **tasa de intervención** del [Banco de la República](https://www.banrep.gov.co/es/estadisticas/tasas-de-interes-de-politica-monetaria). La tasa real (spread) es un cálculo propio: tasa de intervención menos inflación anual. Todas las series y gráficos se actualizan automáticamente en el [Observatorio de Datos de Colombia](/observatorio/).

Este es un análisis técnico, educativo e independiente, sin afiliación política. Su objetivo es aportar evidencia y contexto para entender mejor la economía del país.
```
