import { useEffect, useState, type FC } from "react";
import { CheckCircle2, ChevronDown, Clock, ScrollText, Type, User } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard, StudioInput, StudioTextarea } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn, StepHeader } from "../../motion/components/MotionControls.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_LIMITS } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasLine, BornasScript } from "../types/bornas.js";
const KIND_STYLE: Record<BornasLine["kind"], string> = { tag: B.KIND_TAG, plate: B.KIND_PLATE, label: B.KIND_LABEL, none: B.KIND_NONE };
const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;
export const BornasScriptsCard: FC<{ studio: BornasStudio }> = ({ studio }) => {
  const { job, text } = studio;
  const [draft, setDraft] = useState<BornasScript[]>([]);
  const [open, setOpen] = useState<number>(0);
  useEffect(() => setDraft(job?.scripts || []), [job?.id, job?.scripts]);
  if (!job?.scripts?.length) return null;
  const waiting = job.status === "waiting" && job.steps.script.status === "waiting";
  const rate = BORNAS_LIMITS.WORDS_PER_SECOND;
  const patch = (i: number, value: Partial<BornasScript>) => setDraft((all) => all.map((s, k) => (k === i ? { ...s, ...value } : s)));
  const patchLine = (i: number, n: number, value: Partial<BornasLine>) => setDraft((all) => all.map((s, k) => (k === i ? { ...s, lines: s.lines.map((l, j) => (j === n ? { ...l, ...value } : l)) } : s)));
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="03" icon={ScrollText} title={text.SCRIPTS} badge={String(draft.length)} hint={waiting ? text.SCRIPTS_REVIEW : undefined} />
      <div className={B.SCRIPTS}>
        {draft.map((script, i) => {
          const count = script.lines.reduce((n, l) => n + words(l.text), 0);
          const isOpen = open === i;
          return (
            <div key={i} className={cn(B.SCRIPT, isOpen && B.SCRIPT_OPEN)}>
              <Button variant="unstyled" className={B.SCRIPT_HEAD} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className={B.SCRIPT_NUM}>{i + 1}</span>
                <span className={B.SCRIPT_HEAD_TEXT}>
                  <span className={B.SCRIPT_TITLE}>{script.title}</span>
                  <span className={B.SCRIPT_CHIPS}>
                    {script.hero && (
                      <span className={B.CHIP}>
                        <User className={B.CHIP_ICON} />
                        {script.hero}
                      </span>
                    )}
                    <span className={B.CHIP}>
                      <Type className={B.CHIP_ICON} />
                      {text.LINES(script.lines.length)} · {text.WORDS(count)}
                    </span>
                    <span className={B.CHIP}>
                      <Clock className={B.CHIP_ICON} />
                      {reupClock(Math.round(count / rate))}
                    </span>
                  </span>
                </span>
                <ChevronDown className={cn(B.SCRIPT_CHEVRON, isOpen && B.SCRIPT_CHEVRON_OPEN)} />
              </Button>
              {isOpen && (
                <div className={B.SCRIPT_BODY}>
                  {waiting && (
                    <label className={B.FIELD}>
                      <span className={B.FIELD_LABEL}>{text.SCRIPT_TITLE}</span>
                      <StudioInput className={S.INPUT} value={script.title} onChange={(e) => patch(i, { title: e.target.value })} />
                    </label>
                  )}
                  <div className={B.LINES}>
                    {script.lines.map((line, n) => (
                      <div key={n} className={cn(B.LINE, line.pause && B.LINE_PAUSE)}>
                        <span className={B.LINE_NUM}>{n + 1}</span>
                        <div className={B.LINE_MAIN}>
                          {waiting ? <StudioTextarea rows={2} className={B.LINE_EDIT} value={line.text} onChange={(e) => patchLine(i, n, { text: e.target.value })} /> : <p className={B.LINE_TEXT}>{line.text}</p>}
                          {(line.screen || waiting) && line.kind !== "none" && (
                            <div className={B.LINE_SCREEN_ROW}>
                              <span className={cn(B.KIND, KIND_STYLE[line.kind])}>{text.KINDS[line.kind]}</span>
                              {waiting ? <StudioInput className={B.SCREEN_EDIT} value={line.screen} onChange={(e) => patchLine(i, n, { screen: e.target.value })} /> : <span className={B.SCREEN_TEXT}>{line.screen}</span>}
                              {line.sub && <span className={B.SCREEN_SUB}>{line.sub}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {waiting && (
          <div className={B.APPROVE_BAR}>
            <span className={B.APPROVE_NOTE}>{text.APPROVE_NOTE(draft.length)}</span>
            <ActionBtn icon={CheckCircle2} onClick={() => void studio.approve(draft)} disabled={studio.busy} className={S.ACTION_WIDE}>
              {text.APPROVE}
            </ActionBtn>
          </div>
        )}
      </div>
    </StudioCard>
  );
};
