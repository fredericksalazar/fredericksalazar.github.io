export type Variacion = "subio" | "bajo" | "igual" | null;

export interface IndicadorActual {
  periodo: string;
  valor: number;
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

export type SemanticIndicador = "inflacion" | "tasa" | "spread";
