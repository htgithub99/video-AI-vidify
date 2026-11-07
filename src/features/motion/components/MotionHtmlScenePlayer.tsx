import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { StoryComposition } from "../remotion/StoryComposition.js";
import { motionHtmlHostDocument } from "../../../lib/motionHtmlHost.js";
import { motionHtmlFrame } from "../../../lib/motionHtmlScene.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";

export const MotionHtmlScenePlayer = ({ spec, audioUrl }: { spec: MotionRemotionSpec; audioUrl?: string }) => {
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false), [error, setError] = useState("");
  const [interactive, setInteractive] = useState(false), [displayWidth, setDisplayWidth] = useState(spec.width);
  const viewport = useRef<HTMLDivElement>(null), legacy = useRef<PlayerRef>(null);
  const frame = Math.min(Math.ceil(spec.duration * spec.fps) - 1, Math.floor(time * spec.fps));
  const scene = spec.scenes.find((item) => frame >= item.startFrame && frame < item.endFrame);
  const iframe = useRef<HTMLIFrameElement>(null), audio = useRef<HTMLAudioElement>(null), current = useRef<ReturnType<typeof motionHtmlFrame>>();
  const token = useMemo(() => `motion-${Math.random().toString(36).slice(2)}`, [scene?.id, scene?.html?.hash]);
  const source = useMemo(() => scene?.html ? motionHtmlHostDocument(scene.html.html, token) : "", [scene?.html?.hash, token]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); setError(""); setInteractive(false); }, [source]);
  useEffect(() => { const node = viewport.current; if (!node) return; const observer = new ResizeObserver(() => setDisplayWidth(node.clientWidth)); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => { legacy.current?.seekTo(frame); }, [frame, scene?.id]);
  useEffect(() => { if (loaded) iframe.current?.contentWindow?.postMessage({ type: "motion-host-interaction", token, enabled: interactive }, "*"); }, [interactive, loaded, token]);
  useEffect(() => {
    if (!scene) return;
    current.current = motionHtmlFrame(spec, scene, frame);
    if (loaded && !interactive) iframe.current?.contentWindow?.postMessage({ type: "motion-host-render", token, input: current.current }, "*");
  }, [frame, spec, scene, loaded, token, interactive]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.token !== token) return;
      if (event.data.error) { setError(event.data.error); setPlaying(false); window.dispatchEvent(new CustomEvent("motion-html-execution-error", { detail: { sceneId: scene?.id, hash: scene?.html?.hash, error: event.data.error } })); }
    };
    window.addEventListener("message", receive); return () => window.removeEventListener("message", receive);
  }, [token, scene?.id, scene?.html?.hash]);
  useEffect(() => {
    if (!playing) { audio.current?.pause(); return; }
    if (audio.current) { audio.current.currentTime = time; void audio.current.play().catch(() => setPlaying(false)); }
    let last = performance.now(), request = 0;
    const tick = (now: number) => {
      const delta = (now - last) / 1000; last = now;
      setTime((value) => {
        const next = audio.current && !audio.current.paused ? audio.current.currentTime : value + delta;
        if (next >= spec.duration) { setPlaying(false); return 0; }
        return next;
      });
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick); return () => cancelAnimationFrame(request);
    // The playback clock starts at the current seek point, not on every frame update.
  }, [playing, spec.duration]);
  const subtitle = spec.subtitles.find((entry) => time >= entry.start && time < entry.end);
  return <div>
    <div ref={viewport} style={{ position: "relative", aspectRatio: `${spec.width}/${spec.height}`, background: "#fff", overflow: "hidden" }}>
      {source ? <iframe ref={iframe} title={scene?.purpose || "Canvas scene"} sandbox="allow-scripts" srcDoc={source} onLoad={() => setLoaded(true)} style={{ border: 0, width: "100%", height: "100%" }} /> : scene && scene.renderer !== "html-canvas" ? <Player ref={legacy} component={StoryComposition} inputProps={{ document: { ...spec, subtitles: [] } }} durationInFrames={Math.ceil(spec.duration * spec.fps)} compositionWidth={spec.width} compositionHeight={spec.height} fps={spec.fps} style={{ width: "100%", height: "100%" }} /> : <p>Đang dựng cảnh…</p>}
      {subtitle && !interactive && <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "4%", color: "white", textAlign: "center", font: `bold ${Math.max(20, spec.height * .04) * displayWidth / spec.width}px ${spec.fontFamily || "Arial"}`, lineHeight: 1.25, textShadow: "0 2px 3px #000,1px 0 2px #000,-1px 0 2px #000", pointerEvents: "none" }}>{subtitle.text}</div>}
    </div>
    {audioUrl && <audio ref={audio} src={audioUrl} />}
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 8 }}>
      <button type="button" onClick={() => { setInteractive(false); setPlaying((value) => !value); }} disabled={!!error}>{playing ? "⏸" : "▶"}</button>
      <input aria-label="Video timeline" type="range" min={0} max={spec.duration} step={1 / spec.fps} value={time} style={{ flex: 1 }} onChange={(event) => { setInteractive(false); const value = Number(event.target.value); setTime(value); if (audio.current) audio.current.currentTime = value; }} />
      <span>{time.toFixed(1)} / {spec.duration.toFixed(1)}s</span>
      {source && <button type="button" aria-pressed={interactive} onClick={() => { setPlaying(false); setInteractive((value) => !value); }}>{interactive ? "Về video" : "Thử tương tác"}</button>}
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
};
