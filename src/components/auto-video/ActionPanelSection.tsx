import { SOURCE_TEMPLATE_4, SOURCE_TEXT_SYMBOL_8, SOURCE_TEXT_VI } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Zap, X, Activity, Play, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Lang } from "../../lib/lang";
import { FLOW_DIRECT_VIDEO_CONFIG } from "../../constants/config";
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
    <div className={cn("action-panel glass-card bg-slate-900/90 border border-slate-800/80 p-4 space-y-4 text-center relative overflow-hidden shrink-0 backdrop-blur-xl rounded-3xl shadow-xl")}>
      <div className={cn("flex items-center gap-3 w-full relative z-10")}>
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
            className={cn("flex-[1.35] h-10 min-h-[40px] px-4 text-xs font-extrabold rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20")}
            title={T.continueBtnTooltip}>
            <Play className={cn("w-4 h-4 shrink-0")} />
            <span className={cn("truncate")}>{T.continueBtn}</span>
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
            className={cn("flex-1 h-10 min-h-[40px] px-4 text-xs font-extrabold text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border", {
              "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 border-rose-400/60 shadow-xl shadow-rose-600/30 ring-1 ring-white/20 active:scale-100": isProcessing,
              "bg-slate-800/80 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed shadow-none": !isProcessing && !isReady,
              "bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:via-rose-450 hover:to-indigo-500 border border-rose-400/40 shadow-lg shadow-rose-600/25 active:scale-[0.98] text-white": !isProcessing && !isReady,
            })}
            title={T.startBtnTooltip}>
            <Zap className={cn("w-4 h-4 shrink-0", { "text-white fill-white": isReady, "text-slate-500": !isReady })} />
            <span className={cn("truncate font-extrabold text-white tracking-wide drop-shadow-sm")}>{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
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
            className={cn("flex-1 h-10 min-h-[40px] px-3 text-[11px] font-bold rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2")}
            title={T.startOverBtnTooltip}>
            <RotateCcw className={cn("w-3.5 h-3.5 shrink-0")} />
            <span className={cn("truncate")}>{T.startOverBtn}</span>
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
            className={cn("flex-1 h-10 min-h-[40px] px-4 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:from-red-700 active:to-rose-800 border border-red-400/50 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/30 active:scale-95")}
            title={T.cancelBtnTooltip}>
            <X className={cn("w-4 h-4 text-white shrink-0 drop-shadow-sm")} />
            <span className={cn("truncate font-extrabold text-white tracking-wide")}>{isCancelling ? T.cancelBtnCancelling : T.cancelBtn}</span>
          </Button>
        )}
      </div>
      {(isProcessing || canContinue) && (
        <div className={cn("space-y-2 text-left relative z-10 bg-slate-955/80 border border-slate-800/90 p-3.5 rounded-2xl shadow-inner")}>
          <div className={cn("flex justify-between items-center text-xs font-mono font-bold")}>
            <span className={cn("text-amber-400 flex items-center gap-1.5 font-bold")}>
              <Activity className={cn("w-3.5 h-3.5 text-amber-400", { "animate-spin": isProcessing })} />
              {cinematicMode ? SOURCE_TEMPLATE_4(`${cinematicPhaseLabels[cinematicPhaseIndex - 1]}`, `${cinematicPhaseIndex}`) : SOURCE_TEMPLATE_4(`${T.progressNodeLabel}`, `${currentStepIndex}`)}
            </span>
            <span className={cn("text-emerald-400 font-black tracking-wider text-sm")}>
              {stepProgress}
              {SOURCE_TEXT_SYMBOL_8}
            </span>
          </div>
          <div className={cn("w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner")}>
            <div className={cn("bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full rounded-full transition-[width] duration-500 shadow-md shadow-emerald-500/50")} style={{ width: `${stepProgress}%` }} />
          </div>
        </div>
      )}
      {cinematicMode && !isProcessing && (
        <div className={cn("relative z-10 rounded-2xl border border-slate-800/90 bg-slate-955/70 px-3.5 py-3 text-left text-[11px] text-slate-300")}>
          <span className={cn("font-bold text-amber-400")}>{T.estimatePrefix}</span> {T.estimateSummary(estimatedClipCount, estimatedBatchCount, FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}
        </div>
      )}
    </div>
  );
};
