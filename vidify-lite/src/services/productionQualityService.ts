import _ from "lodash";
import { AudioQualityReport, EditorQualityReport, SceneAssetStatus, StoryboardScene, SubtitleQualityReport, ThumbnailQualityReport, VoiceArc } from "../types.js";
import { SceneVisualQuality } from "./sceneVisualQualityService.js";

export const DEFAULT_VOICE_ARC: VoiceArc = {
  setup: { emotion: "restrained_unease", speed: 0.94, pauseScale: 1.15 },
  descent: { emotion: "controlled_tension", speed: 0.98, pauseScale: 1 },
  isolation: { emotion: "intimate_sadness", speed: 0.9, pauseScale: 1.25 },
  climax: { emotion: "urgent_controlled", speed: 1.02, pauseScale: 0.9 },
  reckoning: { emotion: "quiet_remorse", speed: 0.91, pauseScale: 1.3 },
  resolution: { emotion: "warm_conviction", speed: 0.96, pauseScale: 1.1 },
};

export const PRODUCTION_QA_THRESHOLDS = { DURATION_TOLERANCE_RATIO: 0.1, MAX_SUBTITLE_LINES: 2, MAX_SUBTITLE_CHARS_PER_LINE: 42, MAX_SUBTITLE_CHARS_PER_SECOND: 18, MIN_THUMBNAIL_SCORE: 80 } as const;

export const evaluateAudioTiming = (actual: number, target: number): AudioQualityReport => {
  const durationFit = target > 0 && Math.abs(actual - target) <= target * PRODUCTION_QA_THRESHOLDS.DURATION_TOLERANCE_RATIO;
  const hasAudioDuration = actual > 0;
  return { pronunciationScore: 0, pauseScore: 0, loudnessScore: 0, naturalnessScore: 0, emotionTransitionScore: 0, durationFit, actualDurationSeconds: actual, targetDurationSeconds: target, blockingErrors: hasAudioDuration ? [] : ["tts_audio_missing_or_empty"], warnings: _.compact([!durationFit && "tts_duration_out_of_tolerance", "audio_perceptual_qa_pending"]), passed: false };
};

export const evaluateSubtitles = (scenes: StoryboardScene[]): SubtitleQualityReport => {
  const lineErrors = _.filter(scenes, scene => _.size(_.split(scene.subtitle || scene.script, "\n")) > 2);
  const longLines = _.filter(scenes, scene => _.some(_.split(scene.subtitle || scene.script, "\n"), line => _.size(line) > 42));
  const tooFast = _.filter(scenes, scene => _.size(scene.subtitle || scene.script) / _.max([scene.duration, 0.1])! > 18);
  const hasSubtitleContent = _.every(scenes, scene => !_.isEmpty(scene.subtitle || scene.script));
  const blockingErrors = hasSubtitleContent ? [] : ["subtitle_content_missing"];
  const warnings = _.compact([!_.isEmpty(lineErrors) && "subtitle_more_than_two_lines", !_.isEmpty(longLines) && "subtitle_line_too_long", !_.isEmpty(tooFast) && "subtitle_reading_time_insufficient", "subtitle_focal_position_requires_preview_qc"]);
  return { maxTwoLines: _.isEmpty(lineErrors), semanticBreaks: _.isEmpty(longLines), readingTimeFit: _.isEmpty(tooFast), focalSubjectSafe: true, blockingErrors, warnings, passed: _.isEmpty(blockingErrors) };
};

export const evaluateEdit = (scenes: StoryboardScene[]): EditorQualityReport => {
  const assetsApproved = _.every(scenes, scene => scene.assetStatus === SceneAssetStatus.Approved);
  const transitionsIntentional = _.every(scenes, scene => !_.isEmpty(scene.cameraMotion) && !_.isEmpty(scene.transition));
  const transitions = _.map(scenes, scene => _.toLower(scene.transition || ""));
  const dominantTransitionCount = _.max(_.values(_.countBy(transitions))) || 0;
  const transitionRepetitionRatio = _.isEmpty(transitions) ? 1 : dominantTransitionCount / transitions.length;
  const blockingErrors = _.compact([!assetsApproved && "unapproved_asset_on_timeline"]);
  const warnings = _.compact([
    !transitionsIntentional && "missing_camera_or_transition_intent",
    transitionRepetitionRatio > 0.75 && "transition_pattern_too_repetitive",
    "motion_safe_crop_requires_preview_qc",
  ]);
  return { approvedAssetsOnly: assetsApproved, intentionalTransitions: transitionsIntentional, motionSafeCrop: true, noCompensatoryZoom: true, blockingErrors, warnings, passed: _.isEmpty(blockingErrors) };
};

export const evaluateThumbnail = (quality: SceneVisualQuality): ThumbnailQualityReport => {
  const scores = { anatomyScore: quality.anatomy, characterConsistencyScore: quality.characterConsistency || 100, focalClarityScore: quality.composition, smallSizeLegibilityScore: quality.editability, titlePromiseAlignmentScore: quality.promptAlignment, estimatedCtrScore: _.round(_.mean([quality.composition, quality.promptAlignment, quality.editability])) };
  const belowTarget = _.compact(_.map(scores, (value, key) => value < PRODUCTION_QA_THRESHOLDS.MIN_THUMBNAIL_SCORE ? `thumbnail_${key}_below_target` : ""));
  const blockingErrors = _.uniq(quality.blockingErrors);
  return { ...scores, blockingErrors, warnings: _.uniq([...quality.warnings, ...belowTarget]), passed: quality.usableForVideo && _.isEmpty(blockingErrors) };
};
