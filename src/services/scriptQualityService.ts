import _ from "lodash";
import { FLEXIBLE_DURATION_CONFIG } from "../constants/config.js";
import { VideoGenre } from "../constants/enums.js";
import { HookScore, HookVersion, ScriptQualityReport } from "../types.js";

export const SCRIPT_QUALITY_THRESHOLDS = {
  CONTINUITY: 80,
  FACTUALITY: 85,
  REPETITION: 80,
  EMOTIONAL_ARC: 80,
  CONVERSATIONAL: 80,
  HOOK_PAYOFF: 80,
  HOOK_FACTUAL_SAFETY: 80,
  MINIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MINIMUM_RATIO,
  MAXIMUM_DURATION_RATIO: FLEXIBLE_DURATION_CONFIG.MAXIMUM_RATIO,
  WORDS_PER_MINUTE: 150,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DECIMAL_PRECISION: 2,
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  HOOK_WEIGHT_RETENTION: 0.35,
  HOOK_WEIGHT_CLARITY: 0.2,
  HOOK_WEIGHT_EMOTION: 0.25,
  HOOK_WEIGHT_FACTUAL_SAFETY: 0.2,
} as const;

export const SCRIPT_QUALITY_MESSAGES = {
  MISSING_OR_EMPTY: "script_missing_or_empty",
  DURATION_OUT_OF_TARGET: "script_duration_out_of_target",
  CONTINUITY_BELOW_TARGET: "script_continuity_below_target",
  FACTUALITY_BELOW_TARGET: "script_factuality_below_target",
  REPETITION_BELOW_TARGET: "script_repetition_below_target",
  EMOTIONAL_ARC_BELOW_TARGET: "script_emotional_arc_below_target",
  CONVERSATIONAL_BELOW_TARGET: "script_conversational_style_below_target",
  HOOK_PAYOFF_BELOW_TARGET: "script_hook_payoff_below_target",
  EDITORIAL_ADVISORY_PREFIX: "editorial_advisory: ",
  AI_PROSE_EMPTY_TRANSITION: "script_ai_prose_empty_transition",
  TRAILER_METAPHOR_OVERUSED: "script_trailer_metaphor_overused",
  SUSPENSE_TEMPLATE_OVERUSED: "script_suspense_template_overused",
} as const;

const HARD_SCRIPT_BLOCKER_PATTERN =
  /(?:empty|missing(?:_|\s)+(?:the(?:_|\s)+)?script|no(?:_|\s)+script|unintelligible|corrupt|malformed|child(?:_|\s)+sexual|sexual(?:_|\s)+exploitation|csam|doxx|privacy(?:_|\s)+violation|incitement|illegal(?:_|\s)+instructions?)/i;

const VI_AI_PROSE_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  [
    SCRIPT_QUALITY_MESSAGES.AI_PROSE_EMPTY_TRANSITION,
    /(?:mọi chuyện chưa dừng lại ở đó|không ai có thể ngờ rằng|đằng sau vẻ hào nhoáng|bức tranh đa chiều|hồi chuông cảnh tỉnh|bài học đắt giá)/giu,
  ],
  [SCRIPT_QUALITY_MESSAGES.TRAILER_METAPHOR_OVERUSED, /(?:sợi dây vô hình|con tốt(?: thí)?|lật ngược ván cờ|sự thật phơi bày|cái giá phải trả|nhát dao|lõi của hệ thống)/giu],
  [SCRIPT_QUALITY_MESSAGES.SUSPENSE_TEMPLATE_OVERUSED, /bạn tưởng[^.!?…]{0,120}(?:nhưng|hóa ra)/giu],
];

const DURATION_REGEX = {
  HOURS: /(\d+(?:\.\d+)?)\s*(?:h\b|hour|hours|giờ)/i,
  MINUTES: /(\d+(?:\.\d+)?)\s*(?:m\b|min\b|minute|minutes|phút)/i,
  SECONDS: /\d+(?:\.\d+)?\s*(?:s\b|sec\b|secs\b|second|seconds|giây)/i,
  NUMERIC: /\d+(?:\.\d+)?/,
} as const;

