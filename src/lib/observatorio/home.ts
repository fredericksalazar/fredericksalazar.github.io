/**
 * home.ts — Catálogos y derivaciones de la Home del Observatorio (`/observatorio/`).
 *
 * Módulo **puro**: no lee archivos. La página le pasa los datasets leídos en
 * build con `data.ts`, y `chart-defs/sparkline.ts` puede importarlo sin
 * arrastrar `node:fs` al bundle del cliente.
 *
 * Los catálogos solo declaran QUÉ mostrar; ninguna cifra vive aquí (ARQ-02).
 */
import { urls } from "../urls";
import type { DatasetName } from "./data-client";
import { referenciaIndicador, valoresNoNulos, yearOf } from "./derivations";
import type { ReferenciaCalculada, TipoReferencia } from "./derivations";
import { formatPeriodoCorto } from "./formatters";
import type { Fuente, Indicador, Variacion } from "./types";

// ───────────────────────────── Tipos ─────────────────────────────

export type Periodicidad = "mensual" | "anual";
export type GrupoIndicador = "precios" | "actividad" | "empleo" | "externo" | "contexto";

/** Forma mínima común de los datasets del Observatorio (contrato sección 3). */
export interface DatasetObservatorio {
  metadata: {
    ultima_actualizacion: string;
    fuentes: Record<string, Fuente | undefined>;
    cobertura: { primer_periodo: string; ultimo_periodo: string };
  };
  indicadores: Record<string, Indicador | undefined>;
  serie: Array<{ periodo: string }>;
}

/** Datasets que la Home necesita, leídos en build por la página. */
export type DatasetsHome = Partial<Record<DatasetName, DatasetObservatorio>>;

export interface IndicadorClaveDef {
  id: string;
  grupo: GrupoIndicador;
  nombre: string;
  dataset: DatasetName;
  /** Clave en `indicadores` y en `serie` del dataset. */
  campo: string;
  /** Se declara por indicador: un dataset puede mezclar series mensuales y anuales. */
  periodicidad: Periodicidad;
  /** Contra qué periodo calcula el pipeline el `delta` (empleo compara interanual). */
  comparacion: "anterior" | "interanual";
  referencia: TipoReferencia;
  /** Qué significa el número para una persona no experta (≤ 110 caracteres, sin cifras). */
  explicacion: string;
  /** Clave de `metadata.fuentes` del dataset. */
  fuenteKey: string;
  href: string;
  /** Texto del enlace al dominio ("Ver dashboard de …"). */
  destino: string;
}

export interface IndicadorClave {
  def: IndicadorClaveDef;
  valor: number;
  unidad: string;
  periodo: string;
  delta: number | null;
  variacion: Variacion;
  referencia: ReferenciaCalculada;
  fuente: Fuente | null;
  frescura: "reciente" | "no-reciente";
  /** Periodo contra el que se mide `delta` ("YYYY-MM"), o null si no hay. */
  periodoComparado: string | null;
}

export interface DominioObservatorio {
  slug: string;
  nombre: string;
  href: string;
}

export interface PublicacionReciente {
  tipo: "informe" | "articulo";
  titulo: string;
  fecha: Date;
  href: string;
  descripcion: string;
  imagen?: string;
}

// ───────────────────────────── Catálogos ─────────────────────────────

/** Fuente única de la navegación del Observatorio (`DashboardNav`). */
export const DOMINIOS: DominioObservatorio[] = [
  { slug: "inicio", nombre: "Inicio", href: urls.observatorio() },
  { slug: "inflacion-tasa", nombre: "Inflación vs Tasa", href: urls.observatorioSub("inflacion") },
  { slug: "empleo", nombre: "Empleo", href: urls.observatorioSub("empleo") },
  { slug: "comercio", nombre: "Comercio Exterior", href: urls.observatorioSub("comercio") },
  { slug: "monetario", nombre: "Monetario", href: urls.observatorioSub("monetario") },
  { slug: "pib", nombre: "PIB", href: urls.observatorioSub("pib") },
  { slug: "demografia", nombre: "Demografía", href: urls.observatorioSub("demografia") },
  { slug: "informes", nombre: "Informes", href: urls.observatorioInformes() },
  { slug: "acerca", nombre: "Acerca", href: urls.observatorioSub("acerca") },
];

