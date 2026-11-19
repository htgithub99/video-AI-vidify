import { useId, useLayoutEffect, useRef, useState, type FC } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import type { MotionVideoTexts } from "../../../constants/motionVideoTexts.js";
import { ElapsedLine, MotionProgressBar } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import type { ReupLog, ReupStepId, ReupStepState, ReupStepStatus } from "../types/reup.js";
const STEPS: ReupStepId[] = ["source", "scenes", "script", "package", "voice", "build"];
const BADGE: Record<ReupStepStatus, string> = { idle: "waiting", running: "active", done: "done", waiting: "cancelled", error: "error" };
const time = (at: number): string => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const LogSection: FC<{ studio: ReupStudio; id: ReupStepId; index: number; step: ReupStepState; rows: ReupLog[] }> = ({ studio, id, index, step, rows }) => {
  const { text } = studio;
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const open = expanded ?? (step.status === "running" || step.status === "error");
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (open && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [rows.length, open]);
  const Icon = open ? ChevronDown : ChevronRight;
  const canRerun = id !== "source" && !studio.running && (step.status === "done" || step.status === "error");
  return (
    <section className={S.LOG.SECTION} data-state={step.status}>
      <Button variant="unstyled" type="button" className={S.LOG.HEADER} aria-expanded={open} aria-controls={bodyId} onClick={() => setExpanded(!open)}>
        <span className={S.LOG.NUMBER}>{index + 1}</span>
        <span className={S.LOG.TITLE}>{text.STEPS[id]}</span>
        <span className={cn(S.LOG.BADGE, S.LOG.STATES[BADGE[step.status]])}>{text.LOG_STATES[step.status]}</span>
        <Icon className={S.LOG.CHEVRON} aria-hidden />
      </Button>
      {(step.message || rows.length > 0) && (
        <p className={S.LOG.SUMMARY}>
          <span className={S.LOG.SUMMARY_TEXT}>{step.message || rows[rows.length - 1].text}</span>
        </p>
      )}
      <div id={bodyId} hidden={!open}>
        <div ref={box} className={S.LOG.BODY}>
          {rows.map((row, i) => (
            <div key={`${row.at}-${i}`} className={S.LOG.ROW}>
              <time className={S.LOG.TIME}>{time(row.at)}</time>
              <span className={cn(S.LOG.MESSAGE, row.level === "error" ? S.HINT_ERROR : row.level === "warn" ? S.HINT_WARN : undefined)}>{row.text}</span>
            </div>
          ))}
          {canRerun && (
            <button type="button" className={S.LOG_RERUN} onClick={() => void studio.rerun(id)}>
              {text.RERUN}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
export const ReupLogCard: FC<{ studio: ReupStudio; motionText: MotionVideoTexts }> = ({ studio, motionText }) => {
  const { job, text } = studio;
  if (!job) return null;
  const progress = STEPS.reduce((sum, id) => sum + (job.steps[id].status === "done" ? 1 : job.steps[id].progress || 0), 0) / STEPS.length;
  const rows = (id: ReupStepId) => job.logs.filter((log) => (log.step || "source") === id);
  return (
    <StudioCard className={S.CARD}>
      <div className={S.LOG_HEAD}>
        <span className={S.LOG_TITLE}>{motionText.STEP_LOG}</span>
        <span className={S.LOG_PERCENT}>{Math.round(progress * 100)}%</span>
      </div>
      {studio.running && <ElapsedLine since={job.createdAt} label={text.RUNNING} suffix={motionText.ELAPSED} />}
      <MotionProgressBar progress={progress} minimum={4} className={S.BAR} animated={false} />
      {job.error && <p className={S.HINT_ERROR}>{job.error}</p>}
      <div className={cn(S.LOG.WRAP, S.LOG_BOX)}>
        {STEPS.map((id, index) => (
          <LogSection key={id} studio={studio} id={id} index={index} step={job.steps[id]} rows={rows(id)} />
        ))}
      </div>
    </StudioCard>
  );
};
