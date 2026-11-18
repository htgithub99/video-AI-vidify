import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { Player } from "@remotion/player";
import { Audio } from "remotion";
import { memo, type FC } from "react";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { MotionHtmlScenePlayer } from "./MotionHtmlScenePlayer.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
import { StudioVideoPlayer } from "../../../components/common/StudioPlayer.js";
import { motionAspect, motionRatioLabel } from "./MotionMediaFrame.js";
import { MOTION_LOADING_GLYPH } from "./MotionControls.js";
const PreviewComposition: FC<{ document: MotionRemotionSpec; audioUrl?: string }> = ({ document, audioUrl }) => (
  <>
    <StoryComposition document={document} />
    {audioUrl && <Audio src={audioUrl} />}
  </>
);
// Memoised: the studio page re-renders on every job update, which must not touch a preview that is playing.
export const MotionRemotionPlayer = memo(({ spec, audioUrl, videoUrl }: { spec: MotionRemotionSpec; audioUrl?: string; videoUrl?: string }) =>
  videoUrl ? (
    <StudioVideoPlayer src={videoUrl} aspect={motionAspect(spec.width, spec.height)} badge={motionRatioLabel(spec.width, spec.height)} loadingIcon={MOTION_LOADING_GLYPH} />
  ) : spec.renderer === RT_MAINTENANCE.HTML_CANVAS ? (
    <MotionHtmlScenePlayer spec={spec} audioUrl={audioUrl} />
  ) : (
    <Player component={PreviewComposition} inputProps={{ document: spec, audioUrl }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} controls style={{ width: RT_MOTION.VALUE_100, maxHeight: 600, borderRadius: 12, backgroundColor: RT_MOTION.VALUE_111 }} />
  ));
