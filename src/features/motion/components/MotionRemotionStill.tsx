import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { useMemo, useRef } from "react";
import { Thumbnail } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { motionHtmlHostDocument } from "../../../lib/motionHtmlHost.js";
import { motionHtmlKitStale } from "../../../lib/motionHtmlKit.js";
import { motionHtmlFrame } from "../../../lib/motionHtmlScene.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
const MotionHtmlLiveStill = ({ document }: { document: MotionRemotionSpec }) => {
  const scene = document.scenes[0];
  const frame = useRef<HTMLIFrameElement>(null);
  const token = useMemo(() => `${RT_MAINTENANCE.MOTION}${Math.random().toString(36).slice(2)}`, [scene?.html?.hash]);
  const source = useMemo(() => (scene?.html ? motionHtmlHostDocument(scene.html.html, token) : ""), [scene?.html?.hash, token]);
  return (
    <iframe
      ref={frame}
      title={document.title}
      sandbox={RT_MAINTENANCE.ALLOW_SCRIPTS}
      srcDoc={source}
      loading={RT_MOTION.LAZY}
      onLoad={() => scene && frame.current?.contentWindow?.postMessage({ type: RT_MAINTENANCE.MOTION_HOST_RENDER, token, input: motionHtmlFrame(document, scene, scene.startFrame) }, RT_MAINTENANCE.WILDCARD)}
      style={{ border: 0, width: RT_MAINTENANCE.VALUE_100, aspectRatio: `${document.width}${RT_MAINTENANCE.SLASH}${document.height}`, pointerEvents: RT_MAINTENANCE.NONE, display: RT_MOTION.BLOCK }}
    />
  );
};
export const MotionRemotionStill = ({ document, frame = 0 }: { document: MotionRemotionSpec; frame?: number }) =>
  document.renderer === RT_MAINTENANCE.HTML_CANVAS ? (
    document.scenes[0]?.html && motionHtmlKitStale(document.scenes[0].html.html) ? (
      <MotionHtmlLiveStill document={document} />
    ) : (
      <img src={document.scenes[0]?.html?.thumbnail} alt={document.title} style={{ width: RT_MAINTENANCE.VALUE_100, aspectRatio: `${document.width}${RT_MAINTENANCE.SLASH}${document.height}`, objectFit: RT_MAINTENANCE.CONTAIN }} />
    )
  ) : (
    <Thumbnail component={StoryComposition} inputProps={{ document }} frameToDisplay={frame} durationInFrames={Math.ceil(document.duration * document.fps)} fps={document.fps} compositionWidth={document.width} compositionHeight={document.height} style={{ width: RT_MOTION.VALUE_100 }} />
  );
