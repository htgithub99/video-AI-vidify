import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants, SYSTEM_FETCH_CONFIG, VIDEO_GENERATION_MOTION_DIRECTIVE } from "../constants";
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

export const hasSceneAsset = (scene: Pick<StoryboardScene, "assetUrl" | "assetUrls">): boolean =>
  _.some([scene.assetUrl, ..._.castArray(_.defaultTo(scene.assetUrls, []))], (assetUrl) => !_.isEmpty(assetUrl));

export const getSceneAssetSummary = (scenes: StoryboardScene[]): SceneAssetSummary => {
  const rejectedSceneIds = _.map(
    _.filter(scenes, (scene) => _.includes([SceneAssetStatus.Rejected, SceneAssetStatus.Failed], scene.assetStatus)),
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

export const prepareProjectMediaPrompt = (item: ProjectImageItem): string => {
  const prompt = _.trim(item.prompt);
  if (!_.isEqual(item.generateType, GenerateType.Video)) return prompt;
  // Aspect ratio is selected in the Gemini UI. Keeping an image-model flag in
  // the prose adds noise and can be rendered literally by a video model.
  const cleanPrompt = _.trim(prompt.replace(/\s+--ar\s+[^\s]+/gi, " "));
  const isAiAuthoredMultiShotFilmClip = /exactly\s+[3-5]\s+chronological\s+(?:camera\s+setups|shots)/i.test(cleanPrompt)
    || /(?:3\s+to\s+5|three\s+to\s+five)\s+(?:timed\s+)?chronological\s+shots/i.test(cleanPrompt)
    || (/shot\s*1/i.test(cleanPrompt) && /shot\s*2/i.test(cleanPrompt) && /shot\s*3/i.test(cleanPrompt));
  if (isAiAuthoredMultiShotFilmClip) {
    const withoutSingleShotContract = _.trim(cleanPrompt.replace(/Video motion direction:[\s\S]*$/i, ""));
    // The AI-authored film prompt already contains its complete shot plan,
    // timing, continuity, dialogue and sound. Do not append creative prose in
    // application code or override the AI's editorial decisions.
    return withoutSingleShotContract;
  }
  if (/Video motion direction:/i.test(cleanPrompt)) return cleanPrompt;
  return _.join([_.trimEnd(cleanPrompt, ". "), VIDEO_GENERATION_MOTION_DIRECTIVE], ". ");
};

const hasImageResult = (result?: ProjectImageResult): boolean =>
  _.every([result?.success, _.some([result?.base64, result?.fallbackUrl], isUsableGeneratedAssetUrl)], Boolean);

const isGenerationCancelled = (cancelRef?: { current: boolean }): boolean => _.includes([true], Boolean(cancelRef?.current));
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
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, createPayload(item), signal);
  const base64 = _.defaultTo(_.get(response.data, REFACTOR_CONSTANTS.AVG_BASE64_KEY), _.get(response.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY));
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
  const generationSucceeded = _.get(response.data, REFACTOR_CONSTANTS.AVG_SUCCESS_KEY, response.success);
  return {
    sceneId: item.sceneId,
    success: _.every(
      [
        response.success,
        _.some([generationSucceeded, _.isEqual(item.generateType, GenerateType.Image)], Boolean),
        _.some([base64, fallbackUrl], isUsableGeneratedAssetUrl),
      ],
      Boolean,
    ),
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

export const selectVideoSceneIds = async (scenes: StoryboardScene[], generateType: GenerateType, maxVideoScenes: number): Promise<string[]> => {
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
  const validSceneIds = new Set(_.map(scenes, "id"));
  const selectedIds: string[] = _.take(
    _.uniq(_.filter(_.map(_.castArray(_.get(response.data, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, [])), _.toString), (id) => validSceneIds.has(id))),
    maxVideoScenes,
  );
  return rankEditorialVideoSceneIds(scenes, selectedIds, maxVideoScenes);
};

const ACTION_PATTERN =
  /\b(?:walk(?:s|ed|ing)?|run(?:s|ning)?|turn(?:s|ed|ing)?|open(?:s|ed|ing)?|close(?:s|d|ing)?|enter(?:s|ed|ing)?|exit(?:s|ed|ing)?|drive|drives|driving|travel(?:s|ed|ing)?|fall(?:s|ing)?|rise|rises|rising|fight(?:s|ing)?|dance|dances|dancing|move(?:s|d|ing)?|pour(?:s|ed|ing)?|throw(?:s|ing)?|drop(?:s|ped|ping)?|reveal(?:s|ed|ing)?|transform(?:s|ed|ing)?|collapse|collapses|collapsed|chase|chases|chasing|exchange(?:s|d|ing)?|hand(?:s|ed|ing)? over|sign(?:s|ed|ing)?|hide|hides|hiding|discover(?:s|ed|ing)?|fold(?:s|ed|ing)?|unfold(?:s|ed|ing)?|flip(?:s|ped|ping)?|tear(?:s|ing)?|giằng|bước|chạy|mở|đóng|đổ|ném|rơi|biến đổi|sụp đổ|đuổi|trao|nhận|ký|giấu|phát hiện|gấp|lật|xé)\b/i;
const ENVIRONMENTAL_MOTION_PATTERN =
  /\b(?:rain|smoke|traffic|crowd|waves|wind|fire|machine|conveyor|storm|mưa|khói|giao thông|đám đông|sóng|gió|lửa|máy móc)\b/i;
const DECORATIVE_GESTURE_PATTERN =
  /\b(?:stretch(?:es|ed|ing)?|lean(?:s|ed|ing)? back|pose|poses|posing|smile|smiles|smiling|stare|stares|staring|look|looks|looking|hold|holds|holding|sit|sits|sitting|stand|stands|standing|slump|slumps|slumping|drop(?:s|ped|ping)? (?:her |his )?head|head (?:in|into) (?:her |his )?hands|vươn vai|tạo dáng|mỉm cười|nhìn chằm chằm|đứng yên|ngồi yên|gục đầu|ôm đầu)\b/i;
const STRONG_STORY_MOTION_PATTERN =
  /\b(?:walk(?:s|ed|ing)? (?:through|into|out|toward|past)|enter(?:s|ed|ing)?|exit(?:s|ed|ing)?|sign(?:s|ed|ing)? (?:a |the |her |his )?(?:paper|document|contract|form)|scrawl(?:s|ed|ing)? (?:a |the |her |his )?(?:name|signature)|hand(?:s|ed|ing)? over|exchange(?:s|d|ing)?|drop(?:s|ped|ping)? (?:a |the |her |his )?(?:phone|smartphone|document|glass|bag|object)|open(?:s|ed|ing)? (?:a |the )?(?:door|document|envelope|box)|flip(?:s|ped|ping)? (?:open )?(?:a |the )?(?:document|page|folder)|fold(?:s|ed|ing)? (?:a |the )?(?:uniform|garment|letter|document)|tear(?:s|ing)? (?:a |the )?(?:letter|document)|bước (?:vào|ra|qua|về phía)|ký|trao|nhận|mở (?:cửa|tài liệu|phong bì)|lật (?:tài liệu|trang giấy)|gấp (?:đồng phục|quần áo|lá thư))\b/i;
const HIGH_VALUE_PURPOSES = new Set(["action", "reveal", "punchline", "callback", "montage"]);
const STATIC_PURPOSES = new Set(["reaction", "emotional_hold"]);
const MINIMUM_EDITORIAL_VIDEO_SCORE = 4;
const ADJACENT_ESSENTIAL_SCORE = 9;

export const rankEditorialVideoSceneIds = (scenes: StoryboardScene[], aiSelectedIds: string[], maxVideoScenes: number): string[] => {
  const aiRank = new Map(_.map(aiSelectedIds, (id, index) => [id, _.subtract(aiSelectedIds.length, index)]));
  const rankedCandidates = _.orderBy(
    _.map(scenes, (scene, index) => {
      const drawableMotion = _.join([scene.visibleAction, scene.prompt], " ");
      const hasStrongStoryMotion = STRONG_STORY_MOTION_PATTERN.test(drawableMotion);
      const hasEnvironmentalMotion = ENVIRONMENTAL_MOTION_PATTERN.test(drawableMotion);
      const hasGeneralAction = ACTION_PATTERN.test(drawableMotion);
      const isDecorativeGesture = DECORATIVE_GESTURE_PATTERN.test(drawableMotion);
      const purpose = _.toLower(_.toString(scene.shotPurpose));
      const motionEligible =
        hasStrongStoryMotion ||
        hasEnvironmentalMotion ||
        (hasGeneralAction && !isDecorativeGesture && _.includes(["action", "reveal", "montage", "callback"], purpose));
      const motionScore = _.max([
        0,
        _.sum([
          hasGeneralAction ? 5 : 0,
          hasStrongStoryMotion ? 3 : 0,
          hasEnvironmentalMotion ? 3 : 0,
          isDecorativeGesture && !hasStrongStoryMotion ? -5 : 0,
        ]),
      ])!;
      return {
        id: scene.id,
        index,
        chapterId: scene.chapterId,
        motionEligible,
        motionScore,
        score: _.sum([
          motionScore,
          HIGH_VALUE_PURPOSES.has(_.toLower(_.toString(scene.shotPurpose))) ? 4 : 0,
          !_.isEmpty(scene.visualHook) && !_.isEmpty(scene.storyEvidence) ? 2 : 0,
          _.inRange(_.defaultTo(scene.duration, 0), 3, 9) ? 2 : 0,
          _.isEqual(scene.layout, "single_frame") ? 1 : 0,
          STATIC_PURPOSES.has(_.toLower(_.toString(scene.shotPurpose))) ? -4 : 0,
          _.isEqual(_.toLower(_.toString(scene.cameraMotion)), "static") ? -2 : 0,
          _.isEmpty(scene.visibleAction) ? -2 : 0,
          aiRank.has(scene.id) ? _.min([3, aiRank.get(scene.id)!]) : 0,
        ]),
      };
    }),
    ["score", "index"],
    ["desc", "asc"],
  );
  const fallbackIds: string[] = [];
  const coveredChapters = new Set<string>();
  for (const candidate of rankedCandidates) {
    if (!candidate.motionEligible) continue;
    if (_.lt(candidate.motionScore, 3)) continue;
    if (_.lt(candidate.score, MINIMUM_EDITORIAL_VIDEO_SCORE)) continue;
    const adjacentSelection = _.some(fallbackIds, (id) => {
      const selectedIndex = _.findIndex(scenes, { id });
      return Math.abs(selectedIndex - candidate.index) < 2;
    });
    if (adjacentSelection && _.lt(candidate.score, ADJACENT_ESSENTIAL_SCORE)) continue;
    const chapterKey = _.toString(candidate.chapterId);
    const repeatsCoveredChapter = !_.isEmpty(chapterKey) && coveredChapters.has(chapterKey);
    const uncoveredChaptersRemain = _.some(
      rankedCandidates,
      (item) => _.gte(item.score, MINIMUM_EDITORIAL_VIDEO_SCORE) && !_.isEmpty(item.chapterId) && !coveredChapters.has(_.toString(item.chapterId)),
    );
    if (repeatsCoveredChapter && uncoveredChaptersRemain && _.lt(candidate.score, ADJACENT_ESSENTIAL_SCORE)) continue;
    fallbackIds.push(candidate.id);
    if (!_.isEmpty(chapterKey)) coveredChapters.add(chapterKey);
    if (_.gte(fallbackIds.length, maxVideoScenes)) break;
  }
  return _.sortBy(fallbackIds, (id) => _.findIndex(scenes, { id }));
};

export const resolveSceneGenerateType = (
  sceneId: string,
  generateType: GenerateType,
  videoSceneIds: string[],
): GenerateType.Image | GenerateType.Video =>
  _.some(
    [
      _.isEqual(generateType, GenerateType.Video),
      _.every([_.isEqual(generateType, GenerateType.Mixed), _.includes(videoSceneIds, sceneId)], Boolean),
    ],
    Boolean,
  )
    ? GenerateType.Video
    : GenerateType.Image;

export const generateProjectImages = async ({
  items,
  visualConfig,
  style,
  sandboxConfig,
  cancelRef,
  onBatchResult,
}: ProjectImageGenerationConfig): Promise<ProjectImageGenerationSummary> => {
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
        _.isEqual(_.get(visualConfig, "generateType"), GenerateType.Video)
          ? SYSTEM_FETCH_CONFIG.VIDEO_STREAM_INACTIVITY_TIMEOUT_MS
          : SYSTEM_FETCH_CONFIG.STREAM_INACTIVITY_TIMEOUT_MS,
      );
      const missingResultCount = _.size(uniqueItems) - resultsBySceneId.size;
      if (_.gt(missingResultCount, SecurityConstants.ZERO)) {
        reportMissingResults(
          REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_INCOMPLETE.replace(SecurityConstants.PLACEHOLDER_0, _.toString(missingResultCount)),
        );
      }
    } catch (error) {
      const warning = error instanceof Error ? error.message : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
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
