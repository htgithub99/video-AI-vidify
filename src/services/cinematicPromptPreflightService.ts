import _ from "lodash";
import {
  CINEMATIC_POLICY_CONFIG,
  CINEMATIC_PROMPT_PREFLIGHT_CONFIG,
  CINEMATIC_TECHNICAL_FOUNDATION,
  CINEMATIC_TEXT_FREE_POLICY,
  resolveCinematicClipDuration,
} from "../constants/cinematicConstants";
import { StoryboardScene } from "../types";
import { getCinematicSceneContractIssues } from "./cinematicProductionPolicyService";

interface CinematicPromptSafetyReview {
  violatesPolicy?: boolean;
  repairedPrompt?: unknown;
}

export const resolveAuthoritativeCinematicPrompt = (originalPrompt: string, review?: CinematicPromptSafetyReview): string => {
  if (!review?.violatesPolicy) return originalPrompt;
  return _.toString(review.repairedPrompt);
};

export const getCinematicPromptPreflightIssues = (scene: StoryboardScene, prompt: string, requestedDuration?: string | number): string[] => {
  const normalizedPrompt = _.trim(prompt);
  const duration = resolveCinematicClipDuration(requestedDuration || scene.duration);
  const issues = getCinematicSceneContractIssues(scene, duration);
  const wordCount = _.size(_.words(normalizedPrompt));
  if (_.isEmpty(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:missing`);
  if (_.lt(wordCount, CINEMATIC_PROMPT_PREFLIGHT_CONFIG.MIN_WORDS) || _.gt(wordCount, CINEMATIC_PROMPT_PREFLIGHT_CONFIG.MAX_WORDS))
    issues.push(`${scene.id}:generationPrompt:length_invalid`);
  if (!_.startsWith(normalizedPrompt, CINEMATIC_TECHNICAL_FOUNDATION)) issues.push(`${scene.id}:generationPrompt:technical_foundation_missing`);
  if (!_.includes(normalizedPrompt, CINEMATIC_TEXT_FREE_POLICY)) issues.push(`${scene.id}:generationPrompt:text_free_policy_missing`);
  if (CINEMATIC_PROMPT_PREFLIGHT_CONFIG.FORBIDDEN_PATTERN.test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:conflicting_instruction`);
  const sequenceMatch = normalizedPrompt.match(
    new RegExp(`Create one continuous ${duration}(?:\\.0)?-second cinematic sequence with exactly ([3-5]) chronological shots and exactly ([2-4]) motivated cuts\\.`, "i"),
  );
  const shotCount = _.toNumber(sequenceMatch?.[1]);
  const cutCount = _.toNumber(sequenceMatch?.[2]);
  if (!sequenceMatch || !_.inRange(shotCount, CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT, CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT + 1) || !_.isEqual(cutCount, shotCount - 1))
    issues.push(`${scene.id}:generationPrompt:sequence_contract_invalid`);
  for (let shotIndex = 1; shotIndex <= shotCount; shotIndex++) {
    if (!new RegExp(`Shot ${shotIndex}(?:\\s|:)`, "i").test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:shot_${shotIndex}_missing`);
    if (shotIndex > 1 && !new RegExp(`Continue directly from Shot ${shotIndex - 1}\\.`, "i").test(normalizedPrompt))
      issues.push(`${scene.id}:generationPrompt:handoff_${shotIndex - 1}_missing`);
  }
  _.forEach(scene.cinematicBeats || [], (beat, index) => {
    const dialogue = _.trim(beat.spokenDialogue);
    if (!_.isEmpty(dialogue) && !_.includes(normalizedPrompt, dialogue)) issues.push(`${scene.id}:generationPrompt:beat_${index + 1}_dialogue_missing`);
  });
  if (_.includes(["on_screen_dialogue", "off_screen_dialogue"], scene.dialogueMode)) {
    const dialogue = _.trim(scene.spokenDialogue);
    if (_.isEmpty(dialogue) || !_.includes(normalizedPrompt, dialogue)) issues.push(`${scene.id}:generationPrompt:exact_dialogue_missing`);
  }
  return _.uniq(issues);
};
