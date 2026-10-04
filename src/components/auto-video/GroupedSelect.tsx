import _ from "lodash";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { GROUPED_SELECT_CLASS_NAME } from "../../constants";
import { cn } from "../../lib/utils";
interface SelectOption {
  value: string;
  label: string;
  desc: string;
}
export interface SelectOptionGroup {
  label: string;
  options: readonly SelectOption[];
}
interface GroupedSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  label: string;
  icon: LucideIcon;
  groups: readonly SelectOptionGroup[];
  descriptions: Partial<Record<T, string>>;
}
export const GroupedSelect = <T extends string>({ value, onChange, label, icon: Icon, groups, descriptions }: GroupedSelectProps<T>) => {
  const currentDescription = descriptions[value] || "";
  return (
    <div className={cn(GROUPED_SELECT_CLASS_NAME.WRAPPER)}>
      <span className={cn(GROUPED_SELECT_CLASS_NAME.LABEL)} title={currentDescription}>
        {label}
      </span>
      <div className={cn(GROUPED_SELECT_CLASS_NAME.CONTROL)} title={currentDescription}>
        <Icon className={cn(GROUPED_SELECT_CLASS_NAME.ICON)} />
        <select value={value} onChange={(event) => onChange(event.target.value as T)} className={cn(GROUPED_SELECT_CLASS_NAME.SELECT)}>
          {_.map(groups, (group) => (
            <optgroup key={group.label} label={group.label} className={cn(GROUPED_SELECT_CLASS_NAME.GROUP)}>
              {_.map(group.options, (option) => (
                <option key={option.value} value={option.value} title={option.desc} className={cn(GROUPED_SELECT_CLASS_NAME.OPTION)}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className={cn(GROUPED_SELECT_CLASS_NAME.CHEVRON)} />
      </div>
    </div>
  );
};
