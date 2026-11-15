import type { Mark as MarkType } from "@/lib/game";
import type { Theme } from "@/lib/settings";
import { Mark } from "./Mark";

type Props = {
  text: string;
  theme: Theme;
  /** Which mark's colour the banner glows in, or "draw" for a stalemate. */
  tone: MarkType | "draw";
  /** The mark shown beside the text, if any. */
  mark: MarkType | null;
  thinking: boolean;
};

export function StatusBanner({ text, theme, tone, mark, thinking }: Props) {
  return (
    <div className="status" data-tone={tone} role="status">
      {mark && (
        <span className="status-mark">
          <Mark kind={mark} theme={theme} />
        </span>
      )}
      {/* Re-keyed so the text swaps with a short animation on every change. */}
      <p key={text} className="status-text" data-thinking={thinking || undefined}>
        {text}
      </p>
    </div>
  );
}
