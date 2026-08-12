import _ from "lodash";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";
import { ImageGeneratorEngine } from "../types";
import { appendImagePromptAspectRatio, sanitizeImagePrompt } from "./imagePromptQualityService";

export const adaptImagePromptForEngine = (
  prompt: string,
  engine: ImageGeneratorEngine,
  aspectRatio?: string,
): string => {
  const normalized = _.trim(
    _.replace(prompt, IMAGE_PROMPT_QA_CONFIG.ENGINE_PARAMETER_PATTERN, " "),
  );
  const promptWithoutAspect = appendImagePromptAspectRatio(normalized, undefined);
  const adaptedPrompt = _.isEqual(engine, ImageGeneratorEngine.Imagen)
    ? sanitizeImagePrompt(promptWithoutAspect)
    : promptWithoutAspect;
  return appendImagePromptAspectRatio(adaptedPrompt, aspectRatio);
};
