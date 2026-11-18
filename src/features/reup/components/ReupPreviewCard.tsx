import type { FC } from "react";
import { Film, Info, PlayCircle } from "lucide-react";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { MOTION_LOADING_GLYPH, StepHeader } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupClock, reupDownload } from "./ReupControls.js";
/** The edited videos of the current run, playable and downloadable, with where the upload package was written. */
export const ReupPreviewCard: FC<{ studio: ReupStudio }> = ({ studio }) => {
  const { text, job } = studio;
  const outputs = job?.outputs || [];
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="▶" icon={PlayCircle} title={text.PREVIEW} badge={job ? text.STATUS[job.status] : undefined} />
      {outputs.length ? (
        <div className={S.VIDEOS}>
          {outputs.map((output) => (
            <div key={output.id} className={S.VIDEO}>
              <StudioVideoPlayer src={output.url} aspect={`${output.width}/${output.height}`} badge={reupClock(output.duration)} loadingIcon={MOTION_LOADING_GLYPH} />
              <div className={S.VIDEO_ACTION}>
                <StudioDownloadButton onClick={() => reupDownload(output.url)} />
              </div>
            </div>
          ))}
          {job?.packageDir && (
            <p className={S.HINT}>
              {text.SAVED_TO} <span className={S.PATH}>{job.packageDir}</span>
            </p>
          )}
          {job?.package?.pinned && (
            <p className={S.HINT}>
              {text.PINNED}: {job.package.pinned}
            </p>
          )}
          {job?.package && (
            <p className={job.package.aiDisclosure ? S.HINT_WARN : S.HINT}>
              <Info className={S.INLINE_ICON} />
              {job.package.aiDisclosure ? text.AI_YES : text.AI_NO}
            </p>
          )}
          {!!job?.credits && <p className={S.HINT}>{text.CREDITS(job.credits)}</p>}
        </div>
      ) : (
        <div className={S.EMPTY_MEDIA}>
          <Film className={S.EMPTY_ICON} />
          <span>{text.PREVIEW_EMPTY}</span>
        </div>
      )}
    </StudioCard>
  );
};
