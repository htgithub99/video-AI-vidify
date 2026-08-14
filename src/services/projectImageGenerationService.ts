import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants } from "../constants";
import { safeSystemFetch, safeSystemFetchStream } from "../lib/shared-utils";
import { GenerateType, SceneAssetStatus, StoryboardScene } from "../types";

export interface ProjectImageItem {
  sceneId: string;
  prompt: string;
  generateType?: GenerateType;
  idempotencyKey?: string;
  referenceImages?: string[];
  continuityKey?: string;
}

export interface ProjectImageResult {
  sceneId: string;
  success: boolean;
  base64?: string;
  fallbackUrl?: string;
  warning?: string;
  assetType?: GenerateType.Image | GenerateType.Video;
}

type ImagePayloadFactory = (item: ProjectImageItem) => object;

interface ProjectImageGenerationConfig {
  items: ProjectImageItem[];
  visualConfig: object;
  style?: string;
  sandboxConfig?: object;
  cancelRef?: { current: boolean };
  onBatchResult: (result: ProjectImageResult) => void;
}

export interface ProjectImageGenerationSummary {
  completedSceneIds: string[];
  failedSceneIds: string[];
  cancelled: boolean;
}

export interface SceneAssetSummary {
  total: number;
  completed: number;
  missingSceneIds: string[];
  rejectedSceneIds: string[];
  complete: boolean;
}

export const hasSceneAsset = (scene: Pick<StoryboardScene, "assetUrl" | "assetUrls">): boolean => (
  _.some(
    [scene.assetUrl, ..._.castArray(_.defaultTo(scene.assetUrls, []))],
    (assetUrl) => !_.isEmpty(assetUrl),
  )
);

export const getSceneAssetSummary = (scenes: StoryboardScene[]): SceneAssetSummary => {
  const rejectedSceneIds = _.map(
    _.filter(scenes, (scene) => _.includes(
      [SceneAssetStatus.Rejected, SceneAssetStatus.Failed],
      scene.assetStatus,
    )),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const missingSceneIds = _.uniq(_.map(_.reject(scenes, hasSceneAsset), REFACTOR_CONSTANTS.AVG_ID_KEY));
  const total = _.size(scenes);
  const completed = _.subtract(total, _.size(missingSceneIds));

  return {
    total,
    completed,
    missingSceneIds,
    rejectedSceneIds,
    complete: _.isEqual(completed, total),
  };
};

export const isUsableGeneratedAssetUrl = (value?: string): boolean => !_.isEmpty(value);

const hasImageResult = (result?: ProjectImageResult): boolean => (
  _.every([
    result?.success,
    _.some([result?.base64, result?.fallbackUrl], isUsableGeneratedAssetUrl),
  ], Boolean)
);

const isGenerationCancelled = (cancelRef?: { current: boolean }): boolean => (
  _.includes([true], Boolean(cancelRef?.current))
);
const cleanBatchSession = async (): Promise<void> => {
  await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {});
};

export const generateProjectImageOnce = async (
  item: ProjectImageItem,
  createPayload: ImagePayloadFactory,
  signal?: AbortSignal,
): Promise<ProjectImageResult> => {
  const emptyResult: ProjectImageResult = { sceneId: item.sceneId, success: false };
  if (signal?.aborted) return emptyResult;
  const response = await safeSystemFetch(
    API_ROUTES.PIPELINE_GENERATE_IMAGE,
    createPayload(item),
    signal,
  );
  const base64 = _.defaultTo(
    _.get(response.data, REFACTOR_CONSTANTS.AVG_BASE64_KEY),
    _.get(response.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY),
  );
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
  const generationSucceeded = _.get(
    response.data,
    REFACTOR_CONSTANTS.AVG_SUCCESS_KEY,
    response.success,
  );
  return {
    sceneId: item.sceneId,
    success: _.every([
      response.success,
      _.some([generationSucceeded, _.isEqual(item.generateType, GenerateType.Image)], Boolean),
      _.some([base64, fallbackUrl], isUsableGeneratedAssetUrl),
    ], Boolean),
    base64,
    fallbackUrl,
    warning: response.error,
    assetType: item.generateType === GenerateType.Video ? GenerateType.Video : GenerateType.Image,
  };
};

