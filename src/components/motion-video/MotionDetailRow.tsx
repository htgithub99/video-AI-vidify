import * as MR from "../../constants/motionRuntime.js";
import type { FC, ReactNode } from "react";
export const MotionDetailRow: FC<{ label: ReactNode; children: ReactNode; className?: string; }> = ({ label, children, className }) => (
  <p className={className}>
    <span className={MR.MOTION_TEXT_TEXT_SLATE_500_FONT_MEDIUM}>{label}</span>
    {children}
  </p>
);
