/**
 * Web Audio API Gentle Chime Synthesizer
 * Generates an organic, calming dual-tone bell (528 Hz -> 660 Hz Solfeggio harmony)
 * with soft exponential decay, perfectly suited for healthcare reminder environments.
 */
class SoundService {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playBreakChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.25, now);

      // Primary gentle tone (528 Hz - Solfeggio restorative frequency)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      osc1.frequency.exponentialRampToValueAtTime(528, now + 1.2);

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Secondary harmonic overtone (660 Hz - Pure Major Third)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 1.5);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc1.start(now);
      osc2.start(now + 0.15);
      osc1.stop(now + 1.3);
      osc2.stop(now + 1.6);
    } catch (err) {
      console.warn('Web Audio chime playback suppressed or not permitted:', err);
    }
  }
}

export const soundService = new SoundService();
