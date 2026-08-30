import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Zap, X, Activity, Play } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

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
}

export const ActionPanelSection: React.FC<ActionPanelSectionProps> = ({
  scriptContent,
  isProcessing,
  isCancelling,
  currentStepIndex,
  stepProgress,
  handleStartAutoGenerate,
  handleContinueAutoGenerate,
  canContinue,
  cancelPipeline,
  T,
}) => {
  const isReady = !_.isEmpty(_.trim(scriptContent));

  return (
    <div
      className={cn(
        "action-panel glass-card bg-slate-900/90 border border-slate-800/80 p-4 space-y-4 text-center relative overflow-hidden shrink-0 backdrop-blur-xl rounded-3xl shadow-xl",
      )}>
      <div className={cn("flex items-center gap-3 w-full relative z-10")}>
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
          className={cn(
            "flex-1 h-10 min-h-[40px] px-4 text-xs font-extrabold text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 border",
            isProcessing
              ? "bg-rose-600 border-rose-500 shadow-md shadow-rose-500/20"
              : !isReady
                ? "bg-slate-800/80 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 border-rose-400/40 shadow-lg shadow-rose-600/30 active:scale-98 text-white",
          )}
          title={T.startBtnTooltip}>
          <Zap className={`w-4 h-4 shrink-0 ${isReady ? "text-white fill-white" : "text-slate-500"}`} />
          <span className={cn("truncate font-extrabold text-white tracking-wide")}>{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
        </Button>

        {!isProcessing && canContinue && (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleContinueAutoGenerate();
            }}
            className={cn(
              "flex-1 h-10 min-h-[40px] px-4 text-xs font-bold rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-100 flex items-center justify-center gap-2",
            )}
            title={T.continueBtnTooltip}>
            <Play className={cn("w-4 h-4 shrink-0")} />
            <span className={cn("truncate")}>{T.continueBtn}</span>
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
            className={cn(
              "flex-1 h-10 min-h-[40px] px-4 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:from-red-700 active:to-rose-800 border border-red-400/50 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/30 active:scale-95",
            )}
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
              {T.progressNodeLabel} [{currentStepIndex}/4]
            </span>
            <span className={cn("text-emerald-400 font-black tracking-wider text-sm")}>{stepProgress}%</span>
          </div>
          <div className={cn("w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner")}>
            <div
              className={cn("bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full rounded-full transition-[width] duration-500 shadow-md shadow-emerald-500/50")}
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
