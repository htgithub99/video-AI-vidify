import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import {
  SOURCE_TEMPLATE_AR,
  SOURCE_TEMPLATE_B_B,
  SOURCE_TEXT_1_4,
  SOURCE_TEXT_BLOCKING,
  SOURCE_TEXT_CAMERAANGLE,
  SOURCE_TEXT_COMPOSITION,
  SOURCE_TEXT_EMOTIONAL_HOLD,
  SOURCE_TEXT_EVERY_PERSON,
  SOURCE_TEXT_EVERY_PERSON_USES_THE_EXACT_SAME,
  SOURCE_TEXT_GI,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_I_2,
  SOURCE_TEXT_REACTION,
  SOURCE_TEXT_SCENEID,
  SOURCE_TEXT_SHOTSIZE,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_23,
  SOURCE_TEXT_WARNING,
} from "../constants/sourceText";
import _ from "lodash";
import { BackgroundMode, CharacterConfig, ImagePromptQualityIssue, ImagePromptQualityReport, StoryboardScene, TextInImageMode, VisualBible } from "../types";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
export interface ImagePromptQualityOptions {
  backgroundMode?: BackgroundMode;
  textMode?: TextInImageMode;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  requireStructuredPlan?: boolean;
  forbidAspectRatio?: boolean;
}
const ILLUSTRATED_STYLE_PATTERN = /\b(?:2d|cartoon|illustration|illustrated|hand[- ]?drawn|vector|flat\s+color|chibi|stickman|comic|ink|line\s+art)\b/i;
const REALISTIC_STYLE_CONFLICT_PATTERN = /\b(?:realistic\s+cinematic|photorealistic|hyperrealistic|3d\s+render|dramatic\s+lighting|volumetric\s+lighting|award-winning\s+masterpiece|shot\s+on\s+\d+mm)\b/i;
const PEOPLE_REQUEST_PATTERN = /\b(?:person|people|character|characters|figure|figures|man|men|woman|women|child|children|family|worker|official|crowd|gambler|player)\b/i;
const PEOPLE_FORBIDDEN_PATTERN = /\b(?:objects? or environment only|do not add people|no people)\b/i;
const TEXT_FORBIDDEN_PATTERN = /\b(?:no text or logos|do not generate text|free of readable text)\b/i;
const QUOTED_TEXT_REQUEST_PATTERN = /\s*(?:with|showing|displaying|containing|bearing)?\s*(?:a\s+)?(?:clear\s+|readable\s+)?(?:vietnamese\s+)?(?:text|caption|label|lettering|words?)(?:\s+caption)?(?:\s+(?:reading|saying|labeled|labelled))?\s*['"][^'"]*['"]/gi;
const LABELED_TEXT_REQUEST_PATTERN = /\s*(?:showing|displaying|bearing)?\s*(?:a\s+)?(?:segment\s+)?(?:labeled|labelled|reading|saying)\s*['"][^'"]*['"]/gi;
const hasVietnameseNarration = (value: unknown): boolean => _.gte(_.size(_.toString(value).match(new RegExp(DETECTOR_VIETNAMESE_REGEX.source, SOURCE_TEXT_GI)) || []), 3);
const getQaTokens = (value: unknown): string[] => _.uniq(_.filter(_.words(_.toLower(_.deburr(_.toString(value)))), (token) => _.gte(_.size(token), IMAGE_PROMPT_QA_CONFIG.MIN_QA_TOKEN_LENGTH)));
const hasMinimumTokenOverlap = (prompt: string, source: unknown, minimumMatches: number): boolean => {
  const sourceTokens = getQaTokens(source);
  if (_.isEmpty(sourceTokens)) return true;
  return _.gte(_.size(_.intersection(getQaTokens(prompt), sourceTokens)), _.min([minimumMatches, _.size(sourceTokens)])!);
};
const normalizePromptComparisonText = (value: unknown): string => _.join(_.words(_.toLower(_.deburr(_.toString(value)))), RT_SHARED.SYMBOL_36A9E7);
const containsExactStyleLock = (prompt: string, styleLock: string): boolean => _.includes(normalizePromptComparisonText(prompt), normalizePromptComparisonText(styleLock));
const getCharacterLock = (character: CharacterConfig): string => _.join(_.compact([character.name, character.hair, character.signatureClothing, character.accessories]), RT_SHARED.SYMBOL_36A9E7);
const createIssue = (sceneId: string, code: string, severity: ImagePromptQualityIssue["severity"]): ImagePromptQualityIssue => ({ sceneId, code, severity });
export const removeGeneratedTextRequests = (prompt: string): string =>
  _.trim(
    prompt
      .replace(QUOTED_TEXT_REQUEST_PATTERN, "")
      .replace(LABELED_TEXT_REQUEST_PATTERN, "")
      .replace(/\s*,\s*,+/g, SOURCE_TEXT_SYMBOL_10)
      .replace(/\s+([,.;:])/g, SOURCE_TEXT_1_4),
  );
