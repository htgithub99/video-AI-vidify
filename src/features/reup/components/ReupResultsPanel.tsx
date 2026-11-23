import type { FC } from "react";
import { FolderKanban, FolderOpen } from "lucide-react";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioResults } from "../../../components/common/StudioResults.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { STUDIO_RESULTS } from "../../../constants/studioResults.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn } from "../../motion/components/MotionControls.js";
import { MotionExportedVideo, MotionMediaPlaceholder } from "../../motion/components/MotionMediaFrame.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
export const ReupResultsPanel: FC<{ studio: ReupStudio; ui: "vi" | "en"; onOpen: () => void }> = ({ studio, ui, onOpen }) => {
  const { text, results } = studio;
  if (!results.length)
    return (
      <StudioCard className={cn(S.CARD, S.RESULTS_EMPTY)}>
        <FolderKanban className={S.EMPTY_ICON} />
        <span>{text.RESULTS_EMPTY}</span>
      </StudioCard>
    );
  return (
    <StudioResults
      items={results}
      lang={ui}
      getId={(run) => run.id}
      getTitle={(run) => run.name}
      remove={(runs) => studio.deleteResults(runs.map((run) => run.id))}
      locked={(run) => run.status === "running"}
      gridClassName={S.RESULTS}
      renderItem={(run, slots) => {
        const video = run.outputs[0];
        return (
          <StudioCard className={cn(S.CARD, S.RESULT, slots.selected && STUDIO_RESULTS.SELECTED)}>
            <div className={S.RESULT_MEDIA}>
              {video ? <MotionExportedVideo url={video.url} width={video.width} height={video.height} /> : <MotionMediaPlaceholder />}
              <div className={S.RESULT_ACTIONS}>
                {video && <StudioDownloadButton onClick={() => void studio.saveVideo(run.id, video.id)} />}
                {slots.remove}
              </div>
            </div>
            <div className={STUDIO_RESULTS.TITLE_ROW}>
              {slots.select}
              <div className={cn(S.RESULT_TITLE, STUDIO_RESULTS.TITLE_TEXT)} title={run.name}>
                {run.name}
              </div>
            </div>
            <div className={S.RESULT_FOOT}>
              <div className={S.RESULT_META}>
                <span>{(text.TYPES[run.preset] || run.preset).split(" · ")[0]}</span>
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
      }}
    />
  );
};
