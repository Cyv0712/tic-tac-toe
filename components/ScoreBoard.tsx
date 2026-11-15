import type { Mark as MarkType } from "@/lib/game";
import type { Tally, Theme } from "@/lib/settings";
import { Mark } from "./Mark";

type Props = {
  theme: Theme;
  names: Record<MarkType, string>;
  tally: Tally;
  /** Whose turn it is, so their side of the board lights up. */
  active: MarkType | null;
};

export function ScoreBoard({ theme, names, tally, active }: Props) {
  const player = (mark: MarkType) => (
    <li className="score" data-mark={mark} data-active={active === mark || undefined}>
      <span className="score-icon">
        <Mark kind={mark} theme={theme} />
      </span>
      <span className="score-name">{names[mark]}</span>
      {/* Re-keyed so the number pops whenever it changes. */}
      <span className="score-value" key={tally[mark]} aria-label={`${tally[mark]} wins`}>
        {tally[mark]}
      </span>
    </li>
  );

  return (
    <section className="scoreboard" aria-labelledby="scores-title">
      <h2 id="scores-title" className="section-title">
        Scoreboard
      </h2>
      <ul className="scores">
        {player("X")}
        <li className="score" data-mark="draw">
          <span className="score-name">Draws</span>
          <span className="score-value" key={tally.draws} aria-label={`${tally.draws} draws`}>
            {tally.draws}
          </span>
        </li>
        {player("O")}
      </ul>
    </section>
  );
}
