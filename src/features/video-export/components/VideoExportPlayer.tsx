import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_METADATA, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../../constants/videoExportText";
import { VIDEO_EXPORT_FRAME_CLASSNAMES } from "../constants/videoExport";
import { FC, MouseEvent, useEffect, useRef, useState } from "react";
import { Eye, LucideIcon, Pause, Play } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { formatCleanTime } from "../../../lib/timeUtils.js";
import { VideoExportAspectRatio } from "../types/videoExport.js";
type VideoExportPlayerProps = { src: string; poster?: string; aspectRatio: VideoExportAspectRatio; badgeText?: string; badgeIcon?: LucideIcon; className?: string; autoPlay?: boolean };
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
    <div className={cn(RT_VIDEO_EXPORT.RELATIVE_ROUNDED_2XL_OVERFLOW_HIDDEN_BG_SLATE_950_BORDER_BORDER, VIDEO_EXPORT_FRAME_CLASSNAMES[aspectRatio] ?? VIDEO_EXPORT_FRAME_CLASSNAMES[VideoExportAspectRatio.HORIZONTAL_16_9], className)}>
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
        className={cn(RT_VIDEO_EXPORT.W_FULL_H_FULL_OBJECT_CONTAIN_BG_BLACK_CURSOR_POINTER)}
      />
      <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={togglePlay} className={cn(RT_SHARED.ABSOLUTE_INSET_0_M_AUTO_W_12_H_12_ROUNDED, { "opacity-0 group-hover/video:opacity-100": isPlaying, "opacity-90": !isPlaying })}>
        {isPlaying ? <Pause className={cn(RT_SHARED.W_5_H_5_TEXT_PURPLE_400)} /> : <Play className={cn(RT_SHARED.W_5_H_5_TEXT_PURPLE_400_ML_0_5)} />}
      </Button>
      {badgeText && (
        <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_TOP_2_5_LEFT_2_5_PX_2_5)}>
          <BadgeIcon className={cn(RT_SHARED.W_3_H_3_TEXT_PURPLE_400)} />
          <span>{badgeText}</span>
        </div>
      )}
      <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_BOTTOM_0_INSET_X_0_BG_GRADIENT_TO_T)}>
        <div onClick={handleSeek} className={cn(RT_VIDEO_EXPORT.RELATIVE_W_FULL_H_2_BG_SLATE_700_60_HOVER)}>
          <div className={cn(RT_SHARED.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA)} style={{ width: `${progressPercent}${RT_SHARED.SYMBOL}` }} />
        </div>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_10PX_FONT_MONO_TEXT)}>
          <span className={cn(RT_SHARED.FONT_BOLD_TEXT_PURPLE_300)}>{formatCleanTime(currentTime)}</span>
          <span className={cn(RT_SHARED.TEXT_SLATE_400)}>{formatCleanTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
