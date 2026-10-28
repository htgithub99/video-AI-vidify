import {
  SOURCE_TEXT_DESC,
  SOURCE_TEXT_EDITORIAL_ADVISORY,
  SOURCE_TEXT_EMPTY_OR_CORRUPT_SCRIPT_PAYLOAD,
  SOURCE_TEXT_EXPOSITION_HEAVY_DIALOGUE,
  SOURCE_TEXT_HARMFUL_OR_BLOCKED_SCRIPT_CONTENT,
  SOURCE_TEXT_HISTORICAL_OR_FACTUAL_INCONSISTENCY,
  SOURCE_TEXT_HOOK_UNFULFILLED_IN_SCRIPT_BODY,
  SOURCE_TEXT_REPETITIVE_NARRATIVE_BEATS,
  SOURCE_TEXT_SCORE_ACCEPTED,
  SOURCE_TEXT_SCORE_WEIGHTEDTOTAL,
  SOURCE_TEXT_SCRIPT_CONTINUITY_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_CONVERSATIONAL_STYLE_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_DURATION_OUTSIDE_TOLERANCE,
  SOURCE_TEXT_SCRIPT_DURATION_OUT_OF_TARGET,
  SOURCE_TEXT_SCRIPT_EMOTIONAL_ARC_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_EMPTY_TRANSITIONAL_CLICHE,
  SOURCE_TEXT_SCRIPT_FACTUALITY_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_HOOK_PAYOFF_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_MISSING_OR_EMPTY,
  SOURCE_TEXT_SCRIPT_REPETITION_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_SUSPENSE_TEMPLATE_OVERUSED,
  SOURCE_TEXT_SCRIPT_TRAILER_METAPHOR_OVERUSED,
  SOURCE_TEXT_WEAK_EMOTIONAL_ARC_PROGRESSION,
} from "../constants/sourceText";
import _ from "lodash";
import { FLEXIBLE_DURATION_CONFIG, SCRIPT_SPEECH_RATE_CONFIG } from "../constants/config.js";
import { VideoGenre } from "../constants/enums.js";
import { SCRIPT_CLICHE_PATTERNS, TIME_PARSING_REGEXES } from "../constants/regexes.js";
import { HookScore, HookVersion, ScriptQualityReport } from "../types.js";
const SCRIPT_QUALITY_THRESHOLDS = {
  CONTINUITY: 80,
  FACTUALITY: 85,
  REPETITION: 80,
  EMOTIONAL_ARC: 80,
  CONVERSATIONAL: 80,
  HOOK_PAYOFF: 80,
  HOOK_FACTUAL_SAFETY: 80,
  MINIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MINIMUM_RATIO,
  MAXIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MAXIMUM_RATIO,
  DEFAULT_WORDS_PER_MINUTE: SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DECIMAL_PRECISION: 2,
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  HOOK_WEIGHT_RETENTION: 0.35,
  HOOK_WEIGHT_CLARITY: 0.2,
  HOOK_WEIGHT_EMOTION: 0.25,
  HOOK_WEIGHT_FACTUAL_SAFETY: 0.2,
  TARGET_SECONDS_DEFAULT: 0,
  MIN_WORD_COUNT: 0,
  ZERO_SECONDS: 0,
  POSITIVE_FLOOR: 0,
  DEFAULT_SCORE: 0,
  TOTAL_CATEGORIES: 5,
} as const;
export const SCRIPT_QUALITY_MESSAGES = {
  EMPTY_SCRIPT: SOURCE_TEXT_EMPTY_OR_CORRUPT_SCRIPT_PAYLOAD,
  HARMFUL_CONTENT: SOURCE_TEXT_HARMFUL_OR_BLOCKED_SCRIPT_CONTENT,
  FACTUAL_INCONSISTENCY: SOURCE_TEXT_HISTORICAL_OR_FACTUAL_INCONSISTENCY,
  REPETITIVE_NARRATIVE: SOURCE_TEXT_REPETITIVE_NARRATIVE_BEATS,
  WEAK_EMOTIONAL_ARC: SOURCE_TEXT_WEAK_EMOTIONAL_ARC_PROGRESSION,
  EXPOSITIONS_HEAVY: SOURCE_TEXT_EXPOSITION_HEAVY_DIALOGUE,
  HOOK_DISCONNECTED: SOURCE_TEXT_HOOK_UNFULFILLED_IN_SCRIPT_BODY,
  DURATION_MISMATCH: SOURCE_TEXT_SCRIPT_DURATION_OUTSIDE_TOLERANCE,
  AI_PROSE_EMPTY_TRANSITION: SOURCE_TEXT_SCRIPT_EMPTY_TRANSITIONAL_CLICHE,
  TRAILER_METAPHOR_OVERUSED: SOURCE_TEXT_SCRIPT_TRAILER_METAPHOR_OVERUSED,
  SUSPENSE_TEMPLATE_OVERUSED: SOURCE_TEXT_SCRIPT_SUSPENSE_TEMPLATE_OVERUSED,
  MISSING_OR_EMPTY: SOURCE_TEXT_SCRIPT_MISSING_OR_EMPTY,
  DURATION_OUT_OF_TARGET: SOURCE_TEXT_SCRIPT_DURATION_OUT_OF_TARGET,
  CONTINUITY_BELOW_TARGET: SOURCE_TEXT_SCRIPT_CONTINUITY_BELOW_TARGET,
  FACTUALITY_BELOW_TARGET: SOURCE_TEXT_SCRIPT_FACTUALITY_BELOW_TARGET,
  REPETITION_BELOW_TARGET: SOURCE_TEXT_SCRIPT_REPETITION_BELOW_TARGET,
  EMOTIONAL_ARC_BELOW_TARGET: SOURCE_TEXT_SCRIPT_EMOTIONAL_ARC_BELOW_TARGET,
  CONVERSATIONAL_BELOW_TARGET: SOURCE_TEXT_SCRIPT_CONVERSATIONAL_STYLE_BELOW_TARGET,
  HOOK_PAYOFF_BELOW_TARGET: SOURCE_TEXT_SCRIPT_HOOK_PAYOFF_BELOW_TARGET,
  EDITORIAL_ADVISORY_PREFIX: SOURCE_TEXT_EDITORIAL_ADVISORY,
} as const;
const HARD_SCRIPT_BLOCKER_PATTERN = /(?:empty|missing(?:_|\s)+(?:the(?:_|\s)+)?script|no(?:_|\s)+script|unintelligible|corrupt|malformed|child(?:_|\s)+sexual|sexual(?:_|\s)+exploitation|csam|doxx|privacy(?:_|\s)+violation|incitement|illegal(?:_|\s)+instructions?)/i;
const VI_AI_PROSE_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  [SCRIPT_QUALITY_MESSAGES.AI_PROSE_EMPTY_TRANSITION, SCRIPT_CLICHE_PATTERNS.STORY_CLICHE],
  [SCRIPT_QUALITY_MESSAGES.TRAILER_METAPHOR_OVERUSED, SCRIPT_CLICHE_PATTERNS.TRAILER_METAPHOR],
  [SCRIPT_QUALITY_MESSAGES.SUSPENSE_TEMPLATE_OVERUSED, SCRIPT_CLICHE_PATTERNS.SUSPENSE_TEMPLATE],
];
const DURATION_REGEX = { HOURS: TIME_PARSING_REGEXES.HOURS, MINUTES: TIME_PARSING_REGEXES.MINUTES, SECONDS: TIME_PARSING_REGEXES.SECONDS, NUMERIC: /\d+(?:\.\d+)?/ } as const;
const SATIRICAL_GENRE_SET = new Set<string>([VideoGenre.SATIRICAL_LIFE_AUTO, VideoGenre.TRANSFORMATION_TIMELINE, VideoGenre.CAREER_SOCIAL_DARKSIDE, VideoGenre.DOWNFALL_CONSEQUENCE, VideoGenre.DARK_COMEDY_TRAGEDY]);
export const detectVietnameseNarrationStyleWarnings = (script: string): string[] =>
  _.compact(
    _.map(VI_AI_PROSE_PATTERNS, ([warning, pattern]) => {
      const matches = _.toString(script).match(pattern) || [];
      return matches.length > (_.isEqual(warning, SCRIPT_QUALITY_MESSAGES.AI_PROSE_EMPTY_TRANSITION) ? 0 : 1) ? warning : "";
    }),
  );
