import { useId, useLayoutEffect, useRef, useState, type FC } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { ElapsedLine, MotionProgressBar } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_STEPS } from "../constants/bornasConfig.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasLog, BornasStepId, BornasStepState, BornasStepStatus } from "../types/bornas.js";
const BADGE: Record<BornasStepStatus, string> = { idle: "waiting", running: "active", done: "done", waiting: "cancelled", error: "error" };
const time = (at: number): string => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const Section: FC<{ studio: BornasStudio; id: BornasStepId; index: number; step: BornasStepState; rows: BornasLog[] }> = ({ studio, id, index, step, rows }) => {
  const { text } = studio;
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const open = expanded ?? (step.status === "running" || step.status === "error");
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (open && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [rows.length, open]);
  const Icon = open ? ChevronDown : ChevronRight;
  const canRerun = !studio.running && (step.status === "done" || step.status === "error");
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
              <span className={cn(S.LOG.MESSAGE, row.level === "error" ? S.HINT_ERROR : row.level === "warn" ? S.HINT_WARN : undefined)}>
                {row.video !== undefined ? `#${row.video + 1} · ` : ""}
                {row.text}
              </span>
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
export const BornasLogCard: FC<{ studio: BornasStudio; title: string }> = ({ studio, title }) => {
  const { job, text } = studio;
  if (!job) return null;
  const progress = BORNAS_STEPS.reduce((sum, id) => sum + (job.steps[id].status === "done" ? 1 : job.steps[id].progress || 0), 0) / BORNAS_STEPS.length;
  const rows = (id: BornasStepId) => job.logs.filter((log) => (log.step || "sample") === id);
  return (
    <StudioCard className={S.CARD}>
      <div className={S.LOG_HEAD}>
        <span className={S.LOG_TITLE}>{title}</span>
        <span className={S.LOG_PERCENT}>{Math.round(progress * 100)}%</span>
      </div>
      {studio.running && <ElapsedLine since={job.createdAt} label={text.RUNNING} suffix={text.ELAPSED} />}
      <MotionProgressBar progress={progress} minimum={4} className={S.BAR} animated={false} />
      {job.error && <p className={S.HINT_ERROR}>{job.error}</p>}
      <div className={cn(S.LOG.WRAP, S.LOG_BOX)}>
        {BORNAS_STEPS.map((id, index) => (
          <Section key={id} studio={studio} id={id} index={index} step={job.steps[id]} rows={rows(id)} />
        ))}
      </div>
    </StudioCard>
  );
};
