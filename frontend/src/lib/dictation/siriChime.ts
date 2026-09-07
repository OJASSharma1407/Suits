/**
 * Web Audio API Synthesizer for macOS / iOS Siri Activation & Deactivation Chimes
 * Zero-dependency, offline-ready, studio-grade synthesized tones.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Plays the iconic ascending dual-tone Siri activation chime.
 * Tone 1: D5 (587.3 Hz)
 * Tone 2: A5 (880 Hz) with subtle high harmonic overtone (1760 Hz)
 */
export async function playSiriActivationChime(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // ─── First Tone: D5 (587.33 Hz) ───
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.085);

    // ─── Second Tone: A5 (880 Hz) + Overtone (1760 Hz) ───
    const start2 = now + 0.095;

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, start2);

    gain2.gain.setValueAtTime(0, start2);
    gain2.gain.linearRampToValueAtTime(0.25, start2 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Subtle bell shimmer overtone
    const oscOvertone = ctx.createOscillator();
    const gainOvertone = ctx.createGain();
    oscOvertone.type = "sine";
    oscOvertone.frequency.setValueAtTime(1760, start2);

    gainOvertone.gain.setValueAtTime(0, start2);
    gainOvertone.gain.linearRampToValueAtTime(0.05, start2 + 0.02);
    gainOvertone.gain.exponentialRampToValueAtTime(0.0005, start2 + 0.16);

    oscOvertone.connect(gainOvertone);
    gainOvertone.connect(ctx.destination);

    osc2.start(start2);
    osc2.stop(start2 + 0.23);
    oscOvertone.start(start2);
    oscOvertone.stop(start2 + 0.23);
  } catch {
    // Audio playback failure is gracefully ignored
  }
}

/**
 * Plays the soft descending dual-tone Siri deactivation/completion chime.
 * Tone 1: A5 (880 Hz)
 * Tone 2: D5 (587.33 Hz)
 */
export async function playSiriDeactivationChime(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // ─── First Tone: A5 (880 Hz) ───
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);

    // ─── Second Tone: D5 (587.33 Hz) ───
    const start2 = now + 0.085;

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(587.33, start2);

    gain2.gain.setValueAtTime(0, start2);
    gain2.gain.linearRampToValueAtTime(0.20, start2 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.18);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(start2);
    osc2.stop(start2 + 0.19);
  } catch {
    // Audio playback failure is gracefully ignored
  }
}
