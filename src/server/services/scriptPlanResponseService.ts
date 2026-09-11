import _ from "lodash";
import { PIPELINE_SERVER_LOGS, RESPONSE_CONTRACT_CONFIG, SCRIPT_PLAN_CONFIG } from "../../constants/config.js";
import { SCRIPT_PLAN_RESPONSE_SCHEMA } from "../../constants/responseSchemas.js";
import { appWarn } from "../../lib/logger.js";
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

export const resolveScriptPlanChapterCount = (targetWordCount: number): number =>
  _.clamp(_.ceil(targetWordCount / SCRIPT_PLAN_CONFIG.TARGET_WORDS_PER_CHAPTER), SCRIPT_PLAN_CONFIG.MIN_CHAPTERS, SCRIPT_PLAN_CONFIG.MAX_CHAPTERS);

const parseScriptPlan = (responseText: string): Record<string, unknown> => {
  const value = tryParseJSON(responseText);
  assertResponseContract(value, ResponseContractName.ScriptPlan);
  assertResponseSchema(value, SCRIPT_PLAN_RESPONSE_SCHEMA, SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  return value as Record<string, unknown>;
};

const assertCompleteScriptPlan = (value: Record<string, unknown>, chapterCount: number): void => {
  const chapters = _.castArray(_.get(value, "chapters"));
  const hasUsableChapterContent = _.every(chapters, (chapter) =>
    _.every(SCRIPT_PLAN_CONFIG.REQUIRED_CHAPTER_CONTENT_FIELDS, (field) => !_.isEmpty(_.trim(_.toString(_.get(chapter, field))))),
  );
  if (_.size(chapters) !== chapterCount || !hasUsableChapterContent) {
    throw new Error(SCRIPT_PLAN_CONFIG.INVALID_CHAPTERS_ERROR);
  }
};

const createRetryContents = (contents: string, chapterCount: number): string =>
  _.join([contents, _.replace(SCRIPT_PLAN_CONFIG.RETRY_DIRECTIVE, SCRIPT_PLAN_CONFIG.CHAPTER_COUNT_TOKEN, _.toString(chapterCount))], "\n\n");

export const requestValidScriptPlan = async (
  request: ScriptPlanRequest,
  chapterCount: number,
  generateContent: GenerateContent,
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
      appWarn(PIPELINE_SERVER_LOGS.INVALID_SCRIPT_PLAN_RESPONSE_DISCARDED, _.add(attemptIndex, 1), SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS);
    }
  }
  const error = lastError instanceof Error ? lastError : new Error(SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  Object.assign(error, { rotationLogs, retryable: true, scriptPlanInvalid: true });
  throw error;
};

export const normalizeScriptPlan = (parsedScriptPlan: Record<string, unknown>, originalInput: string, requireCompleteAiArtifact: boolean = false): Record<string, unknown> => {
  const parsedChapters = _.filter(_.castArray(_.get(parsedScriptPlan, "chapters")), (chapter) => !_.isEmpty(_.trim(_.toString(_.get(chapter, "title")))));
  if (_.lt(_.size(parsedChapters), RESPONSE_CONTRACT_CONFIG.MIN_SCRIPT_PLAN_CHAPTERS)) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.INSUFFICIENT_CHAPTERS_ERROR);
  }
  if (requireCompleteAiArtifact) {
    const artifactIssues = _.compact([
      _.isEmpty(_.trim(_.toString(_.get(parsedScriptPlan, "theme")))) && "script_plan:theme_missing",
      _.isEmpty(_.trim(_.toString(_.get(parsedScriptPlan, "characterSpecs")))) && "script_plan:character_specs_missing",
      !_.isPlainObject(_.get(parsedScriptPlan, "creativeBrief")) || _.isEmpty(_.get(parsedScriptPlan, "creativeBrief"))
        ? "script_plan:creative_brief_missing"
        : "",
      !_.isPlainObject(_.get(parsedScriptPlan, "narrativePlan")) || _.isEmpty(_.get(parsedScriptPlan, "narrativePlan"))
        ? "script_plan:narrative_plan_missing"
        : "",
      !_.isPlainObject(_.get(parsedScriptPlan, "factPack")) ? "script_plan:fact_pack_missing" : "",
    ]);
    if (!_.isEmpty(artifactIssues)) throw new Error(`cinematic_script_plan_invalid:${_.join(artifactIssues, ",")}`);
  }
  return {
    ...parsedScriptPlan,
    theme: requireCompleteAiArtifact ? _.trim(_.toString(_.get(parsedScriptPlan, "theme"))) : _.trim(_.toString(_.get(parsedScriptPlan, "theme"))) || originalInput,
    characterSpecs: _.trim(_.toString(_.get(parsedScriptPlan, "characterSpecs"))),
    preferredTerms: _.compact(_.map(_.castArray(_.get(parsedScriptPlan, "preferredTerms")), _.toString)),
    factCheckNotes: _.trim(_.toString(_.get(parsedScriptPlan, "factCheckNotes"))),
    creativeBrief: _.isPlainObject(_.get(parsedScriptPlan, "creativeBrief")) ? _.get(parsedScriptPlan, "creativeBrief") : requireCompleteAiArtifact ? undefined : {},
    factPack: _.isPlainObject(_.get(parsedScriptPlan, "factPack")) ? _.get(parsedScriptPlan, "factPack") : requireCompleteAiArtifact ? undefined : { claims: [] },
    chapters: parsedChapters,
  };
};
