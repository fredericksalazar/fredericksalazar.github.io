/**
 * Descripciones editoriales por tag para enriquecer las páginas /blog/tag/[tag].
 * Key = slug (lowercase, kebab-case). Si no hay match, se usa un fallback genérico.
 */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  'data-engineering':
    'Diseño y construcción de plataformas de datos: pipelines, arquitecturas modernas, ETL/ELT y mejores prácticas para procesar datos a escala.',
  'big-data':
    'Tecnologías y patrones para manejar volúmenes masivos de datos: Apache Spark, Hadoop, sistemas distribuidos y procesamiento batch/streaming.',
  'machine-learning':
    'Modelos, técnicas y casos de aplicación de Machine Learning: desde clustering y regresión hasta despliegue en producción.',
  azure:
    'Servicios de datos en Microsoft Azure: Data Factory, Synapse, Databricks y arquitecturas cloud para el ingeniero de datos.',
  python:
    'Recetas, librerías y patrones de Python aplicados a ingeniería de datos, análisis y automatización.',
  'data-governance':
    'Gobierno de datos, calidad, linaje y gestión del ciclo de vida del dato en la organización.',
  'data-quality':
    'Calidad de datos: dimensiones, métricas, problemas comunes y estrategias para garantizar datos confiables.',
  'calidad-de-datos':
    'Calidad de datos: dimensiones, métricas, problemas comunes y estrategias para garantizar datos confiables.',
  'data-warehouse':
    'Diseño, modelado dimensional y operación de Data Warehouses modernos.',
  'data-lake':
    'Arquitecturas de Data Lake, lakehouse y patrones de almacenamiento escalable.',
  'business-intelligence':
    'Inteligencia de Negocios: KPIs, tableros, factores críticos de éxito y herramientas de BI.',
  'data-analytics':
    'Analítica de datos descriptiva, exploratoria y avanzada al servicio del negocio.',
  ia:
    'Inteligencia Artificial aplicada: LLMs, agentes, casos de uso y herramientas para profesionales de datos.',
  'ia-local':
    'Modelos de IA ejecutados localmente: privacidad, soberanía de datos y herramientas como Ollama.',
  llm: 'Modelos de Lenguaje Grandes (LLMs): uso, integración y aplicaciones prácticas.',
  ollama: 'Ollama y el ecosistema para correr LLMs en local de forma sencilla.',
  privacidad:
    'Privacidad, soberanía digital y manejo responsable de los datos personales.',
  certificaciones:
    'Certificaciones profesionales en datos y cloud: roadmaps, recursos y experiencias.',
  roadmap:
    'Rutas de aprendizaje y planes de carrera para roles de datos.',
  productividad:
    'Hábitos, herramientas y flujos para trabajar mejor como ingeniero de datos.',
  'desarrollo-profesional':
    'Carrera, soft skills y crecimiento profesional para roles técnicos.',
  arquitectura:
    'Arquitectura de datos y de sistemas: decisiones, trade-offs y patrones reutilizables.',
  estrategia:
    'Estrategia de datos a nivel organización: visión, governance y entrega de valor.',
  chatgpt: 'Uso de ChatGPT y modelos similares en el trabajo del ingeniero de datos.',
  gemini: 'Google Gemini: capacidades, integración y casos de uso prácticos.',
  'roles-de-datos':
    'Comparativas y descripciones de roles en datos: Engineer, Scientist, Analyst, Steward.',
  'data-stewards':
    'Data Stewards: funciones, responsabilidades y su rol en la gobernanza de datos.',
  'dark-data':
    'Dark Data: datos olvidados en la organización y cómo convertirlos en valor.',
  mdm: 'Master Data Management: estrategias para unificar datos críticos del negocio.',
  herramientas:
    'Herramientas del día a día del ingeniero de datos: stacks, librerías y plataformas.',
  'apache-spark':
    'Apache Spark para procesamiento distribuido: API, optimización y casos de uso.',
  habilidades:
    'Habilidades técnicas y de negocio clave en los roles de datos.',
  'top-10':
    'Listas curadas de 10 elementos esenciales en distintos temas técnicos.',
  'analisis-de-datos':
    'Análisis de datos con foco en preguntas de negocio y visualización.',
  visualizacion:
    'Visualización de datos: gráficos, dashboards y storytelling con datos.',
  economia: 'Análisis de datos económicos: indicadores, series temporales y contexto.',
  colombia: 'Análisis y datos del contexto colombiano.',
  politica: 'Análisis de datos del contexto político.',
  elecciones: 'Análisis de procesos electorales con datos abiertos.',
  'ciclo-de-vida':
    'Ciclo de vida del dato y de los procesos de ingeniería: etapas y prácticas.',
  'gestion-de-datos':
    'Gestión integral de datos: governance, calidad, MDM y operación.',
  'trabajo-remoto':
    'Hábitos, herramientas y prácticas para el trabajo remoto efectivo.',
  'salud-mental':
    'Salud mental en el trabajo tech y cómo cuidarla.',
  dinawall: 'DinaWall: aplicación open source para fondos dinámicos.',
  'open-source': 'Proyectos y filosofía open source aplicada.',
  eventos: 'Charlas, presentaciones y eventos de la comunidad tech.',
  javafx: 'Desarrollo de aplicaciones con JavaFX.',
  macos: 'macOS y herramientas para desarrolladores en el ecosistema Apple.',
  ollamafx: 'OllamaFX: interfaz JavaFX para Ollama.',
  kmeans: 'KMeans: algoritmo de clustering, intuición y aplicación.',
  pib: 'PIB y análisis de indicadores macroeconómicos con datos.',
  'business-analytics':
    'Business Analytics: analítica orientada a la toma de decisiones de negocio.',
  'data-mart': 'Data Marts: diseño y rol dentro de la arquitectura de datos.',
  'gobierno-de-datos':
    'Gobierno de datos: políticas, roles y procesos para gestionar el dato como activo.',
};

export function descriptionFor(slug: string): string | null {
  return TAG_DESCRIPTIONS[slug] ?? null;
}
