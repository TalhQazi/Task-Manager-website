import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ThemeEngineContext } from "./ThemeEngineContext";
import {
  HolidayThemeManifest,
  ThemeAssetMap,
  EffectivePreferences,
  ThemeEngineContextValue,
} from "./types";
import { DEFAULT_NEUTRAL_MANIFEST } from "./manifests/defaultNeutral";
import { HALLOWEEN_2026_MANIFEST } from "./manifests/halloween2026";
import { PATRIOTIC_JULY4_MANIFEST } from "./manifests/patrioticJuly4";
import { WINTER_2026_MANIFEST } from "./manifests/winter2026";
import { SPRING_2026_MANIFEST } from "./manifests/spring2026";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useThemePerformance } from "./hooks/useThemePerformance";
import "./theme-tokens.css";

interface ThemeProviderProps {
  children: React.ReactNode;
  orgId?: string;
  userId?: string;
}

const EMPTY_ASSETS: ThemeAssetMap = {
  background: { desktop: null, tablet: null, mobile: null },
  headerBanner: { desktop: null, tablet: null, mobile: null },
  sideFrameLeft: { desktop: null, tablet: null, mobile: null },
  sideFrameRight: { desktop: null, tablet: null, mobile: null },
  bottomForeground: { desktop: null, tablet: null, mobile: null },
  transientOverlay: { desktop: null, tablet: null, mobile: null },
  particleSprite: { desktop: null, tablet: null, mobile: null },
};

