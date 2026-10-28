import {
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_FALLBACKURLS,
  SOURCE_TEXT_GENERATETYPE,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_INVALID_AI_VIDEO_SCENE_SELECTION,
  SOURCE_TEXT_NEWPROJECTID,
  SOURCE_TEXT_REMOTEMEDIACREATED,
  SOURCE_TEXT_REMOTEMEDIAID,
  SOURCE_TEXT_REMOTEMEDIAIDS,
  SOURCE_TEXT_REMOTEVIDEOSOURCEURL,
  SOURCE_TEXT_RESULTS,
  SOURCE_TEXT_SUCCESS,
  SOURCE_TEXT_VIDEO_SCENE_SELECTION_FAILED,
  SOURCE_TEXT_WARNING,
} from "../constants/sourceText";
import { getErrorMessage } from "../utils/errorUtils";
import _ from "lodash";
import { API_ROUTES, FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_MEDIA_CONFIG, GEMINI_MEDIA_ERRORS, REFACTOR_CONSTANTS, SecurityConstants, SYSTEM_FETCH_CONFIG } from "../constants";
import { safeSystemFetch, safeSystemFetchStream } from "../lib/shared-utils";
import { GenerateType, SceneAssetStatus, StoryboardScene } from "../types";
export interface ProjectImageItem {
  sceneId: string;
  prompt: string;
  generateType?: GenerateType;
  idempotencyKey?: string;
  referenceImages?: string[];
  referenceImageNames?: string[];
  requireReferenceReady?: boolean;
  continuityKey?: string;
}
export interface ProjectImageResult {
  sceneId: string;
  success: boolean;
  base64?: string;
  fallbackUrl?: string;
  warning?: string;
  assetType?: GenerateType.Image | GenerateType.Video;
  newProjectId?: string;
  remoteMediaId?: string;
  remoteMediaIds?: string[];
  remoteVideoSourceUrl?: string;
  remoteMediaCreated?: boolean;
  fallbackUrls?: string[];
}
type ImagePayloadFactory = (item: ProjectImageItem) => object;
interface ProjectImageGenerationConfig {
  items: ProjectImageItem[];
  visualConfig: object;
  style?: string;
  sandboxConfig?: object;
  cancelRef?: { current: boolean };
  retainBrowserSession?: boolean;
  onBatchResult: (result: ProjectImageResult) => void;
}
export interface ProjectImageGenerationSummary {
  completedSceneIds: string[];
  failedSceneIds: string[];
  cancelled: boolean;
}
export interface ProjectFlowVideoBatchResponse {
  success: boolean;
  results: ProjectImageResult[];
  newProjectId?: string;
  warning?: string;
}
export interface FlowVideoRecoveryRequest {
  projectId: string;
  sceneId: string;
  mediaId?: string;
  mediaIds?: string[];
  expectedOutputCount?: number;
}
export interface SceneAssetSummary {
  total: number;
  completed: number;
  missingSceneIds: string[];
  rejectedSceneIds: string[];
  complete: boolean;
}
export const hasSceneAsset = (scene: Pick<StoryboardScene, "assetUrl" | "assetUrls">): boolean => _.some([scene.assetUrl, ..._.castArray(_.defaultTo(scene.assetUrls, []))], (assetUrl) => !_.isEmpty(assetUrl));
export const getSceneAssetSummary = (scenes: StoryboardScene[]): SceneAssetSummary => {
  const rejectedSceneIds = _.map(
    _.filter(scenes, (scene) => _.includes([SceneAssetStatus.Rejected, SceneAssetStatus.Failed], scene.assetStatus)),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const missingSceneIds = _.uniq(_.map(_.reject(scenes, hasSceneAsset), REFACTOR_CONSTANTS.AVG_ID_KEY));
  const total = _.size(scenes),
    completed = _.subtract(total, _.size(missingSceneIds));
  return { total, completed, missingSceneIds, rejectedSceneIds, complete: _.isEqual(completed, total) };
};
export const isUsableGeneratedAssetUrl = (value?: string): boolean => !_.isEmpty(value);
export const isPersistedProjectVideoUrl = (value?: string): boolean => FLOW_VIDEO_MEDIA_CONFIG.PROJECT_ASSET_URL_PATTERN.test(_.toString(value));
export const isProviderGenerationRejection = (value?: string): boolean => GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(_.toString(value));
export const isStaleFlowVideoRecoveryError = (value?: string): boolean => FLOW_VIDEO_MEDIA_CONFIG.STALE_MEDIA_PATTERN.test(_.toString(value));
export const isNonRetryableFlowVideoError = (message?: string): boolean => {
  const normalizedMessage = _.trim(_.toString(message));
  return !_.isEmpty(normalizedMessage) && _.some(FLOW_DIRECT_VIDEO_CONFIG.NON_RETRYABLE_SETUP_ERRORS, (pattern) => pattern.test(normalizedMessage));
};
export const prepareProjectMediaPrompt = (item: ProjectImageItem): string => item.prompt;
const hasImageResult = (result?: ProjectImageResult): boolean => _.every([result?.success, _.some([result?.base64, result?.fallbackUrl], isUsableGeneratedAssetUrl)], Boolean);
const isGenerationCancelled = (cancelRef?: { current: boolean }): boolean => _.includes([true], Boolean(cancelRef?.current));
const cleanBatchSession = async (): Promise<void> => {
  await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {});
};
export const generateProjectImageOnce = async (item: ProjectImageItem, createPayload: ImagePayloadFactory, signal?: AbortSignal): Promise<ProjectImageResult> => {
  const emptyResult: ProjectImageResult = { sceneId: item.sceneId, success: false };
  if (signal?.aborted) return emptyResult;
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, { ...createPayload(item), sceneId: item.sceneId, idempotencyKey: item.idempotencyKey }, signal);
  const base64 = _.defaultTo(_.get(response.data, REFACTOR_CONSTANTS.AVG_BASE64_KEY), _.get(response.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY));
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
  const generationSucceeded = _.get(response.data, REFACTOR_CONSTANTS.AVG_SUCCESS_KEY, response.success);
  const generationWarning = _.find([response.success ? undefined : response.error, _.get(response.data, SOURCE_TEXT_WARNING), _.get(response.data, SOURCE_TEXT_ERROR)], (message) => !_.isEmpty(message));
  return {
    sceneId: item.sceneId,
    success: _.every([response.success, _.some([generationSucceeded, _.isEqual(item.generateType, GenerateType.Image)], Boolean), _.some([base64, fallbackUrl], isUsableGeneratedAssetUrl)], Boolean),
    base64,
    fallbackUrl,
    warning: _.toString(generationWarning),
    assetType: item.generateType === GenerateType.Video ? GenerateType.Video : GenerateType.Image,
    newProjectId: _.get(response.data, SOURCE_TEXT_NEWPROJECTID),
    remoteMediaId: _.get(response.data, SOURCE_TEXT_REMOTEMEDIAID),
    remoteMediaIds: _.compact(_.castArray(_.get(response.data, SOURCE_TEXT_REMOTEMEDIAIDS) || [])),
    remoteVideoSourceUrl: _.get(response.data, SOURCE_TEXT_REMOTEVIDEOSOURCEURL),
    remoteMediaCreated: Boolean(_.get(response.data, SOURCE_TEXT_REMOTEMEDIACREATED)),
    fallbackUrls: _.compact(_.castArray(_.get(response.data, SOURCE_TEXT_FALLBACKURLS) || [])),
  };
};
export const submitProjectFlowVideoBatch = async (items: ProjectImageItem[], visualConfig: object, sandboxConfig: object, signal?: AbortSignal): Promise<ProjectFlowVideoBatchResponse> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_FLOW_VIDEO_BATCH, { items: _.map(items, (item) => ({ ...item, generateType: GenerateType.Video })), visualConfig: { ...visualConfig, generateType: GenerateType.Video }, sandboxConfig }, signal);
  return {
    success: Boolean(response.success && _.get(response.data, SOURCE_TEXT_SUCCESS)),
    results: _.castArray(_.get(response.data, SOURCE_TEXT_RESULTS) || []),
    newProjectId: _.toString(_.get(response.data, SOURCE_TEXT_NEWPROJECTID)) || undefined,
    warning: _.toString(_.find([response.success ? undefined : response.error, _.get(response.data, SOURCE_TEXT_WARNING)], (message) => !_.isEmpty(message))),
  };
};
export const recoverProjectFlowVideo = async (request: FlowVideoRecoveryRequest, signal?: AbortSignal): Promise<ProjectImageResult> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_RECOVER_FLOW_VIDEO, request, signal);
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
  const fallbackUrls = _.filter(_.castArray(_.get(response.data, SOURCE_TEXT_FALLBACKURLS) || []), isPersistedProjectVideoUrl);
  const success = Boolean(response.success && _.get(response.data, REFACTOR_CONSTANTS.AVG_SUCCESS_KEY) && isPersistedProjectVideoUrl(fallbackUrl) && _.size(fallbackUrls) >= _.defaultTo(request.expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT));
  const remoteMediaIds = _.compact(_.castArray(request.mediaIds || request.mediaId || []));
  return { sceneId: request.sceneId, success, fallbackUrl, fallbackUrls, warning: _.toString(_.find([response.success ? undefined : response.error, _.get(response.data, SOURCE_TEXT_WARNING)], (message) => !_.isEmpty(message))), assetType: GenerateType.Video, remoteMediaId: _.head(remoteMediaIds), remoteMediaIds, remoteMediaCreated: _.get(response.data, SOURCE_TEXT_REMOTEMEDIACREATED, true) };
};
export const createProjectImageUrl = (result: ProjectImageResult): string => {
  if (!_.isEmpty(result.base64)) {
    return _.join([_.isEqual(result.assetType, GenerateType.Video) ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, result.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  }
  return isUsableGeneratedAssetUrl(result.fallbackUrl) ? result.fallbackUrl! : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};
export const selectVideoSceneIds = async (scenes: StoryboardScene[], generateType: GenerateType, maxVideoScenes: number): Promise<string[]> => {
  if (_.isEqual(generateType, GenerateType.Video)) return _.map(scenes, REFACTOR_CONSTANTS.AVG_ID_KEY);
  if (!_.isEqual(generateType, GenerateType.Mixed) || !_.gt(maxVideoScenes, SecurityConstants.ZERO)) return [];
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_SELECT_VIDEO_SCENES, {
    storyboard: _.map(scenes, (scene) => ({
      id: scene.id,
      script: scene.script,
      prompt: scene.prompt,
      visualIntent: scene.visualIntent,
      visibleAction: scene.visibleAction,
      reaction: scene.reaction,
      storyEvidence: scene.storyEvidence,
      visualHook: scene.visualHook,
      shotPurpose: scene.shotPurpose,
      shotSize: scene.shotSize,
      composition: scene.composition,
      duration: scene.duration,
      chapterId: scene.chapterId,
      transition: scene.transition,
      cameraMotion: scene.cameraMotion,
    })),
    maxVideoScenes,
  });
  if (!response.success || _.get(response.data, SOURCE_TEXT_ERROR)) {
    throw new Error(_.toString(response.error || _.get(response.data, SOURCE_TEXT_ERROR) || SOURCE_TEXT_VIDEO_SCENE_SELECTION_FAILED));
  }
  const validSceneIds = new Set(_.map(scenes, SOURCE_TEXT_ID));
  const selectedIds = _.map(_.castArray(_.get(response.data, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, [])), _.toString);
  const hasInvalidSelection = _.gt(selectedIds.length, maxVideoScenes) || _.uniq(selectedIds).length !== selectedIds.length || _.some(selectedIds, (id) => !validSceneIds.has(id));
  if (hasInvalidSelection) throw new Error(SOURCE_TEXT_INVALID_AI_VIDEO_SCENE_SELECTION);
  return selectedIds;
};
export const resolveSceneGenerateType = (sceneId: string, generateType: GenerateType, videoSceneIds: string[]): GenerateType.Image | GenerateType.Video => (_.some([_.isEqual(generateType, GenerateType.Video), _.every([_.isEqual(generateType, GenerateType.Mixed), _.includes(videoSceneIds, sceneId)], Boolean)], Boolean) ? GenerateType.Video : GenerateType.Image);
export const generateProjectImages = async ({ items, visualConfig, style, sandboxConfig, cancelRef, retainBrowserSession = false, onBatchResult }: ProjectImageGenerationConfig): Promise<ProjectImageGenerationSummary> => {
  const uniqueItems = _.map(
    _.uniqBy(items, (item) => item.idempotencyKey || item.sceneId),
    (item) => ({ ...item, prompt: prepareProjectMediaPrompt(item) }),
  );
  const resultsBySceneId = new Map<string, ProjectImageResult>();
  const reportMissingResults = (warning: string): void => {
    _.forEach(uniqueItems, (item) => {
      if (resultsBySceneId.has(item.sceneId)) return;
      const failedResult: ProjectImageResult = { sceneId: item.sceneId, success: false, warning };
      resultsBySceneId.set(item.sceneId, failedResult);
      onBatchResult(failedResult);
    });
  };
  try {
    try {
      await safeSystemFetchStream(
        API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES,
        { items: uniqueItems, visualConfig, style, sandboxConfig, retainBrowserSession },
        (result: ProjectImageResult) => {
          resultsBySceneId.set(result.sceneId, result);
          onBatchResult(result);
        },
        undefined,
        undefined,
        cancelRef,
        _.isEqual(_.get(visualConfig, SOURCE_TEXT_GENERATETYPE), GenerateType.Video) ? SYSTEM_FETCH_CONFIG.VIDEO_STREAM_INACTIVITY_TIMEOUT_MS : SYSTEM_FETCH_CONFIG.STREAM_INACTIVITY_TIMEOUT_MS,
      );
      const missingResultCount = _.size(uniqueItems) - resultsBySceneId.size;
      if (_.gt(missingResultCount, SecurityConstants.ZERO)) {
        reportMissingResults(REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_INCOMPLETE.replace(SecurityConstants.PLACEHOLDER_0, _.toString(missingResultCount)));
      }
    } catch (error) {
      reportMissingResults(getErrorMessage(error, REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR));
    }
    const completedSceneIds = _.map(
      _.filter(uniqueItems, (item) => hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );
    const failedSceneIds = _.map(
      _.filter(uniqueItems, (item) => !hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );
    return { completedSceneIds, failedSceneIds, cancelled: isGenerationCancelled(cancelRef) };
  } finally {
    if (!retainBrowserSession) await cleanBatchSession();
  }
};
