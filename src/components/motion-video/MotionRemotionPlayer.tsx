import { Player } from "@remotion/player";
import { Audio } from "remotion";
import type { FC } from "react";
import { StoryComposition } from "../../remotion/StoryComposition.js";
import type { MotionRemotionSpec } from "../../types/motionVisual.js";
const PreviewComposition: FC<{ document: MotionRemotionSpec; audioUrl?: string }> = ({ document, audioUrl }) => (
  <>
    <StoryComposition document={document} />
    {audioUrl && <Audio src={audioUrl} />}
  </>
);
export const MotionRemotionPlayer: FC<{ spec: MotionRemotionSpec; audioUrl?: string; videoUrl?: string }> = ({ spec, audioUrl, videoUrl }) =>
  videoUrl ? (
    <video src={videoUrl} controls className="block w-full rounded-xl bg-black" />
  ) : (
    <Player component={PreviewComposition} inputProps={{ document: spec, audioUrl }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} controls style={{ width: "100%", maxHeight: 600, borderRadius: 12, backgroundColor: "#111" }} />
  );
