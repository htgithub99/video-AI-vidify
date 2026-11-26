import { useMemo, useState, type FC } from "react";
import type { MotionSeoPack, MotionThumbnail } from "../../../types/motionVideo.js";
import { MotionSeoCard } from "../../motion/components/MotionSeoCard.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasVideo } from "../types/bornas.js";
const VideoSeo: FC<{ studio: BornasStudio; video: BornasVideo; lang: string }> = ({ studio, video, lang }) => {
  const { job, text } = studio;
  const [busy, setBusy] = useState<number | null>(null);
  const seo = video.seo;
  const pack = useMemo<MotionSeoPack | null>(() => (seo?.options.length ? { options: seo.options, chapters: seo.chapters, timingFrom: "voice", scriptKey: `${job?.id}:${video.index}` } : null), [seo, job?.id, video.index]);
  const thumbnails = useMemo<Record<number, MotionThumbnail>>(() => Object.fromEntries((seo?.thumbs || []).map((t, i) => [i, { image: t.url, prompt: "", optionIndex: i, tag: text.THUMB_KINDS[t.kind] }])), [seo, text.THUMB_KINDS]);
  const packaging = job?.steps.package.status === "running" && video.stage === "package";
  const regenerate = () => {
    setBusy(0);
    void Promise.resolve(studio.rerun("package", video.index)).finally(() => setBusy(null));
  };
  return (
    <div>
      <div className={B.SEO_TITLE} title={video.title}>
        {text.SEO_VIDEO(video.index + 1, video.title)}
      </div>
      <MotionSeoCard
        seo={pack}
        busy={studio.running || studio.busy}
        seoBusy={packaging}
        canGenerate={!!video.jobDir && !studio.running}
        onGenerate={regenerate}
        lang={lang}
        thumbnails={thumbnails}
        onThumbnail={() => regenerate()}
        thumbnailBusy={packaging ? 0 : busy}
        thumbs={{ count: 2, label: text.THUMB, refresh: text.THUMB_REFRESH, row: B.THUMB_ROW, item: B.THUMB_ITEM, button: B.THUMB_REFRESH }}
        footer={
          seo?.pinned && (
            <div className={B.SEO_NOTES}>
              <p className={B.SEO_HINT}>
                {text.PINNED}: {seo.pinned}
              </p>
            </div>
          )
        }
      />
    </div>
  );
};
export const BornasSeoCard: FC<{ studio: BornasStudio; lang: string }> = ({ studio, lang }) => {
  const videos = (studio.job?.videos || []).filter((v) => v.seo || v.jobDir);
  if (!videos.length) return null;
  return (
    <div className={B.SEO_LIST}>
      {videos.map((v) => (
        <VideoSeo key={v.index} studio={studio} video={v} lang={lang} />
      ))}
    </div>
  );
};
