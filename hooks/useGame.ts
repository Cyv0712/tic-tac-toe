"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { type Difficulty, chooseMove } from "@/lib/ai";
import {
  type Board,
  type GameStatus,
  type Mark,
  applyMove,
  emptyBoard,
  getStatus,
  nextMark,
  other,
} from "@/lib/game";

type State = {
  board: Board;
  /** Cell indexes in the order they were played. */
  history: number[];
  /** Changes on every new game, so one-off effects can tell games apart. */
  gameId: number;
};

type Action =
  | { type: "move"; index: number }
  | { type: "undo"; keep: number }
  | { type: "reset" };

const initialState: State = { board: emptyBoard(), history: [], gameId: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "move": {
      const board = applyMove(state.board, action.index, nextMark(state.board));
      if (board === state.board) return state;
      return { ...state, board, history: [...state.history, action.index] };
    }
    case "undo": {
      if (getStatus(state.board).kind !== "playing") return state;
      if (action.keep < 0 || action.keep >= state.history.length) return state;
      const history = state.history.slice(0, action.keep);
      let board = emptyBoard();
      for (const index of history) {
        board = applyMove(board, index, nextMark(board));
      }
      return { ...state, board, history };
    }
    case "reset":
      return { board: emptyBoard(), history: [], gameId: state.gameId + 1 };
  }
}

export type FinishedStatus = Exclude<GameStatus, { kind: "playing" }>;

type Options = {
  /** Solo (against the computer) or two players on one device. */
  vsComputer: boolean;
  difficulty: Difficulty;
  /** The mark the person plays when facing the computer. */
  humanMark: Mark;
  /** Called once per finished game. */
  onFinish: (status: FinishedStatus, gameId: number) => void;
};

/** How long the computer "thinks" so its reply doesn't feel instant. */
const THINK_MS = { min: 420, spread: 380 };

export function useGame({
  vsComputer,
  difficulty,
  humanMark,
  onFinish,
}: Options) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { board, history, gameId } = state;

  const status = useMemo(() => getStatus(board), [board]);
  const computerMark: Mark | null = vsComputer ? other(humanMark) : null;
  const turn = status.kind === "playing" ? status.next : null;
  const computerThinking = turn !== null && turn === computerMark;
  const humanCanMove = status.kind === "playing" && !computerThinking;

  // The computer replies after a short pause. Any state change (undo, new
  // game, finishing the game) clears the pending move.
  useEffect(() => {
    if (!computerThinking || computerMark === null) return;
    const delay = THINK_MS.min + Math.random() * THINK_MS.spread;
    const timer = window.setTimeout(() => {
      dispatch({
        type: "move",
        index: chooseMove(board, computerMark, difficulty),
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [computerThinking, computerMark, board, difficulty]);

  // Report each finished game exactly once, even if callbacks change.
  const reported = useRef(-1);
  useEffect(() => {
    if (status.kind === "playing" || reported.current === gameId) return;
    reported.current = gameId;
    onFinish(status, gameId);
  }, [status, gameId, onFinish]);

  const play = useCallback(
    (index: number) => {
      if (humanCanMove) dispatch({ type: "move", index });
    },
    [humanCanMove],
  );

  const newGame = useCallback(() => dispatch({ type: "reset" }), []);

  // Undo rewinds to the person's last turn: one move when playing a friend,
  // and the computer's reply too when playing the computer.
  const undoTo = useMemo(() => {
    if (status.kind !== "playing") return null;
    for (let keep = history.length - 1; keep >= 0; keep--) {
      const mark: Mark = keep % 2 === 0 ? "X" : "O";
      if (!vsComputer || mark === humanMark) return keep;
    }
    return null;
  }, [status.kind, history.length, vsComputer, humanMark]);

  const undo = useCallback(() => {
    if (undoTo !== null) dispatch({ type: "undo", keep: undoTo });
  }, [undoTo]);

  return {
    board,
    history,
    gameId,
    status,
    turn,
    computerMark,
    computerThinking,
    humanCanMove,
    canUndo: undoTo !== null,
    play,
    newGame,
    undo,
  };
}
