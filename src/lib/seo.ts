/**
 * Single source of truth para los esquemas JSON-LD (schema.org) del sitio.
 *
 * Igual que `urls.ts` centraliza las rutas, este módulo centraliza el andamiaje
 * de datos estructurados para no repetirlo a mano en cada `.astro`. Usa `@id`
 * estables para que Google consolide las entidades (Person, WebSite) en el
 * Knowledge Graph en vez de tratarlas como nodos sueltos por página.
 */
import { SITE_URL, absUrls } from './urls';

/** Identificadores estables de entidad (entity linking). */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Person Schema — la identidad del autor. Referenciable por `@id`. */
export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Ing. Frederick Adolfo Salazar Sánchez',
  url: SITE_URL,
  jobTitle: 'Senior Data Engineer & Arquitecto de Datos',
  description:
    'Senior Data Engineer & Arquitecto de Datos con más de 11 años de experiencia. Especializado en Data Engineering, Big Data, IA y Analytics en Colombia y LATAM.',
  image: `${SITE_URL}/images/profile.png`,
  knowsAbout: [
    'Data Engineering',
    'Big Data',
    'Apache Spark',
    'Azure Data Factory',
    'Databricks',
    'Python',
    'Machine Learning',
    'Inteligencia Artificial',
    'SQL',
    'Data Architecture',
    'dbt',
    'Apache Airflow',
    'ETL/ELT',
  ],
  sameAs: [
    'https://www.linkedin.com/in/fredericksalazar',
    'https://github.com/fredericksalazar',
    'https://www.kaggle.com/fredericksalazar',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'Globant',
    url: 'https://www.globant.com',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Universitat Oberta de Catalunya',
    url: 'https://www.uoc.edu',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CO',
    addressLocality: 'Cali',
  },
  knowsLanguage: [
    { '@type': 'Language', name: 'Español' },
    { '@type': 'Language', name: 'Inglés' },
  ],
  birthPlace: {
    '@type': 'Place',
    address: 'Cali, Colombia',
  },
};

/**
 * WebSite Schema — representa el sitio completo. Se emite solo en la home.
 * Habilita reconocimiento de marca/entidad. No incluye `potentialAction`
 * (SearchAction) porque el sitio aún no tiene un endpoint de búsqueda propio.
 */
export const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: 'Frederick Salazar — Data Engineer & Arquitecto de Datos',
  alternateName: ['Observatorio de Datos de Colombia', 'Frederick Salazar'],
  description:
    'Portafolio técnico y Observatorio de Datos de Colombia: indicadores macroeconómicos, análisis electoral, calculadoras y contenido sobre ingeniería de datos.',
  inLanguage: 'es-CO',
  publisher: { '@id': PERSON_ID },
};

/** Un eslabón de la ruta de migas. `url` debe ser absoluta. */
export interface Crumb {
  name: string;
  url: string;
}

/**
 * Construye un BreadcrumbList JSON-LD a partir de la ruta de migas.
 * Genera resultados enriquecidos (breadcrumb) en Google sin necesitar
 * migas visibles en la página.
 */
export const breadcrumbList = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});

/** "Inicio" — primer eslabón de toda ruta de migas. */
const HOME_CRUMB: Crumb = { name: 'Inicio', url: absUrls.home() };

/**
 * Prepende "Inicio" a la ruta. Úsalo en las páginas:
 *   breadcrumbs={trail(sectionCrumb.observatorio, { name: 'Comercio Exterior', url: absUrls.observatorioSub('comercio') })}
 */
export const trail = (...rest: Crumb[]): Crumb[] => [HOME_CRUMB, ...rest];

/** Raíces de sección reutilizables, para no repetir nombre+url en cada página. */
export const sectionCrumb = {
  observatorio: { name: 'Observatorio de Datos', url: absUrls.observatorio() },
  informes: { name: 'Informes', url: absUrls.observatorioInformes() },
  blog: { name: 'Blog', url: absUrls.blog() },
  proyectos: { name: 'Proyectos', url: absUrls.proyectos() },
  calculadoras: { name: 'Calculadoras', url: absUrls.calculadoras() },
  elecciones: { name: 'Elecciones Presidenciales', url: absUrls.elecciones('2026-segunda-vuelta') },
} as const satisfies Record<string, Crumb>;

/** Dataset publicado del Observatorio, en la forma mínima que necesita el JSON-LD. */
export interface DatasetCatalogo {
  nombre: string;
  descripcion: string;
  ultimaActualizacion: string;
  primerPeriodo: string;
  ultimoPeriodo: string;
  fuentes: { nombre: string; url: string }[];
}

const LICENCIA_CC_BY = 'https://creativecommons.org/licenses/by/4.0/';

/**
 * `DataCatalog` + `WebPage` de la Home del Observatorio (spec 005, FR-015):
 * un `Dataset` por conjunto publicado, para Google Dataset Search.
 */
export const catalogoSchema = (datasets: DatasetCatalogo[], pagina: { nombre: string; descripcion: string }) => {
  const url = absUrls.observatorio();
  const creator = { '@id': PERSON_ID };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: pagina.nombre,
        description: pagina.descripcion,
        inLanguage: 'es-CO',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': `${url}#catalogo` },
        author: creator,
      },
      {
        '@type': 'DataCatalog',
        '@id': `${url}#catalogo`,
        name: 'Observatorio de Datos de Colombia',
        description:
          'Catálogo de indicadores económicos y sociales de Colombia con fuente oficial y actualización automática.',
        url,
        inLanguage: 'es-CO',
        creator,
        publisher: creator,
        license: LICENCIA_CC_BY,
        spatialCoverage: { '@type': 'Place', name: 'Colombia' },
        dataset: datasets.map((d) => ({
          '@type': 'Dataset',
          name: d.nombre,
          description: d.descripcion,
          url,
          creator,
          license: LICENCIA_CC_BY,
          isAccessibleForFree: true,
          spatialCoverage: { '@type': 'Place', name: 'Colombia' },
          temporalCoverage: `${d.primerPeriodo}/${d.ultimoPeriodo}`,
          dateModified: d.ultimaActualizacion,
          isBasedOn: d.fuentes.map((f) => ({ '@type': 'CreativeWork', name: f.nombre, url: f.url })),
          // Sin `distribution` a propósito: el autor no quiere promover la descarga
          // directa de los JSON procesados (refinamiento de la spec 005).
        })),
      },
    ],
  };
};
