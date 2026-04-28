/**
 * Reward System Sensory Feedback Service
 * Handles audio synthesis and haptic feedback
 */
class RewardService {
  private audioContext: AudioContext | null = null;

  /**
   * Play a subtle, harmonic reward sound using Web Audio API
   * This avoids needing external assets and ensures instant playback.
   */
  async playRewardSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Create a harmonic series for a "sparkle" sound
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major)
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.6);
      });
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }

  /**
   * Trigger haptic feedback if supported (primarily mobile)
   */
  triggerHaptic() {
    if ("vibrate" in navigator) {
      // Modern pattern: Soft double pulse
      navigator.vibrate([10, 30, 10]);
    }
  }
}

export const rewardService = new RewardService();
