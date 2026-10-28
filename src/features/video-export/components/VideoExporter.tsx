import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { StudioPage, StudioCanvas, StudioFieldset } from "../../../components/ui/Studio.js";
import { VIDEO_EXPORT_TEXT_VI } from "../../../constants/videoExportText";
import { FC, useState } from "react";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock.js";
import { useVideoExporter } from "../hooks/useVideoExporter.js";
import { Lang } from "../../../lib/lang.js";
import { cn } from "../../../lib/utils.js";
import { VideoExportHeader } from "./VideoExportHeader.js";
import { VideoExportSourceCard } from "./VideoExportSourceCard.js";
import { VideoExportPreviewCard } from "./VideoExportPreviewCard.js";
import { VideoExportConfigCard } from "./VideoExportConfigCard.js";
import { VideoExportResultList } from "./VideoExportResultList.js";
const VideoExporter: FC<{ currentLang?: Lang }> = ({ currentLang = VIDEO_EXPORT_TEXT_VI }) => {
  const exporter = useVideoExporter(currentLang);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState<boolean>(false);
  return (
    <StudioPage aria-busy={exporter.isBusy}>
      <StudioCanvas>
        <VideoExportHeader text={exporter.text} isAiConfigOpen={isAiConfigOpen} disabled={exporter.isRanking} onToggleAiConfig={() => setIsAiConfigOpen((prev) => !prev)} />
        {isAiConfigOpen && (
          <StudioFieldset disabled={exporter.isRanking} className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_P_4_BG_SLATE_900_80)}>
            <ChatPlanningSettingsBlock provider={exporter.aiProvider} model={exporter.aiModel} executionMode={exporter.aiExecutionMode} chromeHeadless={exporter.aiChromeHeadless} onProviderChange={exporter.setAiProvider} onModelChange={exporter.setAiModel} onExecutionModeChange={exporter.setAiExecutionMode} onChromeHeadlessChange={exporter.setAiChromeHeadless} currentLang={currentLang} />
          </StudioFieldset>
        )}
        <div className={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_1_LG_GRID_COLS_3_GAP_6)}>
          <div className={cn(RT_VIDEO_EXPORT.LG_COL_SPAN_2_FLEX_FLEX_COL_GAP_5_MIN)}>
            <VideoExportSourceCard exporter={exporter} />
            <VideoExportPreviewCard exporter={exporter} />
          </div>
          <div className={cn(RT_VIDEO_EXPORT.LG_COL_SPAN_1_FLEX_FLEX_COL_GAP_5_MIN)}>
            <VideoExportConfigCard exporter={exporter} />
          </div>
        </div>
        <VideoExportResultList exporter={exporter} />
      </StudioCanvas>
    </StudioPage>
  );
};
export default VideoExporter;
