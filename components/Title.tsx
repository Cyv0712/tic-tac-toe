import type { CSSProperties } from "react";

const WORDS = ["Tic", "Tac", "Toe"];

// Computed once, so each letter knows its position in the ignition sequence.
let position = 0;
const LETTERS = WORDS.map((word, w) =>
  [...word, ...(w < WORDS.length - 1 ? ["-"] : [])].map((char) => ({
    char,
    order: position++,
  })),
);

/**
 * The page's one orchestrated moment: letters ignite one after another like
 * a neon sign being switched on. Each word takes a colour from the game
 * (pink for X, cyan for O).
 */
export function Title() {
  return (
    <h1 className="title" aria-label="Tic-Tac-Toe">
      {WORDS.map((word, w) => (
        <span key={word} className="title-word" data-tone={w === 1 ? "O" : "X"} aria-hidden>
          {LETTERS[w].map(({ char, order }) => (
            <span
              key={order}
              className="title-letter"
              style={{ "--n": order } as CSSProperties}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
