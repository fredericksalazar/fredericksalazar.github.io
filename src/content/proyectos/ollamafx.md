---
titulo: "OllamaFX: Cliente de escritorio nativo para Ollama con soporte RAG"
tituloSeo: "OllamaFX: cliente de escritorio para Ollama"
descripcion: "Interfaz de escritorio nativa para Ollama con soporte RAG. Gestiona modelos LLM locales, chatea con tus PDFs de forma privada y rápida."
tecnologias: ["Java", "JavaFX", "Ollama", "RAG", "LLM", "SQLite"]
categoria: "software"
fecha: "2024-06-01"
github: "https://github.com/fredericksalazar/OllamaFX"
demo: "https://github.com/fredericksalazar/OllamaFX/releases"
imagen: "/images/proyectos/ollamafx-rag.png"
destacado: true
orden: 2
---

**OllamaFX** es un proyecto personal que nació de una necesidad clara: quería interactuar con mis modelos de lenguaje locales (LLMs) a través de una interfaz que fuera rápida, visualmente atractiva y que no dependiera de un navegador web.

## ¿Por qué OllamaFX?

Si bien la terminal es potente, a veces necesitamos algo más visual para gestionar nuestros modelos o mantener conversaciones organizadas. OllamaFX toma la potencia del motor de Ollama y la envuelve en una interfaz inspirada escrita en JavaFX, logrando un diseño limpio que se siente como en casa tanto en Linux como en Windows y macOS.

## Funcionalidades Principales

### 📚 1. Conversa con tus propios documentos (RAG)

Ahora puedes cargar tus documentos y trabajar con ellos usando los modelos LLM locales

- **Privacidad absoluta:** Sube tus archivos PDF o de texto (`.txt`) y hazles preguntas directamente. Todo el procesamiento ocurre de forma local en tu máquina
- **Contexto inteligente:** El modelo utilizará el contenido de tus archivos para darte respuestas precisas y fundamentadas, evitando que invente información.

![📚 1. Conversa con tus propios documentos (RAG) — OllamaFX: Cliente de escritorio nativo para Ollama con soporte RAG](/images/proyectos/ollamafx-rag.png)

### 🎨 1. Interfaz moderna y adaptable

Lo primero que notarás es el diseño. No es solo “una ventana más”; está pensada para ser cómoda.

- **Soporte total para Modo Claro/Oscuro:** Se adapta a tus preferencias visuales automáticamente o mediante un clic.
- **UI Funcional:** La interfaz ha sido pensada y diseñada con base en el minimalismo funcional, elegancia y sobriedad.

![🎨 1. Interfaz moderna y adaptable — OllamaFX: Cliente de escritorio nativo para Ollama con soporte RAG](/images/proyectos/ollamafx-home-dark-1.png)

### 📦 2. Gestión integral de modelos LLM

Olvídate de recordar comandos para listar o borrar modelos. Desde OllamaFX puedes:

- **Modelos recomendados:** OllamaFX clasificará y te recomendará los modelos según tus capacidades de hardware.
- **Explorar e Instalar:** Busca modelos en la librería de Ollama y descárgalos con una barra de progreso en tiempo real.
- **Administrar:** Visualiza el tamaño, formato y detalles de tus modelos instalados, o elimínalos instantáneamente para liberar espacio.
- **Feedback inmediato:** La interfaz se actualiza al segundo cuando un modelo es añadido o removido.

![📦 2. Gestión integral de modelos LLM — OllamaFX: Cliente de escritorio nativo para Ollama con soporte RAG](/images/proyectos/ollamafx-disponibles.png)

### 💬 3. Experiencia de Chat avanzada

El corazón del proyecto es la interacción. He diseñado el chat para que sea funcional y persistente:

- **Gestión de sesiones:** Puedes crear múltiples chats, renombrarlos para organizarte mejor o **anclar (pin)** los más importantes, además de organizarlos en carpetas para mejor control.
- **Markdown nativo:** Las respuestas de la IA se renderizan correctamente, facilitando la lectura de código y textos estructurados.
- **Estilo visual:** Burbujas de chat diferenciadas y limpias para que la conversación fluya sin distracciones.

![💬 3. Experiencia de Chat avanzada — OllamaFX: Cliente de escritorio nativo para Ollama con soporte RAG](/images/proyectos/ollamafx-chat.png)

## Cómo empezar a usarlo

OllamaFX es **Open Source** y está disponible para que lo descargues y lo pruebes ahora mismo. Solo necesitas tener Ollama instalado y corriendo en tu máquina (`ollama serve`).

### 🚀 Descargas y Repositorio

Si quieres probar la última versión o revisar el código fuente, aquí tienes los enlaces directos:

OllamaFX es un cliente oficial para Ollama y esta disponible para Linux, Windows o MacOS

- [Descargar última versión](https://github.com/fredericksalazar/OllamaFX/releases) – Descarga el archivo ejecutable para tu sistema.
- **[Repositorio en GitHub](https://github.com/fredericksalazar/OllamaFX)** – Revisa el código, abre un *issue* o contribuye al proyecto.
