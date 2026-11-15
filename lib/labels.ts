import type { Mark } from "./game";
import type { Theme } from "./settings";

/** What a mark is called in each theme: X and O, or cat and dog. */
export const markWord = (theme: Theme, mark: Mark): string =>
  theme === "pets" ? (mark === "X" ? "cat" : "dog") : mark;

export const defaultName = (theme: Theme, mark: Mark): string =>
  theme === "pets"
    ? mark === "X"
      ? "Team Cat"
      : "Team Dog"
    : `Player ${mark}`;
