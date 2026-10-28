import { RUNTIME_TEXT as RT_UI } from "../constants/runtime/ui.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { SOURCE_TEMPLATE_SYMBOL_4, SOURCE_TEXT_BUTTON, SOURCE_TEXT_PROGRESSLOGICON, SOURCE_TEXT_PROGRESSLOGTIMELINE, SOURCE_TEXT_UNSTYLED } from "../constants/sourceText";
import { memo, useMemo, useState } from "react";
import _ from "lodash";
import { FileText, Mic, Palette, Film, Search, Sparkles, Trophy, AlertTriangle, XCircle, Activity, Copy, Check } from "lucide-react";
import { isProgressLogVisible, PROGRESS_LOG_CONFIG, ProgressLogContext, ProgressLogTone } from "../constants/progressLog";
import { SecurityConstants } from "../constants/security";
import { AppTheme } from "../constants/enums";
import { cn } from "../lib/utils";
import { formatUserFacingLog } from "../lib/userLogFormatter";
import { Button } from "./ui/Button";
interface ProgressLogTimelineProps {
  logs: string[];
  theme: AppTheme;
  language?: string;
  context?: ProgressLogContext;
}
const resolveProgressLogTone = (message: string): ProgressLogTone => {
  const normalizedMessage = _.toLower(message);
  const tones = [ProgressLogTone.Error, ProgressLogTone.Warning, ProgressLogTone.Success, ProgressLogTone.Script, ProgressLogTone.Voice, ProgressLogTone.Image, ProgressLogTone.Render, ProgressLogTone.SEO, ProgressLogTone.Thumbnails];
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
  return { time: _.defaultTo(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT), PROGRESS_LOG_CONFIG.EMPTY_VALUE), message: cleanMessage, rawMessage: !_.isEmpty(_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT)) ? SOURCE_TEMPLATE_SYMBOL_4(`${_.get(timeMatch, SecurityConstants.DEFAULT_AMOUNT)}`, `${userFacingMessage}`) : userFacingMessage, tone: resolveProgressLogTone(userFacingMessage) };
};
const ProgressLogIcon = memo(({ tone, theme }: { tone: ProgressLogTone; theme: AppTheme }) => {
  const style = PROGRESS_LOG_CONFIG.STYLES[tone];
  const iconClassName = cn(PROGRESS_LOG_CONFIG.CLASSES.ICON, { [style.iconLight]: _.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME), [style.iconDark]: !_.isEqual(theme, PROGRESS_LOG_CONFIG.LIGHT_THEME) });
  const Icon = _.get({ [ProgressLogTone.Script]: FileText, [ProgressLogTone.Voice]: Mic, [ProgressLogTone.Image]: Palette, [ProgressLogTone.Render]: Film, [ProgressLogTone.SEO]: Search, [ProgressLogTone.Thumbnails]: Sparkles, [ProgressLogTone.Success]: Trophy, [ProgressLogTone.Warning]: AlertTriangle, [ProgressLogTone.Error]: XCircle }, tone, Activity);
  return <Icon className={cn(iconClassName)} />;
});
ProgressLogIcon.displayName = SOURCE_TEXT_PROGRESSLOGICON;
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
    <div className={cn(RT_UI.RELATIVE_PL_1_5_PY_1_SPACE_Y_4)}>
      {entries.length > 1 && <div className={cn(PROGRESS_LOG_CONFIG.CLASSES.LINE, { [PROGRESS_LOG_CONFIG.CLASSES.LINE_LIGHT]: isLightTheme, [PROGRESS_LOG_CONFIG.CLASSES.LINE_DARK]: !isLightTheme })} />}
      {_.map(entries, (entry, index) => {
        const style = PROGRESS_LOG_CONFIG.STYLES[entry.tone];
        const isError = _.isEqual(entry.tone, ProgressLogTone.Error);
        const isWarning = _.isEqual(entry.tone, ProgressLogTone.Warning);
        const isCopied = _.isEqual(copiedIndex, index);
        const copyTooltip = isError ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_ERROR : isWarning ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_WARNING : PROGRESS_LOG_CONFIG.TOOLTIPS.COPY_LOG;
        const copiedTooltip = isError ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_ERROR : isWarning ? PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_WARNING : PROGRESS_LOG_CONFIG.TOOLTIPS.COPIED_LOG;
        return (
          <div key={index} className={cn(PROGRESS_LOG_CONFIG.CLASSES.ITEM, RT_UI.GROUP_LOG_RELATIVE)}>
            <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.ICON_CONTAINER, { [style.iconBgLight]: isLightTheme, [style.iconBgDark]: !isLightTheme })}>
              <ProgressLogIcon tone={entry.tone} theme={theme} />
            </span>
            <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.MESSAGE, { [style.textLight]: isLightTheme, [style.textDark]: !isLightTheme })}>{entry.message}</span>
            <div className={cn(RT_UI.H_6_FLEX_ITEMS_CENTER_GAP_1_5_ML_2)}>
              <Button
                variant={SOURCE_TEXT_UNSTYLED}
                type={SOURCE_TEXT_BUTTON}
                onClick={() => handleCopy(entry.rawMessage, index)}
                className={cn(RT_UI.W_6_H_6_ROUNDED_MD_FLEX_ITEMS_CENTER_JUSTIFY, RT_UI.OPACITY_40_GROUP_HOVER_LOG_OPACITY_100_HOVER_OPACITY_100, {
                  "text-emerald-400 !opacity-100": isCopied,
                  "text-slate-400 hover:text-rose-400": !isCopied && isError,
                  "text-slate-400 hover:text-amber-400": !isCopied && !isError && isWarning,
                  "text-slate-400 hover:text-sky-600": !isCopied && !isError && !isWarning && isLightTheme,
                  "text-slate-400 hover:text-sky-400": !isCopied && !isError && !isWarning && !isLightTheme,
                })}
                title={isCopied ? copiedTooltip : copyTooltip}
                aria-label={isCopied ? copiedTooltip : copyTooltip}>
                {isCopied ? <Check className={cn(RT_UI.W_3_5_H_3_5_TEXT_EMERALD_400)} /> : <Copy className={cn(RT_SHARED.W_3_5_H_3_5)} />}
              </Button>
              {!_.isEmpty(entry.time) && <span className={cn(PROGRESS_LOG_CONFIG.CLASSES.TIME, { [PROGRESS_LOG_CONFIG.CLASSES.TIME_LIGHT]: isLightTheme }, { [PROGRESS_LOG_CONFIG.CLASSES.TIME_DARK]: !isLightTheme })}>{entry.time}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
});
ProgressLogTimeline.displayName = SOURCE_TEXT_PROGRESSLOGTIMELINE;
