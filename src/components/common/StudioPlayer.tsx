import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FC, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import _ from "lodash";
import { ChevronRight, Eye, Loader2, Maximize, Minimize, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { STUDIO_PLAYER as P, STUDIO_PLAYER_PLAY_EVENT, STUDIO_PLAYER_STEP_SECONDS, STUDIO_PLAYER_TEXT } from "../../constants/studioTheme.js";
import { cn } from "../../lib/utils.js";

const playerText = () => (document.documentElement.lang === "en" ? STUDIO_PLAYER_TEXT.en : STUDIO_PLAYER_TEXT.vi);
const stopClick = (event: MouseEvent) => event.stopPropagation();
/** YouTube-style clock: 3:09, 11:07, 1:02:05. */
const clock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

export interface StudioPlayerChapter {
  /** Start in seconds. */
  start: number;
  title?: string;
}

interface StudioPlayerFrameProps {
  /** CSS aspect-ratio such as "16/9"; leave out when the className already sizes the frame. */
  aspect?: string;
  className?: string;
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
  /** Hide the play controls on the picture (e.g. while the scene is in interactive mode). */
  hidePlay?: boolean;
  loading?: boolean;
  badge?: ReactNode;
  badgeIcon?: LucideIcon;
  /** Scenes / chapters: the seek bar is split at each start, Back / Next jump between them, the pill shows the current title. */
  chapters?: StudioPlayerChapter[];
  /** Back / Next move to another video (lists); without them they jump between chapters or by a few seconds. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Volume 0–1; the volume control shows only when onVolume is given. */
  volume?: number;
  muted?: boolean;
  onVolume?: (volume: number) => void;
  onMute?: () => void;
  /** Extra controls shown before the fullscreen button. */
  actions?: ReactNode;
  children: ReactNode;
}

/** The one video player used by every screen, with YouTube-style controls. */
export const StudioPlayerFrame: FC<StudioPlayerFrameProps> = ({ aspect, className, playing, time, duration, onToggle, onSeek, disabled, hidePlay, loading, badge, badgeIcon: BadgeIcon = Eye, chapters, onPrev, onNext, volume = 1, muted, onVolume, onMute, actions, children }) => {
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const text = playerText();
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const parts = useMemo(() => {
    const starts = _.uniq([0, ...(chapters ?? []).map((c) => c.start).filter((s) => s > 0 && s < duration)]).sort((x, y) => x - y);
    return starts.map((start, i) => ({ start, end: starts[i + 1] ?? duration, title: chapters?.find((c) => Math.abs(c.start - start) < 0.01)?.title ?? (i === 0 ? chapters?.find((c) => c.start <= 0)?.title : undefined) }));
  }, [chapters, duration]);
  const stops = parts.slice(1).map((part) => part.start);
  const current = _.findLast(parts, (part) => time >= part.start - 0.01);
  const timeAt = (clientX: number): number => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || !duration) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
  };
  const noMedia = disabled || !duration;
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (noMedia) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    onSeek(timeAt(event.clientX));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const at = timeAt(event.clientX);
    setHover(at);
    if (dragging) onSeek(at);
  };
  const back = () => {
    if (onPrev) return onPrev();
    // Within the first second of a chapter, Back goes to the chapter before it.
    const previous = [...stops].reverse().find((m) => m < time - 1);
    onSeek(stops.length ? (previous ?? 0) : Math.max(0, time - STUDIO_PLAYER_STEP_SECONDS));
  };
  const next = () => {
    if (onNext) return onNext();
    const following = stops.find((m) => m > time + 0.05);
    if (stops.length) {
      if (following !== undefined) onSeek(following);
      return;
    }
    onSeek(Math.min(duration, time + STUDIO_PLAYER_STEP_SECONDS));
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen().catch(() => undefined);
  };
  const percent = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const style: CSSProperties | undefined = aspect ? { aspectRatio: aspect } : undefined;
  const shown = !playing || dragging ? "opacity-100" : "opacity-0 group-hover/video:opacity-100 focus-within:opacity-100";
  const hoverTitle = hover !== null ? _.findLast(parts, (part) => hover >= part.start)?.title : undefined;
  const silent = muted || volume === 0;
  return (
    <div ref={frame} className={cn(P.FRAME, className ?? "w-full")} style={style}>
      {children}
      {!hidePlay && <div className={P.SURFACE} onClick={disabled ? undefined : onToggle} onDoubleClick={toggleFullscreen} />}
      {!hidePlay && !loading && !playing && (
        <div className={P.BIG_PLAY}>
          <Play className={P.BIG_PLAY_ICON} />
        </div>
      )}
      {badge ? (
        <div className={P.BADGE}>
          <BadgeIcon className={P.BADGE_ICON} />
          <span className="truncate">{badge}</span>
        </div>
      ) : null}
      {loading && (
        <div className={P.LOADING}>
          <Loader2 className={P.LOADING_ICON} />
        </div>
      )}
      <div className={cn(P.BAR, shown)} onClick={stopClick}>
        <div
          ref={track}
          className={cn(P.TRACK, noMedia && P.TRACK_DISABLED)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onPointerLeave={() => setHover(null)}>
          <div className={P.SEGMENTS}>
            {parts.map((part) => {
              const span = Math.max(part.end - part.start, 0.001);
              const fill = Math.max(0, Math.min(1, (time - part.start) / span)) * 100;
              const ahead = hover === null ? 0 : Math.max(0, Math.min(1, (hover - part.start) / span)) * 100;
              return (
                <div key={part.start} className={P.SEGMENT} style={{ flexGrow: span, flexBasis: 0 }}>
                  <div className={P.SEGMENT_HOVER} style={{ width: `${ahead}%` }} />
                  <div className={P.SEGMENT_FILL} style={{ width: `${fill}%` }} />
                </div>
              );
            })}
          </div>
          <div className={cn(P.THUMB, playing && !dragging ? "scale-0 group-hover/video:scale-100" : "scale-100")} style={{ left: `${percent}%` }} />
          {hover !== null && duration > 0 && (
            <div className={P.HOVER_TIP} style={{ left: `${(hover / duration) * 100}%` }}>
              {hoverTitle ? `${hoverTitle} · ${clock(hover)}` : clock(hover)}
            </div>
          )}
        </div>
        <div className={P.CONTROLS}>
          <div className={P.GROUP}>
            <button type="button" className={P.CTRL} onClick={back} disabled={!onPrev && noMedia} title={text.BACK} aria-label={text.BACK}>
              <SkipBack className={P.CTRL_ICON_FILL} />
            </button>
            <button type="button" className={P.CTRL} onClick={onToggle} disabled={disabled} title={playing ? text.PAUSE : text.PLAY} aria-label={playing ? text.PAUSE : text.PLAY}>
              {playing ? <Pause className={P.CTRL_ICON_FILL} /> : <Play className={P.CTRL_ICON_FILL} />}
            </button>
            <button type="button" className={P.CTRL} onClick={next} disabled={!onNext && noMedia} title={text.NEXT} aria-label={text.NEXT}>
              <SkipForward className={P.CTRL_ICON_FILL} />
            </button>
            {onVolume && (
              <div className={P.VOLUME}>
                <button type="button" className={P.CTRL} onClick={onMute} title={silent ? text.UNMUTE : text.MUTE} aria-label={silent ? text.UNMUTE : text.MUTE}>
                  {silent ? <VolumeX className={P.CTRL_ICON} /> : volume < 0.5 ? <Volume1 className={P.CTRL_ICON} /> : <Volume2 className={P.CTRL_ICON} />}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={silent ? 0 : volume} onChange={(event) => onVolume(Number(event.target.value))} className={P.VOLUME_SLIDER} style={{ "--studio-volume": `${(silent ? 0 : volume) * 100}%` } as CSSProperties} aria-label={text.VOLUME} />
              </div>
            )}
            <span className={P.PILL}>
              {clock(time)} / {clock(duration)}
            </span>
            {current?.title && (
              <button type="button" className={P.CHAPTER} onClick={next} title={current.title}>
                <span className={P.CHAPTER_TEXT}>{current.title}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
          <div className={P.GROUP}>
            {actions}
            <button type="button" className={P.CTRL} onClick={toggleFullscreen} title={fullscreen ? text.EXIT_FULLSCREEN : text.FULLSCREEN} aria-label={fullscreen ? text.EXIT_FULLSCREEN : text.FULLSCREEN}>
              {fullscreen ? <Minimize className={P.CTRL_ICON} /> : <Maximize className={P.CTRL_ICON} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Pauses this player whenever another player in the app starts. */
export const useSinglePlayback = (pause: () => void): (() => void) => {
  const id = useId();
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const onPlay = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) pauseRef.current();
    };
    window.addEventListener(STUDIO_PLAYER_PLAY_EVENT, onPlay);
    return () => window.removeEventListener(STUDIO_PLAYER_PLAY_EVENT, onPlay);
  }, [id]);
  return () => window.dispatchEvent(new CustomEvent(STUDIO_PLAYER_PLAY_EVENT, { detail: id }));
};

interface StudioVideoPlayerProps {
  src: string;
  poster?: string;
  aspect?: string;
  className?: string;
  fit?: "contain" | "cover";
  badge?: ReactNode;
  badgeIcon?: LucideIcon;
  autoPlay?: boolean;
  loop?: boolean;
  chapters?: StudioPlayerChapter[];
  onPrev?: () => void;
  onNext?: () => void;
  onError?: () => void;
}

/** A video file in the shared player. */
export const StudioVideoPlayer: FC<StudioVideoPlayerProps> = ({ src, poster, aspect, className, fit = "contain", badge, badgeIcon, autoPlay = false, loop = false, chapters, onPrev, onNext, onError }) => {
  const video = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const announce = useSinglePlayback(() => video.current?.pause());
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setReady(false);
    if (autoPlay) video.current?.play().catch(() => setPlaying(false));
  }, [src, autoPlay]);
  const toggle = () => {
    const node = video.current;
    if (!node) return;
    if (node.paused) node.play().catch(() => setPlaying(false));
    else node.pause();
  };
  return (
    <StudioPlayerFrame
      aspect={aspect}
      className={className}
      playing={playing}
      time={time}
      duration={duration}
      loading={!ready && !poster}
      badge={badge}
      badgeIcon={badgeIcon}
      chapters={chapters}
      volume={volume}
      muted={muted}
      onVolume={(value) => {
        setVolume(value);
        setMuted(value === 0);
        if (video.current) {
          video.current.volume = value;
          video.current.muted = value === 0;
        }
      }}
      onMute={() => {
        const next = !muted;
        setMuted(next);
        if (video.current) video.current.muted = next;
      }}
      onPrev={onPrev}
      onNext={onNext}
      onToggle={toggle}
      onSeek={(seconds) => {
        if (video.current) video.current.currentTime = seconds;
        setTime(seconds);
      }}>
      <video
        ref={video}
        src={src}
        poster={poster}
        preload="metadata"
        loop={loop}
        playsInline
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onLoadedData={() => setReady(true)}
        onError={() => {
          setReady(true);
          onError?.();
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime || 0)}
        onPlay={() => {
          setPlaying(true);
          announce();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className={cn(P.VIDEO, fit === "cover" ? P.FIT_COVER : P.FIT_CONTAIN)}
      />
    </StudioPlayerFrame>
  );
};
