import _ from "lodash";
import { StoryboardScene } from "../types";

interface CinematicPromptSafetyReview {
  violatesPolicy?: boolean;
  repairedPrompt?: unknown;
}

export const resolveAuthoritativeCinematicPrompt = (originalPrompt: string, review?: CinematicPromptSafetyReview): string => {
  if (!review?.violatesPolicy) return originalPrompt;
  const repairedPrompt = _.toString(review.repairedPrompt);
  return _.isEmpty(_.trim(repairedPrompt)) ? originalPrompt : repairedPrompt;
};

export const getCinematicPromptPreflightIssues = (
  scene: StoryboardScene,
  prompt: string,
  _requestedDuration?: string | number,
): string[] => (_.isEmpty(_.trim(prompt)) ? [`${scene.id}:generationPrompt:missing`] : []);

export const getBlockingCinematicPromptPreflightIssues = (
  scene: StoryboardScene,
  prompt: string,
  requestedDuration?: string | number,
): string[] => getCinematicPromptPreflightIssues(scene, prompt, requestedDuration);
