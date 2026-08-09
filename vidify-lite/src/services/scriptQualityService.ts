import _ from "lodash";
import { HookScore, HookVersion, ScriptQualityReport } from "../types.js";

export const SCRIPT_QUALITY_THRESHOLDS = {
  CONTINUITY: 80,
  FACTUALITY: 85,
  REPETITION: 80,
  CONVERSATIONAL: 60,
  HOOK_PAYOFF: 80,
  HOOK_FACTUAL_SAFETY: 80,
  DURATION_TOLERANCE_RATIO: 0.15,
  WORDS_PER_MINUTE: 150,
  REPAIR_PLACEHOLDERS: ["complete corrected script", "full corrected script", "corrected script", "<full_corrected_script_text>"],
} as const;

const HARD_SCRIPT_BLOCKER_PATTERN = /(?:empty|missing(?:_|\s)+(?:the(?:_|\s)+)?script|no(?:_|\s)+script|unintelligible|corrupt|malformed|child(?:_|\s)+sexual|sexual(?:_|\s)+exploitation|csam|doxx|privacy(?:_|\s)+violation|incitement|illegal(?:_|\s)+instructions?)/i;

export interface ScriptRepairValidation { accepted: boolean; wordCount: number; minimumWords: number; maximumWords: number; reasons: string[]; }
export const getTargetWordRange = (targetDurationSeconds: number): { minimumWords: number; maximumWords: number } => {
  const targetWords = targetDurationSeconds * SCRIPT_QUALITY_THRESHOLDS.WORDS_PER_MINUTE / 60;const tolerance = SCRIPT_QUALITY_THRESHOLDS.DURATION_TOLERANCE_RATIO;
  return { minimumWords: _.floor(targetWords * (1 - tolerance)), maximumWords: _.ceil(targetWords * (1 + tolerance)) };
};
export const validateScriptRepair = (candidate: string, targetDurationSeconds: number, requiredHook = ""): ScriptRepairValidation => {
  const normalizedCandidate = _.toLower(_.trim(candidate));const wordCount = _.size(_.words(candidate));const { minimumWords, maximumWords } = getTargetWordRange(targetDurationSeconds);
  const reasons = _.compact([
    _.isEmpty(normalizedCandidate) && "empty_script_repair",
    _.includes(SCRIPT_QUALITY_THRESHOLDS.REPAIR_PLACEHOLDERS, normalizedCandidate as never) && "placeholder_script_repair",
    wordCount < minimumWords && "script_repair_too_short",
    wordCount > maximumWords && "script_repair_too_long",
    !_.isEmpty(requiredHook) && !_.startsWith(normalizedCandidate, _.toLower(_.trim(requiredHook))) && "script_repair_missing_hook",
  ]) as string[];
  return { accepted: _.isEmpty(reasons), wordCount, minimumWords, maximumWords, reasons };
};

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
    accepted: !unsupportedClaim,
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
    blockingErrors: _.uniq(_.compact([wordCount <= 0 && "script_missing_or_empty", ...hardBlockingErrors])) as string[],
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
    report.conversationalScore < SCRIPT_QUALITY_THRESHOLDS.CONVERSATIONAL && "script_conversational_style_below_target",
    report.hookPayoffScore < SCRIPT_QUALITY_THRESHOLDS.HOOK_PAYOFF && "script_hook_payoff_below_target",
  ]);
  report.warnings = _.uniq([...report.warnings, ...belowTargetScores]);
  report.passed = _.isEmpty(report.blockingErrors);
  return report;
};

export const parseTargetDurationSeconds = (duration: unknown): number => {
  const normalized = _.toString(duration).toLowerCase().trim();
  const amount = _.toFinite(_.get(normalized.match(/\d+(?:\.\d+)?/), 0, 0));
  return normalized.endsWith("s") ? amount : amount * 60;
};
