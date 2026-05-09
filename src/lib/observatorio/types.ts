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
  | "subempleo";

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
