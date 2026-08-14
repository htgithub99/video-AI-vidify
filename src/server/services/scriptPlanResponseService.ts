import _ from "lodash";
import { PIPELINE_SERVER_LOGS, RESPONSE_CONTRACT_CONFIG, SCRIPT_PLAN_CONFIG } from "../../constants/config.js";
import { SecurityConstants } from "../../constants/security.js";
import { SCRIPT_PLAN_RESPONSE_SCHEMA } from "../../constants/responseSchemas.js";
import { appWarn } from "../../lib/logger.js";
import { smartSplitSentences } from "../../lib/textProcessor.js";
import { tryParseJSON } from "../utils/helpers.js";
import { assertResponseContract, ResponseContractName } from "./responseContractService.js";
import { assertResponseSchema } from "./responseSchemaValidationService.js";

interface AiResponse {
  text?: string;
  aiMetadata?: unknown;
  rotationLogs?: string[];
}

interface ScriptPlanRequest {
  contents: string;
  config: Record<string, unknown>;
  task: Record<string, unknown>;
}

interface ValidScriptPlanResult {
  value: Record<string, unknown>;
  aiMetadata: unknown[];
  rotationLogs: string[];
}

type GenerateContent = (request: ScriptPlanRequest) => Promise<AiResponse>;

export const resolveScriptPlanChapterCount = (targetWordCount: number): number => _.clamp(
  _.ceil(targetWordCount / SCRIPT_PLAN_CONFIG.TARGET_WORDS_PER_CHAPTER),
  SCRIPT_PLAN_CONFIG.MIN_CHAPTERS,
  SCRIPT_PLAN_CONFIG.MAX_CHAPTERS,
);

