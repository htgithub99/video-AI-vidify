import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/Button.js";
import * as ST from "../../constants/sourceText.js";
import { TOGGLE_ELEMENTS } from "../../constants/toggleStyles.js";
import { cn } from "../../lib/utils.js";
import { ToggleIndicator } from "./ToggleIndicator.js";
export interface ToggleFieldProps {
  checked: boolean;
  label: string;
  text: string;
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  infoClassName: string;
  textClassName: string;
  iconClassName: string;
  activeIconClassName: string;
  inactiveIconClassName: string;
  infoTag?: "span" | "div";
}
export const ToggleField = ({ checked, label, text, title, icon: Icon, onClick, disabled, className, infoClassName, textClassName, iconClassName, activeIconClassName, inactiveIconClassName, infoTag: Info = TOGGLE_ELEMENTS.INLINE }: ToggleFieldProps) => (
  <Button type={ST.SOURCE_TEXT_BUTTON} variant={ST.SOURCE_TEXT_UNSTYLED} role={ST.SOURCE_TEXT_SWITCH} aria-checked={checked} aria-label={label} title={title} onClick={onClick} disabled={disabled} className={className}>
    <Info className={infoClassName}>
      <Icon className={cn(iconClassName, checked ? activeIconClassName : inactiveIconClassName)} />
      <span className={textClassName}>{text}</span>
    </Info>
    <ToggleIndicator checked={checked} />
  </Button>
);
