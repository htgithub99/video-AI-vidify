import _ from "lodash";
import { Pause, Play, SkipBack } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { MOTION_TEXT_16_9, MOTION_TEXT_3D_3, MOTION_TEXT_AUTO, MOTION_TEXT_BUTTON, MOTION_TEXT_RANGE, MOTION_TEXT_SYMBOL_19, MOTION_TEXT_SYMBOL_24 } from "../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../../constants/motionStyles.js";
import { MOTION_PREVIEW_QUALITY, MOTION_PREVIEW_SIZES } from "../../constants/motionVideo.js";
import { cn } from "../../lib/utils";
import type { MotionSpec } from "../../types/motionVideo.js";
import { MotionAspect } from "../../types/motionVideo.js";
import { formatSeconds, MOTION_ASSET_BASE, type MotionEngineGlobal } from "./motionApi";
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
  const [w, h] = MOTION_PREVIEW_SIZES[aspect] || MOTION_PREVIEW_SIZES[MotionAspect.LANDSCAPE];
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
      if (ME.GEN?.prepare) {
        setLoading(true);
        try {
          await ME.GEN.prepare(spec, MOTION_ASSET_BASE);
        } catch {}
        setLoading(false);
        if (cancelled) return;
      }
      try {
        rendererRef.current = ME.createRenderer(canvas, spec, { width: w, height: h, quality: MOTION_PREVIEW_QUALITY, preview: true });
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
    <div className={cn(MOTION_STYLES.FLEX_FLEX_COL_GAP_2_5_W_FULL, className)}>
      <div className={MOTION_STYLES.RELATIVE_W_FULL_H_340PX_SM_H_380PX_MD_H_420PX_FLEX_ITEMS_CENTER}>
        <canvas ref={canvasRef} className={MOTION_STYLES.MAX_W_FULL_MAX_H_FULL_OBJECT_CONTAIN} style={{ aspectRatio: `${w} / ${h}` }} />
        {!spec && (
          <div className={MOTION_STYLES.ABSOLUTE_INSET_0_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
            <Play className={MOTION_STYLES.W_8_H_8_TEXT_SLATE_600_DARK_TEXT_SLATE_700_STROKE_1} />
            <span>{MOTION_TEXT_SYMBOL_19}</span>
          </div>
        )}
        {loading && (
          <div className={MOTION_STYLES.ABSOLUTE_INSET_0_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_BG_BLACK_60_TEXT_XS}>
            <span className={MOTION_STYLES.W_4_H_4_ROUNDED_FULL_BORDER_2_BORDER_PURPLE_400_BORDER_T_TRANSPARENT_ANIMATE_SPIN} />
            <span>{MOTION_TEXT_3D_3}</span>
          </div>
        )}
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload={MOTION_TEXT_AUTO} className={MOTION_STYLES.HIDDEN} />}
      <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_P_2_ROUNDED_XL_BG_SLATE_50_DARK_BG_SLATE_955_60}>
        <button type={MOTION_TEXT_BUTTON} onClick={() => seek(0)} className={MOTION_STYLES.P_2_TEXT_SLATE_500_HOVER_TEXT_PURPLE_400_DARK_TEXT_SLATE_400_DARK_HOVER_TEXT_PURPLE_400_TRANSITION_COLORS_CURSOR_POINTER} disabled={!spec}>
          <SkipBack className={MOTION_STYLES.W_4_H_4} />
        </button>
        <button type={MOTION_TEXT_BUTTON} onClick={() => (playing ? pause() : play())} className={MOTION_STYLES.P_2_TEXT_PURPLE_400_HOVER_TEXT_PURPLE_300_TRANSITION_COLORS_CURSOR_POINTER_DISABLED_OPACITY_30} disabled={!spec}>
          {playing ? <Pause className={MOTION_STYLES.W_4_H_4} /> : <Play className={MOTION_STYLES.W_4_H_4} />}
        </button>
        <div className={MOTION_STYLES.RELATIVE_FLEX_1_H_6_FLEX_ITEMS_CENTER}>
          <div className={MOTION_STYLES.ABSOLUTE_INSET_X_0_H_2_ROUNDED_FULL_BG_SLATE_200_DARK_BG_SLATE_800} />
          {_.map(marks, (m, i) => (
            <div key={i} className={MOTION_STYLES.ABSOLUTE_H_3_5_W_PX_BG_SLATE_400_DARK_BG_SLATE_600} style={{ left: `${m}%` }} />
          ))}
          <div className={MOTION_STYLES.ABSOLUTE_H_2_ROUNDED_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_TO_PINK_500} style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          <input type={MOTION_TEXT_RANGE} min={0} max={duration || 1} step={0.01} value={time} onChange={(e) => seek(_.toNumber(e.target.value))} className={MOTION_STYLES.ABSOLUTE_INSET_0_W_FULL_OPACITY_0_CURSOR_POINTER} disabled={!spec} />
        </div>
        <span className={MOTION_STYLES.TEXT_11PX_FONT_MONO_TEXT_SLATE_600_DARK_TEXT_SLATE_400_W_24_TEXT_RIGHT}>
          {formatSeconds(time)}
          {MOTION_TEXT_SYMBOL_24}
          {formatSeconds(duration)}
        </span>
      </div>
    </div>
  );
};
