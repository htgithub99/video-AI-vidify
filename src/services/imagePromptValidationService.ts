import _ from "lodash";
import { StoryboardScene } from "../types";
import { ImagePromptQualityOptions, evaluateImagePrompts } from "./imagePromptQualityService";
export const validateCompiledImagePrompts = (scenes: StoryboardScene[], options: ImagePromptQualityOptions) => evaluateImagePrompts(scenes, { ...options, requireStructuredPlan: true });
