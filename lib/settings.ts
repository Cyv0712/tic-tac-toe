import { useSyncExternalStore } from "react";
import type { Difficulty } from "./ai";
import { STORAGE_KEY } from "./boot";
import type { Mark } from "./game";

export type Theme = "neon" | "notebook" | "pets";
export type Mode = "pvp" | "ai";
export type Tally = { X: number; O: number; draws: number };

export type Settings = {
  theme: Theme;
  mode: Mode;
  difficulty: Difficulty;
  /** Which mark the person plays when facing the computer. */
  humanMark: Mark;
  /** Sound effects and vibration. Off until the player turns it on. */
  sound: boolean;
  names: Record<Mark, string>;
  /** Scores are kept per mode so solo games don't mix into two-player ones. */
  scores: Record<Mode, Tally>;
};

export const NAME_MAX_LENGTH = 14;

const NO_SCORES: Tally = { X: 0, O: 0, draws: 0 };

export const DEFAULT_SETTINGS: Settings = {
  theme: "neon",
  mode: "pvp",
  difficulty: "hard",
  humanMark: "X",
  sound: false,
  names: { X: "", O: "" },
  scores: { pvp: NO_SCORES, ai: NO_SCORES },
};

const THEMES: readonly Theme[] = ["neon", "notebook", "pets"];
const MODES: readonly Mode[] = ["pvp", "ai"];
const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

const count = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

const tally = (v: unknown): Tally => {
  const t = (v ?? {}) as Partial<Record<keyof Tally, unknown>>;
  return { X: count(t.X), O: count(t.O), draws: count(t.draws) };
};

const name = (v: unknown): string =>
  typeof v === "string" ? v.slice(0, NAME_MAX_LENGTH) : "";

/** Anything in localStorage could be stale or hand-edited, so trust nothing. */
function sanitize(raw: unknown): Settings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const names = (r.names ?? {}) as Record<string, unknown>;
  const scores = (r.scores ?? {}) as Record<string, unknown>;
  return {
    theme: THEMES.includes(r.theme as Theme)
      ? (r.theme as Theme)
      : DEFAULT_SETTINGS.theme,
    mode: MODES.includes(r.mode as Mode)
      ? (r.mode as Mode)
      : DEFAULT_SETTINGS.mode,
    difficulty: DIFFICULTIES.includes(r.difficulty as Difficulty)
      ? (r.difficulty as Difficulty)
      : DEFAULT_SETTINGS.difficulty,
    humanMark: r.humanMark === "O" ? "O" : "X",
    sound: r.sound === true,
    names: { X: name(names.X), O: name(names.O) },
    scores: { pvp: tally(scores.pvp), ai: tally(scores.ai) },
  };
}

function read(): Settings {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? sanitize(JSON.parse(stored)) : DEFAULT_SETTINGS;
  } catch {
    // Private mode, blocked storage or corrupt JSON: play with defaults.
    return DEFAULT_SETTINGS;
  }
}

let cache: Settings | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function getSnapshot(): Settings {
  if (cache === null) cache = read();
  return cache;
}

/** The server (and the first hydration pass) always sees the defaults. */
const getServerSnapshot = (): Settings => DEFAULT_SETTINGS;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cache = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Applies `change` to the latest settings, saves them and notifies readers. */
export function updateSettings(change: (s: Settings) => Settings): void {
  cache = change(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable: the change still applies for this visit.
  }
  emit();
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
