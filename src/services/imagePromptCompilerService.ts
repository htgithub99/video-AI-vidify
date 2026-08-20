import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config.js";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes.js";
import { resolveStylePreset } from "../constants/stylePresets.js";
import { resolveSceneCharacterIds } from "./sceneReferenceService.js";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types.js";
import { appendImagePromptAspectRatio, deduplicatePromptSentences, sanitizeImagePrompt } from "./imagePromptQualityService.js";
import { createSoftStyleDirective } from "./styleReferenceService.js";

export interface ImagePromptCompilerOptions {
  aspectRatio?: string;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  referenceLocked?: boolean;
}

const compactWords = (value: string, maximumWords: number): string =>
  _.join(_.take(_.words(value, IMAGE_PROMPT_COMPILER_CONFIG.NON_WHITESPACE_REGEX), maximumWords), IMAGE_PROMPT_COMPILER_CONFIG.SPACE_SEPARATOR);

const compactSceneField = (value: unknown): string => {
  const str = _.trim(_.toString(value));
  if (_.isEmpty(str) || DETECTOR_VIETNAMESE_REGEX.test(str)) {
    return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  }
  return compactWords(str, IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS);
};

const compactScriptSource = (value: unknown): string => {
  const str = _.trim(_.toString(value));
  return _.isEmpty(str) ? IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING : compactWords(str, IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS);
};

