import React from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneBadgeProps {
  level: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const milestoneColors: Record<string, { bg: string; text: string; border: string }> = {
  "30d": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "90d": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "6m": { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  "1y": { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  "2y": { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  "3y": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  "4y": { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  "5y": { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
  "6y": { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30" },
  "7y": { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  "8y": { bg: "bg-lime-500/20", text: "text-lime-400", border: "border-lime-500/30" },
  "9y": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "10y": { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export default function MilestoneBadge({ level, label, className, size = "md" }: MilestoneBadgeProps) {
  const colors = milestoneColors[level] || milestoneColors["1y"];
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <Award className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>{label}</span>
    </div>
  );
}
