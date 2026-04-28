import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange" | "indigo" | "teal" | "rose" | "amber" | "lime" | "pink" | "cyan" | "gold" | "majesty" | "red" | "blue" | "green" | "purple-new" | "orange-new" | "yellow" | "brown" | "pink-new" | "grey";
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

  // Map variants to specific glow colors from the reference image
  const glowColors = {
    primary: "rgba(59, 130, 246, 0.5)",
    success: "rgba(16, 185, 129, 0.6)",
    warning: "rgba(245, 158, 11, 0.6)",
    danger: "rgba(239, 68, 68, 0.6)",
    info: "rgba(14, 165, 233, 0.6)",
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
      className={cn("relative rounded-xl border-[2px] border-[#5a5a5a] bg-[#111]",
        "shadow-[inset_0_0_20px_rgba(0,0,0,0.8),_0_4px_10px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer",
        "overflow-hidden group",
        "rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-soft animate-fade-in relative",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
        variantClasses[variant]
      )}
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-60 transition-opacity group-hover:opacity-100 mix-blend-screen"
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
      <div className="absolute inset-[2px] rounded-lg border border-white/10 pointer-events-none" />

      <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 z-10">
        {/* Left Section - Text Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[#d0d0d0] text-xs sm:text-sm font-medium tracking-wide mb-1 truncate drop-shadow-md">
            {title}
          </p>
          <p className="text-white text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {value}
          </p>
          <p className={cn(
            "text-xs sm:text-sm font-medium opacity-90 truncate",
            "mb-1 sm:mb-2"
          )}>
            {title}
          </p>
          
          <p className={cn(
            "text-xl sm:text-2xl md:text-3xl font-bold animate-count-up",
            "leading-tight sm:leading-none",
            "break-words"
          )}>
            {value}
          </p>
          
          {change && (
            <p
              className={cn(
                "text-xs sm:text-sm mt-2 sm:mt-3 flex items-center gap-1",
                "truncate",
                changeType === "positive" && "opacity-100",
                changeType === "negative" && "opacity-100",
                changeType === "neutral" && "opacity-80"
              )}
            >
              <span className="truncate">{change}</span>
            </p>
          )}
        </div>

        {/* Right Section - Icon inside metallic badge */}
        <div className={cn(
          "relative flex items-center justify-center",
          "h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-lg",
          "border-2 border-[#666] bg-gradient-to-br from-[#444] to-[#111]",
          "shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.8)]"
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

      {/* Mobile Touch Feedback - Only visible on active tap */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white opacity-0 active:opacity-10 transition-opacity pointer-events-none" />
    </div>
  );
}