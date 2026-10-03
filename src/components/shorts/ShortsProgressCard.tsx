import React from "react";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { ShortsProgressStage, ShortsProgressState } from "../../types/shorts.js";
import { SHORTS_TEXTS } from "../../constants/shorts.js";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";

type ShortsProgressCardProps = {
  progress: ShortsProgressState;
  onCancel?: () => void;
};

export const ShortsProgressCard: React.FC<ShortsProgressCardProps> = ({
  progress,
  onCancel,
}) => {
  if (progress.stage === ShortsProgressStage.IDLE) return null;

  const isError = progress.stage === ShortsProgressStage.ERROR;
  const isCompleted = progress.stage === ShortsProgressStage.COMPLETED;
  const isRunning = !isError && !isCompleted;

  return (
    <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-2")}>
          {isError ? (
            <AlertCircle className={cn("w-5 h-5 text-rose-500")} />
          ) : isCompleted ? (
            <CheckCircle2 className={cn("w-5 h-5 text-emerald-400")} />
          ) : (
            <Loader2 className={cn("w-5 h-5 text-purple-400 animate-spin")} />
          )}
          <span className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono")}>
            {isCompleted
              ? SHORTS_TEXTS.PROGRESS_TITLE_COMPLETED
              : isError
              ? SHORTS_TEXTS.PROGRESS_TITLE_ERROR
              : SHORTS_TEXTS.PROGRESS_TITLE_RUNNING}
          </span>
        </div>

        {isRunning && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className={cn("text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 h-auto cursor-pointer")}
          >
            <X className={cn("w-3.5 h-3.5 mr-1")} />
            {SHORTS_TEXTS.CANCEL_BUTTON}
          </Button>
        )}
      </div>

      <div className={cn("space-y-1.5")}>
        <div className={cn("w-full bg-slate-950 rounded-full h-2 overflow-hidden p-[1px] border border-slate-800")}>
          <div
            className={cn("h-full rounded-full transition-all duration-500", {
              "bg-rose-500": isError,
              "bg-emerald-400": isCompleted,
              "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse": isRunning,
            })}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className={cn("flex items-center justify-between text-[11px] text-slate-400")}>
          <span className={cn("truncate max-w-[80%]")}>{progress.message}</span>
          <span className={cn("font-mono font-bold text-slate-200")}>{progress.percent}%</span>
        </div>
      </div>
    </div>
  );
};
