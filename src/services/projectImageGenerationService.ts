import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants, SYSTEM_FETCH_CONFIG, VIDEO_GENERATION_MOTION_DIRECTIVE } from "../constants";
import { safeSystemFetch, safeSystemFetchStream } from "../lib/shared-utils";
import { GenerateType, SceneAssetStatus, StoryboardScene } from "../types";

export interface ProjectImageItem { sceneId: string; prompt: string; generateType?: GenerateType; idempotencyKey?: string; referenceImages?: string[]; continuityKey?: string; }
export interface ProjectImageResult { sceneId: string; success: boolean; base64?: string; fallbackUrl?: string; warning?: string; assetType?: GenerateType.Image | GenerateType.Video; }
type ImagePayloadFactory = (item: ProjectImageItem) => object;
interface ProjectImageGenerationConfig {
  items: ProjectImageItem[];
  visualConfig: object;
  style?: string;
  sandboxConfig?: object;
  cancelRef?: { current: boolean };
  onBatchResult: (result: ProjectImageResult) => void;
}
export interface ProjectImageGenerationSummary { completedSceneIds: string[]; failedSceneIds: string[]; cancelled: boolean; }
export interface SceneAssetSummary { total: number; completed: number; missingSceneIds: string[]; rejectedSceneIds: string[]; complete: boolean; }

const EDITORIAL_VIDEO_CONFIG = {
  MINIMUM_SCORE: 4,
  ADJACENT_ESSENTIAL_SCORE: 9,
  MIN_MOTION_SCORE: 3,
  DURATION_MIN: 3,
  DURATION_MAX: 9,
  ADJACENT_INDEX_DELTA: 2,
  MAX_AI_RANK_BONUS: 3,
  SCORES: { GENERAL_ACTION: 5, STRONG_STORY_MOTION: 3, ENVIRONMENTAL_MOTION: 3, DECORATIVE_PENALTY: -5, HIGH_VALUE_PURPOSE: 4, VISUAL_HOOK_AND_EVIDENCE: 2, DURATION_RANGE: 2, SINGLE_FRAME_LAYOUT: 1, STATIC_PURPOSE_PENALTY: -4, STATIC_CAMERA_PENALTY: -2, EMPTY_ACTION_PENALTY: -2 },
} as const;

const MOTION_REGEX = { ASPECT_RATIO_FLAG: /\s+--ar\s+[^\s]+/gi, MULTI_SHOT_EXACT: /exactly\s+[3-5]\s+chronological\s+(?:camera\s+setups|shots)/i, MULTI_SHOT_RANGE: /(?:3\s+to\s+5|three\s+to\s+five)\s+(?:timed\s+)?chronological\s+shots/i, MULTI_SHOT_ENUMERATED: /shot\s*1/i, SHOT_2: /shot\s*2/i, SHOT_3: /shot\s*3/i, MOTION_DIRECTION_SUFFIX: /Video motion direction:[\s\S]*$/i, HAS_MOTION_DIRECTION: /Video motion direction:/i, ACTION_PATTERN: /\b(?:walk(?:s|ed|ing)?|run(?:s|ning)?|turn(?:s|ed|ing)?|open(?:s|ed|ing)?|close(?:s|d|ing)?|enter(?:s|ed|ing)?|exit(?:s|ed|ing)?|drive|drives|driving|travel(?:s|ed|ing)?|fall(?:s|ing)?|rise|rises|rising|fight(?:s|ing)?|dance|dances|dancing|move(?:s|d|ing)?|pour(?:s|ed|ing)?|throw(?:s|ing)?|drop(?:s|ped|ping)?|reveal(?:s|ed|ing)?|transform(?:s|ed|ing)?|collapse|collapses|collapsed|chase|chases|chasing|exchange(?:s|d|ing)?|hand(?:s|ed|ing)? over|sign(?:s|ed|ing)?|hide|hides|hiding|discover(?:s|ed|ing)?|fold(?:s|ed|ing)?|unfold(?:s|ed|ing)?|flip(?:s|ped|ping)?|tear(?:s|ing)?|giằng|bước|chạy|mở|đóng|đổ|ném|rơi|biến đổi|sụp đổ|đuổi|trao|nhận|ký|giấu|phát hiện|gấp|lật|xé)\b/i, ENVIRONMENTAL_MOTION: /\b(?:rain|smoke|traffic|crowd|waves|wind|fire|machine|conveyor|storm|mưa|khói|giao thông|đám đông|sóng|gió|lửa|máy móc)\b/i, DECORATIVE_GESTURE: /\b(?:stretch(?:es|ed|ing)?|lean(?:s|ed|ing)? back|pose|poses|posing|smile|smiles|smiling|stare|stares|staring|look|looks|looking|hold|holds|holding|sit|sits|sitting|stand|stands|standing|slump|slumps|slumping|drop(?:s|ped|ping)? (?:her |his )?head|head (?:in|into) (?:her |his )?hands|vươn vai|tạo dáng|mỉm cười|nhìn chằm chằm|đứng yên|ngồi yên|gục đầu|ôm đầu)\b/i, STRONG_STORY_MOTION: /\b(?:walk(?:s|ed|ing)? (?:through|into|out|toward|past)|enter(?:s|ed|ing)?|exit(?:s|ed|ing)?|sign(?:s|ed|ing)? (?:a |the |her |his )?(?:paper|document|contract|form)|scrawl(?:s|ed|ing)? (?:a |the |her |his )?(?:name|signature)|hand(?:s|ed|ing)? over|exchange(?:s|d|ing)?|drop(?:s|ped|ping)? (?:a |the |her |his )?(?:phone|smartphone|document|glass|bag|object)|open(?:s|ed|ing)? (?:a |the )?(?:door|document|envelope|box)|flip(?:s|ped|ping)? (?:open )?(?:a |the )?(?:document|page|folder)|fold(?:s|ed|ing)? (?:a |the )?(?:uniform|garment|letter|document)|tear(?:s|ing)? (?:a |the )?(?:letter|document)|bước (?:vào|ra|qua|về phía)|ký|trao|nhận|mở (?:cửa|tài liệu|phong bì)|lật (?:tài liệu|trang giấy)|gấp (?:đồng phục|quần áo|lá thư))\b/i, } as const;

