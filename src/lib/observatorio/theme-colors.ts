export interface ChartTheme {
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  grid: string;
  hoverBg: string;
  reference: string;
  mapStyle: 'white-bg' | 'carto-darkmatter';
}

const FALLBACK: ChartTheme = {
  text: '#1f2328',
  textSecondary: '#424a53',
  muted: '#636c76',
  border: '#d0d7de',
  grid: 'rgba(208, 215, 220, 0.4)',
  hoverBg: '#ffffff',
  reference: '#64748b',
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
    muted: readToken('--color-chart-muted', FALLBACK.muted),
    border: readToken('--color-chart-axis', FALLBACK.border),
    grid: readToken('--color-chart-grid', FALLBACK.grid),
    hoverBg: readToken('--color-chart-hover-bg', FALLBACK.hoverBg),
    reference: readToken('--color-chart-reference', FALLBACK.reference),
    mapStyle: getMapboxStyle(),
  };
}
