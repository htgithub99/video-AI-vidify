import { SOURCE_TEXT_1_4, SOURCE_TEXT_SYMBOL_10 } from "../constants/sourceText";
import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, MARKDOWN_REGEX, STYLE_DIRECTIVE_CONFIG } from "../constants";
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
export const createCharacterConstructionDirective = (profile?: VisualStyleProfile): string => {
  if (!profile) return STYLE_DIRECTIVE_CONFIG.EMPTY_STRING;
  const medium = normalizeField(profile.medium);
  const characterType = normalizeField(profile.characterType);
  const colorDna = normalizeField(profile.colorDna);
  const renderingDna = normalizeField(profile.renderingDna);
  return _.join(_.compact([medium, characterType, colorDna, renderingDna]), STYLE_DIRECTIVE_CONFIG.SENTENCE_SEPARATOR);
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
export const normalizeExtractedStyle = (value: unknown): string => normalizeField(value);
export const removeConflictingStyleTerms = (value: string, referenceLocked: boolean): string => (referenceLocked ? _.trim(value.replace(IMAGE_PROMPT_COMPILER_CONFIG.CONFLICTING_STYLE_PATTERN, STYLE_DIRECTIVE_CONFIG.EMPTY_STRING).replace(IMAGE_PROMPT_COMPILER_CONFIG.COMMA_CLEANUP_REGEX, SOURCE_TEXT_SYMBOL_10).replace(IMAGE_PROMPT_COMPILER_CONFIG.PUNCTUATION_SPACE_REGEX, SOURCE_TEXT_1_4)) : value);
