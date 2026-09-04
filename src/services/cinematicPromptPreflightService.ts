import _ from "lodash";
import {
  CINEMATIC_POLICY_CONFIG,
  CINEMATIC_PROMPT_PREFLIGHT_CONFIG,
  resolveCinematicClipDuration,
} from "../constants/cinematicConstants";
import { StoryboardScene } from "../types";
import { getBlockingCinematicPlanningIssues, getCinematicSceneContractIssues } from "./cinematicProductionPolicyService";

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
  const issues = getBlockingCinematicPlanningIssues(getCinematicSceneContractIssues(scene, duration));
  const wordCount = _.size(_.words(normalizedPrompt));
  if (_.isEmpty(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:missing`);
  if (_.lt(wordCount, CINEMATIC_PROMPT_PREFLIGHT_CONFIG.MIN_WORDS) || _.gt(wordCount, CINEMATIC_PROMPT_PREFLIGHT_CONFIG.MAX_WORDS))
    issues.push(`${scene.id}:generationPrompt:length_invalid`);
  if (!/\b(?:24\s*fps|twenty-four\s+frames)\b/i.test(normalizedPrompt) || !/\b(?:anamorphic|cinema(?:tic)?\s+lens)\b/i.test(normalizedPrompt))
    issues.push(`${scene.id}:generationPrompt:cinematic_capture_missing`);
  if (!/\b(?:realistic|physically plausible|grounded)\b/i.test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:physical_rendering_missing`);
  if (!/\b(?:no|without)\b[^.]{0,100}\b(?:captions?|subtitles?|logos?|watermarks?|visible text)\b/i.test(normalizedPrompt))
    issues.push(`${scene.id}:generationPrompt:text_policy_missing`);
  if (CINEMATIC_PROMPT_PREFLIGHT_CONFIG.FORBIDDEN_PATTERN.test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:conflicting_instruction`);
  if (!new RegExp(`\\b${duration}(?:\\.0)?[- ]second\\b`, "i").test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:duration_missing`);
  const shotCount = _.size(scene.cinematicBeats);
  if (!_.inRange(shotCount, CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT, CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT + 1))
    issues.push(`${scene.id}:generationPrompt:sequence_contract_invalid`);
  for (let shotIndex = 1; shotIndex <= shotCount; shotIndex++) {
    if (!new RegExp(`Shot ${shotIndex}(?:\\s|:)`, "i").test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:shot_${shotIndex}_missing`);
  }
  _.forEach(scene.cinematicBeats || [], (beat, index) => {
    const start = _.toString(beat.startSecond);
    const end = _.toString(beat.endSecond);
    const timedShotPattern = new RegExp(`${_.escapeRegExp(start)}(?:\\.0)?\\s*s?[^\\n]{0,50}${_.escapeRegExp(end)}(?:\\.0)?\\s*s?[^\\n]{0,80}Shot\\s*${index + 1}`, "i");
    const reverseTimedShotPattern = new RegExp(`Shot\\s*${index + 1}[^\\n]{0,80}${_.escapeRegExp(start)}(?:\\.0)?\\s*s?[^\\n]{0,50}${_.escapeRegExp(end)}(?:\\.0)?\\s*s?`, "i");
    if (!timedShotPattern.test(normalizedPrompt) && !reverseTimedShotPattern.test(normalizedPrompt)) issues.push(`${scene.id}:generationPrompt:shot_${index + 1}_timing_missing`);
  });
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
