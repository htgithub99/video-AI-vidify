import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { Thumbnail } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
export const MotionRemotionStill = ({ document, frame = 0 }: { document: MotionRemotionSpec; frame?: number }) => <Thumbnail component={StoryComposition} inputProps={{ document }} frameToDisplay={frame} durationInFrames={Math.ceil(document.duration * document.fps)} fps={document.fps} compositionWidth={document.width} compositionHeight={document.height} style={{ width: RT_MOTION.VALUE_100 }} />;
