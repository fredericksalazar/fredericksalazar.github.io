export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeChangeDetail {
  theme: ResolvedTheme;
  preference: ThemePreference;
}

export const THEME_STORAGE_KEY = 'theme-preference';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'auto' || value === 'light' || value === 'dark';

const prefersDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export function getPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemDark ? 'dark' : 'light';
}

export function applyTheme(
  theme: ResolvedTheme,
  preference: ThemePreference,
): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0b1120' : '#f6f8fa');
  }

  document
    .querySelectorAll<HTMLInputElement>('input[name="theme-preference"]')
    .forEach((input) => {
      input.checked = input.value === preference;
    });
}

const currentTheme = (): ResolvedTheme =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : 'light';

const applyAndNotify = (
  theme: ResolvedTheme,
  preference: ThemePreference,
): void => {
  const previous = currentTheme();
  applyTheme(theme, preference);
  if (previous !== theme && typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent<ThemeChangeDetail>('themechange', {
        detail: { theme, preference },
      }),
    );
  }
};

export function setPreference(preference: ThemePreference): void {
  const nextPreference = isPreference(preference) ? preference : 'auto';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  } catch {
    // El sitio sigue funcionando en modo automático sin persistencia.
  }
  applyAndNotify(
    resolveTheme(nextPreference, prefersDark()),
    nextPreference,
  );
}

export function onThemeChange(
  handler: (detail: ThemeChangeDetail) => void,
): () => void {
  if (typeof document === 'undefined') return () => {};
  const listener = (event: Event) => {
    handler((event as CustomEvent<ThemeChangeDetail>).detail);
  };
  document.addEventListener('themechange', listener);
  return () => document.removeEventListener('themechange', listener);
}

export function initTheme(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const preference = getPreference();
  applyTheme(resolveTheme(preference, prefersDark()), preference);

  if ((window as Window & { __themeBound?: boolean }).__themeBound) return;
  (window as Window & { __themeBound?: boolean }).__themeBound = true;

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getPreference() !== 'auto') return;
    applyAndNotify(resolveTheme('auto', media.matches), 'auto');
  };

  media.addEventListener('change', onSystemChange);

  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    const nextPreference = getPreference();
    applyAndNotify(
      resolveTheme(nextPreference, prefersDark()),
      nextPreference,
    );
  });

  const reapply = () => {
    const nextPreference = getPreference();
    applyTheme(
      resolveTheme(nextPreference, prefersDark()),
      nextPreference,
    );
  };

  document.addEventListener('astro:after-swap', reapply);
  document.addEventListener('astro:page-load', reapply);
}
