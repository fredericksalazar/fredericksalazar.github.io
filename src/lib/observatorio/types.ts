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
    calculo_propio?: Fuente;
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
    calculo_propio?: Fuente;
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

// ───────────────────────── SALARIO MÍNIMO ─────────────────────────

export interface SalarioMinimoSerieFila {
  periodo: string;
  salario_minimo: number;
  salario_minimo_delta: number | null;
  salario_minimo_variacion: Variacion;
  variacion_pct: number | null;
  auxilio_transporte: number | null;
  total_con_auxilio: number | null;
}

export interface SalarioMinimoIndicadores {
  salario_minimo: Indicador;
  auxilio_transporte: Indicador;
  variacion_anual: Indicador;
}

export interface SalarioMinimoMetadata {
  ultima_actualizacion: string;
  fuentes: {
    salario_minimo: Fuente;
    calculo_propio: Fuente;
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

export interface SalarioMinimoData {
  metadata: SalarioMinimoMetadata;
  indicadores: SalarioMinimoIndicadores;
  serie: SalarioMinimoSerieFila[];
  historico: Record<string, number>;
  historico_auxilio: Record<string, number>;
}

// ───────────────────────────── INGRESOS ─────────────────────────────

export interface ClasesSociales {
  anio: number;
  unidad: string;
  umbrales: {
    pobreza_hasta: number;
    vulnerable_hasta: number;
    media_hasta: number;
  };
  distribucion: {
    pobreza: number;
    vulnerable: number;
    media: number;
    alta: number;
  };
}

export interface IngresosMetadata {
  ultima_actualizacion: string;
  fuentes: {
    geih: Fuente;
    clases: Fuente;
    calculo_propio: Fuente;
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

export interface IngresosData {
  metadata: IngresosMetadata;
  indicadores: {
    mediana: Indicador;
    promedio: Indicador;
    pct_hasta_1smlv: Indicador;
    pct_hasta_2smlv: Indicador;
  };
  /** Percentil ("1".."99") → ingreso laboral mensual COP. */
  percentiles: Record<string, number>;
  clases: ClasesSociales;
  smlv_referencia: { anio: number; valor: number };
}

export interface CargoSalario {
  codigo: string;
  slug: string;
  nombre: string;
  nombre_corto: string;
  mediana: number;
  p25: number;
  p75: number;
  p90: number;
  promedio: number;
  n_muestra: number;
  share_empleo_pct: number;
}

export interface SalariosCargosData {
  metadata: IngresosMetadata;
  indicadores: {
    mediana_nacional: Indicador;
  };
  smlv_referencia: { anio: number; valor: number };
  cargos: CargoSalario[];
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
    calculo_propio?: Fuente;
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
    calculo_propio?: Fuente;
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

// ───────────────────────────── EXTERNO ─────────────────────────────

export interface ExternoSerieFila {
  periodo: string;
  trm: number | null;
  trm_delta: number | null;
  trm_variacion: Variacion;
  reservas_netas: number | null;
  reservas_netas_delta: number | null;
  reservas_netas_variacion: Variacion;
  cuenta_corriente: number | null;
  cuenta_corriente_delta: number | null;
  cuenta_corriente_variacion: Variacion;
  ied: number | null;
  ied_delta: number | null;
  ied_variacion: Variacion;
  deuda_externa: number | null;
  deuda_externa_delta: number | null;
  deuda_externa_variacion: Variacion;
}

export interface ExternoIndicadores {
  trm: Indicador;
  reservas_netas: Indicador;
  cuenta_corriente: Indicador;
  ied: Indicador;
  deuda_externa: Indicador;
}

export interface ExternoMetadata {
  ultima_actualizacion: string;
  fuentes: {
    banrep_trm: Fuente;
    banco_mundial: Fuente;
    calculo_propio?: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
    granularidad: "mensual";
  };
}

export interface ExternoData {
  metadata: ExternoMetadata;
  indicadores: ExternoIndicadores;
  serie: ExternoSerieFila[];
  historico: {
    trm: Record<string, number>;
    reservas_netas: Record<string, number>;
    cuenta_corriente: Record<string, number>;
    ied: Record<string, number>;
    deuda_externa: Record<string, number>;
  };
}
// ───────────────────────────── DEMOGRAFÍA ─────────────────────────────

export interface DemografiaSerieFila {
  periodo: string;
  poblacion: number | null;
  poblacion_delta: number | null;
  poblacion_variacion: Variacion;
  crecimiento_poblacion: number | null;
  crecimiento_poblacion_delta: number | null;
  crecimiento_poblacion_variacion: Variacion;
  esperanza_vida_mujeres: number | null;
  esperanza_vida_mujeres_delta: number | null;
  esperanza_vida_mujeres_variacion: Variacion;
  esperanza_vida_hombres: number | null;
  esperanza_vida_hombres_delta: number | null;
  esperanza_vida_hombres_variacion: Variacion;
  brecha_esperanza_vida: number | null;
  brecha_esperanza_vida_delta: number | null;
  brecha_esperanza_vida_variacion: Variacion;
  gini: number | null;
  gini_delta: number | null;
  gini_variacion: Variacion;
}

export interface DemografiaIndicadores {
  poblacion: Indicador;
  esperanza_vida_mujeres: Indicador;
  esperanza_vida_hombres: Indicador;
  gini: Indicador;
}

export interface DemografiaMetadata {
  ultima_actualizacion: string;
  fuentes: {
    banco_mundial: Fuente;
    calculo_propio?: Fuente;
  };
  definiciones: Record<string, string | number>;
  cobertura: {
    primer_periodo: string;
    ultimo_periodo: string;
    total_registros: number;
    granularidad: "anual";
  };
}

export interface DemografiaData {
  metadata: DemografiaMetadata;
  indicadores: DemografiaIndicadores;
  serie: DemografiaSerieFila[];
  historico: Record<string, number>;
}

export interface CandidatoPres {
  id: string;
  nombre: string;
  partido: string;
  coalicion?: string;
  ideologia: IdeologiaBloque;
  foto?: string;
}

export type IdeologiaBloque = "izquierda" | "centro" | "derecha";

export interface ResultadoCandidato {
  id: string;
  votos: number;
  share: number;
}

export interface ElectoralAggDepto {
  cod_depto: string;
  nombre_depto: string;
  ganador_id: string;
  ganador_ideologia: IdeologiaBloque;
  votos_por_candidato: Record<string, number>;
  votos_por_ideologia: Record<IdeologiaBloque, number>;
  total_validos: number;
  total_votos: number;
  censo: number;
  participacion: number;
}

export interface PresEleccionData {
  metadata: ObservatorioMetadata;
  eleccion: { anio: number; vuelta: 1 | 2; fecha: string };
  resultados: ResultadoCandidato[];
  agregados: {
    nacional: { censo: number; total_votos: number; validos: number; nulos: number; no_marcados: number; participacion: number; abstencion: number };
    departamentos: ElectoralAggDepto[];
  };
  indicadores: {
    polarizacion: number;
    costo_votos?: { mayoria_simple: number; distancias: Record<string, number> };
  };
}

export interface PresCandidatosData {
  metadata: ObservatorioMetadata;
  candidatos: {
    "2022-1v": CandidatoPres[];
    "2022-2v": CandidatoPres[];
    "2026-1v": CandidatoPres[];
  };
}

// ──────────────────── COMPARATIVO COLOMBIA vs UZBEKISTÁN ────────────────────
// Dataset para el artículo de blog comparativo (Banco Mundial WDI). No es un
// dashboard del Observatorio, pero reutiliza su infraestructura de gráficos.

export interface ComparativoIndicador {
  /** Último año con dato real en AMBOS países (null si nunca coincide). */
  anio: number | null;
  colombia: number | null;
  oponente: number | null;
  unidad: string;
  label: string;
  /** Dirección que "gana" la categoría en el marcador. */
  mejor: "mayor" | "menor";
}

export interface ComparativoSeriePunto {
  anio: number;
  colombia: number | null;
  oponente: number | null;
}

export interface ComparativoData {
  metadata: {
    fuente: { nombre: string; url: string };
    /** País rival de la comparación (Colombia es siempre el otro lado). */
    oponente: { nombre: string; bandera: string; color: string };
    cobertura: { primer_anio: number; ultimo_anio: number };
    ultima_actualizacion: string;
    nota: string;
  };
  indicadores: Record<string, ComparativoIndicador>;
  series: Record<string, ComparativoSeriePunto[]>;
}
