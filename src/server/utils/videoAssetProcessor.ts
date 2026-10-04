import { SOURCE_TEXT_VIDEO_2 } from "../../constants/sourceText";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { promisify } from "util";
import _ from "lodash";
import ffmpeg from "fluent-ffmpeg";
import { FLOW_VIDEO_MEDIA_CONFIG, GEMINI_VIDEO_PROCESS_CONFIG, REFACTOR_CONSTANTS } from "../../constants/index.js";
import { getDataDirectory, getStaticResourcePath } from "./paths.js";
const execFileAsync = promisify(execFile);
export interface VideoAssetInspection {
  durationSeconds: number;
  width: number;
  height: number;
}
const removeTemporaryDirectory = async (directoryPath: string): Promise<void> => {
  await fs.promises.rm(directoryPath, { recursive: true, force: true });
};
export const removeVideoAudioTrack = async (videoBase64: string): Promise<string> => {
  if (_.isEmpty(videoBase64)) {
    throw new Error(GEMINI_VIDEO_PROCESS_CONFIG.ERROR_REMOVE_AUDIO);
  }
  const temporaryDirectory = path.join(getDataDirectory(), `${GEMINI_VIDEO_PROCESS_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  const inputPath = path.join(temporaryDirectory, GEMINI_VIDEO_PROCESS_CONFIG.INPUT_FILE_NAME);
  const outputPath = path.join(temporaryDirectory, GEMINI_VIDEO_PROCESS_CONFIG.OUTPUT_FILE_NAME);
  const bundledFfmpegPath = getStaticResourcePath(GEMINI_VIDEO_PROCESS_CONFIG.FFMPEG_BINARY_NAME);
  const ffmpegCommand = fs.existsSync(bundledFfmpegPath) ? bundledFfmpegPath : GEMINI_VIDEO_PROCESS_CONFIG.FFMPEG_FALLBACK_COMMAND;
  await fs.promises.mkdir(temporaryDirectory, { recursive: true });
  try {
    await fs.promises.writeFile(inputPath, Buffer.from(videoBase64, REFACTOR_CONSTANTS.ENCODING_BASE64));
    await execFileAsync(ffmpegCommand, [...GEMINI_VIDEO_PROCESS_CONFIG.FFMPEG_ARGS_BEFORE_INPUT, inputPath, ...GEMINI_VIDEO_PROCESS_CONFIG.FFMPEG_ARGS_AFTER_INPUT, outputPath], {
      windowsHide: true,
      maxBuffer: GEMINI_VIDEO_PROCESS_CONFIG.MAX_BUFFER_BYTES,
    });
    const outputBuffer = await fs.promises.readFile(outputPath);
    if (_.isEmpty(outputBuffer)) {
      throw new Error(GEMINI_VIDEO_PROCESS_CONFIG.ERROR_REMOVE_AUDIO);
    }
    return outputBuffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64);
  } finally {
    await removeTemporaryDirectory(temporaryDirectory);
  }
};
export const inspectGeneratedVideoBuffer = async (videoBuffer: Buffer, expectedDurationSeconds: number): Promise<VideoAssetInspection> => {
  if (_.lt(videoBuffer.length, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw new Error(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
  const temporaryDirectory = path.join(getDataDirectory(), `${GEMINI_VIDEO_PROCESS_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  const inputPath = path.join(temporaryDirectory, GEMINI_VIDEO_PROCESS_CONFIG.INPUT_FILE_NAME);
  await fs.promises.mkdir(temporaryDirectory, { recursive: true });
  try {
    await fs.promises.writeFile(inputPath, videoBuffer);
    const metadata = await new Promise<any>((resolve, reject) => ffmpeg.ffprobe(inputPath, (error, result) => (error ? reject(error) : resolve(result))));
    const videoStream = _.find(metadata?.streams, (stream) => _.isEqual(stream?.codec_type, SOURCE_TEXT_VIDEO_2));
    const durationSeconds = _.toNumber(metadata?.format?.duration || videoStream?.duration);
    const width = _.toNumber(videoStream?.width);
    const height = _.toNumber(videoStream?.height);
    const minimumDuration = _.max([0.1, expectedDurationSeconds * FLOW_VIDEO_MEDIA_CONFIG.MIN_DURATION_RATIO, expectedDurationSeconds - FLOW_VIDEO_MEDIA_CONFIG.DURATION_TOLERANCE_SECONDS]) || 0.1;
    if (!videoStream || !_.isFinite(durationSeconds) || _.lt(durationSeconds, minimumDuration) || !_.gt(width, 0) || !_.gt(height, 0)) throw new Error(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    return { durationSeconds, width, height };
  } finally {
    await removeTemporaryDirectory(temporaryDirectory);
  }
};
