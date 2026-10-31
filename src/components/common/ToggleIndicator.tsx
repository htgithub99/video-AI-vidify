import { TOGGLE_STYLES as S } from "../../constants/toggleStyles.js";
import { cn } from "../../lib/utils.js";
export interface ToggleIndicatorProps {
  checked: boolean;
  trackClassName?: string;
  activeTrackClassName?: string;
  inactiveTrackClassName?: string;
  thumbClassName?: string;
  activeThumbClassName?: string;
  inactiveThumbClassName?: string;
}
export const ToggleIndicator = ({ checked, trackClassName = S.TRACK, activeTrackClassName = S.ACTIVE, inactiveTrackClassName = S.INACTIVE, thumbClassName = S.THUMB, activeThumbClassName = S.THUMB_ACTIVE, inactiveThumbClassName = S.THUMB_INACTIVE }: ToggleIndicatorProps) => (
  <span aria-hidden aria-checked={checked} className={cn(trackClassName, checked ? activeTrackClassName : inactiveTrackClassName)}>
    <span className={cn(thumbClassName, checked ? activeThumbClassName : inactiveThumbClassName)} />
  </span>
);
