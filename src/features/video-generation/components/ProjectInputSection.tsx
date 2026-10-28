import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { StudioCard, StudioTextarea } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_SYMBOL_31 } from "../../../constants/sourceText";
import React from "react";
import _ from "lodash";
import { Check, FileText, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { ProjectInputType } from "../../../types";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { PIPELINE_STEPS } from "../../../constants/enums";
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
    { type: ProjectInputType.Script, icon: <FileText className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400)} />, label: T.inputTypeScript, tooltip: T.inputTypeScriptTooltip },
    { type: ProjectInputType.Idea, icon: <Sparkles className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400)} />, label: T.inputTypeIdea, tooltip: T.inputTypeIdeaTooltip },
  ] as const;
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.GLASS_CARD_ROUNDED_3XL_P_5_SM_P_6_SPACE)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_RELATIVE_Z_10)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_XL_BG_AMBER_500_15)}>{PIPELINE_STEPS.STEP_1}</span>
          <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} title={T.sec1TitleTooltip}>
            <FileText className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} /> {T.sec1Title}
          </h3>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.HEADER_BADGE_FLEX_ITEMS_CENTER_GAP_2_TEXT_11PX_FONT_D45171)}>
          <span>
            {wordCount} {T.lblWords}
          </span>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_600)}>{SOURCE_TEXT_SYMBOL_31}</span>
          <span>
            {charCount} {T.lblChars}
          </span>
        </div>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_2_GAP_3_RELATIVE_Z_10)}>
        {_.map(inputTypeCards, ({ type, icon, label, tooltip }) => {
          const isSelected = _.isEqual(inputType, type);
          return (
            <Button
              key={type}
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
              onClick={() => setInputType(type)}
              className={cn(RT_VIDEO_GENERATION.P_2_5_ROUNDED_XL_BORDER_TEXT_LEFT_TRANSITION_ALL, { "bg-amber-500/15 text-amber-300 font-extrabold shadow-sm ring-1 ring-amber-500/30 border-amber-500/40": isSelected, "bg-slate-955/80 border-slate-850 text-slate-400 hover:text-slate-200 font-bold hover:bg-slate-900": !isSelected })}
              title={tooltip}>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5)}>
                {icon}
                <span className={cn(RT_VIDEO_GENERATION.TEXT_XS)}>{label}</span>
              </div>
              {isSelected && <Check className={cn(RT_VIDEO_GENERATION.W_4_H_4_TEXT_AMBER_400_STROKE_3)} />}
            </Button>
          );
        })}
      </div>
      <div className={cn(RT_SHARED.RELATIVE_Z_10)}>
        <StudioTextarea rows={5} value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea} className={cn(RT_VIDEO_GENERATION.W_FULL_MIN_H_140PX_SM_MIN_H_160PX_MAX)} />
      </div>
    </StudioCard>
  );
};
