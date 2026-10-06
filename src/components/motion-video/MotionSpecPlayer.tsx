import _ from "lodash";
import { Pause, Play, SkipBack } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { MOTION_TEXT_16_9, MOTION_TEXT_3D_3, MOTION_TEXT_AUTO, MOTION_TEXT_BUTTON, MOTION_TEXT_RANGE, MOTION_TEXT_REAL, MOTION_TEXT_SYMBOL_19, MOTION_TEXT_SYMBOL_24 } from "../../constants/motionRuntime.js";
import { cn } from "../../lib/utils";
import type { MotionSpec } from "../../types/motionVideo.js";
import { formatSeconds, type MotionEngineGlobal } from "./motionApi";
const PREVIEW_QUALITY = { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.6 };
const SIZE: Record<string, [number, number]> = { "16:9": [960, 540], "9:16": [405, 720], "1:1": [600, 600], "4:5": [540, 675] };
export const MotionSpecPlayer: FC<{ ME: MotionEngineGlobal; spec: MotionSpec | null; audioUrl?: string; className?: string }> = ({ ME, spec, audioUrl, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rendererRef = useRef<{ duration: number; drawFrame: (t: number) => void } | null>(null);
  const clock = useRef({ playing: false, base: 0, startedAt: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const aspect = _.toString(spec?.aspect || MOTION_TEXT_16_9);
  const [w, h] = SIZE[aspect] || SIZE[MOTION_TEXT_16_9];
  const shots = spec?.shots || [];
  const now = () => {
    const a = audioRef.current;
    if (a && audioUrl && !a.paused) return a.currentTime;
    const c = clock.current;
    return c.playing ? c.base + (performance.now() - c.startedAt) / 1000 : c.base;
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spec) {
      rendererRef.current = null;
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const REAL = (ME as any).REAL;
      if (spec.renderMode === MOTION_TEXT_REAL && REAL?.prepare) {
        setLoading(true);
        try {
          await REAL.prepare(spec);
        } catch {}
        setLoading(false);
        if (cancelled) return;
      }
      try {
        rendererRef.current = ME.createRenderer(canvas, spec, { width: w, height: h, quality: PREVIEW_QUALITY, preview: true });
        setDuration(rendererRef.current.duration);
        const t0 = now();
        rendererRef.current.drawFrame(t0 > 0 ? Math.min(t0, rendererRef.current.duration) : Math.min(1.2, rendererRef.current.duration * 0.5));
      } catch {
        rendererRef.current = null;
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ME, spec, w, h]);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const loop = () => {
      const r = rendererRef.current;
      if (r && clock.current.playing) {
        const t = now();
        if (t >= r.duration) {
          pause();
          clock.current.base = r.duration;
        } else if (Math.abs(t - last) > 0.001) {
          r.drawFrame(t);
          last = t;
          setTime(t);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [audioUrl]);
  const play = () => {
    const r = rendererRef.current;
    if (!r) return;
    const c = clock.current;
    if (c.base >= r.duration - 0.05) c.base = 0;
    c.playing = true;
    c.startedAt = performance.now();
    const a = audioRef.current;
    if (a && audioUrl) {
      a.currentTime = c.base;
      void a.play().catch(_.noop);
    }
    setPlaying(true);
  };
  const pause = () => {
    const c = clock.current;
    c.base = now();
    c.playing = false;
    audioRef.current?.pause();
    setPlaying(false);
  };
  const seek = (t: number) => {
    const r = rendererRef.current;
    const c = clock.current;
    c.base = _.clamp(t, 0, duration || 0);
    c.startedAt = performance.now();
    if (audioRef.current && audioUrl) audioRef.current.currentTime = c.base;
    setTime(c.base);
    r?.drawFrame(c.base);
  };
  const marks = useMemo(() => (duration ? _.map(shots, (s) => (s.start / duration) * 100) : []), [shots, duration]);
  return (
    <div className={cn("flex flex-col gap-2.5 w-full", className)}>
      <div className="relative w-full h-[340px] sm:h-[380px] md:h-[420px] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-md">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" style={{ aspectRatio: `${w} / ${h}` }} />
        {!spec && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-mono text-slate-400 select-none">
            <Play className="w-8 h-8 text-slate-600 dark:text-slate-700 stroke-1" />
            <span>{MOTION_TEXT_SYMBOL_19}</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-mono text-purple-400 gap-2 backdrop-blur-xs">
            <span className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            <span>{MOTION_TEXT_3D_3}</span>
          </div>
        )}
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload={MOTION_TEXT_AUTO} className="hidden" />}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-955/60 border border-slate-200/80 dark:border-slate-800/80">
        <button type={MOTION_TEXT_BUTTON} onClick={() => seek(0)} className="p-2 text-slate-500 hover:text-purple-400 dark:text-slate-400 dark:hover:text-purple-400 transition-colors cursor-pointer disabled:opacity-30" disabled={!spec}>
          <SkipBack className="w-4 h-4" />
        </button>
        <button type={MOTION_TEXT_BUTTON} onClick={() => (playing ? pause() : play())} className="p-2 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-30" disabled={!spec}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="relative flex-1 h-6 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
          {_.map(marks, (m, i) => (
            <div key={i} className="absolute h-3.5 w-px bg-slate-400 dark:bg-slate-600" style={{ left: `${m}%` }} />
          ))}
          <div className="absolute h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          <input type={MOTION_TEXT_RANGE} min={0} max={duration || 1} step={0.01} value={time} onChange={(e) => seek(_.toNumber(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" disabled={!spec} />
        </div>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 w-24 text-right">
          {formatSeconds(time)}
          {MOTION_TEXT_SYMBOL_24}
          {formatSeconds(duration)}
        </span>
      </div>
    </div>
  );
};
