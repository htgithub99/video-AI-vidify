import type { LucideIcon } from "lucide-react";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_STYLES as S } from "../../constants/motionStyles.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
export interface MotionToggleIndicatorProps { checked: boolean; trackClassName?: string; activeTrackClassName?: string; inactiveTrackClassName?: string; thumbClassName?: string; activeThumbClassName?: string; inactiveThumbClassName?: string; }
export const MotionToggleIndicator = ({ checked, trackClassName = S.TOGGLE_SWITCH_BASE, activeTrackClassName = S.TOGGLE_SWITCH_ACTIVE, inactiveTrackClassName = S.TOGGLE_SWITCH_INACTIVE, thumbClassName = S.TOGGLE_THUMB_BASE, activeThumbClassName = S.TOGGLE_THUMB_ACTIVE, inactiveThumbClassName = S.TOGGLE_THUMB_INACTIVE }: MotionToggleIndicatorProps) => (
  <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(trackClassName, checked ? activeTrackClassName : inactiveTrackClassName)}>
    <span className={cn(thumbClassName, checked ? activeThumbClassName : inactiveThumbClassName)} />
  </span>
);
export interface MotionToggleProps { checked: boolean; label: string; title: string; text: string; icon: LucideIcon; onClick: () => void; disabled?: boolean; className?: string; }
export const MotionToggle = ({ checked, label, title, text, icon: Icon, onClick, disabled, className = S.RENDER_CONTROL_CARD }: MotionToggleProps) => (
  <Button variant={MR.MOTION_TEXT_UNSTYLED} role={MR.MOTION_TEXT_SWITCH} aria-checked={checked} aria-label={label} title={title} disabled={disabled} onClick={onClick} className={cn(className, disabled && S.SFX_TOGGLE_CONTAINER_DISABLED)}>
    <div className={S.RENDER_CONTROL_INFO}>
      <Icon className={cn(S.W_3_5_H_3_5_SHRINK_0, checked ? S.TEXT_PURPLE_400 : S.TEXT_SLATE_400)} />
      <span className={S.RENDER_CONTROL_LABEL}>{text}</span>
    </div>
    <MotionToggleIndicator checked={checked} />
  </Button>
);
