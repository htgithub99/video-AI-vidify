import { StudioCard } from "../ui/Studio.js";
import { SOURCE_TEMPLATE_SHORT, SOURCE_TEMPLATE_SYMBOL_8, SOURCE_TEXT_0, SOURCE_TEXT_A, SOURCE_TEXT_BUTTON, SOURCE_TEXT_METADATA, SOURCE_TEXT_SM, SOURCE_TEXT_SYMBOL_25, SOURCE_TEXT_SYMBOL_27, SOURCE_TEXT_SYMBOL_28, SOURCE_TEXT_SYMBOL_9, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import React, { useRef, useState } from "react";
import _ from "lodash";
import { Download, Flame, Play, Pause, Sparkles } from "lucide-react";
import { HighlightClipItem } from "../../types/shorts.js";
import { SHORTS_CONSTANTS, SHORTS_REGEX, SHORTS_TEXTS, SHORTS_UI_CONSTANTS } from "../../constants/shorts.js";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
interface ShortsResultCardProps {
  clip: HighlightClipItem;
  isPlaying?: boolean;
  isDownloading?: boolean;
  downloadingText?: string;
  onTogglePlay?: (shouldPlay: boolean) => void;
  onDownload?: (clip: HighlightClipItem) => void;
}
const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return SOURCE_TEMPLATE_SYMBOL_8(`${_.padStart(_.toString(m), 2, SOURCE_TEXT_0)}`, `${_.padStart(_.toString(s), 2, SOURCE_TEXT_0)}`);
};
export const ShortsResultCard: React.FC<ShortsResultCardProps> = ({ clip, isPlaying = false, isDownloading = false, downloadingText = SHORTS_TEXTS.SAVING_VIDEO, onTogglePlay, onDownload }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(clip.duration || 0);
  React.useEffect(() => {
    if (!videoRef.current) return;
    if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onTogglePlay?.(false);
    } else {
      videoRef.current.play().catch(() => {});
      onTogglePlay?.(true);
    }
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (duration || clip.duration || 1);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const handleDownload = () => {
    if (onDownload) {
      onDownload(clip);
      return;
    }
    if (!clip.videoUrl) return;
    const link = document.createElement(SOURCE_TEXT_A);
    link.href = clip.videoUrl;
    link.download = SOURCE_TEMPLATE_SHORT(`${clip.index}`, `${_.replace(clip.title, SHORTS_REGEX.CLEAN_TITLE, SOURCE_TEXT_SYMBOL_25)}`, `${SHORTS_CONSTANTS.EXT_MP4}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <StudioCard className={cn("glass-card rounded-2xl p-3 sm:p-4 border border-slate-800/80 bg-slate-900/70 shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all")}>
      <div className={cn("relative rounded-xl overflow-hidden bg-slate-950 aspect-[9/16] w-full max-h-[380px] flex items-center justify-center border border-slate-800/60 shadow-inner group/video")}>
        {clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            preload={SOURCE_TEXT_METADATA}
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setCurrentTime(0);
              onTogglePlay?.(false);
            }}
            className={cn("w-full h-full object-cover")}
          />
        ) : (
          <div className={cn("text-slate-600 text-xs")}>{SHORTS_TEXTS.LOADING_VIDEO}</div>
        )}
        <Button
          variant={SOURCE_TEXT_UNSTYLED}
          type={SOURCE_TEXT_BUTTON}
          onClick={togglePlay}
          className={cn("absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer p-0", {
            "opacity-0 group-hover/video:opacity-100": isPlaying,
            "opacity-90": !isPlaying,
          })}>
          {isPlaying ? <Pause className={cn("w-5 h-5 text-purple-400")} /> : <Play className={cn("w-5 h-5 text-purple-400 ml-0.5")} />}
        </Button>
        <div className={cn("absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono flex items-center gap-1 shadow-md")}>
          <Flame className={cn("w-3 h-3 text-amber-400 fill-amber-400 animate-pulse")} />
          <span>
            {clip.viralScore}
            {SHORTS_TEXTS.VIRAL_BADGE_SUFFIX}
          </span>
        </div>
        <div className={cn("absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-2.5 pt-5 flex flex-col gap-1.5 transition-opacity")}>
          <div onClick={handleSeek} className={cn("relative w-full h-2 bg-slate-700/60 hover:h-3 rounded-full cursor-pointer overflow-hidden transition-all group/track border border-white/10")} title={SHORTS_UI_CONSTANTS.SEEK_TOOLTIP}>
            <div className={cn("h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-[width] duration-100 ease-linear shadow-xs shadow-purple-500/50")} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className={cn("flex items-center justify-between text-[10px] font-mono text-slate-300 px-0.5")}>
            <span className={cn("font-bold text-purple-300")}>{formatSeconds(currentTime)}</span>
            <span className={cn("text-slate-400")}>{formatSeconds(duration || clip.duration)}</span>
          </div>
        </div>
      </div>
      <div className={cn("mt-3 space-y-2 text-left")}>
        <div>
          <h4 className={cn("text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-purple-300 transition-colors")} title={clip.title}>
            {SOURCE_TEXT_SYMBOL_9}
            {clip.index}
            {SOURCE_TEXT_SYMBOL_27}
            {clip.title}
          </h4>
          <p className={cn("text-[10px] text-slate-400 line-clamp-2 mt-0.5")} title={clip.hookReason}>
            {clip.hookReason}
          </p>
        </div>
        <div className={cn("pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2")}>
          <span className={cn("text-[10px] text-purple-400 font-mono")}>
            {formatSeconds(clip.startTime)}
            {SOURCE_TEXT_SYMBOL_28}
            {formatSeconds(clip.endTime)}
          </span>
          <Button size={SOURCE_TEXT_SM} onClick={handleDownload} disabled={isDownloading} className={cn("bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1 h-auto flex items-center gap-1 rounded-lg shadow-sm disabled:opacity-75 disabled:cursor-wait")}>
            {isDownloading ? (
              <>
                <Sparkles className={cn("w-3 h-3 animate-spin")} />
                <span>{downloadingText}</span>
              </>
            ) : (
              <>
                <Download className={cn("w-3 h-3")} />
                <span>{SHORTS_TEXTS.DOWNLOAD_BUTTON}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </StudioCard>
  );
};
