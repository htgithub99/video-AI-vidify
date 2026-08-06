import _ from "lodash";
import { HookScore, HookVersion, ScriptQualityReport } from "../types.js";

export const SCRIPT_QUALITY_THRESHOLDS = {
  CONTINUITY: 95,
  FACTUALITY: 95,
  REPETITION: 85,
  CONVERSATIONAL: 85,
  HOOK_PAYOFF: 85,
  HOOK_FACTUAL_SAFETY: 80,
  DURATION_TOLERANCE_RATIO: 0.1,
  WORDS_PER_MINUTE: 150,
} as const;

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
    accepted: factualSafety >= SCRIPT_QUALITY_THRESHOLDS.HOOK_FACTUAL_SAFETY && !unsupportedClaim,
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
  const durationDelta = Math.abs(estimatedDurationSeconds - targetDurationSeconds);
  const durationFit = targetDurationSeconds > 0
    && durationDelta <= targetDurationSeconds * SCRIPT_QUALITY_THRESHOLDS.DURATION_TOLERANCE_RATIO;
  const report = {
    continuityScore: score(value.continuityScore),
    repetitionScore: score(value.repetitionScore),
    factualityScore: score(value.factualityScore),
    emotionalArcScore: score(value.emotionalArcScore),
    conversationalScore: score(value.conversationalScore),
    hookPayoffScore: score(value.hookPayoffScore),
    durationFit,
    estimatedDurationSeconds,
    blockingErrors: _.compact(_.map(value.blockingErrors, _.toString)),
    warnings: _.compact(_.map(value.warnings, _.toString)),
    suggestedPatches: _.compact(_.map(value.suggestedPatches, _.toString)),
    passed: false,
  };
  report.passed = _.isEmpty(report.blockingErrors)
    && report.continuityScore >= SCRIPT_QUALITY_THRESHOLDS.CONTINUITY
    && report.factualityScore >= SCRIPT_QUALITY_THRESHOLDS.FACTUALITY
    && report.repetitionScore >= SCRIPT_QUALITY_THRESHOLDS.REPETITION
    && report.conversationalScore >= SCRIPT_QUALITY_THRESHOLDS.CONVERSATIONAL
    && report.hookPayoffScore >= SCRIPT_QUALITY_THRESHOLDS.HOOK_PAYOFF
    && report.durationFit;
  return report;
};

export const parseTargetDurationSeconds = (duration: unknown): number => {
  const normalized = _.toString(duration).toLowerCase().trim();
  const amount = _.toFinite(_.get(normalized.match(/\d+(?:\.\d+)?/), 0, 0));
  return normalized.endsWith("s") ? amount : amount * 60;
};