const parseScriptPlan = (responseText: string): Record<string, unknown> => {
  const value = tryParseJSON(responseText);
  assertResponseContract(value, ResponseContractName.ScriptPlan);
  assertResponseSchema(value, SCRIPT_PLAN_RESPONSE_SCHEMA, SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  return value as Record<string, unknown>;
};

const assertCompleteScriptPlan = (value: Record<string, unknown>, chapterCount: number): void => {
  const chapters = _.castArray(_.get(value, "chapters"));
  const hasUsableChapterContent = _.every(chapters, chapter => _.every(
    SCRIPT_PLAN_CONFIG.REQUIRED_CHAPTER_CONTENT_FIELDS,
    field => !_.isEmpty(_.trim(_.toString(_.get(chapter, field)))),
  ));
  if (_.size(chapters) !== chapterCount || !hasUsableChapterContent) {
    throw new Error(SCRIPT_PLAN_CONFIG.INVALID_CHAPTERS_ERROR);
  }
};

const createRetryContents = (contents: string, chapterCount: number): string => _.join([
  contents,
  _.replace(
    SCRIPT_PLAN_CONFIG.RETRY_DIRECTIVE,
    SCRIPT_PLAN_CONFIG.CHAPTER_COUNT_TOKEN,
    _.toString(chapterCount),
  ),
], "\n\n");

const createSourceScopes = (sourceText: string, chapterCount: number): string[] => {
  const sentences = smartSplitSentences(sourceText);
  if (_.gte(_.size(sentences), chapterCount)) {
    const chunkSize = _.ceil(_.divide(_.size(sentences), chapterCount));
    return _.take(_.map(_.chunk(sentences, chunkSize), chunk => _.join(chunk, " ")), chapterCount);
  }
  const words = _.filter(_.split(_.trim(sourceText), /\s+/), Boolean);
  if (_.gte(_.size(words), chapterCount)) {
    const chunkSize = _.ceil(_.divide(_.size(words), chapterCount));
    return _.take(_.map(_.chunk(words, chunkSize), chunk => _.join(chunk, " ")), chapterCount);
  }
  return _.times(chapterCount, () => _.trim(sourceText));
};

const createSourceNarrativePlan = (normalizedSource: string, scopes: string[]) => ({
  viewerPromise: normalizedSource,
  centralQuestion: normalizedSource,
  protagonist: {
    initialState: _.first(scopes) || normalizedSource,
    emotionalLack: "",
    externalGoal: normalizedSource,
    internalNeed: "",
    temptation: "",
    firstCompromise: "",
    escalatingChoices: [],
    pointOfNoReturn: "",
    falseVictory: "",
    collapse: "",
    finalCost: "",
    realization: _.last(scopes) || normalizedSource,
  },
  beats: _.map(scopes, (scope, index) => ({
    id: `source_beat_${_.add(index, SecurityConstants.DEFAULT_AMOUNT)}`,
    type: index === 0 ? "hook" : index === _.subtract(_.size(scopes), 1) ? "payoff" : "escalation",
    event: scope,
    characterStateBefore: index === 0 ? "" : scopes[index - 1],
    characterStateAfter: scope,
    visibleAction: scope,
    retentionPurpose: scope,
    targetDurationSeconds: SCRIPT_PLAN_CONFIG.SOURCE_BEAT_DURATION_SECONDS,
    callbackId: "",
  })),
  callbacks: [],
  endingPayoff: _.last(scopes) || normalizedSource,
});

export const createSourceGroundedScriptPlan = (
  sourceText: string,
  chapterCount: number,
): Record<string, unknown> => {
  const normalizedSource = _.trim(sourceText);
  if (_.isEmpty(normalizedSource)) throw new Error(SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  const scopes = createSourceScopes(normalizedSource, chapterCount);
  return {
    theme: normalizedSource,
    characterSpecs: "",
    preferredTerms: [],
    factCheckNotes: "",
    creativeBrief: { viewerPromise: normalizedSource },
    narrativePlan: createSourceNarrativePlan(normalizedSource, scopes),
    factPack: { claims: [] },
    chapters: _.map(scopes, (scope, index) => ({
      id: _.join([SCRIPT_PLAN_CONFIG.SOURCE_CHAPTER_ID_PREFIX, _.add(index, SecurityConstants.DEFAULT_AMOUNT)], ""),
      title: _.truncate(scope, {
        length: SCRIPT_PLAN_CONFIG.SOURCE_TITLE_MAX_LENGTH,
        omission: SCRIPT_PLAN_CONFIG.SOURCE_TITLE_OMISSION,
      }),
      description: scope,
      purpose: scope,
      requiredBeatIds: [],
      characterStartState: "",
      characterEndState: "",
      callbackSetupIds: [],
      callbackPayoffIds: [],
      forbiddenRepetition: [],
      handoffToNextChapter: "",
    })),
  };
};

export const requestValidScriptPlan = async (
  request: ScriptPlanRequest,
  chapterCount: number,
  generateContent: GenerateContent,
  sourceText?: string,
): Promise<ValidScriptPlanResult> => {
  const aiMetadata: unknown[] = [];
  const rotationLogs: string[] = [];
  let lastError: unknown;
  for (let attemptIndex = 0; attemptIndex < SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS; attemptIndex++) {
    const response = await generateContent({
      ...request,
      contents: attemptIndex === 0 ? request.contents : createRetryContents(request.contents, chapterCount),
    });
    if (response.aiMetadata) aiMetadata.push(response.aiMetadata);
    if (response.rotationLogs) rotationLogs.push(...response.rotationLogs);
    try {
      const value = parseScriptPlan(_.toString(response.text));
      assertCompleteScriptPlan(value, chapterCount);
      return { value, aiMetadata, rotationLogs };
    } catch (error) {
      lastError = error;
      appWarn(
        PIPELINE_SERVER_LOGS.INVALID_SCRIPT_PLAN_RESPONSE_DISCARDED,
        _.add(attemptIndex, SecurityConstants.DEFAULT_AMOUNT),
        SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS,
      );
    }
  }
  if (!_.isEmpty(_.trim(sourceText))) {
    rotationLogs.push(SCRIPT_PLAN_CONFIG.SOURCE_FALLBACK_WARNING);
    return {
      value: createSourceGroundedScriptPlan(sourceText!, chapterCount),
      aiMetadata,
      rotationLogs,
    };
  }
  const error = lastError instanceof Error
    ? lastError
    : new Error(SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  Object.assign(error, { rotationLogs, retryable: true, scriptPlanInvalid: true });
  throw error;
};

export const normalizeScriptPlan = (
  parsedScriptPlan: Record<string, unknown>,
  originalInput: string,
): Record<string, unknown> => {
  const parsedChapters = _.filter(
    _.castArray(_.get(parsedScriptPlan, "chapters")),
    chapter => !_.isEmpty(_.trim(_.toString(_.get(chapter, "title")))),
  );
  if (_.lt(_.size(parsedChapters), RESPONSE_CONTRACT_CONFIG.MIN_SCRIPT_PLAN_CHAPTERS)) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.INSUFFICIENT_CHAPTERS_ERROR);
  }
  return {
    ...parsedScriptPlan,
    theme: _.trim(_.toString(_.get(parsedScriptPlan, "theme"))) || originalInput,
    characterSpecs: _.trim(_.toString(_.get(parsedScriptPlan, "characterSpecs"))),
    preferredTerms: _.compact(_.map(_.castArray(_.get(parsedScriptPlan, "preferredTerms")), _.toString)),
    factCheckNotes: _.trim(_.toString(_.get(parsedScriptPlan, "factCheckNotes"))),
    creativeBrief: _.isPlainObject(_.get(parsedScriptPlan, "creativeBrief")) ? _.get(parsedScriptPlan, "creativeBrief") : {},
    factPack: _.isPlainObject(_.get(parsedScriptPlan, "factPack")) ? _.get(parsedScriptPlan, "factPack") : { claims: [] },
    chapters: parsedChapters,
  };
};
