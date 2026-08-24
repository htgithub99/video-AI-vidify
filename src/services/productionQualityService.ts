import _ from "lodash";
import { AssetAcceptance, AudioQualityReport, EditorQualityReport, SceneAssetStatus, StoryboardScene, SubtitleQualityReport, ThumbnailQualityReport, VoiceArc } from "../types.js";
import { SceneVisualQuality } from "./sceneVisualQualityService.js";
import { FLEXIBLE_DURATION_CONFIG } from "../constants/config.js";
import { resolveGenreEditorialBlueprint } from "./genreEditorialBlueprintService.js";

export const DEFAULT_VOICE_ARC: VoiceArc = {
  setup: { emotion: "restrained_unease", speed: 0.94, pauseScale: 1.15 },
  descent: { emotion: "controlled_tension", speed: 0.98, pauseScale: 1 },
  isolation: { emotion: "intimate_sadness", speed: 0.9, pauseScale: 1.25 },
  climax: { emotion: "urgent_controlled", speed: 1.02, pauseScale: 0.9 },
  reckoning: { emotion: "quiet_remorse", speed: 0.91, pauseScale: 1.3 },
  resolution: { emotion: "warm_conviction", speed: 0.96, pauseScale: 1.1 },
};

const INFORMATIONAL_VOICE_ARC: VoiceArc = {
  setup: { emotion: "curious_clear", speed: 0.98, pauseScale: 1.05 },
  descent: { emotion: "focused_explanatory", speed: 1, pauseScale: 1 },
  isolation: { emotion: "measured_detail", speed: 0.96, pauseScale: 1.1 },
  climax: { emotion: "confident_reveal", speed: 1.01, pauseScale: 0.95 },
  reckoning: { emotion: "balanced_assessment", speed: 0.97, pauseScale: 1.08 },
  resolution: { emotion: "clear_conclusion", speed: 0.98, pauseScale: 1.05 },
};

const RESTRAINED_INVESTIGATION_VOICE_ARC: VoiceArc = {
  setup: { emotion: "calm_forensic", speed: 0.93, pauseScale: 1.18 },
  descent: { emotion: "controlled_inquiry", speed: 0.96, pauseScale: 1.08 },
  isolation: { emotion: "compassionate_restraint", speed: 0.9, pauseScale: 1.25 },
  climax: { emotion: "precise_evidence_reveal", speed: 0.97, pauseScale: 1.02 },
  reckoning: { emotion: "careful_uncertainty", speed: 0.91, pauseScale: 1.25 },
  resolution: { emotion: "measured_closure", speed: 0.93, pauseScale: 1.16 },
};

export const resolveGenreVoiceArc = (genre: string = ""): VoiceArc => {
  const blueprintId = resolveGenreEditorialBlueprint(genre).id;
  if (_.includes(["causal_explainer", "review_comparison", "ranked_list", "world_lore"], blueprintId)) return INFORMATIONAL_VOICE_ARC;
  if (_.includes(["investigation", "evidence_documentary", "reflective_analysis"], blueprintId)) return RESTRAINED_INVESTIGATION_VOICE_ARC;
  return DEFAULT_VOICE_ARC;
};

export const PRODUCTION_QA_THRESHOLDS = {
  MINIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MINIMUM_RATIO,
  MAXIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MAXIMUM_RATIO,
  MAX_SUBTITLE_LINES: 1,
  MAX_SUBTITLE_CHARS_PER_LINE: 42,
  MAX_SUBTITLE_CHARS_PER_SECOND: 21,
  MIN_SUBTITLE_DURATION_SECONDS: 1.2,
  MAX_TRANSITION_REPETITION_RATIO: 0.75,
  MIN_THUMBNAIL_SCORE: 80,
} as const;

export const evaluateAudioTiming = (actual: number, target: number): AudioQualityReport => {
  const durationRatio = target > 0 ? actual / target : 0;
  const durationFit = target > 0
    && durationRatio >= PRODUCTION_QA_THRESHOLDS.MINIMUM_DURATION_RATIO
    && durationRatio <= PRODUCTION_QA_THRESHOLDS.MAXIMUM_DURATION_RATIO;
  const hasAudioDuration = actual > 0;
  return { pronunciationScore: 0, pauseScore: 0, loudnessScore: 0, naturalnessScore: 0, emotionTransitionScore: 0, durationFit, actualDurationSeconds: actual, targetDurationSeconds: target, blockingErrors: hasAudioDuration ? [] : ["tts_audio_missing_or_empty"], warnings: _.compact([!durationFit && "tts_duration_out_of_tolerance", "audio_perceptual_qa_pending"]), passed: false };
};

