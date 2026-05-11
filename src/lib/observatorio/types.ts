export type Variacion = "subio" | "bajo" | "igual" | null;

export interface IndicadorActual {
  periodo: string;
  valor: number | null;
  variacion: Variacion;
  delta: number | null;
}

export interface Indicador {
  actual: IndicadorActual;
  unidad: string;
}

export interface SerieFila {
  periodo: string;
  inflacion_anual: number | null;
  inflacion_anual_delta: number | null;
  inflacion_anual_variacion: Variacion;
  inflacion_mensual: number | null;
  inflacion_mensual_delta: number | null;
  inflacion_mensual_variacion: Variacion;
  tasa_interes: number | null;
  tasa_interes_delta: number | null;
  tasa_interes_variacion: Variacion;
  spread: number | null;
  spread_delta: number | null;
  spread_variacion: Variacion;
}

export interface Fuente {
  nombre: string;
  url: string;
  indicador: string;
}

export interface ObservatorioMetadata {
  ultima_actualizacion: string;
  fuentes: {
    inflacion: Fuente;
    tasa_interes: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
  };
}

export interface ObservatorioIndicadores {
  inflacion_anual: Indicador;
  inflacion_mensual: Indicador;
  tasa_interes: Indicador;
  spread: Indicador;
}

export interface ObservatorioData {
  metadata: ObservatorioMetadata;
  indicadores: ObservatorioIndicadores;
  serie: SerieFila[];
  historico: Record<string, number>;
}

export type SemanticIndicador =
  | "inflacion"
  | "tasa"
  | "spread"
  | "empleo"
  | "ocupacion"
  | "informalidad"
  | "subempleo"
  | "comercio"
  | "deficit"
  | "superavit";

// ───────────────────────────── EMPLEO ─────────────────────────────

export interface EmpleoSerieFila {
  periodo: string;
  tasa_desempleo: number | null;
  tasa_desempleo_delta: number | null;
  tasa_desempleo_variacion: Variacion;
  tgp: number | null;
  tgp_delta: number | null;
  tgp_variacion: Variacion;
  to: number | null;
  to_delta: number | null;
  to_variacion: Variacion;
  subempleo: number | null;
  subempleo_delta: number | null;
  subempleo_variacion: Variacion;
  informalidad: number | null;
  informalidad_delta: number | null;
  informalidad_variacion: Variacion;
}

export interface EmpleoIndicadores {
  tasa_desempleo: Indicador;
  tgp: Indicador;
  to: Indicador;
  subempleo: Indicador;
  informalidad: Indicador;
}

export interface EmpleoMetadata {
  ultima_actualizacion: string;
  fuentes: {
    empleo: Fuente;
    historico: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
    granularidad: "anual" | "mensual";
  };
  notas?: string;
}

export interface EmpleoData {
  metadata: EmpleoMetadata;
  indicadores: EmpleoIndicadores;
  serie: EmpleoSerieFila[];
  historico: Record<string, number>;
}

// ───────────────────────────── COMERCIO ─────────────────────────────

export interface ComercioSerieFila {
  periodo: string;
  exportaciones: number | null;
  exportaciones_delta: number | null;
  exportaciones_variacion: Variacion;
  importaciones: number | null;
  importaciones_delta: number | null;
  importaciones_variacion: Variacion;
  balanza_comercial: number | null;
  balanza_comercial_delta: number | null;
  balanza_comercial_variacion: Variacion;
  apertura: number | null;
  apertura_delta: number | null;
  apertura_variacion: Variacion;
  ied: number | null;
  ied_delta: number | null;
  ied_variacion: Variacion;
}

export interface ComercioIndicadores {
  exportaciones: Indicador;
  importaciones: Indicador;
  balanza_comercial: Indicador;
  apertura: Indicador;
  ied: Indicador;
}

export interface ComercioMetadata {
  ultima_actualizacion: string;
  fuentes: {
    comercio: Fuente;
    dane: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
    granularidad: "anual" | "mensual";
  };
}

export interface ComercioData {
  metadata: ComercioMetadata;
  indicadores: ComercioIndicadores;
  serie: ComercioSerieFila[];
  historico: Record<string, number>;
  matriz_exportaciones: Record<string, Record<string, number | null>>;
  matriz_importaciones: Record<string, Record<string, number | null>>;
  productos_tradicionales: Record<string, Record<string, number | null>>;
}

// ───────────────────────────── PIB ─────────────────────────────

export interface PIBSerieFila {
  periodo: string;
  pib_total: number | null;
  pib_total_delta: number | null;
  pib_total_variacion: Variacion;
  crecimiento_pib: number | null;
  crecimiento_pib_delta: number | null;
  crecimiento_pib_variacion: Variacion;
  pib_percapita: number | null;
  pib_percapita_delta: number | null;
  pib_percapita_variacion: Variacion;
  poblacion: number | null;
  poblacion_delta: number | null;
  poblacion_variacion: Variacion;
  deuda_publica: number | null;
  deuda_publica_delta: number | null;
  deuda_publica_variacion: Variacion;
  gini: number | null;
  gini_delta: number | null;
  gini_variacion: Variacion;
}

export interface PIBIndicadores {
  pib_total: Indicador;
  crecimiento_pib: Indicador;
  pib_percapita: Indicador;
  poblacion: Indicador;
  deuda_publica: Indicador;
  gini: Indicador;
}

export interface PIBMetadata {
  ultima_actualizacion: string;
  fuentes: {
    pib: Fuente;
    dane: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
  };
}

export interface PIBData {
  metadata: PIBMetadata;
  indicadores: PIBIndicadores;
  serie: PIBSerieFila[];
  historico: Record<string, number>;
}
