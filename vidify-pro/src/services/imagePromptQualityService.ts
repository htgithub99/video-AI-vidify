import _ from "lodash";
import { BackgroundMode, ImagePromptQualityIssue, ImagePromptQualityReport, StoryboardScene, TextInImageMode } from "../types";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";

export interface ImagePromptQualityOptions {
  backgroundMode?: BackgroundMode;
  textMode?: TextInImageMode;
}

const createIssue = (sceneId: string, code: string, severity: ImagePromptQualityIssue["severity"]): ImagePromptQualityIssue => ({ sceneId, code, severity });

export const sanitizeImagePrompt = (prompt: string): string => _.trim(_.replace(prompt, IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN, " ").replace(IMAGE_PROMPT_QA_CONFIG.WHITESPACE_PATTERN, " "));

const hasBackgroundPolicy = (prompt: string, backgroundMode?: BackgroundMode): boolean => {
  const keywords = _.get(IMAGE_PROMPT_QA_CONFIG.BACKGROUND_KEYWORDS, backgroundMode || "", []);
  return _.isEmpty(keywords) || _.some(keywords, keyword => _.includes(_.toLower(prompt), keyword));
};

const getPromptTokens = (prompt: string): string[] => _.uniq(_.filter(_.words(_.toLower(prompt)), token => _.size(token) > 3));

const getAdjacentSimilarity = (first: string, second: string): number => {
  const firstTokens = getPromptTokens(first);
  const secondTokens = getPromptTokens(second);
  const unionSize = _.size(_.union(firstTokens, secondTokens));
  return unionSize ? _.size(_.intersection(firstTokens, secondTokens)) / unionSize : 0;
};

export const evaluateImagePrompts = (scenes: StoryboardScene[], options: ImagePromptQualityOptions = {}): ImagePromptQualityReport => {
  const blockingErrors: ImagePromptQualityIssue[] = [];
  const warnings: ImagePromptQualityIssue[] = [];
  const sanitizedScenes = _.map(scenes, scene => ({ ...scene, prompt: sanitizeImagePrompt(scene.prompt || "") }));

  _.forEach(sanitizedScenes, (scene, index) => {
    const wordCount = _.size(_.words(scene.prompt));
    if (_.isEmpty(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.EMPTY_PROMPT, "blocking"));
    if (!IMAGE_PROMPT_QA_CONFIG.CAMERA_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_CAMERA, "blocking"));
    if (_.includes([TextInImageMode.Auto, TextInImageMode.NoText], options.textMode) && IMAGE_PROMPT_QA_CONFIG.READABLE_TEXT_REQUEST_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.READABLE_TEXT, "blocking"));
    if (_.lt(wordCount, IMAGE_PROMPT_QA_CONFIG.MIN_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_SHORT, "warning"));
    if (_.gt(wordCount, IMAGE_PROMPT_QA_CONFIG.MAX_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_LONG, "warning"));
    if (!hasBackgroundPolicy(scene.prompt, options.backgroundMode)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.BACKGROUND_POLICY, "warning"));
    const previousScene = sanitizedScenes[index - 1];
    if (previousScene && _.gt(getAdjacentSimilarity(previousScene.prompt, scene.prompt), IMAGE_PROMPT_QA_CONFIG.MAX_ADJACENT_SIMILARITY)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.ADJACENT_REPETITION, "warning"));
  });

  const blockingSceneIds = new Set(_.map(blockingErrors, "sceneId"));
  return { totalPrompts: _.size(scenes), validPrompts: _.subtract(_.size(scenes), blockingSceneIds.size), blockingErrors, warnings, passed: _.isEmpty(blockingErrors) && !_.isEmpty(scenes) };
};
