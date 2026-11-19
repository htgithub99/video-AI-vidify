import { useEffect, useRef, useState, type FC } from "react";
import { Info } from "lucide-react";
import type { MotionThumbnail } from "../../../types/motionVideo.js";
import { MotionSeoCard } from "../../motion/components/MotionSeoCard.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupSeoPack } from "../lib/reupSeo.js";
import { drawReupThumbnail } from "../lib/reupThumbnail.js";
import { ReupReport } from "./ReupReport.js";
import type { ReupThumbIdea, ReupThumbLayout } from "../types/reup.js";
const LAYOUTS: ReupThumbLayout[] = ["hero", "split", "circle"];
const variant = (idea: ReupThumbIdea, frames: number[], turn: number): ReupThumbIdea => {
  if (!turn || !frames.length) return idea;
  const first = Math.max(0, frames.indexOf(idea.frames[0]));
  return { ...idea, layout: LAYOUTS[(LAYOUTS.indexOf(idea.layout) + turn) % LAYOUTS.length], frames: [frames[(first + turn) % frames.length], frames[(first + turn + 1) % frames.length]] };
};
const useSame = <T,>(value: T): T => {
  const last = useRef<{ key: string; value: T }>();
  const key = JSON.stringify(value ?? null);
  if (!last.current || last.current.key !== key) last.current = { key, value };
  return last.current.value;
};
export const ReupSeoCard: FC<{ studio: ReupStudio; lang: string }> = ({ studio, lang }) => {
  const { job, text } = studio;
  const pack = useSame(job?.package);
  const seo = useSame(job ? reupSeoPack(job) : null);
  const [turns, setTurns] = useState<Record<number, number>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, MotionThumbnail>>({});
  const [drawing, setDrawing] = useState<number | null>(null);
  useEffect(() => {
    setTurns({});
    setThumbnails({});
  }, [pack]);
  useEffect(() => {
    if (!pack?.thumbs.length) return;
    let alive = true;
    const url = new Map(pack.frames.map((f) => [f.time, f.url]));
    const times = pack.frames.map((f) => f.time);
    void Promise.all(
      pack.thumbs.map(async (idea, i) => {
        const take = variant(idea, times, turns[i] || 0);
        const image = await drawReupThumbnail(take.layout, take.frames.map((t) => url.get(t) || "").filter(Boolean), take.lines, job?.settings.language).catch(() => "");
        return [i, { image, prompt: "", optionIndex: i }] as const;
      }),
    ).then((list) => {
      if (!alive) return;
      setThumbnails(Object.fromEntries(list.filter(([, t]) => t.image)));
      setDrawing(null);
    });
    return () => {
      alive = false;
    };
  }, [pack, turns, job?.settings.language]);
  const packaging = job?.steps.package.status === "running";
  if (!job || (!seo && !packaging && !job.report)) return null;
  return (
    <MotionSeoCard
      seo={seo}
      busy={studio.running || studio.busy}
      seoBusy={packaging}
      canGenerate={job.steps.script.status === "done" && !studio.running}
      onGenerate={() => void studio.rerun("package")}
      lang={lang}
      thumbnails={thumbnails}
      onThumbnail={pack?.thumbs.length ? (i) => (setDrawing(i), setTurns((all) => ({ ...all, [i]: (all[i] || 0) + 1 }))) : undefined}
      thumbnailBusy={drawing}
      footer={
        (pack || job.report) && (
          <div className={S.SEO_NOTES}>
            {job.report && <ReupReport report={job.report} text={text} />}
            {pack?.pinned && (
              <p className={S.HINT}>
                {text.PINNED}: {pack.pinned}
              </p>
            )}
            {pack && (
              <p className={pack.aiDisclosure ? S.HINT_WARN : S.HINT}>
                <Info className={S.INLINE_ICON} />
                {pack.aiDisclosure ? text.AI_YES : text.AI_NO}
              </p>
            )}
            {job.packageDir && (
              <p className={S.HINT}>
                {text.SAVED_TO} <span className={S.PATH}>{job.packageDir}</span>
              </p>
            )}
            {!!job.credits && <p className={S.HINT}>{text.CREDITS(job.credits)}</p>}
          </div>
        )
      }
    />
  );
};