export const isSatiricalVideoGenre = (genre: unknown): boolean => SATIRICAL_GENRE_SET.has(_.toString(genre));
const clampScore = (value: unknown): number => _.clamp(_.toFinite(value), SCRIPT_QUALITY_THRESHOLDS.MIN_SCORE, SCRIPT_QUALITY_THRESHOLDS.MAX_SCORE);
export const normalizeHookScore = (value: Partial<HookScore> = {}): HookScore => {
  const retention = clampScore(value.retention),
    clarity = clampScore(value.clarity),
    emotion = clampScore(value.emotion),
    factualSafety = clampScore(value.factualSafety);
  const unsupportedClaim = Boolean(value.unsupportedClaim);
  const weightedTotal = _.round(retention * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_RETENTION + clarity * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_CLARITY + emotion * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_EMOTION + factualSafety * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_FACTUAL_SAFETY, SCRIPT_QUALITY_THRESHOLDS.DECIMAL_PRECISION);
  return { retention, clarity, emotion, factualSafety, weightedTotal, unsupportedClaim, accepted: !unsupportedClaim && factualSafety >= SCRIPT_QUALITY_THRESHOLDS.HOOK_FACTUAL_SAFETY, reasons: _.compact(_.map(value.reasons, _.toString)) };
};
export const rankHookVersions = (versions: HookVersion[]): HookVersion[] =>
  _.map(
    _.orderBy(
      _.map(versions, (version) => ({ ...version, score: normalizeHookScore(version.score) })),
      [SOURCE_TEXT_SCORE_ACCEPTED, SOURCE_TEXT_SCORE_WEIGHTEDTOTAL],
      [SOURCE_TEXT_DESC, SOURCE_TEXT_DESC],
    ),
    (version, index) => ({ ...version, selected: index === 0 && Boolean(version.score?.accepted) }),
  );