/**
 * Indicadores clave del panel "Cómo va Colombia" (research R3), en orden de
 * lectura. Solo metadata: el valor, el periodo y la fuente salen del dataset.
 */
export const INDICADORES_CLAVE: IndicadorClaveDef[] = [
  {
    id: "inflacion-anual",
    grupo: "precios",
    nombre: "Inflación anual",
    dataset: "inflacion",
    campo: "inflacion_anual",
    periodicidad: "mensual",
    comparacion: "anterior",
    referencia: "meta-oficial",
    explicacion: "Cuánto subieron los precios de la canasta familiar en los últimos doce meses.",
    fuenteKey: "inflacion",
    href: urls.observatorioSub("inflacion"),
    destino: "Ver dashboard de inflación",
  },
  {
    id: "tasa-banrep",
    grupo: "precios",
    nombre: "Tasa de intervención BanRep",
    dataset: "inflacion",
    campo: "tasa_interes",
    periodicidad: "mensual",
    comparacion: "anterior",
    referencia: "promedio-20a",
    explicacion: "Lo que el Banco de la República cobra a los bancos; marca el costo del crédito.",
    fuenteKey: "tasa_interes",
    href: urls.observatorioSub("inflacion"),
    destino: "Ver dashboard de inflación y tasas",
  },
  {
    id: "crecimiento-pib",
    grupo: "actividad",
    nombre: "Crecimiento del PIB",
    dataset: "pib",
    campo: "crecimiento_pib",
    periodicidad: "anual",
    comparacion: "anterior",
    referencia: "promedio-20a",
    explicacion: "Cuánto creció la producción de bienes y servicios del país frente al año anterior.",
    fuenteKey: "pib",
    href: urls.observatorioSub("pib"),
    destino: "Ver dashboard del PIB",
  },
  {
    id: "pib-percapita",
    grupo: "actividad",
    nombre: "PIB por habitante",
    dataset: "pib",
    campo: "pib_percapita",
    periodicidad: "anual",
    comparacion: "anterior",
    referencia: "hace-un-ano",
    explicacion: "El tamaño de la economía repartido entre cada habitante, en dólares corrientes.",
    fuenteKey: "pib",
    href: urls.observatorioSub("pib"),
    destino: "Ver dashboard del PIB",
  },
  {
    id: "desempleo",
    grupo: "empleo",
    nombre: "Tasa de desempleo",
    dataset: "empleo",
    campo: "tasa_desempleo",
    periodicidad: "mensual",
    comparacion: "interanual",
    referencia: "promedio-20a",
    explicacion: "Porcentaje de personas que buscan trabajo y no lo consiguen.",
    fuenteKey: "empleo",
    href: urls.observatorioSub("empleo"),
    destino: "Ver dashboard de empleo",
  },
  {
    id: "trm",
    grupo: "externo",
    nombre: "Dólar (TRM)",
    dataset: "externo",
    campo: "trm",
    periodicidad: "mensual",
    comparacion: "anterior",
    referencia: "hace-un-ano",
    explicacion: "Cuántos pesos cuesta un dólar; mueve el precio de lo importado y lo exportado.",
    fuenteKey: "banrep_trm",
    href: urls.observatorioSub("monetario"),
    destino: "Ver dashboard monetario",
  },
  {
    id: "cuenta-corriente",
    grupo: "externo",
    nombre: "Cuenta corriente",
    dataset: "externo",
    campo: "cuenta_corriente",
    periodicidad: "anual",
    comparacion: "anterior",
    referencia: "promedio-20a",
    explicacion: "Lo que el país recibe del exterior menos lo que le paga; si es negativa, hay déficit.",
    fuenteKey: "banco_mundial",
    href: urls.observatorioSub("monetario"),
    destino: "Ver dashboard monetario",
  },
  {
    id: "salario-minimo",
    grupo: "contexto",
    nombre: "Salario mínimo",
    dataset: "salario-minimo",
    campo: "salario_minimo",
    periodicidad: "anual",
    comparacion: "anterior",
    referencia: "hace-un-ano",
    explicacion: "El ingreso mensual mínimo legal en Colombia, sin el auxilio de transporte.",
    fuenteKey: "salario_minimo",
    href: urls.calculadora("sueldo-vs-inflacion"),
    destino: "Compara tu sueldo con la inflación",
  },
];

