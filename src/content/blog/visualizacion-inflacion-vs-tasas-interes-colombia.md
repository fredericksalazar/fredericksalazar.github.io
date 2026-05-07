---
titulo: "Visualización de Inflación vs Tasas de Interés en Colombia (1960–2025)"
fecha: 2026-04-01
descripcion: "Análisis de datos del Banco Mundial y el Banco de la República sobre la inflación en Colombia y su relación con la tasa de intervención desde 1960."
etiquetas: ["Análisis de Datos", "Economía", "Colombia", "Visualización", "Python"]
autor: "Frederick Salazar"
imagen: "/images/blog/inflacion-vs-tasas-interes-colombia-cover.png"
draft: false
---

La **inflación** es uno de los indicadores económicos que más afecta la vida cotidiana de los colombianos: define el costo de los alimentos, el valor del salario y la capacidad de ahorro de los hogares. Su control depende de decisiones políticas y, sobre todo, de decisiones de política monetaria que con frecuencia resultan complejas de leer sin un buen apoyo gráfico. En este artículo aplico **ingeniería y visualización de datos** para analizar el comportamiento de la inflación en Colombia desde 1960 y su correlación con la **tasa de intervención del Banco de la República** desde el año 2000 hasta hoy.

Este es un análisis técnico e independiente. Su objetivo no es legitimar ni desacreditar decisiones gubernamentales, sino aportar evidencia visual para entender mejor la dinámica macroeconómica del país.

## Fuentes de datos y metodología

Para garantizar reproducibilidad, todo el análisis se construyó sobre fuentes públicas y verificables:

- **Banco Mundial** — serie histórica de inflación anual (IPC) de Colombia entre 1960 y 2024.
- **Banco de la República (BanRep)** — serie de la **tasa de intervención de política monetaria** desde el año 2000.
- **Procesamiento** — Python con Pandas para la limpieza y normalización de las series, y Plotly para la generación de visualizaciones interactivas.

La metodología se resume en tres pasos: (1) consolidar las series temporales en una misma frecuencia, (2) calcular el *spread* entre la tasa de intervención y la inflación interanual, y (3) clasificar cada periodo como **freno** (tasa > inflación) o **acelerador** (tasa < inflación) de la economía.

## Inflación en Colombia desde 1960

![Gráfico de barras de la inflación anual en Colombia entre 1960 y 2024 con datos del Banco Mundial. Se observa el pico histórico del 33% en 1977 bajo la presidencia de Alfonso López Michelsen, un periodo prolongado por encima del 10% entre 1973 y 1998, y una tendencia descendente posterior al año 2000.](/images/blog/inflacion-anual-colombia-1960-2024.png)

La gráfica anterior resume **64 años de inflación en Colombia**. Algunas conclusiones clave que se desprenden de los datos:

- **Máximo histórico:** Colombia alcanzó su mayor inflación registrada en **1977 con un 33%**, durante el mandato del presidente Alfonso López Michelsen.
- **Periodo crítico (1973–1998):** durante 25 años consecutivos la inflación se mantuvo por encima del **10%**, con un promedio anual cercano al **20%**.
- **Estabilización (2000–2022):** a partir del año 2000 la inflación se ubicó de forma sostenida por debajo del **10%**, alcanzando su mínimo histórico de **2,02%** durante la administración de Juan Manuel Santos.
- **Choque post-pandemia (2023):** la inflación volvió a superar el **13%** como consecuencia de los efectos de la pandemia, las disrupciones logísticas globales y el alza de precios de energía y alimentos.
- **Cierre de 2024:** la inflación cedió a aproximadamente **6%**, todavía por encima del rango objetivo del BanRep (3% ± 1).

Lo importante de esta lectura histórica es que muestra un país que **logró domesticar la inflación durante dos décadas**, pero que sigue siendo vulnerable a choques externos cuando la economía global se desestabiliza.

## Inflación vs tasa de intervención del Banco de la República

![Gráfica comparativa de la inflación anual del IPC en Colombia (línea roja) frente a la tasa de intervención del Banco de la República (línea azul) entre 2003 y 2025. El sombreado rojo marca los periodos en los que la tasa supera a la inflación (freno de la economía) y el sombreado verde los periodos donde la tasa está por debajo (acelerador).](/images/blog/spread-banrep-vs-inflacion-colombia.png)

Esta visualización compara dos series fundamentales para entender la política monetaria del país:

