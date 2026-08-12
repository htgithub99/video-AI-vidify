import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "./paths.js";
import { logger } from "../../lib/logger.js";
import _ from "lodash";
import { VideoQuality } from "../../constants/enums.js";
import { GenerateType, RenderAudioTrack, SubtitleCue, SubtitleMode } from "../../types.js";
import { FFMPEG_RESOLUTIONS, FFMPEG_RENDER_CONSTANTS, FFMPEG_RENDER_KEYS, PRODUCTION_AUDIO_CONFIG } from "../../constants/config.js";
import { ASSETS_DIR_NAME, PROJECTS_DIR_NAME, REFACTOR_CONSTANTS, SAFE_PROJECT_ID_REGEX, SecurityConstants, VIDEOS_DIR_NAME } from "../../constants/index.js";
import { MEDIA_MIX_CONFIG } from "../../constants/loading.js";
import { hasProductionAudioSource, isBlockedAudioSource } from "../../services/productionAudioService.js";

const cleanupDirectory = (directoryPath: string): void => {
  if (fs.existsSync(directoryPath)) {
    try {
      fs.rmSync(directoryPath, { recursive: true, force: true, maxRetries: FFMPEG_RENDER_CONSTANTS.CLEANUP_MAX_RETRIES, retryDelay: FFMPEG_RENDER_CONSTANTS.CLEANUP_RETRY_DELAY_MS });
    } catch (error) {
      logger.warn(FFMPEG_RENDER_CONSTANTS.LOG_CLEANUP_WARNING, directoryPath, error);
    }
  }
};

const getFirstValue = <T>(values: Array<T | undefined>): T | undefined => (
  _.find(values, (value) => !_.isNil(value))
);

const parsePythonResult = (stdout: string): Record<string, unknown> | undefined => (
  _.findLast(
    _.map(
      _.split(_.trim(stdout), FFMPEG_RENDER_CONSTANTS.OUTPUT_LINE_SEPARATOR),
      (line) => {
        const parsed = _.attempt(JSON.parse, line);
        return _.isError(parsed) ? undefined : parsed;
      },
    ),
    (result) => _.every([
      !_.isNil(result),
      _.has(result, FFMPEG_RENDER_KEYS.SUCCESS),
    ], Boolean),
  )
);

export interface FFmpegRenderOptions {
  scenes: Array<{
    id: string;
    imageBase64?: string;
    imageUrl?: string;
    audioBase64?: string;
    audioUrl?: string;
    duration: number;
    text?: string;
    subtitle?: string;
    subtitleCues?: SubtitleCue[];
    assetType?: GenerateType.Image | GenerateType.Video;
    cameraMotion?: string;
    effects?: string;
    lightingEffect?: string;
    transition?: string;
  }>;
  quality?: VideoQuality;
  globalAudioUrl?: string;
  globalAudioBase64?: string;
  aspectRatio?: string;
  projectId?: string;
  subtitleMode?: SubtitleMode;
  audioTracks?: RenderAudioTrack[];
}

const resolveLocalAssetPath = (assetUrl?: string): string | undefined => {
  if (_.isEmpty(assetUrl) || _.startsWith(assetUrl, REFACTOR_CONSTANTS.FFMPEG_DATA_URL_PREFIX)) {
    return undefined;
  }
  const assetsRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME);
  const cleanAssetUrl = _.first(_.split(assetUrl, SecurityConstants.QUERY_MARK));
  const relativeAssetPath = _.trimStart(cleanAssetUrl, REFACTOR_CONSTANTS.VD_SLASH);
  const assetsPathPrefix = _.join(
    [ASSETS_DIR_NAME, SecurityConstants.EMPTY_STRING],
    REFACTOR_CONSTANTS.VD_SLASH,
  );
  const normalizedAssetPath = _.startsWith(relativeAssetPath, assetsPathPrefix)
    ? _.slice(relativeAssetPath, _.size(assetsPathPrefix)).join(SecurityConstants.EMPTY_STRING)
    : relativeAssetPath;
  const candidatePath = path.resolve(assetsRoot, normalizedAssetPath);
  const containedPathPrefix = _.join([assetsRoot, path.sep], SecurityConstants.EMPTY_STRING);
  if (!_.every([
    _.startsWith(candidatePath, containedPathPrefix),
    fs.existsSync(candidatePath),
  ], Boolean)) {
    return undefined;
  }
  return candidatePath;
};

