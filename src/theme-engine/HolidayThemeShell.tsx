import React, { useEffect } from "react";
import { useActiveTheme } from "./ThemeEngineContext";
import { useResponsiveThemeAsset } from "./hooks/useResponsiveThemeAsset";
import { useSeasonalCelebration } from "./hooks/useSeasonalCelebration";
import { ParticleCanvas } from "./canvas/ParticleCanvas";
import { TransientEffects } from "./canvas/TransientEffects";
import { ThemeControlWidget } from "./components/ThemeControlWidget";

interface HolidayThemeShellProps {
  children: React.ReactNode;
}

export const HolidayThemeShell: React.FC<HolidayThemeShellProps> = ({ children }) => {
  const { activeTheme, assets, effectivePreferences, currentFps, isPerformanceDegraded } =
    useActiveTheme();
  const { deviceVariant, getAssetUrl } = useResponsiveThemeAsset(assets);
  const { triggerCelebration } = useSeasonalCelebration();

  useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>;
      triggerCelebration(customEvent.detail || {});
    };
    window.addEventListener("seasonal-celebration", handleCelebration);
    return () => {
      window.removeEventListener("seasonal-celebration", handleCelebration);
    };
  }, [triggerCelebration]);

  const isImmersive =
    effectivePreferences.immersiveModeEnabled &&
    activeTheme.themeKey !== "default-neutral" &&
    !(typeof window !== "undefined" && window.location.pathname.startsWith("/login"));
  const { palette, layout, animations } = activeTheme;

  // Responsive asset URLs
  const bgUrl = getAssetUrl("background");
  const headerBannerUrl = getAssetUrl("headerBanner");
  const sideFrameLeftUrl = getAssetUrl("sideFrameLeft");
  const sideFrameRightUrl = getAssetUrl("sideFrameRight");
  const bottomForegroundUrl = getAssetUrl("bottomForeground");
  const transientOverlayUrl = getAssetUrl("transientOverlay");

  const showHeaderBanner = isImmersive && layout.enableHeaderBanner && Boolean(headerBannerUrl);
  const showSideFrames = isImmersive && layout.enableSideFrames && deviceVariant !== "mobile";
  const showBottomForeground = isImmersive && layout.enableBottomForeground && Boolean(bottomForegroundUrl);
  const showParticles = isImmersive && effectivePreferences.particlesEnabled && effectivePreferences.animationsEnabled;
  const showTransientEffects = isImmersive && effectivePreferences.animationsEnabled && animations.transientEffectType !== "none";

  return (
    <div
      className="holiday-theme-shell relative min-h-screen w-full overflow-x-hidden"
      data-holiday-skin={isImmersive ? "true" : "false"}
      data-holiday-theme={activeTheme.themeKey}
    >
      {/* =========================================================================
          LAYER 0 (z-index: 0): Fallback background color / base gradient
          ========================================================================= */}
      <div
        className="layer-0-base-bg pointer-events-none select-none fixed inset-0 w-full h-full"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
          backgroundColor: palette.backgroundBase || "#0b1120",
          backgroundImage: isImmersive
            ? `radial-gradient(circle at 50% 0%, ${palette.surfaceTint || "transparent"} 0%, ${palette.backgroundBase} 70%)`
            : "none",
        }}
        aria-hidden="true"
      />

      {/* =========================================================================
          LAYER 1 (z-index: 10): Environment background WebP/AVIF/SVG
          ========================================================================= */}
      {isImmersive && bgUrl && (
        <div
          className="layer-1-environment-bg pointer-events-none select-none fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            zIndex: 10,
            pointerEvents: "none",
            userSelect: "none",
            backgroundImage: `url("${bgUrl}")`,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          LAYER 2 (z-index: 20): Scrim / atmosphere wash overlay
          ========================================================================= */}
      {isImmersive && (
        <div
          className="layer-2-scrim-wash pointer-events-none select-none fixed inset-0 w-full h-full backdrop-blur-[0.5px]"
          style={{
            zIndex: 20,
            pointerEvents: "none",
            userSelect: "none",
            backgroundColor: palette.scrimWash || "rgba(11, 17, 32, 0.45)",
          }}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          LAYER 3 (z-index: 30): Header banner integrated with logo and seasonal branding
          ========================================================================= */}
      {showHeaderBanner && (
        <header
          className="layer-3-header-banner pointer-events-none select-none fixed top-0 left-0 right-0 w-full overflow-hidden"
          style={{
            zIndex: 30,
            pointerEvents: "none",
            userSelect: "none",
            height: layout.bannerHeight || 120,
          }}
          aria-hidden="true"
        >
          <img
            src={headerBannerUrl!}
            alt=""
            className="w-full h-full object-cover object-top opacity-80"
          />
        </header>
      )}

      {/* =========================================================================
          LAYER 4 (z-index: 40): Left & right decorative side frames
          ========================================================================= */}
      {showSideFrames && (
        <>
          {/* Left Side Frame */}
          <aside
            className="layer-4-side-frame-left pointer-events-none select-none fixed top-0 bottom-0 left-0 h-full overflow-hidden"
            style={{
              zIndex: 40,
              pointerEvents: "none",
              userSelect: "none",
              width: layout.sideFrameWidth || 48,
            }}
            aria-hidden="true"
          >
            {sideFrameLeftUrl ? (
              <img
                src={sideFrameLeftUrl}
                alt=""
                className="w-full h-full object-cover object-left opacity-75"
              />
            ) : (
              <div
                className="w-full h-full border-r border-dashed"
                style={{
                  borderColor: palette.cardBorder || "rgba(255,255,255,0.1)",
                  backgroundColor: palette.surfaceTint,
                }}
              />
            )}
          </aside>

          {/* Right Side Frame */}
          <aside
            className="layer-4-side-frame-right pointer-events-none select-none fixed top-0 bottom-0 right-0 h-full overflow-hidden"
            style={{
              zIndex: 40,
              pointerEvents: "none",
              userSelect: "none",
              width: layout.sideFrameWidth || 48,
            }}
            aria-hidden="true"
          >
            {sideFrameRightUrl ? (
              <img
                src={sideFrameRightUrl}
                alt=""
                className="w-full h-full object-cover object-right opacity-75"
              />
            ) : (
              <div
                className="w-full h-full border-l border-dashed"
                style={{
                  borderColor: palette.cardBorder || "rgba(255,255,255,0.1)",
                  backgroundColor: palette.surfaceTint,
                }}
              />
            )}
          </aside>
        </>
      )}

      {/* =========================================================================
          LAYER 5 (z-index: 50): Bottom foreground assets (fog, pumpkins, spark lines)
          ========================================================================= */}
      {showBottomForeground && (
        <div
          className="layer-5-bottom-foreground pointer-events-none select-none fixed bottom-0 left-0 right-0 w-full overflow-hidden"
          style={{
            zIndex: 50,
            pointerEvents: "none",
            userSelect: "none",
            height: deviceVariant === "mobile" ? 60 : 130,
          }}
          aria-hidden="true"
        >
          <img
            src={bottomForegroundUrl!}
            alt=""
            className="w-full h-full object-cover object-bottom opacity-85"
          />
        </div>
      )}

      {/* =========================================================================
          LAYER 8 (z-index: 60-90 / safe 70): Safe particle canvas behind content
          ========================================================================= */}
      {showParticles && (
        <ParticleCanvas
          particleType={animations.particleType}
          particleColors={animations.particleColor}
          particleSpeed={animations.particleSpeed}
          particleCap={effectivePreferences.particleCap}
          enabled={showParticles}
        />
      )}

      {/* =========================================================================
          LAYER 6 (z-index: 100) & LAYER 7 (z-index: 110 Card Tokens):
          Dashboard content (<main className="main-app-layout">)
          ========================================================================= */}
      <main
        className="main-app-layout relative min-h-screen w-full"
        style={{
          zIndex: 100, // Layer 6: Dashboard Content
        }}
      >
        {children}
      </main>

      {/* =========================================================================
          LAYER 9 (z-index: 120): Transient foreground effects (ghost pass, spark trails)
          ========================================================================= */}
      {showTransientEffects && (
        <TransientEffects
          effectType={animations.transientEffectType}
          intervalSeconds={animations.transientIntervalSeconds}
          enabled={showTransientEffects}
          assetUrl={transientOverlayUrl}
        />
      )}

      {/* Floating Theme Control Widget */}
      <ThemeControlWidget />

      {/* =========================================================================
          LAYER 10 (z-index: 1000+): Modals and system popups reserved space.
          React portals in child components target document.body with z-index >= 1000.
          ========================================================================= */}
    </div>
  );
};
