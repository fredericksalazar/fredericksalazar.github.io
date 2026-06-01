---
titulo: "Análisis Elecciones Congreso Colombia 2022-2026"
descripcion: "Dashboard interactivo de resultados electorales del Congreso colombiano. Visualizaciones D3.js, mapas coropléticos, análisis comparativo 2022 vs 2026, costo por curul y distribución ideológica."
tecnologias: ["D3.js", "Chart.js", "Python", "Data Visualization", " electoral"]
categoria: "data-analysis"
fecha: "2026-03-16"
github: "https://github.com/fredericksalazar/analisis-elecciones-colombia"
demo: "https://fredericksalazar.github.io/analisis-elecciones-colombia/"
imagen: "/images/blog/image-10.png"
destacado: true
orden: 3
---

Análisis detallado de las elecciones legislativas en Colombia 2022-2026. Un proyecto de visualización de datos electorales que transforma los resultados oficiales de la Registraduría en conocimiento accionable.

## Características Principales

- **Dashboard Interactivo**: Gráficos dinámicos con Chart.js y D3.js
- **Mapas Coropléticos**: Distribución geográfica del poder político por departamento
- **Análisis Comparativo**: Variación de votos 2022 vs 2026 por partido
- **inteligencia Electoral**: Costo por curul, eficiencia y desvío representativo
- **Distribución Ideológica**: Hemicios por bloques Izquierda/Centro/Derecha

## Tecnologías

- **D3.js**: Mapas y visualizaciones geoespaciales
- **Chart.js**: Gráficos de barras y torta
- **Python**: Pipeline de datos y procesamiento
- **Datos Abiertos**: Registraduría Nacional del Estado Civil

## Secciones del Análisis

1. **Participación y Apatía Electoral**: KPI de participación, Abstención
2. **Reparto del Poder**: Distribución de curules por partido
3. **Ganadores y Perdedores**: Variación porcentual 2022-2026
4. **Tablero de Gobernabilidad**: Hemiciclos del Senado y Cámara
5. **inteligencia Electoral**: Costo por curul por partido
6. **Mapa del Poder**: Mapas geográficos por departamento
7. **Rendimiento por Partidos**: Análisis detallado por organización política

## Datos Oficiales

Fuente: Registraduría Nacional del Estado Civil - Resultados electorales 2022 y 2026.

![Datos Oficiales — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-3.png)

## Mapa del Poder - Distribución por Departamento

Los resultados electorales dibujan un país fragmentado, donde el poder se define región por región.

![Mapa del Poder - Distribución por Departamento — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-8.png)

## Variación Ideológica 2022 vs 2026

Comparativa de la distribución ideológica en el Congreso.

![Variación Ideológica 2022 vs 2026 — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-9.png)

## Hemiciclo del Senado

Distribución de las 103 curules del Senado por partido político.

![Hemiciclo del Senado — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-6.png)

## Análisis de Eficiencia

El costo por curul revela qué tan bien aprovechó cada partido sus votos.

![Análisis de Eficiencia — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-7.png)

## Variación por Departamento

Dinámica de movilización electoral por región.

![Variación por Departamento — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-8.png)

## Tablero de Gobernabilidad

El nuevo Congreso: un tablero dividido donde ninguna fuerza tiene mayoría absoluta.

![Tablero de Gobernabilidad — Análisis Elecciones Congreso Colombia 2022-2026](/images/blog/image-9.png)

## Metodología

Pipeline de datos transparente y auditable:

1. **Extracción**: Datos PDFs oficiales Registraduría
2. **Normalización**: Diccionario maestro de partidos
3. **Consolidación**: Distribución proporcional de coaliciones
4. **Cálculo**: Indicadores de eficiencia electoral

> Este es un proyecto técnico, educativo e independiente. No tiene afiliación política.

## Repositorio

- **GitHub**: [Repositorio del análisis de elecciones Colombia](https://github.com/fredericksalazar/analisis-elecciones-colombia)
- **Demo**: [Dashboard interactivo del análisis de elecciones Colombia](https://fredericksalazar.github.io/analisis-elecciones-colombia/)

## Contexto del análisis

Las elecciones legislativas de Colombia generan cada cuatro años un volumen masivo de datos públicos: votos por partido, por departamento, por candidato, abstención, votos nulos y curules asignadas tras el escrutinio. Sin embargo, esos datos suelen quedar atrapados en PDFs oficiales o tableros estáticos de la Registraduría, sin permitir análisis comparativo entre ciclos electorales ni una lectura geográfica clara. Este proyecto nace para llenar ese vacío: tomar los resultados oficiales de **2022** y **2026**, normalizarlos en un mismo modelo de datos, y construir un dashboard interactivo que permita comparar partidos, departamentos y bloques ideológicos con un solo clic.

## Limitaciones del análisis

Es importante señalar de forma explícita las limitaciones del trabajo para que cualquier persona lo interprete correctamente:

- Los datos de 2026 corresponden al **pre-conteo oficial** publicado por la Registraduría inmediatamente después de la jornada electoral. Pueden tener variaciones menores tras el escrutinio definitivo.
- La asignación ideológica de partidos (izquierda / centro / derecha) es una **clasificación analítica** basada en la trayectoria pública de cada organización política, no una declaración oficial de las propias agrupaciones.
- Los indicadores derivados como el **costo por curul** son cálculos del autor y dependen de la calidad y completitud del input público.

## Lecturas clave del dashboard

Tres lecturas se desprenden del análisis comparativo 2022 vs 2026:

1. **Polarización en aumento.** Pacto Histórico y Centro Democrático absorben la mayor parte de las curules nuevas, mientras los partidos tradicionales de centro pierden representación de forma marcada.
2. **Mayoría sin dominancia.** Aunque la derecha logra una mayoría simple, ningún bloque alcanza la mayoría absoluta — la gobernabilidad dependerá de negociaciones puntuales por proyecto de ley.
3. **Reconfiguración regional.** El mapa de departamentos cambia notablemente entre ciclos: regiones que tradicionalmente votaban a partidos de maquinaria muestran migración hacia los extremos ideológicos.

## Cómo usar el dashboard

El dashboard interactivo está alojado en un repositorio independiente y se sirve estáticamente desde GitHub Pages. Cada gráfico tiene tooltips, filtros por departamento y comparativas inline entre 2022 y 2026. El código fuente, los datasets en CSV/JSON y el pipeline completo de procesamiento están disponibles públicamente para auditar resultados, reproducir el análisis con datos actualizados o reutilizar componentes en otros proyectos de visualización electoral.