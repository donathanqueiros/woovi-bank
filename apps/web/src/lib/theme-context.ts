import { createContext } from "react";
import type { AppTheme } from "@/lib/theme";

export type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
