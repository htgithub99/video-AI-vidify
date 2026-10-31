import type { LucideIcon } from "lucide-react";
import * as MR from "../../../constants/motionRuntime.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { cn } from "../../../lib/utils.js";
import { Button } from "../../../components/ui/Button.js";
import { ToggleIndicator as MotionToggleIndicator } from "../../../components/common/ToggleIndicator.js";
export { MotionToggleIndicator };
export type { ToggleIndicatorProps as MotionToggleIndicatorProps } from "../../../components/common/ToggleIndicator.js";
export interface MotionToggleProps {
  checked: boolean;
  label: string;
  title: string;
  text: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}
export const MotionToggle = ({ checked, label, title, text, icon: Icon, onClick, disabled, className = S.RENDER_CONTROL_CARD }: MotionToggleProps) => (
  <Button variant={MR.MOTION_TEXT_UNSTYLED} role={MR.MOTION_TEXT_SWITCH} aria-checked={checked} aria-label={label} title={title} disabled={disabled} onClick={onClick} className={cn(className, disabled && S.SFX_TOGGLE_CONTAINER_DISABLED)}>
    <div className={S.RENDER_CONTROL_INFO}>
      <Icon className={cn(S.W_3_5_H_3_5_SHRINK_0, checked ? S.TEXT_PURPLE_400 : S.TEXT_SLATE_400)} />
      <span className={S.RENDER_CONTROL_LABEL}>{text}</span>
    </div>
    <MotionToggleIndicator checked={checked} />
  </Button>
);
