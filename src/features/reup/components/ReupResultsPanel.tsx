import type { FC } from "react";
import { FolderKanban, FolderOpen } from "lucide-react";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn, MOTION_LOADING_GLYPH } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupClock, reupDownload } from "./ReupControls.js";
/** Past runs, newest first, laid out like Video Motion's results: the first video of each run and a way back into it. */
export const ReupResultsPanel: FC<{ studio: ReupStudio; onOpen: () => void }> = ({ studio, onOpen }) => {
  const { text, results } = studio;
  if (!results.length)
    return (
      <StudioCard className={cn(S.CARD, S.RESULTS_EMPTY)}>
        <FolderKanban className={S.EMPTY_ICON} />
        <span>{text.RESULTS_EMPTY}</span>
      </StudioCard>
    );
  return (
    <div className={S.RESULTS}>
      {results.map((run) => {
        const video = run.outputs[0];
        return (
          <StudioCard key={run.id} className={cn(S.CARD, S.RESULT)}>
            {video ? (
              <div className={S.VIDEO}>
                <StudioVideoPlayer src={video.url} aspect={`${video.width}/${video.height}`} badge={reupClock(video.duration)} loadingIcon={MOTION_LOADING_GLYPH} />
                <div className={S.VIDEO_ACTION}>
                  <StudioDownloadButton onClick={() => reupDownload(video.url)} />
                </div>
              </div>
            ) : (
              <div className={S.EMPTY_MEDIA}>
                <FolderKanban className={S.EMPTY_ICON} />
                <span>{text.STATUS[run.status]}</span>
              </div>
            )}
            <div className={S.RESULT_TITLE} title={run.name}>
              {run.name}
            </div>
            <div className={S.RESULT_FOOT}>
              <div className={S.RESULT_META}>
                <span>{text.TYPES[run.preset].split(" · ")[0]}</span>
                <span>{text.STATUS[run.status]}</span>
                {run.outputs.length > 1 && <span>{text.OUTPUT(run.outputs.length)}</span>}
                <span>{new Date(run.updatedAt).toLocaleString()}</span>
              </div>
              <ActionBtn
                variant="secondary"
                icon={FolderOpen}
                onClick={() => {
                  void studio.openJob(run.id);
                  onOpen();
                }}>
                {text.OPEN}
              </ActionBtn>
            </div>
          </StudioCard>
        );
      })}
    </div>
  );
};
