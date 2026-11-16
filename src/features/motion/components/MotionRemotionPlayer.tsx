import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { Player } from "@remotion/player";
import { Audio } from "remotion";
import type { FC } from "react";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { MotionHtmlScenePlayer } from "./MotionHtmlScenePlayer.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { motionAspect, motionRatioLabel } from "./MotionMediaFrame.js";
const PreviewComposition: FC<{ document: MotionRemotionSpec; audioUrl?: string }> = ({ document, audioUrl }) => (
  <>
    <StoryComposition document={document} />
    {audioUrl && <Audio src={audioUrl} />}
  </>
);
export const MotionRemotionPlayer: FC<{ spec: MotionRemotionSpec; audioUrl?: string; videoUrl?: string }> = ({ spec, audioUrl, videoUrl }) =>
  videoUrl ? (
    <StudioVideoPlayer src={videoUrl} aspect={motionAspect(spec.width, spec.height)} badge={motionRatioLabel(spec.width, spec.height)} />
  ) : spec.renderer === RT_MAINTENANCE.HTML_CANVAS ? (
    <MotionHtmlScenePlayer spec={spec} audioUrl={audioUrl} />
  ) : (
    <Player component={PreviewComposition} inputProps={{ document: spec, audioUrl }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} controls style={{ width: RT_MOTION.VALUE_100, maxHeight: 600, borderRadius: 12, backgroundColor: RT_MOTION.VALUE_111 }} />
  );
