---
titulo: "DinaWall App"
descripcion: "Aplicación JavaFX open source para wallpapers dinámicos multiplataforma. Cambia el fondo de pantalla según la hora del día en Linux, Windows y macOS."
tecnologias: ["Java", "JavaFX", "JSON", "GPL-V3", "Linux", "Windows", "macOS"]
categoria: "software"
fecha: "2022-03-01"
github: "https://github.com/fredericksalazar/dinawall_app"
demo: ""
imagen: "/images/proyectos/dinawall-app-1.png"
destacado: false
orden: 7
---

DinaWall es una aplicación JavaFX que implementa el concepto de wallpapers dinámicos multiplataforma y open source. Los Wallpapers dinámicos cambian de acuerdo a la hora del día, DinaWall permite crear wallpapers dinámicos basados en un archivo de configuración json en el cual se configura la hora y minuto en el que se debe aplicar la imagen.

DinaWall se compone de dos proyectos independientes dinawall\_core que gestiona y administra el motor que aplica las imágenes en los diferentes sistemas soportados, tales como distribuciones Linux (KDE y Gnome) Windows y macOS. El segundo proyecto es dinaWall\_app que contiene toda la interfaz de usuario que permite crear nuevos wallpapers dinámicos, instalar y aplicar wallpaper dinámicos en el sistema operativo.

## Desarrollo

El proyecto es desarrollado en JavaFX 19, su licenciamiento es GPL V3 y esta abierto a que cualquier persona interesada pueda aportar en áreas como el desarrollo, testing, documentación, compilación o creando wallpapers dinámicos para la comunidad, a continuación se dejan los repositorios en github

[DinaWall App GitHub](https://github.com/fredericksalazar/dinawall_app)

[DinaWall Core GitHub](https://github.com/fredericksalazar/dinawall_core)

[Dinamic Wallpapers repo](https://github.com/fredericksalazar/dinamic_wallpapers_repo)

## Motivación detrás del proyecto

DinaWall nace de una limitación práctica: macOS tiene soporte nativo para wallpapers dinámicos (el formato `.heic` de Apple), pero esa tecnología no existe en Linux y la solución equivalente en Windows depende de software propietario o utilidades de terceros. Como usuario que alterna entre KDE, Gnome, Windows y macOS, la idea era construir un mismo wallpaper dinámico ejecutándose de forma idéntica en todos los sistemas operativos, sin licencias ni herramientas dispares. El reto técnico era doble: un motor cross-platform en Java y un formato de configuración abierto que cualquier persona pudiera crear y compartir.

## Arquitectura: motor + aplicación

DinaWall se separa de forma deliberada en dos proyectos independientes para que cada componente pueda evolucionar por su cuenta:

- **`dinawall_core`** — Es el motor de ejecución sin interfaz gráfica. Se encarga de leer el archivo de configuración JSON, programar los cambios horarios mediante un scheduler interno y delegar el cambio efectivo del fondo de pantalla a la capa específica de cada sistema operativo. Esta separación permite que el core funcione también desde línea de comandos o integrado en otras herramientas que no necesiten UI.
- **`dinawall_app`** — Es la interfaz gráfica construida con JavaFX 19. Permite crear nuevos wallpapers dinámicos definiendo bloques horarios desde una UI visual, importar paquetes existentes, previsualizarlos y aplicarlos al sistema operativo. Toda la lógica de ejecución se delega al core.

## Formato abierto del wallpaper dinámico

Cada wallpaper dinámico es un paquete que agrupa las imágenes y un archivo de configuración JSON con el calendario horario (hora y minuto de aplicación de cada imagen). El formato es deliberadamente abierto: cualquier creador puede diseñar y compartir sus propios paquetes sin necesidad de tocar el código de la aplicación, basta con respetar el contrato del JSON. El repositorio comunitario `dinamic_wallpapers_repo` aloja paquetes contribuidos por la comunidad.

## Plataformas soportadas

La capa de integración con el sistema operativo cubre tres entornos:

- **Linux** — Distribuciones con Gnome y KDE Plasma, las dos suites de escritorio más extendidas en el ecosistema.
- **Windows** — Windows 10 y 11.
- **macOS** — Versiones recientes con soporte para wallpapers programáticos.

Cada integración aplica el wallpaper mediante el mecanismo nativo de cada sistema, evitando depender de servicios externos o demonios siempre activos en segundo plano.

## Estado del proyecto y cómo contribuir

DinaWall está bajo licencia **GPL v3** y abre la puerta a contribuciones en múltiples frentes: desarrollo (mejorar soporte de distribuciones Linux adicionales, soporte multi-monitor, modo oscuro automático), testing en sistemas no probados, traducciones de la interfaz, documentación y — especialmente — creación de wallpapers dinámicos para alimentar el repositorio comunitario. Si te interesa contribuir, puedes abrir un issue en cualquiera de los repositorios o escribirme directamente a [fsalazars@uoc.edu](mailto:fsalazars@uoc.edu) y coordinamos.
