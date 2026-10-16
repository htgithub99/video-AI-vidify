import { StudioPage, StudioCanvas, StudioFieldset } from "./ui/Studio.js";
import { VIDEO_EXPORT_TEXT_VI } from "../constants/videoExportText";
import { FC, useState } from "react";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock.js";
import { useVideoExporter } from "../hooks/useVideoExporter.js";
import { Lang } from "../lib/lang.js";
import { cn } from "../lib/utils.js";
import { VideoExportHeader } from "./video-export/VideoExportHeader.js";
import { VideoExportSourceCard } from "./video-export/VideoExportSourceCard.js";
import { VideoExportPreviewCard } from "./video-export/VideoExportPreviewCard.js";
import { VideoExportConfigCard } from "./video-export/VideoExportConfigCard.js";
import { VideoExportResultList } from "./video-export/VideoExportResultList.js";
const VideoExporter: FC<{ currentLang?: Lang }> = ({ currentLang = VIDEO_EXPORT_TEXT_VI }) => {
  const exporter = useVideoExporter(currentLang);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState<boolean>(false);
  return (
    <StudioPage aria-busy={exporter.isBusy}>
      <StudioCanvas>
        <VideoExportHeader text={exporter.text} isAiConfigOpen={isAiConfigOpen} disabled={exporter.isRanking} onToggleAiConfig={() => setIsAiConfigOpen((prev) => !prev)} />
        {isAiConfigOpen && (
          <StudioFieldset disabled={exporter.isRanking} className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4 text-left")}>
            <ChatPlanningSettingsBlock provider={exporter.aiProvider} model={exporter.aiModel} executionMode={exporter.aiExecutionMode} chromeHeadless={exporter.aiChromeHeadless} onProviderChange={exporter.setAiProvider} onModelChange={exporter.setAiModel} onExecutionModeChange={exporter.setAiExecutionMode} onChromeHeadlessChange={exporter.setAiChromeHeadless} currentLang={currentLang} />
          </StudioFieldset>
        )}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 items-start")}>
          <div className={cn("lg:col-span-2 flex flex-col gap-5 min-w-0")}>
            <VideoExportSourceCard exporter={exporter} />
            <VideoExportPreviewCard exporter={exporter} />
          </div>
          <div className={cn("lg:col-span-1 flex flex-col gap-5 min-w-0 lg:sticky lg:top-0")}>
            <VideoExportConfigCard exporter={exporter} />
          </div>
        </div>
        <VideoExportResultList exporter={exporter} />
      </StudioCanvas>
    </StudioPage>
  );
};
export default VideoExporter;
