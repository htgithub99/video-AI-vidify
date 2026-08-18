import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { resolveStylePreset } from "../constants/stylePresets";
import { resolveSceneCharacterIds } from "./sceneReferenceService";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
import {
  appendImagePromptAspectRatio,
  deduplicatePromptSentences,
  sanitizeImagePrompt,
} from "./imagePromptQualityService";

export interface ImagePromptCompilerOptions {
  aspectRatio?: string;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  referenceLocked?: boolean;
}

const compactWords = (value: string, maximumWords: number): string => _.join(
  _.take(_.words(value, IMAGE_PROMPT_COMPILER_CONFIG.NON_WHITESPACE_REGEX), maximumWords),
  IMAGE_PROMPT_COMPILER_CONFIG.SPACE_SEPARATOR,
);

const compactSceneField = (value: unknown): string => {
  const str = _.trim(_.toString(value));
  if (_.isEmpty(str) || DETECTOR_VIETNAMESE_REGEX.test(str)) {
    return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  }
  return compactWords(str, IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS);
};

const compactScriptSource = (value: unknown): string => {
  const str = _.trim(_.toString(value));
  return _.isEmpty(str)
    ? IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING
    : compactWords(str, IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS);
};

const getCharacterIdentityProfile = (character: CharacterConfig, scene: StoryboardScene): string => {
  const stage = _.find(character.timelineStages, item => _.isEqual(item.id, scene.characterStage) || _.isEqual(item.label, scene.characterStage));
  const details = _.compact([
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
    character.colorPalette,
    character.silhouette,
    stage?.outfit,
    stage?.visibleCondition,
    character.description,
  ]);
  return compactWords(_.join(_.uniq(details), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS * 2);
};

const resolveCharacterDirective = (scene: StoryboardScene, options: ImagePromptCompilerOptions): string => {
  if (!_.isEmpty(options.characters)) {
    const characterIds = resolveSceneCharacterIds(scene, options.characters);
    const sceneCharacters = _.filter(options.characters, character => _.includes(characterIds, character.id));
    const descriptions = _.compact(_.map(sceneCharacters, (character) => {
      const name = _.trim(_.get(character, "name", IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING));
      const desc = getCharacterIdentityProfile(character, scene);
      if (_.isEmpty(name) && _.isEmpty(desc)) return null;
      return desc ? `${name ? `${name}: ` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING}${desc}` : name;
    }));
    if (!_.isEmpty(descriptions)) {
      return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.join(descriptions, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR)}`;
    }
  } else if (!_.isEmpty(_.get(options.visualBible, "characterSpecs"))) {
    return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.trim(options.visualBible?.characterSpecs || IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING)}`;
  }
  return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const getSceneNarrativeFallback = (scene: StoryboardScene): string => compactScriptSource(scene.script || scene.subtitle);

const resolveSceneEnvironment = (scene: StoryboardScene, visualBible?: VisualBible): string => {
  const location = _.find(visualBible?.locations, item => _.isEqual(item.id, scene.locationId));
  const props = _.filter(visualBible?.props, item => _.includes(scene.propIds, item.id));
  const locationText = location ? _.join(_.compact([location.name, _.join(location.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR), location.geography]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR) : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  const propText = _.join(_.compact(_.map(props, prop => _.join(_.compact([prop.name, _.join(prop.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR)]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR))), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR);
  return compactWords(_.join(_.compact([locationText, propText]), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR), IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS);
};

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const preset = resolveStylePreset(options.targetStyle);
  const characterDirective = resolveCharacterDirective(scene, options);
  const environment = resolveSceneEnvironment(scene, options.visualBible);
  const visualIntent = compactSceneField(scene.visualIntent);
  const visibleAction = compactSceneField(scene.visibleAction);
  const reaction = compactSceneField(scene.reaction);
  const composition = compactSceneField(scene.composition);
  const lighting = compactSceneField(scene.lighting);
  const narrativeFallback = getSceneNarrativeFallback(scene);

  const promptParts = [
    preset.positivePrompt,
    characterDirective,
    characterDirective ? IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_CONSISTENCY_LOCK : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    IMAGE_PROMPT_COMPILER_CONFIG.STORY_FIDELITY_LOCK,
    visualIntent ? `${IMAGE_PROMPT_COMPILER_CONFIG.VISUAL_INTENT_PREFIX}${visualIntent}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    visibleAction ? `${IMAGE_PROMPT_COMPILER_CONFIG.VISIBLE_ACTION_PREFIX}${visibleAction}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    reaction ? `${IMAGE_PROMPT_COMPILER_CONFIG.REACTION_PREFIX}${reaction}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    environment ? `${IMAGE_PROMPT_COMPILER_CONFIG.ENVIRONMENT_PREFIX}${environment}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    !visualIntent && !visibleAction && narrativeFallback ? `${IMAGE_PROMPT_COMPILER_CONFIG.SCENE_NARRATIVE_PREFIX}${narrativeFallback}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    preset.characterRule ? `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_STYLING_PREFIX}${preset.characterRule}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.shotSize ? `${IMAGE_PROGORITHM_COMPILER_SHOT_TYPE(scene.shotSize)}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.cameraAngle ? `${IMAGE_PROMPT_COMPILER_CONFIG.CAMERA_ANGLE_PREFIX}${scene.cameraAngle}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    composition ? `${IMAGE_PROMPT_COMPILER_CONFIG.COMPOSITION_PREFIX}${composition}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    lighting ? `${IMAGE_PROMPT_COMPILER_CONFIG.LIGHTING_PREFIX}${lighting}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_NEGATIVE_CONSTRAINTS,
    IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_GRID_DIRECTIVE,
  ];

  const rawPrompt = _.join(_.compact(promptParts), IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  const cleanedPrompt = deduplicatePromptSentences(sanitizeImagePrompt(rawPrompt));
  return appendImagePromptAspectRatio(cleanedPrompt, options.aspectRatio);
};

const IMAGE_PROGORITHM_COMPILER_SHOT_TYPE = (shotSize: string): string => `${IMAGE_PROMPT_COMPILER_CONFIG.SHOT_TYPE_PREFIX}${shotSize}`;

export const compileStoryboardPrompts = (
  scenes: StoryboardScene[],
  options: ImagePromptCompilerOptions = {},
): StoryboardScene[] => _.map(scenes, (scene) => ({
  ...scene,
  prompt: compileImagePrompt(scene, options),
}));
