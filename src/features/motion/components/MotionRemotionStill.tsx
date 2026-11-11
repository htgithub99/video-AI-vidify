import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Thumbnail } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { motionHtmlHostDocument } from "../../../lib/motionHtmlHost.js";
import { motionHtmlKitStale } from "../../../lib/motionHtmlKit.js";
import { motionHtmlFrame } from "../../../lib/motionHtmlScene.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { MotionMediaLoading, motionAspect } from "./MotionMediaFrame.js";
import { cn } from "../../../lib/utils";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
const MotionHtmlLiveStill = ({ document, onReady, className }: { document: MotionRemotionSpec; onReady: () => void; className: string }) => {
  const scene = document.scenes[0];
  const frame = useRef<HTMLIFrameElement>(null);
  const token = useMemo(() => `${RT_MAINTENANCE.MOTION}${Math.random().toString(36).slice(2)}`, [scene?.html?.hash]);
  const source = useMemo(() => (scene?.html ? motionHtmlHostDocument(scene.html.html, token) : ""), [scene?.html?.hash, token]);
  useEffect(() => {
    const listen = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.token === token) onReady();
    };
    window.addEventListener(RT_MAINTENANCE.MESSAGE, listen);
    const timer = window.setTimeout(onReady, RT_MOTION.STILL_READY_MS);
    return () => {
      window.removeEventListener(RT_MAINTENANCE.MESSAGE, listen);
      window.clearTimeout(timer);
    };
  }, [token, onReady]);
  return (
    <iframe
      ref={frame}
      title={document.title}
      sandbox={RT_MAINTENANCE.ALLOW_SCRIPTS}
      srcDoc={source}
      loading={RT_MOTION.LAZY}
      className={className}
      onLoad={() => scene && frame.current?.contentWindow?.postMessage({ type: RT_MAINTENANCE.MOTION_HOST_RENDER, token, input: motionHtmlFrame(document, scene, scene.startFrame) }, RT_MAINTENANCE.WILDCARD)}
      style={{ border: 0, width: RT_MAINTENANCE.VALUE_100, aspectRatio: motionAspect(document.width, document.height), pointerEvents: RT_MAINTENANCE.NONE, display: RT_MOTION.BLOCK }}
    />
  );
};
const MotionHtmlStill = ({ document }: { document: MotionRemotionSpec }) => {
  const html = document.scenes[0]?.html;
  const [ready, setReady] = useState(false);
  const done = useMemo(() => () => setReady(true), []);
  const fade = cn(MOTION_STYLES.MEDIA_THUMB_FILL, ready ? MOTION_STYLES.MEDIA_SHOWN : MOTION_STYLES.MEDIA_HIDDEN);
  return (
    <div className={MOTION_STYLES.MEDIA_THUMB} style={{ aspectRatio: motionAspect(document.width, document.height) }}>
      {html && motionHtmlKitStale(html.html) ? (
        <MotionHtmlLiveStill document={document} onReady={done} className={fade} />
      ) : (
        <img src={html?.thumbnail} alt={document.title} onLoad={done} onError={done} className={fade} style={{ width: RT_MAINTENANCE.VALUE_100, aspectRatio: motionAspect(document.width, document.height), objectFit: RT_MAINTENANCE.CONTAIN }} />
      )}
      {!ready && <MotionMediaLoading small />}
    </div>
  );
};
export const MotionRemotionStill = ({ document, frame = 0 }: { document: MotionRemotionSpec; frame?: number }) =>
  document.renderer === RT_MAINTENANCE.HTML_CANVAS ? (
    <MotionHtmlStill key={document.scenes[0]?.html?.hash} document={document} />
  ) : (
    <Thumbnail component={StoryComposition} inputProps={{ document }} frameToDisplay={frame} durationInFrames={Math.ceil(document.duration * document.fps)} fps={document.fps} compositionWidth={document.width} compositionHeight={document.height} style={{ width: RT_MOTION.VALUE_100 }} />
  );
