/**
 * Catálogo de informes del Observatorio de Datos de Colombia.
 *
 * Esto es METADATA de catálogo (títulos, descripciones, lista de versiones de
 * PDF), NO una serie cuantitativa del pipeline. Por eso vive como referencia
 * estática en TypeScript — análogo a `presidentes.json` — y no viola la REGLA 1
 * de ARCHITECTURE.md (que aplica a datos numéricos de indicadores).
 *
 * Los PDF reales viven en `public/informes/`. Enlázalos SIEMPRE con
 * `urls.informePdf(archivo)` (archivo real, sin trailing slash).
 *
 * Para agregar una versión nueva de un informe: deja un PDF nuevo en
 * `public/informes/` y antepón una entrada en `versiones` (más reciente
 * primero), marcando `vigente: true` solo en la última.
 */

import { urls } from "../urls";

export interface VersionInforme {
  /** Etiqueta de la edición, p. ej. "Primera edición". */
  version: string;
  /** Período de publicación en formato "YYYY-MM". */
  fecha: string;
  /** Nombre del archivo PDF dentro de `public/informes/`. */
  archivo: string;
  /** Cambios destacados de esta versión (changelog corto). */
  notas?: string;
  paginas?: number;
  tamanoMB?: number;
  /** La versión vigente/recomendada. Solo una por informe. */
  vigente?: boolean;
}

export interface HallazgoInforme {
  /** Titular corto del hallazgo o indicador clave. */
  titulo: string;
  /** Explicación con las cifras y el contexto del informe. */
  detalle: string;
}

export interface EnlaceRelacionadoInforme {
  etiqueta: string;
  href: string;
}

export interface Informe {
  /** Slug único; define la URL `/observatorio/informes/{slug}/`. */
  slug: string;
  titulo: string;
  /** Título optimizado para `<title>` (≤ 60 caracteres, ARQ-04). */
  tituloSeo?: string;
  /** Subtítulo corto para hero, tarjetas y meta description (≤ 160 caracteres, ARQ-04). */
  resumen: string;
  /** Descripción larga del informe (1-2 párrafos). */
  descripcion: string;
  /** Objetivo / propósito del informe. */
  objetivo: string;
  /** Cobertura temporal legible, p. ej. "1960 – 2025". */
  cobertura?: string;
  /** Dimensiones / temas que abarca (para tags). */
  dimensiones?: string[];
  /** Imagen de portada bajo `public/images/informes/`. */
  portada?: string;
  /** Imagen Open Graph PNG 1200×630 (ARQ-10). Si se omite, usa `portada`. */
  ogImage?: string;
  /** Palabras clave SEO específicas del informe. */
  keywords?: string;
  /** Hallazgos clave en HTML indexable (PRD-03). */
  hallazgos?: HallazgoInforme[];
  /** Fuentes primarias y notas metodológicas visibles (PRD-05). */
  metodologia?: string;
  /** Enlaces internos hacia dashboards o artículos relacionados (PRD-01). */
  enlacesRelacionados?: EnlaceRelacionadoInforme[];
  /** Versiones, más reciente primero. */
  versiones: VersionInforme[];
}

