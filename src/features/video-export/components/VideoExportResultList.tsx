import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { VideoExportSectionHeading } from "./VideoExportSectionHeading";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_SM, VIDEO_EXPORT_TEXT_SYMBOL, VIDEO_EXPORT_TEXT_SYMBOL_2, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { CalendarClock, Clock, Download, Film, Flame, HardDrive, ImageIcon, Music, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { formatCleanTime } from "../../../lib/timeUtils.js";
import { VideoExporterState } from "../hooks/useVideoExporter.js";
import { VideoExportResultItem } from "../types/videoExport.js";
import { formatFileSize, VideoExportTexts } from "./videoExportUtils.js";
import { VideoExportPlayer } from "./VideoExportPlayer.js";
type VideoExportResultListProps = { exporter: Pick<VideoExporterState, "text" | "results" | "isExporting" | "job" | "downloadingId" | "downloadResult" | "removeResult"> };
type VideoExportResultCardProps = { result: VideoExportResultItem; text: VideoExportTexts; isDownloading: boolean; onDownload: (result: VideoExportResultItem) => void; onRemove: (id: string) => void };
const formatCreatedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? VIDEO_EXPORT_TEXT_SYMBOL : date.toLocaleString();
};
const VideoExportResultCard: FC<VideoExportResultCardProps> = ({ result, text, isDownloading, onDownload, onRemove }) => (
  <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_P_3_SM_P_4_BORDER)}>
    <VideoExportPlayer src={result.videoUrl} aspectRatio={result.aspectRatio} badgeText={result.aspectRatio} badgeIcon={Film} />
    <div className={cn(RT_SHARED.MT_3_SPACE_Y_2_TEXT_LEFT_FLEX_1_FLEX)}>
      <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
        <h4 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_LINE_CLAMP_1)} title={result.title}>
          {result.title}
        </h4>
        <div className={cn(RT_VIDEO_EXPORT.FLEX_FLEX_WRAP_GAP_X_3_GAP_Y_1_TEXT)}>
          <span className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1)}>
            <Clock className={cn(RT_VIDEO_EXPORT.W_3_H_3_TEXT_BLUE_400)} />
            {formatCleanTime(result.durationSeconds)}
          </span>
          <span className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1)}>
            <HardDrive className={cn(RT_SHARED.W_3_H_3_TEXT_AMBER_400)} />
            {formatFileSize(result.sizeBytes)}
          </span>
          <span className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1)}>
            <Music className={cn(RT_SHARED.W_3_H_3_TEXT_PURPLE_400)} />
            {result.trackCount} {text.RESULT_TRACKS}
          </span>
          <span className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1)}>
            <ImageIcon className={cn(RT_VIDEO_EXPORT.W_3_H_3_TEXT_PINK_400)} />
            {result.imageCount} {text.RESULT_IMAGES}
          </span>
          <span className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1)}>
            <CalendarClock className={cn(RT_VIDEO_EXPORT.W_3_H_3_TEXT_SLATE_500)} />
            {formatCreatedAt(result.createdAt)}
          </span>
        </div>
      </div>
      <div className={cn(RT_SHARED.PT_2_BORDER_T_BORDER_SLATE_800_60_FLEX_ITEMS)}>
        <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => onRemove(result.id)} title={text.REMOVE_RESULT} className={cn(RT_VIDEO_EXPORT.P_2_ROUNDED_XL_TEXT_SLATE_400_HOVER_TEXT_ROSE)}>
          <Trash2 className={cn(RT_SHARED.W_3_5_H_3_5)} />
        </Button>
        <Button size={VIDEO_EXPORT_TEXT_SM} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => onDownload(result)} disabled={isDownloading} className={cn(RT_SHARED.BG_GRADIENT_TO_R_FROM_AMBER_500_VIA_ROSE_500)}>
          {isDownloading ? <Sparkles className={cn(RT_VIDEO_EXPORT.W_3_5_H_3_5_ANIMATE_SPIN_SHRINK_0)} /> : <Download className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />}
          <span>{isDownloading ? text.SAVING_VIDEO : text.DOWNLOAD_BTN}</span>
        </Button>
      </div>
    </div>
  </StudioCard>
);
export const VideoExportResultList: FC<VideoExportResultListProps> = ({ exporter }) => {
  const { text, results, isExporting, job, downloadingId } = exporter;
  const hasResults = !_.isEmpty(results);
  return (
    <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
      <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_BORDER_B_BORDER)}>
        <VideoExportSectionHeading step={text.STEP_03} title={text.RESULTS_TITLE} icon={Flame} titleClassName={cn(RT_SHARED.TEXT_SM_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} iconClassName={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400, { "animate-bounce": isExporting })}>
          <span className={cn(RT_SHARED.PX_2_PY_0_5_ROUNDED_FULL_TEXT_9PX_BG)}>
            {results.length} {text.RESULTS_UNIT}
          </span>
        </VideoExportSectionHeading>
      </div>
      {isExporting && (
        <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_3_P_3_ROUNDED_XL_BG)}>
          <Sparkles className={cn(RT_VIDEO_EXPORT.W_5_H_5_TEXT_PURPLE_400_ANIMATE_SPIN_SHRINK)} />
          <div className={cn(RT_SHARED.MIN_W_0_FLEX_1)}>
            <p className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>{job?.message || text.EXPORTING_BTN}</p>
            <p className={cn(RT_VIDEO_EXPORT.TEXT_10PX_FONT_MONO_TEXT_SLATE_400)}>
              {_.clamp(_.toNumber(job?.percent) || 0, 0, 100)}
              {VIDEO_EXPORT_TEXT_SYMBOL_2}
            </p>
          </div>
        </div>
      )}
      {!hasResults ? (
        <div className={cn(RT_SHARED.PY_14_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT)}>
          <div className={cn(RT_VIDEO_EXPORT.W_14_H_14_ROUNDED_2XL_BG_SLATE_800_80)}>
            <Film className={cn(RT_SHARED.W_7_H_7_TEXT_PURPLE_400_80)} />
          </div>
          <div className={cn(RT_SHARED.SPACE_Y_1_MAX_W_SM)}>
            <h3 className={cn(RT_SHARED.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_200)}>{text.RESULTS_EMPTY_TITLE}</h3>
            <p className={cn(RT_SHARED.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED)}>{text.RESULTS_EMPTY_DESC}</p>
          </div>
        </div>
      ) : (
        <div className={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_1_SM_GRID_COLS_2_XL_GRID)}>
          {_.map(results, (result) => (
            <VideoExportResultCard key={result.id} result={result} text={text} isDownloading={downloadingId === result.id} onDownload={exporter.downloadResult} onRemove={exporter.removeResult} />
          ))}
        </div>
      )}
    </StudioCard>
  );
};
