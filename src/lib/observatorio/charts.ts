interface PeriodoRow { periodo: string; }

export const COLORS = {
  brand: "#2563eb",
  inflacion: "#dc2626",
  /** Meses con variación negativa del IPC (deflación). */
  deflacion: "#16a34a",
  inflacionLinea: "#7c3aed",
  tasa: "#2563eb",
  externo: "#ea580c",
  freno: "rgba(220, 38, 38, 0.18)",
  acelerador: "rgba(34, 197, 94, 0.20)",
  metaBanda: "rgba(34, 197, 94, 0.08)",
  metaLinea: "rgba(34, 197, 94, 0.5)",
  textPrimary: "#1f2328",
  textMuted: "#636c76",
  border: "#d0d7de",
  ideologia: {
    "izquierda": "#dc2626",
    "centro": "#16a34a",
    "derecha": "#2563eb",
  }
} as const;

export const FONT = {
  family: "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif",
  size: 12,
  color: COLORS.textPrimary,
};

export const baseLayout = (overrides: Record<string, unknown> = {}) => ({
  font: FONT,
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  margin: { l: 48, r: 24, t: 16, b: 40 },
  xaxis: {
    type: "date",
    showgrid: false,
    showline: true,
    linecolor: COLORS.border,
    tickfont: { ...FONT, size: 11, color: COLORS.textMuted },
    automargin: true,
  },
  yaxis: {
    showgrid: true,
    gridcolor: "rgba(208, 215, 220, 0.4)",
    zeroline: false,
    tickfont: { ...FONT, size: 11, color: COLORS.textMuted },
    ticksuffix: "%",
    automargin: true,
  },
  hoverlabel: {
    bgcolor: "#ffffff",
    bordercolor: COLORS.border,
    font: { ...FONT, size: 12 },
  },
  ...overrides,
});

export const periodoToISODate = (periodo: string): string => `${periodo}-01`;

/**
 * Genera líneas de referencia horizontales (máximo, mínimo y promedio) para una
 * serie, con sus labels. Devuelve `{ shapes, annotations }` para fusionar en
 * `baseLayout({ shapes, annotations })`. Ignora valores `null`.
 */
export const minMaxAvgLines = (
  y: (number | null)[],
  opts: {
    suffix?: string;
    decimals?: number;
    /** Muestra u oculta el texto del promedio (la línea punteada siempre se dibuja). */
    avgLabel?: boolean;
    /** Lado del texto del promedio. Default "right". Usa "left" para dejar libre el tramo reciente. */
    avgAnchor?: "left" | "right";
  } = {},
): { shapes: unknown[]; annotations: unknown[] } => {
  const vals = y.filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return { shapes: [], annotations: [] };

  const suffix = opts.suffix ?? "";
  const dec = opts.decimals ?? (Math.abs(Math.max(...vals)) >= 1000 ? 0 : 1);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  const showAvgLabel = opts.avgLabel ?? true;
  const refs = [
    { value: max, label: "Máx", color: "#dc2626", anchor: "left" as const, labeled: true },
    { value: avg, label: "Promedio", color: "#64748b", anchor: opts.avgAnchor ?? "right", labeled: showAvgLabel },
    { value: min, label: "Mín", color: "#16a34a", anchor: "left" as const, labeled: true },
  ];

  const shapes = refs.map((r) => ({
    type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: r.value, y1: r.value,
    line: { color: r.color, width: 1.5, dash: "dash" }, layer: "above",
  }));

  const fmt = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const annotations = refs.filter((r) => r.labeled).map((r) => ({
    xref: "paper", yref: "y",
    x: r.anchor === "right" ? 1 : 0, xanchor: r.anchor === "right" ? "right" : "left",
    y: r.value, yanchor: "bottom",
    text: `${r.label} · ${fmt(r.value)}${suffix}`,
    showarrow: false,
    font: { size: 10, color: r.color, family: "system-ui, sans-serif" },
    bgcolor: "rgba(255,255,255,0.9)", bordercolor: "#cbd5e1", borderwidth: 1, borderpad: 3,
  }));

  return { shapes, annotations };
};

