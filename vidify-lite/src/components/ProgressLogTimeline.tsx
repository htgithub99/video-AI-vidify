import { memo, useMemo } from "react";
import _ from "lodash";
import { AlertTriangle, CheckCircle2, Clock3, Info, XCircle } from "lucide-react";
import { PROGRESS_LOG_CONFIG, ProgressLogTone } from "../constants/progressLog";
import { SecurityConstants } from "../constants/security";
import { AppTheme } from "../constants/enums";
import { cn } from "../lib/utils";

interface ProgressLogTimelineProps {
  logs: string[];
  theme: AppTheme;
}

const resolveProgressLogTone = (message: string): ProgressLogTone => {
  const normalizedMessage = _.toLower(message);
  const tone = _.find(
    _.keys(PROGRESS_LOG_CONFIG.MARKERS) as ProgressLogTone[],
    (candidateTone) => _.some(
      PROGRESS_LOG_CONFIG.MARKERS[candidateTone as keyof typeof PROGRESS_LOG_CONFIG.MARKERS],
      (marker) => _.some([_.includes(message, marker), _.includes(normalizedMessage, marker)]),
    ),
  );
  return _.defaultTo(tone, ProgressLogTone.Info);
};

const parseProgressLog = (log: string) => {
  const rawLog = _.toString(log);
  const timeMatch = rawLog.match(PROGRESS_LOG_CONFIG.TIME_PATTERN);
  const message = _.trim(rawLog.replace(PROGRESS_LOG_CONFIG.TIME_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE));
  return {
    time: _.defaultTo(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT), PROGRESS_LOG_CONFIG.EMPTY_VALUE),
    message: _.trim(message.replace(PROGRESS_LOG_CONFIG.PREFIX_PATTERN, PROGRESS_LOG_CONFIG.EMPTY_VALUE)),
    tone: resolveProgressLogTone(message),
  };
};

const ProgressLogIcon = ({ tone, theme }: { tone: ProgressLogTone; theme: AppTheme }) => {
  const style = PROGRESS_LOG_CONFIG.STYLES[tone];
  const iconClassName = cn(PROGRESS_LOG_CONFIG.CLASSES.ICON, _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME) ? style.iconLight : style.iconDark);
  const Icon = _.get({
    [ProgressLogTone.Error]: XCircle,
    [ProgressLogTone.Warning]: AlertTriangle,
    [ProgressLogTone.Success]: CheckCircle2,
    [ProgressLogTone.Running]: Clock3,
  }, tone, Info);
  return <Icon className={iconClassName} />;
};

export const ProgressLogTimeline = memo(({ logs, theme }: ProgressLogTimelineProps) => {
  const entries = useMemo(() => _.map(logs, parseProgressLog), [logs]);
  return _.map(entries, (entry, index) => {
    const style = PROGRESS_LOG_CONFIG.STYLES[entry.tone];
    const isLightTheme = _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME);
    return (
      <div key={index} className={cn(PROGRESS_LOG_CONFIG.CLASSES.ITEM, isLightTheme ? style.light : style.dark)}>
        <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.ICON_CONTAINER, isLightTheme ? style.iconBgLight : style.iconBgDark)}>
          <ProgressLogIcon tone={entry.tone} theme={theme} />
        </span>
        <span className={PROGRESS_LOG_CONFIG.CLASSES.MESSAGE} style={{ color: isLightTheme ? PROGRESS_LOG_CONFIG.COLORS.MESSAGE_LIGHT : PROGRESS_LOG_CONFIG.COLORS.MESSAGE_DARK }}>{entry.message}</span>
        {_.isEmpty(entry.time) ? null : <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.TIME, isLightTheme ? PROGRESS_LOG_CONFIG.CLASSES.TIME_LIGHT : PROGRESS_LOG_CONFIG.CLASSES.TIME_DARK)}>{entry.time}</span>}
      </div>
    );
  });
});