const HIGH_VALUE_PURPOSES = new Set(["action", "reveal", "punchline", "callback", "montage"]);
const STATIC_PURPOSES = new Set(["reaction", "emotional_hold"]);
const MOTION_ELIGIBLE_PURPOSES = new Set(["action", "reveal", "montage", "callback"]);

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

export const prepareProjectMediaPrompt = (item: ProjectImageItem): string => {
  const prompt = _.trim(item.prompt);
  if (!_.isEqual(item.generateType, GenerateType.Video)) return prompt;
  const cleanPrompt = _.trim(prompt.replace(MOTION_REGEX.ASPECT_RATIO_FLAG, " "));
  const isAiAuthoredMultiShotFilmClip = MOTION_REGEX.MULTI_SHOT_EXACT.test(cleanPrompt) || MOTION_REGEX.MULTI_SHOT_RANGE.test(cleanPrompt) || (MOTION_REGEX.MULTI_SHOT_ENUMERATED.test(cleanPrompt) && MOTION_REGEX.SHOT_2.test(cleanPrompt) && MOTION_REGEX.SHOT_3.test(cleanPrompt));
  if (isAiAuthoredMultiShotFilmClip) return _.trim(cleanPrompt.replace(MOTION_REGEX.MOTION_DIRECTION_SUFFIX, ""));
  if (MOTION_REGEX.HAS_MOTION_DIRECTION.test(cleanPrompt)) return cleanPrompt;
  return _.join([_.trimEnd(cleanPrompt, ". "), VIDEO_GENERATION_MOTION_DIRECTIVE], ". ");
};

const hasImageResult = (result?: ProjectImageResult): boolean => _.every([result?.success, _.some([result?.base64, result?.fallbackUrl], isUsableGeneratedAssetUrl)], Boolean);
const isGenerationCancelled = (cancelRef?: { current: boolean }): boolean => _.includes([true], Boolean(cancelRef?.current));
const cleanBatchSession = async (): Promise<void> => {
  await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {});
};

