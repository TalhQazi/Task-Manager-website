import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface TaskCompletionEffectProps {
  x: number;
  y: number;
  onComplete: () => void;
  settings: {
    animationsEnabled: boolean;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
}

export const TaskCompletionEffect: React.FC<TaskCompletionEffectProps> = ({
  x,
  y,
  onComplete,
  settings,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 1. Trigger Haptics (Mobile)
    if (settings.hapticsEnabled && "vibrate" in navigator) {
      navigator.vibrate(40); // 40ms light impact
    }

    // 2. Trigger Audio (Web Audio API)
    if (settings.soundEnabled) {
      playCompletionSound();
    }

    // 3. Cleanup after animation duration (1200ms)
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const playCompletionSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Ascending frequency: mid-high (600Hz to 900Hz)
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);

      // Glassy/Harmonic texture via a second oscillator or quick decay
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05); // Very low volume
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  };

  if (!settings.animationsEnabled || !isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* 1. Pulse Ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        style={{ width: 40, height: 40, margin: -20 }}
      />

      {/* 2. Completion Glow */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 0.4, 0] }}
        transition={{ duration: 1.2, times: [0, 0.3, 1] }}
        className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
        style={{ width: 80, height: 80, margin: -40 }}
      />

      {/* 3. Precision Checkmark Lock-in */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.2, 1], rotate: 0 }}
        transition={{ duration: 0.4, ease: "backOut" }}
        className="flex items-center justify-center text-primary"
      >
        <div className="bg-white rounded-full p-1 shadow-lg border border-primary/10">
          <Check className="w-6 h-6 stroke-[3px]" />
        </div>
      </motion.div>

      {/* 4. Subtle Particle Fade */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="absolute w-1 h-1 bg-primary/40 rounded-full"
        />
      ))}
    </div>
  );
};
