import React from "react";
import _ from "lodash";
import { ChevronDown, Type } from "lucide-react";
import { TEXT_IN_IMAGE_MODE_CONFIG } from "../../constants/config";
import { TextInImageMode } from "../../types";
import { SCENE_TEXT_GROUPS } from "../../constants/texts";

interface SceneTextModeSelectProps { value: TextInImageMode; onChange: (value: TextInImageMode) => void; language: "vi" | "en"; label: string; }

export const SceneTextModeSelect: React.FC<SceneTextModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(SCENE_TEXT_GROUPS, language, SCENE_TEXT_GROUPS.vi);
  const descriptions = _.get(TEXT_IN_IMAGE_MODE_CONFIG.DESCRIPTIONS, language, TEXT_IN_IMAGE_MODE_CONFIG.DESCRIPTIONS.vi);
  const currentDesc = _.get(descriptions, value, "");

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={currentDesc}>
        {label}
      </span>
      <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={currentDesc}>
        <Type className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <select value={value} onChange={(event) => onChange(event.target.value as TextInImageMode)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
          {_.map(groups, (group) => (
            <optgroup key={group.label} label={group.label} className="bg-slate-955 text-slate-400 font-bold">
              {_.map(group.options, (option) => (
                <option key={option.value} value={option.value} title={option.desc} className="bg-slate-955 text-slate-300 font-normal">
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
      </div>
    </div>
  );
};
