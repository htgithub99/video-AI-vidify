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

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const existingPrompt = _.trim(_.toString(scene.prompt || scene.generationPrompt));
  if (!_.isEmpty(existingPrompt) && !DETECTOR_VIETNAMESE_REGEX.test(existingPrompt)) {
    return appendImagePromptAspectRatio(sanitizeImagePrompt(existingPrompt), options.aspectRatio);
  }

  const preset = resolveStylePreset(options.targetStyle);
  const narrative = compactSceneField(scene.visualIntent || scene.visibleAction || scene.script);

  const promptParts = [
    preset.positivePrompt,
    narrative ? `Depicting: ${narrative}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.shotSize ? `Shot size: ${scene.shotSize}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    scene.cameraAngle ? `Camera angle: ${scene.cameraAngle}` : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_GRID_DIRECTIVE,
  ];

  const rawPrompt = _.join(_.compact(promptParts), IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  const cleanedPrompt = deduplicatePromptSentences(sanitizeImagePrompt(rawPrompt));
  return appendImagePromptAspectRatio(cleanedPrompt, options.aspectRatio);
};

export const compileStoryboardPrompts = (
  scenes: StoryboardScene[],
  options: ImagePromptCompilerOptions = {},
): StoryboardScene[] => _.map(scenes, scene => ({
  ...scene,
  prompt: compileImagePrompt(scene, options),
}));
