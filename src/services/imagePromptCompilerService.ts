import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { resolveStylePreset } from "../constants/stylePresets";
import { resolveSceneCharacterIds } from "./sceneReferenceService";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
import { appendImagePromptAspectRatio, deduplicatePromptSentences, sanitizeImagePrompt } from "./imagePromptQualityService";

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

const THREE_D_STYLE_PATTERN = /(?:\b3d\b|donghua|xianxia|unreal engine|tien[_ ]hiep)/i;
const CHIBI_CHARACTER_TERMS_PATTERN =
  /\b(?:adorable\s+)?chibi(?:\s+style)?\b|\b\d+[- ]head[- ]tall\s+chibi\s+proportions?\b|\btiny\s+(?:cute\s+)?hands?\s+and\s+feet\b|\boversized\s+sparkling\s+eyes\b/gi;
const NATURAL_3D_ANATOMY_LOCK = "Natural adult 3D proportions, anatomically plausible hands, no chibi";

const getCharacterIdentityProfile = (character: CharacterConfig, scene: StoryboardScene, targetStyle?: string): string => {
  const stage = _.find(character.timelineStages, (item) => _.isEqual(item.id, scene.characterStage) || _.isEqual(item.label, scene.characterStage));
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
  const identity = _.join(_.uniq(details), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
  const styleSafeIdentity = THREE_D_STYLE_PATTERN.test(_.toString(targetStyle))
    ? _.trim(
        identity
          .replace(CHIBI_CHARACTER_TERMS_PATTERN, "")
          .replace(/\s*,\s*,+/g, ", ")
          .replace(/^\s*,\s*|\s*,\s*$/g, ""),
      )
    : identity;
  return compactWords(styleSafeIdentity, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS * 2);
};

const resolveCharacterDirective = (scene: StoryboardScene, options: ImagePromptCompilerOptions): string => {
  if (!_.isEmpty(options.characters)) {
    const characterIds = resolveSceneCharacterIds(scene, options.characters);
    const sceneCharacters = !_.isEmpty(characterIds)
      ? _.filter(options.characters, (character) => _.includes(characterIds, character.id))
      : _.isEqual(_.size(options.characters), 1) && !_.isEmpty(scene.visibleAction || scene.visualIntent || scene.script)
        ? options.characters
        : [];
    const descriptions = _.compact(
      _.map(sceneCharacters, (character) => {
        const name = _.trim(_.get(character, "name", IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING));
        const desc = getCharacterIdentityProfile(character, scene, options.targetStyle);
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
  const preset = resolveStylePreset(options.targetStyle);
  const characterDirective = resolveCharacterDirective(scene, options);
  const environment = resolveSceneEnvironment(scene, options.visualBible);
  const visualIntent = compactSceneField(scene.visualIntent);
  const visibleAction = compactSceneField(scene.visibleAction);
  const reaction = compactSceneField(scene.reaction);
  const composition = compactSceneField(scene.composition);
  const lighting = compactSceneField(scene.lighting);
  const narrativeFallback = getSceneNarrativeFallback(scene);
  const sceneVariation = compactWords(
    _.join(
      _.compact(!_.isEmpty(visibleAction) ? [visibleAction, reaction, environment] : [visualIntent, reaction, environment, narrativeFallback]),
      IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR,
    ),
    42,
  );

  const promptParts = [
    preset.positivePrompt,
    characterDirective,
    characterDirective ? IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_CONSISTENCY_LOCK : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    THREE_D_STYLE_PATTERN.test(_.toString(options.targetStyle)) ? NATURAL_3D_ANATOMY_LOCK : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    sceneVariation,
    _.join(_.compact([scene.shotSize, scene.cameraAngle, composition, lighting]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_NEGATIVE_CONSTRAINTS,
  ];

  const rawPrompt = _.join(_.compact(promptParts), IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  const cleanedPrompt = deduplicatePromptSentences(sanitizeImagePrompt(rawPrompt))
    .replace(
      /\. preserving the same face, hair, outfit, and proportions as every other scene\./i,
      ", preserving the same face, hair, outfit, and proportions as every other scene.",
    )
    .replace(
      /\. Natural adult 3D proportions, anatomically plausible hands, no chibi\./i,
      ", with natural adult 3D proportions and anatomically plausible hands, never chibi.",
    );
  return appendImagePromptAspectRatio(cleanedPrompt, options.aspectRatio);
};

export const compileStoryboardPrompts = (scenes: StoryboardScene[], options: ImagePromptCompilerOptions = {}): StoryboardScene[] =>
  _.map(scenes, (scene) => ({
    ...scene,
    prompt: compileImagePrompt(scene, options),
  }));
