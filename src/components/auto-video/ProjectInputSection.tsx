import React from "react";
import _ from "lodash";
import { Check, Clock, FileText, Globe, Layers, Sliders, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { ProjectInputType, ProjectLanguage } from "../../types";
import { DURATION_OPTIONS, GENRE_OPTION_GROUPS, PROJECT_LANGUAGE_OPTIONS, REFACTOR_CONSTANTS, SPLIT_STRATEGY_OPTIONS, genreLabels } from "../../constants";
import { PIPELINE_STEPS } from "../../constants/enums";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface ProjectInputSectionProps { inputType: ProjectInputType; setInputType: (type: ProjectInputType) => void; scriptContent: string; setScriptContent: (val: string) => void; genre: string; setGenre: (val: string) => void; language: ProjectLanguage; setLanguage: (val: ProjectLanguage) => void; duration: string; setDuration: (val: string) => void; splitStrategy: string; setSplitStrategy: (val: string) => void; splitLabelMap: Record<string, string>; T: ReturnType<typeof getAutoVideoTexts>; lockedGenreLabel?: string; }

export const ProjectInputSection: React.FC<ProjectInputSectionProps> = ({ inputType, setInputType, scriptContent, setScriptContent, genre, setGenre, language, setLanguage, duration, setDuration, splitStrategy, setSplitStrategy, splitLabelMap, T, lockedGenreLabel }) => {
  const wordCount = _.size(_.words(scriptContent));
  const charCount = _.size(scriptContent);

  const inputTypeCards = [
    {
      type: ProjectInputType.Script,
      icon: <FileText className="w-4 h-4 text-rose-600" />,
      label: T.inputTypeScript,
      tooltip: T.inputTypeScriptTooltip,
    },
    {
      type: ProjectInputType.Idea,
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      label: T.inputTypeIdea,
      tooltip: T.inputTypeIdeaTooltip,
    },
  ] as const;

  const selectFields = [
    {
      label: T.lblGenre,
      icon: <Layers className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" />,
      value: genre,
      onChange: setGenre,
      optionGroups: GENRE_OPTION_GROUPS,
    },
    {
      label: T.lblLanguage,
      icon: <Globe className="w-3.5 h-3.5 text-sky-400 mr-2 shrink-0" />,
      value: language,
      onChange: (v: string) => setLanguage(v as ProjectLanguage),
      options: _.map(PROJECT_LANGUAGE_OPTIONS, (l) => ({
        value: l.value,
        label: _.isEqual(l.value, ProjectLanguage.VI) ? T.langVi : T.langEn,
      })),
    },
    {
      label: T.lblDuration,
      icon: <Clock className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />,
      value: duration,
      onChange: setDuration,
      options: _.map(DURATION_OPTIONS, (d) => ({ value: d.val, label: d.label })),
    },
    {
      label: T.lblSplitStrategy,
      icon: <Sliders className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />,
      value: splitStrategy,
      onChange: setSplitStrategy,
      options: _.map(SPLIT_STRATEGY_OPTIONS, (s) => ({
        value: s.value,
        label: _.get(splitLabelMap, s.value, s.value),
      })),
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-emerald-500/20">{PIPELINE_STEPS.STEP_1}</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5" title={T.sec1TitleTooltip}>
            <FileText className="w-3.5 h-3.5 text-emerald-400" /> {T.sec1Title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
          <span>
            {wordCount} {_.get(T, "lblWords", "từ")}
          </span>
          <span className="text-slate-600">•</span>
          <span>
            {charCount} {_.get(T, "lblChars", "ký tự")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {_.map(inputTypeCards, ({ type, icon, label, tooltip }) => {
          const isSelected = _.isEqual(inputType, type);
          return (
            <Button
              key={type}
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
              onClick={() => setInputType(type)}
              className={cn("p-3 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[50px]", isSelected ? "bg-rose-500/15 border-rose-500/80 text-rose-600 font-black shadow-xs ring-1 ring-rose-500/30" : "bg-slate-955/70 border-slate-800/80 text-slate-700 hover:border-slate-700 hover:text-slate-100 font-bold")}
              title={tooltip}>
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-xs">{label}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-rose-600 stroke-[3]" />}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <textarea rows={4} value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea} className="w-full bg-slate-955/90 border border-slate-800/90 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-none shadow-inner transition-all placeholder:text-slate-500 font-sans" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {_.map(selectFields, ({ label, icon, value, onChange, options, optionGroups }, fieldIndex) => (
          <div key={label} className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block truncate">{label}</span>
            <div className="relative flex items-center bg-slate-955/80 border border-slate-800/80 rounded-xl px-3 py-2.5 focus-within:border-rose-500/60 focus-within:ring-1 focus-within:ring-rose-500/20 transition-all hover:border-slate-700/80">
              {icon}
              {fieldIndex === 0 && lockedGenreLabel ? (
                <span className="flex-1 text-amber-300 text-xs font-semibold truncate">{lockedGenreLabel}</span>
              ) : (
                <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                  {optionGroups
                    ? _.map(optionGroups, (group) => (
                        <optgroup key={group.label} label={group.label} className="bg-slate-955 text-slate-400">
                          {_.map(group.options, (option) => (
                            <option key={option} value={option} className="bg-slate-955 text-slate-300">
                              {genreLabels[option as keyof typeof genreLabels] || option}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    : _.map(options, (o) => (
                        <option key={o.value} value={o.value} className="bg-slate-955 text-slate-300">
                          {o.label}
                        </option>
                      ))}
                </select>
              )}
              {!(fieldIndex === 0 && lockedGenreLabel) && <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
