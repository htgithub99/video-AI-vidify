
import { SOURCE_TEMPLATE_SYMBOL_75, SOURCE_TEMPLATE_SYMBOL_86, SOURCE_TEMPLATE_SYMBOL_170, SOURCE_TEMPLATE_SYMBOL_45, SOURCE_TEMPLATE_SYMBOL_46, SOURCE_TEXT_SIGKILL } from "../../constants/sourceText.js";
import { createHash } from "crypto";
import { NextFunction, Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { ASSETS_DIR_NAME, PROJECTS_DIR_NAME, REFACTOR_CONSTANTS } from "../../constants";
import { FLOW_VIDEO_MEDIA_CONFIG, PIPELINE_COMPLETION_CONFIG, PROJECT_ASSET_GROUP, PROJECT_ASSET_INVALID_REQUEST } from "../../constants/config.js";
import { FeatureType, SecurityConstants, SecurityMessages } from "../../constants/security.js";
import { SUNO_AUTOMATION_CONFIG } from "../../constants/sunoAutomation.js";
import { appError, createAppError } from "../../lib/logger.js";
import { GenerateType, SceneAssetStatus, StoryboardScene } from "../../types.js";
import { requireLicense } from "../middlewares/requireLicense.js";
import { getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { resolveLocalProjectAssetPath } from "../services/imageAssetService.js";
import { LicenseService } from "../services/licenseService.js";
import { assertResponseSchema } from "../services/responseSchemaValidationService.js";
import { saveProjectDetailToDb } from "../utils/db.js";
import { safeParseJSON } from "../utils/helpers.js";
import { getDataDirectory } from "../utils/paths.js";
export const parseAiJsonArtifact = <T>(text: string, schema: Parameters<typeof assertResponseSchema>[1], errorMessage: string): T => {
  const value = safeParseJSON(text, undefined);
  assertResponseSchema(value, schema, errorMessage);
  return value as T;
};
export async function incrementFeatureUsage(req: Request, feature: FeatureType, amount: number = SecurityConstants.DEFAULT_AMOUNT) {
  const licenseKey = getResolvedLicenseKey(req);
  if (!_.isEmpty(licenseKey)) {
    try {
      await LicenseService.incrementUsage(licenseKey, feature, amount);
    } catch (e) {
      appError(SecurityMessages.USAGE_UPDATE_ERROR, e);
    }
  }
}
export const requireBatchVisualLicense = async (req: Request, res: Response, next: NextFunction) => {
  const items = _.get(req, REFACTOR_CONSTANTS.USAGE_REQUEST_ITEMS_PATH, []);
  const hasVideoItems = _.some(items, (item) => _.isEqual(item.generateType, GenerateType.Video));
  const hasImageItems = _.some(items, (item) => !_.isEqual(item.generateType, GenerateType.Video));
  const features = _.compact([hasImageItems ? FeatureType.IMAGE : undefined, hasVideoItems ? FeatureType.VIDEO : undefined]);
  const validateFeature = (index: number): void => {
    const feature = _.nth(features, index);
    if (_.isUndefined(feature)) {
      next();
      return;
    }
    requireLicense(feature)(req, res, () => validateFeature(_.add(index, SecurityConstants.DEFAULT_AMOUNT)));
  };
  validateFeature(SecurityConstants.ZERO);
};
export const activeMusicPlanCleanup = new Map<string, Promise<void>>();
export const musicPlanCheckpoints = new Map<string, { signature: string; updatedAt: number; styleAnalysis: any; batches: Map<number, any[]> }>();
export const readMediaDurationSeconds = async (filePath: string): Promise<number> =>
  new Promise((resolve) => {
    let settled = false;
    const command = ffmpeg(filePath);
    const finish = (durationSeconds: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(durationSeconds);
    };
    const timeout = setTimeout(() => {
      try {
        command.kill(SOURCE_TEXT_SIGKILL);
      } catch {}
      finish(0);
    }, SUNO_AUTOMATION_CONFIG.AUDIO_DURATION_PROBE_TIMEOUT_MS);
    command.ffprobe((error, metadata) => finish(error ? 0 : Math.max(0, _.toNumber(metadata?.format?.duration))));
  });
export const persistProjectVideo = async (localProjectId: string, sceneId: string, base64: string, variantIndex?: number): Promise<string> => {
  const safeProjectId = path.basename(_.toString(localProjectId));
  const safeSceneId = path.basename(_.toString(sceneId));
  if (_.some([safeProjectId, safeSceneId, base64], _.isEmpty)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, safeProjectId);
  const videoDirectory = path.resolve(projectRoot, PROJECT_ASSET_GROUP.VIDEOS);
  if (!_.startsWith(_.toLower(videoDirectory), _.toLower(SOURCE_TEMPLATE_SYMBOL_75(`${projectRoot}`, `${path.sep}`)))) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
  const videoBuffer = Buffer.from(base64, REFACTOR_CONSTANTS.ENCODING_BASE64);
  if (_.lt(videoBuffer.length, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
  await fs.promises.mkdir(videoDirectory, { recursive: true });
  const variantSuffix = _.isNumber(variantIndex) ? SOURCE_TEMPLATE_SYMBOL_75(`${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}`, `${_.add(variantIndex, FLOW_VIDEO_MEDIA_CONFIG.VARIANT_INDEX_OFFSET)}`) : SecurityConstants.EMPTY_STRING;
  const videoFilename = SOURCE_TEMPLATE_SYMBOL_170(`${safeSceneId}`, `${variantSuffix}`, `${FLOW_VIDEO_MEDIA_CONFIG.FILE_EXTENSION}`);
  const videoPath = path.join(videoDirectory, videoFilename);
  const candidateHash = createHash(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ALGORITHM).update(videoBuffer).digest(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ENCODING);
  const existingSceneVideoFiles = _.filter(await fs.promises.readdir(videoDirectory), (filename) => FLOW_VIDEO_MEDIA_CONFIG.SCENE_VIDEO_FILE_PATTERN.test(filename) && !_.isEqual(filename, videoFilename) && !_.startsWith(filename, SOURCE_TEMPLATE_SYMBOL_75(`${safeSceneId}`, `${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}`)));
  for (const existingFilename of existingSceneVideoFiles) {
    const existingPath = path.join(videoDirectory, existingFilename);
    const existingStats = await fs.promises.stat(existingPath);
    if (!_.isEqual(existingStats.size, videoBuffer.length)) continue;
    const existingBuffer = await fs.promises.readFile(existingPath);
    const existingHash = createHash(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ALGORITHM).update(existingBuffer).digest(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ENCODING);
    if (_.isEqual(existingHash, candidateHash)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ERROR);
  }
  await fs.promises.writeFile(videoPath, videoBuffer);
  const persistedSize = (await fs.promises.stat(videoPath)).size;
  if (_.lt(persistedSize, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
  return SOURCE_TEMPLATE_SYMBOL_45(SOURCE_TEMPLATE_SYMBOL_86(`${ASSETS_DIR_NAME}`), SOURCE_TEMPLATE_SYMBOL_86(`${PROJECTS_DIR_NAME}`), SOURCE_TEMPLATE_SYMBOL_86(`${safeProjectId}`), SOURCE_TEMPLATE_SYMBOL_86(`${PROJECT_ASSET_GROUP.VIDEOS}`), SOURCE_TEMPLATE_SYMBOL_86(`${videoFilename}`));
};
const createProjectVideoVariantUrl = (localProjectId: string, sceneId: string, variantIndex: number): string => {
  const safeProjectId = path.basename(_.toString(localProjectId));
  const safeSceneId = path.basename(_.toString(sceneId));
  const variantNumber = _.add(variantIndex, FLOW_VIDEO_MEDIA_CONFIG.VARIANT_INDEX_OFFSET);
  return SOURCE_TEMPLATE_SYMBOL_46(
    SOURCE_TEMPLATE_SYMBOL_86(`${ASSETS_DIR_NAME}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${PROJECTS_DIR_NAME}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${safeProjectId}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${PROJECT_ASSET_GROUP.VIDEOS}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${safeSceneId}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${variantNumber}`),
    SOURCE_TEMPLATE_SYMBOL_86(`${FLOW_VIDEO_MEDIA_CONFIG.FILE_EXTENSION}`),
  );
};
export const getPersistedProjectVideoVariantUrl = (localProjectId: string, sceneId: string, variantIndex: number): string | undefined => {
  const candidateUrl = createProjectVideoVariantUrl(localProjectId, sceneId, variantIndex);
  const candidatePath = resolveLocalProjectAssetPath(candidateUrl);
  if (!candidatePath || !fs.existsSync(candidatePath)) return undefined;
  return _.gte(fs.statSync(candidatePath).size, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES) ? candidateUrl : undefined;
};
export const persistRecoveredFlowScene = async (project: any, scene: StoryboardScene, mediaIds: string[], fallbackUrls: string[]): Promise<void> => {
  scene.assetUrl = _.head(fallbackUrls);
  scene.assetUrls = fallbackUrls;
  scene.assetType = GenerateType.Video;
  scene.assetStatus = SceneAssetStatus.Generated;
  scene.assetError = undefined;
  scene.remoteVideoDownloadPending = false;
  scene.remoteVideoMediaId = _.head(mediaIds);
  scene.remoteVideoMediaIds = mediaIds;
  scene.remoteVideoExpectedCount = _.size(mediaIds);
  const completedSceneIds = _.map(
    _.filter(project.storyboard, (candidate) => !_.isEmpty(candidate.assetUrl) || _.some(candidate.assetUrls, (assetUrl) => !_.isEmpty(assetUrl))),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const pendingSceneIds = _.map(
    _.reject(project.storyboard, (candidate) => _.includes(completedSceneIds, candidate.id)),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const failedSceneIds = _.map(
    _.filter(project.storyboard, (candidate) => _.includes(pendingSceneIds, candidate.id) && _.isEqual(candidate.assetStatus, SceneAssetStatus.Failed)),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  project.generationCheckpoint = { ...project.generationCheckpoint, phase: _.isEmpty(pendingSceneIds) ? PIPELINE_COMPLETION_CONFIG.MEDIA_COMPLETED_PHASE : PIPELINE_COMPLETION_CONFIG.MEDIA_REPAIR_PHASE, completedSceneIds, pendingSceneIds, failedSceneIds, updatedAt: new Date().toISOString() };
  await saveProjectDetailToDb(project);
};
// Projects with a video batch running (Flow batches and single image/video generation share it).
export const activeVideoProjectKeys = new Set<string>();
