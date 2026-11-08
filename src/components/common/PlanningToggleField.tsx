import type { LucideIcon } from "lucide-react";
import { CHAT_PLANNING_STYLES as S } from "../../constants/chatPlanningStyles.js";
import { ToggleField } from "./ToggleField.js";
export const PlanningToggleField = ({ checked, label, text, title, icon: Icon, onChange, disabled }: { checked: boolean; label: string; text: string; title: string; icon: LucideIcon; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <ToggleField checked={checked} label={label} text={text} title={title} icon={Icon} onClick={() => onChange(!checked)} disabled={disabled} className={S.TOGGLE_BUTTON} infoClassName={S.TOGGLE_LABEL} textClassName={S.TOGGLE_TEXT} iconClassName={S.TOGGLE_ICON} activeIconClassName={S.TOGGLE_ICON_ON} inactiveIconClassName={S.TOGGLE_ICON_OFF} />
);
