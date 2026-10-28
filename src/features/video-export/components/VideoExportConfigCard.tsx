import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioInput } from "../../../components/ui/Studio.js";
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
} from "../../../constants/videoExportText";
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
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { formatCleanTime } from "../../../lib/timeUtils.js";
import { VideoExporterState } from "../hooks/useVideoExporter.js";
import { VIDEO_EXPORT_CONSTANTS } from "../constants/videoExport.js";
import { ShortsReframeMode } from "../../../types/shorts.js";
import { VideoExportAspectRatio, VideoExportBitrate, VideoExportCodec, VideoExportEffect, VideoExportFps, VideoExportJobStatus, VideoExportResolution, VideoExportTransition } from "../types/videoExport.js";
import { VideoExportOptionGrid, VideoExportOptionItem, VideoExportOptionSection, VideoExportOptionTone } from "./VideoExportOptionGrid.js";
import { VideoExportVisualSelector } from "./VideoExportVisualSelector.js";
type VideoExportConfigCardProps = { exporter: Pick<VideoExporterState, "text" | "config" | "title" | "slidePlan" | "totalAudioSeconds" | "job" | "isExporting" | "canRender" | "isRanking" | "isScanning" | "updateConfig" | "setTitle" | "startExport" | "stopExport"> };
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
    <StudioCard className={cn(RT_VIDEO_EXPORT.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_4_SM)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
          <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{text.STEP_02}</span>
          <h2 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
            <SlidersHorizontal className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
            <span>{text.CONFIG_TITLE}</span>
          </h2>
        </div>
      </div>
      <fieldset disabled={isDisabled} className={cn(RT_VIDEO_EXPORT.SPACE_Y_3_MIN_W_0)}>
        <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_1_5_PT_0_5)}>
          <label className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_MEDIUM_TEXT_SLATE_700_DARK_TEXT_SLATE)}>
            <span>{text.ASPECT_RATIO_LABEL}</span>
          </label>
          <div className={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_3_GAP_2)}>
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
                  className={cn(RT_VIDEO_EXPORT.FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_PY_2_5, {
                    "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25": isSelected,
                    "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-slate-700 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-slate-900/60": !isSelected,
                  })}>
                  <Icon className={cn(RT_VIDEO_EXPORT.W_4_H_4_MB_1_TRANSITION_TRANSFORM_GROUP_HOVER, isSelected ? RT_VIDEO_EXPORT.TEXT_WHITE : RT_VIDEO_EXPORT.TEXT_PURPLE_600_DARK_TEXT_PURPLE_400)} />
                  <span className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_FONT_MONO, isSelected ? RT_VIDEO_EXPORT.TEXT_WHITE : RT_VIDEO_EXPORT.TEXT_SLATE_800_DARK_TEXT_SLATE_200)}>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        {config.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16 && (
          <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_1_5_PT_0_5_ANIMATE_IN_FADE)}>
            <label className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_MEDIUM_TEXT_SLATE_700_DARK_TEXT_SLATE_CEDA41)}>
              <span>{text.REFRAME_LABEL}</span>
            </label>
            <div className={cn(RT_SHARED.GRID_GRID_COLS_3_GAP_1_5)}>
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
                      className={cn(RT_VIDEO_EXPORT.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT, {
                        "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25": isSelected,
                        "bg-white dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-white hover:border-purple-300 dark:hover:border-slate-700 hover:bg-purple-50/50 dark:hover:bg-slate-900/60": !isSelected,
                      })}>
                      <Icon className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                      <span className={RT_SHARED.TRUNCATE}>{item.label}</span>
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
        <div className={cn(RT_VIDEO_EXPORT.P_3_5_ROUNDED_2XL_BG_SLATE_50_80_DARK)}>
          <div className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_FONT_MONO_UPPERCASE_TRACKING_WIDER_TEXT)}>
            <span>{text.EXPORT_SETTINGS_LABEL}</span>
          </div>
          <VideoExportOptionGrid label={text.RESOLUTION_LABEL} options={resolutionOptions} value={config.resolution} columns={4} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_RESOLUTION, value)} />
          <div className={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_2)}>
            <VideoExportOptionGrid label={text.FPS_LABEL} options={fpsOptions} value={config.fps} columns={3} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_FPS, value)} />
            <VideoExportOptionGrid label={text.BITRATE_LABEL} options={bitrateOptions} value={config.bitrate} columns={2} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_BITRATE, value)} />
          </div>
          <VideoExportOptionGrid label={text.CODEC_LABEL} options={codecOptions} value={config.codec} columns={2} tone={VideoExportOptionTone.PURPLE} disabled={isDisabled} onChange={(value) => exporter.updateConfig(VIDEO_EXPORT_TEXT_CODEC, value)} />
        </div>
        <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_1_5_PT_0_5)}>
          <label htmlFor={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TITLE} className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_MEDIUM_TEXT_SLATE_700_DARK_TEXT_SLATE_CEDA41)}>
            <span>{text.TITLE_LABEL}</span>
          </label>
          <StudioInput id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TITLE} type={VIDEO_EXPORT_TEXT_TEXT} value={title} maxLength={120} placeholder={text.TITLE_PLACEHOLDER} onChange={(event) => exporter.setTitle(event.target.value)} className={cn(RT_VIDEO_EXPORT.W_FULL_H_8_PX_3_ROUNDED_XL_BG_WHITE)} />
        </div>
      </fieldset>
      <div className={cn(RT_SHARED.GRID_GRID_COLS_2_GAP_2)}>
        <div className={cn(RT_VIDEO_EXPORT.BG_WHITE_DARK_BG_SLATE_950_60_BORDER_BORDER_SLATE)}>
          <Clock className={cn(RT_VIDEO_EXPORT.W_4_H_4_TEXT_BLUE_600_DARK_TEXT_BLUE)} />
          <div className={cn(RT_SHARED.MIN_W_0)}>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_9PX_TEXT_SLATE_500_DARK_TEXT_SLATE_400_FONT)}>{text.SUMMARY_DURATION}</div>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_TEXT_SLATE_800_DARK_TEXT_SLATE)}>{formatCleanTime(totalAudioSeconds)}</div>
          </div>
        </div>
        <div className={cn(RT_VIDEO_EXPORT.BG_WHITE_DARK_BG_SLATE_955_60_BORDER_BORDER_SLATE)}>
          <ImageIcon className={cn(RT_VIDEO_EXPORT.W_4_H_4_TEXT_PINK_600_DARK_TEXT_PINK)} />
          <div className={cn(RT_SHARED.MIN_W_0)}>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_9PX_TEXT_SLATE_500_DARK_TEXT_SLATE_400_FONT)}>{text.SUMMARY_PER_IMAGE}</div>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_TEXT_SLATE_800_DARK_TEXT_SLATE)}>{slidePlan.slideSeconds > 0 ? VIDEO_EXPORT_TEMPLATE_SYMBOL(`${slidePlan.slideSeconds.toFixed(1)}`, `${text.SECONDS_UNIT}`, `${slidePlan.segmentCount}`) : VIDEO_EXPORT_TEXT_SYMBOL}</div>
          </div>
        </div>
      </div>
      {showProgress && job && (
        <div className={cn(RT_VIDEO_EXPORT.P_2_5_ROUNDED_XL_BG_WHITE_DARK_BG_SLATE)}>
          <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
            <span className={cn(RT_VIDEO_EXPORT.TEXT_SLATE_700_DARK_TEXT_SLATE_300_FONT_BOLD_TRUNCATE)}>{job.status === VideoExportJobStatus.ERROR ? job.error || text.EXPORT_ERROR : job.message || text.EXPORTING_BTN}</span>
            <span className={cn(RT_VIDEO_EXPORT.FONT_BOLD_TEXT_PURPLE_700_DARK_TEXT_PURPLE_300_SHRINK)}>
              {progressPercent}
              {VIDEO_EXPORT_TEXT_SYMBOL_2}
            </span>
          </div>
          <div className={cn(RT_VIDEO_EXPORT.W_FULL_BG_SLATE_100_DARK_BG_SLATE_950_ROUNDED)}>
            <div
              className={cn(RT_SHARED.H_FULL_ROUNDED_FULL_TRANSITION_ALL_DURATION_300, { "bg-rose-500": job.status === VideoExportJobStatus.ERROR, "bg-slate-500": job.status === VideoExportJobStatus.CANCELLED, "bg-emerald-400": job.status === VideoExportJobStatus.COMPLETED, "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse": job.status === VideoExportJobStatus.RENDERING })}
              style={{ width: `${progressPercent}${RT_SHARED.SYMBOL}` }}
            />
          </div>
        </div>
      )}
      <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_2_PT_0_5)}>
        <Button
          id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_START}
          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
          type={VIDEO_EXPORT_TEXT_BUTTON}
          onClick={exporter.startExport}
          disabled={!canStart}
          className={cn(RT_VIDEO_EXPORT.W_FULL_H_11_MIN_H_44PX_PX_4_ROUNDED, {
            "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": isExporting,
            "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer": !isExporting && canStart,
            "bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none": !isExporting && !canStart,
          })}>
          {isExporting ? <Sparkles className={cn(RT_VIDEO_EXPORT.W_4_H_4_ANIMATE_SPIN_SHRINK_0)} /> : <Clapperboard className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />}
          <span className={cn(RT_SHARED.TRUNCATE)}>{isExporting ? text.EXPORTING_BTN : text.EXPORT_BTN}</span>
        </Button>
        {isExporting && (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_STOP} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.stopExport} className={cn(RT_SHARED.H_11_MIN_H_44PX_PX_4_ROUNDED_XL_BORDER)}>
            <Square className={cn(RT_SHARED.W_3_5_H_3_5_FILL_ROSE_300_30)} />
            <span>{text.STOP_BTN}</span>
          </Button>
        )}
      </div>
    </StudioCard>
  );
};
