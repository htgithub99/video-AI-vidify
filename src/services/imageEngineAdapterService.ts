import { ImageGeneratorEngine } from "../types";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";
export const adaptImagePromptForEngine = (prompt: string, engine: ImageGeneratorEngine, aspectRatio?: string): string => {
  void engine;
  return appendImagePromptAspectRatio(prompt, aspectRatio);
};
