import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { motionHtmlHostDocument } from "../../../lib/motionHtmlHost.js";
import { motionFigureRenderOf, type MotionFigureScene } from "../../../lib/motionFigures.js";
import { motionHtmlFrame } from "../../../lib/motionHtmlScene.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
import { StudioPlayerFrame, useSinglePlayback } from "../../../components/common/StudioPlayer.js";
import { STUDIO_PLAYER } from "../../../constants/studioTheme.js";
import { cn } from "../../../lib/utils.js";
import { motionRatioLabel } from "./MotionMediaFrame.js";
import { MOTION_LOADING_GLYPH } from "./MotionControls.js";
import { MOTION_HTML_PREVIEW as PREVIEW } from "../constants/motionHtmlPreview.js";
type HtmlScene = MotionRemotionSpec["scenes"][number];
export const MotionHtmlScenePlayer = ({ spec, audioUrl }: { spec: MotionRemotionSpec; audioUrl?: string }) => {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(""),
    [buffering, setBuffering] = useState(false);
  const [displayWidth, setDisplayWidth] = useState(0);
  const viewport = useRef<HTMLDivElement>(null),
    legacy = useRef<PlayerRef>(null),
    audio = useRef<HTMLAudioElement>(null);
  const totalFrames = Math.max(1, Math.ceil(spec.duration * spec.fps));
  const frameAt = useCallback((seconds: number) => Math.max(0, Math.min(totalFrames - 1, Math.floor(seconds * spec.fps))), [totalFrames, spec.fps]);
  const sceneAt = useCallback((at: number) => spec.scenes.find((item) => at >= item.startFrame && at < item.endFrame), [spec.scenes]);
  const frame = frameAt(time);
  const scene = sceneAt(frame);
  const nextScene = scene ? spec.scenes.find((item) => item.startFrame === scene.endFrame) : undefined;
  const tokens = useRef(new Map<string, string>());
  const sources = useRef(new Map<string, string>());
  const tokenOf = useCallback((item: HtmlScene): string => {
    const key = `${item.id}|${item.html?.hash}`;
    let token = tokens.current.get(key);
    if (!token) {
      token = `${RT_MAINTENANCE.MOTION}${Math.random().toString(36).slice(2)}`;
      tokens.current.set(key, token);
    }
    return token;
  }, []);
  const slots = useMemo(() => {
    const list = [scene, nextScene].filter((item): item is HtmlScene => !!item?.html);
    return list.map((item) => {
      const token = tokenOf(item);
      let source = sources.current.get(token);
      if (!source) {
        source = motionHtmlHostDocument(item.html!.html, token, motionFigureRenderOf(spec, item as MotionFigureScene));
        sources.current.set(token, source);
      }
      return { scene: item, token, source };
    });
  }, [scene, nextScene, spec, tokenOf]);
  useEffect(() => {
    const keep = new Set(slots.map((slot) => slot.token));
    for (const token of [...sources.current.keys()]) if (!keep.has(token)) sources.current.delete(token);
  }, [slots]);
  const currentToken = scene?.html ? tokenOf(scene) : "";
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const ready = useRef(new Map<string, Set<number>>());
  const queued = useRef(new Map<string, number>());
  const post = useCallback((token: string, message: object) => frames.current.get(token)?.contentWindow?.postMessage({ token, ...message }, RT_MAINTENANCE.WILDCARD), []);
  const resetBuffers = useCallback(() => {
    for (const token of frames.current.keys()) post(token, { type: PREVIEW.HOST_RESET });
    ready.current.clear();
    queued.current.clear();
  }, [post]);
  const renderWidth = Math.max(160, Math.min(spec.width, Math.round((displayWidth || spec.width) * Math.min(PREVIEW.MAX_DPR, window.devicePixelRatio || 1))));
  const renderHeight = Math.round((renderWidth * spec.height) / spec.width);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setDisplayWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => resetBuffers(), [renderWidth, spec, resetBuffers]);
  useEffect(() => {
    setError("");
  }, [currentToken]);
  useEffect(() => {
    legacy.current?.seekTo(frame);
  }, [frame, scene?.id]);
  useEffect(() => {
    if (playing || !scene?.html || !loaded.has(currentToken)) return;
    post(currentToken, { type: RT_MAINTENANCE.MOTION_HOST_RENDER, input: motionHtmlFrame(spec, scene, frame, renderWidth, renderHeight) });
  }, [playing, frame, spec, scene, loaded, currentToken, renderWidth, renderHeight, post]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const token: string | undefined = event.data?.token;
      if (!token || !frames.current.has(token) || event.source !== frames.current.get(token)?.contentWindow) return;
      if (event.data.type === PREVIEW.HOST_BUFFERED) {
        let set = ready.current.get(token);
        if (!set) ready.current.set(token, (set = new Set()));
        set.add(event.data.frame);
        return;
      }
      if (event.data.type === PREVIEW.HOST_CLEARED) {
        ready.current.delete(token);
        queued.current.delete(token);
        return;
      }
      if (event.data.error) {
        setError(event.data.error);
        setPlaying(false);
        const failed = spec.scenes.find((item) => item.html && tokenOf(item) === token);
        window.dispatchEvent(new CustomEvent(RT_MAINTENANCE.MOTION_HTML_EXECUTION_ERROR, { detail: { sceneId: failed?.id, hash: failed?.html?.hash, error: event.data.error } }));
      }
    };
    window.addEventListener(RT_MAINTENANCE.MESSAGE, receive);
    return () => window.removeEventListener(RT_MAINTENANCE.MESSAGE, receive);
  }, [spec.scenes, tokenOf]);
  const timeRef = useRef(time);
  timeRef.current = time;
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  const step = useRef(1);
  const stalls = useRef<{ at: number; ms: number }[]>([]);
  useEffect(() => {
    if (!playing) {
      audio.current?.pause();
      setBuffering(false);
      return;
    }
    let last = performance.now(),
      request = 0,
      waitingSince = 0,
      shown = -1,
      clock = timeRef.current;
    const ahead = Math.round(PREVIEW.AHEAD_SECONDS * spec.fps);
    const feed = (item: HtmlScene, from: number) => {
      const token = tokenOf(item);
      if (!loadedRef.current.has(token)) return;
      const s = step.current;
      const end = Math.min(item.endFrame - 1, from + ahead);
      const done = queued.current.get(token) ?? -1;
      const items: { frame: number; input: ReturnType<typeof motionHtmlFrame> }[] = [];
      for (let f = Math.max(from, done + 1); f <= end; f++) if ((f - item.startFrame) % s === 0) items.push({ frame: f, input: motionHtmlFrame(spec, item, f, renderWidth, renderHeight) });
      if (items.length) {
        queued.current.set(token, end);
        post(token, { type: PREVIEW.HOST_QUEUE, items });
      }
    };
    const resumeVoice = () => {
      const node = audio.current;
      if (!node || !node.paused) return;
      node.currentTime = clock;
      void node.play().catch(() => undefined);
    };
    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      const at = frameAt(clock);
      const current = sceneAt(at);
      if (!current?.html) {
        clock += delta;
        resumeVoice();
      } else {
        const token = tokenOf(current);
        const s = step.current;
        const show = current.startFrame + Math.floor((at - current.startFrame) / s) * s;
        feed(current, show);
        const following = spec.scenes.find((item) => item.startFrame === current.endFrame);
        if (following?.html && current.endFrame - at < ahead) feed(following, following.startFrame);
        const have = ready.current.get(token);
        const primed = have?.has(show) && (shown >= 0 || have.size >= Math.min(PREVIEW.START_FRAMES, Math.ceil((current.endFrame - show) / s)));
        if (primed) {
          if (show !== shown) {
            post(token, { type: PREVIEW.HOST_SHOW, frame: show });
            shown = show;
          }
          if (waitingSince) {
            stalls.current.push({ at: now, ms: now - waitingSince });
            waitingSince = 0;
            setBuffering(false);
          }
          resumeVoice();
          const voice = audio.current && !audio.current.paused ? audio.current.currentTime : undefined;
          clock = voice !== undefined && Math.abs(voice - (clock + delta)) > 0.12 ? voice : clock + delta;
        } else {
          if (!waitingSince) waitingSince = now;
          audio.current?.pause();
          if (now - waitingSince > PREVIEW.SPINNER_DELAY_MS) setBuffering(true);
          stalls.current = stalls.current.filter((stall) => now - stall.at < PREVIEW.STALL_WINDOW_MS);
          const stalled = stalls.current.reduce((sum, stall) => sum + stall.ms, 0) + (now - waitingSince);
          if (stalled > PREVIEW.STALL_WINDOW_MS * PREVIEW.STALL_SHARE && step.current < PREVIEW.MAX_STEP) {
            step.current++;
            stalls.current = [];
          }
        }
      }
      if (clock >= spec.duration) {
        clock = 0;
        setPlaying(false);
      }
      setTime(clock);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, spec, renderWidth, renderHeight, frameAt, sceneAt, tokenOf, post]);
  const [thumbScene, setThumbScene] = useState<HtmlScene>();
  const thumbFrame = useRef<HTMLIFrameElement>(null);
  const thumbToken = useMemo(() => (thumbScene ? `${tokenOf(thumbScene)}-thumb` : ""), [thumbScene, tokenOf]);
  const thumbSource = useMemo(() => (thumbScene?.html ? motionHtmlHostDocument(thumbScene.html.html, thumbToken, motionFigureRenderOf(spec, thumbScene as MotionFigureScene)) : ""), [thumbScene, thumbToken, spec]);
  const thumbLoaded = useRef<{ token: string; ready: Promise<void>; resolve: () => void } | null>(null);
  const snaps = useRef(new Map<number, (bitmap: ImageBitmap | null) => void>());
  const snapId = useRef(0);
  const lastSnap = useRef<ImageBitmap | null>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!thumbToken || event.data?.token !== thumbToken || event.data?.type !== PREVIEW.HOST_SNAP || event.source !== thumbFrame.current?.contentWindow) return;
      const done = snaps.current.get(event.data.id);
      snaps.current.delete(event.data.id);
      done?.(event.data.bitmap || null);
    };
    window.addEventListener(RT_MAINTENANCE.MESSAGE, receive);
    return () => window.removeEventListener(RT_MAINTENANCE.MESSAGE, receive);
  }, [thumbToken]);
  useEffect(() => () => lastSnap.current?.close(), []);
  const thumbnail = useCallback(
    async (seconds: number): Promise<CanvasImageSource | null> => {
      const at = frameAt(seconds);
      const item = sceneAt(at);
      if (!item?.html) return null;
      const token = `${tokenOf(item)}-thumb`;
      if (thumbLoaded.current?.token !== token) {
        let resolve = () => {};
        const ready = new Promise<void>((done) => (resolve = done));
        thumbLoaded.current = { token, ready, resolve };
        setThumbScene(item);
      }
      await thumbLoaded.current.ready;
      if (thumbLoaded.current?.token !== token) return null;
      const id = ++snapId.current;
      const width = Math.min(spec.width, PREVIEW.THUMB_WIDTH);
      const bitmap = await new Promise<ImageBitmap | null>((resolve) => {
        snaps.current.set(id, resolve);
        thumbFrame.current?.contentWindow?.postMessage({ token, type: PREVIEW.HOST_SNAP, id, input: motionHtmlFrame(spec, item, at, width, Math.round((width * spec.height) / spec.width)) }, RT_MAINTENANCE.WILDCARD);
      });
      if (bitmap) {
        lastSnap.current?.close();
        lastSnap.current = bitmap;
      }
      return bitmap;
    },
    [frameAt, sceneAt, tokenOf, spec],
  );
  const subtitle = spec.subtitles.find((entry) => time >= entry.start && time < entry.end);
  const announce = useSinglePlayback(() => setPlaying(false));
  const chapters = useMemo(() => spec.scenes.map((item, index) => ({ start: item.startFrame / spec.fps, title: PREVIEW.CHAPTER_TITLE(index, item.text) })), [spec.scenes, spec.fps]);
  const [volume, setVolume] = useState(1),
    [muted, setMuted] = useState(false);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.volume = volume;
    audio.current.muted = muted;
  }, [volume, muted, audioUrl]);
  const toggle = () => {
    setPlaying((value) => {
      if (!value) announce();
      return !value;
    });
  };
  const seek = (value: number) => {
    resetBuffers();
    setTime(value);
    if (audio.current) audio.current.currentTime = value;
  };
  return (
    <div>
      <StudioPlayerFrame
        aspect={`${spec.width}${RT_MAINTENANCE.SLASH}${spec.height}`}
        className="w-full"
        playing={playing}
        time={time}
        duration={spec.duration}
        disabled={!!error}
        loading={playing && buffering}
        loadingIcon={MOTION_LOADING_GLYPH}
        badge={motionRatioLabel(spec.width, spec.height)}
        chapters={chapters}
        volume={volume}
        muted={muted}
        onVolume={
          audioUrl
            ? (value) => {
                setVolume(value);
                setMuted(value === 0);
              }
            : undefined
        }
        onMute={() => setMuted((value) => !value)}
        onToggle={toggle}
        onSeek={seek}
        thumbnail={thumbnail}>
        <div ref={viewport} className={cn(STUDIO_PLAYER.MEDIA, "bg-black")}>
          {slots.map((slot) => (
            <iframe
              key={slot.token}
              ref={(node) => {
                if (node) frames.current.set(slot.token, node);
                else frames.current.delete(slot.token);
              }}
              title={slot.scene.purpose || RT_MAINTENANCE.CANVAS_SCENE}
              sandbox={RT_MAINTENANCE.ALLOW_SCRIPTS}
              srcDoc={slot.source}
              onLoad={() => setLoaded((value) => new Set(value).add(slot.token))}
              className={cn("absolute inset-0 w-full h-full block border-0", slot.token === currentToken ? "visible" : "invisible")}
            />
          ))}
          {thumbSource && <iframe key={thumbToken} ref={thumbFrame} aria-hidden tabIndex={-1} sandbox={RT_MAINTENANCE.ALLOW_SCRIPTS} srcDoc={thumbSource} onLoad={() => thumbLoaded.current?.token === thumbToken && thumbLoaded.current.resolve()} className="absolute w-px h-px opacity-0 pointer-events-none" />}
          {!currentToken && scene && scene.renderer !== RT_MAINTENANCE.HTML_CANVAS ? (
            <Player ref={legacy} component={StoryComposition} inputProps={{ document: { ...spec, subtitles: [] } }} durationInFrames={totalFrames} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} style={{ width: RT_MAINTENANCE.VALUE_100, height: RT_MAINTENANCE.VALUE_100 }} />
          ) : !currentToken ? (
            <p>{RT_MAINTENANCE.DANG_DUNG_CANH}</p>
          ) : null}
          {subtitle && (
            <div
              style={{
                position: RT_MAINTENANCE.ABSOLUTE,
                left: RT_MAINTENANCE.VALUE_7,
                right: RT_MAINTENANCE.VALUE_7,
                bottom: RT_MAINTENANCE.VALUE_4,
                color: RT_MAINTENANCE.WHITE,
                textAlign: RT_MAINTENANCE.CENTER,
                font: `${RT_MAINTENANCE.BOLD}${(Math.max(20, spec.height * 0.04) * (displayWidth || spec.width)) / spec.width}${RT_MAINTENANCE.PX}${spec.fontFamily || RT_MAINTENANCE.ARIAL}`,
                lineHeight: 1.25,
                textShadow: RT_MAINTENANCE.VALUE_0_2PX_3PX_000_1PX_0_2PX_000_1PX_0,
                pointerEvents: RT_MAINTENANCE.NONE,
              }}>
              {subtitle.text}
            </div>
          )}
        </div>
      </StudioPlayerFrame>
      {audioUrl && <audio ref={audio} src={audioUrl} />}
      {error && (
        <p role={RT_MAINTENANCE.ALERT} className={STUDIO_PLAYER.ERROR}>
          {error}
        </p>
      )}
    </div>
  );
};