export const renderFFmpegVideo = async (
  options: FFmpegRenderOptions,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<string> => {
  const qualityVal = _.get(options, FFMPEG_RENDER_KEYS.QUALITY, VideoQuality.HIGHEST);
  const aspectRatioVal = _.get(options, FFMPEG_RENDER_KEYS.ASPECT_RATIO);
  const globalAudioUrlVal = _.get(options, FFMPEG_RENDER_KEYS.GLOBAL_AUDIO_URL);
  const globalAudioBase64Val = _.get(options, FFMPEG_RENDER_KEYS.GLOBAL_AUDIO_BASE64);
  const scenesVal = _.get(options, FFMPEG_RENDER_KEYS.SCENES);

  if (_.isEmpty(scenesVal)) {
    throw new Error(FFMPEG_RENDER_CONSTANTS.ERR_NO_SCENES);
  }
  const blockedAudioCandidates = [
    globalAudioUrlVal,
    ..._.map(scenesVal, scene => scene.audioUrl),
  ];
  if (_.some(blockedAudioCandidates, source => isBlockedAudioSource(_.toString(source)))) {
    throw new Error(PRODUCTION_AUDIO_CONFIG.SOURCE_BLOCKED_ERROR);
  }
  const audioSources = _.compact([
    globalAudioUrlVal,
    globalAudioBase64Val,
    ..._.flatMap(scenesVal, scene => [scene.audioUrl, scene.audioBase64]),
  ]);
  if (!hasProductionAudioSource(_.map(audioSources, _.toString))) {
    throw new Error(PRODUCTION_AUDIO_CONFIG.SOURCE_REQUIRED_ERROR);
  }

  const tempDir = path.join(getDataDirectory(), `${FFMPEG_RENDER_CONSTANTS.TEMP_DIR_PREFIX}${uuidv4()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ffmpegBinary = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);

  const resolutionConfig = _.defaultTo(_.get(FFMPEG_RESOLUTIONS, qualityVal), _.get(FFMPEG_RESOLUTIONS, VideoQuality.HIGHEST));
  const width = _.get(resolutionConfig, FFMPEG_RENDER_KEYS.WIDTH);
  const height = _.get(resolutionConfig, FFMPEG_RENDER_KEYS.HEIGHT);
  const fps = _.get(resolutionConfig, FFMPEG_RENDER_KEYS.FPS);
  const bitrate = _.get(resolutionConfig, FFMPEG_RENDER_KEYS.BITRATE);

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
  
  let globalAudioPath = _.defaultTo(resolveLocalAssetPath(globalAudioUrlVal), SecurityConstants.EMPTY_STRING);
  if (_.isEmpty(globalAudioPath) && _.isString(globalAudioBase64Val) && !_.isEmpty(globalAudioBase64Val)) {
    const globalAudioData = _.last(_.split(globalAudioBase64Val, "base64,")) || globalAudioBase64Val;
    globalAudioPath = path.join(tempDir, FFMPEG_RENDER_CONSTANTS.GLOBAL_AUDIO_FILE_NAME);
    fs.writeFileSync(globalAudioPath, Buffer.from(globalAudioData, "base64"));
  }
  const renderScenes = _.map(scenesVal, (scene) => {
    const mediaSource = getFirstValue([scene.imageBase64, scene.imageUrl]);
    const audioSource = getFirstValue([scene.audioBase64, scene.audioUrl]);
    const mediaPath = resolveLocalAssetPath(mediaSource);
    const audioPath = resolveLocalAssetPath(audioSource);
    return {
      ...scene,
      [FFMPEG_RENDER_KEYS.IMAGE_BASE64]: mediaPath ? undefined : mediaSource,
      [FFMPEG_RENDER_KEYS.AUDIO_BASE64]: audioPath ? undefined : audioSource,
      [FFMPEG_RENDER_KEYS.MEDIA_PATH]: mediaPath,
      [FFMPEG_RENDER_KEYS.AUDIO_PATH]: audioPath,
    };
  });
  const audioTracks = _.map(_.defaultTo(options.audioTracks, []), track => ({
    ...track,
    assetPath: resolveLocalAssetPath(track.assetUrl),
  }));
  if (_.some(audioTracks, track => _.isEmpty(track.assetPath))) throw new Error(FFMPEG_RENDER_CONSTANTS.ERR_AUDIO_TRACK_MISSING);
  const maxSceneWorkers = _.gt(finalWidth, FFMPEG_RENDER_CONSTANTS.PARALLEL_RENDER_MAX_WIDTH)
    ? SecurityConstants.DEFAULT_AMOUNT
    : FFMPEG_RENDER_CONSTANTS.MAX_SCENE_WORKERS;

  const config = {
    [FFMPEG_RENDER_KEYS.TEMP_DIR]: tempDir,
    [FFMPEG_RENDER_KEYS.FFMPEG_CMD]: fs.existsSync(ffmpegBinary) ? ffmpegBinary : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD,
    [FFMPEG_RENDER_KEYS.WIDTH]: finalWidth,
    [FFMPEG_RENDER_KEYS.HEIGHT]: finalHeight,
    [FFMPEG_RENDER_KEYS.FPS]: fps,
    [FFMPEG_RENDER_KEYS.BITRATE]: bitrate,
    [FFMPEG_RENDER_KEYS.FINAL_OUTPUT_PATH]: finalOutputPath,
    [FFMPEG_RENDER_KEYS.FINAL_OUTPUT_URL]: finalOutputUrl,
    [FFMPEG_RENDER_KEYS.SCENES]: renderScenes,
    [FFMPEG_RENDER_KEYS.GLOBAL_AUDIO_PATH]: globalAudioPath,
    [FFMPEG_RENDER_KEYS.MAX_SCENE_WORKERS]: _.min([maxSceneWorkers, _.size(renderScenes)]),
    [FFMPEG_RENDER_KEYS.VIDEO_TRIM_START_SECONDS]: MEDIA_MIX_CONFIG.DEFAULT_TRIM_SECONDS,
    [FFMPEG_RENDER_KEYS.VIDEO_TRIM_END_SECONDS]: MEDIA_MIX_CONFIG.DEFAULT_TRIM_SECONDS,
    [FFMPEG_RENDER_KEYS.SUBTITLE_MODE]: options.subtitleMode || FFMPEG_RENDER_CONSTANTS.DEFAULT_SUBTITLE_MODE,
    [FFMPEG_RENDER_KEYS.AUDIO_TRACKS]: audioTracks,
  };

  const configPath = path.join(tempDir, FFMPEG_RENDER_CONSTANTS.CONFIG_FILE_NAME);
  fs.writeFileSync(
    configPath,
    JSON.stringify(config, null, FFMPEG_RENDER_CONSTANTS.JSON_INDENT),
    FFMPEG_RENDER_CONSTANTS.ENCODING_UTF8,
  );

  const pyCmd = getPythonCommand();
  const scriptPath = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.SCRIPT_PATH);

  try {
    const renderer = execFile(pyCmd, [scriptPath, configPath], {
      windowsHide: true,
      maxBuffer: FFMPEG_RENDER_CONSTANTS.PYTHON_MAX_BUFFER_BYTES,
      signal,
    });
    let stdout = SecurityConstants.EMPTY_STRING;
    let stderr = SecurityConstants.EMPTY_STRING;
    let progressBuffer = SecurityConstants.EMPTY_STRING;
    renderer.stdout?.on("data", (chunk: Buffer | string) => {
      const output = _.toString(chunk);
      stdout += output;
      const lines = _.split(progressBuffer + output, FFMPEG_RENDER_CONSTANTS.OUTPUT_LINE_SEPARATOR);
      progressBuffer = lines.pop() || SecurityConstants.EMPTY_STRING;
      _.forEach(lines, (line) => {
        const parsed = _.attempt(JSON.parse, _.trim(line));
        if (!_.isError(parsed) && _.has(parsed, FFMPEG_RENDER_KEYS.PROGRESS)) {
          onProgress?.(_.toNumber(_.get(parsed, FFMPEG_RENDER_KEYS.PROGRESS)));
        }
      });
    });
    renderer.stderr?.on("data", (chunk: Buffer | string) => { stderr += _.toString(chunk); });
    await new Promise<void>((resolve, reject) => {
      renderer.once("error", reject);
      renderer.once("exit", (code) => {
        if (_.isEqual(code, SecurityConstants.ZERO)) resolve();
        else reject(new Error(_.trim(stderr) || _.toString(_.get(parsePythonResult(stdout), FFMPEG_RENDER_KEYS.ERROR)) || FFMPEG_RENDER_CONSTANTS.ERR_UNKNOWN_PYTHON));
      });
    });
    const result = parsePythonResult(stdout);

    if (_.every([result, _.get(result, FFMPEG_RENDER_KEYS.SUCCESS)], Boolean)) {
      cleanupDirectory(tempDir);
      return _.toString(_.get(result, FFMPEG_RENDER_KEYS.URL));
    }
    throw new Error(
      result
        ? _.toString(_.get(result, FFMPEG_RENDER_KEYS.ERROR))
        : FFMPEG_RENDER_CONSTANTS.ERR_UNKNOWN_PYTHON,
    );
  } catch (err: any) {
    logger.error(FFMPEG_RENDER_CONSTANTS.LOG_ERROR_RENDER, err);
    cleanupDirectory(tempDir);
    throw err;
  }
};
