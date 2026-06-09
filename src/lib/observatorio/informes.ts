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

export interface Informe {
  /** Slug único; define la URL `/observatorio/informes/{slug}/`. */
  slug: string;
  titulo: string;
  /** Subtítulo corto para hero y tarjetas. */
  resumen: string;
  /** Descripción larga del informe (1-2 párrafos). */
  descripcion: string;
  /** Objetivo / propósito del informe. */
  objetivo: string;
  /** Cobertura temporal legible, p. ej. "1960 – 2024". */
  cobertura?: string;
  /** Dimensiones / temas que abarca (para tags). */
  dimensiones?: string[];
  /** Imagen de portada bajo `public/images/informes/`. */
  portada?: string;
  /** Versiones, más reciente primero. */
  versiones: VersionInforme[];
}

export const INFORMES: Informe[] = [
  {
    slug: "historia-de-colombia",
    titulo: "La Historia de Colombia en Datos",
    resumen:
      "Una mirada a la evolución de Colombia desde 1960 hasta 2024 en sus principales dimensiones económicas y sociales.",
    descripcion:
      "La Historia de Colombia en Datos consolida y analiza el comportamiento histórico de los principales indicadores macroeconómicos y demográficos del país. A partir del procesamiento de fuentes públicas oficiales —Banco Mundial, DANE y Banco de la República— el informe recorre la evolución demográfica, el PIB, el mercado laboral, el costo de vida, el comercio exterior y la composición de exportaciones e importaciones, ofreciendo una lectura clara y accesible de cómo ha cambiado Colombia en más de seis décadas.",
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
        paginas: 9,
        tamanoMB: 3.6,
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
