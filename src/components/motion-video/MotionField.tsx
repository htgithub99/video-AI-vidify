import type { FC, ReactNode } from "react";
import { MOTION_TEXT_FLEX_FLEX_COL_GAP_1_5, MOTION_TEXT_TEXT_10PX_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT } from "../../constants/motionRuntime.js";
export const MotionField: FC<{ label: ReactNode; children: ReactNode; className?: string; labelClassName?: string }> = ({ label, children, className = MOTION_TEXT_FLEX_FLEX_COL_GAP_1_5, labelClassName = MOTION_TEXT_TEXT_10PX_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT }) => (
  <label className={className}>
    <span className={labelClassName}>{label}</span>
    {children}
  </label>
);
