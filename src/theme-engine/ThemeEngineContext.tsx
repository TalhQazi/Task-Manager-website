import { createContext, useContext } from "react";
import { ThemeEngineContextValue } from "./types";

export const ThemeEngineContext = createContext<ThemeEngineContextValue | undefined>(undefined);

export function useActiveTheme(): ThemeEngineContextValue {
  const context = useContext(ThemeEngineContext);
  if (!context) {
    throw new Error("useActiveTheme must be used within a ThemeEngineProvider");
  }
  return context;
}
