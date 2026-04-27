// Theme utilities shared across Manager panel
// Matches admin ThemeContext applyThemeToDOM behavior

export const themeDefaults: Record<string, string> = {
  "dark-minimal": "#f8fafc",
  "neon-tech": "#e0f7fa",
  "metallic-elite": "#d4af37",
  "executive-black": "#f3f4f6",
  "high-contrast": "#ffffff",
  "energy-mode": "#ffedd5",
  "crystal-white": "#000000",
};

export const themePresets: Record<string, {
  primary: string; secondary: string; accent: string;
  headerBg: string; sidebarBg: string; dashboardBg: string; cardBg: string;
  sidebarIcon: string; dashboardIcon: string; sidebarText: string;
  glowIntensity: number; animationSpeed: "slow" | "normal" | "fast";
}> = {
  "dark-minimal": {
    primary: "#133767", secondary: "#3b82f6", accent: "#8b5cf6",
    headerBg: "#133767", sidebarBg: "#020617", dashboardBg: "#0f172a",
    cardBg: "rgba(30, 41, 59, 0.7)", sidebarIcon: "#ffffff", dashboardIcon: "#3b82f6", sidebarText: "#ffffff",
    glowIntensity: 50, animationSpeed: "normal",
  },
  "neon-tech": {
    primary: "#00f5ff", secondary: "#00c6ff", accent: "#8b5cf6",
    headerBg: "#030014", sidebarBg: "#06061a", dashboardBg: "#030014",
    cardBg: "rgba(0, 245, 255, 0.03)", sidebarIcon: "#e0f7fa", dashboardIcon: "#00f5ff", sidebarText: "#e0f7fa",
    glowIntensity: 60, animationSpeed: "normal",
  },
  "metallic-elite": {
    primary: "#d4af37", secondary: "#c0a030", accent: "#e8c84e",
    headerBg: "#1a1a1a", sidebarBg: "rgba(17, 17, 17, 0.8)", dashboardBg: "#1a1a1a",
    cardBg: "linear-gradient(145deg, #2a2a2a, #1a1a1a)", sidebarIcon: "#d4af37", dashboardIcon: "#d4af37", sidebarText: "#d4af37",
    glowIntensity: 55, animationSpeed: "normal",
  },
  "executive-black": {
    primary: "#f3f4f6", secondary: "#d1d5db", accent: "#9ca3af",
    headerBg: "#0a0a0a", sidebarBg: "#050505", dashboardBg: "#0a0a0a",
    cardBg: "rgba(20, 20, 20, 0.8)", sidebarIcon: "#f3f4f6", dashboardIcon: "#f3f4f6", sidebarText: "#f3f4f6",
    glowIntensity: 40, animationSpeed: "normal",
  },
  "high-contrast": {
    primary: "#ffffff", secondary: "#ffffff", accent: "#ffff00",
    headerBg: "#000000", sidebarBg: "#000000", dashboardBg: "#000000",
    cardBg: "#000000", sidebarIcon: "#ffffff", dashboardIcon: "#ffffff", sidebarText: "#ffffff",
    glowIntensity: 80, animationSpeed: "fast",
  },
  "energy-mode": {
    primary: "#ffedd5", secondary: "#fdba74", accent: "#fb923c",
    headerBg: "#1a0f00", sidebarBg: "#0a0500", dashboardBg: "#1a0f00",
    cardBg: "rgba(255, 150, 0, 0.1)", sidebarIcon: "#ffedd5", dashboardIcon: "#ffedd5", sidebarText: "#ffedd5",
    glowIntensity: 50, animationSpeed: "normal",
  },
  "crystal-white": {
    primary: "#133767", secondary: "#3b82f6", accent: "#8b5cf6",
    headerBg: "#f8fafc", sidebarBg: "#ffffff", dashboardBg: "#f8fafc",
    cardBg: "#ffffff", sidebarIcon: "#000000", dashboardIcon: "#133767", sidebarText: "#000000",
    glowIntensity: 30, animationSpeed: "normal",
  },
};

export function applyFullTheme(theme: string, textColor?: string, cardStyle?: string) {
  const root = document.documentElement;
  const preset = themePresets[theme] || themePresets["dark-minimal"];
  const resolvedText = textColor || themeDefaults[theme] || "#ffffff";

  // Body class
  document.body.className = document.body.className.replace(/\btb-theme-[a-z-]+\b/g, "");
  document.body.classList.add(`tb-theme-${theme}`);

  // Custom colors
  root.style.setProperty("--tb-primary", preset.primary);
  root.style.setProperty("--tb-secondary", preset.secondary);
  root.style.setProperty("--tb-accent", preset.accent);

  // Panel colors
  root.style.setProperty("--tb-header-bg", preset.headerBg);
  root.style.setProperty("--tb-header-overlay-color", "#000000");
  root.style.setProperty("--tb-header-overlay-opacity", "0.3");
  root.style.setProperty("--tb-sidebar-bg", preset.sidebarBg);
  root.style.setProperty("--tb-dashboard-bg", preset.dashboardBg);
  root.style.setProperty("--tb-sidebar-icon-color", preset.sidebarIcon);
  root.style.setProperty("--tb-dashboard-icon-color", preset.dashboardIcon);
  root.style.setProperty("--tb-sidebar-text-color", preset.sidebarText);
  root.style.setProperty("--tb-dashboard-card-bg", preset.cardBg);
  root.style.setProperty("--tb-dashboard-text-color", resolvedText);
  document.body.style.color = resolvedText;

  // Tailwind text consistency
  root.style.setProperty("--foreground", resolvedText);
  root.style.setProperty("--card-foreground", resolvedText);
  root.style.setProperty("--muted-foreground", resolvedText === "#000000" ? "#64748b" : "#94a3b8");

  // Glow & animation
  root.style.setProperty("--tb-glow-intensity", `${preset.glowIntensity}%`);
  const speedMap = { slow: "0.5s", normal: "0.3s", fast: "0.15s" };
  root.style.setProperty("--tb-animation-speed", speedMap[preset.animationSpeed]);

  // Card style
  if (cardStyle) {
    root.style.setProperty("--tb-card-style", cardStyle);
    document.body.setAttribute("data-tb-card-style", cardStyle);
  }

  // Layout density default
  root.style.setProperty("--tb-spacing", "1rem");

  // Animation settings
  root.style.setProperty("--tb-animations-enabled", "1");
  document.documentElement.setAttribute("data-tb-animations-enabled", "1");
  document.documentElement.setAttribute("data-tb-reduce-motion", "0");
  document.documentElement.setAttribute("data-tb-hover-effects", "1");
  document.documentElement.setAttribute("data-tb-click-effects", "1");
}
