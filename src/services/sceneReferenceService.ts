import { SOURCE_TEXT_0_2, SOURCE_TEXT_1_3, SOURCE_TEXT_CHARACTERS, SOURCE_TEXT_CHARACTER_0_1, SOURCE_TEXT_CHARACTER_RELATIONSHIPS, SOURCE_TEXT_EXACTLY_0_RECURRING_MAIN_CHARACTERS_ARE, SOURCE_TEXT_ID, SOURCE_TEXT_ONE_RECURRING_MAIN_CHARACTER_IS_PRESENT, SOURCE_TEXT_SYMBOL_10, SOURCE_TEXT_SYMBOL_6, SOURCE_TEXT_SYMBOL_7 } from "../constants/sourceText";
import _ from "lodash";
import { CharacterConfig, StoryboardScene, VisualConfig } from "../types";
import { CINEMATIC_CHARACTER_PACK_CONFIG } from "../constants/cinematicConstants";
import { IMAGE_PROMPT_CONDITIONAL_RULES } from "../constants/imagePromptRules";
export const SCENE_REFERENCE_CONFIG = {
  MAX_IMAGES: CINEMATIC_CHARACTER_PACK_CONFIG.MAX_REFERENCES_PER_SCENE,
  CHARACTER_SECTION: SOURCE_TEXT_CHARACTERS,
  RELATIONSHIP_SECTION: SOURCE_TEXT_CHARACTER_RELATIONSHIPS,
  CHARACTER_LABEL: SOURCE_TEXT_CHARACTER_0_1,
  SINGLE_CHARACTER_INTRO: SOURCE_TEXT_ONE_RECURRING_MAIN_CHARACTER_IS_PRESENT,
  MULTI_CHARACTER_INTRO: SOURCE_TEXT_EXACTLY_0_RECURRING_MAIN_CHARACTERS_ARE,
  IDENTITY_LOCK: IMAGE_PROMPT_CONDITIONAL_RULES.CHARACTER_IDENTITY,
  CHARACTER_SEPARATOR: "\n",
  TRANSIENT_STYLE_PATTERN: /\b(?:cinematic|dramatic|volumetric)\s+lighting\b|\b(?:sharp\s+detail|high\s+quality|photorealistic|3d\s+render)\b/gi,
  DUPLICATE_SEPARATOR_PATTERN: /\s*,\s*,+/g,
} as const;
export interface SceneGenerationContext {
  characterIds: string[];
  prompt: string;
  referenceImages: string[];
  referenceImageNames: string[];
  referenceCharacterNames: string[];
  referenceRoles: string[];
}
const getCharacterIdentityDetails = (character: CharacterConfig): string[] => _.uniqBy(_.compact([character.genderPresentation, character.ageRange, character.ethnicitySkinTone, character.bodyBuild, character.faceShape, character.eyes, character.nose, character.hair, character.signatureClothing, character.accessories, character.silhouette]), (value) => _.toLower(_.trim(value)));
export const createCharacterIdentityDescription = (character: CharacterConfig): string => {
  const details = getCharacterIdentityDetails(character);
  if (!_.isEmpty(details)) return _.join(details, SOURCE_TEXT_SYMBOL_6);
  return _.trim(
    _.toString(character.prompt || character.description)
      .replace(SCENE_REFERENCE_CONFIG.TRANSIENT_STYLE_PATTERN, "")
      .replace(SCENE_REFERENCE_CONFIG.DUPLICATE_SEPARATOR_PATTERN, SOURCE_TEXT_SYMBOL_10),
  );
};
export const createCharacterIdentityBlocks = (characters: CharacterConfig[]): string => {
  if (_.isEmpty(characters)) return "";
  const intro = _.isEqual(_.size(characters), 1) ? SCENE_REFERENCE_CONFIG.SINGLE_CHARACTER_INTRO : _.replace(SCENE_REFERENCE_CONFIG.MULTI_CHARACTER_INTRO, SOURCE_TEXT_0_2, _.toString(_.size(characters)));
  const blocks = _.map(characters, (character, index) => _.join([_.replace(_.replace(SCENE_REFERENCE_CONFIG.CHARACTER_LABEL, SOURCE_TEXT_0_2, _.toString(_.add(index, 1))), SOURCE_TEXT_1_3, _.toUpper(character.name)), createCharacterIdentityDescription(character)], SOURCE_TEXT_SYMBOL_7));
  return _.join(_.compact([intro, SCENE_REFERENCE_CONFIG.CHARACTER_SECTION, ...blocks, _.gt(_.size(characters), 1) ? SCENE_REFERENCE_CONFIG.IDENTITY_LOCK : ""]), SCENE_REFERENCE_CONFIG.CHARACTER_SEPARATOR);
};
export const createSceneGenerationContext = (scene: StoryboardScene, visualConfig: Pick<VisualConfig, "characters" | "sceneReferenceImages" | "styleReferenceImages" | "referenceImages">): SceneGenerationContext => {
  const characters = _.defaultTo(visualConfig.characters, []);
  const validCharacterIds = new Set(_.map(characters, SOURCE_TEXT_ID));
  const characterIds = _.filter(_.uniq(scene.characterIds || []), (id) => validCharacterIds.has(id));
  return { characterIds, prompt: scene.prompt || "", referenceImages: [], referenceImageNames: [], referenceCharacterNames: [], referenceRoles: [] };
};
export const resolveCinematicSceneCharacterReferences = (scene: StoryboardScene, characters: CharacterConfig[]): Pick<SceneGenerationContext, "characterIds" | "referenceImages" | "referenceImageNames" | "referenceCharacterNames" | "referenceRoles"> => {
  const validCharacterIds = new Set(_.map(characters, SOURCE_TEXT_ID));
  const charactersById = _.keyBy(characters, SOURCE_TEXT_ID);
  const characterIds = _.filter(_.uniq(scene.characterIds || []), (characterId) => validCharacterIds.has(characterId));
  const visibleCharacters = _.compact(_.map(characterIds, (characterId) => charactersById[characterId]));
  const referenceCharacters = _.take(
    _.filter(visibleCharacters, (character) => !_.isEmpty(_.trim(character.flowCharacterName))),
    SCENE_REFERENCE_CONFIG.MAX_IMAGES,
  );
  return {
    characterIds,
    referenceImages: [],
    referenceImageNames: [],
    referenceCharacterNames: _.compact(_.map(referenceCharacters, (character) => _.trim(character.flowCharacterName))),
    referenceRoles: [],
  };
};
