import { MUSIC_PLANNING as P } from "../../constants/musicPlanning.js";
import type { MusicPlanProgress } from "../../types/musicPlanning.js";
import { MUSIC_PROGRESS_STYLES as S } from "../../constants/musicPlanningStyles.js";
export const MusicPlanProgressPanel = ({ progress, language }: { progress: MusicPlanProgress[]; language: string }) => {
  const text = P.TEXT[language === "en" ? "en" : "vi"];
  const current = progress.at(-1);
  if (!current) return null;
  return (
    <section aria-label={text.title} aria-live="polite" className={S.PANEL}>
      <div className={S.HEADER}>
        <strong>{text.title}</strong>
        <span>{text.count(current.completedSongs, current.totalSongs)}</span>
      </div>
      <ol className={S.STAGES}>
        {progress.map((item) => (
          <li key={item.stage} className={item === current ? S.CURRENT : S.PREVIOUS}>
            {(text[item.stage as keyof typeof P.TEXT.vi] as string) || item.stage}
            {item.attempt ? ` · ${text.attempt(item.attempt)}` : ""}
          </li>
        ))}
      </ol>
      {current.completedSongs > 0 && current.stage !== P.STAGES.COMPLETE && <p>{text.partial}</p>}
      {progress.some((item) => item.warning) && <p className={S.WARNING}>{[...progress].reverse().find((item) => item.warning)?.warning}</p>}
    </section>
  );
};