export const deduplicatePromptSentences = (text: string): string => {
  if (!text) return "";
  const parts = _.split(text, /(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const uniqueParts = _.filter(parts, (part) => {
    const normalized = _.toLower(_.trim(part));
    if (_.isEmpty(normalized) || _.size(normalized) < 5) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  return _.join(uniqueParts, RT_SHARED.SYMBOL_36A9E7);
};
export const sanitizeImagePrompt = (prompt: string): string => {
  let cleaned = _.trim(_.toString(prompt));
  cleaned = cleaned
    .replace(/Visual style guide:\s*[^\.]*\.\s*/gi, "")
    .replace(/Universal character anatomy rule:\s*[^\.]*\.\s*/gi, "")
    .replace(/Natural single-jointed limb posing without extra joints, disjointed elbows, or mutated arms\.\s*/gi, "")
    .replace(/one continuous frame without panels or collage\.\s*/gi, "")
    .replace(/Strict character visual lock:\s*every person uses the exact same[^\.]*\.\s*/gi, "")
    .replace(/Strict character visual lock:\s*[^\.]*\.\s*/gi, "")
    .replace(/Line art:\s*[^\.]*\.\s*/gi, "")
    .replace(/Palette:\s*[^\.]*\.\s*/gi, "")
    .replace(/Rendering:\s*[^\.]*\.\s*/gi, "")
    .replace(/Shape language:\s*[^\.]*\.\s*/gi, "")
    .replace(/clean minimal line art or detailed contextual environment supporting the scene narrative\.\s*/gi, "")
    .replace(/chibi stickman cartoon illustration[^\.]*\.\s*/gi, "")
    .replace(/every personcharacter uses the exact same\.\s*/gi, SOURCE_TEXT_EVERY_PERSON_USES_THE_EXACT_SAME)
    .replace(/every person\/character uses the exact same\.\s*/gi, SOURCE_TEXT_EVERY_PERSON_USES_THE_EXACT_SAME)
    .replace(/every personcharacter/gi, SOURCE_TEXT_EVERY_PERSON)
    .replace(/with round head shape, pill shaped torso, stick limbs with (?:circular joints|smooth continuous stick limbs) and simplified facial dots\.\s*/gi, "")
    .replace(/Always render complete facial features: distinct solid black eyes, eyebrows, nose dot, expressive line mouth, and hairstyle matching the reference\. Never leave the face blank or featureless\.\s*/gi, "")
    .replace(/with circular joints/gi, "")
    .replace(/circular joints/gi, "")
    .replace(/joint (?:dots|balls|spheres)/gi, "")
    .replace(/\.{2,}/g, SOURCE_TEXT_SYMBOL_23)
    .replace(/\s+/g, RT_SHARED.SYMBOL_36A9E7)
    .trim();
  return cleaned;
};
export const appendImagePromptAspectRatio = (prompt: string, aspectRatio?: string): string => {
  const aiGeneratedPrompt = _.trim(_.toString(prompt));
  if (_.isEmpty(aspectRatio) || IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.test(aiGeneratedPrompt)) {
    IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.lastIndex = 0;
    return aiGeneratedPrompt;
  }
  IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.lastIndex = 0;
  return SOURCE_TEMPLATE_AR(`${aiGeneratedPrompt}`, `${aspectRatio}`);
};
export const enforceImagePromptStyle = (prompt: string, targetStyle: string = "", narration: string = "", cameraMotion: string = "", textMode?: TextInImageMode, aspectRatio?: string): string => {
  void targetStyle;
  void narration;
  void cameraMotion;
  void textMode;
  return appendImagePromptAspectRatio(prompt, aspectRatio);
};
const hasBackgroundPolicy = (prompt: string, backgroundMode?: BackgroundMode): boolean => {
  const keywords = _.get(IMAGE_PROMPT_QA_CONFIG.BACKGROUND_KEYWORDS, backgroundMode || "", []);
  return _.isEmpty(keywords) || _.some(keywords, (keyword) => _.includes(_.toLower(prompt), keyword));
};
const getPromptTokens = (prompt: string): string[] => _.uniq(_.filter(_.words(_.toLower(prompt)), (token) => _.size(token) > 3));
const getAdjacentSimilarity = (first: string, second: string): number => {
  const firstTokens = getPromptTokens(first);
  const secondTokens = getPromptTokens(second);
  const unionSize = _.size(_.union(firstTokens, secondTokens));
  return unionSize ? _.size(_.intersection(firstTokens, secondTokens)) / unionSize : 0;
};
export const evaluateImagePrompts = (scenes: StoryboardScene[], options: ImagePromptQualityOptions = {}): ImagePromptQualityReport => {
  const blockingErrors: ImagePromptQualityIssue[] = [];
  const warnings: ImagePromptQualityIssue[] = [];
  const sanitizedScenes = _.map(scenes, (scene) => ({ ...scene, prompt: sanitizeImagePrompt(scene.prompt || "") }));
  _.forEach(sanitizedScenes, (scene, index) => {
    const wordCount = _.size(_.words(scene.prompt));
    if (_.isEmpty(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.EMPTY_PROMPT, SOURCE_TEXT_BLOCKING));
    const technicalPromptText = _.isEmpty(scene.textOverlay) ? scene.prompt : _.replace(scene.prompt, scene.textOverlay, "");
    if (hasVietnameseNarration(technicalPromptText)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.NON_ENGLISH_PROMPT, SOURCE_TEXT_BLOCKING));
    if (!IMAGE_PROMPT_QA_CONFIG.CAMERA_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_CAMERA, SOURCE_TEXT_BLOCKING));
    if (_.isEqual(TextInImageMode.NoText, options.textMode) && IMAGE_PROMPT_QA_CONFIG.READABLE_TEXT_REQUEST_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.READABLE_TEXT, SOURCE_TEXT_BLOCKING));
    if (PEOPLE_REQUEST_PATTERN.test(scene.prompt) && PEOPLE_FORBIDDEN_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.PEOPLE_CONFLICT, SOURCE_TEXT_BLOCKING));
    if (IMAGE_PROMPT_QA_CONFIG.READABLE_TEXT_REQUEST_PATTERN.test(scene.prompt) && TEXT_FORBIDDEN_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.TEXT_CONFLICT, SOURCE_TEXT_BLOCKING));
    if (ILLUSTRATED_STYLE_PATTERN.test(options.targetStyle || "") && REALISTIC_STYLE_CONFLICT_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.STYLE_CONFLICT, SOURCE_TEXT_BLOCKING));
    if (ILLUSTRATED_STYLE_PATTERN.test(options.targetStyle || "") && !ILLUSTRATED_STYLE_PATTERN.test(scene.prompt)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.STYLE_CONFLICT, SOURCE_TEXT_WARNING));
    if (options.forbidAspectRatio && IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.test(scene.prompt)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.AI_ASPECT_RATIO, SOURCE_TEXT_BLOCKING));
    IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.lastIndex = 0;
    if (IMAGE_PROMPT_QA_CONFIG.ENGINE_PARAMETER_PATTERN.test(_.replace(scene.prompt, IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN, ""))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ENGINE_SYNTAX_CONFLICT, SOURCE_TEXT_BLOCKING));
    if (IMAGE_PROMPT_QA_CONFIG.GENERIC_PORTRAIT_PATTERN.test(scene.prompt) && !_.includes([SOURCE_TEXT_REACTION, SOURCE_TEXT_EMOTIONAL_HOLD] as string[], scene.shotPurpose)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.GENERIC_CENTERED_PORTRAIT, SOURCE_TEXT_WARNING));
    if (options.requireStructuredPlan) {
      const characterIds = new Set(_.map(options.characters, SOURCE_TEXT_ID));
      const locationIds = new Set(_.map(options.visualBible?.locations, SOURCE_TEXT_ID));
      const propIds = new Set(_.map(options.visualBible?.props, SOURCE_TEXT_ID));
      if (_.isEmpty(_.trim(scene.visualIntent))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_VISUAL_INTENT, SOURCE_TEXT_WARNING));
      if (_.isEmpty(_.trim(scene.visibleAction))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_VISIBLE_ACTION, SOURCE_TEXT_WARNING));
      if (scene.textAllowed && _.isEmpty(_.trim(scene.textOverlay))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_TEXT_OVERLAY, SOURCE_TEXT_BLOCKING));
      if (!scene.textAllowed && !_.isEmpty(_.trim(scene.textOverlay))) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.FORBIDDEN_TEXT_OVERLAY, SOURCE_TEXT_BLOCKING));
      if (!_.isEmpty(scene.visibleAction) && IMAGE_PROMPT_QA_CONFIG.ABSTRACT_ONLY_PATTERN.test(_.trim(scene.visibleAction))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ABSTRACT_ACTION, SOURCE_TEXT_WARNING));
      if (!_.isNumber(scene.expectedSubjectCount)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_SUBJECT_COUNT, SOURCE_TEXT_WARNING));
      if (_.some(scene.characterIds, (id) => !characterIds.has(id))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_CHARACTER_ID, SOURCE_TEXT_WARNING));
      const namedCharacterRequested = _.some(options.characters, (character) => new RegExp(SOURCE_TEMPLATE_B_B(`${_.escapeRegExp(character.name)}`), SOURCE_TEXT_I_2).test(_.join([scene.prompt, scene.visibleAction], RT_SHARED.SYMBOL_36A9E7)));
      if (namedCharacterRequested && _.isEmpty(scene.characterIds)) blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_CHARACTER_ID, SOURCE_TEXT_BLOCKING));
      _.forEach(
        _.filter(options.characters, (character) => _.includes(scene.characterIds, character.id)),
        (character) => {
          if (!hasMinimumTokenOverlap(scene.prompt, getCharacterLock(character), IMAGE_PROMPT_QA_CONFIG.MIN_IDENTITY_TOKEN_MATCHES)) {
            blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_CHARACTER_LOCK, SOURCE_TEXT_BLOCKING));
          }
        },
      );
      if (!_.isEmpty(options.targetStyle) && !containsExactStyleLock(scene.prompt, options.targetStyle)) {
        blockingErrors.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_STYLE_CORE, SOURCE_TEXT_BLOCKING));
      }
      if (!_.isEmpty(locationIds) && _.isEmpty(scene.locationId)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_LOCATION_ID, SOURCE_TEXT_WARNING));
      if (!_.isEmpty(scene.locationId) && !locationIds.has(scene.locationId)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_LOCATION_ID, SOURCE_TEXT_WARNING));
      if (_.some(scene.propIds, (id) => !propIds.has(id))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.UNKNOWN_PROP_ID, SOURCE_TEXT_WARNING));
      if (_.some([scene.shotPurpose, scene.shotSize, scene.cameraAngle, scene.composition], (value) => _.isEmpty(_.trim(_.toString(value))))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.MISSING_SHOT_PLAN, SOURCE_TEXT_WARNING));
      const previousScene = sanitizedScenes[index - 1];
      const compositionKeys = [SOURCE_TEXT_SHOTSIZE, SOURCE_TEXT_CAMERAANGLE, SOURCE_TEXT_COMPOSITION] as const;
      if (previousScene && _.every(compositionKeys, (key) => _.isEqual(_.toLower(_.trim(_.toString(previousScene[key]))), _.toLower(_.trim(_.toString(scene[key])))))) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.ERROR_CODES.ADJACENT_COMPOSITION_DUPLICATE, SOURCE_TEXT_WARNING));
    }
    if (_.lt(wordCount, IMAGE_PROMPT_QA_CONFIG.MIN_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_SHORT, SOURCE_TEXT_WARNING));
    if (_.gt(wordCount, IMAGE_PROMPT_QA_CONFIG.MAX_WORDS)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.PROMPT_TOO_LONG, SOURCE_TEXT_WARNING));
    if (!hasBackgroundPolicy(scene.prompt, options.backgroundMode)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.BACKGROUND_POLICY, SOURCE_TEXT_WARNING));
    const previousScene = sanitizedScenes[index - 1];
    if (previousScene && _.gt(getAdjacentSimilarity(previousScene.prompt, scene.prompt), IMAGE_PROMPT_QA_CONFIG.MAX_ADJACENT_SIMILARITY)) warnings.push(createIssue(scene.id, IMAGE_PROMPT_QA_CONFIG.WARNING_CODES.ADJACENT_REPETITION, SOURCE_TEXT_WARNING));
  });
  const blockingSceneIds = new Set(_.map(blockingErrors, SOURCE_TEXT_SCENEID));
  return { totalPrompts: _.size(scenes), validPrompts: _.subtract(_.size(scenes), blockingSceneIds.size), blockingErrors, warnings, passed: _.isEmpty(blockingErrors) && !_.isEmpty(scenes) };
};
