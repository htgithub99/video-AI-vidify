import { stringifyJson } from "../src/lib/jsonStringify.js";
import _ from "lodash";
import { writeVerificationLog } from "./verificationLogger.ts";
import { SCRIPT_PLAN_CONFIG } from "../src/constants/config.ts";
import { requestValidScriptPlan, resolveScriptPlanChapterCount } from "../src/server/services/scriptPlanResponseService.ts";
const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};
const createScriptPlan = (chapterCount: number): Record<string, unknown> => ({
  theme: "A complete theme",
  characterSpecs: "One stable character profile",
  preferredTerms: ["clear term"],
  factCheckNotes: "No unsupported precise claim",
  creativeBrief: { viewerPromise: "A clear payoff" },
  narrativePlan: {
    viewerPromise: "A clear payoff",
    centralQuestion: "What changes?",
    protagonist: {
      initialState: "Before",
      emotionalLack: "Trust",
      externalGoal: "Reach the goal",
      internalNeed: "Accept change",
      temptation: "A shortcut",
      firstCompromise: "First choice",
      escalatingChoices: ["Second choice"],
      pointOfNoReturn: "Irreversible choice",
      falseVictory: "Temporary success",
      collapse: "The cost arrives",
      finalCost: "A concrete loss",
      realization: "A changed understanding",
    },
    beats: _.times(6, (index) => ({ id: `beat_${index + 1}`, type: index === 0 ? "hook" : index === 5 ? "payoff" : "escalation", event: `Event ${index + 1}`, characterStateBefore: "Before event", characterStateAfter: "After event", visibleAction: "Performs a visible action", retentionPurpose: "Moves the central question", targetDurationSeconds: 20, callbackId: "" })),
    callbacks: [],
    endingPayoff: "The question is answered",
  },
  factPack: { claims: [] },
  chapters: _.times(chapterCount, (index) => ({
    id: `chapter_${index + 1}`,
    title: `Chapter ${index + 1}`,
    description: `Distinct event ${index + 1}`,
    purpose: "Advance the story",
    requiredBeatIds: [`beat_${index + 1}`],
    characterStartState: "Before event",
    characterEndState: "After event",
    callbackSetupIds: [],
    callbackPayoffIds: [],
    forbiddenRepetition: [],
    handoffToNextChapter: "Continue the causal chain",
  })),
});
const chapterCount = resolveScriptPlanChapterCount(2_250);
assert(chapterCount === SCRIPT_PLAN_CONFIG.MAX_CHAPTERS, "long script chapter count was not capped");
assert(resolveScriptPlanChapterCount(300) === SCRIPT_PLAN_CONFIG.MIN_CHAPTERS, "short script chapter count fell below minimum");
const responses = ['{"theme":"cut off","chapters":[', stringifyJson(createScriptPlan(chapterCount))];
const requests: string[] = [];
const result = await requestValidScriptPlan({ contents: "Create the complete plan", config: {}, task: {} }, chapterCount, async (request) => {
  requests.push(request.contents);
  const responseIndex = _.subtract(requests.length, 1);
  return { text: responses[responseIndex], aiMetadata: { responseIndex }, rotationLogs: [`response_${responseIndex}`] };
});
assert(requests.length === SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS, "invalid script plan was not retried");
assert(_.includes(requests[1], _.toString(chapterCount)), "retry omitted the required chapter count");
assert(_.size(_.castArray(_.get(result.value, "chapters"))) === chapterCount, "retry returned an incomplete script plan");
assert(result.aiMetadata.length === SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS, "retry metadata was lost");
assert(result.rotationLogs.length === SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS, "retry logs were lost");
let rejectedError: any;
try {
  await requestValidScriptPlan({ contents: "Create the complete plan", config: {}, task: {} }, chapterCount, async () => ({ text: "not json" }));
} catch (error) {
  rejectedError = error;
}
assert(rejectedError?.scriptPlanInvalid && rejectedError?.retryable, "exhausted invalid plan did not return retry state");
writeVerificationLog("Script plan response assertions passed");
