import _ from "lodash";
import { BackgroundMode, CharacterConfig, ImagePromptQualityIssue, ImagePromptQualityReport, StoryboardScene, TextInImageMode, VisualBible } from "../types";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";

export interface ImagePromptQualityOptions {
  backgroundMode?: BackgroundMode;
  textMode?: TextInImageMode;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  requireStructuredPlan?: boolean;
}

const STICKMAN_STYLE_PATTERN = /\b(?:stickman|stick\s+figure|chibi\s+stick)/i;
const REALISTIC_STYLE_CONFLICT_PATTERN = /\b(?:realistic\s+cinematic|photorealistic|hyperrealistic|3d\s+render|dramatic\s+lighting|volumetric\s+lighting|award-winning\s+masterpiece|shot\s+on\s+\d+mm)\b/i;
const GENERIC_PROMPT_PREFIX_PATTERN = /^\s*(?:stunning\s+high-quality\s+design\s+depicting\s*:\s*|a\s+clean\s+cinematic\s+visual\s+illustrating\s*:\s*)/i;
const LEADING_STYLE_CONNECTOR_PATTERN = /^\s*(?:[.]\s*)?of\s+/i;
const PARTIAL_STICKMAN_STYLE_PREFIX_PATTERN = /^simple\s+2d\s+cartoon\s+style\s+with\s+bold\s+black\s+outlines\s+of\s+/i;
const NO_TEXT_DIRECTIVE = "No text or logos";
const DEFAULT_STATIC_COMPOSITION = "medium wide shot";
const PEOPLE_REQUEST_PATTERN = /\b(?:person|people|character|characters|figure|figures|man|men|woman|women|child|children|family|worker|official|crowd|gambler|player)\b/i;
const PEOPLE_FORBIDDEN_PATTERN = /\b(?:objects? or environment only|do not add people|no people)\b/i;
const TEXT_FORBIDDEN_PATTERN = /\b(?:no text or logos|do not generate text|free of readable text)\b/i;
const QUOTED_TEXT_REQUEST_PATTERN = /\s*(?:with|showing|displaying|containing|bearing)?\s*(?:a\s+)?(?:clear\s+|readable\s+)?(?:vietnamese\s+)?(?:text|caption|label|lettering|words?)(?:\s+caption)?(?:\s+(?:reading|saying|labeled|labelled))?\s*['"][^'"]*['"]/gi;
const LABELED_TEXT_REQUEST_PATTERN = /\s*(?:showing|displaying|bearing)?\s*(?:a\s+)?(?:segment\s+)?(?:labeled|labelled|reading|saying)\s*['"][^'"]*['"]/gi;

const createIssue = (sceneId: string, code: string, severity: ImagePromptQualityIssue["severity"]): ImagePromptQualityIssue => ({ sceneId, code, severity });

export const removeGeneratedTextRequests = (prompt: string): string => _.trim(prompt
  .replace(QUOTED_TEXT_REQUEST_PATTERN, "")
  .replace(LABELED_TEXT_REQUEST_PATTERN, "")
  .replace(/\s*,\s*,+/g, ", ")
  .replace(/\s+([,.;:])/g, "$1"));

export const sanitizeImagePrompt = (prompt: string): string => {
  const aspectRatio = _.head(_.toString(prompt).match(IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN));
  const normalizedPrompt = _.trim(_.replace(prompt, IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN, " ").replace(IMAGE_PROMPT_QA_CONFIG.WHITESPACE_PATTERN, " "));
  const segments = _.compact(_.map(_.split(normalizedPrompt, ","), segment => _.trim(segment)));
  const sanitizedPrompt = _.join(_.uniqBy(
    segments,
    segment => _.toLower(segment),
  ), ", ");
  return _.join(_.compact([sanitizedPrompt, _.trim(aspectRatio)]), " ");
};

