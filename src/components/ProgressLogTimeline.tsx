import { memo, useMemo } from "react";
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
} from "lucide-react";
import { PROGRESS_LOG_CONFIG, ProgressLogTone } from "../constants/progressLog";
import { SecurityConstants } from "../constants/security";
import { AppTheme } from "../constants/enums";
import { cn } from "../lib/utils";
import { formatUserFacingLog } from "../lib/userLogFormatter";

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

const parseProgressLog = (log: string, language?: string) => {
  const rawLog = _.toString(log);
  const timeMatch = rawLog.match(PROGRESS_LOG_CONFIG.TIME_PATTERN);
  const message = _.trim(rawLog.replace(PROGRESS_LOG_CONFIG.TIME_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));
  const cleanMessage = _.trim(message.replace(PROGRESS_LOG_CONFIG.PREFIX_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));

  const stepMatch = cleanMessage.match(PROGRESS_LOG_CONFIG.STEP_PATTERN);

  let stepLabel = "";
  let finalMessage = cleanMessage;

  if (stepMatch) {
    stepLabel = stepMatch[1];
    finalMessage = _.trim(cleanMessage.substring(stepMatch[0].length));
  }

  return {
    time: _.defaultTo(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT), PROGRESS_LOG_CONFIG.EMPTY_VALUE),
    message: formatUserFacingLog(finalMessage, language),
    stepLabel,
    tone: resolveProgressLogTone(message),
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

export const ProgressLogTimeline = memo(({ logs, theme, language }: ProgressLogTimelineProps) => {
  const entries = useMemo(() => _.map(logs, log => parseProgressLog(log, language)), [logs, language]);
  const isLightTheme = _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME);

  return (
    <div className="relative pl-1.5 py-1 space-y-4">
      <div className={cn(
        PROGRESS_LOG_CONFIG.CLASSES.LINE,
        isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.LINE_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.LINE_DARK
      )} />

      {_.map(entries, (entry, index) => {
        const style = PROGRESS_LOG_CONFIG.STYLES[entry.tone];
        return (
          <div key={index} className={PROGRESS_LOG_CONFIG.CLASSES.ITEM}>
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
              {!_.isEmpty(entry.stepLabel) && (
                <span className={PROGRESS_LOG_CONFIG.CLASSES.STEP_LABEL}>
                  {entry.stepLabel}:
                </span>
              )}
              {entry.message}
            </span>

            {!_.isEmpty(entry.time) && (
              <span className={cn(
                PROGRESS_LOG_CONFIG.CLASSES.TIME,
                isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.TIME_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.TIME_DARK
              )}>
                {entry.time}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

ProgressLogTimeline.displayName = "ProgressLogTimeline";
