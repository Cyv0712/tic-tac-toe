import type { CSSProperties } from "react";
import type { Mark as MarkType } from "@/lib/game";
import type { Theme } from "@/lib/settings";

// All shapes are drawn in a 100 x 100 box so they scale with their cell.
const NEON_PATHS: Record<MarkType, string[]> = {
  X: ["M27 27 L73 73", "M73 27 L27 73"],
  // A ring with a small gap at the top right, where a real tube has its
  // electrode.
  O: ["M73.76 33.37 A29 29 0 1 1 57.51 21.99"],
};

const MARKER_PATHS: Record<MarkType, string[]> = {
  X: ["M26 25 C41 38 58 60 76 78", "M75 22 C60 41 42 62 24 77"],
  O: [
    "M52 21 C30 19 19 42 24 61 C29 81 53 83 69 72 C83 62 81 35 66 26 C60 22 53 21 49 23",
  ],
};

const EMOJI: Record<MarkType, string> = { X: "🐱", O: "🐶" };

type Props = {
  kind: MarkType;
  theme: Theme;
  /** Plays the ignite / draw-in animation. Leave off for icons and previews. */
  animate?: boolean;
};

export function Mark({ kind, theme, animate = false }: Props) {
  const common = {
    className: "mark",
    "data-kind": kind,
    "data-theme-skin": theme,
    "data-animate": animate ? "" : undefined,
    viewBox: "0 0 100 100",
    "aria-hidden": true,
    focusable: false,
  } as const;

  if (theme === "pets") {
    return (
      <svg {...common}>
        <text
          className="mark-emoji"
          x="50"
          y="52"
          fontSize="58"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {EMOJI[kind]}
        </text>
      </svg>
    );
  }

  const paths = theme === "notebook" ? MARKER_PATHS[kind] : NEON_PATHS[kind];
  return (
    <svg {...common}>
      {paths.map((d, i) => (
        <g key={d} style={{ "--i": i } as CSSProperties}>
          <path className="tube" d={d} pathLength={1} />
          {theme === "neon" && <path className="core" d={d} pathLength={1} />}
        </g>
      ))}
    </svg>
  );
}
