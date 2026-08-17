import { memo, useMemo, useState } from "react";
import _ from "lodash";
import {
  FileText,
  Mic,
  Palette,
  Film,
  Search,
  Sparkles,
  Trophy,
  AlertTriangle,
  XCircle,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { PROGRESS_LOG_CONFIG, ProgressLogTone } from "../constants/progressLog";
import { SecurityConstants } from "../constants/security";
import { AppTheme } from "../constants/enums";
import { cn } from "../lib/utils";

interface ProgressLogTimelineProps {
  logs: string[];
  theme: AppTheme;
  language?: string;
}

const resolveProgressLogTone = (message: string): ProgressLogTone => {
  const normalizedMessage = _.toLower(message);
  
  const tones = [
    ProgressLogTone.Error,
    ProgressLogTone.Warning,
    ProgressLogTone.Success,
    ProgressLogTone.Script,
    ProgressLogTone.Voice,
    ProgressLogTone.Image,
    ProgressLogTone.Render,
    ProgressLogTone.SEO,
    ProgressLogTone.Thumbnails,
  ];

  const matchedTone = _.find(tones, (tone) => {
    const keywords = _.get(PROGRESS_LOG_CONFIG.KEYWORDS, tone);
    return _.some(keywords, (kw) => _.includes(normalizedMessage, kw));
  });

  return matchedTone || ProgressLogTone.Info;
};

const parseProgressLog = (log: string) => {
  const rawLog = _.toString(log);
  const timeMatch = rawLog.match(PROGRESS_LOG_CONFIG.TIME_PATTERN);
  const messageWithoutTime = _.trim(rawLog.replace(PROGRESS_LOG_CONFIG.TIME_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));
  const cleanMessage = _.trim(messageWithoutTime.replace(PROGRESS_LOG_CONFIG.PREFIX_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));

  return {
    time: _.defaultTo(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT), PROGRESS_LOG_CONFIG.EMPTY_VALUE),
    message: cleanMessage,
    tone: resolveProgressLogTone(messageWithoutTime),
  };
};

const ProgressLogIcon = memo(({ tone, theme }: { tone: ProgressLogTone; theme: AppTheme }) => {
  const style = PROGRESS_LOG_CONFIG.STYLES[tone];
  const iconClassName = cn(
    PROGRESS_LOG_CONFIG.CLASSES.ICON,
    _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME) ? style.iconLight : style.iconDark
  );
  
  const Icon = _.get({
    [ProgressLogTone.Script]: FileText,
    [ProgressLogTone.Voice]: Mic,
    [ProgressLogTone.Image]: Palette,
    [ProgressLogTone.Render]: Film,
    [ProgressLogTone.SEO]: Search,
    [ProgressLogTone.Thumbnails]: Sparkles,
    [ProgressLogTone.Success]: Trophy,
    [ProgressLogTone.Warning]: AlertTriangle,
    [ProgressLogTone.Error]: XCircle,
  }, tone, Activity);

  return <Icon className={iconClassName} />;
});

ProgressLogIcon.displayName = "ProgressLogIcon";

export const ProgressLogTimeline = memo(({ logs, theme }: ProgressLogTimelineProps) => {
  const entries = useMemo(() => _.map(logs, log => parseProgressLog(log)), [logs]);
  const isLightTheme = _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(_.noop);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex((prev) => (_.isEqual(prev, index) ? null : prev));
    }, 2000);
  };

  return (
    <div className="relative pl-1.5 py-1 space-y-4">
      <div className={cn(
        PROGRESS_LOG_CONFIG.CLASSES.LINE,
        isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.LINE_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.LINE_DARK
      )} />

      {_.map(entries, (entry, index) => {
        const style = PROGRESS_LOG_CONFIG.STYLES[entry.tone];
        const isError = _.isEqual(entry.tone, ProgressLogTone.Error);
        const isCopied = _.isEqual(copiedIndex, index);

        return (
          <div key={index} className={cn(PROGRESS_LOG_CONFIG.CLASSES.ITEM, "group/log relative")}>
            <span className={cn(
              PROGRESS_LOG_CONFIG.CLASSES.ICON_CONTAINER,
              isLightTheme ? style.iconBgLight : style.iconBgDark
            )}>
              <ProgressLogIcon tone={entry.tone} theme={theme} />
            </span>

            <span className={cn(
              PROGRESS_LOG_CONFIG.CLASSES.MESSAGE,
              isLightTheme ? style.textLight : style.textDark
            )}>
              {entry.message}
            </span>

            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
              {isError && (
                <button
                  type="button"
                  onClick={() => handleCopy(entry.message, index)}
                  className={cn(
                    "p-1.5 rounded-lg transition-all flex items-center justify-center opacity-80 hover:opacity-100 shadow-sm cursor-pointer",
                    isCopied
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                  )}
                  title={isCopied ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_ERROR : PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_ERROR}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              )}

              {!_.isEmpty(entry.time) && (
                <span className={cn(
                  PROGRESS_LOG_CONFIG.CLASSES.TIME,
                  isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.TIME_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.TIME_DARK
                )}>
                  {entry.time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ProgressLogTimeline.displayName = "ProgressLogTimeline";
