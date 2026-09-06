import _ from "lodash";
import { CharacterConfig, GenerateType, StoryboardScene } from "../types";

export const createCinematicVideoPrompt = (
  scene: StoryboardScene,
  basePrompt: string,
  generateType: GenerateType,
  _requestedDuration?: string | number,
  _characters: CharacterConfig[] = [],
): string => (_.isEqual(generateType, GenerateType.Video) ? _.toString(scene.generationPrompt) : basePrompt);
