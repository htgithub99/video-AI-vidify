import _ from "lodash";
import { CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE } from "../constants/cinematicConstants";
import { CharacterConfig, GenerateType, StoryboardScene } from "../types";

export const createCinematicScreenplayDirective = (language: string, targetDuration: string): string =>
  CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE(language, targetDuration);

export const createCinematicVideoPrompt = (
  scene: StoryboardScene,
  basePrompt: string,
  generateType: GenerateType,
  _requestedDuration?: string | number,
  _characters: CharacterConfig[] = [],
): string => (_.isEqual(generateType, GenerateType.Video) ? _.toString(scene.generationPrompt) : basePrompt);
