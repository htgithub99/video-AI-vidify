import type { FC } from "react";
import { PlayCircle } from "lucide-react";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import type { MotionVideoTexts } from "../../../constants/motionVideoTexts.js";
import { MotionLoadingIcon, StepHeader } from "../../motion/components/MotionControls.js";
import { MotionExportedVideo } from "../../motion/components/MotionMediaFrame.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
/** Video Motion's preview card: the exported MP4 with its ratio badge, saved through the "Save as" dialog. A run with several videos (Shorts, bilingual pair) lists each with its own save button. */
export const ReupPreviewCard: FC<{ studio: ReupStudio; motionText: MotionVideoTexts }> = ({ studio, motionText }) => {
  const { text, job } = studio;
  const outputs = job?.outputs || [];
  const save = (outputId: string) => job && void studio.saveVideo(job.id, outputId);
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="▶" icon={PlayCircle} title={motionText.PREVIEW} badge={outputs.length ? motionText.EXPORTED_VIDEO_BADGE : undefined} right={outputs.length === 1 && <StudioDownloadButton onClick={() => save(outputs[0].id)} />} />
      {outputs.length ? (
        <div className={S.BODY}>
          {outputs.map((output, i) => (
            <div key={output.id} className={S.BODY}>
              {outputs.length > 1 && (
                <div className={S.VIDEO_HEAD}>
                  <span className={S.OUTPUT_TITLE}>{text.OUTPUT(i + 1)}</span>
                  <StudioDownloadButton onClick={() => save(output.id)} />
                </div>
              )}
              <MotionExportedVideo url={output.url} width={output.width} height={output.height} />
            </div>
          ))}
        </div>
      ) : (
        <div className={S.PREVIEW_EMPTY}>
          <div className={S.PREVIEW_EMPTY_TILE}>
            <MotionLoadingIcon className={S.PREVIEW_EMPTY_ICON} />
          </div>
        </div>
      )}
    </StudioCard>
  );
};
