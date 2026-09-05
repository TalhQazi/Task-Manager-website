import React, { useState, useEffect } from "react";
import { TransientEffectType } from "../types";

interface TransientEffectsProps {
  effectType: TransientEffectType;
  intervalSeconds?: number;
  enabled?: boolean;
  assetUrl?: string | null;
}

export const TransientEffects: React.FC<TransientEffectsProps> = ({
  effectType,
  intervalSeconds = 40,
  enabled = true,
  assetUrl,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState<"left-to-right" | "right-to-left">("left-to-right");
  const [verticalPos, setVerticalPos] = useState(25); // percentage

  useEffect(() => {
    if (!enabled || effectType === "none") {
      setIsActive(false);
      return;
    }

    // Schedule next transient effect trigger
    const scheduleNext = () => {
      const delayMs = (intervalSeconds * 0.7 + Math.random() * intervalSeconds * 0.6) * 1000;
      return setTimeout(() => {
        setDirection(Math.random() > 0.5 ? "left-to-right" : "right-to-left");
        setVerticalPos(15 + Math.random() * 55);
        setIsActive(true);

        // Hide after animation finishes (e.g. 7s)
        setTimeout(() => {
          setIsActive(false);
        }, 7000);
      }, delayMs);
    };

    let timer = scheduleNext();

    const intervalId = setInterval(() => {
      if (!isActive) {
        clearTimeout(timer);
        timer = scheduleNext();
      }
    }, (intervalSeconds + 10) * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [effectType, intervalSeconds, enabled, isActive]);

  if (!enabled || effectType === "none" || !isActive) {
    return null;
  }

  const defaultGhostSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><path d="M80,20 C50,20 40,50 40,90 C40,120 55,140 65,130 C75,120 85,135 95,125 C105,115 120,130 120,90 C120,50 110,20 80,20 Z" fill="%23ffffff" opacity="0.6" filter="blur(1px)"/><circle cx="65" cy="65" r="7" fill="%23120b22"/><circle cx="95" cy="65" r="7" fill="%23120b22"/><ellipse cx="80" cy="90" rx="8" ry="13" fill="%23120b22"/></svg>`;

  const imageSrc = assetUrl || defaultGhostSvg;

  return (
    <div
      className="transient-foreground-layer pointer-events-none select-none fixed inset-0 overflow-hidden"
      style={{
        zIndex: 120, // Layer 9: Transient foreground effects
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      <div
        className={`transient-sprite absolute ${
          direction === "left-to-right" ? "animate-ghost-ltr" : "animate-ghost-rtl"
        }`}
        style={{
          top: `${verticalPos}%`,
          width: 140,
          height: 140,
        }}
      >
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          style={{
            transform: direction === "right-to-left" ? "scaleX(-1)" : "none",
          }}
        />
      </div>

      <style>{`
        @keyframes ghost-ltr {
          0% {
            transform: translateX(-160px) translateY(0px) scale(0.9);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          50% {
            transform: translateX(50vw) translateY(-25px) scale(1.05);
            opacity: 0.85;
          }
          85% {
            opacity: 0.75;
          }
          100% {
            transform: translateX(calc(100vw + 160px)) translateY(15px) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes ghost-rtl {
          0% {
            transform: translateX(calc(100vw + 160px)) translateY(0px) scale(0.9);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          50% {
            transform: translateX(50vw) translateY(-25px) scale(1.05);
            opacity: 0.85;
          }
          85% {
            opacity: 0.75;
          }
          100% {
            transform: translateX(-160px) translateY(15px) scale(0.9);
            opacity: 0;
          }
        }

        .animate-ghost-ltr {
          animation: ghost-ltr 6.5s ease-in-out forwards;
        }

        .animate-ghost-rtl {
          animation: ghost-rtl 6.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};
