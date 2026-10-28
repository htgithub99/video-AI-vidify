import * as MR from "../../../constants/motionRuntime.js";
import type { FC, ReactNode } from "react";
export const MotionDetailRow: FC<{ label: ReactNode; children: ReactNode; className?: string; labelClassName?: string; valueClassName?: string }> = ({ label, children, className, labelClassName = MR.MOTION_TEXT_TEXT_SLATE_500_FONT_MEDIUM, valueClassName }) => (
  <p className={className}>
    <span className={labelClassName}>{label}</span>
    {valueClassName ? <span className={valueClassName}>{children}</span> : children}
  </p>
);
