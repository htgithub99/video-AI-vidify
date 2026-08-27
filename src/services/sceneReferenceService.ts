import _ from "lodash";
import { CharacterConfig, StoryboardScene, VisualConfig } from "../types";
import { IMAGE_PROMPT_CONDITIONAL_RULES } from "../constants/imagePromptRules";

export const SCENE_REFERENCE_CONFIG = {
  MAX_IMAGES: 3,
  MIN_IDENTITY_TOKEN_MATCHES: 3,
  MIN_IDENTITY_MATCH_RATIO: 0.18,
  MIN_IDENTITY_ANCHOR_MATCHES: 2,
  MIN_ANCHOR_TOKEN_RATIO: 0.6,
  MIN_TOKEN_LENGTH: 4,
  FALLBACK_CHARACTER_LIMIT: 2,
  REFERENCE_DIRECTIVE_PREFIX: IMAGE_PROMPT_CONDITIONAL_RULES.REFERENCE_PREFIX,
  STYLE_ROLE: IMAGE_PROMPT_CONDITIONAL_RULES.STYLE_REFERENCE_ROLE,
  CHARACTER_ROLE: IMAGE_PROMPT_CONDITIONAL_RULES.CHARACTER_REFERENCE_ROLE,
  SCENE_ROLE: IMAGE_PROMPT_CONDITIONAL_RULES.SCENE_REFERENCE_ROLE,
  SINGLE_FRAME_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.SINGLE_FRAME,
  CHARACTER_COUNT_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.CHARACTER_COUNT,
  SUBJECT_COUNT_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.SUBJECT_COUNT,
  NO_BACKGROUND_PEOPLE_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.NO_EXTRA_CHARACTERS,
  OBJECT_ONLY_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.OBJECT_ONLY,
  NO_TEXT_DIRECTIVE: IMAGE_PROMPT_CONDITIONAL_RULES.NO_TEXT,
  CHARACTER_SECTION: "CHARACTERS",
  RELATIONSHIP_SECTION: "CHARACTER RELATIONSHIPS",
  CHARACTER_LABEL: "CHARACTER {0} — {1}",
  SINGLE_CHARACTER_INTRO: "One recurring main character is present.",
  MULTI_CHARACTER_INTRO: "Exactly {0} recurring main characters are present.",
  IDENTITY_LOCK: IMAGE_PROMPT_CONDITIONAL_RULES.CHARACTER_IDENTITY,
  CHARACTER_SEPARATOR: "\n",
  TRANSIENT_STYLE_PATTERN: /\b(?:cinematic|dramatic|volumetric)\s+lighting\b|\b(?:sharp\s+detail|high\s+quality|photorealistic|3d\s+render)\b/gi,
  DUPLICATE_SEPARATOR_PATTERN: /\s*,\s*,+/g,
  PEOPLE_PATTERN: /\b(?:person|people|character|characters|figure|figures|man|men|woman|women|boy|boys|girl|girls|child|children|family|families|worker|workers|official|officials|crowd|gambler|gamblers|player|players|youth|teenager|teenagers)\b/i,
  SINGLE_CHARACTER_SUBJECT_PATTERN: /\b(?:person|character|man|woman|male|female|worker|employee|professional|office worker|girl|boy|she|he|her|him|nhan vien|phu nu|co ay|anh ay)\b/i,
  CONTINUING_PRONOUN_PATTERN: /^(?:anh|co|ong|ba|han|nguoi nay|he|she|him|her|his|their)\b/i,
} as const;

export interface SceneGenerationContext { characterIds: string[]; prompt: string; referenceImages: string[]; referenceRoles: string[]; }

const normalizeTokens = (value: string): string[] => _.uniq(_.filter(_.words(_.toLower(_.deburr(value))), (token) => _.gte(_.size(token), SCENE_REFERENCE_CONFIG.MIN_TOKEN_LENGTH)));

const normalizeSearchText = (value: string): string => _.join(_.words(_.toLower(_.deburr(value))), " ");

const getCharacterIdentityText = (character: CharacterConfig): string => _.join(_.compact([character.name, character.prompt, character.description, character.hair, character.signatureClothing, character.accessories]), " ");

const getCharacterIdentityDetails = (character: CharacterConfig): string[] => _.uniqBy(_.compact([character.genderPresentation, character.ageRange, character.ethnicitySkinTone, character.bodyBuild, character.faceShape, character.eyes, character.nose, character.hair, character.signatureClothing, character.accessories, character.silhouette]), (value) => _.toLower(_.trim(value)));

export const createCharacterIdentityDescription = (character: CharacterConfig): string => {
  const details = getCharacterIdentityDetails(character);
  if (!_.isEmpty(details)) return _.join(details, "; ");
  return _.trim(
    _.toString(character.prompt || character.description)
      .replace(SCENE_REFERENCE_CONFIG.TRANSIENT_STYLE_PATTERN, "")
      .replace(SCENE_REFERENCE_CONFIG.DUPLICATE_SEPARATOR_PATTERN, ", "),
  );
};

export const createCharacterIdentityBlocks = (characters: CharacterConfig[]): string => {
  if (_.isEmpty(characters)) return "";
  const intro = _.isEqual(_.size(characters), 1) ? SCENE_REFERENCE_CONFIG.SINGLE_CHARACTER_INTRO : _.replace(SCENE_REFERENCE_CONFIG.MULTI_CHARACTER_INTRO, "{0}", _.toString(_.size(characters)));
  const blocks = _.map(characters, (character, index) => _.join([_.replace(_.replace(SCENE_REFERENCE_CONFIG.CHARACTER_LABEL, "{0}", _.toString(_.add(index, 1))), "{1}", _.toUpper(character.name)), createCharacterIdentityDescription(character)], ": "));
  return _.join([intro, SCENE_REFERENCE_CONFIG.CHARACTER_SECTION, ...blocks, _.gt(_.size(characters), 1) ? SCENE_REFERENCE_CONFIG.IDENTITY_LOCK : ""].filter(Boolean), SCENE_REFERENCE_CONFIG.CHARACTER_SEPARATOR);
};

