import {
  SOURCE_TEMPLATE_AUDIO,
  SOURCE_TEXT_0,
  SOURCE_TEXT_AC,
  SOURCE_TEXT_ACODEC,
  SOURCE_TEXT_AR,
  SOURCE_TEXT_B_A,
  SOURCE_TEXT_I,
  SOURCE_TEXT_JSON,
  SOURCE_TEXT_MP4,
  SOURCE_TEXT_PRINT_FORMAT,
  SOURCE_TEXT_QUIET,
  SOURCE_TEXT_SHOW_FORMAT,
  SOURCE_TEXT_SHOW_STREAMS,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_SYMBOL_23,
  SOURCE_TEXT_V,
  SOURCE_TEXT_VIDEO_2,
  SOURCE_TEXT_VN,
  SOURCE_TEXT_Y,
} from "../../constants/sourceText";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import _ from "lodash";
import { getStaticResourcePath, getTempDirectory } from "../utils/paths.js";
import { ShortsSourceMetadata } from "../../types/shorts.js";
import { SHORTS_CONSTANTS, SHORTS_LOG_MESSAGES, SHORTS_TEXTS } from "../../constants/shorts.js";
import { logger } from "../../lib/logger.js";
const execFileAsync = promisify(execFile);
export const getFfmpegPath = (): string => {
  const localExe = getStaticResourcePath(SHORTS_CONSTANTS.FFMPEG_EXE);
  if (fs.existsSync(localExe)) return localExe;
  const rootExe = path.join(process.cwd(), SHORTS_CONSTANTS.FFMPEG_EXE);
  return fs.existsSync(rootExe) ? rootExe : SHORTS_CONSTANTS.FFMPEG_CMD;
};
export const getFfprobePath = (): string => {
  const localExe = getStaticResourcePath(SHORTS_CONSTANTS.FFPROBE_EXE);
  if (fs.existsSync(localExe)) return localExe;
  const rootExe = path.join(process.cwd(), SHORTS_CONSTANTS.FFPROBE_EXE);
  return fs.existsSync(rootExe) ? rootExe : SHORTS_CONSTANTS.FFPROBE_CMD;
};
export const inspectVideoFile = async (videoPath: string): Promise<ShortsSourceMetadata> => {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`${SHORTS_TEXTS.ERR_FILE_NOT_FOUND} ${videoPath}`);
  }
  const stat = await fs.promises.stat(videoPath);
  const ffprobeCmd = getFfprobePath();
  try {
    const { stdout } = await execFileAsync(ffprobeCmd, [SOURCE_TEXT_V, SOURCE_TEXT_QUIET, SOURCE_TEXT_PRINT_FORMAT, SOURCE_TEXT_JSON, SOURCE_TEXT_SHOW_FORMAT, SOURCE_TEXT_SHOW_STREAMS, videoPath], { maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(stdout);
    const videoStream = _.find(data.streams, (s: any) => s.codec_type === SOURCE_TEXT_VIDEO_2);
    const duration = parseFloat(data.format?.duration || videoStream?.duration || SOURCE_TEXT_0);
    const width = parseInt(videoStream?.width || `${SHORTS_CONSTANTS.SCALE_16_9_WIDTH}`, 10);
    const height = parseInt(videoStream?.height || `${SHORTS_CONSTANTS.SCALE_16_9_HEIGHT}`, 10);
    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split(SOURCE_TEXT_SYMBOL);
      if (parts.length === 2 && parseFloat(parts[1]) > 0) {
        fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
      }
    }
    return {
      duration,
      width,
      height,
      fps,
      formatName: data.format?.format_name || SOURCE_TEXT_MP4,
      bitrate: parseInt(data.format?.bit_rate || SOURCE_TEXT_0, 10),
      fileSizeBytes: stat.size,
      fileName: path.basename(videoPath),
      filePath: videoPath,
    };
  } catch (err: any) {
    logger.warn(SHORTS_LOG_MESSAGES.FFPROBE_FALLBACK(err?.message || ""));
    return {
      duration: 0,
      width: SHORTS_CONSTANTS.SCALE_16_9_WIDTH,
      height: SHORTS_CONSTANTS.SCALE_16_9_HEIGHT,
      fps: 30,
      formatName: path.extname(videoPath).replace(SOURCE_TEXT_SYMBOL_23, ""),
      bitrate: 0,
      fileSizeBytes: stat.size,
      fileName: path.basename(videoPath),
      filePath: videoPath,
    };
  }
};
export const extractAudioFromVideo = async (videoPath: string, customOutputDir?: string): Promise<string> => {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`${SHORTS_TEXTS.ERR_FILE_NOT_FOUND} ${videoPath}`);
  }
  const targetDir = customOutputDir || path.join(getTempDirectory(), SHORTS_CONSTANTS.TEMP_AUDIO_DIR);
  await fs.promises.mkdir(targetDir, { recursive: true });
  const outputAudioName = SOURCE_TEMPLATE_AUDIO(`${Date.now()}`, `${SHORTS_CONSTANTS.TEMP_AUDIO_NAME}`);
  const outputAudioPath = path.join(targetDir, outputAudioName);
  const ffmpegCmd = getFfmpegPath();
  const args = [SOURCE_TEXT_Y, SOURCE_TEXT_I, videoPath, SOURCE_TEXT_VN, SOURCE_TEXT_ACODEC, SHORTS_CONSTANTS.LIBMP3LAME, SOURCE_TEXT_B_A, SHORTS_CONSTANTS.DEFAULT_AUDIO_BITRATE, SOURCE_TEXT_AR, SHORTS_CONSTANTS.DEFAULT_SAMPLE_RATE, SOURCE_TEXT_AC, SHORTS_CONSTANTS.DEFAULT_CHANNELS, outputAudioPath];
  await execFileAsync(ffmpegCmd, args, { maxBuffer: 10 * 1024 * 1024 });
  if (!fs.existsSync(outputAudioPath)) {
    throw new Error(SHORTS_TEXTS.ERR_AUDIO_EXTRACT_FAILED);
  }
  return outputAudioPath;
};
