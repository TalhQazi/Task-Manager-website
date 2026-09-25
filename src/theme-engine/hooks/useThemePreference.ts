import { useCallback } from "react";
import { useActiveTheme } from "../ThemeEngineContext";

export function useThemePreference() {
  const {
    activeTheme,
    effectivePreferences,
    userOverrideKey,
    setThemeOverride,
    toggleImmersion,
    toggleParticles,
    isPerformanceDegraded,
  } = useActiveTheme();

  const setExplicitTheme = useCallback(
    async (themeKey: string) => {
      await setThemeOverride(themeKey);
    },
    [setThemeOverride]
  );

  const resetToAuto = useCallback(async () => {
    await setThemeOverride("auto");
  }, [setThemeOverride]);

  return {
    activeThemeKey: activeTheme.themeKey,
    userOverrideKey,
    isImmersive: effectivePreferences.immersiveModeEnabled,
    particlesEnabled: effectivePreferences.particlesEnabled,
    reduceMotion: effectivePreferences.reduceMotion,
    isPerformanceDegraded,
    setExplicitTheme,
    resetToAuto,
    toggleImmersion,
    toggleParticles,
  };
}