const isCharacterMentioned = (sceneText: string, character: CharacterConfig): boolean => {
  const normalizedSceneText = normalizeSearchText(sceneText);
  if (_.isEqual(character.narrativeRole, "second_person_protagonist") && /\b(?:you|your|yours|ban|cua ban)\b/i.test(normalizedSceneText)) return true;
  const sceneTokens = normalizeTokens(sceneText);
  const sceneNameTokens = _.uniq(_.words(normalizedSceneText));
  const nameTokens = _.uniq(_.words(normalizeSearchText(character.name)));
  if (!_.isEmpty(nameTokens) && _.every(nameTokens, (token) => _.includes(sceneNameTokens, token))) return true;
  const identityTokens = normalizeTokens(getCharacterIdentityText(character));
  const identityAnchors = _.compact([character.hair, character.signatureClothing, character.accessories]);
  const anchorMatches = _.size(
    _.filter(identityAnchors, (anchor) => {
      const anchorTokens = normalizeTokens(anchor);
      return !_.isEmpty(anchorTokens) && _.gte(_.divide(_.size(_.intersection(anchorTokens, sceneTokens)), _.size(anchorTokens)), SCENE_REFERENCE_CONFIG.MIN_ANCHOR_TOKEN_RATIO);
    }),
  );
  if (_.gte(anchorMatches, _.min([SCENE_REFERENCE_CONFIG.MIN_IDENTITY_ANCHOR_MATCHES, _.size(identityAnchors)])!)) return true;
  if (!_.isEmpty(identityAnchors)) return false;
  const matches = _.size(_.intersection(identityTokens, sceneTokens));
  const matchRatio = _.divide(matches, _.max([_.size(identityTokens), 1])!);
  return _.gte(matches, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_TOKEN_MATCHES) && _.gte(matchRatio, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_MATCH_RATIO);
};

export const resolveSceneCharacterIds = (scene: Pick<StoryboardScene, "characterIds" | "prompt" | "script" | "subtitle" | "visualIntent" | "visibleAction" | "reaction">, characters: CharacterConfig[]): string[] => {
  const validIds = new Set(_.map(characters, "id"));
  const explicitIds = _.filter(_.uniq(scene.characterIds), (id) => validIds.has(id));
  if (!_.isEmpty(explicitIds)) return explicitIds;
  const sceneText = _.join(_.compact([scene.prompt, scene.script, scene.subtitle, scene.visualIntent, scene.visibleAction, scene.reaction]), " ");
  const matchedIds = _.map(
    _.filter(characters, (character) => isCharacterMentioned(sceneText, character)),
    "id",
  );
  if (_.isEmpty(matchedIds) && _.isEqual(_.size(characters), 1) && SCENE_REFERENCE_CONFIG.SINGLE_CHARACTER_SUBJECT_PATTERN.test(normalizeSearchText(sceneText))) {
    return [characters[0].id];
  }
  return matchedIds;
};

export const resolveStoryboardCharacterIds = (scenes: StoryboardScene[], characters: CharacterConfig[]): StoryboardScene[] => {
  let previousCharacterIds: string[] = [];
  return _.map(scenes, (scene) => {
    const resolvedCharacterIds = resolveSceneCharacterIds(scene, characters);
    const sceneText = normalizeSearchText(_.join(_.compact([scene.script, scene.subtitle]), " "));
    const inheritedCharacterIds = _.every([_.isEmpty(resolvedCharacterIds), _.isEqual(_.size(previousCharacterIds), 1), SCENE_REFERENCE_CONFIG.CONTINUING_PRONOUN_PATTERN.test(sceneText)], Boolean) ? previousCharacterIds : resolvedCharacterIds;
    if (!_.isEmpty(inheritedCharacterIds)) previousCharacterIds = inheritedCharacterIds;
    return { ...scene, characterIds: inheritedCharacterIds };
  });
};

export const pruneUnsupportedSceneCharacterIds = (scenes: StoryboardScene[], characters: CharacterConfig[]): StoryboardScene[] => {
  let previousCharacterIds: string[] = [];
  return _.map(scenes, (scene) => {
    const narration = normalizeSearchText(_.join(_.compact([scene.script, scene.subtitle]), " "));
    const narrationMatchedIds = _.map(
      _.filter(characters, (character) => {
        const stableName = normalizeSearchText(character.name);
        return !_.isEmpty(stableName) && _.includes(` ${narration} `, ` ${stableName} `);
      }),
      "id",
    );
    const characterIds = _.isEmpty(narrationMatchedIds) && SCENE_REFERENCE_CONFIG.CONTINUING_PRONOUN_PATTERN.test(narration) ? previousCharacterIds : narrationMatchedIds;
    if (!_.isEmpty(characterIds)) previousCharacterIds = characterIds;
    return { ...scene, characterIds };
  });
};

export const createSceneGenerationContext = (scene: StoryboardScene, visualConfig: Pick<VisualConfig, "characters" | "sceneReferenceImages" | "styleReferenceImages" | "referenceImages">): SceneGenerationContext => {
  const characters = _.defaultTo(visualConfig.characters, []);
  const characterIds = resolveSceneCharacterIds(scene, characters);
  return { characterIds, prompt: scene.prompt || scene.script, referenceImages: [], referenceRoles: [], };
};
