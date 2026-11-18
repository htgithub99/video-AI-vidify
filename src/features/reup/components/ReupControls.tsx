import type { FC, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { StudioInput } from "../../../components/ui/Studio.js";
import { MotionSelectField } from "../../motion/components/MotionControls.js";
import { MotionToggle } from "../../motion/components/MotionToggle.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
export interface ReupOption<T extends string | number> {
  value: T;
  label: string;
}
/** A Video Motion select field fed by a list of options. */
export const ReupSelect = <T extends string | number>({ label, value, options, onChange, disabled, title }: { label: ReactNode; value: T; options: ReupOption<T>[]; onChange: (value: T) => void; disabled?: boolean; title?: string }) => (
  <MotionSelectField label={label} value={String(value)} title={title} disabled={disabled} className={S.SELECT} onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)?.value ?? value)}>
    {options.map((o) => (
      <option key={String(o.value)} value={String(o.value)}>
        {o.label}
      </option>
    ))}
  </MotionSelectField>
);
/** A Video Motion on/off card with its small caption above. */
export const ReupToggle: FC<{ label: string; checked: boolean; on: string; off: string; icon: LucideIcon; hint?: string; disabled?: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, on, off, icon, hint, disabled, onChange }) => (
  <div className={S.FIELD}>
    <span className={S.FIELD_LABEL}>{label}</span>
    <MotionToggle checked={checked} label={label} icon={icon} text={checked ? on : off} title={hint || label} disabled={disabled} onClick={() => onChange(!checked)} />
  </div>
);
/** A labelled text input in the same look as the selects; it reports its value when the field is left. */
export const ReupTextField: FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number; disabled?: boolean }> = ({ label, value, onChange, placeholder, maxLength, disabled }) => (
  <label className={S.FIELD}>
    <span className={S.FIELD_LABEL}>{label}</span>
    <StudioInput deferred className={S.INPUT} value={value} placeholder={placeholder} maxLength={maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
  </label>
);
export const reupClock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
/** Save a served file through the browser's own download. */
export const reupDownload = (url: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = url.split("/").pop() || "";
  link.click();
};
