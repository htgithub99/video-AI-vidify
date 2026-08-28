import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Type } from "lucide-react";
import { THUMBNAIL_TEXT_MODE_CONFIG } from "../../constants/config";
import { ThumbnailTextMode } from "../../types";
import { THUMBNAIL_TEXT_GROUPS } from "../../constants/texts";

interface ThumbnailTextModeSelectProps {
  value: ThumbnailTextMode;
  onChange: (value: ThumbnailTextMode) => void;
  language: "vi" | "en";
  label: string;
}

export const ThumbnailTextModeSelect: React.FC<ThumbnailTextModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(THUMBNAIL_TEXT_GROUPS, language, THUMBNAIL_TEXT_GROUPS.vi);
  const descriptions = _.get(THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS, language, THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS.vi);
  const currentDesc = _.get(descriptions, value, "");

  return (
    <div className={cn("space-y-1")}>
      <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={currentDesc}>
        {label}
      </span>
      <div className={cn("relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors")} title={currentDesc}>
        <Type className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
        <select value={value} onChange={(event) => onChange(event.target.value as ThumbnailTextMode)} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
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
