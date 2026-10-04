import { VideoExportSectionHeading } from "./VideoExportSectionHeading";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_SM, VIDEO_EXPORT_TEXT_SYMBOL, VIDEO_EXPORT_TEXT_SYMBOL_2, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { CalendarClock, Clock, Download, Film, Flame, HardDrive, ImageIcon, Music, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { formatCleanTime } from "../../lib/timeUtils.js";
import { VideoExporterState } from "../../hooks/useVideoExporter.js";
import { VideoExportResultItem } from "../../types/videoExport.js";
import { formatFileSize, VideoExportTexts } from "./videoExportUtils.js";
import { VideoExportPlayer } from "./VideoExportPlayer.js";
type VideoExportResultListProps = {
  exporter: Pick<VideoExporterState, "text" | "results" | "isExporting" | "job" | "downloadingId" | "downloadResult" | "removeResult">;
};
type VideoExportResultCardProps = {
  result: VideoExportResultItem;
  text: VideoExportTexts;
  isDownloading: boolean;
  onDownload: (result: VideoExportResultItem) => void;
  onRemove: (id: string) => void;
};
const formatCreatedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? VIDEO_EXPORT_TEXT_SYMBOL : date.toLocaleString();
};
const VideoExportResultCard: FC<VideoExportResultCardProps> = ({ result, text, isDownloading, onDownload, onRemove }) => (
  <div className={cn("glass-card rounded-2xl p-3 sm:p-4 border border-slate-800/80 bg-slate-900/70 shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all")}>
    <VideoExportPlayer src={result.videoUrl} aspectRatio={result.aspectRatio} badgeText={result.aspectRatio} badgeIcon={Film} />
    <div className={cn("mt-3 space-y-2 text-left flex-1 flex flex-col justify-between")}>
      <div className={cn("space-y-1.5")}>
        <h4 className={cn("text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-purple-300 transition-colors")} title={result.title}>
          {result.title}
        </h4>
        <div className={cn("flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400")}>
          <span className={cn("inline-flex items-center gap-1")}>
            <Clock className={cn("w-3 h-3 text-blue-400")} />
            {formatCleanTime(result.durationSeconds)}
          </span>
          <span className={cn("inline-flex items-center gap-1")}>
            <HardDrive className={cn("w-3 h-3 text-amber-400")} />
            {formatFileSize(result.sizeBytes)}
          </span>
          <span className={cn("inline-flex items-center gap-1")}>
            <Music className={cn("w-3 h-3 text-purple-400")} />
            {result.trackCount} {text.RESULT_TRACKS}
          </span>
          <span className={cn("inline-flex items-center gap-1")}>
            <ImageIcon className={cn("w-3 h-3 text-pink-400")} />
            {result.imageCount} {text.RESULT_IMAGES}
          </span>
          <span className={cn("inline-flex items-center gap-1")}>
            <CalendarClock className={cn("w-3 h-3 text-slate-500")} />
            {formatCreatedAt(result.createdAt)}
          </span>
        </div>
      </div>
      <div className={cn("pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2")}>
        <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => onRemove(result.id)} title={text.REMOVE_RESULT} className={cn("p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer")}>
          <Trash2 className={cn("w-3.5 h-3.5")} />
        </Button>
        <Button
          size={VIDEO_EXPORT_TEXT_SM}
          type={VIDEO_EXPORT_TEXT_BUTTON}
          onClick={() => onDownload(result)}
          disabled={isDownloading}
          className={cn("bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs px-3 py-1.5 h-auto flex items-center gap-1.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-75 disabled:cursor-wait")}>
          {isDownloading ? <Sparkles className={cn("w-3.5 h-3.5 animate-spin shrink-0")} /> : <Download className={cn("w-3.5 h-3.5 shrink-0")} />}
          <span>{isDownloading ? text.SAVING_VIDEO : text.DOWNLOAD_BTN}</span>
        </Button>
      </div>
    </div>
  </div>
);
export const VideoExportResultList: FC<VideoExportResultListProps> = ({ exporter }) => {
  const { text, results, isExporting, job, downloadingId } = exporter;
  const hasResults = !_.isEmpty(results);
  return (
    <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4")}>
        <VideoExportSectionHeading step={text.STEP_03} title={text.RESULTS_TITLE} icon={Flame} titleClassName={cn("text-sm font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2")} iconClassName={cn("w-4 h-4 text-amber-400", { "animate-bounce": isExporting })}>
          <span className={cn("px-2 py-0.5 rounded-full text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
            {results.length} {text.RESULTS_UNIT}
          </span>
        </VideoExportSectionHeading>
      </div>
      {isExporting && (
        <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25")}>
          <Sparkles className={cn("w-5 h-5 text-purple-400 animate-spin shrink-0")} />
          <div className={cn("min-w-0 flex-1")}>
            <p className={cn("text-xs font-bold text-slate-200 truncate")}>{job?.message || text.EXPORTING_BTN}</p>
            <p className={cn("text-[10px] font-mono text-slate-400")}>
              {_.clamp(_.toNumber(job?.percent) || 0, 0, 100)}
              {VIDEO_EXPORT_TEXT_SYMBOL_2}
            </p>
          </div>
        </div>
      )}
      {!hasResults ? (
        <div className={cn("py-14 flex flex-col items-center justify-center text-center space-y-3.5")}>
          <div className={cn("w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner")}>
            <Film className={cn("w-7 h-7 text-purple-400/80")} />
          </div>
          <div className={cn("space-y-1 max-w-sm")}>
            <h3 className={cn("text-sm font-extrabold text-slate-200")}>{text.RESULTS_EMPTY_TITLE}</h3>
            <p className={cn("text-xs text-slate-400 leading-relaxed")}>{text.RESULTS_EMPTY_DESC}</p>
          </div>
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4")}>
          {_.map(results, (result) => (
            <VideoExportResultCard key={result.id} result={result} text={text} isDownloading={downloadingId === result.id} onDownload={exporter.downloadResult} onRemove={exporter.removeResult} />
          ))}
        </div>
      )}
    </div>
  );
};
