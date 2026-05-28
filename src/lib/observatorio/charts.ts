interface PeriodoRow { periodo: string; }

export const COLORS = {
  inflacion: "#dc2626",
  tasa: "#2563eb",
  externo: "#ea580c",
  freno: "rgba(220, 38, 38, 0.18)",
  acelerador: "rgba(34, 197, 94, 0.20)",
  metaBanda: "rgba(34, 197, 94, 0.08)",
  metaLinea: "rgba(34, 197, 94, 0.5)",
  textPrimary: "#1f2328",
  textMuted: "#636c76",
  border: "#d0d7de",
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
