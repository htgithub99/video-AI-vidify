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
    <div aria-busy={exporter.isBusy} className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80")}>
        <VideoExportHeader text={exporter.text} isAiConfigOpen={isAiConfigOpen} disabled={exporter.isRanking} onToggleAiConfig={() => setIsAiConfigOpen((prev) => !prev)} />
        {isAiConfigOpen && (
          <fieldset disabled={exporter.isRanking} className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4 text-left")}>
            <ChatPlanningSettingsBlock provider={exporter.aiProvider} model={exporter.aiModel} executionMode={exporter.aiExecutionMode} chromeHeadless={exporter.aiChromeHeadless} onProviderChange={exporter.setAiProvider} onModelChange={exporter.setAiModel} onExecutionModeChange={exporter.setAiExecutionMode} onChromeHeadlessChange={exporter.setAiChromeHeadless} currentLang={currentLang} />
          </fieldset>
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
      </div>
    </div>
  );
};
export default VideoExporter;
