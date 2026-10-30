import { VideoExportQuality } from "../../../../constants/runtime/enums.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import {
  VIDEO_EXPORT_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT,
  VIDEO_EXPORT_TEMPLATE_1,
  VIDEO_EXPORT_TEMPLATE_1_01_0_14_POW_ABS,
  VIDEO_EXPORT_TEMPLATE_1_02_0_04_SIN_2,
  VIDEO_EXPORT_TEMPLATE_1_02_0_04_SIN_2_2,
  VIDEO_EXPORT_TEMPLATE_1_02_0_05_SIN_2,
  VIDEO_EXPORT_TEMPLATE_1_02_0_05_SIN_2_2,
  VIDEO_EXPORT_TEMPLATE_1_02_0_06_SIN_2,
  VIDEO_EXPORT_TEMPLATE_1_02_0_09_ABS_SIN,
  VIDEO_EXPORT_TEMPLATE_1_0_06,
  VIDEO_EXPORT_TEMPLATE_1_0_07,
  VIDEO_EXPORT_TEMPLATE_A,
  VIDEO_EXPORT_TEMPLATE_A_2,
  VIDEO_EXPORT_TEMPLATE_A_ARESAMPLE_AFORMAT_SAMPLE_FMTS_FLTP,
  VIDEO_EXPORT_TEMPLATE_CONCAT_N_V_0_A_1,
  VIDEO_EXPORT_TEMPLATE_CROP,
  VIDEO_EXPORT_TEMPLATE_FILE,
  VIDEO_EXPORT_TEMPLATE_FORMAT,
  VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM,
  VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM_1,
  VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM_2_COS_ON,
  VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM,
  VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM_1,
  VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM_2_SIN_ON,
  VIDEO_EXPORT_TEMPLATE_ON,
  VIDEO_EXPORT_TEMPLATE_ROTATE_A_SIN_2_PI_T,
  VIDEO_EXPORT_TEMPLATE_ROTATE_A_T_FILLCOLOR_BLACK,
  VIDEO_EXPORT_TEMPLATE_SCALE_FORCE_ORIGINAL_ASPECT_RATIO_INCREASE,
  VIDEO_EXPORT_TEMPLATE_SIN_2_PI_ON,
  VIDEO_EXPORT_TEMPLATE_SYMBOL_10,
  VIDEO_EXPORT_TEMPLATE_SYMBOL_8,
  VIDEO_EXPORT_TEMPLATE_SYMBOL_9,
  VIDEO_EXPORT_TEMPLATE_S_XFADE_TRANSITION_DURATION_OFFSET,
  VIDEO_EXPORT_TEMPLATE_V_SETTB_AVTB_FPS_FORMAT_S,
  VIDEO_EXPORT_TEMPLATE_X,
  VIDEO_EXPORT_TEMPLATE_ZOOMPAN_Z_X_Y_D_S,
  VIDEO_EXPORT_TEXT_0,
  VIDEO_EXPORT_TEXT_0_V,
  VIDEO_EXPORT_TEXT_1,
  VIDEO_EXPORT_TEXT_1_A,
  VIDEO_EXPORT_TEXT_AN,
  VIDEO_EXPORT_TEXT_AOUT,
  VIDEO_EXPORT_TEXT_B_A,
  VIDEO_EXPORT_TEXT_COLORBALANCE_RS_0_08_GS_0,
  VIDEO_EXPORT_TEXT_COLORBALANCE_RS_0_12_GS_0,
  VIDEO_EXPORT_TEXT_CONCAT,
  VIDEO_EXPORT_TEXT_COPY,
  VIDEO_EXPORT_TEXT_CRF,
  VIDEO_EXPORT_TEXT_CURVES_VINTAGE_NOISE_ALLS_10_ALLF,
  VIDEO_EXPORT_TEXT_C_A,
  VIDEO_EXPORT_TEXT_C_V,
  VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_12_0_12,
  VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_12_BRIGHTNESS_0,
  VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_1_0_1,
  VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_3_SATURATION_1,
  VIDEO_EXPORT_TEXT_F,
  VIDEO_EXPORT_TEXT_FADE_T_IN_ST_0_D,
  VIDEO_EXPORT_TEXT_FASTSTART,
  VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
  VIDEO_EXPORT_TEXT_FRAMERATE,
  VIDEO_EXPORT_TEXT_HUE_H_T_120_S_1,
  VIDEO_EXPORT_TEXT_HUE_S_0_EQ_CONTRAST_1,
  VIDEO_EXPORT_TEXT_I,
  VIDEO_EXPORT_TEXT_IH_2_IH_ZOOM_2,
  VIDEO_EXPORT_TEXT_IW_2_IW_ZOOM_2,
  VIDEO_EXPORT_TEXT_LOOP,
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_TEXT_MOVFLAGS,
  VIDEO_EXPORT_TEXT_NOISE_ALLS_28_ALLF_T_U,
  VIDEO_EXPORT_TEXT_PIX_FMT,
  VIDEO_EXPORT_TEXT_PRESET,
  VIDEO_EXPORT_TEXT_R,
  VIDEO_EXPORT_TEXT_RGBASHIFT_RH_12_RV_3_GH,
  VIDEO_EXPORT_TEXT_S0,
  VIDEO_EXPORT_TEXT_SAFE,
  VIDEO_EXPORT_TEXT_SETSAR_1,
  VIDEO_EXPORT_TEXT_SHORTEST,
  VIDEO_EXPORT_TEXT_SYMBOL_11,
  VIDEO_EXPORT_TEXT_SYMBOL_14,
  VIDEO_EXPORT_TEXT_SYMBOL_15,
  VIDEO_EXPORT_TEXT_SYMBOL_16,
  VIDEO_EXPORT_TEXT_T,
  VIDEO_EXPORT_TEXT_UTF8,
  VIDEO_EXPORT_TEXT_VF,
  VIDEO_EXPORT_TEXT_VN,
  VIDEO_EXPORT_TEXT_VOUT,
  VIDEO_EXPORT_TEXT_Y,
} from "../../../../constants/videoExportText";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { probeMediaDurationSeconds, runFfmpeg, throwIfAborted } from "./videoExportFfmpegService.js";
import { logger } from "../../../../lib/logger.js";
import { computeVideoExportSlidePlan, VideoExportSlidePlan } from "../../lib/videoExportPlan.js";
import { VIDEO_EXPORT_BITRATE_CRF, VIDEO_EXPORT_CODEC_MAP, VIDEO_EXPORT_CONSTANTS, VIDEO_EXPORT_LOG_MESSAGES, VIDEO_EXPORT_PREVIEW_DIMENSIONS, VIDEO_EXPORT_REGEX, VIDEO_EXPORT_RESOLUTIONS, VIDEO_EXPORT_SERVER_TEXTS } from "../../constants/videoExport.js";
import { ShortsReframeMode } from "../../../../types/shorts.js";
import { VideoExportAspectRatio, VideoExportConfig, VideoExportEffect, VideoExportJobStage, VideoExportResolution, VideoExportSlideMode, VideoExportTransition } from "../../types/videoExport.js";
export { VideoExportQuality };
type EncodeProfile = { width: number; height: number; fps: number; preset: string; crf: string; codec: string };
export type VideoExportProgressHandler = (stage: VideoExportJobStage, percent: number, message: string) => void;
export type RenderVideoExportParams = { audioPaths: string[]; imagePaths: string[]; config: VideoExportConfig; outputPath: string; tempDir: string; quality: VideoExportQuality; signal?: AbortSignal; onProgress?: VideoExportProgressHandler };
const resolveEncodeProfile = (config: VideoExportConfig, quality: VideoExportQuality): EncodeProfile => {
  if (quality === VideoExportQuality.PREVIEW) {
    return { ...VIDEO_EXPORT_PREVIEW_DIMENSIONS[config.aspectRatio], fps: VIDEO_EXPORT_CONSTANTS.PREVIEW_FPS, preset: VIDEO_EXPORT_CONSTANTS.PREVIEW_PRESET, crf: VIDEO_EXPORT_CONSTANTS.PREVIEW_CRF, codec: VIDEO_EXPORT_CONSTANTS.VIDEO_CODEC };
  }
  const resolution = config.resolution || VideoExportResolution.RES_1080P;
  const dimensions = VIDEO_EXPORT_RESOLUTIONS[config.aspectRatio]?.[resolution] || VIDEO_EXPORT_RESOLUTIONS[config.aspectRatio][VideoExportResolution.RES_1080P];
  const fps = config.fps || VIDEO_EXPORT_CONSTANTS.FPS;
  const crf = VIDEO_EXPORT_BITRATE_CRF[config.bitrate] || VIDEO_EXPORT_CONSTANTS.CRF;
  const codec = VIDEO_EXPORT_CODEC_MAP[config.codec] || VIDEO_EXPORT_CONSTANTS.VIDEO_CODEC;
  return { ...dimensions, fps, preset: VIDEO_EXPORT_CONSTANTS.PRESET, crf, codec };
};
const resolveEffect = (effect: VideoExportEffect, index: number): VideoExportEffect => (effect === VideoExportEffect.RANDOM ? VIDEO_EXPORT_CONSTANTS.EFFECT_CYCLE[index % VIDEO_EXPORT_CONSTANTS.EFFECT_CYCLE.length] : effect);
const resolveTransition = (transition: VideoExportTransition, index: number): VideoExportTransition => (transition === VideoExportTransition.RANDOM ? VIDEO_EXPORT_CONSTANTS.TRANSITION_CYCLE[index % VIDEO_EXPORT_CONSTANTS.TRANSITION_CYCLE.length] : transition);
const buildCoverFilter = (width: number, height: number): string => VIDEO_EXPORT_TEMPLATE_SCALE_FORCE_ORIGINAL_ASPECT_RATIO_INCREASE(`${width}`, `${height}`, `${width}`, `${height}`);
const toEven = (value: number): number => Math.max(2, Math.round(value / 2) * 2);
const ROTATING_EFFECTS: VideoExportEffect[] = [VideoExportEffect.SWING, VideoExportEffect.ZOOM_ROTATE];
const buildZoompanExpressions = (effect: VideoExportEffect, frames: number, fps: number): { zoom: string; x: string; y: string } => {
  const constants = VIDEO_EXPORT_CONSTANTS;
  const amount = constants.ZOOM_AMOUNT;
  const progress = VIDEO_EXPORT_TEMPLATE_ON(`${frames}`);
  const centerX = VIDEO_EXPORT_TEXT_IW_2_IW_ZOOM_2;
  const centerY = VIDEO_EXPORT_TEXT_IH_2_IH_ZOOM_2;
  switch (effect) {
    case VideoExportEffect.ZOOM_OUT:
      return { zoom: VIDEO_EXPORT_TEMPLATE_SYMBOL_8(`${1 + amount}`, `${amount}`, `${progress}`), x: centerX, y: centerY };
    case VideoExportEffect.PAN_RIGHT:
      return { zoom: `${constants.PAN_ZOOM}`, x: VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM(`${progress}`), y: centerY };
    case VideoExportEffect.PAN_LEFT:
      return { zoom: `${constants.PAN_ZOOM}`, x: VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM_1(`${progress}`), y: centerY };
    case VideoExportEffect.PAN_UP:
      return { zoom: `${constants.PAN_ZOOM}`, x: centerX, y: VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM_1(`${progress}`) };
    case VideoExportEffect.PAN_DOWN:
      return { zoom: `${constants.PAN_ZOOM}`, x: centerX, y: VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM(`${progress}`) };
    case VideoExportEffect.KEN_BURNS: {
      const drift = VIDEO_EXPORT_TEMPLATE_SYMBOL_9(`${constants.KEN_BURNS_DRIFT_START}`, `${constants.KEN_BURNS_DRIFT_RANGE}`, `${progress}`);
      return { zoom: VIDEO_EXPORT_TEMPLATE_1(`${amount}`, `${progress}`), x: VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM(`${drift}`), y: VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM(`${drift}`) };
    }
    case VideoExportEffect.PULSE:
      return { zoom: VIDEO_EXPORT_TEMPLATE_SIN_2_PI_ON(`${constants.PULSE_BASE_ZOOM}`, `${constants.PULSE_AMPLITUDE}`, `${fps * constants.PULSE_PERIOD_SECONDS}`), x: centerX, y: centerY };
    case VideoExportEffect.SHAKE:
      return { zoom: `${constants.SHAKE_ZOOM}`, x: VIDEO_EXPORT_TEMPLATE_IW_IW_ZOOM_2_SIN_ON(`${centerX}`, `${constants.SHAKE_STRENGTH}`), y: VIDEO_EXPORT_TEMPLATE_IH_IH_ZOOM_2_COS_ON(`${centerY}`, `${constants.SHAKE_STRENGTH}`) };
    case VideoExportEffect.SWING:
      return { zoom: `${constants.PAN_ZOOM}`, x: centerX, y: centerY };
    case VideoExportEffect.HEART_BEAT:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_09_ABS_SIN(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.BOUNCE_ZOOM:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_01_0_14_POW_ABS(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.GLITCH_RGB:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_05_SIN_2(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.DISCO_STROBE:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_06_SIN_2(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.VINTAGE_FILM:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_0_06(`${progress}`), x: centerX, y: centerY };
    case VideoExportEffect.DREAMY_GLOW:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_04_SIN_2(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.NEON_CYBER:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_05_SIN_2_2(`${fps}`), x: centerX, y: centerY };
    case VideoExportEffect.FLASH_WHITE:
    case VideoExportEffect.CINEMA_DRAMA:
    case VideoExportEffect.BLACK_WHITE:
    case VideoExportEffect.RETRO_DECADES:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_0_07(`${progress}`), x: centerX, y: centerY };
    case VideoExportEffect.WHITE_NOISE:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1_02_0_04_SIN_2_2(`${fps}`), x: centerX, y: centerY };
    default:
      return { zoom: VIDEO_EXPORT_TEMPLATE_1(`${amount}`, `${progress}`), x: centerX, y: centerY };
  }
};
const buildRotateFilter = (effect: VideoExportEffect, seconds: number): string => {
  const constants = VIDEO_EXPORT_CONSTANTS;
  if (effect === VideoExportEffect.SWING) return VIDEO_EXPORT_TEMPLATE_ROTATE_A_SIN_2_PI_T(`${constants.SWING_ANGLE_RAD}`, `${constants.SWING_PERIOD_SECONDS}`);
  return VIDEO_EXPORT_TEMPLATE_ROTATE_A_T_FILLCOLOR_BLACK(`${constants.ZOOM_ROTATE_ANGLE_RAD}`, `${seconds.toFixed(3)}`);
};
const buildVisualPostFilter = (effect: VideoExportEffect): string | null => {
  switch (effect) {
    case VideoExportEffect.FLASH_WHITE:
      return VIDEO_EXPORT_TEXT_FADE_T_IN_ST_0_D;
    case VideoExportEffect.GLITCH_RGB:
      return VIDEO_EXPORT_TEXT_RGBASHIFT_RH_12_RV_3_GH;
    case VideoExportEffect.HEART_BEAT:
      return VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_12_0_12;
    case VideoExportEffect.DISCO_STROBE:
      return VIDEO_EXPORT_TEXT_HUE_H_T_120_S_1;
    case VideoExportEffect.VINTAGE_FILM:
      return VIDEO_EXPORT_TEXT_CURVES_VINTAGE_NOISE_ALLS_10_ALLF;
    case VideoExportEffect.DREAMY_GLOW:
      return VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_12_BRIGHTNESS_0;
    case VideoExportEffect.BOUNCE_ZOOM:
      return VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_1_0_1;
    case VideoExportEffect.NEON_CYBER:
      return VIDEO_EXPORT_TEXT_EQ_CONTRAST_1_3_SATURATION_1;
    case VideoExportEffect.CINEMA_DRAMA:
      return VIDEO_EXPORT_TEXT_COLORBALANCE_RS_0_08_GS_0;
    case VideoExportEffect.BLACK_WHITE:
      return VIDEO_EXPORT_TEXT_HUE_S_0_EQ_CONTRAST_1;
    case VideoExportEffect.RETRO_DECADES:
      return VIDEO_EXPORT_TEXT_COLORBALANCE_RS_0_12_GS_0;
    case VideoExportEffect.WHITE_NOISE:
      return VIDEO_EXPORT_TEXT_NOISE_ALLS_28_ALLF_T_U;
    default:
      return null;
  }
};
const buildSegmentArgs = (imagePath: string, effect: VideoExportEffect, seconds: number, profile: EncodeProfile, outputPath: string, isVertical916?: boolean, reframeMode?: ShortsReframeMode): string[] => {
  const { width, height, fps, preset, crf } = profile;
  const frames = Math.max(1, Math.round(seconds * fps));
  const pixelFormat = VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT;
  const encodeArgs = [VIDEO_EXPORT_TEXT_T, seconds.toFixed(3), VIDEO_EXPORT_TEXT_R, `${fps}`, VIDEO_EXPORT_TEXT_C_V, profile.codec, VIDEO_EXPORT_TEXT_PRESET, preset, VIDEO_EXPORT_TEXT_CRF, crf, VIDEO_EXPORT_TEXT_PIX_FMT, pixelFormat, VIDEO_EXPORT_TEXT_AN, VIDEO_EXPORT_TEXT_Y, outputPath];
  const actualEffect = isVertical916 && reframeMode === ShortsReframeMode.SMART_TRACKING && effect === VideoExportEffect.NONE ? VideoExportEffect.KEN_BURNS : effect;
  const visualFilter = buildVisualPostFilter(actualEffect);
  if (isVertical916 && (reframeMode ?? ShortsReframeMode.BLUR_BACKGROUND) === ShortsReframeMode.BLUR_BACKGROUND) {
    const postFilter = visualFilter ? VIDEO_EXPORT_TEMPLATE_SYMBOL_10(`${visualFilter}`) : "";
    const filterComplex = VIDEO_EXPORT_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT(`${width}`, `${height}`, `${width}`, `${height}`, `${width}`, `${height}`, `${postFilter}`, `${pixelFormat}`);
    return [VIDEO_EXPORT_TEXT_LOOP, VIDEO_EXPORT_TEXT_1, VIDEO_EXPORT_TEXT_FRAMERATE, `${fps}`, VIDEO_EXPORT_TEXT_T, seconds.toFixed(3), VIDEO_EXPORT_TEXT_I, imagePath, VIDEO_EXPORT_TEXT_FILTER_COMPLEX, filterComplex, VIDEO_EXPORT_TEXT_MAP, VIDEO_EXPORT_TEXT_VOUT, ...encodeArgs];
  }
  if (actualEffect === VideoExportEffect.NONE) {
    const filters = [buildCoverFilter(width, height)];
    if (visualFilter) filters.push(visualFilter);
    filters.push(VIDEO_EXPORT_TEXT_SETSAR_1, VIDEO_EXPORT_TEMPLATE_FORMAT(`${pixelFormat}`));
    return [VIDEO_EXPORT_TEXT_LOOP, VIDEO_EXPORT_TEXT_1, VIDEO_EXPORT_TEXT_FRAMERATE, `${fps}`, VIDEO_EXPORT_TEXT_T, seconds.toFixed(3), VIDEO_EXPORT_TEXT_I, imagePath, VIDEO_EXPORT_TEXT_VF, _.join(filters, VIDEO_EXPORT_TEXT_SYMBOL_14), ...encodeArgs];
  }
  const upscale = VIDEO_EXPORT_CONSTANTS.ZOOM_UPSCALE;
  const isRotating = _.includes(ROTATING_EFFECTS, actualEffect);
  const frameWidth = isRotating ? toEven(width * VIDEO_EXPORT_CONSTANTS.ROTATE_PADDING) : width;
  const frameHeight = isRotating ? toEven(height * VIDEO_EXPORT_CONSTANTS.ROTATE_PADDING) : height;
  const { zoom, x, y } = buildZoompanExpressions(actualEffect, frames, fps);
  const filters = [buildCoverFilter(frameWidth * upscale, frameHeight * upscale), VIDEO_EXPORT_TEMPLATE_ZOOMPAN_Z_X_Y_D_S(`${zoom}`, `${x}`, `${y}`, `${frames}`, `${frameWidth}`, `${frameHeight}`, `${fps}`)];
  if (isRotating) filters.push(buildRotateFilter(actualEffect, seconds), VIDEO_EXPORT_TEMPLATE_CROP(`${width}`, `${height}`));
  if (visualFilter) filters.push(visualFilter);
  filters.push(VIDEO_EXPORT_TEXT_SETSAR_1, VIDEO_EXPORT_TEMPLATE_FORMAT(`${pixelFormat}`));
  return [VIDEO_EXPORT_TEXT_I, imagePath, VIDEO_EXPORT_TEXT_VF, _.join(filters, VIDEO_EXPORT_TEXT_SYMBOL_14), ...encodeArgs];
};
const buildAudioArgs = (audioPaths: string[], outputPath: string, maxSeconds?: number): string[] => {
  const inputArgs = _.flatMap(audioPaths, (audioPath) => [VIDEO_EXPORT_TEXT_I, audioPath]);
  const normalized = _.map(audioPaths, (_audioPath, index) => VIDEO_EXPORT_TEMPLATE_A_ARESAMPLE_AFORMAT_SAMPLE_FMTS_FLTP(`${index}`, `${VIDEO_EXPORT_CONSTANTS.AUDIO_SAMPLE_RATE}`, `${index}`));
  const concatInputs = _.join(
    _.map(audioPaths, (_audioPath, index) => VIDEO_EXPORT_TEMPLATE_A(`${index}`)),
    "",
  );
  const filter = VIDEO_EXPORT_TEMPLATE_CONCAT_N_V_0_A_1(`${_.join(normalized, VIDEO_EXPORT_TEXT_SYMBOL_15)}`, `${concatInputs}`, `${audioPaths.length}`);
  const limitArgs = maxSeconds ? [VIDEO_EXPORT_TEXT_T, `${maxSeconds}`] : [];
  return [...inputArgs, VIDEO_EXPORT_TEXT_FILTER_COMPLEX, filter, VIDEO_EXPORT_TEXT_MAP, VIDEO_EXPORT_TEXT_AOUT, ...limitArgs, VIDEO_EXPORT_TEXT_VN, VIDEO_EXPORT_TEXT_C_A, VIDEO_EXPORT_CONSTANTS.AUDIO_CODEC, VIDEO_EXPORT_TEXT_B_A, VIDEO_EXPORT_CONSTANTS.AUDIO_BITRATE, VIDEO_EXPORT_TEXT_Y, outputPath];
};
const escapeConcatPath = (filePath: string): string => _.replace(filePath, VIDEO_EXPORT_REGEX.CONCAT_QUOTE, VIDEO_EXPORT_TEXT_SYMBOL_16);
const buildConcatMergeArgs = (listPath: string, audioPath: string, outputPath: string): string[] => [
  VIDEO_EXPORT_TEXT_F,
  VIDEO_EXPORT_TEXT_CONCAT,
  VIDEO_EXPORT_TEXT_SAFE,
  VIDEO_EXPORT_TEXT_0,
  VIDEO_EXPORT_TEXT_I,
  listPath,
  VIDEO_EXPORT_TEXT_I,
  audioPath,
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_TEXT_0_V,
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_TEXT_1_A,
  VIDEO_EXPORT_TEXT_C_V,
  VIDEO_EXPORT_TEXT_COPY,
  VIDEO_EXPORT_TEXT_C_A,
  VIDEO_EXPORT_TEXT_COPY,
  VIDEO_EXPORT_TEXT_SHORTEST,
  VIDEO_EXPORT_TEXT_MOVFLAGS,
  VIDEO_EXPORT_TEXT_FASTSTART,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildXfadeMergeArgs = (segmentPaths: string[], audioPath: string, plan: VideoExportSlidePlan, transition: VideoExportTransition, profile: EncodeProfile, outputPath: string): string[] => {
  const inputArgs = _.flatMap(segmentPaths, (segmentPath) => [VIDEO_EXPORT_TEXT_I, segmentPath]);
  const prepared = _.map(segmentPaths, (_segmentPath, index) => VIDEO_EXPORT_TEMPLATE_V_SETTB_AVTB_FPS_FORMAT_S(`${index}`, `${profile.fps}`, `${VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT}`, `${index}`));
  const transitions = _.map(_.range(1, segmentPaths.length), (index) => {
    const previousLabel = index === 1 ? VIDEO_EXPORT_TEXT_S0 : VIDEO_EXPORT_TEMPLATE_X(`${index - 1}`);
    const outputLabel = index === segmentPaths.length - 1 ? VIDEO_EXPORT_TEXT_VOUT : VIDEO_EXPORT_TEMPLATE_X(`${index}`);
    const offset = (index * (plan.slideSeconds - plan.transitionSeconds)).toFixed(3);
    return VIDEO_EXPORT_TEMPLATE_S_XFADE_TRANSITION_DURATION_OFFSET(`${previousLabel}`, `${index}`, `${resolveTransition(transition, index - 1)}`, `${plan.transitionSeconds.toFixed(3)}`, `${offset}`, `${outputLabel}`);
  });
  const filter = _.join([...prepared, ...transitions], VIDEO_EXPORT_TEXT_SYMBOL_15);
  return [
    ...inputArgs,
    VIDEO_EXPORT_TEXT_I,
    audioPath,
    VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
    filter,
    VIDEO_EXPORT_TEXT_MAP,
    VIDEO_EXPORT_TEXT_VOUT,
    VIDEO_EXPORT_TEXT_MAP,
    VIDEO_EXPORT_TEMPLATE_A_2(`${segmentPaths.length}`),
    VIDEO_EXPORT_TEXT_C_V,
    profile.codec,
    VIDEO_EXPORT_TEXT_PRESET,
    profile.preset,
    VIDEO_EXPORT_TEXT_CRF,
    profile.crf,
    VIDEO_EXPORT_TEXT_PIX_FMT,
    VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT,
    VIDEO_EXPORT_TEXT_R,
    `${profile.fps}`,
    VIDEO_EXPORT_TEXT_C_A,
    VIDEO_EXPORT_TEXT_COPY,
    VIDEO_EXPORT_TEXT_SHORTEST,
    VIDEO_EXPORT_TEXT_MOVFLAGS,
    VIDEO_EXPORT_TEXT_FASTSTART,
    VIDEO_EXPORT_TEXT_Y,
    outputPath,
  ];
};
const removePathSafely = async (targetPath: string): Promise<void> => {
  try {
    await fs.promises.rm(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error: any) {
    logger.warn(VIDEO_EXPORT_LOG_MESSAGES.CLEANUP_WARN(targetPath, error?.message || ""));
  }
};
const toPercent = (base: number, weight: number, ratio: number): number => Math.round(base + weight * _.clamp(ratio, 0, 1));
export const renderVideoExport = async (params: RenderVideoExportParams): Promise<{ durationSeconds: number }> => {
  const { audioPaths, imagePaths, config, outputPath, tempDir, quality, signal, onProgress } = params;
  const isPreview = quality === VideoExportQuality.PREVIEW;
  const profile = resolveEncodeProfile(config, quality);
  const notify = (stage: VideoExportJobStage, percent: number, message: string) => onProgress?.(stage, _.clamp(percent, 0, 100), message);
  const audioWeight = VIDEO_EXPORT_CONSTANTS.PROGRESS_WEIGHT_AUDIO;
  const segmentWeight = VIDEO_EXPORT_CONSTANTS.PROGRESS_WEIGHT_SEGMENTS;
  const mergeWeight = VIDEO_EXPORT_CONSTANTS.PROGRESS_WEIGHT_MERGE;
  let completed = false;
  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    notify(VideoExportJobStage.PREPARING, 0, VIDEO_EXPORT_SERVER_TEXTS.MSG_PREPARING);
    const audioOutputPath = path.join(tempDir, VIDEO_EXPORT_CONSTANTS.AUDIO_FILE_NAME);
    const sourceAudioPaths = isPreview ? _.take(audioPaths, 1) : audioPaths;
    const audioLimit = isPreview ? VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_SECONDS : undefined;
    const knownDurations = await Promise.all(_.map(sourceAudioPaths, probeMediaDurationSeconds));
    const expectedAudioSeconds = Math.min(_.sum(knownDurations), audioLimit ?? Number.POSITIVE_INFINITY);
    notify(VideoExportJobStage.AUDIO, 0, VIDEO_EXPORT_SERVER_TEXTS.MSG_AUDIO);
    await runFfmpeg(buildAudioArgs(sourceAudioPaths, audioOutputPath, audioLimit), { signal, onProgressSeconds: (seconds) => notify(VideoExportJobStage.AUDIO, toPercent(0, audioWeight, expectedAudioSeconds > 0 ? seconds / expectedAudioSeconds : 0), VIDEO_EXPORT_SERVER_TEXTS.MSG_AUDIO) });
    throwIfAborted(signal);
    const totalSeconds = (await probeMediaDurationSeconds(audioOutputPath)) || expectedAudioSeconds;
    if (!(totalSeconds > 0)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_AUDIO_DURATION);
    const sourceImagePaths = isPreview ? _.take(imagePaths, VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_IMAGES) : imagePaths;
    const planConfig = isPreview ? { ...config, slideMode: VideoExportSlideMode.EVEN } : config;
    const plan = computeVideoExportSlidePlan(totalSeconds, sourceImagePaths.length, planConfig);
    const segmentPaths: string[] = [];
    for (const index of _.range(plan.segmentCount)) {
      throwIfAborted(signal);
      const segmentPath = path.join(tempDir, `${VIDEO_EXPORT_CONSTANTS.SEGMENT_PREFIX}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
      const message = VIDEO_EXPORT_SERVER_TEXTS.MSG_SEGMENTS(index + 1, plan.segmentCount);
      const imagePath = sourceImagePaths[index % sourceImagePaths.length];
      const isVertical916 = config.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16;
      await runFfmpeg(buildSegmentArgs(imagePath, resolveEffect(config.effect, index), plan.slideSeconds, profile, segmentPath, isVertical916, config.reframeMode), { signal, onProgressSeconds: (seconds) => notify(VideoExportJobStage.SEGMENTS, toPercent(audioWeight, segmentWeight, (index + seconds / plan.slideSeconds) / plan.segmentCount), message) });
      segmentPaths.push(segmentPath);
    }
    throwIfAborted(signal);
    notify(VideoExportJobStage.MERGING, audioWeight + segmentWeight, VIDEO_EXPORT_SERVER_TEXTS.MSG_MERGING);
    const onMergeProgress = (seconds: number) => notify(VideoExportJobStage.MERGING, toPercent(audioWeight + segmentWeight, mergeWeight, seconds / totalSeconds), VIDEO_EXPORT_SERVER_TEXTS.MSG_MERGING);
    if (plan.transitionSeconds > 0 && segmentPaths.length > 1) {
      await runFfmpeg(buildXfadeMergeArgs(segmentPaths, audioOutputPath, plan, config.transition, profile, outputPath), { signal, onProgressSeconds: onMergeProgress });
    } else {
      const listPath = path.join(tempDir, VIDEO_EXPORT_CONSTANTS.CONCAT_LIST_FILE_NAME);
      await fs.promises.writeFile(
        listPath,
        _.join(
          _.map(segmentPaths, (segmentPath) => VIDEO_EXPORT_TEMPLATE_FILE(`${escapeConcatPath(segmentPath)}`)),
          RT_SHARED.SYMBOL_01BA47,
        ),
        VIDEO_EXPORT_TEXT_UTF8,
      );
      await runFfmpeg(buildConcatMergeArgs(listPath, audioOutputPath, outputPath), { signal, onProgressSeconds: onMergeProgress });
    }
    throwIfAborted(signal);
    const durationSeconds = (await probeMediaDurationSeconds(outputPath)) || totalSeconds;
    notify(VideoExportJobStage.DONE, 100, VIDEO_EXPORT_SERVER_TEXTS.MSG_DONE);
    completed = true;
    return { durationSeconds };
  } finally {
    await removePathSafely(tempDir);
    if (!completed) await removePathSafely(outputPath);
  }
};
export type MultiPreviewOutputItem = { aspectRatio: VideoExportAspectRatio; outputPath: string };
export type RenderMultiPreviewParams = { audioPaths: string[]; imagePaths: string[]; config: VideoExportConfig; outputs: MultiPreviewOutputItem[]; tempDir: string; signal?: AbortSignal };
export const renderVideoExportMultiPreviews = async (params: RenderMultiPreviewParams): Promise<Record<string, { durationSeconds: number }>> => {
  const { audioPaths, imagePaths, config, outputs, tempDir, signal } = params;
  const completedOutputs: string[] = [];
  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    for (const item of outputs) {
      await fs.promises.mkdir(path.dirname(item.outputPath), { recursive: true });
    }
    const audioOutputPath = path.join(tempDir, VIDEO_EXPORT_CONSTANTS.AUDIO_FILE_NAME);
    const sourceAudioPaths = _.take(audioPaths, 1);
    const audioLimit = VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_SECONDS;
    const knownDurations = await Promise.all(_.map(sourceAudioPaths, probeMediaDurationSeconds));
    const expectedAudioSeconds = Math.min(_.sum(knownDurations), audioLimit ?? Number.POSITIVE_INFINITY);
    await runFfmpeg(buildAudioArgs(sourceAudioPaths, audioOutputPath, audioLimit), { signal });
    throwIfAborted(signal);
    const totalSeconds = (await probeMediaDurationSeconds(audioOutputPath)) || expectedAudioSeconds;
    if (!(totalSeconds > 0)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_AUDIO_DURATION);
    const sourceImagePaths = _.take(imagePaths, VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_IMAGES);
    const plan = computeVideoExportSlidePlan(totalSeconds, sourceImagePaths.length, { ...config, slideMode: VideoExportSlideMode.EVEN });
    const results: Record<string, { durationSeconds: number }> = {};
    await Promise.all(
      _.map(outputs, async (item) => {
        const aspectKey = _.replace(item.aspectRatio, /[:/\\]/g, VIDEO_EXPORT_TEXT_SYMBOL_11);
        const aspectTempDir = path.join(tempDir, aspectKey);
        await fs.promises.mkdir(aspectTempDir, { recursive: true });
        const aspectConfig = { ...config, aspectRatio: item.aspectRatio };
        const profile = resolveEncodeProfile(aspectConfig, VideoExportQuality.PREVIEW);
        const isVertical916 = item.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16;
        const segmentPaths: string[] = [];
        for (const index of _.range(plan.segmentCount)) {
          throwIfAborted(signal);
          const segmentPath = path.join(aspectTempDir, `${VIDEO_EXPORT_CONSTANTS.SEGMENT_PREFIX}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
          const imagePath = sourceImagePaths[index % sourceImagePaths.length];
          await runFfmpeg(buildSegmentArgs(imagePath, resolveEffect(config.effect, index), plan.slideSeconds, profile, segmentPath, isVertical916, config.reframeMode), { signal });
          segmentPaths.push(segmentPath);
        }
        throwIfAborted(signal);
        if (plan.transitionSeconds > 0 && segmentPaths.length > 1) {
          await runFfmpeg(buildXfadeMergeArgs(segmentPaths, audioOutputPath, plan, config.transition, profile, item.outputPath), { signal });
        } else {
          const listPath = path.join(aspectTempDir, VIDEO_EXPORT_CONSTANTS.CONCAT_LIST_FILE_NAME);
          await fs.promises.writeFile(
            listPath,
            _.join(
              _.map(segmentPaths, (segmentPath) => VIDEO_EXPORT_TEMPLATE_FILE(`${escapeConcatPath(segmentPath)}`)),
              RT_SHARED.SYMBOL_01BA47,
            ),
            VIDEO_EXPORT_TEXT_UTF8,
          );
          await runFfmpeg(buildConcatMergeArgs(listPath, audioOutputPath, item.outputPath), { signal });
        }
        throwIfAborted(signal);
        const durationSeconds = (await probeMediaDurationSeconds(item.outputPath)) || totalSeconds;
        completedOutputs.push(item.outputPath);
        results[item.aspectRatio] = { durationSeconds };
      }),
    );
    return results;
  } finally {
    await removePathSafely(tempDir);
    const uncompleted = _.difference(
      _.map(outputs, (o) => o.outputPath),
      completedOutputs,
    );
    await Promise.all(_.map(uncompleted, removePathSafely));
  }
};
