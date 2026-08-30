import { RefObject, useEffect } from "react";

export const usePausedVideoPreview = (videoRef: RefObject<HTMLVideoElement>, source: string): void => {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, [source, videoRef]);
};
