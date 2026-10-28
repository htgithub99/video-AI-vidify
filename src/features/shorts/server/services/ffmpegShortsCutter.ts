import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import {
  SOURCE_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT,
  SOURCE_TEMPLATE_CLIP,
  SOURCE_TEMPLATE_CROP_IH_9_16_IH_IW,
  SOURCE_TEMPLATE_CROP_MIN_IW_IH_MIN_IW,
  SOURCE_TEMPLATE_SCALE_FORCE_ORIGINAL_ASPECT_RATIO_DECREASE,
  SOURCE_TEMPLATE_SHORT_2,
  SOURCE_TEXT_1,
  SOURCE_TEXT_2,
  SOURCE_TEXT_ABORT,
  SOURCE_TEXT_B_A,
  SOURCE_TEXT_CRF,
  SOURCE_TEXT_C_A,
  SOURCE_TEXT_C_V,
  SOURCE_TEXT_FASTSTART,
  SOURCE_TEXT_FILTER_COMPLEX,
  SOURCE_TEXT_I,
  SOURCE_TEXT_MOVFLAGS,
  SOURCE_TEXT_PRESET,
  SOURCE_TEXT_Q_V,
  SOURCE_TEXT_SIGKILL,
  SOURCE_TEXT_SS,
  SOURCE_TEXT_SYMBOL_25,
  SOURCE_TEXT_T,
  SOURCE_TEXT_VF,
  SOURCE_TEXT_VFRAMES,
  SOURCE_TEXT_Y,
} from "../../../../constants/sourceText";
import fs from "fs";
import path from "path";
import { execFile, ChildProcess } from "child_process";
import _ from "lodash";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { HighlightClipItem, ShortsAspectRatio, ShortsReframeMode } from "../../../../types/shorts.js";
import { SHORTS_CONSTANTS, SHORTS_LOG_MESSAGES, SHORTS_REGEX, SHORTS_TEXTS } from "../../../../constants/shorts.js";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { logger } from "../../../../lib/logger.js";
export type RenderShortClipParams = { sourceVideoPath: string; clip: HighlightClipItem; aspectRatio: ShortsAspectRatio; reframeMode: ShortsReframeMode; outputDirectory?: string; signal?: AbortSignal; onProgress?: (percent: number) => void };
const runProcessWithSignal = (cmd: string, args: string[], signal?: AbortSignal, maxBuffer: number = 20 * 1024 * 1024): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error(SHORTS_CONSTANTS.PROCESS_ABORTED));
    }
    let child: ChildProcess | null = execFile(cmd, args, { maxBuffer }, (err, stdout, stderr) => {
      if (err) {
        if (signal?.aborted) {
          return reject(new Error(SHORTS_CONSTANTS.PROCESS_ABORTED));
        }
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
    const abortHandler = () => {
      if (child) {
        try {
          child.kill(SOURCE_TEXT_SIGKILL);
        } catch (_) {}
        child = null;
      }
    };
    if (signal) {
      signal.addEventListener(SOURCE_TEXT_ABORT, abortHandler, { once: true });
    }
  });
};
const buildFilterArgs = (aspectRatio: ShortsAspectRatio, reframeMode: ShortsReframeMode): string[] => {
  if (aspectRatio === ShortsAspectRatio.VERTICAL_9_16) {
    if (reframeMode === ShortsReframeMode.BLUR_BACKGROUND) {
      return [SOURCE_TEXT_FILTER_COMPLEX, SOURCE_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT(`${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT}`, `${SHORTS_CONSTANTS.BOX_BLUR_FILTER}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`)];
    }
    return [SOURCE_TEXT_FILTER_COMPLEX, SOURCE_TEMPLATE_CROP_IH_9_16_IH_IW(`${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT}`)];
  }
  if (aspectRatio === ShortsAspectRatio.SQUARE_1_1) {
    if (reframeMode === ShortsReframeMode.BLUR_BACKGROUND) {
      return [SOURCE_TEXT_FILTER_COMPLEX, SOURCE_TEMPLATE_0_V_SCALE_FORCE_ORIGINAL_ASPECT(`${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.BOX_BLUR_FILTER}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`)];
    }
    return [SOURCE_TEXT_FILTER_COMPLEX, SOURCE_TEMPLATE_CROP_MIN_IW_IH_MIN_IW(`${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`)];
  }
  return [SOURCE_TEXT_VF, SOURCE_TEMPLATE_SCALE_FORCE_ORIGINAL_ASPECT_RATIO_DECREASE(`${SHORTS_CONSTANTS.SCALE_16_9_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_16_9_HEIGHT}`, `${SHORTS_CONSTANTS.SCALE_16_9_WIDTH}`, `${SHORTS_CONSTANTS.SCALE_16_9_HEIGHT}`)];
};
export const renderSingleShortClip = async (params: RenderShortClipParams): Promise<{ videoPath: string; thumbnailPath: string }> => {
  const { sourceVideoPath, clip, aspectRatio, reframeMode, outputDirectory, signal } = params;
  if (signal?.aborted) {
    throw new Error(SHORTS_CONSTANTS.PROCESS_ABORTED);
  }
  if (!fs.existsSync(sourceVideoPath)) {
    throw new Error(`${SHORTS_TEXTS.ERR_FILE_NOT_FOUND}${RT_SHARED.SYMBOL_36A9E7}${sourceVideoPath}`);
  }
  const outDir = outputDirectory || path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER, SHORTS_CONSTANTS.SHORTS_FOLDER);
  await fs.promises.mkdir(outDir, { recursive: true });
  const safeTitle = _.slice(_.replace(_.toLower(clip.title || SOURCE_TEMPLATE_CLIP(`${clip.index}`)), SHORTS_REGEX.CLEAN_TITLE, SOURCE_TEXT_SYMBOL_25), 0, 30);
  const outVideoName = SOURCE_TEMPLATE_SHORT_2(`${clip.index}`, `${safeTitle}`, `${Date.now()}`, `${SHORTS_CONSTANTS.EXT_MP4}`);
  const outThumbName = SOURCE_TEMPLATE_SHORT_2(`${clip.index}`, `${safeTitle}`, `${Date.now()}`, `${SHORTS_CONSTANTS.THUMB_SUFFIX}`);
  const outputVideoPath = path.join(outDir, outVideoName);
  const outputThumbPath = path.join(outDir, outThumbName);
  const ffmpegCmd = getFfmpegPath();
  const duration = Math.max(1, clip.endTime - clip.startTime);
  const filterArgs = buildFilterArgs(aspectRatio, reframeMode);
  const renderArgs = [
    SOURCE_TEXT_Y,
    SOURCE_TEXT_SS,
    `${clip.startTime}`,
    SOURCE_TEXT_T,
    `${duration}`,
    SOURCE_TEXT_I,
    sourceVideoPath,
    ...filterArgs,
    SOURCE_TEXT_C_V,
    SHORTS_CONSTANTS.LIBX264,
    SOURCE_TEXT_PRESET,
    SHORTS_CONSTANTS.DEFAULT_PRESET,
    SOURCE_TEXT_CRF,
    SHORTS_CONSTANTS.DEFAULT_CRF,
    SOURCE_TEXT_C_A,
    SHORTS_CONSTANTS.AAC,
    SOURCE_TEXT_B_A,
    SHORTS_CONSTANTS.DEFAULT_VIDEO_AUDIO_BITRATE,
    SOURCE_TEXT_MOVFLAGS,
    SOURCE_TEXT_FASTSTART,
    outputVideoPath,
  ];
  logger.log(SHORTS_LOG_MESSAGES.RENDERING_CLIP(clip.index, clip.startTime, clip.endTime));
  await runProcessWithSignal(ffmpegCmd, renderArgs, signal, 20 * 1024 * 1024);
  if (signal?.aborted) {
    if (fs.existsSync(outputVideoPath)) {
      try {
        await fs.promises.unlink(outputVideoPath);
      } catch (_) {}
    }
    throw new Error(SHORTS_CONSTANTS.PROCESS_ABORTED);
  }
  if (!fs.existsSync(outputVideoPath)) {
    throw new Error(`${SHORTS_TEXTS.ERR_RENDER_CLIP_FAILED}${clip.index}`);
  }
  try {
    const thumbArgs = [SOURCE_TEXT_Y, SOURCE_TEXT_SS, `${clip.startTime + 1}`, SOURCE_TEXT_I, sourceVideoPath, SOURCE_TEXT_VFRAMES, SOURCE_TEXT_1, SOURCE_TEXT_Q_V, SOURCE_TEXT_2, outputThumbPath];
    await runProcessWithSignal(ffmpegCmd, thumbArgs, signal, 5 * 1024 * 1024);
  } catch (err: any) {
    logger.warn(SHORTS_LOG_MESSAGES.THUMBNAIL_FAILED(clip.index, err?.message || ""));
  }
  return { videoPath: outputVideoPath, thumbnailPath: fs.existsSync(outputThumbPath) ? outputThumbPath : "" };
};
