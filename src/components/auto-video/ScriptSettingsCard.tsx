import React from "react";
import _ from "lodash";
import { Clock, Globe, Layers, Settings2, Sliders, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { ProjectLanguage } from "../../types";
import { DURATION_OPTIONS, GENRE_OPTION_GROUPS, PROJECT_LANGUAGE_OPTIONS, SPLIT_STRATEGY_OPTIONS, genreLabels } from "../../constants";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface ScriptSettingsCardProps {
  genre: string;
  setGenre: (val: string) => void;
  language: ProjectLanguage;
  setLanguage: (val: ProjectLanguage) => void;
  duration: string;
  setDuration: (val: string) => void;
  splitStrategy: string;
  setSplitStrategy: (val: string) => void;
  splitLabelMap: Record<string, string>;
  T: ReturnType<typeof getAutoVideoTexts>;
  lockedGenreLabel?: string;
}

export const ScriptSettingsCard: React.FC<ScriptSettingsCardProps> = ({
  genre,
  setGenre,
  language,
  setLanguage,
  duration,
  setDuration,
  splitStrategy,
  setSplitStrategy,
  splitLabelMap,
  T,
  lockedGenreLabel,
}) => {
  const selectFields = [
    {
      label: T.lblGenre,
      icon: <Layers className={cn("w-3.5 h-3.5 text-amber-400 mr-2 shrink-0")} />,
      value: genre,
      onChange: setGenre,
      optionGroups: GENRE_OPTION_GROUPS,
    },
    {
      label: T.lblLanguage,
      icon: <Globe className={cn("w-3.5 h-3.5 text-sky-400 mr-2 shrink-0")} />,
      value: language,
      onChange: (v: string) => setLanguage(v as ProjectLanguage),
      options: _.map(PROJECT_LANGUAGE_OPTIONS, (l) => ({
        value: l.value,
        label: _.isEqual(l.value, ProjectLanguage.VI) ? T.langVi : T.langEn,
      })),
    },
    {
      label: T.lblDuration,
      icon: <Clock className={cn("w-3.5 h-3.5 text-amber-400 mr-2 shrink-0")} />,
      value: duration,
      onChange: setDuration,
      options: _.map(DURATION_OPTIONS, (d) => ({ value: d.val, label: d.label })),
    },
    {
      label: T.lblSplitStrategy,
      icon: <Sliders className={cn("w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0")} />,
      value: splitStrategy,
      onChange: setSplitStrategy,
      options: _.map(SPLIT_STRATEGY_OPTIONS, (s) => ({
        value: s.value,
        label: _.get(splitLabelMap, s.value, s.value),
      })),
    },
  ];

  return (
    <div className={cn("glass-card rounded-3xl p-4 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center gap-2.5 relative z-10 border-b border-slate-800/80 pb-3")}>
        <span className={cn("w-6 h-6 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-amber-500/20 shrink-0")}>
          <Settings2 className={cn("w-3.5 h-3.5 text-amber-400")} />
        </span>
        <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono truncate")}>Cài đặt kịch bản</h3>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 relative z-10")}>
        {_.map(selectFields, ({ label, icon, value, onChange, options, optionGroups }, fieldIndex) => (
          <div key={label} className={cn("space-y-1.5 min-w-0")}>
            <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block truncate")}>{label}</span>
            <div className={cn("relative flex items-center bg-slate-955/80 border border-slate-850 rounded-xl px-3 h-10 transition-all hover:border-violet-500/50 focus-within:border-violet-500/80 focus-within:ring-1 focus-within:ring-violet-500/20")}>
              {icon}
              {fieldIndex === 0 && lockedGenreLabel ? (
                <span className={cn("flex-1 text-amber-400 text-xs font-semibold truncate")}>{lockedGenreLabel}</span>
              ) : (
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5 border-none truncate")}>
                  {optionGroups
                    ? _.map(optionGroups, (group) => (
                        <optgroup key={group.label} label={group.label} className={cn("bg-slate-950 text-slate-400")}>
                          {_.map(group.options, (option) => (
                            <option key={option} value={option} className={cn("bg-slate-950 text-slate-300")}>
                              {genreLabels[option as keyof typeof genreLabels] || option}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    : _.map(options, (o) => (
                        <option key={o.value} value={o.value} className={cn("bg-slate-950 text-slate-300")}>
                          {o.label}
                        </option>
                      ))}
                </select>
              )}
              {!(fieldIndex === 0 && lockedGenreLabel) && <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none")} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
