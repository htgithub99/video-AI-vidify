import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, MARKDOWN_REGEX, STYLE_DIRECTIVE_CONFIG, STYLE_LOCK_CONFIG, resolveStylePreset } from "../constants";
import { VisualStyleProfile } from "../types";

const normalizeField = (value: unknown): string => _.trim(_.replace(_.toString(value), MARKDOWN_REGEX, STYLE_DIRECTIVE_CONFIG.EMPTY_STRING));

const resolveWorldRendering = (worldRendering: string, backgroundMode?: string): string => {
  const normalized = normalizeField(worldRendering);
  if (_.isEqual(backgroundMode, STYLE_DIRECTIVE_CONFIG.CONTEXTUAL_MODE)) {
    const contextualResult = _.trim(_.replace(normalized, STYLE_DIRECTIVE_CONFIG.SOLID_WHITE_BG_PATTERN, STYLE_DIRECTIVE_CONFIG.CONTEXTUAL_ENVIRONMENT_TEXT));
    return contextualResult || STYLE_DIRECTIVE_CONFIG.CONTEXTUAL_ENVIRONMENT_TEXT;
  }
  if (_.includes([STYLE_DIRECTIVE_CONFIG.MINIMAL_MODE, STYLE_DIRECTIVE_CONFIG.WHITE_MODE, STYLE_DIRECTIVE_CONFIG.SOLID_MODE], backgroundMode)) {
    return STYLE_DIRECTIVE_CONFIG.MINIMAL_ENVIRONMENT_TEXT;
  }
  if (_.isEqual(backgroundMode, STYLE_DIRECTIVE_CONFIG.TRANSPARENT_MODE)) {
    return STYLE_DIRECTIVE_CONFIG.TRANSPARENT_ENVIRONMENT_TEXT;
  }
  return normalized;
};

export const normalizeVisualStyleProfile = (value: unknown): VisualStyleProfile => ({
  medium: normalizeField(_.get(value, "medium")),
  characterType: normalizeField(_.get(value, "characterType")),
  characterDna: normalizeField(_.get(value, "characterDna")),
  lineDna: normalizeField(_.get(value, "lineDna")),
  shapeLanguage: normalizeField(_.get(value, "shapeLanguage")),
  colorDna: normalizeField(_.get(value, "colorDna")),
  colorPhilosophy: normalizeField(_.get(value, "colorPhilosophy")),
  renderingDna: normalizeField(_.get(value, "renderingDna")),
  lightingStyle: normalizeField(_.get(value, "lightingStyle")),
  texture: normalizeField(_.get(value, "texture")),
  detailLevel: normalizeField(_.get(value, "detailLevel")),
  visualComplexity: normalizeField(_.get(value, "visualComplexity")),
  periodCues: normalizeField(_.get(value, "periodCues")),
  worldRendering: normalizeField(_.get(value, "worldRendering")),
  compositionLanguage: normalizeField(_.get(value, "compositionLanguage")),
  facialExpressionLanguage: normalizeField(_.get(value, "facialExpressionLanguage")),
  overallMood: normalizeField(_.get(value, "overallMood")),
  adaptiveElements: normalizeField(_.get(value, "adaptiveElements")),
  negativeStylePrompt: normalizeField(_.get(value, "negativeStylePrompt")),
  sampleSpecificContent: _.uniq(_.compact(_.map(_.castArray(_.get(value, "sampleSpecificContent", [])), normalizeField))),
  lockedStyleElements: _.uniq(_.compact(_.map(_.castArray(_.get(value, "lockedStyleElements", [])), normalizeField))),
  flexibleElements: _.uniq(_.compact(_.map(_.castArray(_.get(value, "flexibleElements", [])), normalizeField))),
});

export const createCharacterConstructionDirective = (profile?: VisualStyleProfile): string => {
  if (!profile) return STYLE_DIRECTIVE_CONFIG.EMPTY_STRING;
  const medium = normalizeField(profile.medium);
  const characterType = normalizeField(profile.characterType);
  const colorDna = normalizeField(profile.colorDna);
  const renderingDna = normalizeField(profile.renderingDna);

  return _.join(_.compact([medium, characterType, colorDna, renderingDna]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
};

export const createMasterStylePrefix = (profile?: VisualStyleProfile): string => {
  if (!profile) return STYLE_DIRECTIVE_CONFIG.EMPTY_STRING;
  const medium = normalizeField(profile.medium);
  const characterType = normalizeField(profile.characterType);
  const lineDna = normalizeField(profile.lineDna);
  const colorDna = normalizeField(profile.colorDna);

  return _.join(_.compact([medium, characterType, lineDna, colorDna]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
};

export const createMasterStyleSuffix = (profile?: VisualStyleProfile, backgroundMode?: string): string => {
  if (!profile) return STYLE_DIRECTIVE_CONFIG.EMPTY_STRING;
  const renderingDna = normalizeField(profile.renderingDna);
  const worldRendering = resolveWorldRendering(normalizeField(profile.worldRendering), backgroundMode);

  return _.join(_.compact([renderingDna, worldRendering]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
};

export const createSoftStyleDirective = (profile: VisualStyleProfile, backgroundMode?: string): string => {
  const normalizedWorldRendering = resolveWorldRendering(normalizeField(profile.worldRendering), backgroundMode);
  return _.join(_.compact([createCharacterConstructionDirective(profile), normalizedWorldRendering]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR) || IMAGE_PROMPT_COMPILER_CONFIG.LOCKED_REFERENCE_STYLE;
};

export const createThumbnailStyleDirective = (sceneProfile?: VisualStyleProfile, thumbnailProfile?: VisualStyleProfile, backgroundMode?: string): string => {
  const characterSource = sceneProfile || thumbnailProfile;
  const presentationSource = thumbnailProfile || sceneProfile;
  const normalizedWorldRendering = resolveWorldRendering(normalizeField(presentationSource?.worldRendering), backgroundMode);

  return _.join(_.compact([createCharacterConstructionDirective(characterSource), normalizedWorldRendering]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
};

export const resolveNegativeStylePrompt = (profile?: VisualStyleProfile): string => {
  if (!profile?.negativeStylePrompt) return STYLE_DIRECTIVE_CONFIG.EMPTY_STRING;
  return normalizeField(profile.negativeStylePrompt);
};

export const normalizeExtractedStyle = (value: unknown): string => normalizeField(value);

export const ensureSharedCharacterStyleLock = (value: unknown): string => {
  const style = normalizeExtractedStyle(value);
  if (_.isEmpty(style) || STYLE_LOCK_CONFIG.SHARED_PERSON_PATTERN.test(style)) return style;
  return _.join([style, STYLE_LOCK_CONFIG.SHARED_PERSON_RULE], STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
};

export const resolveReferenceLockedStyle = (style: unknown, _hasReferences: boolean): string => {
  const preset = resolveStylePreset(_.toString(style));
  return preset.positivePrompt;
};

export const removeConflictingStyleTerms = (value: string, referenceLocked: boolean): string => (referenceLocked ? _.trim(value.replace(IMAGE_PROMPT_COMPILER_CONFIG.CONFLICTING_STYLE_PATTERN, STYLE_DIRECTIVE_CONFIG.EMPTY_STRING).replace(IMAGE_PROMPT_COMPILER_CONFIG.COMMA_CLEANUP_REGEX, ", ").replace(IMAGE_PROMPT_COMPILER_CONFIG.PUNCTUATION_SPACE_REGEX, "$1")) : value);
