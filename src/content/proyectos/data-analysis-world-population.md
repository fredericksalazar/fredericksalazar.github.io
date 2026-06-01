---
titulo: "Data Analysis World Population"
descripcion: "Proyecto Python que analiza el crecimiento poblacional del mundo considerando GDP, nivel de escolaridad, tasas de crecimiento y distribución regional."
tecnologias: ["Python", "Pandas", "Plotly", "Matplotlib", "Seaborn", "Jupyter"]
categoria: "data-analysis"
fecha: "2022-08-01"
github: "https://github.com/fredericksalazar/dataAnalyst_world_population"
demo: "https://www.kaggle.com/code/fredericksalazar/data-analysis-population-world"
imagen: "/images/proyectos/world-map-1.png"
destacado: true
orden: 5
---

Este proyecto nace de la necesidad de aplicar los conocimiento técnicos adquiridos en el campo de la Ingeniería de datos y el análisis de datos con Python, tiene como objetivo fundamental brindar desde los datos una perspectiva descriptiva y de entendimiento acerca de la evolución de la población mundial durante el siglo XXI e intentar identificar factores para el crecimiento o decrecimiento poblacional en el mundo.

Te doy la bienvenida a los resultados del proyecto y te hago una invitación a participar del mismo, el proyecto es open source y su código se encuentra disponible en [Kaggle](https://www.kaggle.com/code/fredericksalazar/data-analysis-population-world) y [GitHub](https://github.com/fredericksalazar/dataAnalyst_world_population).

## Resultados del análisis de datos de el crecimiento de la población mundial.

Los datos fueron obtenidos de la Open Data del World Bank y pueden ser encontrados y referenciados en la notebook publicada en mi perfil de kaggle en el siguiente link: [data\_analysis\_population\_world | Kaggle](https://www.kaggle.com/code/fredericksalazar/data-analysis-population-world) Si el proyecto te ha gustado te invito a dejar comentarios, compartirlo y si deseas ayudar en su desarrollo eres bienvenido a mi perfil de kaggle o Github.

Para el desarrollo de este análisis se hace uso de las siguientes herramientas:

Visual Studio Code – Python – Pandas – Plotly – MatPlotLib – SeaBorn

![Crecimiento Poblacional desde 1960](/images/proyectos/total_poblacion.png)

Crecimiento Poblacional desde 1960

El total de la población mundial al 2021 era de 7.800 millones de personas Aprox, desde 1960 que eramos 3000 millones de personas la población mundial ha crecido un 61% como podemos ver en la gráfica ha sido crecimiento sostenido, esto nos haría pensar que estamos aumentando mucho peor debemos identificar otros factores como las tasas de crecimiento mundial y por país.

![Crecimiento poblacional según grupo de ingresos](/images/proyectos/crec_x_income_group.png)

Crecimiento poblacional según grupo de ingresos

A continuación identificamos la evolución poblacional según la clasificación de los paises por grupos de ingresos, así tenemos cuatro grupos: Ingreso Alto, Ingreso Mediano Alto, Ingreso Bajo e Ingreso Mediano Bajo, en la gráfica podemos ver como desde la decada de los 80’s los paises de Ingreso Mediano Bajo han tenido un crecimiento poblacional mas alto que los demás grupos, los países de ingreso mediano alto en cantidad también suponen una gran parte de la población en comparación con los de ingreso alto y bajo.

![Tasa de crecimiento poblacional desde 1960.](/images/proyectos/tasa_crec_poblacional.png)

Tasa de crecimiento poblacional desde 1960.

Un aspecto interesante de observar es la tasa de crecimiento poblacional por año, vemos como en las décadas de los 60´s, 70´s, 80´s y 90´s la población mundial crecía con tasas por encima del 1.5% anual, pero a partir de finales de la decada de los 90’s se ha reducido esta tasa llegando incluso en el 2021 a crecer por debajo del 1%, si bien ha aumentado la población mundial vemos como cada vez se crece menos. ¿Seguirá así? ¿dejaremos de crecer?

![Distribución tasa crecimiento poblacional 2021](/images/proyectos/hist_crecimiento.png)

Distribución tasa crecimiento poblacional 2021

Idenificamos para todos los países en el año 2021 vs el año 2020 cual fue su tasa de crecimiento, en la distribución vemos que la mayoría de países crecen entre el 0.5% y el 2%, algunos incluso superando la media mundial, pero interesante ver que también hay paises que decrecieron su población con tasas máximas de -4% ¿que pasa en estos casos? ¿es una realidad o una anomalía?

![Distribución años de escolaridad según grupo de ingresos](/images/proyectos/hist_anos_escolaridad.png)

Distribución años de escolaridad según grupo de ingresos

Un aspecto interesante a tener en cuenta son los años de escolaridad por país, incluimos este dataset y vemos como se distribuyen los datos según el grupo de ingresos, en los paises con 2 a 6 años de escolaridad por lo general son de ingreso bajo o mediano bajo, mientras que aquellos que están por encima de 6 años de escolaridad son de ingreso son de ingreso alto, mediano alto y mediano bajo.

![Países con mas años promedio de escolaridad](/images/proyectos/paises_con_mas_esolaridad.png)

Países con mas años promedio de escolaridad

Seleccionamos el top de 40 paises con más años promedio de escolaridad, Alemania es el país que mas años de escolaridad promedio tiene en el mundo con 14 años, seguido de Estados Unidos con 13 años, observando la imagen vemos que la mayoría de países son europeos con lo cual nos va dando una idea del impacto de los años de escolaridad en los países.

![Países con menos años de escolaridad](/images/proyectos/paises_con_menos_escolaridad-1.png)

Países con menos años de escolaridad

Seleccionamos el top 40 de países con menos años de escolaridad, con una mirada rápida podemos ver que en su gran mayoría son países ubicados en Africa y Medio Oriente, Burkina Faso con 1.5 años promedio de escolaridad, seguido de Nigeria con 2 años de escolaridad lideran el top. Es posible que la cantidad de años de escolaridad tengan influencia en las tasas de crecimiento poblacional de los paises.

![Distribución de tasa de crecimiento según la región](/images/proyectos/distribucion_crecimiento_x_region.png)

Distribución de tasa de crecimiento según la región

Las tasas de crecimiento población por región nos muestran una tendencia interesante, la región de Africa es la que tiene tasas mas altas de crecimiento, en comparación con Europa que es la región con las tasas mas bajas, Asia por su parte tiene tasas de crecimiento promedio de 0.8% pero también paises que decrecen hasta el -4%.

![Mapa tasas de creecimiento mundial año 2021](/images/proyectos/map_tasas_crecimiento.png)

Mapa tasas de creecimiento mundial año 2021

Ahora vemos el mapa con las tasas de crecimiento poblacional por país del año 2021 vs año 2020. Los países ubicados en la región de Africa y Asia tienen las mayores tasas de crecimiento, America del Sur tiene tasas de crecimiento entre el 0 y 2%. Algo Interesante que se puede ver es que los paises de Europa Oriental tienen tasas de crecimiento iguales o por debajo de 0, el único país de America del Sur que decreció fue Venezuela con -1%. ¿Que hace que un país aumente o reduzca su población?

![Mapa de años promedio de escolaridad por país 2021](/images/proyectos/map_years_of_schooling.png)

Mapa de años promedio de escolaridad por país 2021

El mapa de años de escolaridad nos muestra algo interesante, entre mas azúl mas años de escolaridad y entre mas blanco o rojo, menos años de escolaridad, Por lo general los paises con menos años de escolaridad se ubican en Africa, Oriente Medio y algunos de Asia, pareciera existir una relación entre los años de escolaridad y las tasas de crecimiento poblacional, a menos años de escolaridad más crecimiento poblacional y a mas años de escolaridad menos crecimiento poblacional.

![Mapa con la población por país año 2021](/images/proyectos/map_poblacion.png)

Mapa con la población por país año 2021

Este mapa nos muestra la cantidad de personas por país, vemos claramente como China e India son quienes mas acumulan población, muy lejos del resto de países del mundo, solo entre China (1412 Millones) e India (1407 Millones) tienen 2800 Millones de personas cerca de un 35% de la población mundial, las dos futuras super potencias con los mercados mas grandes del mundo.

![Relación entre años de escolaridad y tasa de crecimiento poblacional](/images/proyectos/scatter_escolaridad_crecimeinto.png)

Relación entre años de escolaridad y tasa de crecimiento poblacional

Pareciera existir una relación entre los años de escolaridad y la tasa de crecimiento poblacional, en el gráfico podemos ver como los paises con menos años de escolaridad en el eje x tienen tasas de crecimiento por encima de 0% llegando hasta 4%, por su parte los paises con mas años de escolaridad tiene tasas de crecimiento entre -4% y por debajo del 3%, no es una relación muy fuerte pero puede explicar en parte el comportamiento de las tasas de crecimiento.

![Matriz de Correlacion entre características de población mundial](/images/proyectos/matrix_correlacion.png)

Matriz de Correlacion entre características de población mundial

Tomamos las variables actuales del modelo de datos y verificamos que correlación existe entre ellas, entre mas cercano a 1 mas correlación positiva, entre mas cercano a 0 no existe una correlación y entre mas cercano a -1 mas correlacion negativa, rápidamente podemos ver que existe una correlación relativamente fuerte entre el promedio de años de escolaridad y la tasa de crecimiento poblacional, así como una correlación entre la población de un país y el PIB, esto podría darnos un poco de claridad sobre la influencia de ciertas variables en el crecimiento poblacional.
