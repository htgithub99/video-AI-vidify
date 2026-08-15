import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, MARKDOWN_REGEX, STYLE_LOCK_CONFIG, STYLE_REFERENCE_DIRECTIVES } from "../constants";
import { VisualStyleProfile } from "../types";

const normalizeField = (value: unknown): string => _.trim(
  _.replace(_.toString(value), MARKDOWN_REGEX, ""),
);

export const normalizeVisualStyleProfile = (value: unknown): VisualStyleProfile => ({
  medium: normalizeField(_.get(value, "medium")),
  characterType: normalizeField(_.get(value, "characterType")),
  characterDna: normalizeField(_.get(value, "characterDna")),
  lineDna: normalizeField(_.get(value, "lineDna")),
  colorDna: normalizeField(_.get(value, "colorDna")),
  renderingDna: normalizeField(_.get(value, "renderingDna")),
  periodCues: normalizeField(_.get(value, "periodCues")),
  worldRendering: normalizeField(_.get(value, "worldRendering")),
  adaptiveElements: normalizeField(_.get(value, "adaptiveElements")),
  sampleSpecificContent: _.uniq(_.compact(_.map(
    _.castArray(_.get(value, "sampleSpecificContent", [])),
    normalizeField,
  ))),
});

export const createCharacterConstructionDirective = (profile?: VisualStyleProfile): string => {
  if (!profile) return "";
  const medium = normalizeField(profile.medium);
  const characterType = normalizeField(profile.characterType);
  const characterDna = normalizeField(profile.characterDna);
  const lineDna = normalizeField(profile.lineDna);
  const colorDna = normalizeField(profile.colorDna);
  const renderingDna = normalizeField(profile.renderingDna);
  const peopleRule = _.join(_.compact([
    STYLE_REFERENCE_DIRECTIVES.PEOPLE_RULE_PREFIX,
    characterType || STYLE_REFERENCE_DIRECTIVES.PEOPLE_RULE_FALLBACK,
    characterDna && `with ${characterDna}`,
    STYLE_REFERENCE_DIRECTIVES.FACIAL_FEATURES_RULE,
  ]), ". ");
  return _.join(_.compact([
    medium,
    peopleRule,
    lineDna && _.replace(STYLE_REFERENCE_DIRECTIVES.LINE_ART_TEMPLATE, "{value}", lineDna),
    colorDna && _.replace(STYLE_REFERENCE_DIRECTIVES.PALETTE_TEMPLATE, "{value}", colorDna),
    renderingDna && _.replace(STYLE_REFERENCE_DIRECTIVES.RENDERING_TEMPLATE, "{value}", renderingDna),
  ]), ". ");
};

export const createMasterStylePrefix = (profile?: VisualStyleProfile): string => {
  if (!profile) return "";
  const medium = normalizeField(profile.medium);
  const characterType = normalizeField(profile.characterType);
  const characterDna = normalizeField(profile.characterDna);
  const lineDna = normalizeField(profile.lineDna);
  return _.join(_.compact([
    medium,
    STYLE_REFERENCE_DIRECTIVES.UNIVERSAL_ANATOMY_MANDATE,
    characterType && _.replace(STYLE_REFERENCE_DIRECTIVES.UNIFIED_STYLE_TEMPLATE, "{value}", characterType),
    characterDna && _.replace(STYLE_REFERENCE_DIRECTIVES.EVERY_ANATOMY_TEMPLATE, "{value}", characterDna),
    STYLE_REFERENCE_DIRECTIVES.FULL_FACIAL_FEATURES,
    STYLE_REFERENCE_DIRECTIVES.STRICT_PROHIBITION,
    lineDna,
  ]), ". ");
};

export const createMasterStyleSuffix = (profile?: VisualStyleProfile): string => {
  if (!profile) return "";
  const renderingDna = normalizeField(profile.renderingDna);
  const worldRendering = normalizeField(profile.worldRendering);
  return _.join(_.compact([
    renderingDna && _.replace(STYLE_REFERENCE_DIRECTIVES.VISUAL_CONSISTENCY_TEMPLATE, "{value}", renderingDna),
    worldRendering && _.replace(STYLE_REFERENCE_DIRECTIVES.ENVIRONMENT_STYLE_TEMPLATE, "{value}", worldRendering),
    STYLE_REFERENCE_DIRECTIVES.LIMB_INTEGRITY,
    STYLE_REFERENCE_DIRECTIVES.UNIFORM_VISUAL_IDENTITY,
    STYLE_REFERENCE_DIRECTIVES.CLEAN_RENDER,
  ]), ". ");
};

export const createSoftStyleDirective = (profile: VisualStyleProfile): string => _.join(_.compact([
  createCharacterConstructionDirective(profile),
  normalizeField(profile.worldRendering),
]), ". ") || IMAGE_PROMPT_COMPILER_CONFIG.LOCKED_REFERENCE_STYLE;

export const createThumbnailStyleDirective = (
  sceneProfile?: VisualStyleProfile,
  thumbnailProfile?: VisualStyleProfile,
): string => {
  const characterSource = sceneProfile || thumbnailProfile;
  const presentationSource = thumbnailProfile || sceneProfile;
  return _.join(_.compact([
    createCharacterConstructionDirective(characterSource),
    normalizeField(presentationSource?.worldRendering),
  ]), ". ");
};

export const normalizeExtractedStyle = (value: unknown): string => _.trim(
  _.replace(_.toString(value), MARKDOWN_REGEX, ""),
);

export const ensureSharedCharacterStyleLock = (value: unknown): string => {
  const style = normalizeExtractedStyle(value);
  if (_.isEmpty(style) || STYLE_LOCK_CONFIG.SHARED_PERSON_PATTERN.test(style)) return style;
  return _.join([style, STYLE_LOCK_CONFIG.SHARED_PERSON_RULE], ". ");
};

export const resolveReferenceLockedStyle = (style: unknown, hasReferences: boolean): string => {
  const normalizedStyle = normalizeExtractedStyle(style);
  if (!hasReferences) return normalizedStyle;
  return _.trim(normalizedStyle) || IMAGE_PROMPT_COMPILER_CONFIG.LOCKED_REFERENCE_STYLE;
};

export const removeConflictingStyleTerms = (value: string, referenceLocked: boolean): string => referenceLocked
  ? _.trim(value
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.CONFLICTING_STYLE_PATTERN, "")
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.COMMA_CLEANUP_REGEX, ", ")
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.PUNCTUATION_SPACE_REGEX, "$1"))
  : value;
