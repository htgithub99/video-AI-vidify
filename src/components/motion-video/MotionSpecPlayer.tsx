import * as MR from "../../constants/motionRuntime.js";
import _ from "lodash";
import { Pause, Play, SkipBack } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { MOTION_TEXT_16_9, MOTION_TEXT_AUTO, MOTION_TEXT_RANGE, MOTION_TEXT_SYMBOL_19, MOTION_TEXT_SYMBOL_24 } from "../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../../constants/motionStyles.js";
import { MOTION_PREVIEW_QUALITY, MOTION_PREVIEW_SIZES } from "../../constants/motionVideo.js";
import { cn } from "../../lib/utils";
import type { MotionSpec } from "../../types/motionVideo.js";
import { MotionAspect } from "../../types/motionVideo.js";
import { Button } from "../ui/Button";
import { formatSeconds, MOTION_ASSET_BASE, type MotionEngineGlobal } from "./motionApi";
import { MotionLoadingIcon } from "./MotionControls.js";
import { MOTION_VOICE, MOTION_VOICE_TEXT } from "../../constants/motionVoice.js";
export const MotionSpecPlayer: FC<{ ME: MotionEngineGlobal; spec: MotionSpec | null; audioUrl?: string; audioPending?: boolean; className?: string }> = ({ ME, spec, audioUrl, audioPending, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rendererRef = useRef<{ duration: number; drawFrame: (t: number) => void } | null>(null);
  const clock = useRef({ playing: false, base: 0, startedAt: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(MR.MOTION_TEXT_EMPTY);
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
    const current = clock.current;
    if (current.playing) current.base += (performance.now() - current.startedAt) / 1000;
    current.playing = false;
    audioRef.current?.pause();
    setPlaying(false);
  }, [audioUrl, audioPending]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spec) {
      rendererRef.current = null;
      setDuration(0);
      setTime(0);
      clock.current = { playing: false, base: 0, startedAt: 0 };
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    let cancelled = false;
    rendererRef.current = null;
    setDuration(0);
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
        setError(MR.MOTION_TEXT_EMPTY);
        rendererRef.current = ME.createRenderer(canvas, spec, { width: w, height: h, quality: MOTION_PREVIEW_QUALITY, preview: true });
        setDuration(rendererRef.current.duration);
        clock.current.base = Math.min(clock.current.base, rendererRef.current.duration);
        const t0 = now();
        rendererRef.current.drawFrame(Math.min(t0, rendererRef.current.duration));
      } catch {
        rendererRef.current = null;
        setError(MOTION_VOICE.PREVIEW_FAILED);
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
          setTime(r.duration);
          r.drawFrame(r.duration);
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
  const play = async () => {
    const r = rendererRef.current;
    if (!r || audioPending) return;
    const c = clock.current;
    if (c.base >= r.duration - 0.05) c.base = 0;
    const a = audioRef.current;
    if (a && audioUrl) {
      a.currentTime = c.base;
      try {
        await a.play();
      } catch {
        setError(MOTION_VOICE_TEXT.vi.previewError);
        return;
      }
    }
    c.playing = true;
    c.startedAt = performance.now();
    setError(MR.MOTION_TEXT_EMPTY);
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
        <canvas ref={canvasRef} className={MOTION_STYLES.MAX_W_FULL_MAX_H_FULL_OBJECT_CONTAIN} style={{ aspectRatio: MR.MOTION_TEMPLATE_SYMBOL_47(w, h) }} />
        {!spec && (
          <div className={MOTION_STYLES.ABSOLUTE_INSET_0_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
            <Play className={MOTION_STYLES.W_8_H_8_TEXT_SLATE_600_DARK_TEXT_SLATE_700_STROKE_1} />
            <span>{MOTION_TEXT_SYMBOL_19}</span>
          </div>
        )}
        {loading && (
          <div className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_BG_BLACK_75_BAC}>
            <div className={MR.MOTION_TEXT_PX_6_PY_5_ROUNDED_2XL_BG_SLATE_900_90_BORDER_BORDER_PURPLE_500_40}>
              <div className={MR.MOTION_TEXT_RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                <div className={MR.MOTION_TEXT_W_12_H_12_ROUNDED_2XL_BG_GRADIENT_TO_TR_FROM_PURPLE_600_30_VIA_FU}>
                  <MotionLoadingIcon className={MR.MOTION_TEXT_W_6_H_6_ANIMATE_SPIN_TEXT_PURPLE_400_SHRINK_0} />
                </div>
              </div>
              <div className={MR.MOTION_TEXT_SPACE_Y_1}>
                <p className={MR.MOTION_TEXT_TEXT_XS_FONT_EXTRABOLD_TEXT_SLATE_100_TRACKING_TIGHT}>{MR.MOTION_TEXT_DANG_TAI_KHONG_GIAN_3D}</p>
                <p className={MR.MOTION_TEXT_TEXT_10PX_TEXT_PURPLE_300_80_FONT_MEDIUM}>{MR.MOTION_TEXT_CHUAN_BI_WEBGL_ENGINE_SHADER}</p>
              </div>
              <div className={MR.MOTION_TEXT_W_36_H_1_ROUNDED_FULL_BG_SLATE_800_OVERFLOW_HIDDEN}>
                <div className={MR.MOTION_TEXT_H_FULL_ROUNDED_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA_FUCHSIA_} />
              </div>
            </div>
          </div>
        )}
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload={MOTION_TEXT_AUTO} className={MOTION_STYLES.HIDDEN} onError={() => setError(MOTION_VOICE_TEXT.vi.previewError)} />}
      {error ? <p role={MR.MOTION_TEXT_ALERT}>{error}</p> : null}
      <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_P_2_ROUNDED_XL_BG_SLATE_50_DARK_BG_SLATE_955_60}>
        <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => seek(0)} className={MOTION_STYLES.P_2_TEXT_SLATE_500_HOVER_TEXT_PURPLE_400_DARK_TEXT_SLATE_400_DARK_HOVER_TEXT_PURPLE_400_TRANSITION_COLORS_CURSOR_POINTER} disabled={!spec}>
          <SkipBack className={MOTION_STYLES.W_4_H_4} />
        </Button>
        <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => (playing ? pause() : void play())} className={MOTION_STYLES.P_2_TEXT_PURPLE_400_HOVER_TEXT_PURPLE_300_TRANSITION_COLORS_CURSOR_POINTER_DISABLED_OPACITY_30} disabled={!spec || !duration || audioPending || loading}>
          {playing ? <Pause className={MOTION_STYLES.W_4_H_4} /> : <Play className={MOTION_STYLES.W_4_H_4} />}
        </Button>
        <div className={MOTION_STYLES.RELATIVE_FLEX_1_H_6_FLEX_ITEMS_CENTER}>
          <div className={MOTION_STYLES.ABSOLUTE_INSET_X_0_H_2_ROUNDED_FULL_BG_SLATE_200_DARK_BG_SLATE_800} />
          {_.map(marks, (m, i) => (
            <div key={i} className={MOTION_STYLES.ABSOLUTE_H_3_5_W_PX_BG_SLATE_400_DARK_BG_SLATE_600} style={{ left: MR.MOTION_TEMPLATE_SYMBOL_48(m) }} />
          ))}
          <div className={MOTION_STYLES.ABSOLUTE_H_2_ROUNDED_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_TO_PINK_500} style={{ width: MR.MOTION_TEMPLATE_SYMBOL_48(duration ? (time / duration) * 100 : 0) }} />
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
