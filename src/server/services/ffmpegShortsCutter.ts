import fs from "fs";
import path from "path";
import { execFile, ChildProcess } from "child_process";
import _ from "lodash";
import { getFfmpegPath } from "./shortsPreprocessService.js";
import { HighlightClipItem, ShortsAspectRatio, ShortsReframeMode } from "../../types/shorts.js";
import { SHORTS_CONSTANTS, SHORTS_LOG_MESSAGES, SHORTS_REGEX, SHORTS_TEXTS } from "../../constants/shorts.js";
import { getDataDirectory } from "../utils/paths.js";
import { logger } from "../../lib/logger.js";

export type RenderShortClipParams = {
  sourceVideoPath: string;
  clip: HighlightClipItem;
  aspectRatio: ShortsAspectRatio;
  reframeMode: ShortsReframeMode;
  outputDirectory?: string;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
};

const runProcessWithSignal = (
  cmd: string,
  args: string[],
  signal?: AbortSignal,
  maxBuffer: number = 20 * 1024 * 1024
): Promise<{ stdout: string; stderr: string }> => {
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
          child.kill("SIGKILL");
        } catch (_) {}
        child = null;
      }
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
};

const buildFilterArgs = (aspectRatio: ShortsAspectRatio, reframeMode: ShortsReframeMode): string[] => {
  if (aspectRatio === ShortsAspectRatio.VERTICAL_9_16) {
    if (reframeMode === ShortsReframeMode.BLUR_BACKGROUND) {
      return [
        "-filter_complex",
        `[0:v]scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT}:force_original_aspect_ratio=increase,crop=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT},${SHORTS_CONSTANTS.BOX_BLUR_FILTER}[bg]; [0:v]scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:-1[fg]; [bg][fg]overlay=(W-w)/2:(H-h)/2`,
      ];
    }
    return [
      "-filter_complex",
      `crop=ih*9/16:ih:(iw-ow)/2:0,scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_HEIGHT}`,
    ];
  }
  if (aspectRatio === ShortsAspectRatio.SQUARE_1_1) {
    if (reframeMode === ShortsReframeMode.BLUR_BACKGROUND) {
      return [
        "-filter_complex",
        `[0:v]scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:force_original_aspect_ratio=increase,crop=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_WIDTH},${SHORTS_CONSTANTS.BOX_BLUR_FILTER}[bg]; [0:v]scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:-1[fg]; [bg][fg]overlay=(W-w)/2:(H-h)/2`,
      ];
    }
    return [
      "-filter_complex",
      `crop=min(iw\\,ih):min(iw\\,ih),scale=${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}:${SHORTS_CONSTANTS.SCALE_9_16_WIDTH}`,
    ];
  }
  return [
    "-vf",
    `scale=${SHORTS_CONSTANTS.SCALE_16_9_WIDTH}:${SHORTS_CONSTANTS.SCALE_16_9_HEIGHT}:force_original_aspect_ratio=decrease,pad=${SHORTS_CONSTANTS.SCALE_16_9_WIDTH}:${SHORTS_CONSTANTS.SCALE_16_9_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
  ];
};

export const renderSingleShortClip = async (params: RenderShortClipParams): Promise<{ videoPath: string; thumbnailPath: string }> => {
  const { sourceVideoPath, clip, aspectRatio, reframeMode, outputDirectory, signal } = params;

  if (signal?.aborted) {
    throw new Error(SHORTS_CONSTANTS.PROCESS_ABORTED);
  }

  if (!fs.existsSync(sourceVideoPath)) {
    throw new Error(`${SHORTS_TEXTS.ERR_FILE_NOT_FOUND} ${sourceVideoPath}`);
  }

  const outDir = outputDirectory || path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER, SHORTS_CONSTANTS.SHORTS_FOLDER);
  await fs.promises.mkdir(outDir, { recursive: true });

  const safeTitle = _.slice(_.replace(_.toLower(clip.title || `clip_${clip.index}`), SHORTS_REGEX.CLEAN_TITLE, "_"), 0, 30);
  const outVideoName = `short_${clip.index}_${safeTitle}_${Date.now()}${SHORTS_CONSTANTS.EXT_MP4}`;
  const outThumbName = `short_${clip.index}_${safeTitle}_${Date.now()}${SHORTS_CONSTANTS.THUMB_SUFFIX}`;

  const outputVideoPath = path.join(outDir, outVideoName);
  const outputThumbPath = path.join(outDir, outThumbName);

  const ffmpegCmd = getFfmpegPath();
  const duration = Math.max(1, clip.endTime - clip.startTime);
  const filterArgs = buildFilterArgs(aspectRatio, reframeMode);

  const renderArgs = [
    "-y",
    "-ss", `${clip.startTime}`,
    "-t", `${duration}`,
    "-i", sourceVideoPath,
    ...filterArgs,
    "-c:v", SHORTS_CONSTANTS.LIBX264,
    "-preset", SHORTS_CONSTANTS.DEFAULT_PRESET,
    "-crf", SHORTS_CONSTANTS.DEFAULT_CRF,
    "-c:a", SHORTS_CONSTANTS.AAC,
    "-b:a", SHORTS_CONSTANTS.DEFAULT_VIDEO_AUDIO_BITRATE,
    "-movflags", "+faststart",
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
    const thumbArgs = ["-y", "-ss", `${clip.startTime + 1}`, "-i", sourceVideoPath, "-vframes", "1", "-q:v", "2", outputThumbPath];
    await runProcessWithSignal(ffmpegCmd, thumbArgs, signal, 5 * 1024 * 1024);
  } catch (err: any) {
    logger.warn(SHORTS_LOG_MESSAGES.THUMBNAIL_FAILED(clip.index, err?.message || ""));
  }

  return {
    videoPath: outputVideoPath,
    thumbnailPath: fs.existsSync(outputThumbPath) ? outputThumbPath : "",
  };
};
