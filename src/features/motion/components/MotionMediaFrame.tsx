import type { FC } from "react";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { MOTION_LOADING_GLYPH, MotionLoadingIcon } from "./MotionControls.js";
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
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** "16:9"-style label for the player badge. */
export const motionRatioLabel = (width: number, height: number): string => {
  const d = gcd(Math.round(width), Math.round(height)) || 1;
  return `${Math.round(width) / d}:${Math.round(height) / d}`;
};
export const MotionExportedVideo: FC<{ url: string; width?: number; height?: number }> = ({ url, width, height }) => (
  <StudioVideoPlayer src={url} aspect={motionAspect(width, height)} badge={width && height ? motionRatioLabel(width, height) : undefined} loadingIcon={MOTION_LOADING_GLYPH} />
);
