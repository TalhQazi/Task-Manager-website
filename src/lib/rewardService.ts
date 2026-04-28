/**
 * Service for the Task Completion Reward System
 * Handles Audio (Web Audio API) and Haptics (Vibration API)
 */

export const REWARD_ANIMATIONS = {
  PULSE: "pulse",
  CHECKMARK: "checkmark",
  GLOW: "glow",
  SPARKLES: "sparkles",
};

interface RewardConfig {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const playRewardSound = (config: RewardConfig) => {
  if (!config.soundEnabled) return;

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine"; // Harmonic/Glass texture
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5 (Ascending)

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (error) {
    console.warn("Audio playback failed:", error);
  }
};

export const triggerHapticFeedback = (config: RewardConfig) => {
  if (!config.hapticsEnabled || !navigator.vibrate) return;

  try {
    // 30-50ms light impact
    navigator.vibrate(40);
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
  }
};

export const triggerRewardEffects = (config: RewardConfig) => {
  playRewardSound(config);
  triggerHapticFeedback(config);
};
