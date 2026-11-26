import _ from "lodash";
import type { FC } from "react";
import { FolderKanban } from "lucide-react";
import { StudioResults, type StudioDeleteOutcome } from "../../../components/common/StudioResults.js";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { STUDIO_RESULTS } from "../../../constants/studioResults.js";
import type { Lang } from "../../../lib/lang.js";
import { cn } from "../../../lib/utils.js";
import { formatBytes } from "../../motion/components/motionApi.js";
import { motionAspect } from "../../motion/components/MotionMediaFrame.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { BORNAS_RENDER } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
interface ResultItem {
  id: string;
  jobId: string;
  index: number;
  title: string;
  channel: string;
  updatedAt: number;
  url: string;
  seconds?: number;
  sizeBytes?: number;
}
export const BornasResultsPanel: FC<{ studio: BornasStudio; lang: Lang }> = ({ studio, lang }) => {
  const { text } = studio;
  const items: ResultItem[] = studio.results.flatMap((run) => run.videos.filter((v) => v.outputUrl).map((v) => ({ id: `${run.id}:${v.index}`, jobId: run.id, index: v.index, title: v.title, channel: run.channelName, updatedAt: run.updatedAt, url: v.previewUrl || v.outputUrl!, seconds: v.seconds, sizeBytes: v.sizeBytes })));
  const remove = async (list: ResultItem[], all: boolean): Promise<StudioDeleteOutcome> => {
    const res = await studio.deleteVideos((all ? items : list).map((it) => ({ jobId: it.jobId, video: it.index })));
    return { freedBytes: res.freedBytes, failed: (res.failed || []).filter((id) => items.some((it) => it.id === id)) };
  };
  if (!items.length) {
    return (
      <StudioCard className={B.RESULTS_EMPTY}>
        <FolderKanban className={B.RESULTS_EMPTY_ICON} />
        <span>{text.RESULTS_EMPTY}</span>
      </StudioCard>
    );
  }
  return (
    <StudioResults
      items={items}
      lang={lang}
      getId={(r) => r.id}
      getTitle={(r) => r.title}
      remove={remove}
      disabled={studio.running}
      summary={text.RESULTS_SUMMARY(formatBytes(_.sumBy(items, (r) => r.sizeBytes || 0)))}
      gridClassName={B.RESULTS_GRID}
      renderItem={(r, slots) => (
        <StudioCard className={cn(B.RESULT_CARD, slots.selected && STUDIO_RESULTS.SELECTED)}>
          <div className={B.RESULT_MEDIA}>
            <StudioVideoPlayer src={r.url} aspect={motionAspect(BORNAS_RENDER.WIDTH, BORNAS_RENDER.HEIGHT)} />
            <div className={B.RESULT_TOOLS}>
              <StudioDownloadButton onClick={() => void studio.saveVideo(r.jobId, r.index)} />
              {slots.remove}
            </div>
          </div>
          <div className={B.RESULT_INFO}>
            <div className={STUDIO_RESULTS.TITLE_ROW}>
              {slots.select}
              <div className={cn(B.RESULT_NAME, STUDIO_RESULTS.TITLE_TEXT)} title={r.title}>
                {r.title}
              </div>
            </div>
            <div className={B.RESULT_META}>{text.RESULT_META(r.channel, `${BORNAS_RENDER.WIDTH}×${BORNAS_RENDER.HEIGHT}`, BORNAS_RENDER.FPS, reupClock(r.seconds || 0), formatBytes(r.sizeBytes || 0), new Date(r.updatedAt).toLocaleString())}</div>
          </div>
        </StudioCard>
      )}
    />
  );
};
