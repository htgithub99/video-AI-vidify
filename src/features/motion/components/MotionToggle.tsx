import type { LucideIcon } from "lucide-react";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { TOGGLE_ELEMENTS } from "../../../constants/toggleStyles.js";
import { cn } from "../../../lib/utils.js";
import { ToggleField } from "../../../components/common/ToggleField.js";
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
  <ToggleField
    checked={checked}
    label={label}
    text={text}
    title={title}
    icon={Icon}
    disabled={disabled}
    onClick={onClick}
    className={cn(className, disabled && S.SFX_TOGGLE_CONTAINER_DISABLED)}
    infoTag={TOGGLE_ELEMENTS.BLOCK}
    infoClassName={S.RENDER_CONTROL_INFO}
    textClassName={S.RENDER_CONTROL_LABEL}
    iconClassName={S.W_3_5_H_3_5_SHRINK_0}
    activeIconClassName={S.TEXT_PURPLE_400}
    inactiveIconClassName={S.TEXT_SLATE_400}
  />
);
