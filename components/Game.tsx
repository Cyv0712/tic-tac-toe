"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useFeedback } from "@/hooks/useFeedback";
import { type FinishedStatus, useGame } from "@/hooks/useGame";
import type { Difficulty } from "@/lib/ai";
import type { Mark } from "@/lib/game";
import { defaultName } from "@/lib/labels";
import {
  type Mode,
  type Theme,
  updateSettings,
  useSettings,
} from "@/lib/settings";
import { unlockAudio } from "@/lib/sfx";
import { Board } from "./Board";
import { Confetti } from "./Confetti";
import { ScoreBoard } from "./ScoreBoard";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBanner } from "./StatusBanner";
import { Title } from "./Title";

const NO_SCORES = { X: 0, O: 0, draws: 0 };

export function Game() {
  const settings = useSettings();
  const { theme, mode, difficulty, humanMark } = settings;
  const vsComputer = mode === "ai";

  // Scores are saved the moment a game ends, under the mode it was played in.
  const onFinish = useCallback((result: FinishedStatus) => {
    updateSettings((s) => {
      const tally = s.scores[s.mode];
      const next =
        result.kind === "won"
          ? { ...tally, [result.winner]: tally[result.winner] + 1 }
          : { ...tally, draws: tally.draws + 1 };
      return { ...s, scores: { ...s.scores, [s.mode]: next } };
    });
  }, []);

  const game = useGame({ vsComputer, difficulty, humanMark, onFinish });
  const { status, computerMark, newGame } = game;

  const playerLost =
    status.kind === "won" && computerMark !== null && status.winner === computerMark;

  useFeedback({
    enabled: settings.sound,
    board: game.board,
    history: game.history,
    status,
    playerLost,
  });

  // Keep the page theme in step with the setting. An inline script in the
  // layout sets it before first paint; this covers changes after that.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // N starts a new game from anywhere except while typing a name.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      newGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newGame]);

  // --- Names and wording -------------------------------------------------
  const nameOf = (mark: Mark): string => {
    if (computerMark === mark) return "Computer";
    return settings.names[mark].trim() || defaultName(theme, mark);
  };
  const tally = settings.scores[mode];
  const hasScores = tally.X + tally.O + tally.draws > 0;
  const scoreNames: Record<Mark, string> = { X: nameOf("X"), O: nameOf("O") };

  /** "You" when the person hasn't picked a name for themselves. */
  const isUnnamedHuman = (mark: Mark) =>
    vsComputer && mark === humanMark && !settings.names[mark].trim();

  let statusText: string;
  let tone: Mark | "draw";
  let statusMark: Mark | null = null;
  if (status.kind === "won") {
    tone = status.winner;
    statusMark = status.winner;
    statusText = isUnnamedHuman(status.winner)
      ? "You win!"
      : `${nameOf(status.winner)} wins!`;
  } else if (status.kind === "draw") {
    tone = "draw";
    statusText = "It's a draw";
  } else {
    tone = status.next;
    statusMark = status.next;
    statusText = game.computerThinking
      ? "Computer is thinking"
      : isUnnamedHuman(status.next)
        ? "Your turn"
        : `${nameOf(status.next)}'s turn`;
  }

  // Confetti for a win the person would be happy about (any win in two-player).
  const burst = useMemo(
    () =>
      status.kind === "won" && !playerLost
        ? { id: game.gameId, winner: status.winner }
        : null,
    [status, playerLost, game.gameId],
  );

  // --- Setting changes ---------------------------------------------------
  // Changing who plays whom restarts the game; cosmetic changes don't.
  const setMode = (m: Mode) => {
    updateSettings((s) => ({ ...s, mode: m }));
    newGame();
  };
  const setHumanMark = (m: Mark) => {
    updateSettings((s) => ({ ...s, humanMark: m }));
    newGame();
  };
  const setDifficulty = (d: Difficulty) =>
    updateSettings((s) => ({ ...s, difficulty: d }));
  const setTheme = (t: Theme) => updateSettings((s) => ({ ...s, theme: t }));
  const setSound = (on: boolean) => {
    if (on) unlockAudio();
    updateSettings((s) => ({ ...s, sound: on }));
  };
  const setName = (mark: Mark, name: string) =>
    updateSettings((s) => ({ ...s, names: { ...s.names, [mark]: name } }));
  const resetScores = () =>
    updateSettings((s) => ({ ...s, scores: { ...s.scores, [s.mode]: NO_SCORES } }));

  return (
    <main className="stage" data-tone={tone} data-over={status.kind !== "playing" || undefined}>
      <div className="ambient" aria-hidden />
      <Confetti burst={burst} />

      <div className="layout">
        <header className="masthead">
          <Title />
          <p className="tagline">Take turns. Three in a row wins.</p>
        </header>

        <div className="area-score">
          <ScoreBoard
            theme={theme}
            names={scoreNames}
            tally={tally}
            active={game.turn}
          />
        </div>

        <section className="play" aria-label="Game">
          <StatusBanner
            text={statusText}
            theme={theme}
            tone={tone}
            mark={statusMark}
            thinking={game.computerThinking}
          />
          <Board
            board={game.board}
            theme={theme}
            status={status}
            interactive={game.humanCanMove}
            onPlay={game.play}
          />
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={newGame}>
              New Game
            </button>
            <button
              type="button"
              className="btn"
              onClick={game.undo}
              disabled={!game.canUndo}
            >
              Undo
            </button>
          </div>
          <p className="hint">
            Arrow keys move around the board. Enter or Space places a mark. N
            starts a new game.
          </p>
        </section>

        <div className="area-settings">
          <SettingsPanel
            settings={settings}
            onMode={setMode}
            onHumanMark={setHumanMark}
            onDifficulty={setDifficulty}
            onTheme={setTheme}
            onSound={setSound}
            onName={setName}
            hasScores={hasScores}
            onResetScores={resetScores}
          />
        </div>
      </div>
    </main>
  );
}