export const GRUPOS: { id: GrupoIndicador; titulo: string }[] = [
  { id: "precios", titulo: "Precios y dinero" },
  { id: "actividad", titulo: "Actividad y bienestar" },
  { id: "empleo", titulo: "Empleo" },
  { id: "externo", titulo: "Sector externo" },
  { id: "contexto", titulo: "Contexto" },
];

// ───────────────────────────── Formato (es-CO) ─────────────────────────────

const nf0 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valor con su unidad, en formato es-CO. */
export function formatIndicador(v: number, unidad: string): string {
  switch (unidad) {
    case "%": return `${nf2.format(v)} %`;
    case "% PIB": return `${nf2.format(v)} % del PIB`;
    case "pp": return `${nf2.format(v)} pp`;
    case "COP/USD": return `$${nf2.format(v)}`;
    case "USD": return `US$${nf0.format(v)}`;
    case "COP": return `$${nf0.format(v)}`;
    case "personas": return `${nf0.format(v)}`;
    default: return `${nf2.format(v)} ${unidad}`;
  }
}

/** Magnitud del cambio (sin signo: la dirección la dice el texto). Los % cambian en pp. */
export function formatCambio(delta: number, unidad: string): string {
  const abs = Math.abs(delta);
  if (unidad === "%" || unidad === "% PIB") return `${nf2.format(abs)} pp`;
  return formatIndicador(abs, unidad);
}

/** "Sep 2026" en series mensuales; "2025" en anuales (el pipeline las fecha en diciembre). */
export function formatPeriodoIndicador(periodo: string, periodicidad: Periodicidad): string {
  return periodicidad === "anual" ? yearOf(periodo) : formatPeriodoCorto(periodo);
}

// ───────────────────────────── Derivaciones ─────────────────────────────

/** Último día del mes `YYYY-MM` desplazado `meses` meses. */
const finDeMes = (periodo: string, meses: number): Date => {
  const [y, m] = periodo.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m + meses, 0));
};

const DIA_MS = 86_400_000;

/**
 * Frescura del dato (research R8, KPI K6). Mensual: vence 45 días después del
 * cierre del mes siguiente (rezago normal de publicación). Anual: 15 meses
 * después del cierre del año.
 */
export function estadoFrescura(
  periodo: string,
  periodicidad: Periodicidad,
  hoy: Date = new Date(),
): "reciente" | "no-reciente" {
  // El día límite cuenta completo: vence al terminar ese día (UTC).
  const ultimoDia = periodicidad === "mensual"
    ? new Date(finDeMes(periodo, 1).getTime() + 45 * DIA_MS)
    : finDeMes(`${yearOf(periodo)}-12`, 15);
  return hoy.getTime() >= ultimoDia.getTime() + DIA_MS ? "no-reciente" : "reciente";
}

/**
 * Une cada `IndicadorClaveDef` con su dataset (leído en build por la página).
 * Un `campo` inexistente rompe el build; un valor `null` omite el indicador.
 */
export function buildIndicadoresClave(datasets: DatasetsHome, hoy: Date = new Date()): IndicadorClave[] {
  const resultado: IndicadorClave[] = [];
  for (const def of INDICADORES_CLAVE) {
    const data = datasets[def.dataset];
    if (!data) throw new Error(`[home] Falta el dataset "${def.dataset}" para el indicador "${def.id}".`);
    const indicador = data.indicadores[def.campo];
    if (!indicador) throw new Error(`[home] El dataset "${def.dataset}" no tiene el indicador "${def.campo}".`);
    const { valor, periodo, delta, variacion } = indicador.actual;
    if (valor === null) {
      console.warn(`[home] "${def.id}" sin dato en "${def.dataset}"; se omite del panel.`);
      continue;
    }
    const valores = valoresNoNulos(data.serie, def.campo);
    const periodoComparado = def.comparacion === "interanual"
      ? `${parseInt(yearOf(periodo), 10) - 1}${periodo.slice(4)}`
      : valores.find((v) => v.periodo < periodo)?.periodo ?? null;
    resultado.push({
      def,
      valor,
      unidad: indicador.unidad,
      periodo,
      delta,
      variacion,
      referencia: referenciaIndicador(
        def.referencia, valor, periodo, data.serie, def.campo,
        (v) => formatIndicador(v, indicador.unidad),
      ),
      fuente: data.metadata.fuentes[def.fuenteKey] ?? null,
      frescura: estadoFrescura(periodo, def.periodicidad, hoy),
      periodoComparado,
    });
  }
  return resultado;
}

