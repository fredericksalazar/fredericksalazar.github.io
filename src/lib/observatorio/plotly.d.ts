declare global {
  interface Window {
    Plotly?: PlotlyStatic;
  }
}

export interface PlotlyStatic {
  newPlot(
    el: HTMLElement,
    traces: unknown[],
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<HTMLElement>;
  react(
    el: HTMLElement,
    traces: unknown[],
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<HTMLElement>;
  purge(el: HTMLElement): void;
  restyle(el: HTMLElement, update: Record<string, unknown>, traceIndices?: number | number[]): Promise<HTMLElement>;
}

export {};
