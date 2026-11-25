import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function parseImagePosition(posStr: string | undefined): { x: number; y: number } {
  if (!posStr) return { x: 50, y: 50 };
  const normalized = posStr.trim().toLowerCase();
  if (normalized === "center") return { x: 50, y: 50 };

  const parsePart = (p: string, def: number) => {
    if (p === "center") return 50;
    if (p === "top" || p === "left") return 0;
    if (p === "bottom" || p === "right") return 100;
    const m = p.match(/(-?\d+(?:\.\d+)?)%/);
    if (m) return Math.min(100, Math.max(0, Math.round(parseFloat(m[1]))));
    return def;
  };

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    if (parts[0] === "top") return { x: 50, y: 0 };
    if (parts[0] === "bottom") return { x: 50, y: 100 };
    if (parts[0] === "left") return { x: 0, y: 50 };
    if (parts[0] === "right") return { x: 100, y: 50 };
    return { x: parsePart(parts[0], 50), y: 50 };
  }

  return {
    x: parsePart(parts[0], 50),
    y: parsePart(parts[1], 50),
  };
}

interface ImagePositionRemoteProps {
  position?: string;
  onChange: (newPosition: string) => void;
  onCommit?: (newPosition: string) => void | Promise<void>;
  className?: string;
}

export function ImagePositionRemote({
  position,
  onChange,
  onCommit,
  className,
}: ImagePositionRemoteProps) {
  const [step, setStep] = useState<number>(5);
  const { x, y } = parseImagePosition(position);

  const posRef = useRef({ x, y });
  useEffect(() => {
    posRef.current = { x, y };
  }, [x, y]);

  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const activeHoldRef = useRef(false);

  const clearHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearHold();
  }, []);

  const applyDelta = (dx: number, dy: number) => {
    const nextX = Math.min(100, Math.max(0, posRef.current.x + dx));
    const nextY = Math.min(100, Math.max(0, posRef.current.y + dy));
    posRef.current = { x: nextX, y: nextY };
    const nextStr = `${nextX}% ${nextY}%`;
    onChange(nextStr);
    return nextStr;
  };

  const startHold = (dx: number, dy: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    clearHold();
    activeHoldRef.current = true;
    applyDelta(dx * step, dy * step);

    holdTimeoutRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => {
        applyDelta(dx * step, dy * step);
      }, 85);
    }, 220);

    const stop = () => {
      clearHold();
      if (activeHoldRef.current) {
        activeHoldRef.current = false;
        const finalPos = `${posRef.current.x}% ${posRef.current.y}%`;
        if (onCommit) {
          void onCommit(finalPos);
        }
      }
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };

  const handleKeyDown = (dx: number, dy: number) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const nextStr = applyDelta(dx * step, dy * step);
      if (onCommit) {
        void onCommit(nextStr);
      }
    }
  };

  const handleCenter = () => {
    posRef.current = { x: 50, y: 50 };
    const centerStr = "50% 50%";
    onChange(centerStr);
    if (onCommit) {
      void onCommit(centerStr);
    }
  };

  return (
    <div className={cn("rounded-xl border border-border/70 bg-muted/20 p-3 space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">Move Header Image</p>
          <p className="text-[11px] text-muted-foreground">Tap or hold arrows to move Left, Right, Up, or Down</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background p-0.5">
          {[2, 5, 10].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded transition-colors",
                step === s
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={`Move ${s}% per click`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Remote D-Pad Controller */}
        <div
          className="relative grid grid-cols-3 grid-rows-3 gap-1.5 p-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-950 border border-white/10 shadow-lg select-none"
          role="group"
          aria-label="Header image position remote"
        >
          <div />
          <button
            type="button"
            onPointerDown={startHold(0, -1)}
            onKeyDown={handleKeyDown(0, -1)}
            aria-label="Move header image up"
            title="Move Up"
            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-primary hover:text-primary-foreground active:scale-95 text-white flex items-center justify-center border border-white/10 shadow transition-all touch-none"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <div />

          <button
            type="button"
            onPointerDown={startHold(-1, 0)}
            onKeyDown={handleKeyDown(-1, 0)}
            aria-label="Move header image left"
            title="Move Left"
            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-primary hover:text-primary-foreground active:scale-95 text-white flex items-center justify-center border border-white/10 shadow transition-all touch-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleCenter}
            aria-label="Center header image"
            title="Center (50% 50%)"
            className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center border border-white/20 shadow-inner transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onPointerDown={startHold(1, 0)}
            onKeyDown={handleKeyDown(1, 0)}
            aria-label="Move header image right"
            title="Move Right"
            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-primary hover:text-primary-foreground active:scale-95 text-white flex items-center justify-center border border-white/10 shadow transition-all touch-none"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div />
          <button
            type="button"
            onPointerDown={startHold(0, 1)}
            onKeyDown={handleKeyDown(0, 1)}
            aria-label="Move header image down"
            title="Move Down"
            className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-primary hover:text-primary-foreground active:scale-95 text-white flex items-center justify-center border border-white/10 shadow transition-all touch-none"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <div />
        </div>

        {/* Live Coordinates & Quick Presets */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Horizontal (X)</div>
              <div className="text-sm font-mono font-bold text-foreground">{x}%</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vertical (Y)</div>
              <div className="text-sm font-mono font-bold text-foreground">{y}%</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {[
              { label: "Top", pos: "50% 0%" },
              { label: "Center", pos: "50% 50%" },
              { label: "Bottom", pos: "50% 100%" },
              { label: "Left", pos: "0% 50%" },
              { label: "Right", pos: "100% 50%" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const parsed = parseImagePosition(preset.pos);
                  posRef.current = parsed;
                  onChange(preset.pos);
                  if (onCommit) void onCommit(preset.pos);
                }}
                className={cn(
                  "px-2 py-1 rounded-md border text-xs font-medium transition-colors",
                  `${x}% ${y}%` === preset.pos
                    ? "bg-primary/15 border-primary text-primary font-semibold"
                    : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
