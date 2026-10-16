import { StudioCard } from "../ui/Studio.js";
import { VIDEO_EXPORT_TEMPLATE_SYMBOL_3, VIDEO_EXPORT_TEMPLATE_SYMBOL_4, VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_SYMBOL_3, VIDEO_EXPORT_TEXT_UNSTYLED, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW_CANCEL } from "../../constants/videoExportText";
import { VIDEO_EXPORT_FRAME_CLASSNAMES } from "../../constants/videoExport";
import { FC } from "react";
import { AlertTriangle, Eye, MonitorPlay, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { VideoExporterState } from "../../hooks/useVideoExporter.js";
import { VideoExportPlayer } from "./VideoExportPlayer.js";
type VideoExportPreviewCardProps = {
  exporter: Pick<VideoExporterState, "text" | "preview" | "isPreviewing" | "isPreviewOutdated" | "canRender" | "isExporting" | "config" | "generatePreview" | "cancelPreview">;
};
export const VideoExportPreviewCard: FC<VideoExportPreviewCardProps> = ({ exporter }) => {
  const { text, preview, isPreviewing, isPreviewOutdated, canRender, isExporting, config } = exporter;
  return (
    <StudioCard className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between flex-wrap gap-2")}>
        <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
          <Eye className={cn("w-3.5 h-3.5 text-purple-400")} />
          <span>{text.PREVIEW_TITLE}</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
            {config.aspectRatio}
            {VIDEO_EXPORT_TEXT_SYMBOL_3}
            {text.PREVIEW_BADGE}
          </span>
        </h3>
        {isPreviewing ? (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW_CANCEL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.cancelPreview} className={cn("h-8 px-3 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all")}>
            <X className={cn("w-3.5 h-3.5")} />
            <span>{text.PREVIEW_CANCEL}</span>
          </Button>
        ) : (
          <Button
            id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW}
            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
            type={VIDEO_EXPORT_TEXT_BUTTON}
            onClick={exporter.generatePreview}
            disabled={!canRender || isExporting}
            className={cn("h-8 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 disabled:opacity-60 disabled:cursor-not-allowed")}>
            {preview ? <RefreshCw className={cn("w-3.5 h-3.5")} /> : <MonitorPlay className={cn("w-3.5 h-3.5")} />}
            <span>{preview ? text.PREVIEW_REFRESH_BTN : text.PREVIEW_BTN}</span>
          </Button>
        )}
      </div>
      <div className={cn("w-full flex justify-center items-center min-h-[280px] sm:min-h-[320px]")}>
        {preview?.previewUrl && !isPreviewing ? (
          <VideoExportPlayer key={VIDEO_EXPORT_TEMPLATE_SYMBOL_3(`${config.aspectRatio}`, `${preview.previewUrl}`)} src={preview.previewUrl} aspectRatio={config.aspectRatio} badgeText={VIDEO_EXPORT_TEMPLATE_SYMBOL_4(`${config.aspectRatio}`, `${text.PREVIEW_BADGE}`)} badgeIcon={Eye} />
        ) : (
          <div className={cn("relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner", VIDEO_EXPORT_FRAME_CLASSNAMES[config.aspectRatio])}>
            <div className={cn("flex flex-col items-center justify-center text-center p-6 space-y-3")}>
              <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg", isPreviewing ? "bg-purple-500/15 border-purple-500/30 shadow-purple-500/20" : "bg-slate-800/80 border-slate-700/80")}>{isPreviewing ? <Sparkles className={cn("w-6 h-6 text-purple-400 animate-spin")} /> : <MonitorPlay className={cn("w-6 h-6 text-purple-400/80")} />}</div>
              <div className={cn("space-y-1 max-w-sm")}>
                <p className={cn("text-sm font-extrabold text-slate-200")}>{isPreviewing ? text.PREVIEW_GENERATING : text.PREVIEW_EMPTY_TITLE}</p>
                {!isPreviewing && <p className={cn("text-xs text-slate-400 leading-relaxed")}>{text.PREVIEW_EMPTY_DESC}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
      {isPreviewOutdated && !isPreviewing && (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold")}>
          <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0")} />
          <span>{text.PREVIEW_OUTDATED}</span>
        </div>
      )}
    </StudioCard>
  );
};
