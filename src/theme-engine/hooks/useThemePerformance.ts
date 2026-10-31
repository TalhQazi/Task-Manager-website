import { useState, useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  currentFps: number;
  isPerformanceDegraded: boolean;
  isMobile: boolean;
  computedParticleCap: number;
  reportRenderLatency: (ms: number) => void;
}

interface UseThemePerformanceOptions {
  manifestDesktopParticles?: number;
  manifestMobileParticles?: number;
  lowPerformanceMode?: boolean;
}

/**
 * Hook to continuously measure frame rate, detect low-end devices or mobile environments,
 * throttle particle capacity (max 18-25 on mobile), and auto-degrade animations if average
 * FPS drops below 45 for 3 consecutive seconds.
 */
export function useThemePerformance({
  manifestDesktopParticles = 35,
  manifestMobileParticles = 18,
  lowPerformanceMode = false,
}: UseThemePerformanceOptions = {}): PerformanceMetrics {
  const [currentFps, setCurrentFps] = useState<number>(60);
  const [isPerformanceDegraded, setIsPerformanceDegraded] = useState<boolean>(lowPerformanceMode);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const lowFpsDurationRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Resize listener to update mobile breakpoint state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Frame rate measurement loop
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isSubscribed = true;

    const measureLoop = (now: number) => {
      if (!isSubscribed) return;

      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        const instantFps = 1000 / delta;
        const history = frameTimesRef.current;
        history.push(instantFps);

        // Keep last 60 frames
        if (history.length > 60) {
          history.shift();
        }

        // Calculate rolling average
        const sum = history.reduce((acc, val) => acc + val, 0);
        const avgFps = Math.round(sum / history.length);

        // Evaluate once per second
        if (history.length >= 30) {
          setCurrentFps(avgFps);

          // Check if FPS is below 45
          if (avgFps < 45) {
            lowFpsDurationRef.current += delta;
            // If below 45 for 3000ms (3 seconds), trigger dynamic degradation
            if (lowFpsDurationRef.current >= 3000 && !isPerformanceDegraded) {
              console.warn(
                `[ThemeEngine] Sustained low FPS (${avgFps} < 45 for 3s). Auto-throttling seasonal animations.`
              );
              setIsPerformanceDegraded(true);
            }
          } else {
            // Gradually recover low FPS duration if back above 50
            if (avgFps > 50) {
              lowFpsDurationRef.current = Math.max(0, lowFpsDurationRef.current - delta * 0.5);
              if (lowFpsDurationRef.current === 0 && isPerformanceDegraded && !lowPerformanceMode) {
                setIsPerformanceDegraded(false);
              }
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(measureLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(measureLoop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPerformanceDegraded, lowPerformanceMode]);

  const reportRenderLatency = useCallback((ms: number) => {
    if (ms > 35 && !isPerformanceDegraded) {
      setIsPerformanceDegraded(true);
    }
  }, [isPerformanceDegraded]);

  // Dynamic particle count computation:
  // Mobile capped at max 18-25. If performance is degraded, cut by half or down to zero.
  const baseCount = isMobile
    ? Math.min(22, manifestMobileParticles)
    : manifestDesktopParticles;

  const computedParticleCap = isPerformanceDegraded
    ? Math.floor(baseCount * 0.35)
    : baseCount;

  return {
    currentFps,
    isPerformanceDegraded: isPerformanceDegraded || lowPerformanceMode,
    isMobile,
    computedParticleCap,
    reportRenderLatency,
  };
}
