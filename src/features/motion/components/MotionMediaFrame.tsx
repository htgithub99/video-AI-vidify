import { useState, type FC } from "react";
import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { MotionLoadingIcon } from "./MotionControls.js";
import { cn } from "../../../lib/utils";
export const motionAspect = (width?: number, height?: number): string => (width && height ? `${width}${RT_MAINTENANCE.SLASH}${height}` : RT_MOTION.DEFAULT_ASPECT);
export const MotionMediaLoading: FC<{ small?: boolean }> = ({ small }) => (
  <div className={MOTION_STYLES.MEDIA_LOADING}>
    <MotionLoadingIcon className={small ? MOTION_STYLES.MEDIA_LOADING_ICON_SM : MOTION_STYLES.MEDIA_LOADING_ICON} />
  </div>
);
export const MotionMediaPlaceholder: FC<{ width?: number; height?: number }> = ({ width, height }) => (
  <div className={MOTION_STYLES.MEDIA_FRAME} style={{ aspectRatio: motionAspect(width, height) }}>
    <MotionMediaLoading />
  </div>
);
export const MotionExportedVideo: FC<{ url: string; width?: number; height?: number }> = ({ url, width, height }) => {
  const [ready, setReady] = useState(false);
  return (
    <div className={MOTION_STYLES.MEDIA_FRAME} style={{ aspectRatio: motionAspect(width, height) }}>
      <video src={url} controls preload={RT_MOTION.PRELOAD_AUTO} onLoadedData={() => setReady(true)} onError={() => setReady(true)} className={cn(MOTION_STYLES.MEDIA_FILL, ready ? MOTION_STYLES.MEDIA_SHOWN : MOTION_STYLES.MEDIA_HIDDEN)} />
      {!ready && <MotionMediaLoading />}
    </div>
  );
};
