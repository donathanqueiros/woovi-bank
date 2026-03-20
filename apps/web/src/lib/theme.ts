export const THEME_STORAGE_KEY = "subli-bank-theme";
export const COLOR_MODE_STORAGE_KEY = "subli-bank-color-mode";

export const THEMES = ["slate-blue", "graphite-amber", "stone-emerald"] as const;
export const COLOR_MODES = ["light", "dark"] as const;

export type AppTheme = (typeof THEMES)[number];
export type ColorMode = (typeof COLOR_MODES)[number];

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
export const DEFAULT_MODE: ColorMode = "light";

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return typeof value === "string" && THEMES.includes(value as AppTheme);
}

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return typeof value === "string" && COLOR_MODES.includes(value as ColorMode);
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

export function getStoredColorMode() {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }

  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function applyColorMode(mode: ColorMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.mode = mode;
  document.documentElement.style.colorScheme = mode;
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

export function persistColorMode(mode: ColorMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

export function initializeTheme() {
  const theme = getStoredTheme();
  const mode = getStoredColorMode();
  applyTheme(theme);
  applyColorMode(mode);
  return { theme, mode };
}
