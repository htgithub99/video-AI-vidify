import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_SMOOTH, SOURCE_TEXT_UNSTYLED } from "../../../constants/sourceText";
import { useRef, useEffect, useMemo } from "react";
import _ from "lodash";
import { Activity, ArrowDown } from "lucide-react";
import { ProgressLogTimeline } from "../../../components/ProgressLogTimeline";
import { cn } from "../../../lib/utils";
import { AppTheme } from "../../../constants/enums";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { isProgressLogVisible, ProgressLogContext } from "../../../constants/progressLog";
import { formatUserFacingLogs } from "../../../lib/userLogFormatter";
import { Button } from "../../../components/ui/Button";
interface LogPanelSectionProps {
  logs: string[];
  theme: AppTheme;
  T: ReturnType<typeof getAutoVideoTexts>;
  language?: string;
  context?: ProgressLogContext;
}
export const LogPanelSection: React.FC<LogPanelSectionProps> = ({ logs, theme, T, language, context = ProgressLogContext.Automatic }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleLogs = useMemo(
    () =>
      formatUserFacingLogs(
        _.filter(logs, (log) => isProgressLogVisible(log, context)),
        language,
      ),
    [context, language, logs],
  );
  const scrollToLatest = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: SOURCE_TEXT_SMOOTH });
    }
  };
  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [logs.length]);
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.WORKSPACE_CARD_LOG_PANEL_GLASS_CARD_BG_SLATE_900_80)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
        <span className={cn(RT_VIDEO_GENERATION.SECTION_TITLE_FLEX_ITEMS_CENTER_GAP_2_TEXT_SLATE_100)} title={T.logHeaderTooltip}>
          <span className={cn(RT_VIDEO_GENERATION.W_8_H_8_ROUNDED_XL_BG_AMBER_500_10)}>
            <Activity className={cn(RT_SHARED.W_4_H_4)} />
          </span>
          {T.logHeaderTitle}
        </span>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          {!_.isEmpty(visibleLogs) && (
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={scrollToLatest} className={cn(RT_VIDEO_GENERATION.HEADER_ACTION_BTN_FLEX_ITEMS_CENTER_GAP_1_TEXT_11PX)} title={T.logScrollLatestTooltip}>
              <ArrowDown className={cn(RT_SHARED.W_3_5_H_3_5)} />
              <span>{T.logScrollLatestBtn}</span>
            </Button>
          )}
          <span className={cn(RT_VIDEO_GENERATION.HEADER_BADGE_INLINE_FLEX_ITEMS_CENTER_TEXT_11PX_FONT_BOLD)}>{T.logEventsCount(visibleLogs.length)}</span>
        </div>
      </div>
      <div ref={scrollContainerRef} className={cn(RT_VIDEO_GENERATION.FLEX_1_ROUNDED_2XL_P_4_OVERFLOW_Y_AUTO_SPACE)}>
        {_.isEmpty(visibleLogs) ? (
          <div className={cn(RT_VIDEO_GENERATION.FLEX_1_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_ITALIC, { "text-slate-500": _.isEqual(theme, AppTheme.LIGHT), "text-slate-400": !_.isEqual(theme, AppTheme.LIGHT) })}>
            <Activity className={cn(RT_VIDEO_GENERATION.W_8_H_8_MB_1_OPACITY_50)} />
            <span>{T.logEmpty}</span>
          </div>
        ) : (
          <ProgressLogTimeline logs={visibleLogs} theme={theme} language={language} context={context} />
        )}
      </div>
    </StudioCard>
  );
};
