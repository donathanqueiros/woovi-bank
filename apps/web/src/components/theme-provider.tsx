import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "@/lib/theme-context";
import {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  persistTheme,
  type AppTheme,
} from "@/lib/theme";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<AppTheme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { DEFAULT_THEME };
