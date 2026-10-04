import {
  SOURCE_TEMPLATE_SCRIPT_PLAN_CHAPTER_MISSING,
  SOURCE_TEMPLATE_SCRIPT_PLAN_INVALID,
  SOURCE_TEXT_CHAPTERS,
  SOURCE_TEXT_CHARACTERSPECS,
  SOURCE_TEXT_CINEMATIC_2,
  SOURCE_TEXT_CREATIVEBRIEF,
  SOURCE_TEXT_FACTCHECKNOTES,
  SOURCE_TEXT_FACTPACK,
  SOURCE_TEXT_NARRATIVEPLAN,
  SOURCE_TEXT_PREFERREDTERMS,
  SOURCE_TEXT_SCRIPT_PLAN_CHAPTERS_INVALID,
  SOURCE_TEXT_SCRIPT_PLAN_CHARACTER_SPECS_MISSING,
  SOURCE_TEXT_SCRIPT_PLAN_CREATIVE_BRIEF_MISSING,
  SOURCE_TEXT_SCRIPT_PLAN_FACT_CHECK_NOTES_INVALID,
  SOURCE_TEXT_SCRIPT_PLAN_FACT_PACK_MISSING,
  SOURCE_TEXT_SCRIPT_PLAN_NARRATIVE_PLAN_MISSING,
  SOURCE_TEXT_SCRIPT_PLAN_PREFERRED_TERMS_INVALID,
  SOURCE_TEXT_SCRIPT_PLAN_THEME_MISSING,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_THEME,
} from "../../constants/sourceText";
import { getErrorMessage } from "../../utils/errorUtils";
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
export const resolveScriptPlanChapterCount = (targetWordCount: number): number => _.clamp(_.ceil(targetWordCount / SCRIPT_PLAN_CONFIG.TARGET_WORDS_PER_CHAPTER), SCRIPT_PLAN_CONFIG.MIN_CHAPTERS, SCRIPT_PLAN_CONFIG.MAX_CHAPTERS);
const parseScriptPlan = (responseText: string): Record<string, unknown> => {
  const value = tryParseJSON(responseText);
  assertResponseContract(value, ResponseContractName.ScriptPlan);
  assertResponseSchema(value, SCRIPT_PLAN_RESPONSE_SCHEMA, SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  return value as Record<string, unknown>;
};
const assertCompleteScriptPlan = (value: Record<string, unknown>, chapterCount: number): void => {
  const chapters = _.castArray(_.get(value, SOURCE_TEXT_CHAPTERS));
  const hasUsableChapterContent = _.every(chapters, (chapter) => _.every(SCRIPT_PLAN_CONFIG.REQUIRED_CHAPTER_CONTENT_FIELDS, (field) => !_.isEmpty(_.trim(_.toString(_.get(chapter, field))))));
  if (_.size(chapters) !== chapterCount || !hasUsableChapterContent) {
    throw new Error(SCRIPT_PLAN_CONFIG.INVALID_CHAPTERS_ERROR);
  }
};
const createRetryContents = (contents: string, chapterCount: number): string => _.join([contents, _.replace(SCRIPT_PLAN_CONFIG.RETRY_DIRECTIVE, SCRIPT_PLAN_CONFIG.CHAPTER_COUNT_TOKEN, _.toString(chapterCount))], "\n\n");
export const requestValidScriptPlan = async (request: ScriptPlanRequest, chapterCount: number, generateContent: GenerateContent): Promise<ValidScriptPlanResult> => {
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
      appWarn(PIPELINE_SERVER_LOGS.INVALID_SCRIPT_PLAN_RESPONSE_DISCARDED, _.add(attemptIndex, 1), SCRIPT_PLAN_CONFIG.MAX_RESPONSE_ATTEMPTS, getErrorMessage(error));
    }
  }
  const error = lastError instanceof Error ? lastError : new Error(SCRIPT_PLAN_CONFIG.INVALID_RESPONSE_ERROR);
  _.assign(error, { rotationLogs, retryable: true, scriptPlanInvalid: true });
  throw error;
};
export const normalizeScriptPlan = (parsedScriptPlan: Record<string, unknown>, _originalInput: string, requireCompleteAiArtifact: boolean = false): Record<string, unknown> => {
  const parsedChapters = _.get(parsedScriptPlan, SOURCE_TEXT_CHAPTERS);
  if (_.lt(_.size(parsedChapters as unknown[]), RESPONSE_CONTRACT_CONFIG.MIN_SCRIPT_PLAN_CHAPTERS)) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.INSUFFICIENT_CHAPTERS_ERROR);
  }
  const artifactIssues = _.compact([
    _.isEmpty(_.trim(_.toString(_.get(parsedScriptPlan, SOURCE_TEXT_THEME)))) && SOURCE_TEXT_SCRIPT_PLAN_THEME_MISSING,
    _.isEmpty(_.trim(_.toString(_.get(parsedScriptPlan, SOURCE_TEXT_CHARACTERSPECS)))) && SOURCE_TEXT_SCRIPT_PLAN_CHARACTER_SPECS_MISSING,
    !_.isArray(_.get(parsedScriptPlan, SOURCE_TEXT_PREFERREDTERMS)) && SOURCE_TEXT_SCRIPT_PLAN_PREFERRED_TERMS_INVALID,
    !_.isString(_.get(parsedScriptPlan, SOURCE_TEXT_FACTCHECKNOTES)) && SOURCE_TEXT_SCRIPT_PLAN_FACT_CHECK_NOTES_INVALID,
    !_.isPlainObject(_.get(parsedScriptPlan, SOURCE_TEXT_CREATIVEBRIEF)) || _.isEmpty(_.get(parsedScriptPlan, SOURCE_TEXT_CREATIVEBRIEF)) ? SOURCE_TEXT_SCRIPT_PLAN_CREATIVE_BRIEF_MISSING : "",
    !_.isPlainObject(_.get(parsedScriptPlan, SOURCE_TEXT_NARRATIVEPLAN)) || _.isEmpty(_.get(parsedScriptPlan, SOURCE_TEXT_NARRATIVEPLAN)) ? SOURCE_TEXT_SCRIPT_PLAN_NARRATIVE_PLAN_MISSING : "",
    !_.isPlainObject(_.get(parsedScriptPlan, SOURCE_TEXT_FACTPACK)) ? SOURCE_TEXT_SCRIPT_PLAN_FACT_PACK_MISSING : "",
    !_.isArray(parsedChapters) && SOURCE_TEXT_SCRIPT_PLAN_CHAPTERS_INVALID,
    ..._.flatMap(_.castArray(parsedChapters), (chapter, index) =>
      _.map(
        _.filter(SCRIPT_PLAN_CONFIG.REQUIRED_CHAPTER_CONTENT_FIELDS, (field) => _.isEmpty(_.trim(_.toString(_.get(chapter, field))))),
        (field) => SOURCE_TEMPLATE_SCRIPT_PLAN_CHAPTER_MISSING(`${index}`, `${field}`),
      ),
    ),
  ]);
  if (!_.isEmpty(artifactIssues)) {
    throw new Error(SOURCE_TEMPLATE_SCRIPT_PLAN_INVALID(`${requireCompleteAiArtifact ? SOURCE_TEXT_CINEMATIC_2 : ""}`, `${_.join(artifactIssues, SOURCE_TEXT_SYMBOL_4)}`));
  }
  return parsedScriptPlan;
};
