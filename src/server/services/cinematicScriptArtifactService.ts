import _ from "lodash";
import { createHash } from "crypto";
import { CINEMATIC_SCRIPT_ARTIFACT_CONFIG } from "../../constants/config.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG, CINEMATIC_POLICY_CONFIG } from "../../constants/cinematicConstants.js";
import { ProjectLanguage } from "../../types.js";
import { validateChapterLanguage } from "../../services/chapterLanguageValidationService.js";
import { appWarn } from "../../lib/logger.js";
import { tryParseJSON } from "../utils/helpers.js";
import { getResponseSchemaIssues } from "./responseSchemaValidationService.js";

interface ArtifactAiResponse {
  text?: string;
  aiMetadata?: unknown;
  rotationLogs?: string[];
}

interface ArtifactRequest {
  contents: string;
  config: Record<string, unknown>;
  task: Record<string, unknown>;
}

export interface ArtifactOptions {
  artifactName: string;
  schemaVersion: string;
  schema: Record<string, unknown>;
  completionMarker?: string;
  primaryWorkerId?: string;
  recoveryWorkerId?: string;
  validate?: (value: Record<string, unknown>) => string[];
}

interface ValidArtifactResult {
  value: Record<string, unknown>;
  aiMetadata: unknown[];
  rotationLogs: string[];
}

type GenerateArtifactContent = (request: ArtifactRequest) => Promise<ArtifactAiResponse>;

const normalizeArtifactText = (value: unknown): string => _.replace(_.trim(_.toString(value)), /\s+/g, " ");

const canonicalizeSignatureValue = (value: unknown): unknown => {
  if (_.isArray(value)) return _.map(value, canonicalizeSignatureValue);
  if (!_.isPlainObject(value)) return value;
  return _.fromPairs(
    _.map(_.sortBy(_.keys(value)), (key) => [key, canonicalizeSignatureValue(_.get(value, key))]),
  );
};

export const createCinematicScriptSourceSignature = (source: Record<string, unknown>): string =>
  createHash("sha256").update(JSON.stringify(canonicalizeSignatureValue(source))).digest("hex");

export const getCinematicStoryBibleIssues = (value: Record<string, unknown>): string[] => {
  const creativeBrief = _.get(value, "creativeBrief");
  const factPack = _.get(value, "factPack");
  const creativeBriefFields = ["logline", "centralQuestion", "viewerPromise", "centralMessage", "primaryCharacter", "conflict", "turningPoint", "resolution", "emotionalArc"];
  return _.uniq(
    _.compact([
      _.isEmpty(_.trim(_.toString(_.get(value, "theme")))) && "$root.theme:empty",
      _.isEmpty(_.trim(_.toString(_.get(value, "characterSpecs")))) && "$root.characterSpecs:empty",
      ..._.map(
        _.filter(creativeBriefFields, (field) => _.isEmpty(_.trim(_.toString(_.get(creativeBrief, field))))),
        (field) => `$root.creativeBrief.${field}:empty`,
      ),
      !_.isArray(_.get(factPack, "claims")) && "$root.factPack.claims:expected_array",
    ]),
  );
};

export const getCinematicNarrativePlanIssues = (value: Record<string, unknown>, chapterCount: number, storyBibleArtifactId?: unknown): string[] => {
  const narrativePlan = _.get(value, "narrativePlan") as Record<string, unknown>;
  const beats = _.castArray(_.get(narrativePlan, "beats"));
  const callbacks = _.castArray(_.get(narrativePlan, "callbacks"));
  const chapters = _.castArray(_.get(value, "chapters"));
  const beatIds = _.map(beats, (beat) => _.trim(_.toString(_.get(beat, "id"))));
  const callbackIds = _.map(callbacks, (callback) => _.trim(_.toString(_.get(callback, "id"))));
  const chapterIds = _.map(chapters, (chapter) => _.trim(_.toString(_.get(chapter, "id"))));
  const unknownBeatReferences = _.difference(_.uniq(_.flatMap(chapters, (chapter) => _.castArray(_.get(chapter, "requiredBeatIds")))), beatIds);
  const unknownCallbackReferences = _.difference(
    _.uniq(_.flatMap(chapters, (chapter) => _.concat(_.castArray(_.get(chapter, "callbackSetupIds")), _.castArray(_.get(chapter, "callbackPayoffIds"))))),
    callbackIds,
  );
  const callbackBeatReferences = _.flatMap(callbacks, (callback) => [_.get(callback, "setupBeatId"), _.get(callback, "payoffBeatId")]);
  return _.uniq(
    _.compact([
      chapters.length !== chapterCount && `$root.chapters:expected_${chapterCount}_received_${chapters.length}`,
      !_.isUndefined(storyBibleArtifactId) && !_.isEqual(_.get(value, "sourceStoryBibleArtifactId"), storyBibleArtifactId) &&
        "$root.sourceStoryBibleArtifactId:mismatch",
      _.uniq(beatIds).length !== beatIds.length && "$root.narrativePlan.beats:id_duplicate",
      _.uniq(callbackIds).length !== callbackIds.length && "$root.narrativePlan.callbacks:id_duplicate",
      _.uniq(chapterIds).length !== chapterIds.length && "$root.chapters:id_duplicate",
      ..._.map(unknownBeatReferences, (id) => `$root.chapters:unknown_beat_${id}`),
      ..._.map(unknownCallbackReferences, (id) => `$root.chapters:unknown_callback_${id}`),
      ..._.map(_.difference(_.compact(callbackBeatReferences), beatIds), (id) => `$root.narrativePlan.callbacks:unknown_beat_${id}`),
      ..._.flatMap(chapters, (chapter, index) =>
        _.map(
          _.filter(["id", "title", "description", "purpose"], (field) => _.isEmpty(_.trim(_.toString(_.get(chapter, field))))),
          (field) => `$root.chapters[${index}].${field}:empty`,
        ),
      ),
    ]),
  );
};

