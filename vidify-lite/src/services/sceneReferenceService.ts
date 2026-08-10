import _ from "lodash";
import { CharacterConfig, StoryboardScene, VisualConfig } from "../types";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";
import { IMAGE_PROMPT_CONDITIONAL_RULES } from "../constants/imagePromptRules";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";

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
} as const;

export interface SceneGenerationContext {
  characterIds: string[];
  prompt: string;
  referenceImages: string[];
  referenceRoles: string[];
}

export interface SceneGenerationOptions {
  includeCharacterImages?: boolean;
  finalizedByAi?: boolean;
}

const normalizeTokens = (value: string): string[] => _.uniq(_.filter(
  _.words(_.toLower(value)),
  token => _.gte(_.size(token), SCENE_REFERENCE_CONFIG.MIN_TOKEN_LENGTH),
));

const getCharacterIdentityText = (character: CharacterConfig): string => _.join(_.compact([
  character.name,
  character.prompt,
  character.description,
  character.hair,
  character.signatureClothing,
  character.accessories,
]), " ");

const getCharacterIdentityDetails = (character: CharacterConfig): string[] => _.uniqBy(
  _.compact([
    character.genderPresentation,
    character.ageRange,
    character.ethnicitySkinTone,
    character.bodyBuild,
    character.faceShape,
    character.eyes,
    character.nose,
    character.hair,
    character.signatureClothing,
    character.accessories,
    character.silhouette,
  ]),
  value => _.toLower(_.trim(value)),
);

export const createCharacterIdentityDescription = (character: CharacterConfig): string => {
  const details = getCharacterIdentityDetails(character);
  if (!_.isEmpty(details)) return _.join(details, "; ");
  return _.trim(_.toString(character.prompt || character.description)
    .replace(SCENE_REFERENCE_CONFIG.TRANSIENT_STYLE_PATTERN, "")
    .replace(SCENE_REFERENCE_CONFIG.DUPLICATE_SEPARATOR_PATTERN, ", "));
};

export const createCharacterIdentityBlocks = (characters: CharacterConfig[]): string => {
  if (_.isEmpty(characters)) return "";
  const intro = _.isEqual(_.size(characters), 1)
    ? SCENE_REFERENCE_CONFIG.SINGLE_CHARACTER_INTRO
    : _.replace(SCENE_REFERENCE_CONFIG.MULTI_CHARACTER_INTRO, "{0}", _.toString(_.size(characters)));
  const blocks = _.map(characters, (character, index) => _.join([
    _.replace(
      _.replace(SCENE_REFERENCE_CONFIG.CHARACTER_LABEL, "{0}", _.toString(_.add(index, 1))),
      "{1}",
      _.toUpper(character.name),
    ),
    createCharacterIdentityDescription(character),
  ], ": "));
  return _.join([
    intro,
    SCENE_REFERENCE_CONFIG.CHARACTER_SECTION,
    ...blocks,
    _.gt(_.size(characters), 1) ? SCENE_REFERENCE_CONFIG.IDENTITY_LOCK : "",
  ].filter(Boolean), SCENE_REFERENCE_CONFIG.CHARACTER_SEPARATOR);
};

const isCharacterMentioned = (sceneText: string, character: CharacterConfig): boolean => {
  const sceneTokens = normalizeTokens(sceneText);
  const sceneNameTokens = _.uniq(_.words(_.toLower(sceneText)));
  const nameTokens = _.uniq(_.words(_.toLower(character.name)));
  if (!_.isEmpty(nameTokens) && _.every(nameTokens, token => _.includes(sceneNameTokens, token))) return true;
  const identityTokens = normalizeTokens(getCharacterIdentityText(character));
  const identityAnchors = _.compact([character.hair, character.signatureClothing, character.accessories]);
  const anchorMatches = _.size(_.filter(identityAnchors, anchor => {
    const anchorTokens = normalizeTokens(anchor);
    return !_.isEmpty(anchorTokens)
      && _.gte(_.divide(_.size(_.intersection(anchorTokens, sceneTokens)), _.size(anchorTokens)), SCENE_REFERENCE_CONFIG.MIN_ANCHOR_TOKEN_RATIO);
  }));
  if (_.gte(anchorMatches, _.min([SCENE_REFERENCE_CONFIG.MIN_IDENTITY_ANCHOR_MATCHES, _.size(identityAnchors)])!)) return true;
  if (!_.isEmpty(identityAnchors)) return false;
  const matches = _.size(_.intersection(identityTokens, sceneTokens));
  const matchRatio = _.divide(matches, _.max([_.size(identityTokens), 1])!);
  return _.gte(matches, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_TOKEN_MATCHES)
    && _.gte(matchRatio, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_MATCH_RATIO);
};

