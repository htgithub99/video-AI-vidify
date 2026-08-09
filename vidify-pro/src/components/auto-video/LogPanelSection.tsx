import _ from "lodash";
import { Activity } from "lucide-react";
import { ProgressLogTimeline } from "../ProgressLogTimeline";
import { cn } from "../../lib/utils";
import { AppTheme } from "../../constants/enums";

interface LogPanelSectionProps {
  logs: string[];
  theme: AppTheme;
  T: any;
  language?: string;
}

export const LogPanelSection: React.FC<LogPanelSectionProps> = ({
  logs,
  theme,
  T,
  language,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span
          className="font-bold flex items-center gap-2 text-sm text-slate-100"
          title={T.logHeaderTooltip}
        >
          <span className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-400 dark:text-amber-300 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </span>
          {T.logHeaderTitle}
        </span>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
          {T.logEventsCount(logs.length)}
        </span>
      </div>

      <div className="flex-1 rounded-2xl p-4 overflow-y-auto space-y-3 leading-relaxed flex flex-col min-h-[180px] max-h-[420px] bg-slate-955/30 scrollbar-none">
        {_.isEmpty(logs) ? (
          <div
            className={cn(
              "flex-1 flex flex-col items-center justify-center italic text-center text-xs p-6 w-full h-full my-auto gap-2",
              _.isEqual(theme, "light") ? "text-slate-500" : "text-slate-400",
            )}
          >
            <Activity className="w-8 h-8 mb-1 opacity-50" />
            <span>{T.logEmpty}</span>
          </div>
        ) : (
          <ProgressLogTimeline logs={logs} theme={theme} language={language} />
        )}
      </div>
    </div>
  );
};
