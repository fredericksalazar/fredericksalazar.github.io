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

// ──────────────────────────────────────────────────────────────────────
// Líneas de referencia (UI-10, DESIGN-SYSTEM 6.4)
// ──────────────────────────────────────────────────────────────────────

/** Referencia horizontal de contexto (promedio, máximo, mínimo, meta…). */
export interface ReferenceLine {
  /** Texto antes del valor: "Máx", "Mín", "Prom", "Meta BanRep"… */
  etiqueta: string;
  valor: number;
  /** Por defecto el de DESIGN-SYSTEM 6.4; obligatorio en referencias semánticas. */
  color?: string;
  /** Por defecto discontinua. */
  estilo?: "discontinua" | "punteada";
  /** Decimales propios (referencias fijas como la meta se ven igual en todo gráfico). */
  decimales?: number;
}

export interface LineasReferenciaOpts {
  maximo?: boolean;
  minimo?: boolean;
  promedio?: boolean;
  /** Referencias adicionales (p. ej. `META_BANREP`). */
  extra?: ReferenceLine[];
  /** Formateador del valor. Default: es-CO con `decimales` y `sufijo`. */
  formato?: (v: number) => string;
  sufijo?: string;
  decimales?: number;
  /** Rango visible del eje Y. Obligatorio si la receta fija `yaxis.range`. */
  rangoY?: [number, number];
}

/**
 * Máx, Mín y Prom (DESIGN-SYSTEM 6.4): gris neutro para las tres, sin sugerir
 * que un extremo es bueno o malo; se distinguen por etiqueta y trazo
 * (máx/mín discontinuas, promedio punteado).
 */
const REF_GRIS = "#64748b";
/** Tinta de texto para etiquetas combinadas (el texto no lleva color de serie). */
const REF_TEXTO_COMBINADO = "#475569";
/** Fracción del rango visible por debajo de la cual dos etiquetas se combinan. */
const UMBRAL_COMBINAR = 0.06;

/**
 * Meta de inflación del Banco de la República. Definición ÚNICA (ARQ-19):
 * verde de "zona sana" y trazo punteado para no confundirla con el Mín.
 */
export const META_BANREP: ReferenceLine = {
  etiqueta: "Meta BanRep",
  valor: 3,
  color: "#16a34a",
  estilo: "punteada",
  decimales: 0,
};

/**
 * Genera las líneas de referencia de un gráfico: máximo, promedio y mínimo de
 * la serie más las referencias `extra`. Todas las etiquetas van a la IZQUIERDA
 * (no tapan el tramo más reciente) con formato `Etiqueta · valor`; las que
 * quedarían a menos del 6 % del rango visible se combinan en una sola.
 * Devuelve `{ shapes, annotations }` para fusionar en `baseLayout()`.
 */
export function lineasReferencia(
  valores: (number | null)[],
  opts: LineasReferenciaOpts = {},
): { shapes: unknown[]; annotations: unknown[] } {
  const vals = valores.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const refs: ReferenceLine[] = [];

  if (vals.length > 0) {
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (opts.maximo ?? true) refs.push({ etiqueta: "Máx", valor: max });
    if (opts.promedio ?? true) refs.push({ etiqueta: "Prom", valor: avg, estilo: "punteada" });
    if (opts.minimo ?? true) refs.push({ etiqueta: "Mín", valor: min });
  }
  refs.push(...(opts.extra ?? []));
  if (refs.length === 0) return { shapes: [], annotations: [] };

  const sufijo = opts.sufijo ?? "";
  const magnitud = Math.max(...vals.map(Math.abs), ...refs.map((r) => Math.abs(r.valor)));
  const dec = opts.decimales ?? (magnitud >= 1000 ? 0 : 1);
  const formatoDec = (v: number, d: number) =>
    `${v.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d })}${sufijo}`;
  const formatoBase = opts.formato ?? ((v: number) => formatoDec(v, dec));
  const formatoRef = (r: ReferenceLine) =>
    r.decimales !== undefined ? formatoDec(r.valor, r.decimales) : formatoBase(r.valor);
  const colorDe = (r: ReferenceLine) => r.color ?? REF_GRIS;

  const shapes = refs.map((r) => ({
    type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: r.valor, y1: r.valor,
    line: { color: colorDe(r), width: 1.5, dash: r.estilo === "punteada" ? "dot" : "dash" },
    layer: "above",
  }));

  // Agrupa referencias cuya distancia vertical es menor al umbral del rango visible.
  const todos = [...vals, ...refs.map((r) => r.valor)];
  const rango = opts.rangoY
    ? Math.abs(opts.rangoY[1] - opts.rangoY[0])
    : Math.max(...todos) - Math.min(...todos);
  const ordenadas = [...refs].sort((a, b) => b.valor - a.valor);
  const grupos: ReferenceLine[][] = [];
  for (const r of ordenadas) {
    const actual = grupos[grupos.length - 1];
    const previa = actual?.[actual.length - 1];
    if (previa && (rango === 0 || Math.abs(previa.valor - r.valor) < rango * UMBRAL_COMBINAR)) {
      actual.push(r);
    } else {
      grupos.push([r]);
    }
  }

  const annotations = grupos.map((grupo) => ({
    xref: "paper", yref: "y", x: 0, xanchor: "left",
    y: grupo[0].valor, yanchor: "bottom",
    text: grupo.map((r) => `${r.etiqueta} · ${formatoRef(r)}`).join(" · "),
    showarrow: false,
    font: { size: 10, color: grupo.length === 1 ? colorDe(grupo[0]) : REF_TEXTO_COMBINADO, family: FONT.family },
    bgcolor: "rgba(255,255,255,0.9)", bordercolor: "#cbd5e1", borderwidth: 1, borderpad: 3,
  }));

  return { shapes, annotations };
}

