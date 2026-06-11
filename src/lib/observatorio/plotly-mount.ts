import type { PlotlyStatic } from "./plotly";

export interface PlotlySpec {
  traces: unknown[];
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export type ChartInit = (signal: AbortSignal) => Promise<void> | void;

const DEFAULT_CONFIG = { responsive: true, displayModeBar: false, locale: "es" };

const mounted = new Set<string>();
const controllers = new Map<string, AbortController>();

function getPlotly(): Promise<PlotlyStatic> {
  if (window.Plotly) {
    return Promise.resolve(window.Plotly);
  }
  if (typeof (window as any).loadPlotly === "function") {
    return (window as any).loadPlotly();
  }
  return new Promise((resolve) => {
    window.addEventListener(
      "plotly:loaded",
      () => resolve(window.Plotly!),
      { once: true },
    );
  });
}

function setState(elementId: string, state: "loading" | "ready" | "error", message?: string) {
  const target = document.getElementById(elementId);
  if (!target) return;
  const root = target.closest<HTMLElement>("[data-chart-root]") ?? target;
  root.dataset.state = state;
  target.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  if (state === "error" && message) {
    const slot = root.querySelector<HTMLElement>("[data-chart-error-message]");
    if (slot) slot.textContent = message;
  }
}

export async function mountPlotly(elementId: string, spec: PlotlySpec): Promise<void> {
  const target = document.getElementById(elementId);
  if (!target) return;
  const Plotly = await getPlotly();
  await Plotly.newPlot(target, spec.traces, spec.layout, spec.config ?? DEFAULT_CONFIG);
  setState(elementId, "ready");
  mounted.add(elementId);
}

export function purgeChart(elementId: string): void {
  const target = document.getElementById(elementId);
  if (target && window.Plotly) window.Plotly.purge(target);
  mounted.delete(elementId);
}

function abortChart(elementId: string) {
  const c = controllers.get(elementId);
  if (c) {
    c.abort();
    controllers.delete(elementId);
  }
}

export function registerChart(elementId: string, init: ChartInit): void {
  const run = () => {
    const el = document.getElementById(elementId);
    if (!el || mounted.has(elementId)) return;
    const existing = controllers.get(elementId);
    if (existing && !existing.signal.aborted) return;
    const controller = new AbortController();
    controllers.set(elementId, controller);
    setState(elementId, "loading");
    Promise.resolve(init(controller.signal))
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.name === "AbortError") return;
        console.error(`[chart ${elementId}] init failed:`, err);
        setState(elementId, "error", err?.message ?? "No se pudo cargar el gráfico");
      });
  };

  const retry = (e: Event) => {
    const btn = e.target as HTMLElement;
    if (!btn.matches?.("[data-chart-retry]")) return;
    const root = btn.closest<HTMLElement>("[data-chart-root]");
    if (!root) return;
    const canvas = root.querySelector<HTMLElement>(".plotly-chart__canvas");
    if (canvas?.id === elementId) run();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  document.addEventListener("astro:page-load", run);
  document.addEventListener("astro:before-swap", () => {
    abortChart(elementId);
    purgeChart(elementId);
  });
  document.addEventListener("click", retry);
}