export const resolveSceneCharacterIds = (
  scene: Pick<StoryboardScene, "characterIds" | "prompt" | "script" | "subtitle">,
  characters: CharacterConfig[],
): string[] => {
  const validIds = new Set(_.map(characters, "id"));
  const explicitIds = _.filter(_.uniq(scene.characterIds), id => validIds.has(id));
  if (_.isArray(scene.characterIds)) return explicitIds;
  const sceneText = _.join(_.compact([scene.prompt, scene.script, scene.subtitle]), " ");
  return _.map(_.filter(characters, character => isCharacterMentioned(sceneText, character)), "id");
};

const addReference = (
  images: string[],
  roles: string[],
  image: string | undefined,
  roleTemplate: string,
  roleValue?: string,
): void => {
  if (_.isEmpty(image) || _.includes(images, image) || _.gte(_.size(images), SCENE_REFERENCE_CONFIG.MAX_IMAGES)) return;
  images.push(image!);
  const imageNumber = _.toString(_.size(images));
  roles.push(_.replace(_.replace(roleTemplate, "{0}", imageNumber), "{1}", roleValue || "character"));
};

const sceneHasPeople = (scene: StoryboardScene, hasNamedCharacters: boolean): boolean => hasNamedCharacters
  || SCENE_REFERENCE_CONFIG.PEOPLE_PATTERN.test(_.join(_.compact([scene.prompt, scene.script, scene.subtitle]), " "));

const createConstraintDirectives = (scene: StoryboardScene, hasNamedCharacters: boolean): string[] => {
  const directives: string[] = scene.layout === "single_frame"
    ? [SCENE_REFERENCE_CONFIG.SINGLE_FRAME_DIRECTIVE]
    : [];
  if (_.gt(scene.expectedSubjectCount || 0, 0)) {
    const countDirective = hasNamedCharacters
      ? SCENE_REFERENCE_CONFIG.CHARACTER_COUNT_DIRECTIVE
      : SCENE_REFERENCE_CONFIG.SUBJECT_COUNT_DIRECTIVE;
    directives.push(_.replace(
      _.replace(countDirective, "{0}", _.toString(scene.expectedSubjectCount)),
      "{1}",
      _.isEqual(scene.expectedSubjectCount, 1) ? "" : "s",
    ));
  }
  if (_.isEqual(scene.allowBackgroundPeople, false)) directives.push(SCENE_REFERENCE_CONFIG.NO_BACKGROUND_PEOPLE_DIRECTIVE);
  if (!sceneHasPeople(scene, hasNamedCharacters) && _.isEqual(scene.allowBackgroundPeople, false)) {
    directives.push(SCENE_REFERENCE_CONFIG.OBJECT_ONLY_DIRECTIVE);
  }
  if (_.isEqual(scene.textAllowed, false)) directives.push(SCENE_REFERENCE_CONFIG.NO_TEXT_DIRECTIVE);
  return directives;
};

export const createSceneGenerationContext = (
  scene: StoryboardScene,
  visualConfig: Pick<VisualConfig, "characters" | "sceneReferenceImages" | "styleReferenceImages">,
  options: SceneGenerationOptions = {},
): SceneGenerationContext => {
  const characters = _.defaultTo(visualConfig.characters, []);
  const characterIds = resolveSceneCharacterIds(scene, characters);
  const referencedCharacters = _.filter(characters, character => _.includes(characterIds, character.id));
  const images: string[] = [];
  const roles: string[] = [];

  addReference(images, roles, _.first(visualConfig.styleReferenceImages), SCENE_REFERENCE_CONFIG.STYLE_ROLE);
  if (options.includeCharacterImages) {
    _.forEach(referencedCharacters, character => {
      addReference(images, roles, _.first(character.images), SCENE_REFERENCE_CONFIG.CHARACTER_ROLE, character.name);
    });
  }
  _.forEach(visualConfig.sceneReferenceImages, image => {
    addReference(images, roles, image, SCENE_REFERENCE_CONFIG.SCENE_ROLE);
  });

  const referenceDirective = _.isEmpty(roles)
    ? ""
    : _.join([SCENE_REFERENCE_CONFIG.REFERENCE_DIRECTIVE_PREFIX, _.join(roles, "; ")], " ");
  const aspectRatio = _.trim(_.head(_.toString(scene.prompt).match(IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN)) || "")
    .replace(/^--ar\s+/i, "");
  const identityBlocks = createCharacterIdentityBlocks(referencedCharacters);
  const promptContainsIdentityBlocks = _.includes(
    _.toUpper(scene.prompt || ""),
    SCENE_REFERENCE_CONFIG.CHARACTER_SECTION,
  );
  const prompt = options.finalizedByAi
    ? appendImagePromptAspectRatio(scene.prompt || scene.script, aspectRatio)
    : appendImagePromptAspectRatio(_.join(_.compact([
      promptContainsIdentityBlocks ? "" : identityBlocks,
      scene.prompt || scene.script,
      ...createConstraintDirectives(scene, !_.isEmpty(referencedCharacters)),
      referenceDirective,
    ]), ", "), aspectRatio);

  return {
    characterIds,
    prompt,
    referenceImages: images,
    referenceRoles: roles,
  };
};
