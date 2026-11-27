import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { StudioCard, StudioEmptyState } from "../../../components/ui/Studio.js";
import { VideoExportSectionHeading } from "./VideoExportSectionHeading";
import { VIDEO_EXPORT_TEXT_SYMBOL, VIDEO_EXPORT_TEXT_SYMBOL_2 } from "../../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { CalendarClock, Clock, Film, Flame, HardDrive, ImageIcon, Music, Sparkles } from "lucide-react";
import { StudioResults, type StudioResultSlots } from "../../../components/common/StudioResults.js";
import { STUDIO_RESULTS } from "../../../constants/studioResults.js";
import type { Lang } from "../../../lib/lang.js";
import { cn } from "../../../lib/utils.js";
import { formatCleanTime } from "../../../lib/timeUtils.js";
import { VideoExporterState } from "../hooks/useVideoExporter.js";
import { VideoExportResultItem } from "../types/videoExport.js";
import { formatFileSize, hevcHidden, VideoExportTexts } from "./videoExportUtils.js";
import { StudioDownloadButton } from "../../../components/common/StudioDownloadButton.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { VIDEO_EXPORT_FRAME_CLASSNAMES } from "../constants/videoExport";
type VideoExportResultListProps = { lang: Lang; exporter: Pick<VideoExporterState, "text" | "results" | "isExporting" | "job" | "downloadingId" | "downloadResult" | "deleteResults"> };
type VideoExportResultCardProps = { result: VideoExportResultItem; text: VideoExportTexts; isDownloading: boolean; onDownload: (result: VideoExportResultItem) => void; slots: StudioResultSlots };
const formatCreatedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? VIDEO_EXPORT_TEXT_SYMBOL : date.toLocaleString();
};
const VideoExportResultCard: FC<VideoExportResultCardProps> = ({ result, text, isDownloading, onDownload, slots }) => (
  <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_P_3_SM_P_4_BORDER, slots.selected && STUDIO_RESULTS.SELECTED)}>
    <StudioVideoPlayer src={hevcHidden(result.codec) && result.previewUrl ? result.previewUrl : result.videoUrl} poster={result.posterUrl || undefined} className={VIDEO_EXPORT_FRAME_CLASSNAMES[result.aspectRatio]} badge={result.aspectRatio} badgeIcon={Film} />
    {hevcHidden(result.codec) && <p className={RT_VIDEO_EXPORT.CODEC_NOTE}>{text.RESULT_HEVC_NOTE}</p>}
    <div className={cn(RT_SHARED.MT_3_SPACE_Y_2_TEXT_LEFT_FLEX_1_FLEX)}>
      <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
        <div className={STUDIO_RESULTS.TITLE_ROW}>
          {slots.select}
          <h4 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_LINE_CLAMP_1, STUDIO_RESULTS.TITLE_TEXT)} title={result.title}>
            {result.title}
          </h4>
        </div>
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
        {slots.remove}
        <StudioDownloadButton onClick={() => onDownload(result)} busy={isDownloading} />
      </div>
    </div>
  </StudioCard>
);
export const VideoExportResultList: FC<VideoExportResultListProps> = ({ exporter, lang }) => {
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
        <StudioEmptyState icon={Film} title={text.RESULTS_EMPTY_TITLE} description={text.RESULTS_EMPTY_DESC} />
      ) : (
        <StudioResults
          items={results}
          lang={lang}
          getId={(result) => result.id}
          getTitle={(result) => result.title}
          remove={exporter.deleteResults}
          summary={` · ${formatFileSize(_.sumBy(results, (result) => result.sizeBytes || 0))}`}
          gridClassName={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_1_SM_GRID_COLS_2_XL_GRID)}
          renderItem={(result, slots) => <VideoExportResultCard result={result} text={text} isDownloading={downloadingId === result.id} onDownload={exporter.downloadResult} slots={slots} />}
        />
      )}
    </StudioCard>
  );
};
