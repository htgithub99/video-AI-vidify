import { StudioCard, StudioInput } from "../ui/Studio.js";
import {
  VIDEO_EXPORT_TEMPLATE_SYMBOL,
  VIDEO_EXPORT_TEXT_ASPECTRATIO,
  VIDEO_EXPORT_TEXT_BASIC,
  VIDEO_EXPORT_TEXT_BITRATE,
  VIDEO_EXPORT_TEXT_BUTTON,
  VIDEO_EXPORT_TEXT_CAPCUT_HOT,
  VIDEO_EXPORT_TEXT_CINEMA,
  VIDEO_EXPORT_TEXT_CODEC,
  VIDEO_EXPORT_TEXT_EFFECT,
  VIDEO_EXPORT_TEXT_FADE,
  VIDEO_EXPORT_TEXT_FPS,
  VIDEO_EXPORT_TEXT_MOTION,
  VIDEO_EXPORT_TEXT_PAN,
  VIDEO_EXPORT_TEXT_REFRAMEMODE,
  VIDEO_EXPORT_TEXT_RESOLUTION,
  VIDEO_EXPORT_TEXT_SHAPE,
  VIDEO_EXPORT_TEXT_SLIDE,
  VIDEO_EXPORT_TEXT_SPECIAL,
  VIDEO_EXPORT_TEXT_SYMBOL,
  VIDEO_EXPORT_TEXT_SYMBOL_2,
  VIDEO_EXPORT_TEXT_TEXT,
  VIDEO_EXPORT_TEXT_TRANSITION,
  VIDEO_EXPORT_TEXT_TRANSITIONSECONDS,
  VIDEO_EXPORT_TEXT_UNSTYLED,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_START,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_STOP,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TITLE,
  VIDEO_EXPORT_TEXT_ZOOM,
} from "../../constants/videoExportText";
import { FC, useMemo } from "react";
import _ from "lodash";
import {
  Aperture,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Ban,
  Blend,
  Circle,
  CircleDot,
  Clapperboard,
  Clock,
  Columns2,
  Contrast,
  Crop,
  Crosshair,
  Disc3,
  Droplets,
  Film,
  Flame,
  Focus,
  FoldHorizontal,
  Grid3x3,
  Heart,
  HeartPulse,
  ImageIcon,
  Layers,
  Maximize,
  Moon,
  MoveLeft,
  MoveRight,
  Orbit,
  PanelLeft,
  PanelRight,
  PartyPopper,
  RotateCw,
  Rows3,
  Shuffle,
  Slash,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Sun,
  Tv,
  Vibrate,
  Waves,
  Wind,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { formatCleanTime } from "../../lib/timeUtils.js";
import { VideoExporterState } from "../../hooks/useVideoExporter.js";
import { VIDEO_EXPORT_CONSTANTS } from "../../constants/videoExport.js";
import { ShortsReframeMode } from "../../types/shorts.js";
import { VideoExportAspectRatio, VideoExportBitrate, VideoExportCodec, VideoExportEffect, VideoExportFps, VideoExportJobStatus, VideoExportResolution, VideoExportTransition } from "../../types/videoExport.js";
import { VideoExportOptionGrid, VideoExportOptionItem, VideoExportOptionSection, VideoExportOptionTone } from "./VideoExportOptionGrid.js";
import { VideoExportVisualSelector } from "./VideoExportVisualSelector.js";
type VideoExportConfigCardProps = {
  exporter: Pick<VideoExporterState, "text" | "config" | "title" | "slidePlan" | "totalAudioSeconds" | "job" | "isExporting" | "canRender" | "isRanking" | "isScanning" | "updateConfig" | "setTitle" | "startExport" | "stopExport">;
};
export const VideoExportConfigCard: FC<VideoExportConfigCardProps> = ({ exporter }) => {
  const { text, config, title, slidePlan, totalAudioSeconds, job, isExporting, canRender, isRanking, isScanning } = exporter;
  const isDisabled = isExporting;
  const canStart = canRender && !isExporting && !isRanking && !isScanning;
  const aspectOptions = useMemo<VideoExportOptionItem<VideoExportAspectRatio>[]>(
    () => [
      { value: VideoExportAspectRatio.HORIZONTAL_16_9, label: VideoExportAspectRatio.HORIZONTAL_16_9, icon: Tv },
      { value: VideoExportAspectRatio.VERTICAL_9_16, label: VideoExportAspectRatio.VERTICAL_9_16, icon: Smartphone },
      { value: VideoExportAspectRatio.SQUARE_1_1, label: VideoExportAspectRatio.SQUARE_1_1, icon: Square },
    ],
    [],
  );
  const effectSections = useMemo<VideoExportOptionSection<VideoExportEffect>[]>(
    () => [
      {
        key: VIDEO_EXPORT_TEXT_CAPCUT_HOT,
        label: text.EFFECT_GROUP_CAPCUT_HOT,
        options: [
          { value: VideoExportEffect.FLASH_WHITE, label: text.EFFECT_FLASH_WHITE, icon: Zap },
          { value: VideoExportEffect.WHITE_NOISE, label: text.EFFECT_WHITE_NOISE, icon: Waves },
          { value: VideoExportEffect.RETRO_DECADES, label: text.EFFECT_RETRO_DECADES, icon: Film },
          { value: VideoExportEffect.HEART_BEAT, label: text.EFFECT_HEART_BEAT, icon: Heart },
          { value: VideoExportEffect.GLITCH_RGB, label: text.EFFECT_GLITCH_RGB, icon: Tv },
          { value: VideoExportEffect.DISCO_STROBE, label: text.EFFECT_DISCO_STROBE, icon: Disc3 },
          { value: VideoExportEffect.BOUNCE_ZOOM, label: text.EFFECT_BOUNCE_ZOOM, icon: PartyPopper },
          { value: VideoExportEffect.DREAMY_GLOW, label: text.EFFECT_DREAMY_GLOW, icon: Sparkles },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_CINEMA,
        label: text.EFFECT_GROUP_CINEMA,
        options: [
          { value: VideoExportEffect.RETRO_DECADES, label: text.EFFECT_RETRO_DECADES, icon: Film },
          { value: VideoExportEffect.VINTAGE_FILM, label: text.EFFECT_VINTAGE_FILM, icon: Film },
          { value: VideoExportEffect.NEON_CYBER, label: text.EFFECT_NEON_CYBER, icon: Flame },
          { value: VideoExportEffect.CINEMA_DRAMA, label: text.EFFECT_CINEMA_DRAMA, icon: Clapperboard },
          { value: VideoExportEffect.BLACK_WHITE, label: text.EFFECT_BLACK_WHITE, icon: Contrast },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_ZOOM,
        label: text.EFFECT_GROUP_ZOOM,
        options: [
          { value: VideoExportEffect.ZOOM_IN, label: text.EFFECT_ZOOM_IN, icon: ZoomIn },
          { value: VideoExportEffect.ZOOM_OUT, label: text.EFFECT_ZOOM_OUT, icon: ZoomOut },
          { value: VideoExportEffect.KEN_BURNS, label: text.EFFECT_KEN_BURNS, icon: Focus },
          { value: VideoExportEffect.PULSE, label: text.EFFECT_PULSE, icon: HeartPulse },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_PAN,
        label: text.EFFECT_GROUP_PAN,
        options: [
          { value: VideoExportEffect.PAN_LEFT, label: text.EFFECT_PAN_LEFT, icon: MoveLeft },
          { value: VideoExportEffect.PAN_RIGHT, label: text.EFFECT_PAN_RIGHT, icon: MoveRight },
          { value: VideoExportEffect.PAN_UP, label: text.EFFECT_PAN_UP, icon: ArrowUp },
          { value: VideoExportEffect.PAN_DOWN, label: text.EFFECT_PAN_DOWN, icon: ArrowDown },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_MOTION,
        label: text.EFFECT_GROUP_MOTION,
        options: [
          { value: VideoExportEffect.SHAKE, label: text.EFFECT_SHAKE, icon: Vibrate },
          { value: VideoExportEffect.SWING, label: text.EFFECT_SWING, icon: Waves },
          { value: VideoExportEffect.ZOOM_ROTATE, label: text.EFFECT_ZOOM_ROTATE, icon: RotateCw },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_BASIC,
        label: text.EFFECT_GROUP_BASIC,
        options: [
          { value: VideoExportEffect.NONE, label: text.EFFECT_NONE, icon: ImageIcon },
          { value: VideoExportEffect.RANDOM, label: text.EFFECT_RANDOM, icon: Shuffle },
        ],
      },
    ],
    [text],
  );
  const transitionSections = useMemo<VideoExportOptionSection<VideoExportTransition>[]>(
    () => [
      {
        key: VIDEO_EXPORT_TEXT_BASIC,
        label: text.TRANSITION_GROUP_BASIC,
        options: [
          { value: VideoExportTransition.NONE, label: text.TRANSITION_NONE, icon: Ban },
          { value: VideoExportTransition.RANDOM, label: text.TRANSITION_RANDOM, icon: Shuffle },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_FADE,
        label: text.TRANSITION_GROUP_FADE,
        options: [
          { value: VideoExportTransition.FADE, label: text.TRANSITION_FADE, icon: Blend },
          { value: VideoExportTransition.FADE_BLACK, label: text.TRANSITION_FADE_BLACK, icon: Contrast },
          { value: VideoExportTransition.DISSOLVE, label: text.TRANSITION_DISSOLVE, icon: Sparkles },
          { value: VideoExportTransition.FADE_WHITE, label: text.TRANSITION_FADE_WHITE, icon: Sun },
          { value: VideoExportTransition.BLUR, label: text.TRANSITION_BLUR, icon: Droplets },
          { value: VideoExportTransition.FADE_GRAYS, label: text.TRANSITION_FADE_GRAYS, icon: Moon },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_SLIDE,
        label: text.TRANSITION_GROUP_SLIDE,
        options: [
          { value: VideoExportTransition.SLIDE_LEFT, label: text.TRANSITION_SLIDE_LEFT, icon: MoveLeft },
          { value: VideoExportTransition.SLIDE_RIGHT, label: text.TRANSITION_SLIDE_RIGHT, icon: MoveRight },
          { value: VideoExportTransition.SLIDE_UP, label: text.TRANSITION_SLIDE_UP, icon: ArrowUp },
          { value: VideoExportTransition.SLIDE_DOWN, label: text.TRANSITION_SLIDE_DOWN, icon: ArrowDown },
          { value: VideoExportTransition.SMOOTH_LEFT, label: text.TRANSITION_SMOOTH_LEFT, icon: Film },
          { value: VideoExportTransition.COVER_LEFT, label: text.TRANSITION_COVER_LEFT, icon: PanelLeft },
          { value: VideoExportTransition.REVEAL_RIGHT, label: text.TRANSITION_REVEAL_RIGHT, icon: PanelRight },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_SHAPE,
        label: text.TRANSITION_GROUP_SHAPE,
        options: [
          { value: VideoExportTransition.WIPE_LEFT, label: text.TRANSITION_WIPE_LEFT, icon: ArrowLeftRight },
          { value: VideoExportTransition.CIRCLE_OPEN, label: text.TRANSITION_CIRCLE_OPEN, icon: Circle },
          { value: VideoExportTransition.CIRCLE_CLOSE, label: text.TRANSITION_CIRCLE_CLOSE, icon: CircleDot },
          { value: VideoExportTransition.RADIAL, label: text.TRANSITION_RADIAL, icon: Aperture },
          { value: VideoExportTransition.HORZ_OPEN, label: text.TRANSITION_HORZ_OPEN, icon: Columns2 },
          { value: VideoExportTransition.DIAG_TL, label: text.TRANSITION_DIAG_TL, icon: Slash },
          { value: VideoExportTransition.SLICE, label: text.TRANSITION_SLICE, icon: Rows3 },
        ],
      },
      {
        key: VIDEO_EXPORT_TEXT_SPECIAL,
        label: text.TRANSITION_GROUP_SPECIAL,
        options: [
          { value: VideoExportTransition.ZOOM_IN, label: text.TRANSITION_ZOOM_IN, icon: Maximize },
          { value: VideoExportTransition.PIXELIZE, label: text.TRANSITION_PIXELIZE, icon: Grid3x3 },
          { value: VideoExportTransition.SQUEEZE, label: text.TRANSITION_SQUEEZE, icon: FoldHorizontal },
          { value: VideoExportTransition.WIND, label: text.TRANSITION_WIND, icon: Wind },
          { value: VideoExportTransition.DISTANCE, label: text.TRANSITION_DISTANCE, icon: Orbit },
        ],
      },
    ],
    [text],
  );
  const resolutionOptions = useMemo<VideoExportOptionItem<VideoExportResolution>[]>(
    () => [
      { value: VideoExportResolution.RES_720P, label: text.RESOLUTION_720P },
      { value: VideoExportResolution.RES_1080P, label: text.RESOLUTION_1080P },
      { value: VideoExportResolution.RES_2K, label: text.RESOLUTION_2K },
      { value: VideoExportResolution.RES_4K, label: text.RESOLUTION_4K },
    ],
    [text],
  );
  const fpsOptions = useMemo<VideoExportOptionItem<VideoExportFps>[]>(
    () => [
      { value: VideoExportFps.FPS_24, label: text.FPS_24 },
      { value: VideoExportFps.FPS_30, label: text.FPS_30 },
      { value: VideoExportFps.FPS_60, label: text.FPS_60 },
    ],
    [text],
  );
  const bitrateOptions = useMemo<VideoExportOptionItem<VideoExportBitrate>[]>(
    () => [
      { value: VideoExportBitrate.STANDARD, label: text.BITRATE_STANDARD },
      { value: VideoExportBitrate.HIGH, label: text.BITRATE_HIGH },
    ],
    [text],
  );
  const codecOptions = useMemo<VideoExportOptionItem<VideoExportCodec>[]>(
    () => [
      { value: VideoExportCodec.H264, label: text.CODEC_H264 },
      { value: VideoExportCodec.HEVC, label: text.CODEC_HEVC },
    ],
    [text],
  );
  const toSecondOptions = (values: readonly number[]): VideoExportOptionItem<number>[] => _.map(values, (value) => ({ value, label: `${value}${text.SECONDS_UNIT}` }));
  const progressPercent = _.clamp(_.toNumber(job?.percent) || 0, 0, 100);
  const showProgress = Boolean(job) && job?.status !== VideoExportJobStatus.IDLE;
  return (
    <StudioCard className={cn("glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
        <div className={cn("flex items-center gap-2.5 min-w-0")}>
          <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{text.STEP_02}</span>
          <h2 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
            <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-400")} />
            <span>{text.CONFIG_TITLE}</span>
          </h2>
        </div>
      </div>
      <fieldset disabled={isDisabled} className={cn("space-y-3 min-w-0")}>
        <div className={cn("space-y-1.5 pt-0.5")}>
          <label className={cn("text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5")}>
            <span>{text.ASPECT_RATIO_LABEL}</span>
          </label>
          <div className={cn("grid grid-cols-3 gap-2")}>
            {_.map(aspectOptions, (item) => {
              const isSelected = config.aspectRatio === item.value;
              const Icon = item.icon || Tv;
              return (
                <Button
                  key={item.value}
                  variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                  type={VIDEO_EXPORT_TEXT_BUTTON}
                  disabled={isDisabled}
                  onClick={() => exporter.updateConfig(VIDEO_EXPORT_TEXT_ASPECTRATIO, item.value)}
                  className={cn("flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all text-center group cursor-pointer select-none", {
                    "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25": isSelected,
                    "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-slate-700 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-slate-900/60": !isSelected,
                  })}>
                  <Icon className={cn("w-4 h-4 mb-1 transition-transform group-hover:scale-110", isSelected ? "!text-white" : "text-purple-600 dark:text-purple-400")} />
                  <span className={cn("text-xs font-bold font-mono", isSelected ? "!text-white" : "text-slate-800 dark:text-slate-200")}>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        {config.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16 && (
          <div className={cn("space-y-1.5 pt-0.5 animate-in fade-in duration-150")}>
            <label className={cn("text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between")}>
              <span>{text.REFRAME_LABEL}</span>
            </label>
            <div className={cn("grid grid-cols-3 gap-1.5")}>
              {_.map(
                [
                  { mode: ShortsReframeMode.BLUR_BACKGROUND, label: text.REFRAME_BLUR_TAG, icon: Layers },
                  { mode: ShortsReframeMode.CENTER_CROP, label: text.REFRAME_CROP_TAG, icon: Crop },
                  { mode: ShortsReframeMode.SMART_TRACKING, label: text.REFRAME_TRACKING_TAG, icon: Crosshair },
                ],
                (item) => {
                  const isSelected = (config.reframeMode ?? ShortsReframeMode.BLUR_BACKGROUND) === item.mode;
                  const Icon = item.icon;
                  return (
                    <Button
                      variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                      key={item.mode}
                      type={VIDEO_EXPORT_TEXT_BUTTON}
                      disabled={isDisabled}
                      onClick={() => exporter.updateConfig(VIDEO_EXPORT_TEXT_REFRAMEMODE, item.mode)}
                      className={cn("h-8 rounded-xl border font-mono font-bold text-[11px] flex items-center justify-center transition-all cursor-pointer select-none gap-1 px-1", {
                        "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25": isSelected,
                        "bg-white dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-white hover:border-purple-300 dark:hover:border-slate-700 hover:bg-purple-50/50 dark:hover:bg-slate-900/60": !isSelected,
                      })}>
                      <Icon className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  );
                },
              )}
            </div>
          </div>
        )}
        <VideoExportVisualSelector text={text} label={text.EFFECT_LABEL} badge={VIDEO_EXPORT_CONSTANTS.FFMPEG_BADGE_MOTION} sections={effectSections} value={config.effect} accentColor={VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_EFFECT, value)} />
        <VideoExportVisualSelector text={text} label={text.TRANSITION_LABEL} badge={VIDEO_EXPORT_CONSTANTS.FFMPEG_BADGE_TRANSITION} sections={transitionSections} value={config.transition} accentColor={VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_TRANSITION, value)} />
        {config.transition !== VideoExportTransition.NONE && <VideoExportOptionGrid label={text.TRANSITION_DURATION_LABEL} options={toSecondOptions(VIDEO_EXPORT_CONSTANTS.TRANSITION_SECONDS_OPTIONS)} value={config.transitionSeconds} columns={4} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_TRANSITIONSECONDS, value)} />}
        <div className={cn("p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5 shadow-xs")}>
          <div className={cn("text-xs font-bold font-mono uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center justify-between")}>
            <span>{text.EXPORT_SETTINGS_LABEL}</span>
          </div>
          <VideoExportOptionGrid label={text.RESOLUTION_LABEL} options={resolutionOptions} value={config.resolution} columns={4} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_RESOLUTION, value)} />
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2.5")}>
            <VideoExportOptionGrid label={text.FPS_LABEL} options={fpsOptions} value={config.fps} columns={3} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_FPS, value)} />
            <VideoExportOptionGrid label={text.BITRATE_LABEL} options={bitrateOptions} value={config.bitrate} columns={2} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_BITRATE, value)} />
          </div>
          <VideoExportOptionGrid label={text.CODEC_LABEL} options={codecOptions} value={config.codec} columns={2} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_CODEC, value)} />
        </div>
        <div className={cn("space-y-1.5 pt-0.5")}>
          <label htmlFor={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TITLE} className={cn("text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between")}>
            <span>{text.TITLE_LABEL}</span>
          </label>
          <StudioInput
            id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TITLE}
            type={VIDEO_EXPORT_TEXT_TEXT}
            value={title}
            maxLength={120}
            placeholder={text.TITLE_PLACEHOLDER}
            onChange={(event) => exporter.setTitle(event.target.value)}
            className={cn("w-full h-8 px-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all shadow-2xs")}
          />
        </div>
      </fieldset>
      <div className={cn("grid grid-cols-2 gap-2")}>
        <div className={cn("bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 min-w-0 shadow-2xs")}>
          <Clock className={cn("w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0")} />
          <div className={cn("min-w-0")}>
            <div className={cn("text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase truncate")}>{text.SUMMARY_DURATION}</div>
            <div className={cn("text-xs font-bold text-slate-800 dark:text-slate-200")}>{formatCleanTime(totalAudioSeconds)}</div>
          </div>
        </div>
        <div className={cn("bg-white dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 min-w-0 shadow-2xs")}>
          <ImageIcon className={cn("w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0")} />
          <div className={cn("min-w-0")}>
            <div className={cn("text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase truncate")}>{text.SUMMARY_PER_IMAGE}</div>
            <div className={cn("text-xs font-bold text-slate-800 dark:text-slate-200")}>{slidePlan.slideSeconds > 0 ? VIDEO_EXPORT_TEMPLATE_SYMBOL(`${slidePlan.slideSeconds.toFixed(1)}`, `${text.SECONDS_UNIT}`, `${slidePlan.segmentCount}`) : VIDEO_EXPORT_TEXT_SYMBOL}</div>
          </div>
        </div>
      </div>
      {showProgress && job && (
        <div className={cn("p-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 space-y-1.5 text-[11px] font-mono shadow-2xs")}>
          <div className={cn("flex items-center justify-between gap-2")}>
            <span className={cn("text-slate-700 dark:text-slate-300 font-bold truncate")}>{job.status === VideoExportJobStatus.ERROR ? job.error || text.EXPORT_ERROR : job.message || text.EXPORTING_BTN}</span>
            <span className={cn("font-bold text-purple-700 dark:text-purple-300 shrink-0")}>
              {progressPercent}
              {VIDEO_EXPORT_TEXT_SYMBOL_2}
            </span>
          </div>
          <div className={cn("w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-800")}>
            <div
              className={cn("h-full rounded-full transition-all duration-300", {
                "bg-rose-500": job.status === VideoExportJobStatus.ERROR,
                "bg-slate-500": job.status === VideoExportJobStatus.CANCELLED,
                "bg-emerald-400": job.status === VideoExportJobStatus.COMPLETED,
                "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse": job.status === VideoExportJobStatus.RENDERING,
              })}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      <div className={cn("flex items-center gap-2 pt-0.5")}>
        <Button
          id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_START}
          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
          type={VIDEO_EXPORT_TEXT_BUTTON}
          onClick={exporter.startExport}
          disabled={!canStart}
          className={cn("w-full h-11 min-h-[44px] px-4 rounded-xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-lg tracking-wider uppercase font-sans border leading-none", {
            "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": isExporting,
            "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer": !isExporting && canStart,
            "bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none": !isExporting && !canStart,
          })}>
          {isExporting ? <Sparkles className={cn("w-4 h-4 animate-spin shrink-0")} /> : <Clapperboard className={cn("w-4 h-4 shrink-0")} />}
          <span className={cn("truncate")}>{isExporting ? text.EXPORTING_BTN : text.EXPORT_BTN}</span>
        </Button>
        {isExporting && (
          <Button
            id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_STOP}
            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
            type={VIDEO_EXPORT_TEXT_BUTTON}
            onClick={exporter.stopExport}
            className={cn("h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0")}>
            <Square className={cn("w-3.5 h-3.5 fill-rose-300/30")} />
            <span>{text.STOP_BTN}</span>
          </Button>
        )}
      </div>
    </StudioCard>
  );
};
