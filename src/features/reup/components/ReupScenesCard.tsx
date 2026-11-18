import type { FC } from "react";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { StudioCard } from "../../../components/ui/Studio.js";
import { StepHeader } from "../../motion/components/MotionControls.js";
import { REUP_URL } from "../constants/reupConfig.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupClock } from "./ReupControls.js";
/** Step 02: what the AI saw in the footage, scene by scene, with the real frame of each scene. */
export const ReupScenesCard: FC<{ studio: ReupStudio }> = ({ studio }) => {
  const { text, job } = studio;
  if (!job || (!job.sheets.length && !job.sceneMap)) return null;
  const map = job.sceneMap;
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="02" icon={ScanSearch} title={text.STEP_SCENES} badge={map ? text.SCENES_COUNT(map.segments.length) : undefined} />
      <div className={S.BODY}>
        <p className={S.HINT}>
          {text.CONTACT_SHEETS(job.sheets.length)}
          {job.bad.length ? ` · ${text.FOOTAGE_BAD(job.bad.length)}` : ""}
        </p>
        {map ? (
          <>
            {map.summary && <p className={S.SEGMENT_TEXT}>{map.summary}</p>}
            <div className={S.SEGMENTS}>
              {map.segments.map((segment) => (
                <div key={segment.id} className={S.SEGMENT}>
                  <img className={S.SEGMENT_IMG} loading="lazy" alt="" src={REUP_URL.FRAME(job.id, (segment.start + segment.end) / 2)} />
                  <div className={S.SEGMENT_BODY}>
                    <p className={S.SEGMENT_TIME}>
                      {reupClock(segment.start)}–{reupClock(segment.end)}
                      {segment.tags.length ? ` · ${segment.tags.join(", ")}` : ""}
                    </p>
                    <p className={S.SEGMENT_TEXT}>{segment.caption || segment.what}</p>
                  </div>
                  <span className={S.SEGMENT_VALUE}>{segment.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={S.HINT}>{text.SCENES_EMPTY}</p>
        )}
        {!!job.warnings.length && (
          <div className={S.WARN_BOX}>
            <p className={S.HINT_WARN}>
              <AlertTriangle className={S.INLINE_ICON} />
              {text.WARNINGS}
            </p>
            {job.warnings.map((warning) => (
              <p key={warning} className={S.HINT_WARN}>
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </StudioCard>
  );
};