const SATIRICAL_GENRE_SET = new Set<string>([
  VideoGenre.SATIRICAL_LIFE_AUTO,
  VideoGenre.TRANSFORMATION_TIMELINE,
  VideoGenre.CAREER_SOCIAL_DARKSIDE,
  VideoGenre.DOWNFALL_CONSEQUENCE,
  VideoGenre.DARK_COMEDY_TRAGEDY,
]);

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
  const weightedTotal = _.round(
    retention * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_RETENTION +
      clarity * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_CLARITY +
      emotion * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_EMOTION +
      factualSafety * SCRIPT_QUALITY_THRESHOLDS.HOOK_WEIGHT_FACTUAL_SAFETY,
    SCRIPT_QUALITY_THRESHOLDS.DECIMAL_PRECISION,
  );
  return {
    retention,
    clarity,
    emotion,
    factualSafety,
    weightedTotal,
    unsupportedClaim,
    accepted: !unsupportedClaim && factualSafety >= SCRIPT_QUALITY_THRESHOLDS.HOOK_FACTUAL_SAFETY,
    reasons: _.compact(_.map(value.reasons, _.toString)),
  };
};

export const rankHookVersions = (versions: HookVersion[]): HookVersion[] =>
  _.map(
    _.orderBy(
      _.map(versions, (version) => ({ ...version, score: normalizeHookScore(version.score) })),
      ["score.accepted", "score.weightedTotal"],
      ["desc", "desc"],
    ),
    (version, index) => ({ ...version, selected: index === 0 && Boolean(version.score?.accepted) }),
  );

const evaluateBelowTargetScores = (report: {
  continuityScore: number;
  factualityScore: number;
  repetitionScore: number;
  emotionalArcScore: number;
  conversationalScore: number;
  hookPayoffScore: number;
}): string[] =>
  _.compact([
    report.continuityScore < SCRIPT_QUALITY_THRESHOLDS.CONTINUITY && SCRIPT_QUALITY_MESSAGES.CONTINUITY_BELOW_TARGET,
    report.factualityScore < SCRIPT_QUALITY_THRESHOLDS.FACTUALITY && SCRIPT_QUALITY_MESSAGES.FACTUALITY_BELOW_TARGET,
    report.repetitionScore < SCRIPT_QUALITY_THRESHOLDS.REPETITION && SCRIPT_QUALITY_MESSAGES.REPETITION_BELOW_TARGET,
    report.emotionalArcScore < SCRIPT_QUALITY_THRESHOLDS.EMOTIONAL_ARC && SCRIPT_QUALITY_MESSAGES.EMOTIONAL_ARC_BELOW_TARGET,
    report.conversationalScore < SCRIPT_QUALITY_THRESHOLDS.CONVERSATIONAL && SCRIPT_QUALITY_MESSAGES.CONVERSATIONAL_BELOW_TARGET,
    report.hookPayoffScore < SCRIPT_QUALITY_THRESHOLDS.HOOK_PAYOFF && SCRIPT_QUALITY_MESSAGES.HOOK_PAYOFF_BELOW_TARGET,
  ]);

export const normalizeScriptQualityReport = (value: Partial<ScriptQualityReport>, wordCount: number, targetDurationSeconds: number): ScriptQualityReport => {
  const safeWordCount = _.max([0, wordCount]) || 0;
  const estimatedDurationSeconds = _.round((safeWordCount / SCRIPT_QUALITY_THRESHOLDS.WORDS_PER_MINUTE) * SCRIPT_QUALITY_THRESHOLDS.SECONDS_PER_MINUTE);
  const durationRatio = targetDurationSeconds > 0 ? estimatedDurationSeconds / targetDurationSeconds : 0;
  const durationFit =
    targetDurationSeconds > 0 && durationRatio >= SCRIPT_QUALITY_THRESHOLDS.MINIMUM_DURATION_RATIO && durationRatio <= SCRIPT_QUALITY_THRESHOLDS.MAXIMUM_DURATION_RATIO;
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
    warnings: _.uniq(
      _.compact([
        ..._.map(value.warnings, _.toString),
        ..._.map(editorialAdvisories, (advisory) => `${SCRIPT_QUALITY_MESSAGES.EDITORIAL_ADVISORY_PREFIX}${advisory}`),
        !durationFit && SCRIPT_QUALITY_MESSAGES.DURATION_OUT_OF_TARGET,
      ]),
    ),
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