export const extractSerie = <T extends PeriodoRow>(
  serie: T[],
  field: keyof T,
): { x: string[]; y: (number | null)[] } => ({
  x: serie.map((r) => periodoToISODate(r.periodo)),
  y: serie.map((r) => {
    const v = r[field];
    return typeof v === "number" ? v : null;
  }),
});

export interface LineBarToggleOpts {
  x: string[];
  y: (number | null)[];
  name: string;
  color: string;
  /** Relleno bajo la línea (modo línea). Default azul tenue. */
  fillcolor?: string;
  hovertemplate: string;
  /** Forma de la línea (usa "hv" para escalones tipo tasa de política). */
  lineShape?: "linear" | "hv";
  /** Sufijo de las etiquetas de mín/máx/promedio. Default "%". */
  suffix?: string;
  decimals?: number;
  /** Shapes propios del chart (bandas, metas) que se fusionan con las líneas de referencia. */
  baseShapes?: unknown[];
  baseAnnotations?: unknown[];
  layoutOverrides?: Record<string, unknown>;
}

/**
 * Construye un chart con líneas de referencia (mín/máx/promedio) y un toggle
 * Línea ↔ Barras en el header. Devuelve `{ traces, layout, headerHtml, onMount }`
 * listo para retornar desde `build()` de un ChartDef. El toggle re-renderiza
 * con `Plotly.react` reutilizando el mismo layout (las referencias persisten).
 */
export function lineBarToggle(opts: LineBarToggleOpts) {
  const suffix = opts.suffix ?? "%";
  const refs = minMaxAvgLines(opts.y, { suffix, decimals: opts.decimals ?? 1, avgAnchor: "left" });
  const shapes = [...(opts.baseShapes ?? []), ...refs.shapes];
  const annotations = [...(opts.baseAnnotations ?? []), ...refs.annotations];

  const lineTrace = {
    name: opts.name,
    x: opts.x,
    y: opts.y,
    type: "scatter",
    mode: "lines",
    line: { color: opts.color, width: 2.2, shape: opts.lineShape ?? "linear" },
    fill: "tozeroy",
    fillcolor: opts.fillcolor ?? "rgba(37, 99, 235, 0.06)",
    hovertemplate: opts.hovertemplate,
  };
  const barTrace = {
    name: opts.name,
    x: opts.x,
    y: opts.y,
    type: "bar",
    marker: { color: opts.color },
    hovertemplate: opts.hovertemplate,
  };

  const layout = baseLayout({ ...(opts.layoutOverrides ?? {}), shapes, annotations });

  const headerHtml = `
    <div class="chart-toggle" role="group" aria-label="Tipo de gráfico">
      <button type="button" class="chart-toggle__btn is-active" data-chart-type="line" aria-pressed="true">Línea</button>
      <button type="button" class="chart-toggle__btn" data-chart-type="bar" aria-pressed="false">Barras</button>
    </div>`;

  const onMount = (target: HTMLElement) => {
    const root = target.closest<HTMLElement>("[data-chart-root]");
    const group = root?.querySelector<HTMLElement>(".chart-toggle");
    if (!group || group.dataset.bound === "true") return;
    group.dataset.bound = "true";
    const btns = Array.from(group.querySelectorAll<HTMLButtonElement>(".chart-toggle__btn"));
    group.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".chart-toggle__btn");
      if (!btn || !window.Plotly) return;
      const isBar = btn.dataset.chartType === "bar";
      for (const b of btns) {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      }
      window.Plotly.react(target, [isBar ? barTrace : lineTrace], layout);
    });
  };

  return { traces: [lineTrace], layout, headerHtml, onMount };
}
