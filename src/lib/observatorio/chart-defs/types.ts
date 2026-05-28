import type { DatasetName, LoadedDatasets } from "../data-client";

export interface ChartBuildResult {
  traces: unknown[];
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
  /** Texto a inyectar en `[data-chart-pregunta-target]` si el chart calcula pregunta dinámica. */
  pregunta?: string;
  /** HTML a inyectar en `[data-chart-header-slot]`. */
  headerHtml?: string;
  /** HTML a inyectar en `[data-chart-footer-slot]`. */
  footerHtml?: string;
  /** Hook ejecutado tras el render para extras (binding de toggles, etc.). */
  onMount?: (target: HTMLElement) => void;
}

export interface ChartDef {
  id: string;
  titulo: string;
  pregunta?: string;
  fuenteTexto?: string;
  datasets: readonly DatasetName[];
  height?: number;
  ariaLabel?: string;
  build(data: LoadedDatasets): ChartBuildResult | Promise<ChartBuildResult>;
}

export type { LoadedDatasets, DatasetName };
