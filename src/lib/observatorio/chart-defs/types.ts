import type { DatasetName, LoadedDatasets } from "../data-client";

/** Modo de presentación de un gráfico que admite el cambio Línea ↔ Barras. */
export type Vista = "linea" | "barras";

/**
 * Contexto que `Chart.astro` entrega a `onMount`. Las recetas con controles
 * propios (p. ej. "Mostrar inflación", "Color por presidente") redibujan SOLO
 * con `render`, que aplica la vista elegida por el visitante; nunca llaman a
 * `window.Plotly.react`/`restyle` directamente.
 */
export interface ChartContext {
  /** Vista actual del gráfico. */
  vista(): Vista;
  /** Redibuja con estas trazas (y layout, si se pasa) aplicando la vista actual. */
  render(trazas: unknown[], layout?: Record<string, unknown>): void;
  /** Suscribe a la receta a los cambios de vista. */
  alCambiarVista(fn: (vista: Vista) => void): void;
}

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
  onMount?: (target: HTMLElement, ctx: ChartContext) => void;
}

export interface ChartDef {
  id: string;
  titulo: string;
  pregunta?: string;
  fuenteTexto?: string;
  datasets: readonly DatasetName[];
  height?: number;
  ariaLabel?: string;
  /**
   * Vistas que admite el gráfico. Si incluye "barras", Chart.astro muestra el
   * control Línea | Barras. La primera vista es la inicial (UI-08).
   */
  vistas?: readonly Vista[];
  build(data: LoadedDatasets): ChartBuildResult | Promise<ChartBuildResult>;
}

export type { LoadedDatasets, DatasetName };
