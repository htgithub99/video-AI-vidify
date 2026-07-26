import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "./paths.js";
import { logger } from "../../lib/logger.js";
import { promisify } from "util";
import _ from "lodash";
import { VideoQuality } from "../../constants/enums.js";
import { FFMPEG_RESOLUTIONS, FFMPEG_RENDER_CONSTANTS } from "../../constants/config.js";

const execAsync = promisify(exec);

export interface FFmpegRenderOptions {
  scenes: Array<{
    id: string;
    imageBase64?: string;
    imageUrl?: string;
    audioBase64?: string;
    audioUrl?: string;
    duration: number;
    text?: string;
  }>;
  quality?: VideoQuality;
  globalAudioUrl?: string;
  aspectRatio?: string;
}

export const renderFFmpegVideo = async (options: FFmpegRenderOptions): Promise<string> => {
  const qualityVal = _.get(options, "quality", VideoQuality.LOW);
  const aspectRatioVal = _.get(options, "aspectRatio");
  const globalAudioUrlVal = _.get(options, "globalAudioUrl");
  const scenesVal = _.get(options, "scenes");

  if (_.isEmpty(scenesVal)) {
    throw new Error(FFMPEG_RENDER_CONSTANTS.ERR_NO_SCENES);
  }

  const tempDir = path.join(getDataDirectory(), `${FFMPEG_RENDER_CONSTANTS.TEMP_DIR_PREFIX}${uuidv4()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ffmpegBinary = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);

  const resolutionConfig = _.get(FFMPEG_RESOLUTIONS, qualityVal) || _.get(FFMPEG_RESOLUTIONS, VideoQuality.LOW);
  const width = _.get(resolutionConfig, "width");
  const height = _.get(resolutionConfig, "height");
  const fps = _.get(resolutionConfig, "fps");
  const bitrate = _.get(resolutionConfig, "bitrate");

  let finalWidth = width;
  let finalHeight = height;
  if (_.isEqual(aspectRatioVal, FFMPEG_RENDER_CONSTANTS.ASPECT_RATIO_9_16)) {
    finalWidth = height;
    finalHeight = width;
  }

  const finalOutputName = `${FFMPEG_RENDER_CONSTANTS.OUTPUT_FILE_PREFIX}${uuidv4()}${FFMPEG_RENDER_CONSTANTS.MP4_EXTENSION}`;
  const finalOutputPath = path.join(getDataDirectory(), FFMPEG_RENDER_CONSTANTS.ASSETS_DIR, finalOutputName);
  const finalOutputUrl = `${FFMPEG_RENDER_CONSTANTS.ASSETS_URL_PREFIX}${finalOutputName}`;
  
  let globalAudioPath = "";
  if (globalAudioUrlVal) {
    const filename = path.basename(globalAudioUrlVal);
    const candidatePath = path.join(getDataDirectory(), FFMPEG_RENDER_CONSTANTS.ASSETS_DIR, filename);
    if (fs.existsSync(candidatePath)) {
      globalAudioPath = candidatePath;
    }
  }

  const config = {
    tempDir,
    ffmpegCmd: fs.existsSync(ffmpegBinary) ? ffmpegBinary : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD,
    width: finalWidth,
    height: finalHeight,
    fps,
    bitrate,
    finalOutputPath,
    finalOutputUrl,
    scenes: scenesVal,
    globalAudioPath
  };

  const configPath = path.join(tempDir, FFMPEG_RENDER_CONSTANTS.CONFIG_FILE_NAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), FFMPEG_RENDER_CONSTANTS.ENCODING_UTF8);

  const pyCmd = getPythonCommand();
  const scriptPath = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.SCRIPT_PATH);

  try {
    const { stdout } = await execAsync(`"${pyCmd}" "${scriptPath}" "${configPath}"`);
    const outputLines = stdout.trim().split("\n");
    let result = null;
    for (let i = outputLines.length - 1; i >= 0; i--) {
      try {
        result = JSON.parse(outputLines[i]);
        if (_.has(result, "success")) break;
      } catch (e) {}
    }

    if (result && _.get(result, "success")) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return _.get(result, "url");
    } else {
      throw new Error(result ? _.get(result, "error") : FFMPEG_RENDER_CONSTANTS.ERR_UNKNOWN_PYTHON);
    }
  } catch (err: any) {
    logger.error(FFMPEG_RENDER_CONSTANTS.LOG_ERROR_RENDER, err);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw err;
  }
};
