import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { employeeApiFetch } from "@/Employee/lib/api";
import { apiFetch } from "../lib/manger/api";
import { getAuthState } from "../lib/auth";
import { apiFetch as adminApiFetch } from "../lib/admin/apiClient";

export interface UITheme {
  theme: "neon-tech" | "metallic-elite" | "executive-black" | "dark-minimal" | "high-contrast" | "energy-mode";
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  panelColors: {
    headerBackground: string;
    headerOverlayColor: string;
    headerOverlayOpacity: number;
    sidebarBackground: string;
    dashboardBackground: string;
    sidebarIconColor: string;
    dashboardIconColor: string;
    sidebarTextColor: string;
    dashboardCardBackground: string;
    dashboardTextColor: string;
  };
  glowIntensity: number;
  animationSpeed: "slow" | "normal" | "fast";
  cardStyle: "glass" | "neon" | "metallic";
  layoutDensity: "compact" | "comfortable" | "spacious";
  animationSettings: {
    enabled: boolean;
    reduceMotion: boolean;
    hoverEffects: boolean;
    clickEffects: boolean;
  };
}

interface ThemeContextType {
  uiTheme: UITheme;
  updateTheme: (updates: Partial<UITheme>) => void;
  resetTheme: () => void;
  applyTheme: () => void;
  applyPreset: (presetName: string) => void;
  saveToBackend: (theme?: UITheme) => Promise<void>;
  loadFromBackend: () => Promise<void>;
}

const defaultTheme: UITheme = {
  theme: "dark-minimal",
  customColors: {
    primary: "#133767",
    secondary: "#3b82f6",
    accent: "#8b5cf6"
  },
  panelColors: {
    headerBackground: "#133767",
    headerOverlayColor: "#000000",
    headerOverlayOpacity: 30,
    sidebarBackground: "#0B1323",
    dashboardBackground: "#e6f0ff",
    sidebarIconColor: "#ffffff",
    dashboardIconColor: "#133767",
    sidebarTextColor: "#ffffff",
    dashboardCardBackground: "#ffffff",
    dashboardTextColor: "#1e293b",
  },
  glowIntensity: 50,
  animationSpeed: "normal",
  cardStyle: "glass",
  layoutDensity: "comfortable",
  animationSettings: {
    enabled: true,
    reduceMotion: false,
    hoverEffects: true,
    clickEffects: true
  }
};

