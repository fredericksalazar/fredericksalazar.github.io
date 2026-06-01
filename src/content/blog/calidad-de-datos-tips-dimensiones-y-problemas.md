---
titulo: "Tips y Dimensiones en la Calidad de Datos"
fecha: 2024-04-04
descripcion: "Descubre los problemas de la mala calidad de datos y cómo gestionar la calidad en tu organización. Aprende sobre las dimensiones clave de la calidad de..."
imagen: "/images/blog/dimensiones-calidad-datos.png"
etiquetas: ["Data Quality", "Data Governance", "Gestión de Datos", "Estrategia"]
autor: "Frederick Salazar"
draft: false
tipo: "referencia"
destacado: false
---

> Se entiende por **calidad de datos** el grado en el que los datos cumplen un conjunto de características y/o dimensiones

Muchas veces he visto y escuchado los problemas causados por la mala calidad de datos en muchas organizaciones, por lo general se piensa que la calidad de datos es más un aspecto técnico y que se resuelve con SQL o usando otras herramientas, sin embargo debemos comprender que es mas un tema de gobierno y estrategia.

En este post trato de explicar de manera muy rápida, que es la **calidad de datos**, los problemas asociados a una mala gestión de la calidad del dato, así como los los beneficios y ventajas de una buena implementación.

Comencemos por mencionar algunos problemas causados por una mala calidad de datos en las organizaciones, si bien existen muchos mas estos nos servirán de guía.

**Problemas causados por la mala calidad de datos en el mundo**

1. En el 2002, la baja calidad en los datos de clientes, supuso pérdidas de 611 billones de dólares a las compañías de Estados Unidos.
2. En el 2004, se estimó que la calidad del dato suponía pérdidas de al menos el 10%, posiblemente estaba más cerca del 20%.
3. En el 2011, la baja calidad del dato se consideraba la principal razón por la que el 40% de las iniciativas de negocio fracasaban en conseguir los objetivos definidos.
4. En el 2014, el 59% de las empresas citaban la calidad de los datos como una barrera para la adopción de *business intelligence.*
5. En el 2016, las organizaciones perdieron en promedio 9,7 millones de dólares anualmente, debido a la mala calidad de datos.

Las consecuencias para una empresa por no tener una buena calidad de datos se ve representada en aspectos como:

1. Perdida de oportunidades comerciales
2. Perdida de dinero
3. reducción de la eficiencia
4. Mala experiencia del cliente
5. Daño reputacional
6. Problemas legales y de cumplimiento de protección de datos

La mala calidad de datos representa una perdida de ventaja competitiva en el mercado, así como perdida de dinero y altos costos operativos, por ejemplo: tener datos erróneos de correos electrónicos de sus clientes, ocasiona una perdida de oportunidades comerciales a través de campañas de email marketing, además de gastos en el reproceso de información, esto solo por poner un ejemplo.

No quiero ahondar mucho en los problemas causados, sino también mencionar de manera rápida de que trata la calidad de datos, ayudar a superar esa barrera de creer que se trata solo de un problema técnico y ampliar la perspectiva del lector hacia un punto de vista mas estratégico, comencemos por entender las dimensiones del DQ (Data Quality)

**Dimensiones de la Calidad de datos**

Basados en la definición formal de la calidad de datos: **“Se entiende por calidad de datos el grado en el que los datos cumplen un conjunto de características y/o dimensiones”** es fundamental entonces comprender cuales son las dimensiones en las cuales validamos la calidad de los datos, para ello nos basaremos en las dimensiones expresadas por DAMA:

1. **Completitud:** Consiste en la proporción de datos almacenados respecto al conjunto total. Por ejemplo: del total de registros de mis clientes que porcentaje tienen datos validos en el campo email.
2. **Unicidad:** Consiste en que el dato debe guardarse de manera única para evitar inconsistencias. Por ejemplo, cuantas veces se repite un mismo numero celular o email en mi base de datos de clientes.
3. **Atemporalidad:** Consiste en el grado en que un dato representa la realidad en un momento temporal especifico. Por ejemplo, puedo acceder al histórico de números de teléfono de mis clientes o consultar uno en un momento del pasado.
4. **Validez:** Consiste en que el dato presenta conformidad (formato, tipo, rango) respecto a su definición. Por ejemplo, mis correos electrónicos tienen dominios validos, o los números de celular de mis clientes siguen un estándar especifico.
5. **Precisión / Exactitud:** Consiste en el grado en que el dato describe la realidad (con Independencia del Tiempo). Por ejemplo, el numero de celular o email de mis clientes fueron validados para certificar su existencia.
6. **Consistencia:**  Consiste en la ausencia de diferencias al comparar dos representaciones del mismo dato evitando información contradictoria. Por ejemplo, el valor de ventas es el mismo para los diferentes departamentos de la empresa.

**Tips para gestionar una buena calidad de da tos**

**Colaborativo:** Negocio y Tl comparten la responsabilidad de la calidad de los datos, con funciones y tecnología claramente definidas y adaptadas a las habilidades y perspectivas únicas de los analistas de negocio, administradores de datos y desarrolladores y administradores de TI.

**Proactivo:** Negocio y TI reconocen que todas las organizaciones sufren algún grado de mala calidad de datos y trabajan conjuntamente para identificar y corregir los problemas antes que afecten el rendimiento del negocio.

**Reutilizable:** El perfil de datos y las reglas de negocio de limpieza pueden reutilizarse en cualquier número de aplicaciones, para agilizar y acelerar los procesos y ayudar a garantizar altos estándares de calidad.

**Persuasivo:** La calidad de datos se extenderá a todas las partes interesadas, dominios de datos, proyectos y aplicaciones, independientemente de donde residan los datos o quien sea el responsable.

Cuando hablamos de calidad de datos no hablamos de implementar tecnologías o ejecutar algunas acciones, sino mas bien que hablamos de crear un programa de calidad de datos organizacional que ayude a evolucionar su madurez de calidad de datos y se convierta en un proceso cíclico e iterativo que mejore de manera gradual sus practicas de gestión y por ende la calidad de sus datos.

En siguientes posts ahondaremos mas en este tema, sobre todo en la implementación del programa de calidad de datos, si te gusto o quieres saber mas acerca de este y mas temas de ingenieria de datos escribeme a [fsalazars@uoc.edu](mailto:fsalazars@uoc.edu)
