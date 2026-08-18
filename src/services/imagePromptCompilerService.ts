import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { resolveStylePreset } from "../constants/stylePresets";
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

const resolveCharacterDirective = (options: ImagePromptCompilerOptions): string => {
  if (!_.isEmpty(options.characters)) {
    const descriptions = _.compact(_.map(options.characters, (character) => {
      const name = _.trim(_.get(character, "name", ""));
      const desc = _.trim(_.get(character, "description", ""));
      if (_.isEmpty(name) && _.isEmpty(desc)) return null;
      return desc ? `${name ? `${name}: ` : ""}${desc}` : name;
    }));
    if (!_.isEmpty(descriptions)) {
      return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.join(descriptions, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR)}`;
    }
  } else if (!_.isEmpty(_.get(options.visualBible, "characterSpecs"))) {
    return `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_VISUAL_PREFIX}${_.trim(options.visualBible?.characterSpecs || "")}`;
  }
  return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const extractNarrativeText = (scene: StoryboardScene): string => {
  const visualDesc = compactSceneField(scene.visibleAction || scene.visualIntent || scene.reaction || scene.composition);
  if (!_.isEmpty(visualDesc)) {
    return visualDesc;
  }
  return compactSceneField(scene.script || scene.subtitle);
};

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const preset = resolveStylePreset(options.targetStyle);
  const narrative = extractNarrativeText(scene);
  const characterDirective = resolveCharacterDirective(options);

  const promptParts = [
    preset.positivePrompt,
    characterDirective,
    narrative ? `${IMAGE_PROMPT_COMPILER_CONFIG.SCENE_DEPICTING_PREFIX}${narrative}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    preset.characterRule ? `${IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_STYLING_PREFIX}${preset.characterRule}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.shotSize ? `${IMAGE_PROGORITHM_COMPILER_SHOT_TYPE(scene.shotSize)}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.cameraAngle ? `${IMAGE_PROMPT_COMPILER_CONFIG.CAMERA_ANGLE_PREFIX}${scene.cameraAngle}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
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
