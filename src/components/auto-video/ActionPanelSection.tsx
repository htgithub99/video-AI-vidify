import React from "react";
import _ from "lodash";
import { Zap, X, Sparkles, Activity } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";

interface ActionPanelSectionProps {
  scriptContent: string;
  isProcessing: boolean;
  isCancelling: boolean;
  currentStepIndex: number;
  stepProgress: number;
  handleStartAutoGenerate: () => Promise<void>;
  cancelPipeline: () => void;
  T: any;
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
    <div className="bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800/90 p-5 rounded-3xl space-y-4 shadow-2xl text-center relative overflow-hidden shrink-0 backdrop-blur-xl group hover:border-rose-500/30 transition-all duration-500">
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-rose-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-gradient-to-tr from-violet-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-1.5 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono font-bold tracking-wide uppercase">
          <Sparkles className="w-3 h-3 text-rose-400 animate-pulse" />
          <span>{T.rightActionTitle}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">{T.rightActionSub}</p>
      </div>

      <div className="flex items-center gap-3 w-full relative z-10">
        <Button
          variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
          size={REFACTOR_CONSTANTS.SIZE_LG}
          onClick={() => { void handleStartAutoGenerate(); }}
          disabled={isProcessing || !isReady}
          isLoading={isProcessing && !isCancelling}
          className="flex-1 py-4 text-sm font-extrabold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 border border-rose-400/40 text-white rounded-2xl shadow-xl shadow-rose-600/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group/btn cursor-pointer"
          title={T.startBtnTooltip}
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0 group-hover/btn:scale-110 transition-transform" />
          <span className="truncate tracking-wide">{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
        </Button>

        {isProcessing && (
          <Button
            variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
            size={REFACTOR_CONSTANTS.SIZE_LG}
            onClick={cancelPipeline}
            disabled={isCancelling}
            isLoading={isCancelling}
            className="flex-1 py-4 text-sm font-bold border border-red-500/40 bg-red-950/30 hover:bg-red-950/60 text-red-300 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/50"
            title={T.cancelBtnTooltip}
          >
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{isCancelling ? T.cancelBtnCancelling : T.cancelBtn}</span>
          </Button>
        )}
      </div>

      {(isProcessing || _.gt(stepProgress, 0)) && (
        <div className="space-y-2 pt-1 text-left relative z-10 bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
          <div className="flex justify-between items-center text-[11px] font-mono font-bold">
            <span className="text-rose-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-spin text-rose-400" />
              {T.progressNodeLabel} [{currentStepIndex}/4]
            </span>
            <span className="text-amber-300 font-extrabold">{stepProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div
              className="bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-rose-500/50"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
