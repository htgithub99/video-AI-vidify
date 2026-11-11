import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { motionHtmlHostDocument } from "../../../lib/motionHtmlHost.js";
import { motionHtmlFrame } from "../../../lib/motionHtmlScene.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
export const MotionHtmlScenePlayer = ({ spec, audioUrl }: { spec: MotionRemotionSpec; audioUrl?: string }) => {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const [interactive, setInteractive] = useState(false),
    [displayWidth, setDisplayWidth] = useState(spec.width);
  const viewport = useRef<HTMLDivElement>(null),
    legacy = useRef<PlayerRef>(null);
  const frame = Math.min(Math.ceil(spec.duration * spec.fps) - 1, Math.floor(time * spec.fps));
  const scene = spec.scenes.find((item) => frame >= item.startFrame && frame < item.endFrame);
  const iframe = useRef<HTMLIFrameElement>(null),
    audio = useRef<HTMLAudioElement>(null),
    current = useRef<ReturnType<typeof motionHtmlFrame>>();
  const token = useMemo(() => `${RT_MAINTENANCE.MOTION}${Math.random().toString(36).slice(2)}`, [scene?.id, scene?.html?.hash]);
  const source = useMemo(() => (scene?.html ? motionHtmlHostDocument(scene.html.html, token) : ""), [scene?.html?.hash, token]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setError("");
    setInteractive(false);
  }, [source]);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setDisplayWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    legacy.current?.seekTo(frame);
  }, [frame, scene?.id]);
  useEffect(() => {
    if (loaded) iframe.current?.contentWindow?.postMessage({ type: RT_MAINTENANCE.MOTION_HOST_INTERACTION, token, enabled: interactive }, RT_MAINTENANCE.WILDCARD);
  }, [interactive, loaded, token]);
  useEffect(() => {
    if (!scene) return;
    current.current = motionHtmlFrame(spec, scene, frame);
    if (loaded && !interactive) iframe.current?.contentWindow?.postMessage({ type: RT_MAINTENANCE.MOTION_HOST_RENDER, token, input: current.current }, RT_MAINTENANCE.WILDCARD);
  }, [frame, spec, scene, loaded, token, interactive]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.token !== token) return;
      if (event.data.error) {
        setError(event.data.error);
        setPlaying(false);
        window.dispatchEvent(new CustomEvent(RT_MAINTENANCE.MOTION_HTML_EXECUTION_ERROR, { detail: { sceneId: scene?.id, hash: scene?.html?.hash, error: event.data.error } }));
      }
    };
    window.addEventListener(RT_MAINTENANCE.MESSAGE, receive);
    return () => window.removeEventListener(RT_MAINTENANCE.MESSAGE, receive);
  }, [token, scene?.id, scene?.html?.hash]);
  useEffect(() => {
    if (!playing) {
      audio.current?.pause();
      return;
    }
    if (audio.current) {
      audio.current.currentTime = time;
      void audio.current.play().catch(() => setPlaying(false));
    }
    let last = performance.now(),
      request = 0;
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((value) => {
        const next = audio.current && !audio.current.paused ? audio.current.currentTime : value + delta;
        if (next >= spec.duration) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // The playback clock starts at the current seek point, not on every frame update.
  }, [playing, spec.duration]);
  const subtitle = spec.subtitles.find((entry) => time >= entry.start && time < entry.end);
  return (
    <div>
      <div ref={viewport} style={{ position: RT_MAINTENANCE.RELATIVE, aspectRatio: `${spec.width}${RT_MAINTENANCE.SLASH}${spec.height}`, background: RT_MAINTENANCE.FFF, overflow: RT_MAINTENANCE.HIDDEN }}>
        {source ? (
          <iframe ref={iframe} title={scene?.purpose || RT_MAINTENANCE.CANVAS_SCENE} sandbox={RT_MAINTENANCE.ALLOW_SCRIPTS} srcDoc={source} onLoad={() => setLoaded(true)} style={{ border: 0, width: RT_MAINTENANCE.VALUE_100, height: RT_MAINTENANCE.VALUE_100 }} />
        ) : scene && scene.renderer !== RT_MAINTENANCE.HTML_CANVAS ? (
          <Player ref={legacy} component={StoryComposition} inputProps={{ document: { ...spec, subtitles: [] } }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} style={{ width: RT_MAINTENANCE.VALUE_100, height: RT_MAINTENANCE.VALUE_100 }} />
        ) : (
          <p>{RT_MAINTENANCE.DANG_DUNG_CANH}</p>
        )}
        {subtitle && !interactive && (
          <div
            style={{
              position: RT_MAINTENANCE.ABSOLUTE,
              left: RT_MAINTENANCE.VALUE_7,
              right: RT_MAINTENANCE.VALUE_7,
              bottom: RT_MAINTENANCE.VALUE_4,
              color: RT_MAINTENANCE.WHITE,
              textAlign: RT_MAINTENANCE.CENTER,
              font: `${RT_MAINTENANCE.BOLD}${(Math.max(20, spec.height * 0.04) * displayWidth) / spec.width}${RT_MAINTENANCE.PX}${spec.fontFamily || RT_MAINTENANCE.ARIAL}`,
              lineHeight: 1.25,
              textShadow: RT_MAINTENANCE.VALUE_0_2PX_3PX_000_1PX_0_2PX_000_1PX_0,
              pointerEvents: RT_MAINTENANCE.NONE,
            }}>
            {subtitle.text}
          </div>
        )}
      </div>
      {audioUrl && <audio ref={audio} src={audioUrl} />}
      <div style={{ display: RT_MAINTENANCE.FLEX, gap: 8, alignItems: RT_MAINTENANCE.CENTER, padding: 8 }}>
        <button
          type={RT_MAINTENANCE.BUTTON}
          onClick={() => {
            setInteractive(false);
            setPlaying((value) => !value);
          }}
          disabled={!!error}>
          {playing ? RT_MAINTENANCE.PAUSE_ICON : RT_MAINTENANCE.PLAY_ICON}
        </button>
        <input
          aria-label={RT_MAINTENANCE.VIDEO_TIMELINE}
          type={RT_MAINTENANCE.RANGE}
          min={0}
          max={spec.duration}
          step={1 / spec.fps}
          value={time}
          style={{ flex: 1 }}
          onChange={(event) => {
            setInteractive(false);
            const value = Number(event.target.value);
            setTime(value);
            if (audio.current) audio.current.currentTime = value;
          }}
        />
        <span>
          {time.toFixed(1)}
          {RT_MAINTENANCE.SLASH_SEPARATOR}
          {spec.duration.toFixed(1)}
          {RT_MAINTENANCE.S_4}
        </span>
        {source && (
          <button
            type={RT_MAINTENANCE.BUTTON}
            aria-pressed={interactive}
            onClick={() => {
              setPlaying(false);
              setInteractive((value) => !value);
            }}>
            {interactive ? RT_MAINTENANCE.VE_VIDEO : RT_MAINTENANCE.THU_TUONG_TAC}
          </button>
        )}
      </div>
      {error && <p role={RT_MAINTENANCE.ALERT}>{error}</p>}
    </div>
  );
};
