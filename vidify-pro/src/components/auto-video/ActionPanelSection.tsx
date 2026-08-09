import _ from "lodash";
import { Zap, X, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";

interface ActionPanelSectionProps {
  scriptContent: string;
  isProcessing: boolean;
  isCancelling: boolean;
  currentStepIndex: number;
  stepProgress: number;
  handleStartAutoGenerate: () => void;
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
  return (
    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-center relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-1">
        <h2
          className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2"
          title={T.rightActionTitleTooltip}
        >
          <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
          {T.rightActionTitle}
        </h2>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {T.rightActionSub}
        </p>
      </div>

      <div className="flex items-center gap-3 w-full">
        <Button
          variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
          size={REFACTOR_CONSTANTS.SIZE_LG}
          onClick={() => handleStartAutoGenerate()}
          disabled={isProcessing || _.isEmpty(_.trim(scriptContent))}
          isLoading={isProcessing && !isCancelling}
          className="flex-1 py-4 text-sm font-extrabold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30 text-white rounded-xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          title={T.startBtnTooltip}
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
          <span className="truncate">
            {isProcessing ? T.startBtnProcessing : T.startBtnStart}
          </span>
        </Button>

        {isProcessing && (
          <Button
            variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
            size={REFACTOR_CONSTANTS.SIZE_LG}
            onClick={cancelPipeline}
            disabled={isCancelling}
            isLoading={isCancelling}
            className="flex-1 py-4 text-sm font-bold border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            title={T.cancelBtnTooltip}
          >
            <X className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">
              {isCancelling ? T.cancelBtnCancelling : T.cancelBtn}
            </span>
          </Button>
        )}
      </div>

      {(isProcessing || _.gt(stepProgress, 0)) && (
        <div className="space-y-2 pt-2 text-left">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="text-rose-400">
              {T.progressNodeLabel} [{currentStepIndex}/4]
            </span>
            <span className="text-slate-200">{stepProgress}%</span>
          </div>
          <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-300"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
