import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaintSwatchProps {
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  allowCopy?: boolean;
}

export const PaintSwatch: React.FC<PaintSwatchProps> = ({
  color,
  size = "md",
  showLabel = false,
  className,
  allowCopy = true,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanColor = (color || "").trim();
  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(cleanColor);
  const isValidRgb = /^rgb/i.test(cleanColor);
  const hasColor = isValidHex || isValidRgb;

  const sizeClasses = {
    sm: "h-5 w-5 rounded-md",
    md: "h-8 w-8 rounded-lg",
    lg: "h-12 w-12 rounded-xl",
    xl: "h-20 w-20 rounded-2xl",
  };

  const handleCopy = (e: React.MouseEvent) => {
    if (!allowCopy || !hasColor) return;
    e.stopPropagation();
    navigator.clipboard.writeText(cleanColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        onClick={handleCopy}
        title={hasColor ? `${cleanColor} (click to copy)` : "No color code"}
        className={cn(
          "relative flex items-center justify-center border shadow-sm transition-transform active:scale-95 shrink-0",
          sizeClasses[size],
          hasColor
            ? "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400"
            : "bg-slate-100 border-dashed border-slate-300 text-slate-400"
        )}
        style={{
          backgroundColor: hasColor ? cleanColor : undefined,
          borderColor: hasColor ? "rgba(0,0,0,0.15)" : undefined,
        }}
      >
        {copied && (
          <div className="absolute inset-0 bg-black/60 rounded-[inherit] flex items-center justify-center text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
        {!hasColor && (
          <span className="text-[10px] font-bold text-slate-400 select-none">
            N/A
          </span>
        )}
      </div>

      {showLabel && (
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono font-medium text-slate-700">
            {hasColor ? cleanColor : "No Swatch"}
          </span>
          {hasColor && allowCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
              title="Copy hex code"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

