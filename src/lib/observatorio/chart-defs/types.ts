import type { DatasetName, LoadedDatasets } from "../data-client";

export interface ChartBuildResult {
  traces: unknown[];
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
  /**
   * Pregunta calculada en runtime: reemplaza el texto de `.chart-card__question`.
   * Requiere que el def traiga `pregunta` estática (si no, el nodo no existe) y
   * que el chart no se use en modo `embedded`, donde el contenedor no la pinta.
   */
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