const getCharacterIdentityProfile = (character: CharacterConfig, targetStyle?: string): string => {
  const details = _.compact([
    character.genderPresentation,
    character.ageRange,
    character.ethnicitySkinTone,
    character.bodyBuild,
    character.faceShape,
    character.eyes,
    character.nose,
    character.hair,
    character.accessories,
  ]);
  const identity = _.join(_.uniq(details), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
  const styleSafeIdentity = IMAGE_PROMPT_COMPILER_CONFIG.THREE_D_STYLE_PATTERN.test(_.toString(targetStyle))
    ? _.trim(
        identity
          .replace(IMAGE_PROMPT_COMPILER_CONFIG.CHIBI_CHARACTER_TERMS_PATTERN, IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING)
          .replace(IMAGE_PROMPT_COMPILER_CONFIG.CLEAN_COMMA_REPLACE_PATTERN, IMAGE_PROMPT_COMPILER_CONFIG.CLEAN_COMMA_REPLACE_TARGET)
          .replace(IMAGE_PROMPT_COMPILER_CONFIG.TRIM_COMMA_PATTERN, IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING),
      )
    : identity;
  return compactWords(styleSafeIdentity, _.multiply(IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS, 2));
};

const getSceneWardrobe = (character: CharacterConfig, scene: StoryboardScene): string => {
  const stage = _.find(character.timelineStages, (item) => _.isEqual(item.id, scene.characterStage) || _.isEqual(item.label, scene.characterStage));
  const outfit = _.trim(_.toString(stage?.outfit || character.signatureClothing));
  return outfit ? `${IMAGE_PROMPT_COMPILER_CONFIG.WEARING_PREFIX}${outfit}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const resolveSceneCharacters = (scene: StoryboardScene, characters?: CharacterConfig[]): CharacterConfig[] => {
  if (_.isEmpty(characters)) return [];
  const characterIds = resolveSceneCharacterIds(scene, characters);
  return !_.isEmpty(characterIds)
    ? _.filter(characters, (character) => _.includes(characterIds, character.id))
    : _.isEqual(_.size(characters), IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_SUBJECT_COUNT) && !_.isEmpty(scene.visibleAction || scene.visualIntent || scene.script)
      ? characters
      : [];
};

const resolveCharacterDirective = (scene: StoryboardScene, options: ImagePromptCompilerOptions): string => {
  if (!_.isEmpty(options.characters)) {
    const sceneCharacters = resolveSceneCharacters(scene, options.characters);
    const descriptions = _.compact(
      _.map(sceneCharacters, (character) => {
        const name = _.trim(_.get(character, "name", IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING));
        const desc = getCharacterIdentityProfile(character, options.targetStyle);
        if (_.isEmpty(name) && _.isEmpty(desc)) return null;
        return desc ? `${name ? `${name}: ` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING}${desc}` : name;
      }),
    );
    if (!_.isEmpty(descriptions)) {
      return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.join(descriptions, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR)}`;
    }
  } else if (!_.isEmpty(_.get(options.visualBible, "characterSpecs"))) {
    return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.trim(options.visualBible?.characterSpecs || IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING)}`;
  }
  return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const resolveSceneWardrobeDirective = (scene: StoryboardScene, characters?: CharacterConfig[]): string =>
  _.join(_.compact(_.map(resolveSceneCharacters(scene, characters), (character) => getSceneWardrobe(character, scene))), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR);

const getSceneNarrativeFallback = (scene: StoryboardScene): string => compactScriptSource(scene.script || scene.subtitle);

const resolveSceneEnvironment = (scene: StoryboardScene, visualBible?: VisualBible): string => {
  const location = _.find(visualBible?.locations, (item) => _.isEqual(item.id, scene.locationId));
  const props = _.filter(visualBible?.props, (item) => _.includes(scene.propIds, item.id));
  const locationText = location
    ? _.join(
        _.compact([location.name, _.join(location.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR), location.geography]),
        IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR,
      )
    : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  const propText = _.join(
    _.compact(
      _.map(props, (prop) =>
        _.join(
          _.compact([prop.name, _.join(prop.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR)]),
          IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR,
        ),
      ),
    ),
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR,
  );
  return compactWords(
    _.join(_.compact([locationText, propText]), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS,
  );
};

export const compileImagePrompt = (scene: StoryboardScene, options: ImagePromptCompilerOptions = {}): string => {
  const aiAuthoredPrompt = _.trim(_.toString(scene.prompt));
  if (!_.isEmpty(aiAuthoredPrompt) && !DETECTOR_VIETNAMESE_REGEX.test(aiAuthoredPrompt)) {
    return appendImagePromptAspectRatio(
      deduplicatePromptSentences(sanitizeImagePrompt(aiAuthoredPrompt)),
      options.aspectRatio,
    );
  }
  const preset = resolveStylePreset(options.targetStyle);
  const styleAnchor = options.visualBible?.styleProfile
    ? createSoftStyleDirective(options.visualBible.styleProfile)
    : preset.positivePrompt;
  const characterDirective = resolveCharacterDirective(scene, options);
  const wardrobeDirective = resolveSceneWardrobeDirective(scene, options.characters);
  const environment = resolveSceneEnvironment(scene, options.visualBible);
  const visualIntent = compactSceneField(scene.visualIntent);
  const visibleAction = compactSceneField(scene.visibleAction);
  const reaction = compactSceneField(scene.reaction);
  const composition = compactSceneField(scene.composition);
  const lighting = compactSceneField(scene.lighting);
  const narrativeFallback = getSceneNarrativeFallback(scene);
  const sceneVariation = compactWords(
    _.join(
      _.compact(
        !_.isEmpty(visibleAction)
          ? [visibleAction, visualIntent, wardrobeDirective, reaction, environment]
          : [visualIntent, wardrobeDirective, reaction, environment, narrativeFallback],
      ),
      IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR,
    ),
    IMAGE_PROMPT_COMPILER_CONFIG.SCENE_VARIATION_MAX_WORDS,
  );

  const promptParts = [
    styleAnchor,
    characterDirective,
    characterDirective ? IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_CONSISTENCY_LOCK : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    IMAGE_PROMPT_COMPILER_CONFIG.THREE_D_STYLE_PATTERN.test(_.toString(options.targetStyle)) ? IMAGE_PROMPT_COMPILER_CONFIG.NATURAL_3D_ANATOMY_LOCK : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    sceneVariation,
    _.join(_.compact([scene.shotSize, scene.cameraAngle, composition, lighting]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_NEGATIVE_CONSTRAINTS,
  ];

  const rawPrompt = _.join(_.compact(promptParts), IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  const cleanedPrompt = deduplicatePromptSentences(sanitizeImagePrompt(rawPrompt))
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.CONSISTENCY_REPLACE_PATTERN, IMAGE_PROMPT_COMPILER_CONFIG.CONSISTENCY_REPLACE_TARGET)
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.ANATOMY_REPLACE_PATTERN, IMAGE_PROMPT_COMPILER_CONFIG.ANATOMY_REPLACE_TARGET);
  return appendImagePromptAspectRatio(cleanedPrompt, options.aspectRatio);
};

export const compileStoryboardPrompts = (scenes: StoryboardScene[], options: ImagePromptCompilerOptions = {}): StoryboardScene[] =>
  _.map(scenes, (scene) => ({
    ...scene,
    prompt: compileImagePrompt(scene, options),
  }));
