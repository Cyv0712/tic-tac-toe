export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = readonly Cell[];
export type Line = readonly [number, number, number];

export const WINNING_LINES: readonly Line[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type GameStatus =
  | { kind: "playing"; next: Mark }
  | { kind: "won"; winner: Mark; line: Line }
  | { kind: "draw" };

export const emptyBoard = (): Board => Array<Cell>(9).fill(null);

export const other = (mark: Mark): Mark => (mark === "X" ? "O" : "X");

/** X always moves first, so whoever has fewer marks on the board is up next. */
export function nextMark(board: Board): Mark {
  const x = board.filter((c) => c === "X").length;
  const o = board.filter((c) => c === "O").length;
  return x <= o ? "X" : "O";
}

export function calculateWinner(
  board: Board,
): { winner: Mark; line: Line } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { winner: mark, line };
    }
  }
  return null;
}

export const isBoardFull = (board: Board): boolean =>
  board.every((c) => c !== null);

export function getStatus(board: Board): GameStatus {
  const result = calculateWinner(board);
  if (result) return { kind: "won", ...result };
  if (isBoardFull(board)) return { kind: "draw" };
  return { kind: "playing", next: nextMark(board) };
}

export const emptyIndexes = (board: Board): number[] =>
  board.flatMap((c, i) => (c === null ? [i] : []));

/**
 * Places `mark` at `index`. Returns the same board reference when the move is
 * illegal (occupied, out of range, or the game is already over), so callers
 * can detect a rejected move with `===`.
 */
export function applyMove(board: Board, index: number, mark: Mark): Board {
  if (!Number.isInteger(index) || index < 0 || index > 8) return board;
  if (board[index] !== null) return board;
  if (calculateWinner(board) || isBoardFull(board)) return board;
  const next = board.slice();
  next[index] = mark;
  return next;
}
