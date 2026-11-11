import type { LucideIcon } from "lucide-react";
import { CHAT_PLANNING_STYLES as S } from "../../constants/chatPlanningStyles.js";
import * as ST from "../../constants/sourceText.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import { ToggleField } from "./ToggleField.js";
import { ToggleIndicator } from "./ToggleIndicator.js";
export const PlanningToggleField = ({ checked, label, text, title, icon: Icon, onChange, disabled }: { checked: boolean; label: string; text: string; title: string; icon: LucideIcon; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <ToggleField checked={checked} label={label} text={text} title={title} icon={Icon} onClick={() => onChange(!checked)} disabled={disabled} className={S.TOGGLE_BUTTON} infoClassName={S.TOGGLE_LABEL} textClassName={S.TOGGLE_TEXT} iconClassName={S.TOGGLE_ICON} activeIconClassName={S.TOGGLE_ICON_ON} inactiveIconClassName={S.TOGGLE_ICON_OFF} />
);
export const PlanningChipToggle = ({ checked, label, onText, offText, title, icon: Icon, onChange, disabled }: { checked: boolean; label: string; onText: string; offText: string; title: string; icon: LucideIcon; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <Button type={ST.SOURCE_TEXT_BUTTON} variant={ST.SOURCE_TEXT_UNSTYLED} role={ST.SOURCE_TEXT_SWITCH} aria-checked={checked} aria-label={label} title={title} onClick={() => onChange(!checked)} disabled={disabled} className={cn(S.CHIP, checked && S.CHIP_ON)}>
    <span className={S.CHIP_LABEL}>
      <Icon className={cn(S.TOGGLE_ICON, checked ? S.TOGGLE_ICON_ON : S.TOGGLE_ICON_OFF)} />
      <span className={S.CHIP_STACK}>
        <span className={cn(S.CHIP_TEXT, !checked && S.CHIP_HIDDEN)}>{onText}</span>
        <span className={cn(S.CHIP_TEXT, checked && S.CHIP_HIDDEN)}>{offText}</span>
      </span>
    </span>
    <ToggleIndicator checked={checked} />
  </Button>
);
