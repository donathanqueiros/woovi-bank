export const THEME_STORAGE_KEY = "woovi-bank-theme";

export const THEMES = ["slate-blue", "graphite-amber", "stone-emerald"] as const;

export type AppTheme = (typeof THEMES)[number];

export type ThemeDefinition = {
  value: AppTheme;
  label: string;
  description: string;
  primary: string;
  secondary: string;
  neutral: string;
};

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    value: "slate-blue",
    label: "Slate + Blue",
    description: "Mais confiavel, premium e orientado a operacao.",
    primary: "oklch(0.47 0.13 252)",
    secondary: "oklch(0.95 0.02 250)",
    neutral: "oklch(0.985 0.004 250)",
  },
  {
    value: "graphite-amber",
    label: "Graphite + Amber",
    description: "Mais editorial, sofisticado e caloroso.",
    primary: "oklch(0.62 0.14 74)",
    secondary: "oklch(0.95 0.03 78)",
    neutral: "oklch(0.978 0.003 80)",
  },
  {
    value: "stone-emerald",
    label: "Stone + Emerald",
    description: "Mais humano, estavel e operacional.",
    primary: "oklch(0.52 0.11 165)",
    secondary: "oklch(0.95 0.025 162)",
    neutral: "oklch(0.982 0.004 140)",
  },
];

export const DEFAULT_THEME: AppTheme = "slate-blue";

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return typeof value === "string" && THEMES.includes(value as AppTheme);
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isAppTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: AppTheme) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