export const createProjectImageUrl = (result: ProjectImageResult): string => {
  if (!_.isEmpty(result.base64)) {
    return _.join(
      [
        _.isEqual(result.assetType, GenerateType.Video)
          ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX
          : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX,
        result.base64,
      ],
      REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    );
  }
  return isUsableGeneratedAssetUrl(result.fallbackUrl) ? result.fallbackUrl! : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

export const selectVideoSceneIds = async (
  scenes: StoryboardScene[],
  generateType: GenerateType,
  maxVideoScenes: number,
): Promise<string[]> => {
  if (_.isEqual(generateType, GenerateType.Video)) {
    return _.map(scenes, REFACTOR_CONSTANTS.AVG_ID_KEY);
  }
  if (!_.isEqual(generateType, GenerateType.Mixed)) {
    return [];
  }
  if (!_.gt(maxVideoScenes, SecurityConstants.ZERO)) {
    return [];
  }

  const response = await safeSystemFetch(API_ROUTES.PIPELINE_SELECT_VIDEO_SCENES, {
    storyboard: _.map(scenes, (scene) => ({
      id: scene.id,
      script: scene.script,
      prompt: scene.prompt,
      cameraMotion: scene.cameraMotion,
    })),
    maxVideoScenes,
  });
  return _.take(
    _.uniq(_.get(response.data, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, [])),
    maxVideoScenes,
  );
};

export const resolveSceneGenerateType = (
  sceneId: string,
  generateType: GenerateType,
  videoSceneIds: string[],
): GenerateType.Image | GenerateType.Video => (
  _.some([
    _.isEqual(generateType, GenerateType.Video),
    _.every([
      _.isEqual(generateType, GenerateType.Mixed),
      _.includes(videoSceneIds, sceneId),
    ], Boolean),
  ], Boolean)
    ? GenerateType.Video
    : GenerateType.Image
);

export const generateProjectImages = async ({
  items,
  visualConfig,
  style,
  sandboxConfig,
  cancelRef,
  onBatchResult,
}: ProjectImageGenerationConfig): Promise<ProjectImageGenerationSummary> => {
  const uniqueItems = _.uniqBy(items, item => item.idempotencyKey || item.sceneId);
  const resultsBySceneId = new Map<string, ProjectImageResult>();
  const reportMissingResults = (warning: string): void => {
    _.forEach(uniqueItems, item => {
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
        {
          items: uniqueItems,
          visualConfig,
          style,
          sandboxConfig,
        },
        (result: ProjectImageResult) => {
          resultsBySceneId.set(result.sceneId, result);
          onBatchResult(result);
        },
        undefined,
        undefined,
        cancelRef,
      );
      const missingResultCount = _.size(uniqueItems) - resultsBySceneId.size;
      if (_.gt(missingResultCount, SecurityConstants.ZERO)) {
        reportMissingResults(REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_INCOMPLETE.replace(
          SecurityConstants.PLACEHOLDER_0,
          _.toString(missingResultCount),
        ));
      }
    } catch (error) {
      const warning = error instanceof Error
        ? error.message
        : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
      reportMissingResults(warning);
    }

    if (isGenerationCancelled(cancelRef)) {
      const completedSceneIds = _.map(
        _.filter(uniqueItems, (item) => hasImageResult(resultsBySceneId.get(item.sceneId))),
        (item) => item.sceneId,
      );
      return {
        completedSceneIds,
        failedSceneIds: _.difference(_.map(uniqueItems, "sceneId"), completedSceneIds),
        cancelled: true,
      };
    }

    const completedSceneIds = _.map(
      _.filter(uniqueItems, (item) => hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );
    const failedSceneIds = _.map(
      _.filter(uniqueItems, (item) => !hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );

    return {
      completedSceneIds,
      failedSceneIds,
      cancelled: isGenerationCancelled(cancelRef),
    };
  } finally {
    await cleanBatchSession();
  }
};
