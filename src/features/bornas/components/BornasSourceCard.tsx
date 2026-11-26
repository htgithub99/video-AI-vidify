import type { FC } from "react";
import { Clock, Film, Monitor, Play, Rocket, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard, StudioInput } from "../../../components/ui/Studio.js";
import { ActionBtn, MotionStatCard, StepHeader, StopBtn } from "../../motion/components/MotionControls.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_STEPS } from "../constants/bornasConfig.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
export const BornasSourceCard: FC<{ studio: BornasStudio }> = ({ studio }) => {
  const { text, sample, job, running } = studio;
  const locked = running || studio.busy;
  const runningStep = job && BORNAS_STEPS.find((id) => job.steps[id].status === "running");
  return (
    <StudioCard className={S.CARD}>
      <StepHeader
        n="02"
        icon={Film}
        title={text.STEP_SOURCE}
        right={
          <Button variant="unstyled" onClick={() => void studio.pickSource()} disabled={locked} className={S.LINK_BUTTON}>
            {text.PICK_FILE}
          </Button>
        }
      />
      <div className={S.BODY}>
        <StudioInput className={S.INPUT} value={studio.sourcePath} placeholder={text.PATH_PLACEHOLDER} disabled={locked} onChange={(e) => studio.setSourcePath(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void studio.loadSource(e.currentTarget.value)} onBlur={(e) => e.target.value.trim() !== sample?.path && void studio.loadSource(e.target.value)} />
        {sample ? (
          <div className={S.STATS}>
            <MotionStatCard icon={Clock} iconClassName={S.STAT_ICON_A} label={text.STAT_LENGTH}>
              {reupClock(sample.duration)}
            </MotionStatCard>
            <MotionStatCard icon={Monitor} iconClassName={S.STAT_ICON_B} label={text.STAT_SIZE}>
              {`${sample.width}×${sample.height}`}
            </MotionStatCard>
          </div>
        ) : (
          <p className={S.HINT}>{text.NO_SOURCE}</p>
        )}
        <div className={S.ACTIONS}>
          {running ? (
            <div className={S.ACTIONS_BUSY}>
              <ActionBtn busy icon={Rocket} onClick={() => undefined}>
                {(runningStep && text.STEPS[runningStep]) || text.RUNNING}
              </ActionBtn>
              <StopBtn onClick={() => void studio.cancel()} label={text.CANCEL} stopping={studio.busy} />
            </div>
          ) : (
            <>
              {job && (
                <ActionBtn variant="secondary" icon={RotateCcw} onClick={studio.newJob} disabled={studio.busy}>
                  {text.NEW_JOB}
                </ActionBtn>
              )}
              {studio.resumeStep && (
                <ActionBtn icon={Play} onClick={() => void studio.resume()} disabled={studio.busy}>
                  {text.RESUME}
                </ActionBtn>
              )}
              <ActionBtn icon={Rocket} onClick={studio.start} disabled={!sample || studio.busy} className={S.ACTION_WIDE} variant={studio.resumeStep ? "secondary" : "primary"}>
                {text.START}
              </ActionBtn>
            </>
          )}
        </div>
      </div>
    </StudioCard>
  );
};