export const INFORMES: Informe[] = [
  {
    slug: "pib-colombia-2025",
    titulo: "El PIB de Colombia en 2025",
    tituloSeo: "Informe PIB de Colombia 2025 (PDF) · Observatorio",
    resumen:
      "Análisis en PDF del PIB de Colombia en 2025: récord de USD 457.410 M, crecimiento real de 2,64 % y PIB per cápita de USD 8.562 en perspectiva histórica.",
    descripcion:
      "Este informe del Observatorio de Datos de Colombia examina el cierre del Producto Interno Bruto (PIB) de 2025 en perspectiva histórica desde 1960. En 2025 la economía colombiana alcanzó los USD 457.410 millones en dólares corrientes —la cifra más alta de su historia y 113 veces el valor de 1960 (USD 4.030 millones)—, registró un crecimiento real interanual de 2,64 % frente a 2024 y llevó el PIB per cápita a un nuevo récord de USD 8.562 por habitante (+7,7 % anual), superando por primera vez en doce años el máximo previo de 2013 (USD 8.279).",
    objetivo:
      "Ofrecer a ciudadanos, analistas, periodistas y tomadores de decisiones una síntesis técnica, visual y pedagógica sobre el desempeño económico de Colombia en 2025, distinguiendo con rigor entre la expansión en dólares corrientes (que integra inflación y tasa de cambio) y el crecimiento real de la producción, y contrastando el ritmo reciente (1,66 % promedio entre 2023 y 2025) frente a la trayectoria histórica del país (3,95 % anual desde 1961).",
    cobertura: "1960 – 2025",
    dimensiones: [
      "PIB total",
      "PIB per cápita",
      "Crecimiento real",
      "Series históricas",
      "Cuentas Nacionales",
    ],
    portada: "/images/informes/pib-colombia-2025-portada.png",
    ogImage: "/images/blog/pib-colombia-2025-cover.png",
    keywords:
      "informe pib colombia 2025 pdf, pib colombia 2025, analisis pib colombia 2025, pib per capita colombia 2025, crecimiento economico colombia 2025, cuentas nacionales dane, banco mundial colombia, observatorio de datos de colombia",
    hallazgos: [
      {
        titulo: "PIB total récord: USD 457.410 millones en 2025",
        detalle:
          "La economía colombiana alcanzó su mayor tamaño en dólares corrientes desde 1960 (cuando era de USD 4.030 millones), multiplicándose por 113 en 65 años.",
      },
      {
        titulo: "PIB per cápita en máximo histórico: USD 8.562",
        detalle:
          "Creció 7,7 % frente a 2024 y superó en 3,4 % el récord previo de 2013 (USD 8.279), tras doce años por debajo de ese umbral. Equivale a 33 veces el PIB per cápita de 1960 (USD 258), mientras la población pasó de 15,6 M a 53,4 M.",
      },
      {
        titulo: "Crecimiento real del PIB de +2,64 % en 2025",
        detalle:
          "Es el mejor registro desde 2022 y acumula una expansión real de +15,9 % frente a 2019. Sin embargo, el promedio del trienio 2023–2025 (1,66 %) se mantiene por debajo del promedio histórico de 3,95 % anual (1961–2025).",
      },
      {
        titulo: "Resiliencia en seis décadas de historia",
        detalle:
          "Entre 1960 y 2025 Colombia solo registró dos recesiones anuales en términos reales: 1999 (−4,2 %) y 2020 (−7,2 %), con la década de los años 70 como el período de mayor expansión promedio (5,74 % anual y pico de 8,47 % en 1978).",
      },
    ],
    metodologia:
      "Elaborado a partir de fuentes primarias oficiales: World Development Indicators (Banco Mundial) para las series de PIB en USD corrientes, crecimiento real anual, PIB per cápita y población, y Cuentas Nacionales del DANE como fuente oficial de Colombia. Los promedios decadales corresponden a promedios aritméticos de las tasas anuales de crecimiento real y la comparación 2025 vs. 2019 se obtiene mediante encadenamiento de tasas anuales.",
    enlacesRelacionados: [
      {
        etiqueta: "Explorar el dashboard interactivo de PIB",
        href: urls.observatorioSub("pib"),
      },
      {
        etiqueta: "Leer el análisis completo del PIB 2025 en el blog",
        href: urls.blogPost("pib-colombia-2025-analisis"),
      },
    ],
    versiones: [
      {
        version: "Primera edición",
        fecha: "2026-10",
        archivo: "pib-colombia-2025-2026-10.pdf",
        notas:
          "Edición cierre 2025. Seis láminas ejecutivas: indicadores clave de 2025, transformación del PIB desde 1960 (multiplicador 113x), récord de PIB per cápita (USD 8.562), crecimiento real por décadas (1961–2025) y notas metodológicas con fuentes oficiales.",
        paginas: 6,
        tamanoMB: 0.7,
        vigente: true,
      },
    ],
  },
  {
    slug: "historia-de-colombia",
    titulo: "Colombia en Datos",
    tituloSeo: "Colombia en Datos · Informe del Observatorio",
    resumen:
      "Una mirada a la evolución de Colombia desde 1960 hasta 2024 en sus principales dimensiones económicas y sociales.",
    descripcion:
      "«Colombia en Datos» consolida y analiza el comportamiento histórico de los principales indicadores macroeconómicos y demográficos del país. A partir del procesamiento de fuentes públicas oficiales —Banco Mundial, DANE y Banco de la República— el informe recorre la evolución demográfica, el PIB, el mercado laboral, el costo de vida, el comercio exterior y la composición de exportaciones e importaciones, ofreciendo una lectura clara y accesible de cómo ha cambiado Colombia en más de seis décadas.",
    objetivo:
      "Democratizar y alfabetizar con datos históricos para que cualquier persona pueda comprender cómo evoluciona el país en términos económicos, sociales y demográficos. Al presentar la información de forma visual y ordenada, el informe busca fomentar una cultura de toma de decisiones basada en evidencia y fortalecer el entendimiento colectivo de la realidad nacional.",
    cobertura: "1960 – 2024",
    dimensiones: ["Demografía", "PIB", "Mercado laboral", "Inflación", "Comercio exterior"],
    portada: "/images/informes/historia-de-colombia-portada.png",
    versiones: [
      {
        version: "Primera edición",
        fecha: "2026-06",
        archivo: "historia-de-colombia-2026-06.pdf",
        notas:
          "Edición inicial. Seis secciones: evolución demográfica, PIB, mercado laboral, costo de vida (inflación y tasas), comercio exterior y composición de exportaciones e importaciones.",
        paginas: 12,
        tamanoMB: 4.1,
        vigente: true,
      },
    ],
  },
];

export const getInforme = (slug: string): Informe | undefined =>
  INFORMES.find((i) => i.slug === slug);

/** Convierte "YYYY-MM" a etiqueta legible en español, p. ej. "Junio 2026". */
export const formatFechaInforme = (periodo: string): string => {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const [anio, mes] = periodo.split("-");
  const idx = Number(mes) - 1;
  return idx >= 0 && idx < 12 ? `${meses[idx]} ${anio}` : periodo;
};
