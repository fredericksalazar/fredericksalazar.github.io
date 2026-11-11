export interface ChartTheme {
  text: string;
  textSecondary: string;
  textSuccess: string;
  muted: string;
  border: string;
  grid: string;
  hoverBg: string;
  reference: string;
  serie: string;
  superficie: string;
  mapStyle: 'white-bg' | 'carto-darkmatter';
}

const FALLBACK: ChartTheme = {
  text: '#1f2328',
  textSecondary: '#424a53',
  textSuccess: '#15803d',
  muted: '#636c76',
  border: '#d0d7de',
  grid: 'rgba(208, 215, 220, 0.4)',
  hoverBg: '#ffffff',
  reference: '#64748b',
  serie: '#2563eb',
  superficie: '#ffffff',
  mapStyle: 'white-bg',
};

const readToken = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

export function getMapboxStyle(): 'white-bg' | 'carto-darkmatter' {
  if (typeof document === 'undefined') return 'white-bg';
  return document.documentElement.dataset.theme === 'dark'
    ? 'carto-darkmatter'
    : 'white-bg';
}

export function chartTheme(): ChartTheme {
  return {
    text: readToken('--color-chart-text', FALLBACK.text),
    textSecondary: readToken('--color-text-secondary', FALLBACK.textSecondary),
    textSuccess: readToken('--color-text-success', FALLBACK.textSuccess),
    muted: readToken('--color-chart-muted', FALLBACK.muted),
    border: readToken('--color-chart-axis', FALLBACK.border),
    grid: readToken('--color-chart-grid', FALLBACK.grid),
    hoverBg: readToken('--color-chart-hover-bg', FALLBACK.hoverBg),
    reference: readToken('--color-chart-reference', FALLBACK.reference),
    serie: readToken('--color-chart-serie', FALLBACK.serie),
    superficie: readToken('--color-surface', FALLBACK.superficie),
    mapStyle: getMapboxStyle(),
  };
}

/**
 * Convierte un color `#rgb`, `#rrggbb` o `rgb()/rgba()` en `rgba(r, g, b, alfa)`.
 */
export function conAlfa(color: string, alfa: number): string {
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alfa})`;
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alfa})`;
    }
  }
  const m = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alfa})`;
  }
  return c;
}
