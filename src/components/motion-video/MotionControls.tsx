import { StudioSelect } from "../ui/Studio.js";
import * as MR from "../../constants/motionRuntime.js";
import { ChevronDown, ChevronRight, Film, Sparkles, Square } from "lucide-react";
import { FC, useEffect, useId, useLayoutEffect, useRef, useState, type SelectHTMLAttributes } from "react";
import type { MotionLogEntry, MotionAiActivity, MotionStoryJobState, MotionJobState } from "../../types/motionVideo.js";
import { MOTION_AI_RECOVERY as AIR } from "../../constants/motionAiRecovery.js";
import { MOTION_EDITORIAL } from "../../constants/motionEditorial.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA, MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_2, MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT_2, MOTION_TEXT_BG_SLATE_100_HOVER_BG_SLATE_200_TEXT, MOTION_TEXT_PRIMARY, MOTION_TEXT_SYMBOL, MOTION_TEXT_SYMBOL_6, MOTION_TEXT_SYMBOL_7 } from "../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../../constants/motionStyles.js";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { formatMotionProgress, formatSeconds } from "./motionApi.js";
import { motionLogSections, type MotionLogSection } from "../../lib/motionLogSections.js";
import { MOTION_LOG_SECTIONS as LOG } from "../../constants/motionLogSections.js";
export const MotionAiStatusLine: FC<{ activities?: Record<string, MotionAiActivity> }> = ({ activities }) => {
  const groups = new Map<string, { provider: string; model: string; phases: Map<string, number> }>();
  const details: string[] = [];
  for (const ai of Object.values(activities || {})) {
    if (ai.phase === AIR.PHASE.DONE) continue;
    const key = AIR.MODEL_KEY(ai.provider, ai.model);
    const group = groups.get(key) || { provider: ai.provider, model: ai.model, phases: new Map<string, number>() };
    const phase = MOTION_EDITORIAL.PHASE_LABEL[ai.phase as keyof typeof MOTION_EDITORIAL.PHASE_LABEL] || ai.phase;
    group.phases.set(phase, (group.phases.get(phase) || 0) + 1);
    groups.set(key, group);
    details.push(AIR.DISPLAY(ai.provider, ai.model, AIR.PHASE_LABEL[ai.phase as keyof typeof AIR.PHASE_LABEL]) + MR.MOTION_TEXT_SYMBOL + ai.workerId + MR.MOTION_TEXT_SYMBOL + MOTION_EDITORIAL.ACTIVITY_DETAIL(ai.artifact, ai.roomGeneration, ai.phaseStartedAt, ai.targetIds));
  }
  if (!groups.size) return null;
  const label = [...groups.values()].map((group) => MOTION_EDITORIAL.GROUP(group.provider, group.model, [...group.phases].map(([phase, count]) => MOTION_EDITORIAL.COUNT(phase, count)).join(MOTION_EDITORIAL.STATUS_SEPARATOR))).join(MOTION_EDITORIAL.STATUS_SEPARATOR);
  return (
    <p className={MOTION_EDITORIAL.STATUS_CLASS} title={details.join(MOTION_EDITORIAL.DETAIL_SEPARATOR)}>
      {label}
    </p>
  );
};
export const StepHeader: FC<{ n: string; icon: typeof Film; title: string; badge?: string; right?: React.ReactNode }> = ({ n, icon: Icon, title, badge, right }) => (
  <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800_PB_3_FLEX_WRAP}>
    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0}>
      <div className={MOTION_STYLES.W_8_H_8_ROUNDED_LG_BG_GRADIENT_TO_TR_FROM_PURPLE_500_TO_PINK_600_P_0_5}>
        <div className={MOTION_STYLES.W_FULL_H_FULL_BG_SLATE_955_ROUNDED_6PX_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
          <Icon className={MOTION_STYLES.W_4_H_4_TEXT_PURPLE_400} />
        </div>
      </div>
      <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
        <span className={MOTION_STYLES.W_5_H_5_ROUNDED_LG_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_TEXT_PURPLE_400}>{n}</span>
        <h2 className={MOTION_STYLES.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100_FONT_MONO_FLEX}>{title}</h2>
        {badge && <span className={MOTION_STYLES.PX_2_PY_0_5_ROUNDED_FULL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_TEXT_PURPLE_300}>{badge}</span>}
      </div>
    </div>
    {right && <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2}>{right}</div>}
  </div>
);
export const ChipButton: FC<{ active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }> = ({ active, onClick, children, disabled, className }) => (
  <Button
    variant={MR.MOTION_TEXT_UNSTYLED}
    disabled={disabled}
    onClick={onClick}
    className={cn(MOTION_STYLES.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_MONO_FONT_BOLD_BORDER, active ? MOTION_STYLES.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_BORDER_PURPLE_400_TEXT_WHITE_SHADOW_PURPLE_600_30_SHADOW_MD : MOTION_STYLES.BORDER_SLATE_800_BG_SLATE_955_80_TEXT_SLATE_300_HOVER_TEXT_WHITE_HOVER_BORDER_PURPLE_500_40_HOVER_BG_SLATE_900, className)}>
    {children}
  </Button>
);
export const ActionBtn: FC<{ onClick: () => void; disabled?: boolean; busy?: boolean; icon: typeof Film; children: React.ReactNode; className?: string; title?: string; variant?: "primary" | "secondary" | "danger" }> = ({ onClick, disabled, busy, icon: Icon, children, className, title, variant = MOTION_TEXT_PRIMARY }) => {
  const styles = { primary: busy ? MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA : MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_2, secondary: MOTION_TEXT_BG_SLATE_100_HOVER_BG_SLATE_200_TEXT, danger: MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT_2 };
  return (
    <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={onClick} disabled={disabled || busy} title={title} className={cn(MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PX_4_PY_2_5_ROUNDED_XL, styles[variant], className)}>
      {busy ? <MotionLoadingIcon className={MOTION_STYLES.W_4_H_4_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0} /> : <Icon className={MOTION_STYLES.W_4_H_4_SHRINK_0} />}
      <span>{children}</span>
    </Button>
  );
};
export const StopBtn: FC<{ onClick: () => void; label: string; stopping?: boolean; className?: string }> = ({ onClick, label, stopping, className }) => (
  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={onClick} disabled={stopping} {...{ [MOTION_STORY_CONFIG.BUSY_ALLOW_ATTR]: true }} className={cn(MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PX_4_PY_2_ROUNDED_XL, className)}>
    {stopping ? <MotionLoadingIcon className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0} /> : <Square className={MOTION_STYLES.W_3_5_H_3_5_FILL_CURRENT} />}
    <span>{label}</span>
  </Button>
);
const MotionLogSectionCard: FC<{ section: MotionLogSection; lang: "vi" | "en"; index: number; defaultOpen: boolean }> = ({ section, lang, index, defaultOpen }) => {
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const open = expanded ?? defaultOpen;
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const text = LOG.TEXT[lang];
  const rows = section.rows.filter((row) => row.visible);
  useLayoutEffect(() => {
    if (open && following.current && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [rows.length, open]);
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <section className={LOG.UI.SECTION} data-motion-log-section={section.key} data-state={section.state}>
      <button type="button" className={LOG.UI.HEADER} aria-expanded={open} aria-controls={bodyId} onClick={() => setExpanded(!open)}>
        <span className={LOG.UI.NUMBER}>{index + 1}</span>
        <span className={LOG.UI.TITLE}>{LOG.LABELS[lang][section.key as keyof typeof LOG.LABELS.vi]}</span>
        <span className={cn(LOG.UI.BADGE, LOG.UI.STATES[section.state])}>{text[section.state as "waiting" | "active" | "done" | "error" | "previous_error" | "cancelled" | "recorded"]}</span>
        <Icon className={LOG.UI.CHEVRON} aria-hidden={true} />
      </button>
      <p className={LOG.UI.SUMMARY} data-motion-log-summary>
        <span className={LOG.UI.SUMMARY_TEXT}>{section.summary}</span>
      </p>
      <div id={bodyId} hidden={!open}>
        <div
          ref={box}
          className={LOG.UI.BODY}
          data-motion-log-rows
          onScroll={() => {
            if (box.current) following.current = box.current.scrollHeight - box.current.scrollTop - box.current.clientHeight < LOG.FOLLOW_DISTANCE;
          }}>
          {rows.length
            ? rows.map((row) => (
                <div key={row.key} className={LOG.UI.ROW}>
                  <time className={LOG.UI.TIME}>{row.time}</time>
                  <span className={LOG.UI.MESSAGE}>{row.message}</span>
                </div>
              ))
            : text.empty}
        </div>
        {!!section.rows.length && (
          <details className={LOG.UI.DETAIL}>
            <summary className={LOG.UI.DETAIL_TITLE}>
              {text.technical} ({text.count(section.rows.length)})
            </summary>
            <div className={LOG.UI.TECHNICAL}>
              {section.rows.map((row) => (
                <div key={row.key}>{row.raw}</div>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
};
export const MotionFlowLog: FC<{ entries: MotionLogEntry[]; label?: (kind: string) => string; className?: string; lang?: string; job?: MotionStoryJobState | null; renderJob?: MotionJobState | null }> = ({ entries, className, lang = "vi", job, renderJob }) => {
  const language = lang === "en" ? "en" : "vi";
  const sections = motionLogSections(entries, language, job, renderJob);
  const latest = sections.reduce<MotionLogSection | undefined>((last, section) => (!last || section.lastOrder > last.lastOrder ? section : last), undefined);
  const active = sections.some((section) => section.state === "active" || section.state === "error");
  return (
    <div className={cn(LOG.UI.WRAP, className)} {...{ [MOTION_STORY_CONFIG.BUSY_ALLOW_ATTR]: true }}>
      {sections.map((section, index) => (
        <MotionLogSectionCard key={entries[0]?.id + ":" + section.key} section={section} lang={language} index={index} defaultOpen={section.state === "active" || section.state === "error" || (!active && latest?.key === section.key && !!section.rows.length)} />
      ))}
    </div>
  );
};
export const ElapsedLine: FC<{ since: number; label: string; suffix: string }> = ({ since, label, suffix }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_MEDIUM_TEXT_PURPLE_400}>
      <MotionLoadingIcon className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN_TEXT_PURPLE_400_SHRINK_0} />
      <span>
        {label}
        {MOTION_TEXT_SYMBOL}
      </span>
      <span className={MOTION_STYLES.FONT_MONO_TEXT_SLATE_400}>
        {suffix} {formatSeconds((now - since) / 1000)}
      </span>
    </div>
  );
};
export const MotionAnalysisTabButton: FC<{ active: boolean; onClick: () => void; label: string; prefix?: string; count?: number }> = ({ active, onClick, label, prefix, count }) => (
  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={onClick} className={cn(MOTION_STYLES.PX_2_5_PY_1_5_ROUNDED_LG_TEXT_XS_FONT_BOLD_TRANSITION_ALL_CURSOR_POINTER, active ? MOTION_STYLES.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_TEXT_WHITE_SHADOW_XS_FONT_BLACK : MOTION_STYLES.TEXT_SLATE_400_HOVER_TEXT_SLATE_100_HOVER_BG_SLATE_900_60)}>
    {prefix}
    {label}
    {count !== undefined && (
      <>
        {MOTION_TEXT_SYMBOL_6}
        {count}
        {MOTION_TEXT_SYMBOL_7}
      </>
    )}
  </Button>
);
export const MotionProgressBar: FC<{ progress?: number; minimum?: number; className?: string; animated?: boolean }> = ({ progress, minimum = 0, className, animated = true }) => (
  <div className={cn(MOTION_STYLES.ROUNDED_FULL_BG_SLATE_800_OVERFLOW_HIDDEN, className)}>
    <div className={animated ? MOTION_STYLES.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA_PINK_500_TO_PURPLE_500_ROUNDED_FULL_ANIMATE_PULSE : MOTION_STYLES.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA_FUCHSIA_500_TO_PINK_500_TRANSITION_ALL_DURATION_300} style={{ width: formatMotionProgress(progress, minimum) }} />
  </div>
);
export const MotionLoadingIcon: FC<{ className?: string }> = ({ className = MOTION_STYLES.W_4_H_4_ANIMATE_SPIN_TEXT_PURPLE_400_SHRINK_0 }) => <Sparkles className={className} aria-hidden={true} />;
export const MotionSelectField: FC<SelectHTMLAttributes<HTMLSelectElement> & { label: React.ReactNode; wrapperClassName?: string; labelClassName?: string }> = ({ label, wrapperClassName = MOTION_STYLES.STEP1_TOGGLE_WRAPPER, labelClassName = MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE, id, children, ...props }) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className={wrapperClassName}>
      <label htmlFor={selectId} className={labelClassName}>
        {label}
      </label>
      <StudioSelect {...props} id={selectId}>
        {children}
      </StudioSelect>
    </div>
  );
};
export const MotionStatCard: FC<{ icon: typeof Film; iconClassName: string; label: React.ReactNode; children: React.ReactNode; valueClassName?: string }> = ({ icon: Icon, iconClassName, label, children, valueClassName = MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_TRUNCATE }) => (
  <div className={MOTION_STYLES.BG_SLATE_955_60_BORDER_BORDER_SLATE_800_ROUNDED_XL_P_2_5_FLEX_ITEMS_CENTER}>
    <Icon className={iconClassName} />
    <div className={MOTION_STYLES.MIN_W_0}>
      <div className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE}>{label}</div>
      <div className={valueClassName}>{children}</div>
    </div>
  </div>
);