// ──────────────────────────────────────────────────────────────────────
// Vistas Línea ↔ Barras (UI-08)
// ──────────────────────────────────────────────────────────────────────

/** Traza estándar de una serie temporal: línea de 2,2 px con relleno tenue al eje. */
export function trazaLinea(opts: {
  x: string[];
  y: (number | null)[];
  name: string;
  color: string;
  hovertemplate: string;
  /** Relleno bajo la línea. Default: azul de marca al 6 %. */
  fillcolor?: string;
  /** "hv" para series escalonadas, como la tasa de política monetaria. */
  lineShape?: "linear" | "hv";
}): Record<string, unknown> {
  return {
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
}

type Traza = Record<string, unknown> & {
  type?: string;
  mode?: string;
  fill?: string;
  line?: { color?: string; width?: number };
  marker?: { color?: unknown };
};

const esScatter = (t: Traza) => (t.type ?? "scatter") === "scatter";
/** Traza que solo dibuja un área entre series o una guía invisible. */
const esAuxiliar = (t: Traza) => esScatter(t) && (t.fill === "tonexty" || t.line?.width === 0);
const esLinea = (t: Traza) =>
  esScatter(t) && typeof t.mode === "string" && t.mode.includes("lines") && !esAuxiliar(t);

/** Campos que una serie conserva al pasar de línea a barras. */
const CAMPOS_CONSERVADOS = [
  "x", "y", "name", "customdata", "hovertemplate", "hoverinfo", "xaxis", "yaxis",
  "text", "textposition", "texttemplate", "showlegend", "legendgroup", "visible",
] as const;

/**
 * Aplica una vista a las trazas de un gráfico. En "barras": cada serie de línea
 * visible pasa a barras (conservando datos, nombre, hover y eje, con el color
 * de sus marcadores si es por punto o el de su línea), las áreas auxiliares se
 * ocultan y las barras existentes no cambian. En "linea" devuelve lo original.
 * Los `null` se conservan: en barras quedan como huecos, no como ceros.
 */
export function aVista(
  trazas: unknown[],
  vista: "linea" | "barras",
  layout: Record<string, unknown>,
): { trazas: unknown[]; layout: Record<string, unknown> } {
  if (vista === "linea") return { trazas, layout };

  const convertidas = (trazas as Traza[]).map((t) => {
    if (esAuxiliar(t)) return { ...t, visible: false };
    // Copia: aVista nunca muta las trazas de la vista de línea.
    if (!esLinea(t)) return { ...t };
    const barra: Record<string, unknown> = { type: "bar" };
    for (const campo of CAMPOS_CONSERVADOS) {
      if (t[campo] !== undefined) barra[campo] = t[campo];
    }
    const colorPorPunto = Array.isArray(t.marker?.color) ? t.marker!.color : undefined;
    barra.marker = { color: colorPorPunto ?? t.line?.color ?? t.marker?.color ?? COLORS.brand };
    return barra;
  });

  const barrasVisibles = convertidas.filter(
    (t) => (t as Traza).type === "bar" && (t as Traza).visible !== false,
  ) as Traza[];
  if (barrasVisibles.length < 2 || layout.barmode !== undefined) {
    return { trazas: convertidas, layout };
  }
  // Varias series en barras: lado a lado, también entre ejes distintos (offsetgroup).
  barrasVisibles.forEach((t, i) => { t.offsetgroup = String(i); });
  return { trazas: convertidas, layout: { ...layout, barmode: "group" } };
}

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