export const getCinematicScreenplayArtifactIssues = (
  value: Record<string, unknown>,
  expectedChapters: unknown[],
  targetWordCount: number,
  language: ProjectLanguage,
  narrativeArtifactId?: unknown,
): string[] => {
  const isVietnamese = _.isEqual(language, ProjectLanguage.VI);
  const script = _.trim(_.toString(_.get(value, "scriptSegment")));
  const chapters = _.castArray(_.get(value, "chapters"));
  const wordRatio = _.size(_.words(script)) / (_.max([1, targetWordCount]) || 1);
  const scoreFields = ["continuityScore", "repetitionScore", "factualityScore", "emotionalArcScore", "conversationalScore", "hookPayoffScore"];
  const issues = _.compact<string>([
    _.isEmpty(script) && "$root.scriptSegment:empty",
    !/[.!?…][\s"')\]]*$/.test(script) && "$root.scriptSegment:incomplete_ending",
    !_.inRange(wordRatio, 0.9, 1.100001) && `$root.scriptSegment:word_ratio_${wordRatio.toFixed(3)}`,
    !validateChapterLanguage(script, isVietnamese).valid && "$root.scriptSegment:language_invalid",
    chapters.length !== expectedChapters.length && `$root.chapters:expected_${expectedChapters.length}_received_${chapters.length}`,
    !_.isUndefined(narrativeArtifactId) && !_.isEqual(_.get(value, "sourceNarrativeArtifactId"), narrativeArtifactId) &&
      "$root.sourceNarrativeArtifactId:mismatch",
    !_.isEmpty(_.castArray(_.get(value, "blockingErrors"))) && "$root.blockingErrors:not_empty",
    !_.isEmpty(_.castArray(_.get(value, "suggestedPatches"))) && "$root.suggestedPatches:not_empty",
    !_.every(scoreFields, (field) => _.gte(_.toNumber(_.get(value, field)), CINEMATIC_POLICY_CONFIG.MIN_SCRIPT_QA_SCORE)) && "$root:scores_below_85",
  ]);
  _.forEach(expectedChapters, (expectedChapter, index) => {
    const chapter = chapters[index];
    if (!chapter) return;
    if (!_.isEqual(_.toString(_.get(chapter, "id")), _.toString(_.get(expectedChapter, "id")))) issues.push(`$root.chapters[${index}].id:mismatch`);
    if (!_.isEqual(_.trim(_.toString(_.get(chapter, "title"))), _.trim(_.toString(_.get(expectedChapter, "title"))))) issues.push(`$root.chapters[${index}].title:mismatch`);
    const chapterScript = _.trim(_.toString(_.get(chapter, "scriptSegment")));
    if (_.isEmpty(chapterScript)) issues.push(`$root.chapters[${index}].scriptSegment:empty`);
    else if (!/[.!?…][\s"')\]]*$/.test(chapterScript)) issues.push(`$root.chapters[${index}].scriptSegment:incomplete_ending`);
    if (!validateChapterLanguage(chapterScript, isVietnamese).valid) issues.push(`$root.chapters[${index}].scriptSegment:language_invalid`);
  });
  const chapterArtifact = normalizeArtifactText(_.join(_.map(chapters, (chapter) => _.toString(_.get(chapter, "scriptSegment"))), " "));
  if (!_.isEqual(chapterArtifact, normalizeArtifactText(script))) issues.push("$root.chapters:must_exactly_partition_screenplay");
  return _.uniq(issues);
};

export const getCinematicArtifactIssues = (rawResponse: string, value: unknown, options: ArtifactOptions): string[] => {
  if (_.isEmpty(_.trim(rawResponse))) return ["response_empty"];
  if (!_.isPlainObject(value)) return ["invalid_json_or_root_not_object"];
  const artifact = value as Record<string, unknown>;
  const completionMarker = options.completionMarker || CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER;
  const terminalMarkerPattern = new RegExp(`"completionMarker"\\s*:\\s*"${_.escapeRegExp(completionMarker)}"\\s*}\\s*$`);
  return _.uniq(
    _.compact([
      ...getResponseSchemaIssues(artifact, options.schema),
      !_.isEqual(_.get(artifact, "schemaVersion"), options.schemaVersion) && `schema_version:expected_${options.schemaVersion}`,
      !_.isEqual(_.get(artifact, "completionMarker"), completionMarker) && "completion_marker_missing_or_invalid",
      !terminalMarkerPattern.test(_.trim(rawResponse)) && "completion_marker_not_terminal",
      ...(options.validate ? options.validate(artifact) : []),
    ]),
  );
};

const createRecoveryPrompt = (basePrompt: string, rawResponse: string, issues: string[], options: ArtifactOptions): string =>
  `${basePrompt}\n\n[MANDATORY FULL-ARTIFACT RECOVERY]\nArtifact ${options.artifactName} was rejected for these exact reasons:\n${JSON.stringify(
    issues,
  )}\nReturn a complete replacement artifact from the beginning. Do not patch, continue, summarize, explain, or omit fields.\n\n[REJECTED RESPONSE]\n${_.truncate(
    rawResponse,
    { length: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_REJECTED_RESPONSE_CHARACTERS, omission: "" },
  )}`;

export const requestValidCinematicArtifact = async (
  request: ArtifactRequest,
  options: ArtifactOptions,
  generateContent: GenerateArtifactContent,
): Promise<ValidArtifactResult> => {
  const aiMetadata: unknown[] = [];
  const rotationLogs: string[] = [];
  let rawResponse = "";
  let issues: string[] = ["response_not_received"];
  const primaryWorkerId = options.primaryWorkerId || CINEMATIC_SCRIPT_ARTIFACT_CONFIG.PRIMARY_WORKER_ID;
  const recoveryWorkerId = options.recoveryWorkerId || CINEMATIC_SCRIPT_ARTIFACT_CONFIG.RECOVERY_WORKER_ID;

  for (let attemptIndex = 0; attemptIndex < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attemptIndex++) {
    const workerId = attemptIndex === 0 ? primaryWorkerId : recoveryWorkerId;
    let response: ArtifactAiResponse;
    try {
      response = await generateContent({
        ...request,
        contents: attemptIndex === 0 ? request.contents : createRecoveryPrompt(request.contents, rawResponse, issues, options),
        config: {
          ...request.config,
          roomCompletionMarker: options.completionMarker || CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
          includeRoomSchemaContract: false,
        },
        task: { ...request.task, roomWorkerId: workerId },
      });
    } catch (error) {
      const errorMessage = normalizeArtifactText(_.get(error, "message") || error || "unknown_room_error");
      if (_.includes(errorMessage, CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)) throw error;
      const errorRotationLogs = _.castArray(_.get(error, "rotationLogs"));
      rotationLogs.push(..._.compact(_.map(errorRotationLogs, _.toString)));
      issues = [`room_response_failed:${_.truncate(errorMessage, { length: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.DIAGNOSTIC_RESPONSE_PREVIEW_CHARACTERS })}`];
      rawResponse = "";
      const diagnostic = `[${options.artifactName}][${workerId}] attempt=${_.add(attemptIndex, 1)} responseLength=0 issues=${_.join(issues, "|")}`;
      rotationLogs.push(diagnostic);
      appWarn(diagnostic);
      continue;
    }
    if (response.aiMetadata) aiMetadata.push(response.aiMetadata);
    if (response.rotationLogs) rotationLogs.push(...response.rotationLogs);
    rawResponse = _.toString(response.text);
    const value = tryParseJSON(rawResponse);
    issues = getCinematicArtifactIssues(rawResponse, value, options);
    const diagnostic = `[${options.artifactName}][${workerId}] attempt=${_.add(attemptIndex, 1)} responseLength=${rawResponse.length} issues=${
      _.isEmpty(issues) ? "none" : _.join(issues, "|")
    }`;
    rotationLogs.push(diagnostic);
    if (_.isEmpty(issues)) return { value: value as Record<string, unknown>, aiMetadata, rotationLogs };
    appWarn(diagnostic);
  }

  const error: any = new Error(`${options.artifactName}_invalid:${_.join(issues, ",")}`);
  Object.assign(error, {
    rotationLogs,
    retryable: true,
    scriptPlanInvalid: true,
    artifactName: options.artifactName,
    artifactIssues: issues,
    rejectedResponsePreview: _.truncate(rawResponse, { length: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.DIAGNOSTIC_RESPONSE_PREVIEW_CHARACTERS }),
  });
  throw error;
};
