import { SOURCE_TEMPLATE_GB, SOURCE_TEMPLATE_MB, SOURCE_TEMPLATE_PATH, SOURCE_TEMPLATE_SYMBOL_7, SOURCE_TEMPLATE_SYMBOL_8, SOURCE_TEXT_0, SOURCE_TEXT_APPLICATION_JSON, SOURCE_TEXT_BUTTON, SOURCE_TEXT_METADATA, SOURCE_TEXT_POST, SOURCE_TEXT_UNSTYLED, SOURCE_TEXT_X } from "../../constants/sourceText";
import React, { useState } from "react";
import _ from "lodash";
import { Film, Upload, FileVideo, Clock, Monitor, HardDrive } from "lucide-react";
import { SHORTS_TEXTS, SHORTS_UI_CONSTANTS } from "../../constants/shorts.js";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import { ShortsSourceMetadata } from "../../types/shorts.js";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { toast } from "sonner";
interface ShortsSourceCardProps {
  sourceVideoPath: string;
  sourceMetadata: ShortsSourceMetadata | null;
  onSelectVideoPath: (path: string) => void;
  disabled?: boolean;
}
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return SHORTS_UI_CONSTANTS.DEFAULT_ZERO_DURATION;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return SOURCE_TEMPLATE_SYMBOL_7(`${hrs}`, `${_.padStart(_.toString(mins), 2, SOURCE_TEXT_0)}`, `${_.padStart(_.toString(secs), 2, SOURCE_TEXT_0)}`);
  }
  return SOURCE_TEMPLATE_SYMBOL_8(`${mins}`, `${_.padStart(_.toString(secs), 2, SOURCE_TEXT_0)}`);
};
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return SHORTS_UI_CONSTANTS.DEFAULT_ZERO_FILESIZE;
  if (bytes >= 1024 * 1024 * 1024) {
    return SOURCE_TEMPLATE_GB(`${(bytes / (1024 * 1024 * 1024)).toFixed(2)}`);
  }
  return SOURCE_TEMPLATE_MB(`${(bytes / (1024 * 1024)).toFixed(1)}`);
};
export const ShortsSourceCard: React.FC<ShortsSourceCardProps> = ({ sourceVideoPath, sourceMetadata, onSelectVideoPath, disabled }) => {
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const handleOpenFileDialog = async () => {
    if (disabled || isSelecting) return;
    setIsSelecting(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FILE, {
        method: SOURCE_TEXT_POST,
        headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON },
      });
      const data = await response.json();
      if (data.success && data.filePath) {
        onSelectVideoPath(data.filePath);
      }
    } catch (err: any) {
      toast.error(`${SHORTS_TEXTS.ERR_DIALOG_FAILED} ${err?.message}`);
    } finally {
      setIsSelecting(false);
    }
  };
  const hasSource = Boolean(sourceVideoPath);
  return (
    <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
        <div className={cn("flex items-center gap-2.5 min-w-0")}>
          <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{SHORTS_TEXTS.STEP_01}</span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
            <Film className={cn("w-3.5 h-3.5 text-purple-400")} />
            <span>{SHORTS_TEXTS.SOURCE_VIDEO_LABEL}</span>
            <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>{SHORTS_TEXTS.SOURCE_VIDEO_BADGE}</span>
          </h3>
        </div>
        {hasSource && (
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleOpenFileDialog} disabled={disabled || isSelecting} className={cn("px-3 py-1 rounded-xl text-xs font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-colors cursor-pointer")}>
            {SHORTS_TEXTS.CHANGE_VIDEO_PROMPT}
          </Button>
        )}
      </div>
      <div className={cn("relative w-full aspect-video max-h-[340px] min-h-[220px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl group/source")}>
        {hasSource ? (
          <>
            <video
              key={sourceVideoPath}
              src={sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.BLOB) || sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.HTTP) ? sourceVideoPath : SOURCE_TEMPLATE_PATH(`${API_ROUTES.SHORTS_STREAM_SOURCE}`, `${encodeURIComponent(sourceVideoPath)}`)}
              controls
              preload={SOURCE_TEXT_METADATA}
              playsInline
              className={cn("w-full h-full object-contain rounded-2xl bg-black")}
            />
            <div className={cn("absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-purple-500/30 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg max-w-[70%]")}>
              <Film className={cn("w-3.5 h-3.5 text-purple-400 shrink-0")} />
              <span className="truncate">{sourceMetadata?.fileName || sourceVideoPath}</span>
            </div>
          </>
        ) : (
          <div
            onClick={handleOpenFileDialog}
            className={cn("w-full h-full border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer group", {
              "border-slate-700/80 bg-slate-950/40 hover:border-purple-500/60 hover:bg-purple-500/5": !hasSource,
              "opacity-60 cursor-not-allowed": Boolean(disabled),
            })}>
            <div className={cn("w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md")}>
              <Upload className={cn("w-6 h-6 text-purple-400 group-hover:text-purple-300")} />
            </div>
            <div className={cn("space-y-1")}>
              <p className={cn("text-sm font-medium text-slate-200")}>{SHORTS_TEXTS.DROP_VIDEO_PROMPT}</p>
              <p className={cn("text-xs text-slate-400")}>{SHORTS_TEXTS.DROP_VIDEO_SUB}</p>
            </div>
          </div>
        )}
      </div>
      <div className={cn("min-h-[58px] w-full transition-all")}>
        {sourceMetadata ? (
          <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-200")}>
            <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
              <Clock className={cn("w-4 h-4 text-purple-400 shrink-0")} />
              <div className={cn("min-w-0")}>
                <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{SHORTS_TEXTS.METADATA_DURATION}</div>
                <div className={cn("text-xs font-bold text-slate-200 truncate")}>{formatDuration(sourceMetadata.duration)}</div>
              </div>
            </div>
            <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
              <Monitor className={cn("w-4 h-4 text-blue-400 shrink-0")} />
              <div className={cn("min-w-0")}>
                <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{SHORTS_TEXTS.METADATA_RESOLUTION}</div>
                <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                  {sourceMetadata.width}
                  {SOURCE_TEXT_X}
                  {sourceMetadata.height}
                </div>
              </div>
            </div>
            <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
              <HardDrive className={cn("w-4 h-4 text-amber-400 shrink-0")} />
              <div className={cn("min-w-0")}>
                <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{SHORTS_TEXTS.METADATA_FILESIZE}</div>
                <div className={cn("text-xs font-bold text-slate-200 truncate")}>{formatFileSize(sourceMetadata.fileSizeBytes)}</div>
              </div>
            </div>
            <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
              <FileVideo className={cn("w-4 h-4 text-pink-400 shrink-0")} />
              <div className={cn("min-w-0")}>
                <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{SHORTS_TEXTS.METADATA_FPS}</div>
                <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                  {sourceMetadata.fps} {SHORTS_TEXTS.FPS_UNIT}
                </div>
              </div>
            </div>
          </div>
        ) : hasSource ? (
          <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1")}>
            {_.map(_.range(4), (idx) => (
              <div key={idx} className={cn("bg-slate-950/40 border border-slate-800/50 rounded-xl p-2.5 flex items-center gap-2 animate-pulse h-[52px]")}>
                <div className={cn("w-4 h-4 rounded bg-slate-800/80 shrink-0")} />
                <div className={cn("space-y-1.5 flex-1 min-w-0")}>
                  <div className={cn("h-2 w-12 bg-slate-800/80 rounded")} />
                  <div className={cn("h-2.5 w-16 bg-slate-800/60 rounded")} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
