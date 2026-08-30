import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Layers } from "lucide-react";
import { BackgroundMode } from "../../types";
import { BACKGROUND_MODE_CONFIG } from "../../constants/config";
import { BACKGROUND_OPTION_GROUPS } from "../../constants/texts";

interface BackgroundModeSelectProps {
  value: BackgroundMode;
  onChange: (value: BackgroundMode) => void;
  language: "vi" | "en";
  label: string;
}

export const BackgroundModeSelect: React.FC<BackgroundModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(BACKGROUND_OPTION_GROUPS, language, BACKGROUND_OPTION_GROUPS.vi);
  const descriptions = _.get(BACKGROUND_MODE_CONFIG.DESCRIPTIONS, language, BACKGROUND_MODE_CONFIG.DESCRIPTIONS.vi);
  const currentDesc = _.get(descriptions, value, "");

  return (
    <div className={cn("space-y-1")}>
      <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={currentDesc}>
        {label}
      </span>
      <div
        className={cn("relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 h-10 focus-within:border-rose-500/50 transition-colors")}
        title={currentDesc}>
        <Layers className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as BackgroundMode)}
          className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
          {_.map(groups, (group) => (
            <optgroup key={group.label} label={group.label} className={cn("bg-slate-955 text-slate-400 font-bold")}>
              {_.map(group.options, (option) => (
                <option key={option.value} value={option.value} title={option.desc} className={cn("bg-slate-955 text-slate-300 font-normal")}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
      </div>
    </div>
  );
};