/**
 * Datasets abiertos del Observatorio que describe la Home (hero y JSON-LD).
 * La clave es el sufijo del archivo `public/data/data_<clave>.json`.
 */
export const DATASETS_PUBLICADOS: { clave: string; nombre: string; descripcion: string }[] = [
  { clave: "inflacion", nombre: "Inflación y tasas de interés de Colombia", descripcion: "Inflación anual y mensual (DANE), tasa de intervención del Banco de la República y tasa real." },
  { clave: "empleo", nombre: "Mercado laboral de Colombia", descripcion: "Desempleo, ocupación, participación y subempleo según la GEIH del DANE." },
  { clave: "pib", nombre: "Producto Interno Bruto de Colombia", descripcion: "PIB total, crecimiento real, PIB por habitante y población." },
  { clave: "comercio", nombre: "Comercio exterior de Colombia", descripcion: "Exportaciones, importaciones y apertura comercial como porcentaje del PIB." },
  { clave: "externo", nombre: "Sector externo de Colombia", descripcion: "TRM, reservas internacionales, cuenta corriente, inversión extranjera y deuda externa." },
  { clave: "demografia", nombre: "Demografía de Colombia", descripcion: "Población, crecimiento demográfico y esperanza de vida por sexo." },
  { clave: "salario_minimo", nombre: "Salario mínimo de Colombia", descripcion: "Salario mínimo legal, auxilio de transporte y su variación anual." },
];

/**
 * Etiquetas del blog que identifican publicaciones del Observatorio (research R9):
 * informes mensuales y dólar ("Observatorio de Datos") y la serie
 * "Colombia vs rival" ("Banco Mundial").
 */
export const ETIQUETAS_OBSERVATORIO = ["Observatorio de Datos", "Banco Mundial"];

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Forma mínima de un post de la colección `blog` que necesita la Home. */
export interface PostResumen {
  id: string;
  data: { titulo: string; descripcion: string; fecha: Date; etiquetas?: string[]; draft?: boolean; imagen?: string };
}

/** Forma mínima de un informe del catálogo `INFORMES`. */
export interface InformeResumen {
  slug: string;
  titulo: string;
  resumen: string;
  portada?: string;
  versiones: { fecha: string; vigente?: boolean }[];
}

/**
 * Lo más reciente del Observatorio (FR-011): informes del catálogo y posts con
 * alguna etiqueta de `ETIQUETAS_OBSERVATORIO`, sin borradores, del más nuevo al
 * más antiguo. Se actualiza solo al publicar.
 */
export function publicacionesRecientes(
  posts: PostResumen[],
  informes: InformeResumen[],
  limite = 4,
): PublicacionReciente[] {
  const etiquetas = new Set(ETIQUETAS_OBSERVATORIO.map(normalizar));
  const articulos: PublicacionReciente[] = posts
    .filter((p) => !p.data.draft && (p.data.etiquetas ?? []).some((e) => etiquetas.has(normalizar(e))))
    .map((p) => ({
      tipo: "articulo",
      titulo: p.data.titulo,
      fecha: p.data.fecha,
      href: urls.blogPost(p.id),
      descripcion: p.data.descripcion,
      imagen: p.data.imagen,
    }));
  const delCatalogo: PublicacionReciente[] = informes.map((i) => {
    const version = i.versiones.find((v) => v.vigente) ?? i.versiones[0];
    const [anio, mes] = version.fecha.split("-").map((n) => parseInt(n, 10));
    return {
      tipo: "informe",
      titulo: i.titulo,
      fecha: new Date(Date.UTC(anio, mes - 1, 1)),
      href: urls.observatorioInforme(i.slug),
      descripcion: i.resumen,
      imagen: i.portada,
    };
  });
  return [...articulos, ...delCatalogo]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, limite);
}