- **Línea roja:** inflación anual medida por el Índice de Precios al Consumidor (IPC).
- **Línea azul:** tasa de intervención del **Banco de la República**.
- **Área roja:** tramo en el que la tasa del BanRep está **por encima** de la inflación → la política monetaria actúa como **freno** (tasa real positiva).
- **Área verde:** tramo en el que la tasa está **por debajo** de la inflación → la política actúa como **acelerador** (tasa real negativa).

Algunos hallazgos clave del análisis:

- **Enero de 2000:** la inflación se ubicaba en **8,25%** y la tasa del BanRep en **12 puntos porcentuales (pp)**, generando un freno claro a la economía.
- **Pandemia (2020–2021):** la inflación cayó de manera abrupta debido al colapso de la actividad económica y al desplome de la demanda agregada.
- **Abril de 2023:** se alcanzó el pico inflacionario reciente con **13%**, mientras la tasa del BanRep todavía iba por detrás.
- **Diciembre de 2025:** la inflación bajó a **3,95%** y la tasa del BanRep se mantenía en **9,25 pp**, con un *spread* de **5,3 pp**.

## El "freno" más prolongado de los últimos 26 años

![Panel doble titulado 'Análisis de Decisiones del Banco de la República'. El gráfico superior muestra la evolución de la inflación entre 2000 y 2025 con la meta ideal del 3%. El gráfico inferior representa el spread entre la tasa del BanRep y la inflación, con barras rojas indicando freno y barras verdes indicando acelerador. Destaca el periodo 2024–2025 como el freno máximo y más prolongado del histórico.](/images/blog/decisiones-banco-republica-freno-inflacion.png)

Cuando se observa el *spread* entre la tasa de intervención y la inflación a lo largo del tiempo, aparece una conclusión que es difícil de ver con cifras sueltas: **desde enero de 2024 estamos en el freno más drástico y prolongado de los últimos 26 años**. La diferencia entre la tasa y la inflación supera de manera sostenida los **4 pp**, una restricción que en periodos anteriores —como julio de 2016— solo se mantuvo por meses.

¿Qué significa esto en la práctica? Una tasa real positiva alta y sostenida implica:

- **Crédito más caro** para empresas y hogares, lo que enfría el consumo y la inversión.
- **Mayor atractivo del ahorro y de los instrumentos de renta fija**, que rinden más que la inflación.
- **Apreciación relativa del peso** frente a economías con tasas reales negativas.
- **Desaceleración de la actividad económica**, con efectos sobre empleo y crecimiento del PIB.

## Conclusiones

Los datos confirman una correlación directa y persistente entre la inflación y la tasa de intervención del Banco de la República. La política monetaria se ha movido en respuesta a los choques inflacionarios, aunque casi siempre con un rezago. La lectura más relevante de los últimos años es que **la economía colombiana lleva más de dos años bajo un freno monetario sostenido y prolongado**, sin precedentes en el siglo XXI.

## Preguntas frecuentes

### ¿Cuál fue la inflación más alta registrada en Colombia?
La inflación anual más alta registrada en Colombia, según los datos del Banco Mundial, fue de **33% en 1977**, durante la presidencia de Alfonso López Michelsen.

### ¿Cuál es la meta de inflación del Banco de la República?
La meta de inflación del **Banco de la República de Colombia** es del **3% anual**, con un rango de tolerancia de ±1 punto porcentual.

### ¿Qué significa que la tasa del BanRep esté por encima de la inflación?
Cuando la **tasa de intervención** del Banco de la República supera a la inflación, la **tasa real es positiva** y la política monetaria funciona como un **freno** sobre la economía: encarece el crédito, premia el ahorro y desacelera el consumo y la inversión.

### ¿Desde cuándo Colombia mantiene un freno monetario sostenido?
Desde **enero de 2024** Colombia se encuentra en el periodo de freno monetario más prolongado de los últimos 26 años, con un *spread* entre la tasa y la inflación que se mantiene por encima de los **4 puntos porcentuales** de manera sostenida.

### ¿Dónde puedo consultar los datos y el código del análisis?
Todo el proyecto es **Open Data y Open Source**. Puedes auditarlo, replicarlo o extenderlo desde mi repositorio: <https://github.com/fredericksalazar/data-projects/tree/master/analisis_economic_colombia>.

## Uso ético y restricciones

Este es un proyecto técnico, educativo e independiente. No tiene afiliación política ni recibe financiación de partidos. Queda estrictamente prohibido el uso de este contenido, sus gráficas o sus datos para campañas de desinformación, manipulación de opinión, propaganda política o uso comercial sin autorización previa por escrito.

La metodología, el diseño de las visualizaciones y el análisis son propiedad de **Frederick Adolfo Salazar**.
