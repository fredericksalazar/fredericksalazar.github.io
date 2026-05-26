---
titulo: "Dark Data en las organizaciones"
fecha: 2024-04-16
descripcion: "Descubre qué es el Dark Data y cómo puede impactar tu organización. Aprende sobre su origen, clasificación y estrategias para convertirlo en valor con u..."
imagen: "/images/blog/dark-data.png"
etiquetas: ["Dark Data", "Gobierno de Datos", "Data Lake", "Estrategia"]
autor: "Frederick Salazar"
draft: false
tipo: "analisis"
destacado: false
---

La llegada de la nube y la reducción del costo del almacenamiento, han causado un revuelo nunca antes visto, pasamos del Data WareHouse al DataLake y luego al DataLake House y quien sabe que mas llegará. Pero un punto importante mas allá de las innovaciones tecnológicas o los costos de las mismas, es que hacemos con los datos. Muchas organizaciones en su carrera por ser **Data Driven** han considerado que lo mas importante es almacenar datos, esa es su estrategia y en ese camino se ha creado creado un nuevo concepto el **Dark Data.**

> Segun Gartner Dark Data es:  
>   
> Activos de información que las organizaciones recopilan, procesan y almacenan durante las actividades comerciales regulares, pero generalmente no se utilizan para otros fines (por ejemplo, análisis, relaciones comerciales y monetización directa) [1]
>
> Gartner

Cada segundo se crean datos en una organización de muchos tipos, desde logs de sistemas, emails, documentos, archivos multimedia, datos de clientes, comentarios en redes sociales y un largo etc. muchos de estos datos nunca serán analizados con fines de negocio y es a esto que llamamos Dark Data, según IBM “En la encuesta de investigación global de Splunk a más de 1.300 responsables de la toma de decisiones empresariales y de TI, el 60 por ciento de los encuestados informaron que la mitad o más de los datos de su organización se consideran oscuros. Un tercio de los encuestados informaron que esta cantidad es del 75 por ciento o más”.[2]

Entonces podemos decir que del 100% de datos creados de una organización, la gran mayoría son Dark Data, datos que nunca serán procesados, usados y analizados con fines de negocio. Esto es un aspecto fundamental en la estrategia de datos corporativa, pues tener en cuenta este aspecto permitirá o bien darles mas visibilidad y encontrar nuevas oportunidades o bien descartar lo que no sirve y ahorrar costos, en algún momento escuche a alguien decir que: Al principio como ingeniero creas el lago de datos y en pocos meses ya tienes un pantano de datos difícil de mantener.

## Clasificación de Dark Data

1. Los datos que no se están recopilando actualmente.
2. Datos que se están recopilando, pero a los que resulta difícil acceder en el momento y lugar correctos.
3. Datos que se están recopilando y están disponibles, pero que aún no se han convertido en productos o no se han aplicado completamente.

## Factores que crean Dark Data

Muchas cosas pueden pasar desde que se crea un dato hasta que se usa o no y se convierte en Dark Data, aquí enumeraré solo algunos factores:

- Ausencia de un programa de Gobierno de datos: Muchas veces las organizaciones inician sus procesos de analítica e ingeniería de datos sin un marco de gobierno de datos, especialmente empresas con poco presupuesto, mucho tiempo después, pueden darse cuenta que necesitan gobernar eficientemente sus datos porque su arquitectura de datos se desarrollo de manera desordenada y no tienen una visibilidad completa de los activos de datos.

- Cambio de prioridades del negocio: Creo que esta es una de las situaciones mas comunes que crean Dark Data, con las nuevas metodologías ágiles el cambio de prioridades en los diferentes proyectos pueden causar que al abandonar o retrasar un proyecto iniciado este genere Dark Data, pues los datos posiblemente nunca mas serán analizados o procesados con fines de negocio.
- Poco presupuesto de la organización: Este es un factor muy importante, pues las organizaciones con poco presupuesto para el desarrollo su estrategias de datos no invertirán en planes de gobierno y calidad de datos, tampoco invertirán en una buena arquitectura y en muchos casos contratan personal con poca o ninguna experiencia en datos a fin de ahorrar costos, este factor económico y en algunos casos de reducción de costos, causa que se genere Dark Data pues las organizaciones le dan mas prioridad al almacenamiento de datos que al análisis.
- Calidad de datos: En mi anterior articulo acerca de [calidad de datos](https://fredericksalazar.wordpress.com/2024/04/04/calidad-de-datos-tips-dimensiones-y-problemas/) mencionaba las consecuencias que causaba la mala calidad de los datos, y aquí tenemos una mas, un mala calidad de datos hará que no puedan ser usados para análisis y no aporten valor al negocio quedando almacenados y rezagados convirtiéndose en Dark Data, aplicar reglas de calidad ayudará a evitar esta transición.

## ¿Cual es el valor el Dark Data?

Si el Dark Data son datos que no conocemos o que no usan las organizaciones, entonces ¿Cual es su valor? ¿como puedo usar el Dark Data? ¿pueden dar ventaja competitiva? Este es un aspecto fundamental, pues si partimos del hecho que en muchas organizaciones entre el 50% y el 75% de sus datos son Dark Data porque los desconocen y no saben lo que contienen, entonces ¿que valor pueden tener? Aquí entonces debemos dar un enfoque de exploración basado en:

- Catálogo de datos: Crear un mapa y un catalogo de datos de toda la organización nos puede ayudar a encontrar activos que no sabíamos que existían, aquí debemos tener en cuenta todo lo que crea datos en la organización como personas, procesos y tecnología. Claramente este punto depende de una estrategia de gobierno de datos corporativa y un proyecto independiente de catalogo de datos.
- Perfilamiento de Datos: Una vez identificadas las fuentes de datos y los datos generados, podemos realizar de manera rápida un análisis exploratorio de perfilamiento de datos que nos permita entender un poco el contexto de los datos, nivel de calidad, antigüedad, validez de negocio, entre otros aspectos.
- Clasificación y etiquetado: Luego de entender ese universo de datos vamos a clasificarlos y etiquetarlos en nuestro catalogo, identificamos que datos pueden tener un valor de negocio, que datos podrían servir, que datos necesitan mas exploración, que datos no tienen ningún valor. Esto nos servirá para posteriormente tomar decisiones y decidir que se usará, que se eliminará, que se archivará etc. Este ultimo punto esta muy relacionado con el ciclo de vida de los datos que explicaré mas adelante.

¿Que opinas tu del Dark Data? ¿Lo conocías?

**Referencias:**

[1] (N.d.). Gartner.com. Retrieved April 16, 2024, from [Definición de Dark Data según Gartner](https://www.gartner.com/en/information-technology/glossary/dark-data)

[2] *What is dark data?* (n.d.). IBM.com. Retrieved April 16, 2024, from [Qué es Dark Data según IBM](https://www.ibm.com/topics/dark-data)
