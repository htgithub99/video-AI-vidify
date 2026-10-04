import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_METADATA, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../constants/videoExportText";
import { VIDEO_EXPORT_FRAME_CLASSNAMES } from "../../constants/videoExport";
import { FC, MouseEvent, useEffect, useRef, useState } from "react";
import { Eye, LucideIcon, Pause, Play } from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { formatCleanTime } from "../../lib/timeUtils.js";
import { VideoExportAspectRatio } from "../../types/videoExport.js";
type VideoExportPlayerProps = {
  src: string;
  poster?: string;
  aspectRatio: VideoExportAspectRatio;
  badgeText?: string;
  badgeIcon?: LucideIcon;
  className?: string;
  autoPlay?: boolean;
};
export const VideoExportPlayer: FC<VideoExportPlayerProps> = ({ src, poster, aspectRatio, badgeText, badgeIcon: BadgeIcon = Eye, className, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (autoPlay) {
      video.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    }
  }, [src, autoPlay]);
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime || 0);
    if (!duration && video.duration) setDuration(video.duration);
  };
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
  };
  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const seekPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const nextTime = seekPercent * duration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center shadow-inner group/video select-none transition-all", VIDEO_EXPORT_FRAME_CLASSNAMES[aspectRatio] ?? VIDEO_EXPORT_FRAME_CLASSNAMES[VideoExportAspectRatio.HORIZONTAL_16_9], className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload={VIDEO_EXPORT_TEXT_METADATA}
        loop
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        className={cn("w-full h-full object-contain bg-black cursor-pointer")}
      />
      <Button
        variant={VIDEO_EXPORT_TEXT_UNSTYLED}
        type={VIDEO_EXPORT_TEXT_BUTTON}
        onClick={togglePlay}
        className={cn("absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer p-0", {
          "opacity-0 group-hover/video:opacity-100": isPlaying,
          "opacity-90": !isPlaying,
        })}>
        {isPlaying ? <Pause className={cn("w-5 h-5 text-purple-400")} /> : <Play className={cn("w-5 h-5 text-purple-400 ml-0.5")} />}
      </Button>
      {badgeText && (
        <div className={cn("absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-purple-300 text-[10px] font-bold font-mono flex items-center gap-1 shadow-md pointer-events-none")}>
          <BadgeIcon className={cn("w-3 h-3 text-purple-400")} />
          <span>{badgeText}</span>
        </div>
      )}
      <div className={cn("absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-2.5 pt-6 flex flex-col gap-1.5 transition-opacity")}>
        <div onClick={handleSeek} className={cn("relative w-full h-2 bg-slate-700/60 hover:h-2.5 rounded-full cursor-pointer overflow-hidden transition-all group/track border border-white/10")}>
          <div className={cn("h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-[width] duration-100 ease-linear shadow-xs shadow-purple-500/50")} style={{ width: `${progressPercent}%` }} />
        </div>
        <div className={cn("flex items-center justify-between text-[10px] font-mono text-slate-300 px-0.5")}>
          <span className={cn("font-bold text-purple-300")}>{formatCleanTime(currentTime)}</span>
          <span className={cn("text-slate-400")}>{formatCleanTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
