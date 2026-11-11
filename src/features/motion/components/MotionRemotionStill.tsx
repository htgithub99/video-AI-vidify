import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { Thumbnail } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
export const MotionRemotionStill = ({ document, frame = 0 }: { document: MotionRemotionSpec; frame?: number }) =>
  document.renderer === RT_MAINTENANCE.HTML_CANVAS ? (
    <img src={document.scenes[0]?.html?.thumbnail} alt={document.title} style={{ width: RT_MAINTENANCE.VALUE_100, aspectRatio: `${document.width}${RT_MAINTENANCE.SLASH}${document.height}`, objectFit: RT_MAINTENANCE.CONTAIN }} />
  ) : (
    <Thumbnail component={StoryComposition} inputProps={{ document }} frameToDisplay={frame} durationInFrames={Math.ceil(document.duration * document.fps)} fps={document.fps} compositionWidth={document.width} compositionHeight={document.height} style={{ width: RT_MOTION.VALUE_100 }} />
  );
