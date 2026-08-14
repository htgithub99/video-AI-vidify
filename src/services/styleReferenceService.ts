import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, MARKDOWN_REGEX, STYLE_LOCK_CONFIG } from "../constants";
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
    "Strict character visual lock: every person/character uses the exact same",
    characterType || "character anatomy and construction",
    characterDna && `with ${characterDna}`,
    "Always render complete facial features: distinct solid black eyes, eyebrows, nose dot, expressive line mouth, and hairstyle matching the reference. Never leave the face blank or featureless",
  ]), ". ");
  return _.join(_.compact([
    medium,
    peopleRule,
    lineDna && `Line art: ${lineDna}`,
    colorDna && `Palette: ${colorDna}`,
    renderingDna && `Rendering: ${renderingDna}`,
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
    characterType && `Unified art style: ${characterType}`,
    characterDna && `Every character anatomy follows: ${characterDna}`,
    "Full facial features required: solid black dot eyes, eyebrows, small mouth, and hair styled per reference on every character",
    lineDna,
  ]), ". ");
};

export const createMasterStyleSuffix = (profile?: VisualStyleProfile): string => {
  if (!profile) return "";
  const renderingDna = normalizeField(profile.renderingDna);
  const worldRendering = normalizeField(profile.worldRendering);
  return _.join(_.compact([
    renderingDna && `Visual consistency: ${renderingDna}`,
    worldRendering && `Environment style: ${worldRendering}`,
    "Maintain uniform visual identity across all scenes, no blank faces, no style drift, no realistic 3D artifacts",
    "Clean render: strictly no grid lines, no alignment guide overlays, no watermark lines",
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
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s+([,.;:])/g, "$1"))
  : value;
