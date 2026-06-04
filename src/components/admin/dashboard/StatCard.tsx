import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange" | "indigo" | "teal" | "rose" | "amber" | "lime" | "pink" | "cyan" | "gold" | "majesty" | "red" | "blue" | "green" | "purple-new" | "orange-new" | "yellow" | "brown" | "pink-new" | "grey" | "dark-grey" | "silver" | "dark-green";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "primary",
  onClick,
}: StatCardProps) {
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";

  // Map variants to specific glow colors from the reference image
  const glowColors = {
    primary: "rgba(59, 130, 246, 0.5)",
    success: "rgba(16, 185, 129, 0.6)",
    green: "rgba(34, 197, 94, 0.6)",
    warning: "rgba(245, 158, 11, 0.6)",
    danger: "rgba(239, 68, 68, 0.6)",
    info: "rgba(14, 165, 233, 0.6)",
    cyan: "rgba(0, 198, 255, 0.65)",
    purple: "rgba(168, 85, 247, 0.6)",
    orange: "rgba(249, 115, 22, 0.6)",
    teal: "rgba(20, 184, 166, 0.6)",
    amber: "rgba(251, 191, 36, 0.6)",
    lime: "rgba(132, 204, 22, 0.6)",
    gold: "rgba(250, 204, 21, 0.7)",
    red: "rgba(239, 68, 68, 0.6)",
    blue: "rgba(59, 130, 246, 0.6)",
    "dark-grey": "rgba(156, 163, 175, 0.3)",
    silver: "rgba(209, 213, 219, 0.4)",
    "dark-green": "rgba(22, 163, 74, 0.6)",
    yellow: "rgba(234, 179, 8, 0.6)"
  };

  const glowColor = glowColors[variant as keyof typeof glowColors] || glowColors.primary;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden group",
        isMetallic
          ? "border border-[#ffd27a]/35 bg-gradient-to-br from-[#2b2c2d] to-[#111315] hover:border-[#ffd27a]/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_10px_20px_rgba(0,0,0,0.7)]"
          : "border-[2px] border-[#5a5a5a] bg-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),_0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
      )}
    >
      {/* Metallic-specific details */}
      {isMetallic && (
        <>
          {/* Corner brackets */}
          <div className="metallic-corner-bracket metallic-bracket-tl" />
          <div className="metallic-corner-bracket metallic-bracket-tr" />
          <div className="metallic-corner-bracket metallic-bracket-bl" />
          <div className="metallic-corner-bracket metallic-bracket-br" />
          
          {/* Procedural noise overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Miniature screws in corners */}
          <div className="absolute top-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
          <div className="absolute top-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
          <div className="absolute bottom-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
          <div className="absolute bottom-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
        </>
      )}

      {/* Dynamic Background Glow */}
      <div 
        className={cn(
          "absolute inset-0 mix-blend-screen transition-opacity",
          isMetallic
            ? "opacity-35 group-hover:opacity-55"
            : "opacity-60 group-hover:opacity-100"
        )}
        style={{
          background: `radial-gradient(circle at 50% 120%, ${glowColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Horizontal Light Streak */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)`,
          height: '1px',
          top: '50%'
        }}
      />

      {/* Inner Metallic Frame Bevel */}
      <div className={cn(
        "absolute inset-[2px] rounded-lg pointer-events-none",
        isMetallic ? "border border-white/5" : "border border-white/10"
      )} />

      <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 z-10">
        {/* Left Section - Text Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs sm:text-sm font-medium tracking-wide mb-1 truncate drop-shadow-md",
            isMetallic ? "text-[#cfd7dc]" : "text-[#d0d0d0]"
          )}>
            {title}
          </p>
          <p className="text-white text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {value}
          </p>
          {change && (
            <p className={cn(
              "text-[10px] sm:text-xs font-medium mt-0.5 tracking-wide",
              isMetallic ? "text-[#ffd27a]/85" : "text-[#a0a0a0]"
            )}>
              {change}
            </p>
          )}
        </div>

        {/* Right Section - Icon inside metallic badge */}
        <div className={cn(
          "relative flex items-center justify-center",
          "h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-lg",
          isMetallic
            ? "border border-[#ffd27a]/40 bg-gradient-to-br from-[#1c1d1f] to-[#111315] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_2px_4px_rgba(255,255,255,0.05)]"
            : "border-2 border-[#666] bg-gradient-to-br from-[#444] to-[#111] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.8)]"
        )}>
          {/* Inner ring for the icon */}
          <div className="absolute inset-[2px] rounded-md border border-black/80" />
          <Icon 
            className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" 
            style={{ 
              color: glowColor.replace(/,\s*[\d.]+\)$/, ', 1)'),
              filter: `drop-shadow(0 0 6px ${glowColor.replace(/,\s*[\d.]+\)$/, ', 0.8)')})`
            }} 
          />
        </div>
      </div>
    </div>
  );
}