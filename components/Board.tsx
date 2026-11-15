"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { Board as BoardType, GameStatus, Line, Mark as MarkType } from "@/lib/game";
import type { Theme } from "@/lib/settings";
import { markWord } from "@/lib/labels";
import { Mark } from "./Mark";

type Props = {
  board: BoardType;
  theme: Theme;
  status: GameStatus;
  /** Whether the person can place a mark right now. */
  interactive: boolean;
  onPlay: (index: number) => void;
};

const center = (i: number): [number, number] => [
  (i % 3) * 100 + 50,
  Math.floor(i / 3) * 100 + 50,
];

/** The winning line, extended a little past the first and last cell. */
function winLinePath(line: Line): string {
  const [x0, y0] = center(line[0]);
  const [x1, y1] = center(line[2]);
  const length = Math.hypot(x1 - x0, y1 - y0);
  const dx = (x1 - x0) / length;
  const dy = (y1 - y0) / length;
  const reach = 36;
  return `M${x0 - dx * reach} ${y0 - dy * reach} L${x1 + dx * reach} ${y1 + dy * reach}`;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function Board({ board, theme, status, interactive, onPlay }: Props) {
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  // Roving tabindex: the board is one tab stop, arrow keys move within it.
  const [focused, setFocused] = useState(4);

  const winLine = status.kind === "won" ? status.line : null;
  const next: MarkType | null = status.kind === "playing" ? status.next : null;

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = ARROWS[e.key];
    if (!delta) return;
    e.preventDefault();
    const row = Math.min(2, Math.max(0, Math.floor(focused / 3) + delta[0]));
    const col = Math.min(2, Math.max(0, (focused % 3) + delta[1]));
    const target = row * 3 + col;
    setFocused(target);
    cells.current[target]?.focus();
  };

  return (
    <div
      className="board"
      role="group"
      aria-label="Tic-Tac-Toe board"
      data-over={status.kind !== "playing" ? status.kind : undefined}
      onKeyDown={move}
    >
      {/* The sign's unlit frame. */}
      <svg className="board-grid" viewBox="0 0 300 300" aria-hidden focusable={false}>
        {["M100 16 V284", "M200 16 V284", "M16 100 H284", "M16 200 H284"].map(
          (d) => (
            <path key={d} d={d} />
          ),
        )}
      </svg>

      <div className="board-cells">
        {board.map((value, i) => {
          const playable = interactive && value === null;
          const winning = winLine?.includes(i) ?? false;
          const label = `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${
            value ? markWord(theme, value) : "empty"
          }`;
          return (
            <button
              key={i}
              ref={(el) => {
                cells.current[i] = el;
              }}
              type="button"
              className="cell"
              aria-label={label}
              aria-disabled={!playable}
              data-win={winning ? "" : undefined}
              data-dim={winLine && !winning ? "" : undefined}
              data-next={playable && next ? next : undefined}
              tabIndex={focused === i ? 0 : -1}
              onFocus={() => setFocused(i)}
              onClick={() => playable && onPlay(i)}
            >
              {value ? (
                <Mark kind={value} theme={theme} animate />
              ) : (
                playable &&
                next && (
                  <span className="ghost">
                    <Mark kind={next} theme={theme} />
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {winLine && status.kind === "won" && (
        <svg
          className="win-line"
          viewBox="0 0 300 300"
          data-kind={status.winner}
          data-theme-skin={theme}
          aria-hidden
          focusable={false}
        >
          <path className="tube" d={winLinePath(winLine)} pathLength={1} />
          {theme === "neon" && (
            <path className="core" d={winLinePath(winLine)} pathLength={1} />
          )}
        </svg>
      )}
    </div>
  );
}
