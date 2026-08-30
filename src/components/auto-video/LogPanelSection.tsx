import { useRef, useEffect } from "react";
import _ from "lodash";
import { Activity, ArrowDown } from "lucide-react";
import { ProgressLogTimeline } from "../ProgressLogTimeline";
import { cn } from "../../lib/utils";
import { AppTheme } from "../../constants/enums";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface LogPanelSectionProps {
  logs: string[];
  theme: AppTheme;
  T: ReturnType<typeof getAutoVideoTexts>;
  language?: string;
}

export const LogPanelSection: React.FC<LogPanelSectionProps> = ({ logs, theme, T, language }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [logs.length]);

  return (
    <div
      className={cn(
        "workspace-card log-panel glass-card bg-slate-900/80 p-3.5 space-y-2.5 h-[190px] min-h-[170px] max-h-[210px] flex-none flex flex-col relative rounded-2xl shadow-xl backdrop-blur-xl w-full",
      )}>
      <div className={cn("flex items-center justify-between border-b border-slate-800 pb-3")}>
        <span className={cn("section-title flex items-center gap-2 text-slate-100")} title={T.logHeaderTooltip}>
          <span className={cn("w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-400 dark:text-amber-300 flex items-center justify-center")}>
            <Activity className={cn("w-4 h-4")} />
          </span>
          {T.logHeaderTitle}
        </span>
        <div className={cn("flex items-center gap-2")}>
          {!_.isEmpty(logs) && (
            <button
              type="button"
              onClick={scrollToLatest}
              className={cn(
                "header-action-btn flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border-none shadow-sm cursor-pointer",
              )}
              title={T.logScrollLatestTooltip}>
              <ArrowDown className={cn("w-3.5 h-3.5")} />
              <span>{T.logScrollLatestBtn}</span>
            </button>
          )}
          <span className={cn("header-badge inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300")}>
            {T.logEventsCount(logs.length)}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 rounded-2xl p-4 overflow-y-auto space-y-3 leading-relaxed flex flex-col min-h-[180px] max-h-[420px] bg-slate-955/30 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent",
        )}>
        {_.isEmpty(logs) ? (
          <div
            className={cn(
              "flex-1 flex flex-col items-center justify-center italic text-center text-xs p-6 w-full h-full my-auto gap-2",
              _.isEqual(theme, AppTheme.LIGHT) ? "text-slate-500" : "text-slate-400",
            )}>
            <Activity className={cn("w-8 h-8 mb-1 opacity-50")} />
            <span>{T.logEmpty}</span>
          </div>
        ) : (
          <ProgressLogTimeline logs={logs} theme={theme} language={language} />
        )}
      </div>
    </div>
  );
};
