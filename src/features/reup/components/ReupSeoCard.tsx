import { useEffect, useRef, useState, type FC } from "react";
import { Info } from "lucide-react";
import type { MotionThumbnail } from "../../../types/motionVideo.js";
import { MotionSeoCard } from "../../motion/components/MotionSeoCard.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupSeoPack } from "../lib/reupSeo.js";
import { drawReupPending, drawReupThumbnail } from "../lib/reupThumbnail.js";
import { ReupReport } from "./ReupReport.js";
import { REUP_THUMBS } from "../constants/reupConfig.js";
import { THUMB_CONCEPT_TEXT } from "../../../constants/thumbConcepts.js";
import type { ReupThumbIdea, ReupThumbLayout, ReupThumbSpot } from "../types/reup.js";
const variant = (idea: ReupThumbIdea, frames: number[], turn: number): ReupThumbIdea => {
  if (!turn || !frames.length) return idea;
  const plain = (REUP_THUMBS.PLAIN as readonly string[]).includes(idea.layout);
  const family = (plain ? REUP_THUMBS.PLAIN : REUP_THUMBS.WORDED) as readonly ReupThumbLayout[];
  const layout = family[(Math.max(0, family.indexOf(idea.layout)) + turn) % family.length];
  const spots = REUP_THUMBS.SPOTS[layout] as readonly ReupThumbSpot[];
  const first = Math.max(0, frames.indexOf(idea.frames[0]));
  return { ...idea, layout, pin: true, spot: spots[(Math.max(0, spots.indexOf(idea.spot || spots[0])) + turn) % spots.length], frames: [0, 1, 2].map((k) => frames[(first + turn + k) % frames.length]) };
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
  const packaging = job?.steps.package.status === "running";
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
        const image = idea.ai && !idea.image && packaging ? drawReupPending(text.THUMB_AI_PENDING, lang) : await drawReupThumbnail(take, take.frames.map((t) => url.get(t) || "").filter(Boolean), job?.settings.language, REUP_THUMBS.PREFER[job?.preset || ""]).catch(() => "");
        return [i, { image, prompt: "", optionIndex: i, ...(idea.kind ? { tag: `${THUMB_CONCEPT_TEXT[lang === "en" ? "en" : "vi"][idea.kind]}${idea.layout === "ai" ? text.THUMB_AI : ""}` } : {}) }] as const;
      }),
    ).then((list) => {
      if (!alive) return;
      setThumbnails(Object.fromEntries(list.filter(([, t]) => t.image)));
      setDrawing(null);
    });
    return () => {
      alive = false;
    };
  }, [pack, turns, job?.settings.language, job?.preset, lang, text.THUMB_AI, text.THUMB_AI_PENDING, packaging]);
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
      onThumbnail={pack?.thumbs.length ? (i) => (setDrawing(i), pack.thumbs[i]?.ai ? void studio.rerollThumb(i).finally(() => setDrawing(null)) : setTurns((all) => ({ ...all, [i]: (all[i] || 0) + 1 }))) : undefined}
      thumbnailBusy={drawing}
      thumbs={pack?.thumbs.length ? { count: pack.thumbs.length, label: text.THUMB, refresh: text.THUMB_REFRESH, row: S.THUMB_ROW, item: S.THUMB_ITEM, button: S.THUMB_REFRESH } : undefined}
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
