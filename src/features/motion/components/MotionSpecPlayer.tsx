import * as MR from "../../../constants/motionRuntime.js";
import _ from "lodash";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { MOTION_TEXT_16_9, MOTION_TEXT_AUTO } from "../../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { MOTION_PREVIEW_QUALITY, MOTION_PREVIEW_SIZES } from "../../../constants/motionVideo.js";
import { cn } from "../../../lib/utils";
import { StudioPlayerFrame, StudioVideoPlayer, useSinglePlayback } from "../../../components/common/StudioPlayer.js";
import { STUDIO_PLAYER } from "../../../constants/studioTheme.js";
import type { MotionSpec } from "../../../types/motionVideo.js";
import { MotionAspect } from "../../../types/motionVideo.js";
import { type MotionEngineGlobal } from "./motionApi";
import { MOTION_VOICE, MOTION_VOICE_TEXT } from "../../../constants/motionVoice.js";
import { MOTION_LOADING_GLYPH } from "./MotionControls.js";
export const MotionSpecPlayer: FC<{ ME: MotionEngineGlobal; spec: MotionSpec | null; videoUrl?: string; audioUrl?: string; audioPending?: boolean; pending?: boolean; className?: string }> = ({ ME, spec, videoUrl, audioUrl, audioPending, pending = false, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rendererRef = useRef<{ duration: number; drawFrame: (t: number) => void } | null>(null);
  const clock = useRef({ playing: false, base: 0, startedAt: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [prepared, setPrepared] = useState<{ ME: MotionEngineGlobal; spec: MotionSpec } | null>(null);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string>();
  const [error, setError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const loading = pending || (!videoUrl && ((!!spec && (prepared?.ME !== ME || prepared?.spec !== spec)) || (!!audioUrl && loadedAudioUrl !== audioUrl)));
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
    setLoadedAudioUrl(undefined);
  }, [audioUrl, videoUrl]);
  useEffect(() => {
    const current = clock.current;
    if (current.playing) current.base += (performance.now() - current.startedAt) / 1000;
    current.playing = false;
    audioRef.current?.pause();
    setPlaying(false);
  }, [audioUrl, audioPending]);
  useEffect(() => {
    const canvas = canvasRef.current;
    clock.current = { playing: false, base: 0, startedAt: 0 };
    audioRef.current?.pause();
    setPlaying(false);
    rendererRef.current = null;
    setDuration(0);
    setTime(0);
    setPrepared(null);
    setError(MR.MOTION_TEXT_EMPTY);
    if (!canvas || !spec || pending || videoUrl) return;
    let cancelled = false;
    let frame = 0;
    const t = setTimeout(async () => {
      try {
        if (cancelled) return;
        const renderer = ME.createRenderer(canvas, spec, { width: w, height: h, quality: MOTION_PREVIEW_QUALITY, preview: true });
        renderer.drawFrame(0);
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (cancelled) return;
            rendererRef.current = renderer;
            setDuration(renderer.duration);
            setPrepared({ ME, spec });
          });
        });
      } catch {
        if (cancelled) return;
        rendererRef.current = null;
        setError(MOTION_VOICE.PREVIEW_FAILED);
        setPrepared({ ME, spec });
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
      cancelAnimationFrame(frame);
    };
  }, [ME, spec, w, h, pending, videoUrl]);
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
    if (!r || audioPending || loading) return;
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
    if (loading || !rendererRef.current) return;
    const r = rendererRef.current;
    const c = clock.current;
    c.base = _.clamp(t, 0, duration || 0);
    c.startedAt = performance.now();
    if (audioRef.current && audioUrl) audioRef.current.currentTime = c.base;
    setTime(c.base);
    r?.drawFrame(c.base);
  };
  const chapters = useMemo(() => _.map(shots, (s) => ({ start: s.start })), [shots]);
  const visibility = loading ? MR.MOTION_TEXT_HIDDEN : MR.MOTION_TEXT_VISIBLE;
  const controlsDisabled = !spec || !duration || loading;
  const announce = useSinglePlayback(() => pause());
  if (videoUrl) return <StudioVideoPlayer key={videoUrl} src={videoUrl} aspect={MR.MOTION_TEMPLATE_SYMBOL_47(w, h)} className={className} loadingIcon={MOTION_LOADING_GLYPH} onError={() => setError(MOTION_VOICE.PREVIEW_FAILED)} />;
  return (
    <div className={cn(MOTION_STYLES.FLEX_FLEX_COL_GAP_2_5_W_FULL, className)} aria-busy={loading}>
      <StudioPlayerFrame
        aspect={MR.MOTION_TEMPLATE_SYMBOL_47(w, h)}
        className="w-full"
        playing={playing}
        time={time}
        duration={duration}
        disabled={controlsDisabled || audioPending}
        loading={loading}
        loadingIcon={MOTION_LOADING_GLYPH}
        chapters={chapters}
        onToggle={() => {
          if (playing) return pause();
          announce();
          void play();
        }}
        onSeek={seek}>
        <canvas ref={canvasRef} className={STUDIO_PLAYER.MEDIA} style={{ visibility }} />
      </StudioPlayerFrame>
      {audioUrl && (
        <audio
          key={audioUrl}
          ref={audioRef}
          src={audioUrl}
          preload={MOTION_TEXT_AUTO}
          className={MOTION_STYLES.HIDDEN}
          onLoadedData={() => setLoadedAudioUrl(audioUrl)}
          onError={() => {
            setLoadedAudioUrl(audioUrl);
            setError(MOTION_VOICE_TEXT.vi.previewError);
          }}
        />
      )}
      {error ? (
        <p role={MR.MOTION_TEXT_ALERT} className={STUDIO_PLAYER.ERROR}>
          {error}
        </p>
      ) : null}
    </div>
  );
};