export const generateProjectImageOnce = async (item: ProjectImageItem, createPayload: ImagePayloadFactory, signal?: AbortSignal): Promise<ProjectImageResult> => {
  const emptyResult: ProjectImageResult = { sceneId: item.sceneId, success: false };
  if (signal?.aborted) return emptyResult;
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, createPayload(item), signal);
  const base64 = _.defaultTo(_.get(response.data, REFACTOR_CONSTANTS.AVG_BASE64_KEY), _.get(response.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY));
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
  const generationSucceeded = _.get(response.data, REFACTOR_CONSTANTS.AVG_SUCCESS_KEY, response.success);
  return { sceneId: item.sceneId, success: _.every([response.success, _.some([generationSucceeded, _.isEqual(item.generateType, GenerateType.Image)], Boolean), _.some([base64, fallbackUrl], isUsableGeneratedAssetUrl)], Boolean), base64, fallbackUrl, warning: response.error, assetType: item.generateType === GenerateType.Video ? GenerateType.Video : GenerateType.Image, };
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
  const validSceneIds = new Set(_.map(scenes, "id"));
  const selectedIds: string[] = _.take(_.uniq(_.filter(_.map(_.castArray(_.get(response.data, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, [])), _.toString), (id) => validSceneIds.has(id))), maxVideoScenes);
  return rankEditorialVideoSceneIds(scenes, selectedIds, maxVideoScenes);
};

const calculateSceneMotionScore = (hasGeneralAction: boolean, hasStrongStoryMotion: boolean, hasEnvironmentalMotion: boolean, isDecorativeGesture: boolean): number => {
  const scoreSum = _.sum([hasGeneralAction ? EDITORIAL_VIDEO_CONFIG.SCORES.GENERAL_ACTION : 0, hasStrongStoryMotion ? EDITORIAL_VIDEO_CONFIG.SCORES.STRONG_STORY_MOTION : 0, hasEnvironmentalMotion ? EDITORIAL_VIDEO_CONFIG.SCORES.ENVIRONMENTAL_MOTION : 0, isDecorativeGesture && !hasStrongStoryMotion ? EDITORIAL_VIDEO_CONFIG.SCORES.DECORATIVE_PENALTY : 0]);
  return _.max([0, scoreSum]) || 0;
};

const calculateEditorialSceneScore = (scene: StoryboardScene, motionScore: number, aiRankValue: number): number =>
  _.sum([ motionScore,
    HIGH_VALUE_PURPOSES.has(_.toLower(_.toString(scene.shotPurpose))) ? EDITORIAL_VIDEO_CONFIG.SCORES.HIGH_VALUE_PURPOSE : 0,
    !_.isEmpty(scene.visualHook) && !_.isEmpty(scene.storyEvidence) ? EDITORIAL_VIDEO_CONFIG.SCORES.VISUAL_HOOK_AND_EVIDENCE : 0,
    _.inRange(_.defaultTo(scene.duration, 0), EDITORIAL_VIDEO_CONFIG.DURATION_MIN, EDITORIAL_VIDEO_CONFIG.DURATION_MAX) ? EDITORIAL_VIDEO_CONFIG.SCORES.DURATION_RANGE : 0,
    _.isEqual(scene.layout, "single_frame") ? EDITORIAL_VIDEO_CONFIG.SCORES.SINGLE_FRAME_LAYOUT : 0,
    STATIC_PURPOSES.has(_.toLower(_.toString(scene.shotPurpose))) ? EDITORIAL_VIDEO_CONFIG.SCORES.STATIC_PURPOSE_PENALTY : 0,
    _.isEqual(_.toLower(_.toString(scene.cameraMotion)), "static") ? EDITORIAL_VIDEO_CONFIG.SCORES.STATIC_CAMERA_PENALTY : 0,
    _.isEmpty(scene.visibleAction) ? EDITORIAL_VIDEO_CONFIG.SCORES.EMPTY_ACTION_PENALTY : 0,
    aiRankValue, ]);

