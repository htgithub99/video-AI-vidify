import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { Player } from "@remotion/player";
import { Audio } from "remotion";
import type { FC } from "react";
import { StoryComposition } from "../remotion/StoryComposition.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
const PreviewComposition: FC<{ document: MotionRemotionSpec; audioUrl?: string }> = ({ document, audioUrl }) => (
  <>
    <StoryComposition document={document} />
    {audioUrl && <Audio src={audioUrl} />}
  </>
);
export const MotionRemotionPlayer: FC<{ spec: MotionRemotionSpec; audioUrl?: string; videoUrl?: string }> = ({ spec, audioUrl, videoUrl }) =>
  videoUrl ? (
    <video src={videoUrl} controls className={RT_MOTION.BLOCK_W_FULL_ROUNDED_XL_BG_BLACK} />
  ) : (
    <Player component={PreviewComposition} inputProps={{ document: spec, audioUrl }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} controls style={{ width: RT_MOTION.VALUE_100, maxHeight: 600, borderRadius: 12, backgroundColor: RT_MOTION.VALUE_111 }} />
  );
