# Tic-Tac-Toe: the neon edition

Tic-tac-toe built with Next.js (App Router), React and TypeScript. The board is
a neon sign: each mark ignites with a flicker, the winning line is drawn across
the board like a new tube lighting up, and the wall behind it glows in the
colour of whoever is up next.

## What it does

- **Two players** take turns on a 3×3 board, or play **the computer** at three
  levels (Easy, Medium, Unbeatable) and choose whether to play X or O.
- Shows who **won** (with the winning line) or that it's a **draw**.
- **New Game** starts over and keeps the scores. **Undo** takes back your last
  turn (and the computer's reply).
- A **scoreboard** counts wins and draws. Scores are kept separately for
  two-player and solo games, and saved in `localStorage`.
- Three looks: **Neon**, **Notebook** (marker pen on graph paper) and
  **Cats & dogs**. Player names are editable. Optional sound effects, vibration
  and confetti.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (game rules + AI)
npm run lint
npm run build    # production build
```

## How it's put together

| Path | Role |
| --- | --- |
| `lib/game.ts` | Pure rules: winning lines, winner, draw, legal moves. |
| `lib/ai.ts` | Computer opponent. "Unbeatable" is memoised negamax (about 5,500 positions, so it's instant). |
| `lib/settings.ts` | Persisted theme, names, scores and options in an external store read with `useSyncExternalStore`, so the server and first client render agree and nothing flashes. Stored data is validated on read. |
| `lib/boot.ts` | Tiny inline script that applies the saved theme before first paint. |
| `lib/sfx.ts` | Sound effects synthesised with the Web Audio API. No audio files. |
| `hooks/useGame.ts` | Game state as a reducer, plus the computer's delayed reply and once-per-game result reporting. |
| `components/` | Board, marks (SVG), scoreboard, setup panel, confetti, and so on. |

Decisions worth knowing about:

- **Rules are separate from the UI.** `lib/game.ts` and `lib/ai.ts` have no
  React in them and are covered by tests. The test for the Unbeatable level
  walks every possible opponent line, as X and as O, and asserts the computer
  never loses.
- **Accessible by default.** The whole game can be played from the keyboard
  (arrow keys move around the board, Enter or Space places a mark, `N` starts a
  new game). Cells have labels like "Row 1, column 2, empty" and the status line
  is announced by screen readers. `prefers-reduced-motion` turns off the
  flicker, draw-in animations and confetti.
- **Sound is on by default** and can be switched off in Setup. Every sound is a
  reaction to something you just did, so browsers allow it without a prompt.