// Theme Presets
export const themePresets: Record<string, UITheme> = {
  "ocean-professional": {
    theme: "dark-minimal",
    customColors: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      accent: "#38bdf8"
    },
    panelColors: {
      headerBackground: "#0c4a6e",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 20,
      sidebarBackground: "#e0f2fe",
      dashboardBackground: "#f0f9ff",
      sidebarIconColor: "#0284c7",
      dashboardIconColor: "#0284c7",
      sidebarTextColor: "#0f172a",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 40,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "midnight-elegance": {
    theme: "dark-minimal",
    customColors: {
      primary: "#7c3aed",
      secondary: "#a855f7",
      accent: "#c084fc"
    },
    panelColors: {
      headerBackground: "#1e1b4b",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 30,
      sidebarBackground: "#0f0f23",
      dashboardBackground: "#1a1a2e",
      sidebarIconColor: "#a855f7",
      dashboardIconColor: "#7c3aed",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#1e1b4b",
      dashboardTextColor: "#ffffff",
    },
    glowIntensity: 60,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "emerald-fresh": {
    theme: "dark-minimal",
    customColors: {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399"
    },
    panelColors: {
      headerBackground: "#064e3b",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 25,
      sidebarBackground: "#065f46",
      dashboardBackground: "#ecfdf5",
      sidebarIconColor: "#34d399",
      dashboardIconColor: "#059669",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 45,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "sunset-blaze": {
    theme: "dark-minimal",
    customColors: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fb923c"
    },
    panelColors: {
      headerBackground: "#7c2d12",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 25,
      sidebarBackground: "#431407",
      dashboardBackground: "#fff7ed",
      sidebarIconColor: "#fed7aa",
      dashboardIconColor: "#ea580c",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 50,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "royal-gold": {
    theme: "dark-minimal",
    customColors: {
      primary: "#fbbf24",
      secondary: "#f59e0b",
      accent: "#fcd34d"
    },
    panelColors: {
      headerBackground: "#1e1b4b",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 20,
      sidebarBackground: "#312e81",
      dashboardBackground: "#fef3c7",
      sidebarIconColor: "#fbbf24",
      dashboardIconColor: "#f59e0b",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 55,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "frost-mint": {
    theme: "dark-minimal",
    customColors: {
      primary: "#06b6d4",
      secondary: "#0891b2",
      accent: "#22d3ee"
    },
    panelColors: {
      headerBackground: "#164e63",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 22,
      sidebarBackground: "#155e75",
      dashboardBackground: "#ecfeff",
      sidebarIconColor: "#22d3ee",
      dashboardIconColor: "#0891b2",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 42,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "lavender-dream": {
    theme: "dark-minimal",
    customColors: {
      primary: "#a855f7",
      secondary: "#9333ea",
      accent: "#c084fc"
    },
    panelColors: {
      headerBackground: "#6b21a8",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 20,
      sidebarBackground: "#581c87",
      dashboardBackground: "#faf5ff",
      sidebarIconColor: "#c084fc",
      dashboardIconColor: "#9333ea",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 48,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "rose-blush": {
    theme: "dark-minimal",
    customColors: {
      primary: "#ec4899",
      secondary: "#db2777",
      accent: "#f472b6"
    },
    panelColors: {
      headerBackground: "#9d174d",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 25,
      sidebarBackground: "#831843",
      dashboardBackground: "#fdf2f8",
      sidebarIconColor: "#f472b6",
      dashboardIconColor: "#db2777",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 45,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  },
  "slate-professional": {
    theme: "dark-minimal",
    customColors: {
      primary: "#64748b",
      secondary: "#475569",
      accent: "#94a3b8"
    },
    panelColors: {
      headerBackground: "#334155",
      headerOverlayColor: "#000000",
      headerOverlayOpacity: 20,
      sidebarBackground: "#1e293b",
      dashboardBackground: "#f8fafc",
      sidebarIconColor: "#94a3b8",
      dashboardIconColor: "#475569",
      sidebarTextColor: "#ffffff",
      dashboardCardBackground: "#ffffff",
      dashboardTextColor: "#000000",
    },
    glowIntensity: 35,
    animationSpeed: "normal",
    cardStyle: "glass",
    layoutDensity: "comfortable",
    animationSettings: {
      enabled: true,
      reduceMotion: false,
      hoverEffects: true,
      clickEffects: true
    }
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getThemeStorageKey = () => {
  try {
    // Try Manager auth first
    const managerRaw = localStorage.getItem("taskflow_auth");
    if (managerRaw) {
      const parsed = JSON.parse(managerRaw);
      const username = typeof parsed?.username === "string" ? parsed.username.trim() : "";
      if (username) return `ui-theme:manager:${username}`;
    }
    // Fallback to Employee auth
    const employeeRaw = localStorage.getItem("employee_auth");
    if (employeeRaw) {
      const parsed = JSON.parse(employeeRaw);
      const username = typeof parsed?.username === "string" ? parsed.username.trim() : "";
      if (username) return `ui-theme:employee:${username}`;
    }
    return "ui-theme";
  } catch {
    return "ui-theme";
  }
};

// Helper function to apply theme to DOM
const applyThemeToDOM = (theme: UITheme) => {
  const root = document.documentElement;

  console.log("Applying theme:", theme.theme, theme);

  // Apply custom colors
  root.style.setProperty("--tb-primary", theme.customColors.primary);
  root.style.setProperty("--tb-secondary", theme.customColors.secondary);
  root.style.setProperty("--tb-accent", theme.customColors.accent);

  // Apply panel colors
  const panelColors = {
    ...defaultTheme.panelColors,
    ...(theme.panelColors || ({} as UITheme["panelColors"])),
  };

  root.style.setProperty("--tb-header-bg", panelColors.headerBackground);
  root.style.setProperty("--tb-header-overlay-color", panelColors.headerOverlayColor);
  root.style.setProperty(
    "--tb-header-overlay-opacity",
    `${Math.max(0, Math.min(100, panelColors.headerOverlayOpacity)) / 100}`,
  );
  root.style.setProperty("--tb-sidebar-bg", panelColors.sidebarBackground);
  console.log("Sidebar background set to:", panelColors.sidebarBackground);
  root.style.setProperty("--tb-dashboard-bg", panelColors.dashboardBackground);
  root.style.setProperty("--tb-sidebar-icon-color", panelColors.sidebarIconColor);
  root.style.setProperty("--tb-dashboard-icon-color", panelColors.dashboardIconColor);
  root.style.setProperty("--tb-sidebar-text-color", panelColors.sidebarTextColor);
  // Force sidebar text color to white for Sunset Blaze theme
  if (panelColors.sidebarBackground === "#431407") {
    root.style.setProperty("--tb-sidebar-text-color", "#ffffff");
    console.log("Forced sidebar text color to white for Sunset Blaze theme");
  }
  console.log("Sidebar text color set to:", panelColors.sidebarTextColor);
  root.style.setProperty("--tb-dashboard-card-bg", panelColors.dashboardCardBackground);
  root.style.setProperty("--tb-dashboard-text-color", panelColors.dashboardTextColor || "#1e293b");
  
  // Also set Tailwind CSS variables for consistent text colors across all pages
  root.style.setProperty("--foreground", panelColors.dashboardTextColor || "#1e293b");
  root.style.setProperty("--card-foreground", panelColors.dashboardTextColor || "#1e293b");
  root.style.setProperty("--muted-foreground", panelColors.dashboardTextColor === "#000000" ? "#64748b" : "#94a3b8");
  
  // Also update Tailwind --card variable to match TaskBlaster card background
  // Convert hex to HSL format for Tailwind
  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#')) {
      r = parseInt(hex.slice(1, 3), 16) / 255;
      g = parseInt(hex.slice(3, 5), 16) / 255;
      b = parseInt(hex.slice(5, 7), 16) / 255;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  root.style.setProperty("--card", hexToHSL(panelColors.dashboardCardBackground));

  // Apply glow intensity
  root.style.setProperty("--tb-glow-intensity", `${theme.glowIntensity}%`);

  // Apply animation speed
  const speedMap = {
    slow: "0.5s",
    normal: "0.3s",
    fast: "0.15s"
  };
  root.style.setProperty("--tb-animation-speed", speedMap[theme.animationSpeed]);

  // Apply card style
  root.style.setProperty("--tb-card-style", theme.cardStyle);
  root.setAttribute("data-tb-card-style", theme.cardStyle);

  // Apply layout density
  const densityMap = {
    compact: "0.75rem",
    comfortable: "1rem",
    spacious: "1.5rem"
  };
  root.style.setProperty("--tb-spacing", densityMap[theme.layoutDensity]);

  // Apply animation settings
  root.style.setProperty("--tb-animations-enabled", theme.animationSettings.enabled ? "1" : "0");
  root.setAttribute("data-tb-animations-enabled", theme.animationSettings.enabled ? "1" : "0");
  root.setAttribute("data-tb-reduce-motion", theme.animationSettings.reduceMotion ? "1" : "0");
  root.setAttribute("data-tb-hover-effects", theme.animationSettings.hoverEffects ? "1" : "0");
  root.setAttribute("data-tb-click-effects", theme.animationSettings.clickEffects ? "1" : "0");

  // Apply theme class to body
  document.body.className = `tb-theme-${theme.theme}`;

  console.log("Theme applied. Body class:", document.body.className);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [uiTheme, setUITheme] = useState<UITheme>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(getThemeStorageKey());
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        const merged: UITheme = {
          ...defaultTheme,
          ...parsed,
          customColors: { ...defaultTheme.customColors, ...(parsed?.customColors || {}) },
          panelColors: { ...defaultTheme.panelColors, ...(parsed?.panelColors || {}) },
          animationSettings: { ...defaultTheme.animationSettings, ...(parsed?.animationSettings || {}) },
        };
        setUITheme(merged);
        applyThemeToDOM(merged);
      } catch (e) {
        console.error("Failed to parse saved theme:", e);
        applyThemeToDOM(defaultTheme);
      }
    } else {
      applyThemeToDOM(defaultTheme);
    }
    setIsLoaded(true);
  }, []);

  // Load from backend after initial mount (per-user, authoritative)
  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        // Use appropriate API fetch based on auth type
        const auth = getAuthState();
        let apiFetchFn;
        if (auth.isAuthenticated && (auth.role === "admin" || auth.role === "super-admin")) {
          apiFetchFn = adminApiFetch;
        } else if (auth.isAuthenticated && auth.role === "manager") {
          apiFetchFn = apiFetch;
        } else {
          apiFetchFn = employeeApiFetch;
        }
        const data = await apiFetchFn<{ item: UITheme }>("/api/ui-preferences");
        if (data.item) {
          const merged: UITheme = {
            ...defaultTheme,
            ...data.item,
            customColors: { ...defaultTheme.customColors, ...(data.item as any)?.customColors },
            panelColors: { ...defaultTheme.panelColors, ...(data.item as any)?.panelColors },
            animationSettings: { ...defaultTheme.animationSettings, ...(data.item as any)?.animationSettings },
          };
          setUITheme(merged);
          localStorage.setItem(getThemeStorageKey(), JSON.stringify(merged));
          applyThemeToDOM(merged);
        }
      } catch (error) {
        console.error("Failed to load preferences from backend:", error);
      }
    })();
  }, [isLoaded]);

  // Apply theme to CSS variables
  useEffect(() => {
    if (isLoaded) {
      applyThemeToDOM(uiTheme);
    }
  }, [uiTheme, isLoaded]);

  const updateTheme = (updates: Partial<UITheme>) => {
    const newTheme = { ...uiTheme, ...updates };
    setUITheme(newTheme);
    localStorage.setItem(getThemeStorageKey(), JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setUITheme(defaultTheme);
    localStorage.setItem(getThemeStorageKey(), JSON.stringify(defaultTheme));
  };

  const applyPreset = (presetName: string) => {
    const preset = themePresets[presetName];
    if (preset) {
      setUITheme(preset);
      localStorage.setItem(getThemeStorageKey(), JSON.stringify(preset));
      applyThemeToDOM(preset);
    }
  };

  const applyTheme = () => {
    applyThemeToDOM(uiTheme);
  };

  const saveToBackend = async (theme: UITheme = uiTheme) => {
    try {
      await employeeApiFetch("/api/ui-preferences", {
        method: "PUT",
        body: JSON.stringify(theme),
      });
    } catch (error) {
      console.error("Failed to save preferences to backend:", error);
      throw error;
    }
  };

  const loadFromBackend = async () => {
    try {
      const auth = getAuthState();
      let apiFetchFn;
      if (auth.isAuthenticated && (auth.role === "admin" || auth.role === "super-admin")) {
        apiFetchFn = adminApiFetch;
      } else if (auth.isAuthenticated && auth.role === "manager") {
        apiFetchFn = apiFetch;
      } else {
        apiFetchFn = employeeApiFetch;
      }
      const data = await apiFetchFn<{ item: UITheme }>("/api/ui-preferences");
      if (data.item) {
        const merged: UITheme = {
          ...defaultTheme,
          ...data.item,
          customColors: { ...defaultTheme.customColors, ...(data.item as any)?.customColors },
          panelColors: { ...defaultTheme.panelColors, ...(data.item as any)?.panelColors },
          animationSettings: { ...defaultTheme.animationSettings, ...(data.item as any)?.animationSettings },
        };
        // Ensure these properties are preserved from the loaded theme
        if (data.item.cardStyle) merged.cardStyle = data.item.cardStyle;
        if (data.item.layoutDensity) merged.layoutDensity = data.item.layoutDensity;
        if (data.item.glowIntensity !== undefined) merged.glowIntensity = data.item.glowIntensity;
        if (data.item.animationSpeed) merged.animationSpeed = data.item.animationSpeed;
        setUITheme(merged);
        localStorage.setItem(getThemeStorageKey(), JSON.stringify(merged));
        applyThemeToDOM(merged);
      }
    } catch (error) {
      console.error("Failed to load preferences from backend:", error);
      // Keep using localStorage theme as fallback
    }
  };

  return (
    <ThemeContext.Provider value={{ uiTheme, updateTheme, resetTheme, applyTheme, applyPreset, saveToBackend, loadFromBackend }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
