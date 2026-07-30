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
import { ASSETS_DIR_NAME, PROJECTS_DIR_NAME, REFACTOR_CONSTANTS, SAFE_PROJECT_ID_REGEX, SecurityConstants, VIDEOS_DIR_NAME } from "../../constants/index.js";

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
  projectId?: string;
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
  const rawProjectId = _.trim(_.get(
    options,
    REFACTOR_CONSTANTS.FFMPEG_PROJECT_ID_PATH,
    SecurityConstants.EMPTY_STRING,
  ));
  const safeProjectId = _.isEmpty(rawProjectId)
    ? SecurityConstants.EMPTY_STRING
    : _.replace(
      path.basename(rawProjectId),
      SAFE_PROJECT_ID_REGEX,
      REFACTOR_CONSTANTS.VD_UNDERSCORE,
    );
  const outputDir = !_.isEmpty(safeProjectId)
    ? path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, safeProjectId, VIDEOS_DIR_NAME)
    : path.join(getDataDirectory(), ASSETS_DIR_NAME);
  fs.mkdirSync(outputDir, { recursive: true });
  const finalOutputPath = path.join(outputDir, finalOutputName);
  const finalOutputUrl = !_.isEmpty(safeProjectId)
    ? _.join(
      [
        SecurityConstants.EMPTY_STRING,
        ASSETS_DIR_NAME,
        PROJECTS_DIR_NAME,
        safeProjectId,
        VIDEOS_DIR_NAME,
        finalOutputName,
      ],
      REFACTOR_CONSTANTS.VD_SLASH,
    )
    : `${FFMPEG_RENDER_CONSTANTS.ASSETS_URL_PREFIX}${finalOutputName}`;
  
  let globalAudioPath = SecurityConstants.EMPTY_STRING;
  if (_.every([
    !_.isEmpty(globalAudioUrlVal),
    !_.startsWith(globalAudioUrlVal, REFACTOR_CONSTANTS.FFMPEG_DATA_URL_PREFIX),
  ], Boolean)) {
    const assetsRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME);
    const cleanAudioUrl = _.first(_.split(globalAudioUrlVal, SecurityConstants.QUERY_MARK));
    const relativeAudioPath = _.trimStart(cleanAudioUrl, REFACTOR_CONSTANTS.VD_SLASH);
    const assetsPathPrefix = _.join(
      [ASSETS_DIR_NAME, SecurityConstants.EMPTY_STRING],
      REFACTOR_CONSTANTS.VD_SLASH,
    );
    const normalizedAudioPath = _.startsWith(relativeAudioPath, assetsPathPrefix)
      ? _.slice(relativeAudioPath, _.size(assetsPathPrefix)).join(SecurityConstants.EMPTY_STRING)
      : relativeAudioPath;
    const candidatePath = path.resolve(assetsRoot, normalizedAudioPath);
    const containedPathPrefix = _.join([assetsRoot, path.sep], SecurityConstants.EMPTY_STRING);
    if (_.every([
      _.startsWith(candidatePath, containedPathPrefix),
      fs.existsSync(candidatePath),
    ], Boolean)) {
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
