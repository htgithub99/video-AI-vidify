import { memo, useMemo, useState } from "react";
import _ from "lodash";
import { FileText, Mic, Palette, Film, Search, Sparkles, Trophy, AlertTriangle, XCircle, Activity, Copy, Check } from "lucide-react";
import { isProgressLogVisible, PROGRESS_LOG_CONFIG, ProgressLogContext, ProgressLogTone } from "../constants/progressLog";
import { SecurityConstants } from "../constants/security";
import { AppTheme } from "../constants/enums";
import { cn } from "../lib/utils";
import { formatUserFacingLog } from "../lib/userLogFormatter";

interface ProgressLogTimelineProps {
  logs: string[];
  theme: AppTheme;
  language?: string;
  context?: ProgressLogContext;
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

const formatSeamlessMessage = (msg: string): string => _.reduce(PROGRESS_LOG_CONFIG.SEAMLESS_REPLACEMENTS, (acc, rule) => acc.replace(rule.pattern, rule.replacement), msg);

const parseProgressLog = (log: string, language?: string) => {
  const rawLog = _.toString(log);
  const timeMatch = rawLog.match(PROGRESS_LOG_CONFIG.TIME_PATTERN);
  const messageWithoutTime = _.trim(rawLog.replace(PROGRESS_LOG_CONFIG.TIME_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));
  const userFacingMessage = formatUserFacingLog(messageWithoutTime, language);
  const rawCleanMessage = _.trim(userFacingMessage.replace(PROGRESS_LOG_CONFIG.PREFIX_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));
  const cleanMessage = formatSeamlessMessage(rawCleanMessage);

  return {
    time: _.defaultTo(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT), PROGRESS_LOG_CONFIG.EMPTY_VALUE),
    message: cleanMessage,
    rawMessage: !_.isEmpty(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT))
      ? `[${_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT)}] ${userFacingMessage}`
      : userFacingMessage,
    tone: resolveProgressLogTone(userFacingMessage),
  };
};

const ProgressLogIcon = memo(({ tone, theme }: { tone: ProgressLogTone; theme: AppTheme }) => {
  const style = PROGRESS_LOG_CONFIG.STYLES[tone];
  const iconClassName = cn(PROGRESS_LOG_CONFIG.CLASSES.ICON, _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME) ? style.iconLight : style.iconDark);

  const Icon = _.get(
    {
      [ProgressLogTone.Script]: FileText,
      [ProgressLogTone.Voice]: Mic,
      [ProgressLogTone.Image]: Palette,
      [ProgressLogTone.Render]: Film,
      [ProgressLogTone.SEO]: Search,
      [ProgressLogTone.Thumbnails]: Sparkles,
      [ProgressLogTone.Success]: Trophy,
      [ProgressLogTone.Warning]: AlertTriangle,
      [ProgressLogTone.Error]: XCircle,
    },
    tone,
    Activity,
  );

  return <Icon className={iconClassName} />;
});

ProgressLogIcon.displayName = "ProgressLogIcon";

export const ProgressLogTimeline = memo(({ logs, theme, language, context = ProgressLogContext.Automatic }: ProgressLogTimelineProps) => {
  const entries = useMemo(
    () =>
      _.chain(logs)
        .filter((log) => isProgressLogVisible(log, context))
        .map((log) => parseProgressLog(log, language))
        .value(),
    [context, language, logs],
  );
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
    <div className={cn("relative pl-1.5 py-1 space-y-4")}>
      {entries.length > 1 && (
        <div className={cn(PROGRESS_LOG_CONFIG.CLASSES.LINE, isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.LINE_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.LINE_DARK)} />
      )}

      {_.map(entries, (entry, index) => {
        const style = PROGRESS_LOG_CONFIG.STYLES[entry.tone];
        const isError = _.isEqual(entry.tone, ProgressLogTone.Error);
        const isWarning = _.isEqual(entry.tone, ProgressLogTone.Warning);
        const isCopied = _.isEqual(copiedIndex, index);
        const copyTooltip = isError
          ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_ERROR
          : isWarning
            ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_WARNING
            : PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_LOG;
        const copiedTooltip = isError
          ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_ERROR
          : isWarning
            ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_WARNING
            : PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_LOG;

        return (
          <div key={index} className={cn(PROGRESS_LOG_CONFIG.CLASSES.ITEM, "group/log relative")}>
            <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.ICON_CONTAINER, isLightTheme ? style.iconBgLight : style.iconBgDark)}>
              <ProgressLogIcon tone={entry.tone} theme={theme} />
            </span>

            <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.MESSAGE, isLightTheme ? style.textLight : style.textDark)}>{entry.message}</span>

            <div className={cn("h-6 flex items-center gap-1.5 ml-2 shrink-0")}>
              <button
                type="button"
                onClick={() => handleCopy(entry.rawMessage, index)}
                className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center cursor-pointer border-none bg-transparent transition-all",
                  "opacity-40 group-hover/log:opacity-100 hover:!opacity-100 focus:opacity-100",
                  isCopied
                    ? "text-emerald-400 !opacity-100"
                    : isError
                      ? "text-slate-400 hover:text-rose-400"
                      : isWarning
                        ? "text-slate-400 hover:text-amber-400"
                        : isLightTheme
                          ? "text-slate-400 hover:text-sky-600"
                          : "text-slate-400 hover:text-sky-400",
                )}
                title={isCopied ? copiedTooltip : copyTooltip}
                aria-label={isCopied ? copiedTooltip : copyTooltip}>
                {isCopied ? <Check className={cn("w-3.5 h-3.5 text-emerald-400")} /> : <Copy className={cn("w-3.5 h-3.5")} />}
              </button>

              {!_.isEmpty(entry.time) && (
                <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.TIME, isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.TIME_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.TIME_DARK)}>
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
