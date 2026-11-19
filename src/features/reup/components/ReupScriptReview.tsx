import { useEffect, useMemo, useState, type FC } from "react";
import { CheckCheck, FileText } from "lucide-react";
import { StudioCard, StudioInput, StudioTextarea } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn, StepHeader } from "../../motion/components/MotionControls.js";
import { REUP_URL } from "../constants/reupConfig.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupMoments } from "../lib/reupSceneMap.js";
import type { ReupScript } from "../types/reup.js";
import { reupClock } from "./ReupControls.js";
const SHOW_SHOTS = 10;
const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;
export const ReupScriptReview: FC<{ studio: ReupStudio }> = ({ studio }) => {
  const { text, job } = studio;
  const [draft, setDraft] = useState<ReupScript | null>(job?.script || null);
  useEffect(() => setDraft(job?.script || null), [job?.id, job?.script]);
  const scenes = useMemo(() => new Map((job?.sceneMap?.segments || []).map((g) => [g.id, { start: g.start, end: g.end }])), [job?.sceneMap]);
  const moments = useMemo(() => new Map((job?.sceneMap?.segments || []).flatMap((g) => reupMoments(g).map((m) => [m.id, { start: m.t, end: m.t }] as const))), [job?.sceneMap]);
  if (!job || !draft || job.status !== "waiting-script") return null;
  const edit = (fn: (script: ReupScript) => void) =>
    setDraft((current) => {
      const next = structuredClone(current!);
      fn(next);
      return next;
    });
  const frame = (start: number, end: number) => <img className={S.SHOT_IMG} loading="lazy" alt="" src={REUP_URL.FRAME(job.id, (start + end) / 2)} />;
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="03" icon={FileText} title={text.STEP_SCRIPT} badge={job.style ? text.STYLE(text.STYLES[job.style.voice], job.style.hook ? text.STYLES[job.style.hook] : "", text.STYLES[job.style.ending]) : text.STATUS["waiting-script"]} />
      <div className={S.BODY}>
        <p className={S.HINT}>{text.SCRIPT_HINT}</p>
        {draft.outputs.map((output, o) => (
          <div key={output.id} className={S.OUTPUT}>
            {draft.outputs.length > 1 && (
              <p className={S.OUTPUT_TITLE}>
                {text.OUTPUT(o + 1)}
                {output.lang && draft.outputs.some((x) => x.lang !== output.lang) ? ` · ${text.LANG_TAG[output.lang]}` : ""}
              </p>
            )}
            <div className={S.PAIR}>
              {[0, 1].map((line) => (
                <label key={line} className={S.FIELD}>
                  <span className={S.FIELD_LABEL}>{line ? text.TITLE_LINE2 : text.TITLE_LINE1}</span>
                  <StudioInput className={S.INPUT} value={output.title[line] || ""} maxLength={40} onChange={(e) => edit((d) => void (d.outputs[o].title[line] = e.target.value))} />
                </label>
              ))}
            </div>
            {output.speech && (
              <label className={S.FIELD}>
                <span className={S.FIELD_LABEL}>{text.CTA}</span>
                <StudioInput className={S.INPUT} value={output.cta || ""} maxLength={80} onChange={(e) => edit((d) => void (d.outputs[o].cta = e.target.value))} />
              </label>
            )}
            {output.sections.map((section, i) => (
              <div key={section.id} className={S.SECTION}>
                <div className={S.SECTION_HEAD}>
                  <span>
                    {i + 1}. {output.speech ? text.KEPT_PHRASE : text.ROLES[section.role]}
                    {section.chapter ? ` · ${text.CHAPTER}: ${section.chapter}` : ""}
                  </span>
                  <span>{text.WORDS(words(section.text))}</span>
                </div>
                {output.speech ? (
                  <>
                    <p className={S.HINT}>{section.text}</p>
                    <label className={S.FIELD}>
                      <span className={S.FIELD_LABEL}>{text.CALLOUT}</span>
                      <StudioInput className={S.INPUT} value={section.callout || ""} maxLength={40} onChange={(e) => edit((d) => void (d.outputs[o].sections[i].callout = e.target.value))} />
                    </label>
                  </>
                ) : section.cues?.length ? (
                  section.cues.map((cue, k) => {
                    const at = (cue.moment && moments.get(cue.moment)) ?? scenes.get(cue.segment);
                    return (
                      <div key={`${cue.moment || cue.segment}-${k}`} className={S.ROW}>
                        {at !== undefined && (
                          <div className={S.SHOT}>
                            {frame(at.start, at.end)}
                            <p className={S.SHOT_TIME}>{reupClock(at.start)}</p>
                          </div>
                        )}
                        <StudioTextarea className={cn(S.INPUT, S.TEXTAREA)} rows={2} aria-label={text.CUE} value={cue.text} onChange={(e) => edit((d) => void (d.outputs[o].sections[i].cues![k].text = e.target.value))} />
                      </div>
                    );
                  })
                ) : (
                  <StudioTextarea className={cn(S.INPUT, S.TEXTAREA)} rows={Math.min(8, Math.max(2, Math.ceil(section.text.length / 110)))} value={section.text} onChange={(e) => edit((d) => void (d.outputs[o].sections[i].text = e.target.value))} />
                )}
                {!section.cues?.length && !!section.shots.length && (
                  <div className={S.SHOTS}>
                    {section.shots.slice(0, SHOW_SHOTS).map((shot) => (
                      <div key={`${shot.start}-${shot.end}`} className={S.SHOT}>
                        {frame(shot.start, shot.end)}
                        <p className={S.SHOT_TIME}>
                          {reupClock(shot.start)}–{reupClock(shot.end)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className={S.ACTIONS}>
          <ActionBtn icon={CheckCheck} busy={studio.busy} onClick={() => void studio.approveScript(draft)} className={S.ACTION_WIDE}>
            {text.APPROVE}
          </ActionBtn>
        </div>
      </div>
    </StudioCard>
  );
};
