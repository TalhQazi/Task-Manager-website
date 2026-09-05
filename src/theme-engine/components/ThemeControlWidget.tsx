import React, { useState } from "react";
import { useActiveTheme } from "../ThemeEngineContext";
import { Sparkles, Moon, Sun, ShieldAlert, ChevronUp, ChevronDown, Check, Gauge } from "lucide-react";

export const ThemeControlWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeTheme,
    userOverrideKey,
    effectivePreferences,
    currentFps,
    isPerformanceDegraded,
    setThemeOverride,
    toggleImmersion,
    toggleParticles,
  } = useActiveTheme();

  const themes = [
    { key: "auto", label: "Auto (Date Schedule)" },
    { key: "halloween-2026", label: "Spooky Twilight (Halloween)" },
    { key: "patriotic-july4", label: "Liberty Gala (July 4th)" },
    { key: "winter-wonderland-2026", label: "Winter Wonderland (Holiday)" },
    { key: "spring-bloom-2026", label: "Spring Bloom (Cherry Blossom)" },
    { key: "default-neutral", label: "Clean Enterprise (Neutral)" },
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-[999] flex flex-col items-end select-none"
      style={{ pointerEvents: "auto" }}
    >
      {/* Expanded Control Modal Card */}
      {isOpen && (
        <div
          className="mb-2 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.88)",
            borderColor: "var(--tm-card-border, rgba(255, 255, 255, 0.15))",
            color: "var(--tm-text-color, #f8fafc)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-sm tracking-wide">Holiday Theme Engine</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentFps} FPS</span>
            </div>
          </div>

          {/* Performance Alert if Degraded */}
          {isPerformanceDegraded && (
            <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Performance throttled to protect 60 FPS responsiveness.</span>
            </div>
          )}

          {/* Theme Selection List */}
          <div className="mt-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Theme Mode
            </label>
            <div className="grid grid-cols-1 gap-1 pt-1">
              {themes.map((t) => {
                const isSelected = userOverrideKey === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setThemeOverride(t.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                      isSelected
                        ? "bg-blue-600/30 border border-blue-500/50 text-white font-medium"
                        : "hover:bg-white/5 text-slate-300 border border-transparent"
                    }`}
                  >
                    <span>{t.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
            {/* Immersion Toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Seasonal Immersion Skin</span>
              <button
                onClick={toggleImmersion}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  effectivePreferences.immersiveModeEnabled ? "bg-amber-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    effectivePreferences.immersiveModeEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Particles Toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Interactive Particles</span>
              <button
                onClick={toggleParticles}
                disabled={!effectivePreferences.immersiveModeEnabled || effectivePreferences.reduceMotion}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  effectivePreferences.particlesEnabled && !effectivePreferences.reduceMotion
                    ? "bg-blue-500"
                    : "bg-slate-700 opacity-50 cursor-not-allowed"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    effectivePreferences.particlesEnabled && !effectivePreferences.reduceMotion
                      ? "translate-x-4"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Manifest Details */}
          <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5">
            <span>Active: {activeTheme.displayName}</span>
            <span className="capitalize">{activeTheme.category}</span>
          </div>
        </div>
      )}

      {/* Floating Launcher Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          borderColor: "var(--tm-card-border, rgba(255, 255, 255, 0.2))",
          boxShadow: "var(--tm-card-glow, 0 10px 25px -5px rgba(0, 0, 0, 0.4))",
          color: "var(--tm-text-color, #f8fafc)",
        }}
        title="Toggle Seasonal Theme Engine"
        aria-label="Toggle Seasonal Theme Engine"
      >
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
        <span className="text-xs font-semibold tracking-wide">Theme</span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 opacity-70" />
        )}
      </button>
    </div>
  );
};