const evaluateBelowTargetScores = (report: { continuityScore: number; factualityScore: number; repetitionScore: number; emotionalArcScore: number; conversationalScore: number; hookPayoffScore: number }): string[] =>
  _.compact([
    report.continuityScore < SCRIPT_QUALITY_THRESHOLDS.CONTINUITY && SCRIPT_QUALITY_MESSAGES.CONTINUITY_BELOW_TARGET,
    report.factualityScore < SCRIPT_QUALITY_THRESHOLDS.FACTUALITY && SCRIPT_QUALITY_MESSAGES.FACTUALITY_BELOW_TARGET,
    report.repetitionScore < SCRIPT_QUALITY_THRESHOLDS.REPETITION && SCRIPT_QUALITY_MESSAGES.REPETITION_BELOW_TARGET,
    report.emotionalArcScore < SCRIPT_QUALITY_THRESHOLDS.EMOTIONAL_ARC && SCRIPT_QUALITY_MESSAGES.EMOTIONAL_ARC_BELOW_TARGET,
    report.conversationalScore < SCRIPT_QUALITY_THRESHOLDS.CONVERSATIONAL && SCRIPT_QUALITY_MESSAGES.CONVERSATIONAL_BELOW_TARGET,
    report.hookPayoffScore < SCRIPT_QUALITY_THRESHOLDS.HOOK_PAYOFF && SCRIPT_QUALITY_MESSAGES.HOOK_PAYOFF_BELOW_TARGET,
  ]);
