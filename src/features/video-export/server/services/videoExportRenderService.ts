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
  VIDEO_EXPORT_TEMPLATE_A_ARESAMPLE_AFORMAT_SAMPLE_FMTS_FLTP,
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
  VIDEO_EXPORT_TEMPLATE_X,
  VIDEO_EXPORT_TEMPLATE_ZOOMPAN_Z_X_Y_D_S,
  VIDEO_EXPORT_TEXT_0,
  VIDEO_EXPORT_TEXT_0_V,
  VIDEO_EXPORT_TEXT_1,
  VIDEO_EXPORT_TEXT_1_A,
  VIDEO_EXPORT_TEXT_ABORT,
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
import { createHash } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { probeMediaDurationSeconds, probeMediaHasAudio, runFfmpeg, throwIfAborted } from "./videoExportFfmpegService.js";
import { logger } from "../../../../lib/logger.js";
import { computeVideoExportSlidePlan } from "../../lib/videoExportPlan.js";
import { VIDEO_EXPORT_BITRATE_CRF, VIDEO_EXPORT_CODEC_MAP, VIDEO_EXPORT_CONSTANTS, VIDEO_EXPORT_LOG_MESSAGES, VIDEO_EXPORT_PREVIEW_DIMENSIONS, VIDEO_EXPORT_REGEX, VIDEO_EXPORT_RESOLUTIONS, VIDEO_EXPORT_SERVER_TEXTS } from "../../constants/videoExport.js";
import { ShortsReframeMode } from "../../../../types/shorts.js";
import { VIDEO_EXPORT_SPEED } from "../../constants/videoExportSpeed.js";
import { runVideoExportLanes, videoExportRenderLanes } from "../../lib/videoExportLanes.js";
import { VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_FILTERS, VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS } from "../../constants/videoExportAiClip.js";
import { VideoExportAspectRatio, VideoExportConfig, VideoExportEffect, VideoExportJobStage, VideoExportResolution, VideoExportSlideMode, VideoExportTransition } from "../../types/videoExport.js";
export { VideoExportQuality };
type EncodeProfile = { width: number; height: number; fps: number; preset: string; crf: string; codec: string };
export type VideoExportProgressHandler = (stage: VideoExportJobStage, percent: number, message: string) => void;
export type RenderVideoExportParams = { audioPaths: string[]; imagePaths: string[]; aiClipPaths?: string[]; aiClipKeepAudio?: boolean[]; config: VideoExportConfig; outputPath: string; tempDir: string; quality: VideoExportQuality; signal?: AbortSignal; onProgress?: VideoExportProgressHandler };
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
const buildSegmentArgs = (imagePath: string, effect: VideoExportEffect, seconds: number, profile: EncodeProfile, outputPath: string, isVertical916?: boolean, reframeMode?: ShortsReframeMode, extraEncodeArgs: string[] = []): string[] => {
  const { width, height, fps, preset, crf } = profile;
  const frames = Math.max(1, Math.round(seconds * fps));
  const pixelFormat = VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT;
  const encodeArgs = [VIDEO_EXPORT_TEXT_T, seconds.toFixed(3), VIDEO_EXPORT_TEXT_R, `${fps}`, VIDEO_EXPORT_TEXT_C_V, profile.codec, VIDEO_EXPORT_TEXT_PRESET, preset, VIDEO_EXPORT_TEXT_CRF, crf, VIDEO_EXPORT_TEXT_PIX_FMT, pixelFormat, ...extraEncodeArgs, VIDEO_EXPORT_TEXT_AN, VIDEO_EXPORT_TEXT_Y, outputPath];
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
const buildSingleTrackNormalizeArgs = (inputPath: string, outputPath: string): string[] => [
  VIDEO_EXPORT_TEXT_I,
  inputPath,
  VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
  `${VIDEO_EXPORT_TEMPLATE_A_ARESAMPLE_AFORMAT_SAMPLE_FMTS_FLTP("0", `${VIDEO_EXPORT_CONSTANTS.AUDIO_SAMPLE_RATE}`, "out")}`,
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_TEXT_AOUT,
  VIDEO_EXPORT_TEXT_VN,
  VIDEO_EXPORT_TEXT_C_A,
  VIDEO_EXPORT_CONSTANTS.AUDIO_CODEC,
  VIDEO_EXPORT_TEXT_B_A,
  VIDEO_EXPORT_CONSTANTS.AUDIO_BITRATE,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildAudioConcatCopyArgs = (listPath: string, outputPath: string): string[] => [
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.FFLAGS,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.GENPTS,
  VIDEO_EXPORT_TEXT_F,
  VIDEO_EXPORT_TEXT_CONCAT,
  VIDEO_EXPORT_TEXT_SAFE,
  VIDEO_EXPORT_TEXT_0,
  VIDEO_EXPORT_TEXT_I,
  listPath,
  VIDEO_EXPORT_TEXT_VN,
  VIDEO_EXPORT_TEXT_C_A,
  VIDEO_EXPORT_TEXT_COPY,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const getAudioCacheDirectory = (): string => path.join(getDataDirectory(), VIDEO_EXPORT_CONSTANTS.OUTPUT_FOLDER, VIDEO_EXPORT_CONSTANTS.EXPORT_FOLDER, VIDEO_EXPORT_AI_CLIP_CONSTANTS.AUDIO_CACHE_FOLDER);
const prepareConcatenatedAudio = async (audioPaths: string[], outputPath: string, workDir: string, signal?: AbortSignal, onProgressRatio?: (ratio: number) => void): Promise<number> => {
  const cacheDir = getAudioCacheDirectory();
  await fs.promises.mkdir(cacheDir, { recursive: true });
  const stats = await Promise.all(_.map(audioPaths, (audioPath) => fs.promises.stat(audioPath)));
  const cachedPaths = _.map(audioPaths, (audioPath, index) => {
    const stat = stats[index];
    const hash = createHash("sha1").update(`${audioPath}|${stat.size}|${stat.mtimeMs}`).digest("hex");
    return path.join(cacheDir, `${hash}${VIDEO_EXPORT_CONSTANTS.EXT_M4A}`);
  });
  const totalTracks = audioPaths.length;
  let completedTracks = 0;
  const audioLanes = Math.max(1, Math.min(8, os.cpus().length, totalTracks));
  const laneAbort = createLinkedAbort(signal);
  await runVideoExportLanes(audioPaths, audioLanes, async (audioPath, index) => {
    const cachedPath = cachedPaths[index];
    const exists = await fs.promises.access(cachedPath).then(
      () => true,
      () => false,
    );
    if (!exists) {
      const tempCachePath = path.join(workDir, `track_${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_M4A}`);
      await runFfmpeg(buildSingleTrackNormalizeArgs(audioPath, tempCachePath), { signal: laneAbort.signal }).catch((error) => {
        laneAbort.abort();
        throw error;
      });
      await fs.promises.copyFile(tempCachePath, cachedPath).catch(() => undefined);
    }
    completedTracks += 1;
    onProgressRatio?.(completedTracks / totalTracks);
  });
  throwIfAborted(signal);
  if (cachedPaths.length === 1) {
    await fs.promises.copyFile(cachedPaths[0], outputPath);
  } else {
    const listPath = path.join(workDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.AUDIO_CONCAT_LIST_FILE_NAME);
    await writeConcatList(listPath, cachedPaths);
    await runFfmpeg(buildAudioConcatCopyArgs(listPath, outputPath), { signal });
  }
  const totalSeconds = await probeMediaDurationSeconds(outputPath);
  if (totalSeconds > 0) return totalSeconds;
  const individualDurations = await Promise.all(_.map(cachedPaths, probeMediaDurationSeconds));
  return _.sum(individualDurations);
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
const buildAiClipNormalizeArgs = (clipPath: string, clipIndex: number, frames: number, transitionFrames: number, hasTransitions: boolean, config: VideoExportConfig, profile: EncodeProfile, outputPath: string): string[] => {
  const { width, height, fps, preset, crf } = profile;
  const pixelFormat = VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT;
  const isVertical916 = config.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16;
  const visualFilter = buildVisualPostFilter(resolveEffect(config.effect, clipIndex));
  const keyframeArgs = hasTransitions ? [VIDEO_EXPORT_SPEED.FORCE_KEY_FRAMES, VIDEO_EXPORT_SPEED.KEYFRAMES(transitionFrames, frames - transitionFrames), VIDEO_EXPORT_SPEED.FORCED_IDR, VIDEO_EXPORT_SPEED.FLAG_ON] : [];
  const encodeArgs = [VIDEO_EXPORT_SPEED.FRAMES_V, `${frames}`, VIDEO_EXPORT_TEXT_R, `${fps}`, VIDEO_EXPORT_TEXT_C_V, profile.codec, VIDEO_EXPORT_TEXT_PRESET, preset, VIDEO_EXPORT_TEXT_CRF, crf, VIDEO_EXPORT_TEXT_PIX_FMT, pixelFormat, ...keyframeArgs, VIDEO_EXPORT_TEXT_AN, VIDEO_EXPORT_TEXT_Y, outputPath];
  if (isVertical916 && (config.reframeMode ?? ShortsReframeMode.BLUR_BACKGROUND) === ShortsReframeMode.BLUR_BACKGROUND) {
    const postFilter = `${visualFilter ? VIDEO_EXPORT_TEMPLATE_SYMBOL_10(visualFilter) : ""},${VIDEO_EXPORT_AI_CLIP_FILTERS.FPS(fps)}`;
    const filterComplex = VIDEO_EXPORT_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT(`${width}`, `${height}`, `${width}`, `${height}`, `${width}`, `${height}`, postFilter, `${pixelFormat}`);
    return [VIDEO_EXPORT_TEXT_I, clipPath, VIDEO_EXPORT_TEXT_FILTER_COMPLEX, filterComplex, VIDEO_EXPORT_TEXT_MAP, VIDEO_EXPORT_TEXT_VOUT, ...encodeArgs];
  }
  const filters = [buildCoverFilter(width, height)];
  if (visualFilter) filters.push(visualFilter);
  filters.push(VIDEO_EXPORT_AI_CLIP_FILTERS.FPS(fps), VIDEO_EXPORT_TEXT_SETSAR_1, VIDEO_EXPORT_TEMPLATE_FORMAT(`${pixelFormat}`));
  return [VIDEO_EXPORT_TEXT_I, clipPath, VIDEO_EXPORT_TEXT_VF, _.join(filters, VIDEO_EXPORT_TEXT_SYMBOL_14), ...encodeArgs];
};
const buildAiClipAudioExtractArgs = (clipPath: string, durationSeconds: number, keepAudio: boolean, outputPath: string): string[] => {
  const sampleRate = VIDEO_EXPORT_CONSTANTS.AUDIO_SAMPLE_RATE;
  if (!keepAudio) {
    return [VIDEO_EXPORT_TEXT_F, VIDEO_EXPORT_AI_CLIP_CONSTANTS.LAVFI, VIDEO_EXPORT_TEXT_I, VIDEO_EXPORT_AI_CLIP_FILTERS.SILENCE_SOURCE(sampleRate), VIDEO_EXPORT_TEXT_T, durationSeconds.toFixed(6), VIDEO_EXPORT_TEXT_VN, VIDEO_EXPORT_TEXT_C_A, VIDEO_EXPORT_CONSTANTS.AUDIO_CODEC, VIDEO_EXPORT_TEXT_B_A, VIDEO_EXPORT_CONSTANTS.AUDIO_BITRATE, VIDEO_EXPORT_TEXT_Y, outputPath];
  }
  const fadeSeconds = Math.min(VIDEO_EXPORT_AI_CLIP_CONSTANTS.AUDIO_FADE_SECONDS, durationSeconds * 0.2);
  const filter = VIDEO_EXPORT_AI_CLIP_FILTERS.CLIP_AUDIO(sampleRate, durationSeconds, durationSeconds - fadeSeconds, fadeSeconds);
  return [VIDEO_EXPORT_TEXT_I, clipPath, VIDEO_EXPORT_TEXT_FILTER_COMPLEX, `[0:a]${filter}${VIDEO_EXPORT_TEXT_AOUT}`, VIDEO_EXPORT_TEXT_MAP, VIDEO_EXPORT_TEXT_AOUT, VIDEO_EXPORT_TEXT_T, durationSeconds.toFixed(6), VIDEO_EXPORT_TEXT_VN, VIDEO_EXPORT_TEXT_C_A, VIDEO_EXPORT_CONSTANTS.AUDIO_CODEC, VIDEO_EXPORT_TEXT_B_A, VIDEO_EXPORT_CONSTANTS.AUDIO_BITRATE, VIDEO_EXPORT_TEXT_Y, outputPath];
};
const buildAiClipAudioLoopMixArgs = (cycleAudioPath: string, musicAudioPath: string, totalSeconds: number, outputPath: string): string[] => [
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.FFLAGS,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.GENPTS,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.STREAM_LOOP,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.LOOP_FOREVER,
  VIDEO_EXPORT_TEXT_I,
  cycleAudioPath,
  VIDEO_EXPORT_TEXT_I,
  musicAudioPath,
  VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
  VIDEO_EXPORT_AI_CLIP_FILTERS.AMIX_TWO,
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_TEXT_AOUT,
  VIDEO_EXPORT_TEXT_T,
  totalSeconds.toFixed(3),
  VIDEO_EXPORT_TEXT_VN,
  VIDEO_EXPORT_TEXT_C_A,
  VIDEO_EXPORT_CONSTANTS.AUDIO_CODEC,
  VIDEO_EXPORT_TEXT_B_A,
  VIDEO_EXPORT_CONSTANTS.AUDIO_BITRATE,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildAiClipCycleXfadeArgs = (normalizedPaths: string[], clipFrames: number[], transitionFrames: number, transition: VideoExportTransition, profile: EncodeProfile, outputPath: string): string[] => {
  const inputArgs = _.flatMap(normalizedPaths, (normalizedPath) => [VIDEO_EXPORT_TEXT_I, normalizedPath]);
  const pixelFormat = VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT;
  const { fps } = profile;
  const transitionSeconds = transitionFrames / fps;
  const prepared: string[] = [
    VIDEO_EXPORT_AI_CLIP_FILTERS.TRIM_VIDEO_SEGMENT(0, transitionFrames, clipFrames[0], fps, pixelFormat, 0),
    ..._.map(_.range(1, normalizedPaths.length), (index) => VIDEO_EXPORT_AI_CLIP_FILTERS.TRIM_VIDEO_SEGMENT(index, 0, clipFrames[index], fps, pixelFormat, index)),
    VIDEO_EXPORT_AI_CLIP_FILTERS.TRIM_VIDEO_SEGMENT(0, 0, transitionFrames, fps, pixelFormat, normalizedPaths.length),
  ];
  const segmentDurations: number[] = [
    (clipFrames[0] - transitionFrames) / fps,
    ..._.map(_.range(1, normalizedPaths.length), (index) => clipFrames[index] / fps),
    transitionSeconds,
  ];
  let cumulativeOffset = 0;
  const totalStreams = normalizedPaths.length + 1;
  const transitions = _.map(_.range(1, totalStreams), (index) => {
    cumulativeOffset += segmentDurations[index - 1] - transitionSeconds;
    const previousLabel = index === 1 ? VIDEO_EXPORT_TEXT_S0 : VIDEO_EXPORT_TEMPLATE_X(`${index - 1}`);
    const outputLabel = index === totalStreams - 1 ? VIDEO_EXPORT_TEXT_VOUT : VIDEO_EXPORT_TEMPLATE_X(`${index}`);
    return VIDEO_EXPORT_TEMPLATE_S_XFADE_TRANSITION_DURATION_OFFSET(`${previousLabel}`, `${index}`, `${resolveTransition(transition, index - 1)}`, `${transitionSeconds.toFixed(3)}`, `${Math.max(0.05, cumulativeOffset).toFixed(3)}`, `${outputLabel}`);
  });
  const filter = _.join([...prepared, ...transitions], VIDEO_EXPORT_TEXT_SYMBOL_15);
  return [
    ...inputArgs,
    VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
    filter,
    VIDEO_EXPORT_TEXT_MAP,
    VIDEO_EXPORT_TEXT_VOUT,
    VIDEO_EXPORT_TEXT_C_V,
    profile.codec,
    VIDEO_EXPORT_TEXT_PRESET,
    profile.preset,
    VIDEO_EXPORT_TEXT_CRF,
    profile.crf,
    VIDEO_EXPORT_TEXT_PIX_FMT,
    pixelFormat,
    VIDEO_EXPORT_TEXT_R,
    `${fps}`,
    VIDEO_EXPORT_TEXT_AN,
    VIDEO_EXPORT_TEXT_Y,
    outputPath,
  ];
};
const buildAiClipSingleMuxArgs = (videoPath: string, audioPath: string, totalSeconds: number, outputPath: string): string[] => [
  VIDEO_EXPORT_TEXT_I,
  videoPath,
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
  VIDEO_EXPORT_TEXT_T,
  totalSeconds.toFixed(3),
  VIDEO_EXPORT_TEXT_SHORTEST,
  VIDEO_EXPORT_TEXT_MOVFLAGS,
  VIDEO_EXPORT_TEXT_FASTSTART,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildStreamLoopMuxArgs = (cycleVideoPath: string, audioPath: string, totalSeconds: number, outputPath: string): string[] => [
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.FFLAGS,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.GENPTS,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.STREAM_LOOP,
  VIDEO_EXPORT_AI_CLIP_CONSTANTS.LOOP_FOREVER,
  VIDEO_EXPORT_TEXT_I,
  cycleVideoPath,
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
  VIDEO_EXPORT_TEXT_T,
  totalSeconds.toFixed(3),
  VIDEO_EXPORT_TEXT_SHORTEST,
  VIDEO_EXPORT_TEXT_MOVFLAGS,
  VIDEO_EXPORT_TEXT_FASTSTART,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
type AiClipRenderParams = { clipPaths: string[]; clipKeepAudio?: boolean[]; audioPath: string; totalSeconds: number; config: VideoExportConfig; profile: EncodeProfile; workDir: string; outputPath: string; signal?: AbortSignal; onNormalize?: (index: number) => void; onLoopSeconds?: (seconds: number) => void };
const renderAiClipOutput = async (params: AiClipRenderParams): Promise<void> => {
  const { clipPaths, clipKeepAudio = [], audioPath, totalSeconds, config, profile, workDir, outputPath, signal, onNormalize, onLoopSeconds } = params;
  const [probedDurations, probedHasAudio] = await Promise.all([
    Promise.all(_.map(clipPaths, probeMediaDurationSeconds)),
    Promise.all(_.map(clipPaths, probeMediaHasAudio)),
  ]);
  throwIfAborted(signal);
  const rawClipSeconds = _.map(probedDurations, (sec) => (sec >= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MIN_CLIP_SECONDS ? sec : VIDEO_EXPORT_AI_CLIP_CONSTANTS.DEFAULT_CLIP_SECONDS));
  const effectiveKeepAudio = _.map(clipPaths, (_clipPath, index) => Boolean(clipKeepAudio[index]) && Boolean(probedHasAudio[index]));
  const anyKeepAudio = _.some(effectiveKeepAudio, Boolean);
  const minClipSeconds = _.min(rawClipSeconds) ?? VIDEO_EXPORT_AI_CLIP_CONSTANTS.DEFAULT_CLIP_SECONDS;
  const desiredTransitionSeconds = config.transition === VideoExportTransition.NONE ? VIDEO_EXPORT_AI_CLIP_CONSTANTS.DEFAULT_CROSSFADE_SECONDS : config.transitionSeconds;
  const clampedTransitionSeconds = _.clamp(desiredTransitionSeconds, VIDEO_EXPORT_AI_CLIP_CONSTANTS.MIN_CROSSFADE_SECONDS, Math.min(VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_CROSSFADE_SECONDS, minClipSeconds * VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_CROSSFADE_CLIP_RATIO));
  const transitionFrames = Math.max(2, Math.round(clampedTransitionSeconds * profile.fps));
  const actualTransitionSeconds = transitionFrames / profile.fps;
  const actualTransition = config.transition === VideoExportTransition.NONE ? VideoExportTransition.FADE : config.transition;
  const clipFrames = _.map(rawClipSeconds, (sec) => Math.max(transitionFrames * 3, Math.round(sec * profile.fps)));
  const clipSeconds = _.map(clipFrames, (frames) => frames / profile.fps);
  const needsLoopOrTransition = clipPaths.length > 1 || totalSeconds > clipSeconds[0] + 0.05;
  const normalizedPaths: string[] = [];
  for (const [index, clipPath] of clipPaths.entries()) {
    throwIfAborted(signal);
    onNormalize?.(index);
    const normalizedPath = path.join(workDir, `${VIDEO_EXPORT_AI_CLIP_CONSTANTS.NORMALIZED_PREFIX}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
    await runFfmpeg(buildAiClipNormalizeArgs(clipPath, index, clipFrames[index], transitionFrames, needsLoopOrTransition, config, profile, normalizedPath), { signal });
    normalizedPaths.push(normalizedPath);
  }
  throwIfAborted(signal);
  let finalAudioPath = audioPath;
  if (anyKeepAudio) {
    const clipAudioPaths: string[] = [];
    for (const [index, clipPath] of clipPaths.entries()) {
      throwIfAborted(signal);
      const stepSeconds = needsLoopOrTransition ? Math.max(0.5, clipSeconds[index] - actualTransitionSeconds) : clipSeconds[index];
      const clipAudioPath = path.join(workDir, `${VIDEO_EXPORT_AI_CLIP_CONSTANTS.NORMALIZED_AUDIO_PREFIX}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_M4A}`);
      await runFfmpeg(buildAiClipAudioExtractArgs(clipPath, stepSeconds, effectiveKeepAudio[index], clipAudioPath), { signal });
      clipAudioPaths.push(clipAudioPath);
    }
    let cycleAudioPath = clipAudioPaths[0];
    if (clipAudioPaths.length > 1) {
      const audioListPath = path.join(workDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.AUDIO_LIST_FILE_NAME);
      await writeConcatList(audioListPath, clipAudioPaths);
      cycleAudioPath = path.join(workDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.CYCLE_AUDIO_FILE_NAME);
      await runFfmpeg(buildAudioConcatCopyArgs(audioListPath, cycleAudioPath), { signal });
    }
    const mixedAudioPath = path.join(workDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.MIXED_AUDIO_FILE_NAME);
    await runFfmpeg(buildAiClipAudioLoopMixArgs(cycleAudioPath, audioPath, totalSeconds, mixedAudioPath), { signal });
    finalAudioPath = mixedAudioPath;
  }
  throwIfAborted(signal);
  if (!needsLoopOrTransition) {
    await runFfmpeg(buildAiClipSingleMuxArgs(normalizedPaths[0], finalAudioPath, totalSeconds, outputPath), { signal, onProgressSeconds: onLoopSeconds });
    return;
  }
  const cycleVideoPath = path.join(workDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.CYCLE_VIDEO_FILE_NAME);
  await runFfmpeg(buildAiClipCycleXfadeArgs(normalizedPaths, clipFrames, transitionFrames, actualTransition, profile, cycleVideoPath), { signal });
  throwIfAborted(signal);
  await runFfmpeg(buildStreamLoopMuxArgs(cycleVideoPath, finalAudioPath, totalSeconds, outputPath), { signal, onProgressSeconds: onLoopSeconds });
};
const splitSegmentFrames = (totalSeconds: number, segmentCount: number, transitionFrames: number, fps: number): number[] => {
  const overlapFrames = (segmentCount - 1) * transitionFrames;
  const neededFrames = Math.ceil(totalSeconds * fps) + overlapFrames;
  const baseFrames = Math.floor(neededFrames / segmentCount);
  const extraFrames = neededFrames - baseFrames * segmentCount;
  return _.times(segmentCount, (index) => baseFrames + (index < extraFrames ? 1 : 0));
};
const buildPieceArgs = (segmentPath: string, startFrame: number, frameCount: number, fps: number, outputPath: string): string[] => [
  ...(startFrame > 0 ? [VIDEO_EXPORT_SPEED.SEEK, (startFrame / fps).toFixed(6)] : []),
  VIDEO_EXPORT_TEXT_I,
  segmentPath,
  VIDEO_EXPORT_SPEED.FRAMES_V,
  `${frameCount}`,
  VIDEO_EXPORT_TEXT_C_V,
  VIDEO_EXPORT_TEXT_COPY,
  VIDEO_EXPORT_TEXT_AN,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildTransitionArgs = (fromPath: string, fromFrames: number, toPath: string, transitionFrames: number, transition: VideoExportTransition, profile: EncodeProfile, threads: number, outputPath: string): string[] => [
  VIDEO_EXPORT_SPEED.SEEK,
  ((fromFrames - transitionFrames - VIDEO_EXPORT_SPEED.SEEK_BACK_FRAMES) / profile.fps).toFixed(6),
  VIDEO_EXPORT_TEXT_I,
  fromPath,
  VIDEO_EXPORT_TEXT_I,
  toPath,
  VIDEO_EXPORT_TEXT_FILTER_COMPLEX,
  VIDEO_EXPORT_SPEED.TRANSITION_FILTER(transitionFrames, profile.fps, VIDEO_EXPORT_CONSTANTS.PIXEL_FORMAT, transition, (transitionFrames / profile.fps).toFixed(6)),
  VIDEO_EXPORT_TEXT_MAP,
  VIDEO_EXPORT_SPEED.FILTER_OUTPUT,
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
  VIDEO_EXPORT_SPEED.THREADS,
  `${threads}`,
  VIDEO_EXPORT_TEXT_AN,
  VIDEO_EXPORT_TEXT_Y,
  outputPath,
];
const buildPiecePath = (tempDir: string, prefix: string, index: number): string => path.join(tempDir, `${prefix}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
const writeConcatList = async (listPath: string, filePaths: string[]): Promise<void> =>
  fs.promises.writeFile(
    listPath,
    _.join(
      _.map(filePaths, (filePath) => VIDEO_EXPORT_TEMPLATE_FILE(`${escapeConcatPath(filePath)}`)),
      RT_SHARED.SYMBOL_01BA47,
    ),
    VIDEO_EXPORT_TEXT_UTF8,
  );
const createLinkedAbort = (signal?: AbortSignal): AbortController => {
  const controller = new AbortController();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener(VIDEO_EXPORT_TEXT_ABORT, () => controller.abort(), { once: true });
  return controller;
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
  const { audioPaths, imagePaths, aiClipPaths = [], aiClipKeepAudio = [], config, outputPath, tempDir, quality, signal, onProgress } = params;
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
    notify(VideoExportJobStage.AUDIO, 0, VIDEO_EXPORT_SERVER_TEXTS.MSG_AUDIO);
    const totalSeconds = await prepareConcatenatedAudio(audioPaths, audioOutputPath, tempDir, signal, (ratio) => notify(VideoExportJobStage.AUDIO, toPercent(0, audioWeight, ratio), VIDEO_EXPORT_SERVER_TEXTS.MSG_AUDIO));
    throwIfAborted(signal);
    if (!(totalSeconds > 0)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_AUDIO_DURATION);
    if (!_.isEmpty(aiClipPaths)) {
      await renderAiClipOutput({
        clipPaths: aiClipPaths,
        clipKeepAudio: aiClipKeepAudio,
        audioPath: audioOutputPath,
        totalSeconds,
        config,
        profile,
        workDir: tempDir,
        outputPath,
        signal,
        onNormalize: (index) => notify(VideoExportJobStage.SEGMENTS, toPercent(audioWeight, segmentWeight, index / aiClipPaths.length), VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_NORMALIZING(index + 1, aiClipPaths.length)),
        onLoopSeconds: (seconds) => notify(VideoExportJobStage.MERGING, toPercent(audioWeight + segmentWeight, mergeWeight, seconds / totalSeconds), VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_LOOPING),
      });
      throwIfAborted(signal);
      const aiDurationSeconds = (await probeMediaDurationSeconds(outputPath)) || totalSeconds;
      notify(VideoExportJobStage.DONE, 100, VIDEO_EXPORT_SERVER_TEXTS.MSG_DONE);
      completed = true;
      return { durationSeconds: aiDurationSeconds };
    }
    const sourceImagePaths = isPreview ? _.take(imagePaths, VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_IMAGES) : imagePaths;
    const planConfig = isPreview ? { ...config, slideMode: VideoExportSlideMode.EVEN } : config;
    const plan = computeVideoExportSlidePlan(totalSeconds, sourceImagePaths.length, planConfig);
    const isVertical916 = config.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16;
    const transitionFrames = plan.segmentCount > 1 ? Math.round(plan.transitionSeconds * profile.fps) : 0;
    const segmentFrames = splitSegmentFrames(totalSeconds, plan.segmentCount, transitionFrames, profile.fps);
    const hasTransitions = transitionFrames > 0;
    const { lanes, threads } = videoExportRenderLanes(os.cpus().length, os.freemem(), plan.segmentCount, profile.width * profile.height);
    logger.log(VIDEO_EXPORT_SPEED.LANES_LOG(lanes, threads, plan.segmentCount));
    const laneAbort = createLinkedAbort(signal);
    const runLaneFfmpeg = (args: string[], onProgressSeconds?: (seconds: number) => void) =>
      runFfmpeg(args, { signal: laneAbort.signal, onProgressSeconds }).catch((error) => {
        laneAbort.abort();
        throw error;
      });
    const totalUnits = plan.segmentCount + (hasTransitions ? plan.segmentCount - 1 : 0);
    const unitProgress = _.times(totalUnits, _.constant(0));
    let finishedUnits = 0;
    const reportUnit = (unit: number, ratio: number, message: string) => {
      unitProgress[unit] = _.clamp(ratio, 0, 1);
      notify(VideoExportJobStage.SEGMENTS, toPercent(audioWeight, segmentWeight, _.sum(unitProgress) / totalUnits), message);
    };
    const segmentPaths = _.times(plan.segmentCount, (index) => buildPiecePath(tempDir, VIDEO_EXPORT_CONSTANTS.SEGMENT_PREFIX, index));
    await runVideoExportLanes(segmentPaths, lanes, async (segmentPath, index) => {
      const frames = segmentFrames[index];
      const keyframeArgs = hasTransitions ? [VIDEO_EXPORT_SPEED.FORCE_KEY_FRAMES, VIDEO_EXPORT_SPEED.KEYFRAMES(transitionFrames, frames - transitionFrames), VIDEO_EXPORT_SPEED.FORCED_IDR, VIDEO_EXPORT_SPEED.FLAG_ON] : [];
      const extraArgs = [VIDEO_EXPORT_SPEED.FRAMES_V, `${frames}`, VIDEO_EXPORT_SPEED.THREADS, `${threads}`, ...keyframeArgs];
      const imagePath = sourceImagePaths[index % sourceImagePaths.length];
      const seconds = frames / profile.fps;
      await runLaneFfmpeg(buildSegmentArgs(imagePath, resolveEffect(config.effect, index), seconds, profile, segmentPath, isVertical916, config.reframeMode, extraArgs), (done) => reportUnit(index, done / seconds, VIDEO_EXPORT_SERVER_TEXTS.MSG_SEGMENTS(finishedUnits + 1, plan.segmentCount)));
      finishedUnits += 1;
      reportUnit(index, 1, VIDEO_EXPORT_SERVER_TEXTS.MSG_SEGMENTS(finishedUnits, plan.segmentCount));
    });
    throwIfAborted(signal);
    let concatPaths = segmentPaths;
    if (hasTransitions) {
      const bodyPaths = _.times(plan.segmentCount, (index) => buildPiecePath(tempDir, VIDEO_EXPORT_SPEED.BODY_PREFIX, index));
      const transitionPaths = _.times(plan.segmentCount - 1, (index) => buildPiecePath(tempDir, VIDEO_EXPORT_SPEED.TRANSITION_PREFIX, index));
      let finishedTransitions = 0;
      await runVideoExportLanes(segmentPaths, lanes, async (segmentPath, index) => {
        const startFrame = index > 0 ? transitionFrames : 0;
        const endFrame = index < plan.segmentCount - 1 ? segmentFrames[index] - transitionFrames : segmentFrames[index];
        await runLaneFfmpeg(buildPieceArgs(segmentPath, startFrame, endFrame - startFrame, profile.fps, bodyPaths[index]));
        if (index >= plan.segmentCount - 1) return;
        await runLaneFfmpeg(buildTransitionArgs(segmentPath, segmentFrames[index], segmentPaths[index + 1], transitionFrames, resolveTransition(config.transition, index), profile, threads, transitionPaths[index]));
        finishedTransitions += 1;
        reportUnit(plan.segmentCount + index, 1, VIDEO_EXPORT_SPEED.MSG_TRANSITIONS(finishedTransitions, plan.segmentCount - 1));
      });
      throwIfAborted(signal);
      concatPaths = _.flatMap(bodyPaths, (bodyPath, index) => (index < transitionPaths.length ? [bodyPath, transitionPaths[index]] : [bodyPath]));
    }
    notify(VideoExportJobStage.MERGING, audioWeight + segmentWeight, VIDEO_EXPORT_SERVER_TEXTS.MSG_MERGING);
    const listPath = path.join(tempDir, hasTransitions ? VIDEO_EXPORT_SPEED.PIECES_FILE_NAME : VIDEO_EXPORT_CONSTANTS.CONCAT_LIST_FILE_NAME);
    await writeConcatList(listPath, concatPaths);
    await runFfmpeg(buildConcatMergeArgs(listPath, audioOutputPath, outputPath), { signal, onProgressSeconds: (seconds) => notify(VideoExportJobStage.MERGING, toPercent(audioWeight + segmentWeight, mergeWeight, seconds / totalSeconds), VIDEO_EXPORT_SERVER_TEXTS.MSG_MERGING) });
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
export type RenderMultiPreviewParams = { audioPaths: string[]; imagePaths: string[]; aiClipPaths?: string[]; aiClipKeepAudio?: boolean[]; config: VideoExportConfig; outputs: MultiPreviewOutputItem[]; tempDir: string; signal?: AbortSignal };
export const renderVideoExportMultiPreviews = async (params: RenderMultiPreviewParams): Promise<Record<string, { durationSeconds: number }>> => {
  const { audioPaths, imagePaths, aiClipPaths = [], aiClipKeepAudio = [], config, outputs, tempDir, signal } = params;
  const completedOutputs: string[] = [];
  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    for (const item of outputs) {
      await fs.promises.mkdir(path.dirname(item.outputPath), { recursive: true });
    }
    const audioOutputPath = path.join(tempDir, VIDEO_EXPORT_CONSTANTS.AUDIO_FILE_NAME);
    const totalSeconds = await prepareConcatenatedAudio(audioPaths, audioOutputPath, tempDir, signal);
    throwIfAborted(signal);
    if (!(totalSeconds > 0)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_AUDIO_DURATION);
    const sourceImagePaths = _.take(imagePaths, VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_IMAGES);
    const previewCycleSeconds = Math.min(totalSeconds, VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_SECONDS);
    const plan = computeVideoExportSlidePlan(previewCycleSeconds, sourceImagePaths.length, { ...config, slideMode: VideoExportSlideMode.EVEN });
    const results: Record<string, { durationSeconds: number }> = {};
    await Promise.all(
      _.map(outputs, async (item) => {
        const aspectKey = _.replace(item.aspectRatio, /[:/\\]/g, VIDEO_EXPORT_TEXT_SYMBOL_11);
        const aspectTempDir = path.join(tempDir, aspectKey);
        await fs.promises.mkdir(aspectTempDir, { recursive: true });
        const aspectConfig = { ...config, aspectRatio: item.aspectRatio };
        const profile = resolveEncodeProfile(aspectConfig, VideoExportQuality.PREVIEW);
        const isVertical916 = item.aspectRatio === VideoExportAspectRatio.VERTICAL_9_16;
        if (!_.isEmpty(aiClipPaths)) {
          await renderAiClipOutput({ clipPaths: aiClipPaths, clipKeepAudio: aiClipKeepAudio, audioPath: audioOutputPath, totalSeconds, config: aspectConfig, profile, workDir: aspectTempDir, outputPath: item.outputPath, signal });
          throwIfAborted(signal);
          completedOutputs.push(item.outputPath);
          results[item.aspectRatio] = { durationSeconds: (await probeMediaDurationSeconds(item.outputPath)) || totalSeconds };
          return;
        }
        const segmentPaths: string[] = [];
        for (const index of _.range(plan.segmentCount)) {
          throwIfAborted(signal);
          const segmentPath = path.join(aspectTempDir, `${VIDEO_EXPORT_CONSTANTS.SEGMENT_PREFIX}${_.padStart(`${index}`, 4, VIDEO_EXPORT_TEXT_0)}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
          const imagePath = sourceImagePaths[index % sourceImagePaths.length];
          await runFfmpeg(buildSegmentArgs(imagePath, resolveEffect(config.effect, index), plan.slideSeconds, profile, segmentPath, isVertical916, config.reframeMode), { signal });
          segmentPaths.push(segmentPath);
        }
        throwIfAborted(signal);
        const transitionFrames = Math.max(2, Math.round((plan.transitionSeconds > 0 ? plan.transitionSeconds : VIDEO_EXPORT_AI_CLIP_CONSTANTS.DEFAULT_CROSSFADE_SECONDS) * profile.fps));
        const segmentFrames = _.map(segmentPaths, () => Math.max(transitionFrames * 3, Math.round(plan.slideSeconds * profile.fps)));
        const actualTransition = config.transition === VideoExportTransition.NONE ? VideoExportTransition.FADE : config.transition;
        const cycleVideoPath = path.join(aspectTempDir, VIDEO_EXPORT_AI_CLIP_CONSTANTS.CYCLE_VIDEO_FILE_NAME);
        await runFfmpeg(buildAiClipCycleXfadeArgs(segmentPaths, segmentFrames, transitionFrames, actualTransition, profile, cycleVideoPath), { signal });
        throwIfAborted(signal);
        await runFfmpeg(buildStreamLoopMuxArgs(cycleVideoPath, audioOutputPath, totalSeconds, item.outputPath), { signal });
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
