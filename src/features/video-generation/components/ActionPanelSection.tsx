import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEMPLATE_4, SOURCE_TEXT_SYMBOL_8, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React from "react";
import _ from "lodash";
import { Zap, X, Activity, Play, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Lang } from "../../../lib/lang";
import { FLOW_DIRECT_VIDEO_CONFIG } from "../../../constants/config";
interface ActionPanelSectionProps {
  scriptContent: string;
  isProcessing: boolean;
  isCancelling: boolean;
  currentStepIndex: number;
  stepProgress: number;
  handleStartAutoGenerate: () => Promise<void>;
  handleContinueAutoGenerate: () => Promise<void>;
  canContinue: boolean;
  cancelPipeline: () => void;
  T: ReturnType<typeof getAutoVideoTexts>;
  cinematicMode?: boolean;
  currentLang?: Lang;
  estimatedClipCount?: number;
  estimatedBatchCount?: number;
}
export const ActionPanelSection: React.FC<ActionPanelSectionProps> = ({ scriptContent, isProcessing, isCancelling, currentStepIndex, stepProgress, handleStartAutoGenerate, handleContinueAutoGenerate, canContinue, cancelPipeline, T, cinematicMode = false, currentLang: _currentLang = SOURCE_TEXT_VI, estimatedClipCount = 0, estimatedBatchCount = 0 }) => {
  const isReady = !_.isEmpty(_.trim(scriptContent));
  const cinematicPhaseIndex = currentStepIndex > 0 ? Math.min(Math.max(currentStepIndex, 1), 4) : stepProgress <= 25 ? 1 : stepProgress <= 50 ? 2 : stepProgress <= 75 ? 3 : 4;
  const cinematicPhaseLabels = T.cinematicPhaseLabels;
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.ACTION_PANEL_GLASS_CARD_BG_SLATE_900_90_BORDER_BORDER)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_3_W_FULL_RELATIVE_Z_10)}>
        {!isProcessing && canContinue ? (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleContinueAutoGenerate();
            }}
            disabled={!isReady}
            className={cn(RT_VIDEO_GENERATION.FLEX_1_35_H_10_MIN_H_40PX_PX_4)}
            title={T.continueBtnTooltip}>
            <Play className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
            <span className={cn(RT_SHARED.TRUNCATE)}>{T.continueBtn}</span>
          </Button>
        ) : (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleStartAutoGenerate();
            }}
            disabled={isProcessing || !isReady}
            isLoading={isProcessing && !isCancelling}
            className={cn(RT_VIDEO_GENERATION.FLEX_1_H_10_MIN_H_40PX_PX_4_TEXT, {
              "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 border-rose-400/60 shadow-xl shadow-rose-600/30 ring-1 ring-white/20 active:scale-100": isProcessing,
              "bg-slate-800/80 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed shadow-none": !isProcessing && !isReady,
              "bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:via-rose-450 hover:to-indigo-500 border border-rose-400/40 shadow-lg shadow-rose-600/25 active:scale-[0.98] text-white": !isProcessing && !isReady,
            })}
            title={T.startBtnTooltip}>
            <Zap className={cn(RT_SHARED.W_4_H_4_SHRINK_0, { "text-white fill-white": isReady, "text-slate-500": !isReady })} />
            <span className={cn(RT_VIDEO_GENERATION.TRUNCATE_FONT_EXTRABOLD_TEXT_WHITE_TRACKING_WIDE_DROP_SHADOW_SM)}>{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
          </Button>
        )}
        {!isProcessing && canContinue && (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleStartAutoGenerate();
            }}
            disabled={!isReady}
            className={cn(RT_VIDEO_GENERATION.FLEX_1_H_10_MIN_H_40PX_PX_3_TEXT)}
            title={T.startOverBtnTooltip}>
            <RotateCcw className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
            <span className={cn(RT_SHARED.TRUNCATE)}>{T.startOverBtn}</span>
          </Button>
        )}
        {isProcessing && (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_DANGER}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              cancelPipeline();
            }}
            disabled={isCancelling}
            isLoading={isCancelling}
            className={cn(RT_VIDEO_GENERATION.FLEX_1_H_10_MIN_H_40PX_PX_4_TEXT_7BCC0A)}
            title={T.cancelBtnTooltip}>
            <X className={cn(RT_VIDEO_GENERATION.W_4_H_4_TEXT_WHITE_SHRINK_0_DROP_SHADOW)} />
            <span className={cn(RT_VIDEO_GENERATION.TRUNCATE_FONT_EXTRABOLD_TEXT_WHITE_TRACKING_WIDE)}>{isCancelling ? T.cancelBtnCancelling : T.cancelBtn}</span>
          </Button>
        )}
      </div>
      {(isProcessing || canContinue) && (
        <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_2_TEXT_LEFT_RELATIVE_Z_10_BG_SLATE)}>
          <div className={cn(RT_VIDEO_GENERATION.FLEX_JUSTIFY_BETWEEN_ITEMS_CENTER_TEXT_XS_FONT_MONO_FONT)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_AMBER_400_FLEX_ITEMS_CENTER_GAP_1_5_FONT)}>
              <Activity className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400, { "animate-spin": isProcessing })} />
              {cinematicMode ? SOURCE_TEMPLATE_4(`${cinematicPhaseLabels[cinematicPhaseIndex - 1]}`, `${cinematicPhaseIndex}`) : SOURCE_TEMPLATE_4(`${T.progressNodeLabel}`, `${currentStepIndex}`)}
            </span>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_EMERALD_400_FONT_BLACK_TRACKING_WIDER_TEXT_SM)}>
              {stepProgress}
              {SOURCE_TEXT_SYMBOL_8}
            </span>
          </div>
          <div className={cn(RT_VIDEO_GENERATION.W_FULL_BG_SLATE_900_H_3_ROUNDED_FULL_OVERFLOW)}>
            <div className={cn(RT_VIDEO_GENERATION.BG_GRADIENT_TO_R_FROM_AMBER_500_VIA_ROSE_500)} style={{ width: `${stepProgress}${RT_SHARED.SYMBOL}` }} />
          </div>
        </div>
      )}
      {cinematicMode && !isProcessing && (
        <div className={cn(RT_VIDEO_GENERATION.RELATIVE_Z_10_ROUNDED_2XL_BORDER_BORDER_SLATE_800_90)}>
          <span className={cn(RT_VIDEO_GENERATION.FONT_BOLD_TEXT_AMBER_400)}>{T.estimatePrefix}</span> {T.estimateSummary(estimatedClipCount, estimatedBatchCount, FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}
        </div>
      )}
    </StudioCard>
  );
};
