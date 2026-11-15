import {
  type Board,
  type Mark,
  applyMove,
  calculateWinner,
  emptyIndexes,
  other,
} from "./game";

export type Difficulty = "easy" | "medium" | "hard";

type Rng = () => number;

const pick = <T>(items: readonly T[], rng: Rng): T =>
  items[Math.floor(rng() * items.length)];

/**
 * Only ~5,500 distinct positions exist, so caching makes the full search
 * effectively instant (an uncached search from an empty board visits ~550k).
 */
const cache = new Map<string, number>();

/**
 * Negamax value of `board` for the player about to move (`turn`).
 * Wins score 1 + empty cells, so quicker wins beat slower ones and slower
 * losses beat quicker ones. The score depends only on the position, which is
 * what makes it cacheable.
 */
function value(board: Board, turn: Mark): number {
  const key = turn + board.map((c) => c ?? "-").join("");
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const empties = emptyIndexes(board);
  const result = calculateWinner(board);
  let score: number;
  if (result) {
    const magnitude = 1 + empties.length;
    score = result.winner === turn ? magnitude : -magnitude;
  } else if (empties.length === 0) {
    score = 0;
  } else {
    score = Math.max(
      ...empties.map((i) => -value(applyMove(board, i, turn), other(turn))),
    );
  }
  cache.set(key, score);
  return score;
}

/** Every move that is equally best under perfect play. */
export function perfectMoves(board: Board, mark: Mark): number[] {
  const moves = emptyIndexes(board);
  const scored = moves.map((i) => ({
    i,
    score: -value(applyMove(board, i, mark), other(mark)),
  }));
  const best = Math.max(...scored.map((s) => s.score));
  return scored.filter((s) => s.score === best).map((s) => s.i);
}

/** A move that wins on the spot, or one that stops the opponent winning. */
function tacticalMove(board: Board, mark: Mark): number | null {
  const moves = emptyIndexes(board);
  const win = moves.find(
    (i) => calculateWinner(applyMove(board, i, mark))?.winner === mark,
  );
  if (win !== undefined) return win;
  const block = moves.find(
    (i) =>
      calculateWinner(applyMove(board, i, other(mark)))?.winner === other(mark),
  );
  return block ?? null;
}

/**
 * Picks a move for `mark`.
 * - easy: random.
 * - medium: takes a win, blocks a loss, otherwise random.
 * - hard: perfect play (cannot be beaten). Ties are broken at random so
 *   games don't all look the same.
 */
export function chooseMove(
  board: Board,
  mark: Mark,
  difficulty: Difficulty,
  rng: Rng = Math.random,
): number {
  const moves = emptyIndexes(board);
  if (moves.length === 0) throw new Error("No moves available");
  if (moves.length === 1) return moves[0];

  if (difficulty === "hard") return pick(perfectMoves(board, mark), rng);
  if (difficulty === "medium") {
    const tactical = tacticalMove(board, mark);
    if (tactical !== null) return tactical;
  }
  return pick(moves, rng);
}
