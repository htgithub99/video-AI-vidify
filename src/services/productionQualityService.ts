import {
  SOURCE_TEMPLATE_THUMBNAIL_BELOW_TARGET,
  SOURCE_TEXT_AUDIO_PERCEPTUAL_QA_PENDING,
  SOURCE_TEXT_BALANCED_ASSESSMENT,
  SOURCE_TEXT_CALM_FORENSIC,
  SOURCE_TEXT_CAREFUL_UNCERTAINTY,
  SOURCE_TEXT_CAUSAL_EXPLAINER,
  SOURCE_TEXT_CLEAR_CONCLUSION,
  SOURCE_TEXT_COMPASSIONATE_RESTRAINT,
  SOURCE_TEXT_CONFIDENT_REVEAL,
  SOURCE_TEXT_CONTROLLED_INQUIRY,
  SOURCE_TEXT_CONTROLLED_TENSION,
  SOURCE_TEXT_CURIOUS_CLEAR,
  SOURCE_TEXT_EDIT_PATTERN_TOO_REPETITIVE,
  SOURCE_TEXT_EVIDENCE_DOCUMENTARY,
  SOURCE_TEXT_FOCUSED_EXPLANATORY,
  SOURCE_TEXT_INTIMATE_SADNESS,
  SOURCE_TEXT_INVESTIGATION,
  SOURCE_TEXT_MEASURED_CLOSURE,
  SOURCE_TEXT_MEASURED_DETAIL,
  SOURCE_TEXT_MISSING_CAMERA_OR_TRANSITION_INTENT,
  SOURCE_TEXT_MOTION_SAFE_CROP_REQUIRES_PREVIEW_QC,
  SOURCE_TEXT_PRECISE_EVIDENCE_REVEAL,
  SOURCE_TEXT_QUIET_REMORSE,
  SOURCE_TEXT_RANKED_LIST,
  SOURCE_TEXT_REFLECTIVE_ANALYSIS,
  SOURCE_TEXT_RESTRAINED_UNEASE,
  SOURCE_TEXT_REVIEW_COMPARISON,
  SOURCE_TEXT_SUBTITLE_CONTENT_MISSING,
  SOURCE_TEXT_SUBTITLE_CUES_MISSING,
  SOURCE_TEXT_SUBTITLE_FOCAL_POSITION_REQUIRES_PREVIEW_QC,
  SOURCE_TEXT_SUBTITLE_LINE_TOO_LONG,
  SOURCE_TEXT_SUBTITLE_MORE_THAN_ONE_LINE,
  SOURCE_TEXT_SUBTITLE_READING_TIME_INSUFFICIENT,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_TTS_AUDIO_MISSING_OR_EMPTY,
  SOURCE_TEXT_TTS_DURATION_OUT_OF_TOLERANCE,
  SOURCE_TEXT_UNAPPROVED_ASSET_ON_TIMELINE,
  SOURCE_TEXT_URGENT_CONTROLLED,
  SOURCE_TEXT_WARM_CONVICTION,
  SOURCE_TEXT_WORLD_LORE,
} from "../constants/sourceText";
import _ from "lodash";
import { AssetAcceptance, AudioQualityReport, EditorQualityReport, SceneAssetStatus, StoryboardScene, SubtitleMode, SubtitleQualityReport, ThumbnailQualityReport, VoiceArc } from "../types.js";
import { SceneVisualQuality } from "./sceneVisualQualityService.js";
import { FLEXIBLE_DURATION_CONFIG } from "../constants/config.js";
import { resolveGenreEditorialBlueprint } from "./genreEditorialBlueprintService.js";
const DEFAULT_VOICE_ARC: VoiceArc = {
  setup: { emotion: SOURCE_TEXT_RESTRAINED_UNEASE, speed: 0.94, pauseScale: 1.15 },
  descent: { emotion: SOURCE_TEXT_CONTROLLED_TENSION, speed: 0.98, pauseScale: 1 },
  isolation: { emotion: SOURCE_TEXT_INTIMATE_SADNESS, speed: 0.9, pauseScale: 1.25 },
  climax: { emotion: SOURCE_TEXT_URGENT_CONTROLLED, speed: 1.02, pauseScale: 0.9 },
  reckoning: { emotion: SOURCE_TEXT_QUIET_REMORSE, speed: 0.91, pauseScale: 1.3 },
  resolution: { emotion: SOURCE_TEXT_WARM_CONVICTION, speed: 0.96, pauseScale: 1.1 },
};
const INFORMATIONAL_VOICE_ARC: VoiceArc = {
  setup: { emotion: SOURCE_TEXT_CURIOUS_CLEAR, speed: 0.98, pauseScale: 1.05 },
  descent: { emotion: SOURCE_TEXT_FOCUSED_EXPLANATORY, speed: 1, pauseScale: 1 },
  isolation: { emotion: SOURCE_TEXT_MEASURED_DETAIL, speed: 0.96, pauseScale: 1.1 },
  climax: { emotion: SOURCE_TEXT_CONFIDENT_REVEAL, speed: 1.01, pauseScale: 0.95 },
  reckoning: { emotion: SOURCE_TEXT_BALANCED_ASSESSMENT, speed: 0.97, pauseScale: 1.08 },
  resolution: { emotion: SOURCE_TEXT_CLEAR_CONCLUSION, speed: 0.98, pauseScale: 1.05 },
};
const RESTRAINED_INVESTIGATION_VOICE_ARC: VoiceArc = {
  setup: { emotion: SOURCE_TEXT_CALM_FORENSIC, speed: 0.93, pauseScale: 1.18 },
  descent: { emotion: SOURCE_TEXT_CONTROLLED_INQUIRY, speed: 0.96, pauseScale: 1.08 },
  isolation: { emotion: SOURCE_TEXT_COMPASSIONATE_RESTRAINT, speed: 0.9, pauseScale: 1.25 },
  climax: { emotion: SOURCE_TEXT_PRECISE_EVIDENCE_REVEAL, speed: 0.97, pauseScale: 1.02 },
  reckoning: { emotion: SOURCE_TEXT_CAREFUL_UNCERTAINTY, speed: 0.91, pauseScale: 1.25 },
  resolution: { emotion: SOURCE_TEXT_MEASURED_CLOSURE, speed: 0.93, pauseScale: 1.16 },
};
export const resolveGenreVoiceArc = (genre: string = ""): VoiceArc => {
  const blueprintId = resolveGenreEditorialBlueprint(genre).id;
  if (_.includes([SOURCE_TEXT_CAUSAL_EXPLAINER, SOURCE_TEXT_REVIEW_COMPARISON, SOURCE_TEXT_RANKED_LIST, SOURCE_TEXT_WORLD_LORE] as string[], blueprintId)) return INFORMATIONAL_VOICE_ARC;
  if (_.includes([SOURCE_TEXT_INVESTIGATION, SOURCE_TEXT_EVIDENCE_DOCUMENTARY, SOURCE_TEXT_REFLECTIVE_ANALYSIS] as string[], blueprintId)) return RESTRAINED_INVESTIGATION_VOICE_ARC;
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
  const durationFit = target > 0 && durationRatio >= PRODUCTION_QA_THRESHOLDS.MINIMUM_DURATION_RATIO && durationRatio <= PRODUCTION_QA_THRESHOLDS.MAXIMUM_DURATION_RATIO;
  const hasAudioDuration = actual > 0;
  return {
    pronunciationScore: 0,
    pauseScore: 0,
    loudnessScore: 0,
    naturalnessScore: 0,
    emotionTransitionScore: 0,
    durationFit,
    actualDurationSeconds: actual,
    targetDurationSeconds: target,
    blockingErrors: hasAudioDuration ? [] : [SOURCE_TEXT_TTS_AUDIO_MISSING_OR_EMPTY],
    warnings: _.compact([!durationFit && SOURCE_TEXT_TTS_DURATION_OUT_OF_TOLERANCE, SOURCE_TEXT_AUDIO_PERCEPTUAL_QA_PENDING]),
    passed: false,
  };
};
export const evaluateSubtitles = (scenes: StoryboardScene[], subtitleMode: SubtitleMode = SubtitleMode.BurnIn): SubtitleQualityReport => {
  if (_.isEqual(subtitleMode, SubtitleMode.None)) {
    return {
      maxTwoLines: true,
      semanticBreaks: true,
      readingTimeFit: true,
      blockingErrors: [],
      warnings: [],
      passed: true,
    };
  }
  const subtitleCues = _.flatMap(scenes, (scene) => scene.subtitleCues || []);
  const lineErrors = _.filter(subtitleCues, (cue) => _.size(_.split(cue.text, "\n")) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_LINES);
  const longLines = _.filter(subtitleCues, (cue) => _.some(_.split(cue.text, "\n"), (line) => _.size(line) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE));
  const tooFast = _.filter(subtitleCues, (cue) => _.size(_.replace(cue.text, /\s/g, "")) / _.max([cue.durationSeconds, PRODUCTION_QA_THRESHOLDS.MIN_SUBTITLE_DURATION_SECONDS])! > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_SECOND);
  const hasSubtitleContent = _.every(scenes, (scene) => !_.isEmpty(scene.subtitle || scene.script));
  const blockingErrors = _.compact([!hasSubtitleContent && SOURCE_TEXT_SUBTITLE_CONTENT_MISSING, _.isEmpty(subtitleCues) && SOURCE_TEXT_SUBTITLE_CUES_MISSING]) as string[];
  const warnings = _.compact([!_.isEmpty(lineErrors) && SOURCE_TEXT_SUBTITLE_MORE_THAN_ONE_LINE, !_.isEmpty(longLines) && SOURCE_TEXT_SUBTITLE_LINE_TOO_LONG, !_.isEmpty(tooFast) && SOURCE_TEXT_SUBTITLE_READING_TIME_INSUFFICIENT, SOURCE_TEXT_SUBTITLE_FOCAL_POSITION_REQUIRES_PREVIEW_QC]);
  return {
    maxTwoLines: _.isEmpty(lineErrors),
    semanticBreaks: _.isEmpty(longLines),
    readingTimeFit: _.isEmpty(tooFast),
    blockingErrors,
    warnings,
    passed: _.isEmpty(blockingErrors),
  };
};
export const evaluateEdit = (scenes: StoryboardScene[]): EditorQualityReport => {
  const assetsApproved = _.every(scenes, (scene) => scene.assetStatus === SceneAssetStatus.Approved && scene.acceptance !== AssetAcceptance.Rejected);
  const transitionsIntentional = _.every(scenes, (scene) => !_.isEmpty(scene.cameraMotion) && !_.isEmpty(scene.transition));
  const editPatterns = _.map(scenes, (scene) => _.join([_.toLower(scene.cameraMotion || ""), _.toLower(scene.transition || "")], SOURCE_TEXT_SYMBOL_16));
  const dominantEditPatternCount = _.max(_.values(_.countBy(editPatterns))) || 0;
  const editPatternRepetitionRatio = _.isEmpty(editPatterns) ? 1 : dominantEditPatternCount / editPatterns.length;
  const blockingErrors = _.compact([!assetsApproved && SOURCE_TEXT_UNAPPROVED_ASSET_ON_TIMELINE]);
  const warnings = _.compact([!transitionsIntentional && SOURCE_TEXT_MISSING_CAMERA_OR_TRANSITION_INTENT, editPatternRepetitionRatio > PRODUCTION_QA_THRESHOLDS.MAX_TRANSITION_REPETITION_RATIO && SOURCE_TEXT_EDIT_PATTERN_TOO_REPETITIVE, SOURCE_TEXT_MOTION_SAFE_CROP_REQUIRES_PREVIEW_QC]);
  return {
    approvedAssetsOnly: assetsApproved,
    intentionalTransitions: transitionsIntentional && editPatternRepetitionRatio <= PRODUCTION_QA_THRESHOLDS.MAX_TRANSITION_REPETITION_RATIO,
    blockingErrors,
    warnings,
    passed: _.isEmpty(blockingErrors),
  };
};
export const evaluateThumbnail = (quality: SceneVisualQuality): ThumbnailQualityReport => {
  const narrativeAlignment = _.defaultTo(quality.narrativeAlignment, quality.promptAlignment);
  const scores = {
    anatomyScore: quality.anatomy,
    characterConsistencyScore: quality.characterConsistency || 100,
    focalClarityScore: quality.composition,
    smallSizeLegibilityScore: quality.editability,
    titlePromiseAlignmentScore: narrativeAlignment,
    estimatedCtrScore: _.round(_.mean([quality.composition, narrativeAlignment, quality.editability])),
  };
  const belowTarget = _.compact(_.map(scores, (value, key) => (value < PRODUCTION_QA_THRESHOLDS.MIN_THUMBNAIL_SCORE ? SOURCE_TEMPLATE_THUMBNAIL_BELOW_TARGET(`${key}`) : "")));
  const blockingErrors = _.uniq(quality.blockingErrors);
  return {
    ...scores,
    blockingErrors,
    warnings: _.uniq([...quality.warnings, ...belowTarget]),
    passed: quality.usableForVideo && _.isEmpty(blockingErrors),
  };
};
