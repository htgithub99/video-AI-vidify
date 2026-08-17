import React from "react";
import _ from "lodash";
import { Check, Clock, FileText, Globe, Layers, Sliders, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { ProjectInputType, ProjectLanguage } from "../../types";
import { DURATION_OPTIONS, GENRE_OPTION_GROUPS, PROJECT_LANGUAGE_OPTIONS, REFACTOR_CONSTANTS, SPLIT_STRATEGY_OPTIONS, genreLabels } from "../../constants";

interface ProjectInputSectionProps {
  inputType: ProjectInputType;
  setInputType: (type: ProjectInputType) => void;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  genre: string;
  setGenre: (val: string) => void;
  language: ProjectLanguage;
  setLanguage: (val: ProjectLanguage) => void;
  duration: string;
  setDuration: (val: string) => void;
  splitStrategy: string;
  setSplitStrategy: (val: string) => void;
  splitLabelMap: Record<string, string>;
  T: any;
}

export const ProjectInputSection: React.FC<ProjectInputSectionProps> = ({
  inputType,
  setInputType,
  scriptContent,
  setScriptContent,
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
}) => {
  const wordCount = _.size(_.words(scriptContent));
  const charCount = _.size(scriptContent);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-emerald-500/20">1</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5" title={T.sec1TitleTooltip}>
            <FileText className="w-3.5 h-3.5 text-emerald-400" /> {T.sec1Title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
          <span>{wordCount} {T.lblWords || "từ"}</span>
          <span className="text-slate-600">•</span>
          <span>{charCount} {T.lblChars || "ký tự"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([
          { type: ProjectInputType.Script, icon: <FileText className="w-4 h-4 text-rose-500" />, label: T.inputTypeScript, tooltip: T.inputTypeScriptTooltip },
          { type: ProjectInputType.Idea, icon: <Sparkles className="w-4 h-4 text-amber-400" />, label: T.inputTypeIdea, tooltip: T.inputTypeIdeaTooltip },
        ] as const).map(({ type, icon, label, tooltip }) => (
          <Button
            key={type}
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
            onClick={() => setInputType(type)}
            className={cn(
              "p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between cursor-pointer",
              _.isEqual(inputType, type)
                ? "bg-gradient-to-r from-rose-500/15 to-amber-500/10 border-rose-500/60 text-rose-300 ring-1 ring-rose-500/30 font-bold shadow-md shadow-rose-950/50"
                : "bg-slate-950/70 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200",
            )}
            title={tooltip}
          >
            <div className="flex items-center gap-2.5">{icon}<span className="text-xs font-semibold">{label}</span></div>
            {_.isEqual(inputType, type) && <Check className="w-4 h-4 text-rose-400" />}
          </Button>
        ))}
      </div>

      <div className="relative">
        <textarea
          rows={4}
          value={scriptContent}
          onChange={(e) => setScriptContent(e.target.value)}
          placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea}
          className="w-full bg-slate-950/90 border border-slate-800/90 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-none shadow-inner transition-all placeholder:text-slate-500 font-sans"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: T.lblGenre, icon: <Layers className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" />, value: genre, onChange: setGenre, optionGroups: GENRE_OPTION_GROUPS },
          { label: T.lblLanguage, icon: <Globe className="w-3.5 h-3.5 text-sky-400 mr-2 shrink-0" />, value: language, onChange: (v: string) => setLanguage(v as ProjectLanguage), options: _.map(PROJECT_LANGUAGE_OPTIONS, (l) => ({ value: l.value, label: _.isEqual(l.value, "vi") ? T.langVi : T.langEn })) },
          { label: T.lblDuration, icon: <Clock className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />, value: duration, onChange: setDuration, options: _.map(DURATION_OPTIONS, (d) => ({ value: d.val, label: d.label })) },
          { label: T.lblSplitStrategy, icon: <Sliders className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />, value: splitStrategy, onChange: setSplitStrategy, options: _.map(SPLIT_STRATEGY_OPTIONS, (s) => ({ value: s.value, label: _.get(splitLabelMap, s.value, s.value) })) },
        ].map(({ label, icon, value, onChange, options, optionGroups }) => (
          <div key={label} className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block truncate">{label}</span>
            <div className="relative flex items-center bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2.5 focus-within:border-rose-500/60 focus-within:ring-1 focus-within:ring-rose-500/20 transition-all hover:border-slate-700/80">
              {icon}
              <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                {optionGroups
                  ? _.map(optionGroups, (group) => (
                    <optgroup key={group.label} label={group.label} className="bg-slate-950 text-slate-400">
                      {_.map(group.options, (option) => <option key={option} value={option} className="bg-slate-950 text-slate-300">{genreLabels[option as keyof typeof genreLabels] || option}</option>)}
                    </optgroup>
                  ))
                  : _.map(options, (o) => <option key={o.value} value={o.value} className="bg-slate-950 text-slate-300">{o.label}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