export const evaluateSubtitles = (scenes: StoryboardScene[]): SubtitleQualityReport => {
  const subtitleCues = _.flatMap(scenes, scene => scene.subtitleCues || []);
  const lineErrors = _.filter(subtitleCues, cue => _.size(_.split(cue.text, "\n")) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_LINES);
  const longLines = _.filter(subtitleCues, cue => _.some(
    _.split(cue.text, "\n"),
    line => _.size(line) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE,
  ));
  const tooFast = _.filter(subtitleCues, cue => (
    _.size(_.replace(cue.text, /\s/g, ""))
      / _.max([cue.durationSeconds, PRODUCTION_QA_THRESHOLDS.MIN_SUBTITLE_DURATION_SECONDS])!
      > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_SECOND
  ));
  const hasSubtitleContent = _.every(scenes, scene => !_.isEmpty(scene.subtitle || scene.script));
  const blockingErrors = _.compact([
    !hasSubtitleContent && "subtitle_content_missing",
    _.isEmpty(subtitleCues) && "subtitle_cues_missing",
  ]) as string[];
  const warnings = _.compact([!_.isEmpty(lineErrors) && "subtitle_more_than_one_line", !_.isEmpty(longLines) && "subtitle_line_too_long", !_.isEmpty(tooFast) && "subtitle_reading_time_insufficient", "subtitle_focal_position_requires_preview_qc"]);
  return { maxTwoLines: _.isEmpty(lineErrors), semanticBreaks: _.isEmpty(longLines), readingTimeFit: _.isEmpty(tooFast), blockingErrors, warnings, passed: _.isEmpty(blockingErrors) };
};

export const evaluateEdit = (scenes: StoryboardScene[]): EditorQualityReport => {
  const assetsApproved = _.every(scenes, scene => scene.assetStatus === SceneAssetStatus.Approved && scene.acceptance !== AssetAcceptance.Rejected);
  const transitionsIntentional = _.every(scenes, scene => !_.isEmpty(scene.cameraMotion) && !_.isEmpty(scene.transition));
  const editPatterns = _.map(scenes, scene => _.join([
    _.toLower(scene.cameraMotion || ""),
    _.toLower(scene.transition || ""),
  ], ":"));
  const dominantEditPatternCount = _.max(_.values(_.countBy(editPatterns))) || 0;
  const editPatternRepetitionRatio = _.isEmpty(editPatterns) ? 1 : dominantEditPatternCount / editPatterns.length;
  const blockingErrors = _.compact([
    !assetsApproved && "unapproved_asset_on_timeline",
    !transitionsIntentional && "missing_camera_or_transition_intent",
    editPatternRepetitionRatio > PRODUCTION_QA_THRESHOLDS.MAX_TRANSITION_REPETITION_RATIO && "edit_pattern_too_repetitive",
  ]);
  const warnings = _.compact([
    !transitionsIntentional && "missing_camera_or_transition_intent",
    editPatternRepetitionRatio > PRODUCTION_QA_THRESHOLDS.MAX_TRANSITION_REPETITION_RATIO && "edit_pattern_too_repetitive",
    "motion_safe_crop_requires_preview_qc",
  ]);
  return { approvedAssetsOnly: assetsApproved, intentionalTransitions: transitionsIntentional && editPatternRepetitionRatio <= PRODUCTION_QA_THRESHOLDS.MAX_TRANSITION_REPETITION_RATIO, blockingErrors, warnings, passed: _.isEmpty(blockingErrors) };
};

export const evaluateThumbnail = (quality: SceneVisualQuality): ThumbnailQualityReport => {
  const narrativeAlignment = _.defaultTo(quality.narrativeAlignment, quality.promptAlignment);
  const scores = { anatomyScore: quality.anatomy, characterConsistencyScore: quality.characterConsistency || 100, focalClarityScore: quality.composition, smallSizeLegibilityScore: quality.editability, titlePromiseAlignmentScore: narrativeAlignment, estimatedCtrScore: _.round(_.mean([quality.composition, narrativeAlignment, quality.editability])) };
  const belowTarget = _.compact(_.map(scores, (value, key) => value < PRODUCTION_QA_THRESHOLDS.MIN_THUMBNAIL_SCORE ? `thumbnail_${key}_below_target` : ""));
  const blockingErrors = _.uniq(quality.blockingErrors);
  return { ...scores, blockingErrors, warnings: _.uniq([...quality.warnings, ...belowTarget]), passed: quality.usableForVideo && _.isEmpty(blockingErrors) && _.isEmpty(belowTarget) };
};
