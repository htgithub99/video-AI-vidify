import _ from "lodash";
import { FLEXIBLE_DURATION_CONFIG } from "../constants/config.js";
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
} as const;

const HARD_SCRIPT_BLOCKER_PATTERN = /(?:empty|missing(?:_|\s)+(?:the(?:_|\s)+)?script|no(?:_|\s)+script|unintelligible|corrupt|malformed|child(?:_|\s)+sexual|sexual(?:_|\s)+exploitation|csam|doxx|privacy(?:_|\s)+violation|incitement|illegal(?:_|\s)+instructions?)/i;

const score = (value: unknown): number => _.clamp(_.toFinite(value), 0, 100);

export const normalizeHookScore = (value: Partial<HookScore> = {}): HookScore => {
  const retention = score(value.retention);
  const clarity = score(value.clarity);
  const emotion = score(value.emotion);
  const factualSafety = score(value.factualSafety);
  const unsupportedClaim = Boolean(value.unsupportedClaim);
  const weightedTotal = _.round(
    retention * 0.35 + clarity * 0.2 + emotion * 0.25 + factualSafety * 0.2,
    2,
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

export const rankHookVersions = (versions: HookVersion[]): HookVersion[] => _.map(
  _.orderBy(
    _.map(versions, version => ({ ...version, score: normalizeHookScore(version.score) })),
    ["score.accepted", "score.weightedTotal"],
    ["desc", "desc"],
  ),
  (version, index) => ({ ...version, selected: index === 0 && Boolean(version.score?.accepted) }),
);

export const normalizeScriptQualityReport = (
  value: Partial<ScriptQualityReport>,
  wordCount: number,
  targetDurationSeconds: number,
): ScriptQualityReport => {
  const estimatedDurationSeconds = _.round(
    (_.max([0, wordCount])! / SCRIPT_QUALITY_THRESHOLDS.WORDS_PER_MINUTE) * 60,
  );
  const durationRatio = targetDurationSeconds > 0 ? estimatedDurationSeconds / targetDurationSeconds : 0;
  const durationFit = targetDurationSeconds > 0
    && durationRatio >= SCRIPT_QUALITY_THRESHOLDS.MINIMUM_DURATION_RATIO
    && durationRatio <= SCRIPT_QUALITY_THRESHOLDS.MAXIMUM_DURATION_RATIO;
  const reportedBlockingErrors = _.compact(_.map(value.blockingErrors, _.toString));
  const hardBlockingErrors = _.filter(reportedBlockingErrors, error => HARD_SCRIPT_BLOCKER_PATTERN.test(error));
  const editorialAdvisories = _.reject(reportedBlockingErrors, error => HARD_SCRIPT_BLOCKER_PATTERN.test(error));
  const report = {
    continuityScore: score(value.continuityScore),
    repetitionScore: score(value.repetitionScore),
    factualityScore: score(value.factualityScore),
    emotionalArcScore: score(value.emotionalArcScore),
    conversationalScore: score(value.conversationalScore),
    hookPayoffScore: score(value.hookPayoffScore),
    durationFit,
    estimatedDurationSeconds,
    blockingErrors: _.uniq(_.compact([
      wordCount <= 0 && "script_missing_or_empty",
      ...hardBlockingErrors,
    ])) as string[],
    warnings: _.uniq(_.compact([
      ..._.map(value.warnings, _.toString),
      ..._.map(editorialAdvisories, advisory => `editorial_advisory: ${advisory}`),
      !durationFit && "script_duration_out_of_target",
    ])) as string[],
    suggestedPatches: _.compact(_.map(value.suggestedPatches, _.toString)),
    passed: false,
  };
  const belowTargetScores = _.compact([
    report.continuityScore < SCRIPT_QUALITY_THRESHOLDS.CONTINUITY && "script_continuity_below_target",
    report.factualityScore < SCRIPT_QUALITY_THRESHOLDS.FACTUALITY && "script_factuality_below_target",
    report.repetitionScore < SCRIPT_QUALITY_THRESHOLDS.REPETITION && "script_repetition_below_target",
    report.emotionalArcScore < SCRIPT_QUALITY_THRESHOLDS.EMOTIONAL_ARC && "script_emotional_arc_below_target",
    report.conversationalScore < SCRIPT_QUALITY_THRESHOLDS.CONVERSATIONAL && "script_conversational_style_below_target",
    report.hookPayoffScore < SCRIPT_QUALITY_THRESHOLDS.HOOK_PAYOFF && "script_hook_payoff_below_target",
  ]);
  report.warnings = _.uniq([...report.warnings, ...belowTargetScores]);
  report.passed = _.isEmpty(report.blockingErrors)
    && _.isEmpty(belowTargetScores);
  return report;
};

export const parseTargetDurationSeconds = (duration: unknown): number => {
  const normalized = _.toString(duration).toLowerCase().trim();
  if (normalized.includes("h")) {
    const hoursMatch = normalized.match(/(\d+(?:\.\d+)?)h/);
    const minutesMatch = normalized.match(/(\d+(?:\.\d+)?)m/);
    const hours = hoursMatch ? _.toFinite(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? _.toFinite(minutesMatch[1]) : 0;
    return hours * 3600 + minutes * 60;
  }
  const amount = _.toFinite(_.get(normalized.match(/\d+(?:\.\d+)?/), 0, 0));
  return normalized.endsWith("s") ? amount : amount * 60;
};
