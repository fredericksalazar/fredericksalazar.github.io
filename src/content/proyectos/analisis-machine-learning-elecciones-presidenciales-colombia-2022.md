---
titulo: "Sentimientos y Elecciones Colombia 2022"
descripcion: "Analiza el sentimiento de los tweets de los candidatos presidenciales colombianos 2022 con Machine Learning y NLP. Examina frecuencia, palabras y emocio..."
tecnologias: []
github: ""
demo: ""
imagen: "/images/proyectos/elecciones_presidenciales_colombia_2022.png"
destacado: false
orden: 99
---

![](/images/proyectos/elecciones_presidenciales_colombia_2022.png)

**Abstract:** Este proyecto es estrictamente académico y no pretende realizar predicciones, emitir conclusiones o juicios, tiene como principal objetivo brindar a los interesados una perspectiva acerca de que escriben los candidatos en sus perfiles de redes sociales. Este proyecto se ha desarrollado usando herramientas como **Machine Learning y NLP (Procesamiento de Lenguaje Natural)** con las cuales se realiza un análisis de las publicaciones realizadas a través de la red social Twitter, se pretende realizar un análisis de emociones y sentimientos asociados a los textos publicados.

## Resultados Análisis de sentimientos Perfiles de Twitter a los candidatos presidenciales

Se desarrolla un proceso de minería de textos sobre los tweets escritos por los candidatos presidenciales desde el 01 de enero de 2022, se analizarán aspectos como frecuencia de publicación de tweets, palabras mas usadas y un análisis de sentimiento sobre los textos de los mismos.   
Para el desarrollo del proceso de ingesta se configuraron las siguientes cuentas de la red social twitter:  
– **Gustavo Petro Urrego ->** <https://twitter.com/petrogustavo>  
– **Sergio Fajardo ->** <https://twitter.com/sergio_fajardo>  
– **Federico Gutierrez ->** <https://twitter.com/FicoGutierrez>  
– **Rodolfo Hernandez ->** <https://twitter.com/ingrodolfohdez>

![](/images/proyectos/total_tweets_x_dia.png)

Frecuencia de Tweets Por Día

Este gráfico nos muestra la frecuencia diaria de escritura de tweets de los 4 candidatos presidenciales, ordenado de arriba hacia abajo podemos ver a los candidatos según la cantidad de tweets escritos en el mismo periodo de tiempo.

### Análisis Sergio Fajardo

![](/images/proyectos/analisis_sergio_fajardo_1-1.png)

Frecuencia de palabras

El candidato Sergio Fajardo escribe en promedio un total de 11.2 tweets por día a una audiencia de 1.6 millones de seguidores en la red social Twitter. Esta nube de palabras extraídas de los tweets muestra que las palabras mas frecuentes son: Colombia, País, Propuesta, Cambiar, Educación, Seguir, Gobierno

En la imagen se distinguen dos dimensiones el tamaño de la palabra y el tono de color entre mas grande y mas oscura mas frecuente es. ¿Que otras palabras logras ver?

![](/images/proyectos/analisis_sergio_fajardo_2-1.png)

Sentimiento de los tweets

Al realizar el análisis de sentimiento de los tweets escritos por el candidato Sergio Fajardo se evidencia que el 79% de los tweets asocian una emoción neutral o positiva y que un 21% asocian una emoción negativa.

Si bien en la línea de tiempo se evidencia un equilibrio en las emociones es frecuente ver como la neutralidad y positividad tienen mas participación que la negatividad.

### Análisis Gustavo Petro

![Gustavo Petro tweets](/images/proyectos/analisis_gustavo_petro_1.jpg)

Frecuencia de palabras

El candidato Gustavo Petro escribe en promedio un total de 9 tweets por día a una audiencia de 4.8 millones de seguidores en la red social Twitter. Esta nube de palabras extraídas de los tweets muestra que las palabras mas frecuentes son: Colombia, Pacto, Cambio, Vida, Gobierno, Deber, País

En la imagen se distinguen dos dimensiones el tamaño de la palabra y el tono de color entre mas grande y mas oscura mas frecuente es. ¿Que otras palabras logras ver?

![](/images/proyectos/analisis_gustavo_petro_2.png)

Sentimiento de los tweets

Al realizar el análisis de sentimiento de los tweets escritos por el candidato Gustavo Petro se evidencia que el 73% de los tweets asocian una emoción neutral o positiva y que un 27% asocian una emoción negativa.

Si bien en la línea de tiempo se evidencia un equilibrio en cuanto a la cantidad de tweets neutrales si puede verse como en algunos momentos los tweets negativos representan mayor cantidad de tweets.

### Análisis Federico Gutierrez

![Federico Gutierrez tweets](/images/proyectos/analisis_federico_1.jpg)

Frecuencia de palabras

El candidato Federico Gutierrez escribe en promedio un total de 7 tweets por día a una audiencia de 870 mil seguidores en la red social Twitter. Esta nube de palabras extraídas de los tweets muestra que las palabras mas frecuentes son: País, FicoPresidente, gente, Colombia, federicoPresidente, Oportunidad, Seguir

En la imagen se distinguen dos dimensiones el tamaño de la palabra y el tono de color entre mas grande y mas oscura mas frecuente es. ¿Que otras palabras logras ver?

![](/images/proyectos/analisis_federico_2.png)

Sentimiento de los tweets

Al realizar el análisis de sentimiento de los tweets escritos por el candidato Federico Gutierrez se evidencia que el 89% de los tweets asocian una emoción neutral o positiva y que un 11% asocian una emoción negativa.

Si bien en la línea de tiempo se evidencia un equilibrio en cuanto a la cantidad de tweets neutrales puede evidenciarse como la cantidad de tweets negativos son muy pocos, con algunos momentos en los cuales la posibilidad es mayor que la negatividad.

### Análisis Rodolfo Hernandez

![](/images/proyectos/analisis_rodolfo_hernandez_1.png)

Frecuencia de palabras

El candidato Rodolfo Hernandez escribe en promedio un total de 4 tweets por día a una audiencia de 159 mil seguidores en la red social Twitter. Esta nube de palabras extraídas de los tweets muestra que las palabras mas frecuentes son: Colombia, RodolfoHernandez, Ingeniero, Colombiano, Presidente

En la imagen se distinguen dos dimensiones el tamaño de la palabra y el tono de color entre mas grande y mas oscura mas frecuente es. ¿Que otras palabras logras ver?

![](/images/proyectos/rodolfo_hernandez_2.png)

Sentimiento de los tweets

Al realizar el análisis de sentimiento de los tweets escritos por el candidato Rodolfo Hernandez se evidencia que el 62% de los tweets asocian una emoción neutral o positiva y que un 38% asocian una emoción negativa.

Podemos ver en la línea del tiempo como la cantidad de tweets neutrales y negativos son predominantes y aumentan su intensidad en los últimos días de la muestra.

### Visual de línea de tiempo de emociones de tweets por candidatos

![Tweets candidatos presidenciales](/images/proyectos/visual_emociones_candidatos.jpg)

Frecuencia de tweets con emociones por día

En la imagen hemos ordenado los candidatos teniendo en cuenta el porcentaje de tweets neutrales o positivos, así de arriba hacia abajo encontramos los candidatos con mas a menos neutralidad y/o positividad quedando el candidato Federico Gutierrez en primer lugar con un 89% seguido de Sergio Fajardo con un 79% seguido por Gustavo Petro 73% y en último lugar el candidato Rodolfo Hernandez con un 62%.
