import { useEffect, useState, type FC } from "react";
import { CheckCircle2, ScrollText } from "lucide-react";
import { StudioCard, StudioInput, StudioTextarea } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn, StepHeader } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasScript } from "../types/bornas.js";
const withText = (script: BornasScript, value: string): BornasScript => {
  const texts = value
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);
  return { ...script, lines: texts.map((t, i) => (script.lines[i] ? { ...script.lines[i], text: t } : { text: t, screen: "", sub: "", kind: "none", idea: "", pause: false })) };
};
export const BornasScriptsCard: FC<{ studio: BornasStudio }> = ({ studio }) => {
  const { job, text } = studio;
  const [draft, setDraft] = useState<BornasScript[]>([]);
  useEffect(() => setDraft(job?.scripts || []), [job?.id, job?.scripts]);
  if (!job?.scripts?.length) return null;
  const waiting = job.status === "waiting";
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="03" icon={ScrollText} title={text.SCRIPTS} hint={waiting ? text.SCRIPTS_REVIEW : undefined} />
      <div className={S.BODY}>
        {draft.map((script, i) => (
          <div key={i} className={B.SCRIPT}>
            {waiting ? (
              <>
                <StudioInput className={S.INPUT} value={script.title} onChange={(e) => setDraft((all) => all.map((s, k) => (k === i ? { ...s, title: e.target.value } : s)))} />
                <StudioTextarea className={cn(S.INPUT, B.SCRIPT_AREA)} value={script.lines.map((l) => l.text).join("\n")} onChange={(e) => setDraft((all) => all.map((s, k) => (k === i ? withText(s, e.target.value) : s)))} />
              </>
            ) : (
              <>
                <div className={B.SCRIPT_HEAD}>
                  <span className={B.SCRIPT_TITLE}>{script.title}</span>
                  <span className={B.SCRIPT_META}>{text.LINES(script.lines.length)}</span>
                </div>
                <div className={B.SCRIPT_LINES}>
                  {script.lines.map((l, k) => (
                    <p key={k} className={B.SCRIPT_LINE}>
                      {l.text}
                      {l.screen && <span className={B.SCRIPT_SCREEN}>{l.screen}</span>}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        {waiting && (
          <div className={S.ACTIONS}>
            <ActionBtn icon={CheckCircle2} onClick={() => void studio.approve(draft)} disabled={studio.busy} className={S.ACTION_WIDE}>
              {text.APPROVE}
            </ActionBtn>
          </div>
        )}
      </div>
    </StudioCard>
  );
};