function preloadImage(url: string | null | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (!url || url.startsWith("data:")) {
      resolve();
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

const STORAGE_KEY_OVERRIDE = "tm_holiday_theme_override";
const STORAGE_KEY_IMMERSIVE = "tm_holiday_theme_immersive";
const STORAGE_KEY_PARTICLES = "tm_holiday_theme_particles";

export const ThemeEngineProvider: React.FC<ThemeProviderProps> = ({
  children,
  orgId = "default",
  userId,
}) => {
  const systemReducedMotion = useReducedMotion();

  // Local storage cache for instant layout without flash of unstyled content
  const [userOverrideKey, setUserOverrideKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_OVERRIDE) || "auto";
    } catch {
      return "auto";
    }
  });

  const [immersiveStored, setImmersiveStored] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_IMMERSIVE);
      return val !== null ? val === "true" : true;
    } catch {
      return true;
    }
  });

  const [particlesStored, setParticlesStored] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_PARTICLES);
      return val !== null ? val === "true" : true;
    } catch {
      return true;
    }
  });

  const [activeTheme, setActiveTheme] = useState<HolidayThemeManifest>(DEFAULT_NEUTRAL_MANIFEST);
  const [assets, setAssets] = useState<ThemeAssetMap>(EMPTY_ASSETS);
  const [resolvedReason, setResolvedReason] = useState<string>("fallback_neutral");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Performance telemetry
  const { currentFps, isPerformanceDegraded, computedParticleCap } = useThemePerformance({
    manifestDesktopParticles: activeTheme.animations.particleCountDesktop,
    manifestMobileParticles: activeTheme.animations.particleCountMobile,
  });

  // Effective preferences
  const effectivePreferences: EffectivePreferences = useMemo(() => {
    const reduceMotion = Boolean(systemReducedMotion || activeTheme.accessibility.reducedMotionAlternative === "none");
    const animationsEnabled = !reduceMotion && !isPerformanceDegraded;
    const particlesEnabled = particlesStored && animationsEnabled;

    return {
      immersiveModeEnabled: immersiveStored,
      animationsEnabled,
      reduceMotion,
      particlesEnabled,
      lowPerformanceMode: isPerformanceDegraded,
      particleCap: computedParticleCap,
    };
  }, [
    systemReducedMotion,
    activeTheme.accessibility.reducedMotionAlternative,
    isPerformanceDegraded,
    particlesStored,
    immersiveStored,
    computedParticleCap,
  ]);

  // Inject CSS custom properties on :root[data-theme-key]
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.setAttribute("data-theme-key", activeTheme.themeKey);
    root.setAttribute("data-holiday-pulse", activeTheme.animations.enableGlowPulse && effectivePreferences.animationsEnabled ? "true" : "false");

    const p = activeTheme.palette;
    const l = activeTheme.layout;

    root.style.setProperty("--tm-accent", p.accent);
    root.style.setProperty("--tm-accent-2", p.accent2);
    root.style.setProperty("--tm-card-border", p.cardBorder);
    root.style.setProperty("--tm-card-glow", p.cardGlow);
    root.style.setProperty("--tm-surface-tint", p.surfaceTint);
    root.style.setProperty("--tm-theme-header-height", `${l.headerHeight}px`);
    root.style.setProperty("--tm-bg-base", p.backgroundBase);
    root.style.setProperty("--tm-scrim-wash", p.scrimWash);
    root.style.setProperty("--tm-text-color", p.textColor);
    root.style.setProperty("--tm-banner-height", `${l.bannerHeight}px`);
    root.style.setProperty("--tm-side-frame-width", `${l.sideFrameWidth}px`);
  }, [activeTheme, effectivePreferences.animationsEnabled]);

  // Fetch active theme from backend API
  const fetchActiveTheme = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (orgId) params.append("orgId", orgId);
      if (userId) params.append("userId", userId);
      if (systemReducedMotion) params.append("reducedMotion", "true");

      const res = await fetch(`/api/themes/active?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from active theme resolver`);
      }

      const json = await res.json();
      if (json.ok && json.data) {
        const data = json.data;

        // If local user override is set and valid, respect it locally
        if (userOverrideKey !== "auto") {
          let overrideManifest: HolidayThemeManifest | null = null;
          if (userOverrideKey === "halloween-2026") overrideManifest = HALLOWEEN_2026_MANIFEST;
          else if (userOverrideKey === "patriotic-july4") overrideManifest = PATRIOTIC_JULY4_MANIFEST;
          else if (userOverrideKey === "winter-wonderland-2026") overrideManifest = WINTER_2026_MANIFEST;
          else if (userOverrideKey === "spring-bloom-2026") overrideManifest = SPRING_2026_MANIFEST;
          else if (userOverrideKey === "default-neutral") overrideManifest = DEFAULT_NEUTRAL_MANIFEST;

          if (overrideManifest) {
            setActiveTheme(overrideManifest);
            setAssets(data.assets || EMPTY_ASSETS);
            setResolvedReason("user_override");
            setIsLoading(false);
            return;
          }
        }

        setActiveTheme(data.theme || DEFAULT_NEUTRAL_MANIFEST);
        setAssets(data.assets || EMPTY_ASSETS);
        setResolvedReason(data.resolvedReason || "schedule_match");

        // Preload critical assets in background
        if (data.assets) {
          const bg = data.assets.background?.desktop?.cdnUrl;
          const banner = data.assets.headerBanner?.desktop?.cdnUrl;
          const frameL = data.assets.sideFrameLeft?.desktop?.cdnUrl;
          const frameR = data.assets.sideFrameRight?.desktop?.cdnUrl;
          void Promise.all([
            preloadImage(bg),
            preloadImage(banner),
            preloadImage(frameL),
            preloadImage(frameR),
          ]);
        }
      } else {
        throw new Error(json.error?.message || "Invalid theme response");
      }
    } catch (err: any) {
      console.warn("[ThemeEngine] Backend unavailable or failed. Using client fallback manifests:", err.message);
      // Client-side fallback resolution
      if (userOverrideKey === "halloween-2026") {
        setActiveTheme(HALLOWEEN_2026_MANIFEST);
        setResolvedReason("client_override_halloween");
      } else if (userOverrideKey === "patriotic-july4") {
        setActiveTheme(PATRIOTIC_JULY4_MANIFEST);
        setResolvedReason("client_override_patriotic");
      } else if (userOverrideKey === "winter-wonderland-2026") {
        setActiveTheme(WINTER_2026_MANIFEST);
        setResolvedReason("client_override_winter");
      } else if (userOverrideKey === "spring-bloom-2026") {
        setActiveTheme(SPRING_2026_MANIFEST);
        setResolvedReason("client_override_spring");
      } else {
        // Evaluate calendar date locally
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        if (month === 10 || (month === 11 && day <= 5)) {
          setActiveTheme(HALLOWEEN_2026_MANIFEST);
          setResolvedReason("client_schedule_halloween");
        } else if (month === 7 && day <= 10) {
          setActiveTheme(PATRIOTIC_JULY4_MANIFEST);
          setResolvedReason("client_schedule_patriotic");
        } else if (month === 12 || (month === 1 && day <= 10)) {
          setActiveTheme(WINTER_2026_MANIFEST);
          setResolvedReason("client_schedule_winter");
        } else if (month >= 3 && month <= 4) {
          setActiveTheme(SPRING_2026_MANIFEST);
          setResolvedReason("client_schedule_spring");
        } else {
          setActiveTheme(DEFAULT_NEUTRAL_MANIFEST);
          setResolvedReason("client_fallback_neutral");
        }
      }
      setError(err.message || "Failed to reach theme server");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, userId, systemReducedMotion, userOverrideKey]);

  useEffect(() => {
    void fetchActiveTheme();
  }, [fetchActiveTheme]);

  // Set user explicit override
  const setThemeOverride = useCallback(
    async (key: string) => {
      setUserOverrideKeyState(key);
      try {
        localStorage.setItem(STORAGE_KEY_OVERRIDE, key);
      } catch {}

      if (key === "halloween-2026") {
        setActiveTheme(HALLOWEEN_2026_MANIFEST);
        setResolvedReason("user_override");
      } else if (key === "patriotic-july4") {
        setActiveTheme(PATRIOTIC_JULY4_MANIFEST);
        setResolvedReason("user_override");
      } else if (key === "winter-wonderland-2026") {
        setActiveTheme(WINTER_2026_MANIFEST);
        setResolvedReason("user_override");
      } else if (key === "spring-bloom-2026") {
        setActiveTheme(SPRING_2026_MANIFEST);
        setResolvedReason("user_override");
      } else if (key === "default-neutral") {
        setActiveTheme(DEFAULT_NEUTRAL_MANIFEST);
        setResolvedReason("user_override");
      } else {
        // "auto" -> refetch active schedule
        void fetchActiveTheme();
      }

      // Sync with backend API if userId exists
      if (userId) {
        try {
          await fetch("/api/themes/preference", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, selectedThemeKey: key }),
          });
        } catch (err) {
          console.error("[ThemeEngine] Could not persist preference to backend:", err);
        }
      }
    },
    [userId, fetchActiveTheme]
  );

  // Toggle immersion skin
  const toggleImmersion = useCallback(async () => {
    const nextVal = !immersiveStored;
    setImmersiveStored(nextVal);
    try {
      localStorage.setItem(STORAGE_KEY_IMMERSIVE, String(nextVal));
    } catch {}

    if (userId) {
      try {
        await fetch("/api/themes/preference", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, immersiveModeEnabled: nextVal }),
        });
      } catch {}
    }
  }, [immersiveStored, userId]);

  // Toggle particles
  const toggleParticles = useCallback(async () => {
    const nextVal = !particlesStored;
    setParticlesStored(nextVal);
    try {
      localStorage.setItem(STORAGE_KEY_PARTICLES, String(nextVal));
    } catch {}

    if (userId) {
      try {
        await fetch("/api/themes/preference", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, particlesEnabled: nextVal }),
        });
      } catch {}
    }
  }, [particlesStored, userId]);

  const contextValue: ThemeEngineContextValue = useMemo(
    () => ({
      activeTheme,
      assets,
      resolvedReason,
      effectivePreferences,
      isLoading,
      error,
      currentFps,
      isPerformanceDegraded,
      userOverrideKey,
      setThemeOverride,
      toggleImmersion,
      toggleParticles,
      refetchActiveTheme: fetchActiveTheme,
    }),
    [
      activeTheme,
      assets,
      resolvedReason,
      effectivePreferences,
      isLoading,
      error,
      currentFps,
      isPerformanceDegraded,
      userOverrideKey,
      setThemeOverride,
      toggleImmersion,
      toggleParticles,
      fetchActiveTheme,
    ]
  );

  return (
    <ThemeEngineContext.Provider value={contextValue}>
      {children}
    </ThemeEngineContext.Provider>
  );
};
