import { useCallback } from "react";
import { useActiveTheme } from "../ThemeEngineContext";

interface CelebrationOrigin {
  x?: number;
  y?: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape: "circle" | "star" | "bat" | "petal";
}

/**
 * Hook providing a seasonal celebration burst when completing a task or milestone.
 * Spawns themed particles (bats & embers for Halloween, firework stars for July 4th,
 * glittering snowflakes for Winter, cherry blossom petals for Spring, sapphire sparks for Neutral).
 */
export function useSeasonalCelebration() {
  const { activeTheme, effectivePreferences } = useActiveTheme();

  const triggerCelebration = useCallback(
    (origin: CelebrationOrigin = {}) => {
      if (typeof window === "undefined" || effectivePreferences.reduceMotion) return;

      const startX = origin.x ?? window.innerWidth / 2;
      const startY = origin.y ?? window.innerHeight / 2;

      // Create overlay canvas
      const canvas = document.createElement("canvas");
      canvas.className = "seasonal-celebration-fx pointer-events-none fixed inset-0 w-full h-full";
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;z-index:950;";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        document.body.removeChild(canvas);
        return;
      }

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const themeKey = activeTheme.themeKey;
      let colors = ["#3b82f6", "#60a5fa", "#ffffff", "#818cf8"];
      let shape: "circle" | "star" | "bat" | "petal" = "circle";

      if (themeKey === "halloween-2026") {
        colors = ["#ff7a1a", "#7b2cff", "#ff0055", "#00ffcc", "#ffbe0b"];
        shape = "bat";
      } else if (themeKey === "patriotic-july4") {
        colors = ["#dc2626", "#2563eb", "#ffffff", "#fbbf24", "#38bdf8"];
        shape = "star";
      } else if (themeKey === "winter-wonderland-2026") {
        colors = ["#38bdf8", "#ffffff", "#f59e0b", "#059669", "#bae6fd"];
        shape = "star";
      } else if (themeKey === "spring-bloom-2026") {
        colors = ["#f472b6", "#ec4899", "#fbcfe8", "#ffffff", "#86efac"];
        shape = "petal";
      }

      const count = effectivePreferences.lowPerformanceMode ? 30 : 65;
      const particles: Spark[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
          gravity: 0.22,
          shape: Math.random() > 0.6 ? shape : "circle",
        });
      }

      let animId: number;

      const drawStar = (c: CanvasRenderingContext2D, p: Spark) => {
        c.save();
        c.translate(p.x, p.y);
        c.fillStyle = p.color;
        c.globalAlpha = p.alpha;
        c.beginPath();
        for (let j = 0; j < 5; j++) {
          c.lineTo(Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size);
          c.lineTo(Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2));
        }
        c.closePath();
        c.fill();
        c.restore();
      };

      const drawMiniBat = (c: CanvasRenderingContext2D, p: Spark) => {
        c.save();
        c.translate(p.x, p.y);
        c.fillStyle = p.color;
        c.globalAlpha = p.alpha;
        c.beginPath();
        c.ellipse(0, 0, p.size * 0.4, p.size * 0.6, 0, 0, Math.PI * 2);
        c.moveTo(-p.size * 0.3, 0);
        c.quadraticCurveTo(-p.size * 1.1, -p.size * 0.8, -p.size * 1.5, 0);
        c.quadraticCurveTo(-p.size * 1.1, p.size * 0.4, -p.size * 0.2, p.size * 0.4);
        c.moveTo(p.size * 0.3, 0);
        c.quadraticCurveTo(p.size * 1.1, -p.size * 0.8, p.size * 1.5, 0);
        c.quadraticCurveTo(p.size * 1.1, p.size * 0.4, p.size * 0.2, p.size * 0.4);
        c.fill();
        c.restore();
      };

      const drawPetal = (c: CanvasRenderingContext2D, p: Spark) => {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.vx * 0.1);
        c.fillStyle = p.color;
        c.globalAlpha = p.alpha;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(p.size * 0.8, -p.size * 0.8, p.size * 1.5, -p.size * 0.3, p.size * 1.2, p.size * 0.5);
        c.bezierCurveTo(p.size * 0.8, p.size * 1.2, 0, p.size * 0.8, 0, 0);
        c.fill();
        c.restore();
      };

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeCount = 0;

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.98;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            activeCount++;
            if (p.shape === "star") {
              drawStar(ctx, p);
            } else if (p.shape === "bat") {
              drawMiniBat(ctx, p);
            } else if (p.shape === "petal") {
              drawPetal(ctx, p);
            } else {
              ctx.save();
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        if (activeCount > 0) {
          animId = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(animId);
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
      };

      animId = requestAnimationFrame(animate);
    },
    [activeTheme.themeKey, effectivePreferences.reduceMotion, effectivePreferences.lowPerformanceMode]
  );

  return { triggerCelebration };
}
