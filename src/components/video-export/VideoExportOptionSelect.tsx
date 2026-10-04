import { VIDEO_EXPORT_TEMPLATE_SYMBOL_2 } from "../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { VideoExportOptionItem, VideoExportOptionSection } from "./VideoExportOptionGrid.js";
import { getVideoExportOptions } from "./videoExportUtils";
type VideoExportOptionSelectProps<T extends string | number> = {
  id?: string;
  label: string;
  hint?: string;
  value: T;
  options?: VideoExportOptionItem<T>[];
  sections?: VideoExportOptionSection<T>[];
  disabled?: boolean;
  onChange: (value: T) => void;
};
export const VideoExportOptionSelect = <T extends string | number>({ id, label, hint, value, options = [], sections, disabled = false, onChange }: VideoExportOptionSelectProps<T>): ReturnType<FC> => {
  const allItems = getVideoExportOptions(options, sections);
  const selectedItem = _.find(allItems, (item) => item.value === value);
  const SelectedIcon = selectedItem?.icon;
  return (
    <div className={cn("space-y-1.5 pt-0.5 text-left")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <label htmlFor={id} className={cn("text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider")}>
          {label}
        </label>
        {hint && <span className={cn("text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 truncate")}>{hint}</span>}
      </div>
      <div className={cn("relative flex items-center")}>
        {SelectedIcon && (
          <div className={cn("absolute left-2.5 pointer-events-none text-purple-600 dark:text-purple-400")}>
            <SelectedIcon className={cn("w-3.5 h-3.5")} />
          </div>
        )}
        <select
          id={id}
          disabled={disabled}
          value={`${value}`}
          onChange={(e) => {
            const rawVal = e.target.value;
            const matched = _.find(allItems, (item) => `${item.value}` === rawVal);
            if (matched) onChange(matched.value);
          }}
          className={cn(
            "w-full h-9 rounded-xl border font-mono font-bold text-xs appearance-none pr-8 cursor-pointer transition-all outline-none select-none disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs",
            SelectedIcon ? "pl-8" : "pl-3",
            "bg-white dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-purple-400 dark:hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
          )}>
          {_.isEmpty(sections)
            ? _.map(options, (option) => (
                <option key={`${option.value}`} value={`${option.value}`} className={cn("bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100")}>
                  {option.label}
                </option>
              ))
            : _.map(sections, (section) => (
                <optgroup key={section.key} label={VIDEO_EXPORT_TEMPLATE_SYMBOL_2(`${section.label}`)} className={cn("bg-slate-100 dark:bg-slate-950 font-bold text-purple-700 dark:text-purple-300")}>
                  {_.map(section.options, (option) => (
                    <option key={`${option.value}`} value={`${option.value}`} className={cn("bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100")}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
        </select>
        <div className={cn("absolute right-2.5 pointer-events-none text-slate-400")}>
          <ChevronDown className={cn("w-3.5 h-3.5")} />
        </div>
      </div>
    </div>
  );
};
