import type { Mark } from "./game";

/**
 * Tiny synthesised sound effects (no audio files to download). Every sound is
 * a reaction to something the player just did, so browsers allow it. The
 * AudioContext is created lazily and reused.
 */

type Wave = OscillatorType;

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = {
  /** Start and end frequency in Hz, so a note can glide. */
  from: number;
  to?: number;
  /** Seconds after the sound starts. */
  at: number;
  length: number;
  wave: Wave;
  volume?: number;
};

function play(notes: Note[]): void {
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime + 0.01;
  for (const n of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t0 = start + n.at;
    const t1 = t0 + n.length;
    osc.type = n.wave;
    osc.frequency.setValueAtTime(n.from, t0);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t1);
    // A quick attack and exponential release avoids clicks at either end.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(n.volume ?? 0.07, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is a nicety. Ignore browsers that refuse it.
  }
}

/** Call from a click handler so the browser lets audio start. */
export function unlockAudio(): void {
  getContext();
}

export const sfx = {
  place(mark: Mark): void {
    play(
      mark === "X"
        ? [{ from: 520, to: 780, at: 0, length: 0.11, wave: "square" }]
        : [{ from: 392, to: 262, at: 0, length: 0.14, wave: "triangle", volume: 0.12 }],
    );
    buzz(12);
  },
  win(): void {
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    play(
      arpeggio.map((f, i) => ({
        from: f,
        at: i * 0.1,
        length: i === arpeggio.length - 1 ? 0.45 : 0.12,
        wave: "square" as const,
        volume: 0.06,
      })),
    );
    buzz([30, 50, 30, 50, 80]);
  },
  draw(): void {
    play([
      { from: 330, at: 0, length: 0.18, wave: "sawtooth", volume: 0.045 },
      { from: 262, at: 0.18, length: 0.3, wave: "sawtooth", volume: 0.045 },
    ]);
    buzz([40, 40]);
  },
  tick(): void {
    play([{ from: 220, to: 180, at: 0, length: 0.05, wave: "square", volume: 0.04 }]);
  },
};
