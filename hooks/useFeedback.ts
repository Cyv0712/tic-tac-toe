"use client";

import { useEffect, useRef } from "react";
import type { Board, GameStatus } from "@/lib/game";
import { sfx } from "@/lib/sfx";

type Options = {
  enabled: boolean;
  board: Board;
  history: number[];
  status: GameStatus;
  /** True when the computer just beat the person, so the jingle is a sad one. */
  playerLost: boolean;
};

/** Plays a sound (and a buzz on phones) whenever the move count changes. */
export function useFeedback({
  enabled,
  board,
  history,
  status,
  playerLost,
}: Options) {
  const previous = useRef(0);

  useEffect(() => {
    const before = previous.current;
    const now = history.length;
    previous.current = now;
    if (!enabled || now === before) return;

    if (now < before) {
      sfx.tick();
    } else if (status.kind === "won") {
      if (playerLost) sfx.draw();
      else sfx.win();
    } else if (status.kind === "draw") {
      sfx.draw();
    } else {
      const mark = board[history[now - 1]];
      if (mark) sfx.place(mark);
    }
  }, [enabled, board, history, status, playerLost]);
}
