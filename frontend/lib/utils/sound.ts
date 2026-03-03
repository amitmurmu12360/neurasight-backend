/**
 * Sound Effects Utility
 * Provides simple sound effects for UI interactions using Web Audio API
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize AudioContext (lazy initialization)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a high-frequency clean UI sound (ping) for portal openings
 */
export function playPing(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // High-frequency clean tone (880 Hz - A5 note)
    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    // Quick attack, quick decay
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (error) {
    // Silently fail if audio is not available
    console.debug("Audio playback failed:", error);
  }
}

/**
 * Play a deep bass pulse for decision selection
 */
export function playThrum(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Deep bass tone (110 Hz - A2 note)
    oscillator.frequency.value = 110;
    oscillator.type = "sine";

    // Slow attack, sustained pulse
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {
    // Silently fail if audio is not available
    console.debug("Audio playback failed:", error);
  }
}
