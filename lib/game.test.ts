import { describe, expect, it } from "vitest";
import {
  type Board,
  type Cell,
  WINNING_LINES,
  applyMove,
  calculateWinner,
  emptyBoard,
  getStatus,
  nextMark,
} from "./game";

const board = (s: string): Board =>
  s
    .replace(/\s/g, "")
    .split("")
    .map((c): Cell => (c === "X" || c === "O" ? c : null));

describe("calculateWinner", () => {
  it("returns null for an empty board", () => {
    expect(calculateWinner(emptyBoard())).toBeNull();
  });

  it.each(WINNING_LINES.map((line) => [line.join("-"), line] as const))(
    "detects a win on line %s for both marks",
    (_name, line) => {
      for (const mark of ["X", "O"] as const) {
        const cells = Array<Cell>(9).fill(null);
        for (const i of line) cells[i] = mark;
        expect(calculateWinner(cells)).toEqual({ winner: mark, line });
      }
    },
  );

  it("does not call two-in-a-row a win", () => {
    expect(calculateWinner(board("XX. OO. ..."))).toBeNull();
  });
});

describe("getStatus", () => {
  it("reports whose turn it is", () => {
    expect(getStatus(emptyBoard())).toEqual({ kind: "playing", next: "X" });
    expect(getStatus(board("X.. ... ..."))).toEqual({
      kind: "playing",
      next: "O",
    });
  });

  it("reports a draw on a full board with no winner", () => {
    expect(getStatus(board("XOX XOO OXX"))).toEqual({ kind: "draw" });
  });

  it("prefers a win over a full board", () => {
    const status = getStatus(board("XXX OOX OXO"));
    expect(status).toMatchObject({ kind: "won", winner: "X" });
  });
});

describe("nextMark", () => {
  it("alternates starting with X", () => {
    let b = emptyBoard();
    const seen: string[] = [];
    for (const i of [0, 4, 1, 3]) {
      const mark = nextMark(b);
      seen.push(mark);
      b = applyMove(b, i, mark);
    }
    expect(seen).toEqual(["X", "O", "X", "O"]);
  });
});

describe("applyMove", () => {
  it("places a mark without mutating the original board", () => {
    const start = emptyBoard();
    const next = applyMove(start, 4, "X");
    expect(next[4]).toBe("X");
    expect(start[4]).toBeNull();
  });

  it("rejects an occupied cell", () => {
    const start = applyMove(emptyBoard(), 4, "X");
    expect(applyMove(start, 4, "O")).toBe(start);
  });

  it("rejects out-of-range and non-integer indexes", () => {
    const start = emptyBoard();
    expect(applyMove(start, -1, "X")).toBe(start);
    expect(applyMove(start, 9, "X")).toBe(start);
    expect(applyMove(start, 1.5, "X")).toBe(start);
  });

  it("rejects moves after the game is won", () => {
    const won = board("XXX OO. ...");
    expect(applyMove(won, 8, "O")).toBe(won);
  });
});