export const normalizeScriptQualityReport = (value: Partial<ScriptQualityReport>, wordCount: number, targetDurationSeconds: number, wordsPerMinute: number = SCRIPT_QUALITY_THRESHOLDS.DEFAULT_WORDS_PER_MINUTE): ScriptQualityReport => {
  const safeWordCount = _.max([0, wordCount]) || 0;
  const safeWordsPerMinute = _.gt(wordsPerMinute, 0) ? wordsPerMinute : SCRIPT_QUALITY_THRESHOLDS.DEFAULT_WORDS_PER_MINUTE;
  const estimatedDurationSeconds = _.round((safeWordCount / safeWordsPerMinute) * SCRIPT_QUALITY_THRESHOLDS.SECONDS_PER_MINUTE);
  const durationRatio = targetDurationSeconds > 0 ? estimatedDurationSeconds / targetDurationSeconds : 0;
  const durationFit = targetDurationSeconds > 0 && durationRatio >= SCRIPT_QUALITY_THRESHOLDS.MINIMUM_DURATION_RATIO && durationRatio <= SCRIPT_QUALITY_THRESHOLDS.MAXIMUM_DURATION_RATIO;
  const reportedBlockingErrors = _.compact(_.map(value.blockingErrors, _.toString));
  const hardBlockingErrors = _.filter(reportedBlockingErrors, (error) => HARD_SCRIPT_BLOCKER_PATTERN.test(error));
  const editorialAdvisories = _.reject(reportedBlockingErrors, (error) => HARD_SCRIPT_BLOCKER_PATTERN.test(error));
  const report: ScriptQualityReport = {
    continuityScore: clampScore(value.continuityScore),
    repetitionScore: clampScore(value.repetitionScore),
    factualityScore: clampScore(value.factualityScore),
    emotionalArcScore: clampScore(value.emotionalArcScore),
    conversationalScore: clampScore(value.conversationalScore),
    hookPayoffScore: clampScore(value.hookPayoffScore),
    durationFit,
    estimatedDurationSeconds,
    blockingErrors: _.uniq(_.compact([wordCount <= 0 && SCRIPT_QUALITY_MESSAGES.MISSING_OR_EMPTY, ...hardBlockingErrors])),
    warnings: _.uniq(_.compact([..._.map(value.warnings, _.toString), ..._.map(editorialAdvisories, (advisory) => `${SCRIPT_QUALITY_MESSAGES.EDITORIAL_ADVISORY_PREFIX}${advisory}`), !durationFit && SCRIPT_QUALITY_MESSAGES.DURATION_OUT_OF_TARGET])),
    suggestedPatches: _.compact(_.map(value.suggestedPatches, _.toString)),
    passed: false,
  };
  const belowTargetScores = evaluateBelowTargetScores(report);
  report.warnings = _.uniq([...report.warnings, ...belowTargetScores]);
  report.passed = _.isEmpty(report.blockingErrors) && _.isEmpty(belowTargetScores);
  return report;
};
export const parseTargetDurationSeconds = (duration: unknown): number => {
  const normalized = _.toString(duration).toLowerCase().trim();
  if (DURATION_REGEX.HOURS.test(normalized)) {
    const hoursMatch = normalized.match(DURATION_REGEX.HOURS),
      minutesMatch = normalized.match(DURATION_REGEX.MINUTES);
    const hours = hoursMatch ? _.toFinite(hoursMatch[1]) : 0,
      minutes = minutesMatch ? _.toFinite(minutesMatch[1]) : 0;
    return hours * SCRIPT_QUALITY_THRESHOLDS.SECONDS_PER_HOUR + minutes * SCRIPT_QUALITY_THRESHOLDS.SECONDS_PER_MINUTE;
  }
  const amount = _.toFinite(_.get(normalized.match(DURATION_REGEX.NUMERIC), 0, 0));
  return DURATION_REGEX.SECONDS.test(normalized) ? amount : amount * SCRIPT_QUALITY_THRESHOLDS.SECONDS_PER_MINUTE;
};
