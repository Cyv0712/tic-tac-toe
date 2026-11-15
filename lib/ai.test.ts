import { describe, expect, it } from "vitest";
import { chooseMove, perfectMoves } from "./ai";
import {
  type Board,
  type Cell,
  type Mark,
  applyMove,
  calculateWinner,
  emptyBoard,
  emptyIndexes,
  getStatus,
  nextMark,
  other,
} from "./game";

const board = (s: string): Board =>
  s
    .replace(/\s/g, "")
    .split("")
    .map((c): Cell => (c === "X" || c === "O" ? c : null));

/**
 * Plays every possible opponent reply against the hard AI and counts games the
 * AI lost. The AI's own choice is always one of its perfect moves, and we try
 * all of them, so this covers every line the real AI could take.
 */
function countAiLosses(ai: Mark): number {
  let losses = 0;
  const walk = (b: Board): void => {
    const status = getStatus(b);
    if (status.kind === "won") {
      if (status.winner !== ai) losses++;
      return;
    }
    if (status.kind === "draw") return;
    if (status.next === ai) {
      for (const i of perfectMoves(b, ai)) walk(applyMove(b, i, ai));
    } else {
      for (const i of emptyIndexes(b)) walk(applyMove(b, i, status.next));
    }
  };
  walk(emptyBoard());
  return losses;
}

describe("hard AI", () => {
  it("never loses when it moves first", () => {
    expect(countAiLosses("X")).toBe(0);
  });

  it("never loses when it moves second", () => {
    expect(countAiLosses("O")).toBe(0);
  });

  it("takes an immediate win", () => {
    const b = board("XX. OO. ...");
    expect(perfectMoves(b, "X")).toEqual([2]);
  });

  it("blocks an immediate loss", () => {
    const b = board("XX. .O. ...");
    expect(perfectMoves(b, "O")).toEqual([2]);
  });
});

describe("medium AI", () => {
  const rng = () => 0; // always the first candidate, so tactics must be what picks

  it("takes a win over a block", () => {
    const b = board("XX. OO. ...");
    expect(chooseMove(b, "O", "medium", rng)).toBe(5);
  });

  it("blocks when it cannot win", () => {
    const b = board("XX. .O. ...");
    expect(chooseMove(b, "O", "medium", rng)).toBe(2);
  });
});

describe("chooseMove", () => {
  it.each(["easy", "medium", "hard"] as const)(
    "%s only ever returns a legal move",
    (difficulty) => {
      for (let game = 0; game < 50; game++) {
        let b = emptyBoard();
        while (!calculateWinner(b) && emptyIndexes(b).length > 0) {
          const mark = nextMark(b);
          const move = chooseMove(b, mark, difficulty);
          expect(b[move]).toBeNull();
          b = applyMove(b, move, mark);
        }
      }
    },
  );

  it("plays the last remaining cell", () => {
    expect(chooseMove(board("XOX XOO OX."), "X", "easy")).toBe(8);
  });

  it("throws when the board is full", () => {
    expect(() => chooseMove(board("XOX XOO OXX"), "X", "hard")).toThrow();
  });

  it("an easy AI is beatable by a simple opponent strategy", () => {
    // Sanity check that easy is not secretly perfect: over many games, an
    // opponent that plays hard should sometimes win against easy.
    let humanWins = 0;
    for (let game = 0; game < 200; game++) {
      let b = emptyBoard();
      const human: Mark = "X";
      while (!calculateWinner(b) && emptyIndexes(b).length > 0) {
        const mark = nextMark(b);
        const move =
          mark === human
            ? chooseMove(b, mark, "hard")
            : chooseMove(b, mark, "easy");
        b = applyMove(b, move, mark);
      }
      if (calculateWinner(b)?.winner === human) humanWins++;
    }
    expect(humanWins).toBeGreaterThan(100);
    expect(other("X")).toBe("O");
  });
});