export const rankEditorialVideoSceneIds = (scenes: StoryboardScene[], aiSelectedIds: string[], maxVideoScenes: number): string[] => {
  const aiRank = new Map(_.map(aiSelectedIds, (id, index) => [id, _.subtract(aiSelectedIds.length, index)]));
  const rankedCandidates = _.orderBy(
    _.map(scenes, (scene, index) => {
      const drawableMotion = _.join([scene.visibleAction, scene.prompt], " ");
      const hasStrongStoryMotion = MOTION_REGEX.STRONG_STORY_MOTION.test(drawableMotion);
      const hasEnvironmentalMotion = MOTION_REGEX.ENVIRONMENTAL_MOTION.test(drawableMotion);
      const hasGeneralAction = MOTION_REGEX.ACTION_PATTERN.test(drawableMotion);
      const isDecorativeGesture = MOTION_REGEX.DECORATIVE_GESTURE.test(drawableMotion);
      const purpose = _.toLower(_.toString(scene.shotPurpose));
      const motionEligible = hasStrongStoryMotion || hasEnvironmentalMotion || (hasGeneralAction && !isDecorativeGesture && MOTION_ELIGIBLE_PURPOSES.has(purpose));
      const motionScore = calculateSceneMotionScore(hasGeneralAction, hasStrongStoryMotion, hasEnvironmentalMotion, isDecorativeGesture);
      const aiRankBonus = aiRank.has(scene.id) ? _.min([EDITORIAL_VIDEO_CONFIG.MAX_AI_RANK_BONUS, aiRank.get(scene.id)!]) || 0 : 0;
      const score = calculateEditorialSceneScore(scene, motionScore, aiRankBonus);
      return { id: scene.id, index, chapterId: scene.chapterId, motionEligible, motionScore, score };
    }),
    ["score", "index"],
    ["desc", "asc"],
  );

  const fallbackIds: string[] = [];
  const coveredChapters = new Set<string>();
  for (const candidate of rankedCandidates) {
    if (!candidate.motionEligible || _.lt(candidate.motionScore, EDITORIAL_VIDEO_CONFIG.MIN_MOTION_SCORE) || _.lt(candidate.score, EDITORIAL_VIDEO_CONFIG.MINIMUM_SCORE)) continue;
    const adjacentSelection = _.some(fallbackIds, (id) => Math.abs(_.findIndex(scenes, { id }) - candidate.index) < EDITORIAL_VIDEO_CONFIG.ADJACENT_INDEX_DELTA);
    if (adjacentSelection && _.lt(candidate.score, EDITORIAL_VIDEO_CONFIG.ADJACENT_ESSENTIAL_SCORE)) continue;
    const chapterKey = _.toString(candidate.chapterId);
    const repeatsCoveredChapter = !_.isEmpty(chapterKey) && coveredChapters.has(chapterKey);
    const uncoveredChaptersRemain = _.some(rankedCandidates, (item) => _.gte(item.score, EDITORIAL_VIDEO_CONFIG.MINIMUM_SCORE) && !_.isEmpty(item.chapterId) && !coveredChapters.has(_.toString(item.chapterId)));
    if (repeatsCoveredChapter && uncoveredChaptersRemain && _.lt(candidate.score, EDITORIAL_VIDEO_CONFIG.ADJACENT_ESSENTIAL_SCORE)) continue;
    fallbackIds.push(candidate.id);
    if (!_.isEmpty(chapterKey)) coveredChapters.add(chapterKey);
    if (_.gte(fallbackIds.length, maxVideoScenes)) break;
  }
  return _.sortBy(fallbackIds, (id) => _.findIndex(scenes, { id }));
};

export const resolveSceneGenerateType = (sceneId: string, generateType: GenerateType, videoSceneIds: string[]): GenerateType.Image | GenerateType.Video => (_.some([_.isEqual(generateType, GenerateType.Video), _.every([_.isEqual(generateType, GenerateType.Mixed), _.includes(videoSceneIds, sceneId)], Boolean)], Boolean) ? GenerateType.Video : GenerateType.Image);

export const generateProjectImages = async ({ items, visualConfig, style, sandboxConfig, cancelRef, onBatchResult }: ProjectImageGenerationConfig): Promise<ProjectImageGenerationSummary> => {
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
        { items: uniqueItems, visualConfig, style, sandboxConfig },
        (result: ProjectImageResult) => {
          resultsBySceneId.set(result.sceneId, result);
          onBatchResult(result);
        },
        undefined,
        undefined,
        cancelRef,
        _.isEqual(_.get(visualConfig, "generateType"), GenerateType.Video) ? SYSTEM_FETCH_CONFIG.VIDEO_STREAM_INACTIVITY_TIMEOUT_MS : SYSTEM_FETCH_CONFIG.STREAM_INACTIVITY_TIMEOUT_MS,
      );
      const missingResultCount = _.size(uniqueItems) - resultsBySceneId.size;
      if (_.gt(missingResultCount, SecurityConstants.ZERO)) {
        reportMissingResults(REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_INCOMPLETE.replace(SecurityConstants.PLACEHOLDER_0, _.toString(missingResultCount)));
      }
    } catch (error) {
      reportMissingResults(error instanceof Error ? error.message : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR);
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
    await cleanBatchSession();
  }
};
