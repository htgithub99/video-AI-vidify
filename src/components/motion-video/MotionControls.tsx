import { Film, Loader2, Sparkles, Square } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA, MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_2, MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT_2, MOTION_TEXT_BG_SLATE_100_HOVER_BG_SLATE_200_TEXT, MOTION_TEXT_BUTTON, MOTION_TEXT_PRIMARY, MOTION_TEXT_SYMBOL, MOTION_TEXT_SYMBOL_6, MOTION_TEXT_SYMBOL_7 } from "../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../../constants/motionStyles.js";
import { cn } from "../../lib/utils";
import { formatMotionProgress, formatSeconds } from "./motionApi.js";
export const StepHeader: FC<{
  n: string;
  icon: typeof Film;
  title: string;
  badge?: string;
  right?: React.ReactNode;
}> = ({ n, icon: Icon, title, badge, right }) => (
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
export const ChipButton: FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ active, onClick, children, disabled, className }) => (
  <button
    type={MOTION_TEXT_BUTTON}
    disabled={disabled}
    onClick={onClick}
    className={cn(MOTION_STYLES.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_MONO_FONT_BOLD_BORDER, active ? MOTION_STYLES.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_BORDER_PURPLE_400_TEXT_WHITE_SHADOW_PURPLE_600_30_SHADOW_MD : MOTION_STYLES.BORDER_SLATE_800_BG_SLATE_955_80_TEXT_SLATE_300_HOVER_TEXT_WHITE_HOVER_BORDER_PURPLE_500_40_HOVER_BG_SLATE_900, className)}>
    {children}
  </button>
);
export const ActionBtn: FC<{
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  icon: typeof Film;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}> = ({ onClick, disabled, busy, icon: Icon, children, className, variant = MOTION_TEXT_PRIMARY }) => {
  const styles = {
    primary: busy ? MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA : MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_2,
    secondary: MOTION_TEXT_BG_SLATE_100_HOVER_BG_SLATE_200_TEXT,
    danger: MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT_2,
  };
  return (
    <button type={MOTION_TEXT_BUTTON} onClick={onClick} disabled={disabled || busy} className={cn(MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PX_4_PY_2_5_ROUNDED_XL, styles[variant], className)}>
      {busy ? <Sparkles className={MOTION_STYLES.W_4_H_4_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0} /> : <Icon className={MOTION_STYLES.W_4_H_4_SHRINK_0} />}
      <span>{children}</span>
    </button>
  );
};
export const StopBtn: FC<{
  onClick: () => void;
  label: string;
  stopping?: boolean;
  className?: string;
}> = ({ onClick, label, stopping, className }) => (
  <button type={MOTION_TEXT_BUTTON} onClick={onClick} disabled={stopping} className={cn(MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PX_4_PY_2_ROUNDED_XL, className)}>
    {stopping ? <Loader2 className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN} /> : <Square className={MOTION_STYLES.W_3_5_H_3_5_FILL_CURRENT} />}
    <span>{label}</span>
  </button>
);
export const ElapsedLine: FC<{ since: number; label: string; suffix: string }> = ({ since, label, suffix }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_MEDIUM_TEXT_PURPLE_400}>
      <Loader2 className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN} />
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
  <button type={MOTION_TEXT_BUTTON} onClick={onClick} className={cn(MOTION_STYLES.PX_2_5_PY_1_5_ROUNDED_LG_TEXT_XS_FONT_BOLD_TRANSITION_ALL_CURSOR_POINTER, active ? MOTION_STYLES.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_TEXT_WHITE_SHADOW_XS_FONT_BLACK : MOTION_STYLES.TEXT_SLATE_400_HOVER_TEXT_SLATE_100_HOVER_BG_SLATE_900_60)}>
    {prefix}
    {label}
    {count !== undefined && (
      <>
        {MOTION_TEXT_SYMBOL_6}
        {count}
        {MOTION_TEXT_SYMBOL_7}
      </>
    )}
  </button>
);
export const MotionProgressBar: FC<{ progress?: number; minimum?: number; className?: string; animated?: boolean }> = ({ progress, minimum = 0, className, animated = true }) => (
  <div className={cn(MOTION_STYLES.ROUNDED_FULL_BG_SLATE_800_OVERFLOW_HIDDEN, className)}>
    <div className={animated ? MOTION_STYLES.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA_PINK_500_TO_PURPLE_500_ROUNDED_FULL_ANIMATE_PULSE : MOTION_STYLES.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA_FUCHSIA_500_TO_PINK_500_TRANSITION_ALL_DURATION_300} style={{ width: formatMotionProgress(progress, minimum) }} />
  </div>
);
