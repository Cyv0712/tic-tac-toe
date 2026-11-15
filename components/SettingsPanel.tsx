"use client";

import { useEffect, useRef, useState } from "react";
import type { Difficulty } from "@/lib/ai";
import type { Mark } from "@/lib/game";
import { defaultName, markWord } from "@/lib/labels";
import {
  NAME_MAX_LENGTH,
  type Mode,
  type Settings,
  type Theme,
} from "@/lib/settings";
import { Segmented } from "./Segmented";

type Props = {
  settings: Settings;
  onMode: (mode: Mode) => void;
  onHumanMark: (mark: Mark) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onTheme: (theme: Theme) => void;
  onSound: (on: boolean) => void;
  onName: (mark: Mark, name: string) => void;
  /** Whether the current mode has any scores to clear. */
  hasScores: boolean;
  onResetScores: () => void;
};

const CONFIRM_MS = 3000;

export function SettingsPanel({
  settings,
  onMode,
  onHumanMark,
  onDifficulty,
  onTheme,
  onSound,
  onName,
  hasScores,
  onResetScores,
}: Props) {
  const { theme, mode, humanMark } = settings;
  const solo = mode === "ai";

  // Clearing scores can't be undone, so ask for a second click.
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const resetScores = () => {
    if (!confirming) {
      setConfirming(true);
      timer.current = window.setTimeout(() => setConfirming(false), CONFIRM_MS);
      return;
    }
    window.clearTimeout(timer.current);
    setConfirming(false);
    onResetScores();
  };

  const nameField = (mark: Mark, label: string) => (
    <label className="field name-field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        value={settings.names[mark]}
        maxLength={NAME_MAX_LENGTH}
        placeholder={defaultName(theme, mark)}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onName(mark, e.target.value)}
      />
    </label>
  );

  return (
    <section className="settings" aria-labelledby="settings-title">
      <h2 id="settings-title" className="section-title">
        Setup
      </h2>

      <Segmented
        legend="Opponent"
        value={mode}
        onChange={onMode}
        options={[
          { value: "pvp", label: "A friend" },
          { value: "ai", label: "The computer" },
        ]}
      />

      {solo && (
        <>
          <Segmented
            legend="Difficulty"
            value={settings.difficulty}
            onChange={onDifficulty}
            options={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Unbeatable" },
            ]}
          />
          <Segmented
            legend="You play"
            value={humanMark}
            onChange={onHumanMark}
            options={[
              { value: "X", label: `${markWord(theme, "X")} (goes first)` },
              { value: "O", label: markWord(theme, "O") },
            ]}
          />
        </>
      )}

      <div className="names">
        {solo ? (
          nameField(humanMark, "Your name")
        ) : (
          <>
            {nameField("X", `${markWord(theme, "X")} player`)}
            {nameField("O", `${markWord(theme, "O")} player`)}
          </>
        )}
      </div>

      <Segmented
        legend="Look"
        value={theme}
        onChange={onTheme}
        options={[
          { value: "neon", label: "Neon" },
          { value: "notebook", label: "Notebook" },
          { value: "pets", label: "Cats & dogs" },
        ]}
      />

      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={settings.sound}
        onClick={() => onSound(!settings.sound)}
      >
        <span className="switch-track" aria-hidden>
          <span className="switch-thumb" />
        </span>
        <span>Sound and vibration</span>
      </button>

      <button
        type="button"
        className="link-button"
        onClick={resetScores}
        disabled={!hasScores}
        data-confirm={confirming || undefined}
      >
        {confirming ? "Click again to clear scores" : "Reset scores"}
      </button>
    </section>
  );
}