export const appendImagePromptAspectRatio = (prompt: string, aspectRatio?: string): string => {
  const promptWithoutAspectRatio = _.trim(_.replace(prompt, IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN, " ")
    .replace(IMAGE_PROMPT_QA_CONFIG.WHITESPACE_PATTERN, " ")
    .replace(IMAGE_PROMPT_QA_CONFIG.PUNCTUATION_WHITESPACE_PATTERN, "$1"));
  return _.isEmpty(aspectRatio)
    ? promptWithoutAspectRatio
    : `${promptWithoutAspectRatio} --ar ${aspectRatio}`;
};

export const enforceImagePromptStyle = (prompt: string, targetStyle = "", narration = "", cameraMotion = "", textMode?: TextInImageMode, aspectRatio?: string): string => {
  const existingAspectRatio = _.trim(_.head(_.toString(prompt).match(IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN)) || "")
    .replace(/^--ar\s+/i, "");
  const normalizedStyle = sanitizeImagePrompt(targetStyle);
  let normalizedPrompt = appendImagePromptAspectRatio(sanitizeImagePrompt(prompt), undefined)
    .replace(GENERIC_PROMPT_PREFIX_PATTERN, "");
  if (!_.isEmpty(normalizedStyle)) {
    normalizedPrompt = _.trim(normalizedPrompt.replace(
      new RegExp(_.escapeRegExp(normalizedStyle), "gi"),
      " ",
    ).replace(LEADING_STYLE_CONNECTOR_PATTERN, ""));
  }
  normalizedPrompt = normalizedPrompt.replace(PARTIAL_STICKMAN_STYLE_PREFIX_PATTERN, "");
  const stickmanTarget = STICKMAN_STYLE_PATTERN.test(normalizedStyle);
  if (stickmanTarget) {
    normalizedPrompt = normalizedPrompt.replace(new RegExp(REALISTIC_STYLE_CONFLICT_PATTERN.source, "gi"), "").replace(/\s*,\s*,+/g, ", ");
  }
  const subject = _.trim(normalizedPrompt) || _.trim(narration) || "the narrated action";
  normalizedPrompt = _.isEmpty(normalizedStyle) || _.includes(_.toLower(subject), _.toLower(normalizedStyle))
    ? subject
    : `${subject}. ${normalizedStyle}`;
  if (_.includes([TextInImageMode.Auto, TextInImageMode.NoText], textMode)) {
    normalizedPrompt = removeGeneratedTextRequests(normalizedPrompt);
    normalizedPrompt = normalizedPrompt.replace(/\b(?:winning\s+)?sign\b/gi, "small trophy");
    normalizedPrompt = `${normalizedPrompt}, ${NO_TEXT_DIRECTIVE}`;
  }
  const staticComposition = IMAGE_PROMPT_QA_CONFIG.CAMERA_PATTERN.test(cameraMotion)
    ? cameraMotion
    : DEFAULT_STATIC_COMPOSITION;
  if (!IMAGE_PROMPT_QA_CONFIG.CAMERA_PATTERN.test(normalizedPrompt)) normalizedPrompt = `${normalizedPrompt}, ${staticComposition}`;
  return appendImagePromptAspectRatio(
    sanitizeImagePrompt(normalizedPrompt),
    aspectRatio || existingAspectRatio,
  );
};

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
    if (_.isEqual(TextInImageMode.NoText, options.textMode) && IMAGE_PROMPT_QA_CONFIG.READABLE_TEXT_REQUEST_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.READABLE_TEXT, "blocking"));
    if (PEOPLE_REQUEST_PATTERN.test(scene.prompt) && PEOPLE_FORBIDDEN_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.PEOPLE_CONFLICT, "blocking"));
    if (IMAGE_PROMPT_QA_CONFIG.READABLE_TEXT_REQUEST_PATTERN.test(scene.prompt) && TEXT_FORBIDDEN_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.TEXT_CONFLICT, "blocking"));
    if (STICKMAN_STYLE_PATTERN.test(options.targetStyle || "") && (!STICKMAN_STYLE_PATTERN.test(scene.prompt) || REALISTIC_STYLE_CONFLICT_PATTERN.test(scene.prompt))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.STYLE_CONFLICT, "blocking"));
    if (IMAGE_PROMPT_QA_CONFIG.ENGINE_PARAMETER_PATTERN.test(_.replace(scene.prompt, IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN, ""))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ENGINE_SYNTAX_CONFLICT, "blocking"));
    if (IMAGE_PROMPT_QA_CONFIG.GENERIC_PORTRAIT_PATTERN.test(scene.prompt) && !_.includes(["reaction", "emotional_hold"], scene.shotPurpose)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.GENERIC_CENTERED_PORTRAIT, "warning"));
    if (options.requireStructuredPlan) {
      const characterIds = new Set(_.map(options.characters, "id"));
      const locationIds = new Set(_.map(options.visualBible?.locations, "id"));
      const propIds = new Set(_.map(options.visualBible?.props, "id"));
      if (_.isEmpty(_.trim(scene.visualIntent))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_VISUAL_INTENT, "blocking"));
      if (_.isEmpty(_.trim(scene.visibleAction))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_VISIBLE_ACTION, "blocking"));
      if (!_.isEmpty(scene.visibleAction) && IMAGE_PROMPT_QA_CONFIG.ABSTRACT_ONLY_PATTERN.test(_.trim(scene.visibleAction))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ABSTRACT_ACTION, "blocking"));
      if (!_.isNumber(scene.expectedSubjectCount)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_SUBJECT_COUNT, "blocking"));
      if (_.some(scene.characterIds, id => !characterIds.has(id))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_CHARACTER_ID, "blocking"));
      if (PEOPLE_REQUEST_PATTERN.test(_.join([scene.prompt, scene.visibleAction], " ")) && _.isEmpty(scene.characterIds) && !scene.allowBackgroundPeople) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_CHARACTER_ID, "blocking"));
      if (!_.isEmpty(locationIds) && _.isEmpty(scene.locationId)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_LOCATION_ID, "blocking"));
      if (!_.isEmpty(scene.locationId) && !locationIds.has(scene.locationId)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_LOCATION_ID, "blocking"));
      if (_.some(scene.propIds, id => !propIds.has(id))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_PROP_ID, "blocking"));
      if (_.some([scene.shotPurpose, scene.shotSize, scene.cameraAngle, scene.composition], value => _.isEmpty(_.trim(_.toString(value))))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_SHOT_PLAN, "blocking"));
      const previousScene = sanitizedScenes[index - 1];
      const compositionKeys = ["shotSize", "cameraAngle", "composition"] as const;
      if (previousScene && _.every(compositionKeys, key => _.isEqual(_.toLower(_.trim(_.toString(previousScene[key]))), _.toLower(_.trim(_.toString(scene[key])))))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ADJACENT_COMPOSITION_DUPLICATE, "blocking"));
    }
    if (_.lt(wordCount, IMAGE_PROMPT_QA_CONFIG.MIN_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_SHORT, "warning"));
    if (_.gt(wordCount, IMAGE_PROMPT_QA_CONFIG.MAX_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_LONG, "warning"));
    if (!hasBackgroundPolicy(scene.prompt, options.backgroundMode)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.BACKGROUND_POLICY, "warning"));
    const previousScene = sanitizedScenes[index - 1];
    if (previousScene && _.gt(getAdjacentSimilarity(previousScene.prompt, scene.prompt), IMAGE_PROMPT_QA_CONFIG.MAX_ADJACENT_SIMILARITY)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.ADJACENT_REPETITION, "warning"));
  });

  const blockingSceneIds = new Set(_.map(blockingErrors, "sceneId"));
  return {
    totalPrompts: _.size(scenes),
    validPrompts: _.subtract(_.size(scenes), blockingSceneIds.size),
    blockingErrors,
    warnings,
    passed: _.isEmpty(blockingErrors) && !_.isEmpty(scenes),
  };
};
