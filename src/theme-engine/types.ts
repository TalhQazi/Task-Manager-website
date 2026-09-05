/**
 * Task Manager® Holiday Immersive Theme Engine - Frontend Type Definitions
 */

export type DeviceVariant = "desktop" | "tablet" | "mobile";

export type AssetType =
  | "background"
  | "headerBanner"
  | "sideFrameLeft"
  | "sideFrameRight"
  | "bottomForeground"
  | "transientOverlay"
  | "particleSprite";

export type ParticleType = "bats" | "sparks" | "snow" | "confetti" | "lanterns" | "stars" | "none";
export type TransientEffectType = "ghost-pass" | "firework-burst" | "none";

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  accent2: string;
  backgroundBase: string;
  surfaceTint: string;
  cardBorder: string;
  cardGlow: string;
  textColor: string;
  scrimWash: string;
}

export interface ThemeLayout {
  headerHeight: number;
  bannerHeight: number;
  sideFrameWidth: number;
  enableSideFrames: boolean;
  enableBottomForeground: boolean;
  enableHeaderBanner: boolean;
}

export interface ThemeAnimations {
  particleType: ParticleType;
  particleCountDesktop: number;
  particleCountMobile: number;
  particleColor: string[];
  particleSpeed: number;
  enableGlowPulse: boolean;
  transientEffectType: TransientEffectType;
  transientIntervalSeconds: number;
}

export interface ThemeAccessibility {
  minContrastRatio: number;
  reducedMotionAlternative: string;
  highContrastCompatible: boolean;
}

export interface HolidayThemeManifest {
  themeKey: string;
  displayName: string;
  description: string;
  category: "halloween" | "patriotic" | "winter" | "spring" | "cultural" | "corporate" | "custom";
  priority: number;
  palette: ThemePalette;
  layout: ThemeLayout;
  animations: ThemeAnimations;
  accessibility: ThemeAccessibility;
  isActive: boolean;
}

export interface ThemeAssetItem {
  themeKey: string;
  deviceVariant: DeviceVariant;
  assetType: AssetType;
  cdnUrl: string;
  fallbackUrl?: string;
  dimensions?: { width: number; height: number };
  fileSize?: number;
  format?: string;
  loadPriority?: "critical" | "high" | "normal" | "low";
}

export type ThemeAssetMap = Record<AssetType, Record<DeviceVariant, ThemeAssetItem | null>>;

export interface EffectivePreferences {
  immersiveModeEnabled: boolean;
  animationsEnabled: boolean;
  reduceMotion: boolean;
  particlesEnabled: boolean;
  lowPerformanceMode: boolean;
  particleCap: number;
}

export interface ActiveThemeResponse {
  resolvedThemeKey: string;
  resolvedReason:
    | "system_reduced_motion"
    | "user_override"
    | "org_enforced"
    | "schedule_match"
    | "fallback_neutral";
  theme: HolidayThemeManifest;
  assets: ThemeAssetMap;
  effectivePreferences: EffectivePreferences;
}

export interface ThemeEngineContextValue {
  activeTheme: HolidayThemeManifest;
  assets: ThemeAssetMap;
  resolvedReason: string;
  effectivePreferences: EffectivePreferences;
  isLoading: boolean;
  error: string | null;
  currentFps: number;
  isPerformanceDegraded: boolean;
  userOverrideKey: string; // "auto" or explicit themeKey
  setThemeOverride: (key: string) => Promise<void>;
  toggleImmersion: () => Promise<void>;
  toggleParticles: () => Promise<void>;
  refetchActiveTheme: () => Promise<void>;
}
