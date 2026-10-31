import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/Button.js";
import { CHAT_PLANNING_STYLES as S } from "../../constants/chatPlanningStyles.js";
import * as ST from "../../constants/sourceText.js";
import { cn } from "../../lib/utils.js";
import { ToggleIndicator } from "./ToggleIndicator.js";
export const PlanningToggleField = ({ checked, label, text, title, icon: Icon, onChange, disabled }: { checked: boolean; label: string; text: string; title: string; icon: LucideIcon; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <Button type={ST.SOURCE_TEXT_BUTTON} variant={ST.SOURCE_TEXT_UNSTYLED} role={ST.SOURCE_TEXT_SWITCH} aria-checked={checked} aria-label={label} title={title} onClick={() => onChange(!checked)} disabled={disabled} className={S.TOGGLE_BUTTON}>
    <span className={S.TOGGLE_LABEL}>
      <Icon className={cn(S.TOGGLE_ICON, checked ? S.TOGGLE_ICON_ON : S.TOGGLE_ICON_OFF)} />
      <span className={S.TOGGLE_TEXT}>{text}</span>
    </span>
    <ToggleIndicator checked={checked} />
  </Button>
);
