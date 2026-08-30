import React from "react";
import _ from "lodash";
import { Check, FileText, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { ProjectInputType } from "../../types";
import { REFACTOR_CONSTANTS } from "../../constants";
import { PIPELINE_STEPS } from "../../constants/enums";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface ProjectInputSectionProps {
  inputType: ProjectInputType;
  setInputType: (type: ProjectInputType) => void;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  T: ReturnType<typeof getAutoVideoTexts>;
}

export const ProjectInputSection: React.FC<ProjectInputSectionProps> = ({ inputType, setInputType, scriptContent, setScriptContent, T }) => {
  const wordCount = _.size(_.words(scriptContent));
  const charCount = _.size(scriptContent);

  const inputTypeCards = [
    {
      type: ProjectInputType.Script,
      icon: <FileText className={cn("w-4 h-4 text-rose-600")} />,
      label: T.inputTypeScript,
      tooltip: T.inputTypeScriptTooltip,
    },
    {
      type: ProjectInputType.Idea,
      icon: <Sparkles className={cn("w-4 h-4 text-amber-600")} />,
      label: T.inputTypeIdea,
      tooltip: T.inputTypeIdeaTooltip,
    },
  ] as const;

  return (
    <div className={cn("glass-card rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border-none bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("absolute top-0 right-0 w-80 h-80 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none")} />
      <div className={cn("flex items-center justify-between relative z-10")}>
        <div className={cn("flex items-center gap-2.5")}>
          <span className={cn("w-6 h-6 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-rose-500/20")}>
            {PIPELINE_STEPS.STEP_1}
          </span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} title={T.sec1TitleTooltip}>
            <FileText className={cn("w-3.5 h-3.5 text-rose-400")} /> {T.sec1Title}
          </h3>
        </div>
        <div className={cn("flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-slate-955/80 px-3 py-1 rounded-full shadow-inner")}>
          <span>
            {wordCount} {_.get(T, "lblWords", "từ")}
          </span>
          <span className={cn("text-slate-600")}>•</span>
          <span>
            {charCount} {_.get(T, "lblChars", "ký tự")}
          </span>
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-3 relative z-10")}>
        {_.map(inputTypeCards, ({ type, icon, label, tooltip }) => {
          const isSelected = _.isEqual(inputType, type);
          return (
            <Button
              key={type}
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
              onClick={() => setInputType(type)}
              className={cn(
                "p-3 rounded-xl border-none text-left transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[50px] select-none",
                isSelected
                  ? "bg-rose-500/15 text-rose-400 font-extrabold shadow-sm ring-1 ring-rose-500/30"
                  : "bg-slate-955/80 text-slate-400 hover:text-slate-200 font-bold hover:bg-slate-900",
              )}
              title={tooltip}>
              <div className={cn("flex items-center gap-2.5")}>
                {icon}
                <span className={cn("text-xs")}>{label}</span>
              </div>
              {isSelected && <Check className={cn("w-4 h-4 text-rose-400 stroke-[3]")} />}
            </Button>
          );
        })}
      </div>

      <div className={cn("relative z-10")}>
        <textarea
          rows={8}
          value={scriptContent}
          onChange={(e) => setScriptContent(e.target.value)}
          placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea}
          className={cn(
            "w-full min-h-[220px] sm:min-h-[260px] bg-slate-955/90 text-slate-100 p-4 rounded-2xl text-xs leading-relaxed outline-none resize-y shadow-inner transition-all placeholder:text-slate-500 font-sans border-none",
          )}
        />
      </div>
    </div>
  );
};
