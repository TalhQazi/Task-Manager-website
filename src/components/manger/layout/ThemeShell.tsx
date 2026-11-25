import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeShellProps {
  children: ReactNode;
}

export function ThemeShell({ children }: ThemeShellProps) {
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";

  if (!isMetallic) {
    return <>{children}</>;
  }

  // Generate responsive rivet positions along top, bottom, and left rails
  const topRivetPositions = Array.from({ length: 15 }, (_, i) => `${(i * 7) + 3}%`);
  const bottomRivetPositions = Array.from({ length: 15 }, (_, i) => `${(i * 7) + 3}%`);
  const leftRivetPositions = Array.from({ length: 12 }, (_, i) => `${(i * 8) + 4}%`);

  return (
    <div className="relative min-h-screen w-full select-none overflow-x-hidden">
      {/* 1. Base background: full-bleed background environment */}
      <div 
        className="fixed inset-0 z-0 h-full w-full bg-fixed bg-center bg-no-repeat bg-cover pointer-events-none"
        style={{
          backgroundImage: "var(--tb-bg-image, url('/hud_metallic_target_bg.png'))",
        }}
      />

      {/* 2. Darkening Vignette Layer */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(circle, transparent 20%, rgba(0, 0, 0, 0.8) 100%), linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
        }}
      />

      {/* 3. Noise/Grain texture layer */}
      <div 
        className="fixed inset-0 z-[2] pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. Connected Perimeter Frame / Metal rails */}
      {/* Top Rail */}
      <div 
        className="fixed top-0 left-0 right-0 z-[99] h-2 border-b border-[#ffd27a]/20 bg-gradient-to-b from-[#444] via-[#222] to-[#111] shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
      >
        {topRivetPositions.map((pos, idx) => (
          <div 
            key={`top-rivet-${idx}`} 
            className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#bbb] to-[#333] shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
            style={{ left: pos }}
          />
        ))}
      </div>

      {/* Left Rail */}
      <div 
        className="fixed top-0 bottom-0 left-0 z-[99] w-2 border-r border-[#ffd27a]/20 bg-gradient-to-r from-[#444] via-[#222] to-[#111] shadow-[2px_0_4px_rgba(0,0,0,0.8)]"
      >
        {leftRivetPositions.map((pos, idx) => (
          <div 
            key={`left-rivet-${idx}`} 
            className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#bbb] to-[#333] shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
            style={{ top: pos }}
          />
        ))}
      </div>

      {/* Bottom Rail */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[99] h-2 border-t border-[#ffd27a]/20 bg-gradient-to-t from-[#444] via-[#222] to-[#111] shadow-[0_-2px_4px_rgba(0,0,0,0.8)]"
      >
        {bottomRivetPositions.map((pos, idx) => (
          <div 
            key={`bottom-rivet-${idx}`} 
            className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#bbb] to-[#333] shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
            style={{ left: pos }}
          />
        ))}
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
