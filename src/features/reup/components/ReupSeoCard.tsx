import { useEffect, useMemo, useState, type FC } from "react";
import { Info } from "lucide-react";
import type { MotionThumbnail } from "../../../types/motionVideo.js";
import { MotionSeoCard } from "../../motion/components/MotionSeoCard.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupSeoPack } from "../lib/reupSeo.js";
import { drawReupThumbnail } from "../lib/reupThumbnail.js";
import type { ReupThumbIdea, ReupThumbLayout } from "../types/reup.js";
const LAYOUTS: ReupThumbLayout[] = ["hero", "split", "circle"];
/** Another take of an option's thumbnail: the next layout, the next real frames. */
const variant = (idea: ReupThumbIdea, frames: number[], turn: number): ReupThumbIdea => {
  if (!turn || !frames.length) return idea;
  const first = Math.max(0, frames.indexOf(idea.frames[0]));
  return { ...idea, layout: LAYOUTS[(LAYOUTS.indexOf(idea.layout) + turn) % LAYOUTS.length], frames: [frames[(first + turn) % frames.length], frames[(first + turn + 1) % frames.length]] };
};
/** The upload package in Video Motion's SEO card: options to copy or export, each with a thumbnail drawn from real frames. */
export const ReupSeoCard: FC<{ studio: ReupStudio; lang: string }> = ({ studio, lang }) => {
  const { job, text } = studio;
  const pack = job?.package;
  const seo = useMemo(() => (job ? reupSeoPack(job) : null), [job]);
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
        const image = await drawReupThumbnail(take.layout, take.frames.map((t) => url.get(t) || "").filter(Boolean), take.lines).catch(() => "");
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
  }, [pack, turns]);
  const packaging = job?.steps.package.status === "running";
  if (!job || (!seo && !packaging)) return null;
  return (
    <MotionSeoCard
      seo={seo}
      busy={studio.running || studio.busy}
      seoBusy={packaging}
      canGenerate={!!job.outputs.length && !studio.running}
      onGenerate={() => void studio.rerun("package")}
      lang={lang}
      thumbnails={thumbnails}
      onThumbnail={pack?.thumbs.length ? (i) => (setDrawing(i), setTurns((all) => ({ ...all, [i]: (all[i] || 0) + 1 }))) : undefined}
      thumbnailBusy={drawing}
      footer={
        pack && (
          <div className={S.SEO_NOTES}>
            {pack.pinned && (
              <p className={S.HINT}>
                {text.PINNED}: {pack.pinned}
              </p>
            )}
            <p className={pack.aiDisclosure ? S.HINT_WARN : S.HINT}>
              <Info className={S.INLINE_ICON} />
              {pack.aiDisclosure ? text.AI_YES : text.AI_NO}
            </p>
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
