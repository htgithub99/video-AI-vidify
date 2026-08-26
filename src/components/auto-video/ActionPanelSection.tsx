import React from "react";
import _ from "lodash";
import { Zap, X, Activity } from "lucide-react";
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
  cancelPipeline,
  T,
}) => {
  const isReady = !_.isEmpty(_.trim(scriptContent));

  return (
    <div className="bg-slate-900/90 dark:bg-slate-900/90 border border-slate-700/60 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-center relative overflow-hidden shrink-0 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-3 w-full relative z-10">
        <Button
          variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
          size={REFACTOR_CONSTANTS.SIZE_LG}
          onClick={() => { void handleStartAutoGenerate(); }}
          disabled={isProcessing || !isReady}
          isLoading={isProcessing && !isCancelling}
          className={`flex-1 py-4 text-sm font-extrabold text-white rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
            isProcessing
              ? "bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 border-amber-300/40 shadow-rose-500/30"
              : !isReady
                ? "bg-slate-800/80 border-slate-700 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:via-rose-450 hover:to-pink-500 active:scale-95 border-rose-400/40 shadow-rose-500/35 hover:shadow-rose-500/50"
          }`}
          title={T.startBtnTooltip}
        >
          <Zap className={`w-5 h-5 shrink-0 ${isReady ? "text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" : "text-slate-500"}`} />
          <span className="truncate tracking-wide font-black text-white drop-shadow-sm">
            {isProcessing ? T.startBtnProcessing : T.startBtnStart}
          </span>
        </Button>

        {isProcessing && (
          <Button
            variant={REFACTOR_CONSTANTS.VARIANT_DANGER}
            size={REFACTOR_CONSTANTS.SIZE_LG}
            onClick={cancelPipeline}
            disabled={isCancelling}
            isLoading={isCancelling}
            className="flex-1 py-4 text-sm font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:from-red-700 active:to-rose-800 border border-red-400/50 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-red-600/30 active:scale-95"
            title={T.cancelBtnTooltip}
          >
            <X className="w-4 h-4 text-white shrink-0 drop-shadow-sm" />
            <span className="truncate font-extrabold text-white tracking-wide">{isCancelling ? T.cancelBtnCancelling : T.cancelBtn}</span>
          </Button>
        )}
      </div>

      {(isProcessing || _.gt(stepProgress, 0)) && (
        <div className="space-y-2 pt-1 text-left relative z-10 bg-slate-955/80 border border-slate-800/90 p-3.5 rounded-2xl shadow-inner">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-amber-400 flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
              {T.progressNodeLabel} [{currentStepIndex}/4]
            </span>
            <span className="text-emerald-400 font-black tracking-wider text-sm">{stepProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/50"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
