import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { renderQueueService } from "../services/renderQueueService.js";
import { validateFFmpegRenderOptions } from "../utils/ffmpegRender.js";
import { getProfiles, launchLoginBrowser, deleteProfile } from "../services/profileManagerService.js";
import { getLocalAccounts, saveLocalAccounts } from "../services/accountRotatorService.js";

import { jsonUtils } from "../../lib/json.js";
import { generateContentWithRetry, isAiProviderAvailable } from "../services/geminiService.js";
import { beginChatPlanningRun, cancelChatPlanningRun, clearChatPlanningRooms, closeChatPlanningRoom, generatePlanningWithChatUi } from "../services/chatUiPlanningService.js";
import { classifyGeminiError, getGeminiUserMessage } from "../services/geminiErrorClassifier.js";
import { assertResponseContract, ResponseContractName } from "../services/responseContractService.js";
import { assertResponseSchema } from "../services/responseSchemaValidationService.js";
import { checkCache, setCache } from "../services/cacheService.js";
import { getProjectDetailFromDb, saveProjectDetailToDb } from "../utils/db.js";
import { getSafeFolderName } from "./projectController.js";
import JSZip from "jszip";
import { safeParseJSON, formatTime } from "../utils/helpers.js";
import { resolveImageFocusDirective } from "../../lib/imagePromptDirectives.js";
import { listTemplates, saveTemplate, deleteTemplate, renameTemplate } from "../utils/capcutTemplateManager.js";
import {
  PIPELINE_CONFIG,
  FFMPEG_RENDER_CONSTANTS,
  PROJECT_ASSET_GROUP,
  PROJECT_VISUAL_ASSET_CONFIG,
  REFERENCE_ASSET_GROUP,
  PROJECT_ASSET_ROUTE,
  PROJECT_ASSET_INVALID_REQUEST,
  PROJECT_ASSET_QUERY,
  BACKGROUND_MODE_CONFIG,
  TEXT_IN_IMAGE_MODE_CONFIG,
  FREE_AI_PROVIDER_LOGS,
  STYLE_EXTRACTION_CONFIG,
  PIPELINE_SERVER_ERRORS,
  PIPELINE_SERVER_LOGS,
  STORYBOARD_FALLBACK_CONFIG,
  RENDER_QUEUE_CONFIG,
  CONTENT_SAFETY_CONFIG,
  FINAL_MULTIMODAL_QA_CONFIG,
  FACT_RESEARCH_CONFIG,
  SCRIPT_PLAN_CONFIG,
  TECHNICAL_RESPONSE_RETRY_CONFIG,
  CINEMATIC_SCRIPT_ARTIFACT_CONFIG,
  ADVISORY_QA_CONFIG,
  STORYBOARD_QUALITY_CONFIG,
  CINEMATIC_GENERATION_RECOVERY_CONFIG,
  VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG,
  SCRIPT_SPEECH_RATE_CONFIG,
  FLOW_DIRECT_VIDEO_CONFIG,
  FLOW_VIDEO_MEDIA_CONFIG,
  FLOW_CHARACTER_CONFIG,
  GEMINI_MEDIA_ERRORS,
  PIPELINE_COMPLETION_CONFIG,
} from "../../constants/config.js";
import { SCENE_REFERENCE_CONFIG } from "../../services/sceneReferenceService.js";
import { hasValidImages } from "../services/imageAssetService.js";
import { getThumbnailPlanningIssues, getThumbnailTechnicalPlanningIssues, normalizeThumbnailIdeas } from "../../services/thumbnailPromptService.js";
import { clearProjectImageOutputs, clearProjectSceneOutput, clearProjectVideoOutputs } from "../../services/projectRegenerationService.js";
import { searchArchivalImageWithChrome } from "../services/archivalImageSearchService.js";
import { createGenreEditorialDirective } from "../../services/genreEditorialBlueprintService.js";
import { createAudienceMarketDirective } from "../../services/audienceMarketService.js";
import { createStoryboardRetentionDirective, createViewerRetentionDirective } from "../../services/viewerRetentionBlueprintService.js";
import { THUMBNAIL_PROMPT_CONFIG } from "../../constants/thumbnail.js";

import {
  EXTERNAL_URLS,
  ALIGN_CONFIG,
  EXPORT_ZIP_CONFIG,
  ENCODING_UTF8,
  ASSETS_DIR_NAME,
  PROJECTS_DIR_NAME,
  API_ROUTES,
  BACKEND_MESSAGES,
  getBackendMsg,
  getPipelineLog,
  PIPELINE_LOGS,
  PIPELINE_CONTROLLER_MESSAGES,
  VOICE_ALIGN_LOGS,
  VI_GENRE_GUIDELINES,
  VI_STYLE_GUIDELINES,
  VI_AUDIENCE_GUIDELINES,
  EN_GENRE_GUIDELINES,
  EN_STYLE_GUIDELINES,
  EN_AUDIENCE_GUIDELINES,
  PROMPT_CONTEXT,
  getStyleRewriteBatchPrompt,
  getQuickVideoPlanningPrompt,
  getChapterWriterPrompt,
  getChapterExpansionPrompt,
  getFinalScriptEditorialPrompt,
  getScriptSplitPrompt,
  getSceneDetailBatchPrompt,
  getDetailedPromptBuilderPrompt,
  getGlobalVisualBiblePrompt,
  getVideoSceneSelectionPrompt,
  getSceneImageQualityPrompt,
  SCENE_QA_REFERENCE_DIRECTIVE,
  getCharacterAnalysisPrompt,
  getCharacterExtractPrompt,
  getCharacterRewriteBatchPrompt,
  getCharacterRewriteThumbnailsBatchPrompt,
  getMultiStepHookPrompt,
  getCombinedScriptPrompt,
  getAudioQualityPrompt,
  getVisualPromptQaRepairPrompt,
  getContentSafetyPrompt,
  REGEX_AUTO_MODE_PATH,
  LogEvent,
  ErrorMessage,
  getDurationText,
  getThumbnailLayoutPrompt,
  getThumbnailContractRepairPrompt,
  GENRE_VISUAL_GUIDELINES,
  VideoGenre,
  SplitStrategy,
  SceneDensity,
  CAPCUT_CONFIG,
  WHITESPACE_REGEX,
  SINGLE_QUOTE_REGEX,
  HTTP_HEADERS,
  CONTENT_TYPES,
  TRANSFER_ENCODINGS,
  UltraStreamLogType,
  stylePresetsKeywords,
  BASE64_DATA_URL_REGEX,
  CONTENT_TYPE_HEADER,
  HTTP_METHODS,
  HTTP_STATUS_CODES,
  TEMPLATE_CONFIG,
  TTS_POLLING_CONFIG,
  HTTP_STATUS,
  VISUAL_BIBLE_REFERENCE_PROMPT,
  getSeoOptimizationPrompt,
  THUMBNAIL_IMAGE_REFERENCE_PROMPT,
  FileEncoding,
  MimeType,
  TEMPLATE_TMP_CONTENT,
  FFMPEG_CONFIG,
  COMMON_STRINGS,
  ROUTER_PATHS,
  REFACTOR_CONSTANTS,
  MUSIC_CREATOR_CONSTANTS,
  MUSIC_CREATOR_TEXTS,
  CONTENT_SAFETY_RESPONSE_SCHEMA,
  HOOK_RESPONSE_SCHEMA,
  SCRIPT_PLAN_RESPONSE_SCHEMA,
  CHAPTER_RESPONSE_SCHEMA,
  FINAL_SCRIPT_EDIT_RESPONSE_SCHEMA,
  createCinematicFilmPackageResponseSchema,
  CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA,
  VISUAL_QA_RESPONSE_SCHEMA,
  VISUAL_BIBLE_RESPONSE_SCHEMA,
  FINAL_VIDEO_QA_RESPONSE_SCHEMA,
  CINEMATIC_EDIT_DECISION_RESPONSE_SCHEMA,
  VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA,
  AUDIO_QUALITY_RESPONSE_SCHEMA,
  CINEMATIC_EDIT_ANALYSIS_CONFIG,
  SCRIPT_PROMPT_CONFIG,
  VIETNAMESE_CHAPTER_RETRY_DIRECTIVE,
  ENGLISH_CHAPTER_RETRY_DIRECTIVE,
  getVietnameseDiacriticsRestorationPrompt,
  RESPONSE_CONTRACT_CONFIG,
  SYSTEM_FETCH_CONFIG,
  resolveStylePreset,
  STYLE_IDENTITY_BOUNDARY,
} from "../../constants";
import {
  getCinematicGlobalEditDecisionPrompt,
  getCinematicCharacterAnalysisPrompt,
  getCinematicFilmPackagePrompt,
  getCinematicFilmPackageRepairPrompt,
  getCinematicFinalVideoQualityPrompt,
  getCinematicSeoPrompt,
  getCinematicStoryboardRecoveryPrompt,
  getCinematicSceneImageProviderRepairPrompt,
  getCinematicCharacterProviderRepairPrompt,
  getCinematicThumbnailPrompt,
  getCinematicThumbnailProviderRepairPrompt,
  getCinematicThumbnailTechnicalRepairPrompt,
  getCinematicVideoPlanningPrompt,
  getCinematicVideoPlanningRepairPrompt,
  getCinematicVideoPromptPolicyRepairPrompt,
  getCinematicVideoPromptRepairPrompt,
  CINEMATIC_DIALOGUE_DIRECTIVES,
} from "../../constants/cinematicPrompts.js";

import { logger, getMessage, appLogStep, getBilingualMessage, appWarn, createAppError, appError } from "../../lib/logger.js";
import { SecurityMessages } from "../../constants/security.js";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_PATTERNS, SUNO_AUTOMATION_TEXTS } from "../../constants/sunoAutomation.js";

import {
  generateImageWithPlaywright,
  generateBatchImagesWithGeminiChat,
  closeAllBatchPages,
  cancelAllActiveMediaGeneration,
  closeActiveBrowser,
  getOrLaunchGlobalBrowser,
  recoverExistingFlowVideo,
  ensureFlowCharacters,
  generateFlowVideoPromptBatchWithPlaywright,
} from "../services/imageGeneratorService.js";
import { resolveApiKeys, getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { resolveVoiceRouting } from "../../lib/voiceRouting.js";
import { validateFactPack } from "../services/factPackValidationService.js";
import { readEncodedProjectImage, readStyleReferenceImage, resolveLocalProjectAssetPath } from "../services/imageAssetService.js";
import { readVisualQaAssets } from "../services/visualQaMediaService.js";
import { analyzeCinematicClipsWithLibraries, validateCinematicEditorialDecisions } from "../services/cinematicClipAnalyzerService.js";
import { cancelActiveSunoCreation, createSunoPlaylist, downloadSunoTracksToFolder, getSunoPlaylistSongIds, launchSunoLoginBrowser } from "../services/sunoAutomationService.js";
import { hasCinematicSceneDialogue } from "../../services/cinematicEditTimelineService.js";

import {
  AspectRatio,
  AiPlanningChatModel,
  AiPlanningExecutionMode,
  AiPlanningFallbackProvider,
  AssetAcceptance,
  ContentSafetyReport,
  GenerateType,
  ImageGenerationMode,
  ImageGeneratorEngine,
  PromptInputMethod,
  ProjectLanguage,
  SceneAssetStatus,
  StoryboardScene,
  StoryboardQualityReport,
  TextInImageMode,
  ThumbnailItem,
  ThumbnailTextMode,
  VisualBible,
  VisualConfig,
} from "../../types.js";
import { HttpStatus, VideoQuality } from "../../constants/enums.js";
import { AiTaskCapability } from "../services/taskRouterService.js";
import { applyDeterministicStoryboardCoverage, getUnderfilledCinematicSceneIds, normalizeStoryboardQuality } from "../../services/storyboardQualityService.js";
import { normalizeContentSafety } from "../../services/contentSafetyService.js";
import { detectVietnameseNarrationStyleWarnings, isSatiricalVideoGenre, normalizeScriptQualityReport, parseTargetDurationSeconds } from "../../services/scriptQualityService.js";
import { resolveUsableHooks } from "../../services/hookResilienceService.js";
import { CHAPTER_LANGUAGE_VALIDATION_CONFIG, ChapterLanguageIssue, validateChapterLanguage } from "../../services/chapterLanguageValidationService.js";
import { extractCleanChapterSegment } from "../services/chapterResponseService.js";
import { normalizeScriptPlan, requestValidScriptPlan, resolveScriptPlanChapterCount } from "../services/scriptPlanResponseService.js";
import { createCinematicScriptSourceSignature } from "../services/cinematicScriptArtifactService.js";
import {
  createBatchContinuityContext,
  createPromptCharacterCards,
  createScopedVisualBibleContext,
  createVisualPlanningPayload,
  getVisualShotPlanIssues,
} from "../services/imagePromptPlanningService.js";
import {
  createCinematicPlanningBatches,
  CINEMATIC_PRODUCTION_POLICY,
  getBlockingCinematicStoryboardContractIssues,
  getCinematicScriptReadinessIssues,
  getCinematicStoryboardContractIssues,
  isCinematicEpisodeGenre,
} from "../../services/cinematicProductionPolicyService.js";
import {
  CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS,
  CINEMATIC_ARTIFACT_TYPE,
  CINEMATIC_CHARACTER_PACK_CONFIG,
  normalizeCinematicArtifactIdentity,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  CINEMATIC_ROOM_STAGE,
  CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION,
  createCinematicArtifactRequestId,
  CINEMATIC_POLICY_CONFIG,
  resolveCinematicClipDuration,
} from "../../constants/cinematicConstants.js";
import { appendImagePromptAspectRatio } from "../../services/imagePromptQualityService.js";
import { validateCompiledImagePrompts } from "../../services/imagePromptValidationService.js";
import { getRoomOnlyScriptError } from "../services/roomOnlyErrorService.js";

import ffmpeg from "fluent-ffmpeg";
import { createHash, randomUUID } from "crypto";
import os from "os";
import { exec, execFile, spawn } from "child_process";
import { StepLogger } from "../../lib/stepLogger.js";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "../utils/paths.js";
import { delayAsync } from "../../lib/shared-utils.js";

const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");
if (fs.existsSync(ffmpegBinary)) {
  ffmpeg.setFfmpegPath(ffmpegBinary);
}

const isVietnameseRequest = (req: Request): boolean => !_.isEqual(_.toString(req.body?.language || req.query?.lang || ProjectLanguage.VI), ProjectLanguage.EN);

const parseAiJsonArtifact = <T>(text: string, schema: Parameters<typeof assertResponseSchema>[1], errorMessage: string): T => {
  const value = safeParseJSON(text, undefined);
  assertResponseSchema(value, schema, errorMessage);
  return value as T;
};

type CinematicScriptArtifactKey = "filmPackage";

const QUICK_VISUAL_PLANNING_ENGLISH_FIELDS = [
  "prompt",
  "visualIntent",
  "visibleAction",
  "reaction",
  "storyEvidence",
  "visualHook",
  "shotPurpose",
  "shotSize",
  "cameraAngle",
  "composition",
  "continuityNotes",
  "lighting",
] as const;
const QUICK_VISUAL_PLANNING_REQUIRED_FIELDS = [
  "id",
  ...QUICK_VISUAL_PLANNING_ENGLISH_FIELDS,
  "characterIds",
  "locationId",
  "propIds",
  "expectedSubjectCount",
  "allowBackgroundPeople",
  "layout",
  "textAllowed",
  "textOverlay",
  "assetStrategy",
  "archivalSearchQuery",
  "archivalRationale",
] as const;
const QUICK_CHARACTER_FIELDS = [
  "id",
  "name",
  "genderPresentation",
  "ageRange",
  "ethnicitySkinTone",
  "bodyBuild",
  "faceShape",
  "eyes",
  "nose",
  "hair",
  "silhouette",
  "signatureClothing",
  "accessories",
  "colorPalette",
  "description",
  "prompt",
  "referenceGenerationPrompt",
] as const;
const QUICK_CHARACTER_ANALYSIS_RESPONSE_SCHEMA = {
  type: "array",
  minItems: 1,
  maxItems: CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS,
  items: {
    type: "object",
    additionalProperties: false,
    required: QUICK_CHARACTER_FIELDS,
    properties: _.fromPairs(_.map(QUICK_CHARACTER_FIELDS, (field) => [field, { type: "string" }])),
  },
} as const;
const QUICK_VISUAL_SHOT_PURPOSES = [
  "setup",
  "action",
  "reaction",
  "punchline",
  "reveal",
  "callback",
  "montage",
  "emotional_hold",
  "obstacle",
  "decision",
  "escalation",
  "reversal",
  "climax",
  "payoff",
  "transition",
] as const;
const QUICK_VISUAL_LAYOUTS = ["single_frame", "split_screen", "collage"] as const;

const saveCinematicScriptArtifactCheckpoint = async (
  projectId: unknown,
  key: CinematicScriptArtifactKey,
  artifact: Record<string, unknown>,
  sourceSignature: string,
): Promise<void> => {
  const safeProjectId = path.basename(_.toString(projectId));
  if (_.isEmpty(safeProjectId)) return;
  const project = await getProjectDetailFromDb(safeProjectId);
  if (!project) return;
  const matchingArtifacts = _.isEqual(project.cinematicScriptArtifacts?.sourceSignature, sourceSignature) ? project.cinematicScriptArtifacts : undefined;
  project.cinematicScriptArtifacts = {
    ...matchingArtifacts,
    sourceSignature,
    schemaVersion: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.FILM_PACKAGE_SCHEMA_VERSION,
    [key]: artifact,
    updatedAt: new Date().toISOString(),
  };
  await saveProjectDetailToDb(project);
};

const waitForNextTtsPoll = async (attempts: number): Promise<void> => {
  if (_.lt(attempts, TTS_POLLING_CONFIG.MAX_ATTEMPTS)) {
    await delayAsync(TTS_POLLING_CONFIG.INTERVAL_MS);
  }
};

const ensureHookLanguage = async (content: unknown, isVietnamese: boolean): Promise<string> => {
  const hook = _.trim(_.toString(content));
  if (_.isEmpty(hook) || validateChapterLanguage(hook, isVietnamese).valid) return hook;
  if (!isVietnamese) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  try {
    const response = await generateContentWithRetry({
      contents: getVietnameseDiacriticsRestorationPrompt(hook),
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: CHAPTER_RESPONSE_SCHEMA,
        maxOutputTokens: 512,
      },
      task: { capability: AiTaskCapability.ScriptWriting },
    });
    const restoredHook = extractCleanChapterSegment(response.text);
    return validateChapterLanguage(restoredHook, true).valid ? restoredHook : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  } catch (error) {
    appWarn(PIPELINE_SERVER_LOGS.INVALID_CHAPTER_LANGUAGE_DISCARDED, error);
    return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  }
};

import { LicenseService } from "../services/licenseService.js";
import { requireLicense } from "../middlewares/requireLicense.js";
import { FeatureType, SecurityConstants } from "../../constants/security.js";
import { requestContext } from "../utils/requestContext.js";

const router = express.Router();

async function incrementFeatureUsage(req: Request, feature: FeatureType, amount: number = SecurityConstants.DEFAULT_AMOUNT) {
  const licenseKey = getResolvedLicenseKey(req);

  if (!_.isEmpty(licenseKey)) {
    try {
      await LicenseService.incrementUsage(licenseKey, feature, amount);
    } catch (e) {
      appError(SecurityMessages.USAGE_UPDATE_ERROR, e);
    }
  }
}

const requireBatchVisualLicense = async (req: Request, res: Response, next: NextFunction) => {
  const items = _.get(req, REFACTOR_CONSTANTS.USAGE_REQUEST_ITEMS_PATH, []);
  const hasVideoItems = _.some(items, (item) => _.isEqual(item.generateType, GenerateType.Video));
  const hasImageItems = _.some(items, (item) => !_.isEqual(item.generateType, GenerateType.Video));
  const features = _.compact([hasImageItems ? FeatureType.IMAGE : undefined, hasVideoItems ? FeatureType.VIDEO : undefined]);
  const validateFeature = (index: number): void => {
    const feature = _.nth(features, index);
    if (_.isUndefined(feature)) {
      next();
      return;
    }
    requireLicense(feature)(req, res, () => validateFeature(_.add(index, SecurityConstants.DEFAULT_AMOUNT)));
  };
  validateFeature(SecurityConstants.ZERO);
};

const requireSingleVisualLicense = (req: Request, res: Response, next: NextFunction) => {
  const generateType = _.get(req.body, REFACTOR_CONSTANTS.AVG_VISUAL_CONFIG_GENERATE_TYPE_PATH);
  const feature = _.isEqual(generateType, GenerateType.Video) ? FeatureType.VIDEO : FeatureType.IMAGE;
  requireLicense(feature)(req, res, next);
};

interface MusicPlanRequestPayload {
  requestedSongCount: number;
  style: string;
  referenceSongs: string[];
  projectId: string;
  execution: Record<string, any>;
  requestId: string;
  thumbnailReference: string;
  thumbnailReferenceName: string;
  thumbnailDescription: string;
}

let activeMusicPlanRuns = 0;

const parseAndValidateMusicPlanRequest = (req: Request): { isValid: boolean; payload?: MusicPlanRequestPayload; error?: string } => {
  const requestedSongCount = _.toNumber(req.body?.requestedSongCount);
  const style = _.trim(_.toString(req.body?.style));
  const referenceSongs = _.compact(_.map(_.castArray(req.body?.referenceSongs || []), (song) => _.trim(_.toString(song))));
  const projectId = _.toString(req.body?.projectId || `${MUSIC_CREATOR_CONSTANTS.PROJECT_ID_PREFIX}${Date.now()}`);
  const execution = req.body?.aiExecution || {};
  const requestId = _.toString(req.body?.requestId || projectId);
  const thumbnailReference = _.toString(req.body?.thumbnailReference);
  const thumbnailReferenceName = _.toString(req.body?.thumbnailReferenceName || SUNO_AUTOMATION_CONFIG.DEFAULT_REFERENCE_THUMBNAIL_NAME);
  const thumbnailDescription = _.trim(_.toString(req.body?.thumbnailDescription));

  const isValidCount = _.includes(MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS, requestedSongCount as (typeof MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS)[number]);
  if (!isValidCount || _.isEmpty(style)) {
    return { isValid: false, error: MUSIC_CREATOR_TEXTS.vi.SERVER_VALIDATION_ERROR };
  }

  return {
    isValid: true,
    payload: {
      requestedSongCount,
      style,
      referenceSongs,
      projectId,
      execution,
      requestId,
      thumbnailReference,
      thumbnailReferenceName,
      thumbnailDescription,
    },
  };
};

const splitMusicSourceForRoom = (referenceSongs: string[]): string[] => {
  const source = _.join(referenceSongs, SUNO_AUTOMATION_CONFIG.REFERENCE_SOURCE_CHUNK_DIVIDER);
  if (_.isEmpty(source)) return [];
  const chunks: string[] = [];
  for (let offset = 0; offset < source.length; offset += MUSIC_CREATOR_CONSTANTS.SOURCE_CHUNK_CHARACTERS) {
    chunks.push(source.slice(offset, offset + MUSIC_CREATOR_CONSTANTS.SOURCE_CHUNK_CHARACTERS));
  }
  return chunks;
};

const generateMusicThumbnailAsset = async (input: {
  songs: any[];
  style: string;
  description: string;
  reference: string;
  referenceName: string;
  chromeHeadless: boolean;
}): Promise<{ thumbnail: string | null; warning?: string }> => {
  let lastWarning: string = MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await generateImageWithPlaywright({
        prompt: SUNO_AUTOMATION_TEXTS.buildMusicThumbnailPrompt(input.songs, input.style, input.description, !_.isEmpty(input.reference)),
        style: input.style,
        retainBrowserSession: true,
        visualConfig: {
          chromeHeadless: input.chromeHeadless,
          generateType: GenerateType.Image,
          aspectRatio: AspectRatio.SixteenNine,
          generateCount: 1,
          imageGeneratorEngine: ImageGeneratorEngine.Imagen,
          generationMode: ImageGenerationMode.GeminiChat,
          promptInputMethod: PromptInputMethod.Paste,
          referenceImages: _.isEmpty(input.reference) ? [] : [input.reference],
          referenceImageNames: _.isEmpty(input.reference) ? [] : [input.referenceName],
        },
      });
      if (!result.success) {
        lastWarning = result.warning || lastWarning;
        continue;
      }
      const encodedImage = _.toString(result.base64);
      const mimeType = _.startsWith(encodedImage, SUNO_AUTOMATION_CONFIG.JPEG_HEADER_SIGNATURE)
        ? SUNO_AUTOMATION_CONFIG.MIME_IMAGE_JPEG
        : SUNO_AUTOMATION_CONFIG.MIME_IMAGE_PNG;
      const thumbnail = !_.isEmpty(encodedImage)
        ? SUNO_AUTOMATION_TEXTS.formatDataUrl(mimeType, encodedImage)
        : _.toString(result.fallbackUrl) || null;
      if (thumbnail) return { thumbnail };
      lastWarning = MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR;
    } catch (error) {
      logger.error(SUNO_AUTOMATION_TEXTS.LOG_MUSIC_COVER_FAILED, error);
      lastWarning = _.toString(_.get(error, "message", lastWarning));
    }
  }
  return { thumbnail: null, warning: lastWarning };
};

const isRetryableMusicJsonError = (error: unknown): boolean => {
  const message = _.toString(_.get(error, "message", error));
  return _.includes(message, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR) ||
    _.includes(message, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
};

const validateMusicPlanSongContract = (parsed: any, expectedCount: number): boolean => {
  if (!_.isArray(parsed?.songs) || parsed.songs.length !== expectedCount) {
    return false;
  }
  const invalid = _.find(parsed.songs, (song: any) => {
    const hasSongId = !_.isEmpty(_.trim(_.toString(song?.songId)));
    const hasTitle = !_.isEmpty(_.trim(_.toString(song?.title)));
    const lyrics = _.trim(_.toString(song?.lyrics));
    const hasCompleteLyrics = lyrics.length >= 300 && /\[[^\]]+\]/.test(lyrics);
    const hasMusicalDirection = !_.isEmpty(_.trim(_.toString(song?.genre))) && !_.isEmpty(_.trim(_.toString(song?.mood))) &&
      _.isInteger(_.toNumber(song?.tempoBpm)) && _.inRange(_.toNumber(song?.tempoBpm), 40, 241);
    const hasStructure = _.isArray(song?.structure) && song.structure.length >= 3 && _.every(song.structure, (section) => !_.isEmpty(_.trim(_.toString(section))));
    const hasOriginalityNotes = _.isArray(song?.originalityNotes) && !_.isEmpty(song.originalityNotes) && _.every(song.originalityNotes, (note) => !_.isEmpty(_.trim(_.toString(note))));
    return !hasSongId || !hasTitle || !hasCompleteLyrics || !hasMusicalDirection || !hasStructure || !hasOriginalityNotes;
  });
  return !invalid;
};

const validateMusicSongRankingContract = (parsed: any, songs: any[], requestId: string): boolean => {
  const expectedIds = _.map(songs, (song) => _.trim(_.toString(song?.songId)));
  const orderedIds = _.map(_.castArray(parsed?.orderedSongIds || []), (songId) => _.trim(_.toString(songId)));
  return _.isEqual(parsed?.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING) &&
    _.isEqual(parsed?.requestId, requestId) &&
    _.isEqual(orderedIds.length, expectedIds.length) &&
    _.isEqual(_.uniq(orderedIds).length, expectedIds.length) &&
    _.isEqual(_.sortBy(orderedIds), _.sortBy(expectedIds));
};

const validateSunoSettingsContract = (parsed: any, requestId: string): boolean => {
  const settings = parsed?.settings;
  return parsed?.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS && parsed?.requestId === requestId &&
    _.includes([SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_MALE, SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_FEMALE, SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_AUTO], settings?.vocalGender) &&
    settings?.duration === SUNO_AUTOMATION_CONFIG.DURATION_AUTO &&
    _.every([settings?.weirdness, settings?.styleInfluence, settings?.variety], (value) => _.isInteger(value) && _.inRange(value, 0, 101)) &&
    _.isBoolean(settings?.maxMode) && _.isBoolean(settings?.personalize);
};

const validateMusicPlaylistSeoContract = (parsed: any, songs: any[]): boolean => {
  if (!_.isArray(parsed?.seoOptions) || parsed.seoOptions.length !== MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT) return false;
  const normalizedTitles = _.map(parsed.seoOptions, (option: any) => _.toLower(_.trim(_.toString(option?.title))));
  if (_.uniq(normalizedTitles).length !== normalizedTitles.length) return false;
  return _.every(parsed.seoOptions, (option: any) => {
    const title = _.trim(_.toString(option?.title));
    const description = _.trim(_.toString(option?.description));
    const hashtags = _.map(_.castArray(option?.hashtags || []), (value) => _.trim(_.toString(value)));
    const tags = _.map(_.castArray(option?.tags || []), (value) => _.trim(_.toString(value)));
    const letterOnlyTitle = title.replace(SUNO_AUTOMATION_PATTERNS.LETTER_ONLY, "");
    const isAllCaps = letterOnlyTitle.length > 8 && letterOnlyTitle === letterOnlyTitle.toLocaleUpperCase(SUNO_AUTOMATION_CONFIG.LOCALE_VI);
    const titleWords = title.split(SUNO_AUTOMATION_PATTERNS.WHITESPACES).filter((word) => SUNO_AUTOMATION_PATTERNS.UNICODE_LETTER.test(word));
    const titleCaseRatio = _.size(_.filter(titleWords.slice(1), (word) => SUNO_AUTOMATION_PATTERNS.UNICODE_UPPERCASE_LETTER.test(word))) / Math.max(1, titleWords.length - 1);
    return _.inRange(_.size(title), 30, 100) && !isAllCaps && titleCaseRatio < 0.75 &&
      !SUNO_AUTOMATION_PATTERNS.SEO_TITLE_LOUD_PUNCTUATION.test(title) &&
      !SUNO_AUTOMATION_PATTERNS.SEO_TITLE_MISLEADING_CLAIMS.test(title) &&
      _.inRange(_.size(description), 250, 2001) &&
      _.includes(description, SUNO_AUTOMATION_CONFIG.SEO_HEADING_TRACKLIST) &&
      _.every(songs, (song) => _.includes(_.toLower(description), _.toLower(_.trim(_.toString(song?.title))))) &&
      _.isArray(option?.hashtags) && _.inRange(hashtags.length, 5, 13) &&
      _.isEqual(_.uniq(_.map(hashtags, _.toLower)).length, hashtags.length) &&
      _.every(hashtags, (value) => SUNO_AUTOMATION_PATTERNS.HASHTAG_VALIDATION.test(value)) &&
      _.isArray(option?.tags) && _.inRange(tags.length, 12, 26) &&
      _.isEqual(_.uniq(_.map(tags, _.toLower)).length, tags.length) &&
      _.every(tags, (value) => !_.isEmpty(value) && !_.includes(value, ",")) &&
      _.isInteger(_.toNumber(option?.seoScore)) && _.inRange(_.toNumber(option.seoScore), 0, 101);
  });
};

router.post(ROUTER_PATHS.MUSIC_PLAN, async (req: Request, res: Response) => {
  const validation = parseAndValidateMusicPlanRequest(req);
  if (!validation.isValid || !validation.payload) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: validation.error });
  }

  const { requestedSongCount, style, referenceSongs, projectId, execution, requestId, thumbnailReference, thumbnailReferenceName, thumbnailDescription } = validation.payload;
  activeMusicPlanRuns += 1;
  try {
    const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
    const planningRun = beginChatPlanningRun(requestId, Date.now(), SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, provider);
    req.once("aborted", planningRun.cancel);
    res.once("finish", planningRun.complete);
    const generateRoomResponse = (prompt: string, artifactType: string, responseRequestId: string) => generatePlanningWithChatUi({
      provider,
      model: execution.model,
      prompt,
      projectId,
      chromeHeadless: execution.chromeHeadless !== false,
      artifactType,
      requestId: responseRequestId,
      signal: planningRun.signal,
      closeRoomOnComplete: false,
    });
    const sourceChunks = splitMusicSourceForRoom(referenceSongs);
    for (let chunkIndex = 0; chunkIndex < sourceChunks.length; chunkIndex += 1) {
      const sourceRequestId = `${requestId}_source_${chunkIndex + 1}`;
      let sourceAccepted = false;
      for (let attempt = 0; attempt < 2 && !sourceAccepted; attempt += 1) {
        try {
          const sourceResponse = await generateRoomResponse(
            SUNO_AUTOMATION_TEXTS.buildMusicSourcePrompt(sourceChunks[chunkIndex], chunkIndex, sourceChunks.length, sourceRequestId),
            SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SOURCE,
            sourceRequestId,
          );
          const sourceAck = jsonUtils.safeParse(sourceResponse.text, null);
          sourceAccepted = _.isEqual(_.toNumber(sourceAck?.receivedPart), chunkIndex + 1) &&
            _.isEqual(_.toNumber(sourceAck?.totalParts), sourceChunks.length);
        } catch (error) {
          if (!isRetryableMusicJsonError(error) || attempt >= 1) throw error;
        }
      }
      if (!sourceAccepted) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    }

    const songs: any[] = [];
    let responseProvider = provider;
    for (let startIndex = 1; startIndex <= requestedSongCount; startIndex += MUSIC_CREATOR_CONSTANTS.OUTPUT_BATCH_SIZE) {
      const batchCount = Math.min(MUSIC_CREATOR_CONSTANTS.OUTPUT_BATCH_SIZE, requestedSongCount - startIndex + 1);
      let batchParsed: any = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const batchRequestId = `${requestId}_batch_${startIndex}`;
        const prompt = attempt === 0
          ? SUNO_AUTOMATION_TEXTS.buildMusicPlanPrompt(batchCount, startIndex, requestedSongCount, style, batchRequestId, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE)
          : SUNO_AUTOMATION_TEXTS.buildMusicPlanCorrectionPrompt(batchCount, startIndex, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, batchRequestId);
        try {
          const response = await generateRoomResponse(prompt, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, batchRequestId);
          responseProvider = response.provider;
          batchParsed = jsonUtils.safeParse(response.text, null);
        } catch (error) {
          if (!isRetryableMusicJsonError(error) || attempt >= 1) throw error;
          batchParsed = null;
        }
        if (validateMusicPlanSongContract(batchParsed, batchCount)) break;
      }
      if (!validateMusicPlanSongContract(batchParsed, batchCount)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
      songs.push(...batchParsed.songs);
    }
    if (!validateMusicPlanSongContract({ songs }, requestedSongCount)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    const rankingRequestId = `${requestId}_song_ranking`;
    let rankingParsed: any = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const prompt = attempt === 0
        ? SUNO_AUTOMATION_TEXTS.buildMusicRankingPrompt(requestedSongCount, rankingRequestId)
        : SUNO_AUTOMATION_TEXTS.buildMusicRankingCorrectionPrompt(requestedSongCount, rankingRequestId);
      try {
        const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING, rankingRequestId);
        responseProvider = response.provider;
        rankingParsed = jsonUtils.safeParse(response.text, null);
      } catch (error) {
        if (!isRetryableMusicJsonError(error) || attempt >= 1) throw error;
        rankingParsed = null;
      }
      if (validateMusicSongRankingContract(rankingParsed, songs, rankingRequestId)) break;
    }
    if (!validateMusicSongRankingContract(rankingParsed, songs, rankingRequestId)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    const songsById = _.keyBy(songs, (song) => _.trim(_.toString(song?.songId)));
    const rankedSongs = _.map(rankingParsed.orderedSongIds, (songId) => songsById[_.trim(_.toString(songId))]);
    const sunoSettingsRequestId = `${requestId}_suno_settings`;
    let sunoSettingsParsed: any = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const prompt = attempt === 0
        ? SUNO_AUTOMATION_TEXTS.buildSunoSettingsPrompt(style, requestedSongCount, sunoSettingsRequestId)
        : SUNO_AUTOMATION_TEXTS.buildSunoSettingsCorrectionPrompt(sunoSettingsRequestId);
      const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS, sunoSettingsRequestId);
      responseProvider = response.provider;
      sunoSettingsParsed = jsonUtils.safeParse(response.text, null);
      if (validateSunoSettingsContract(sunoSettingsParsed, sunoSettingsRequestId)) break;
    }
    if (!validateSunoSettingsContract(sunoSettingsParsed, sunoSettingsRequestId)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    const seoRequestId = `${requestId}_playlist_seo`;
    const generatePlaylistSeo = async (): Promise<any> => {
      let parsed: any = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const prompt = attempt === 0
          ? SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoPrompt(requestedSongCount, style, seoRequestId, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT)
          : SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt(requestedSongCount, style, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, seoRequestId);
        try {
          const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO, seoRequestId);
          responseProvider = response.provider;
          parsed = jsonUtils.safeParse(response.text, null);
        } catch (error) {
          if (!isRetryableMusicJsonError(error) || attempt >= 1) throw error;
          parsed = null;
        }
        if (validateMusicPlaylistSeoContract(parsed, rankedSongs)) return parsed;
      }
      throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    };
    const [playlistSeoParsed, { thumbnail, warning: thumbnailWarning }] = await Promise.all([
      generatePlaylistSeo(),
      generateMusicThumbnailAsset({
        songs: rankedSongs,
        style,
        description: thumbnailDescription,
        reference: thumbnailReference,
        referenceName: thumbnailReferenceName,
        chromeHeadless: execution.chromeHeadless !== false,
      }),
    ]);
    return res.json({
      success: true,
      data: { songs: rankedSongs, sunoSettings: sunoSettingsParsed.settings, playlistSeoOptions: playlistSeoParsed.seoOptions, thumbnail, thumbnailWarning },
      provider: responseProvider,
    });
  } catch (error) {
    logger.error(MUSIC_CREATOR_TEXTS.vi.ERROR_GENERATION_FAILED, error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MUSIC_CREATOR_TEXTS.vi.ERROR_GENERATION_FAILED,
    });
  } finally {
    await closeChatPlanningRoom({
      provider: execution.provider || AiPlanningFallbackProvider.GeminiChat,
      projectId,
    }).catch(() => undefined);
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) await closeActiveBrowser(true).catch(() => undefined);
  }
});

router.post(ROUTER_PATHS.MUSIC_SEO_REGENERATE, async (req: Request, res: Response) => {
  const songs = _.castArray(req.body?.songs || []);
  const style = _.trim(_.toString(req.body?.style));
  const execution = req.body?.aiExecution || {};
  const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
  const projectId = _.trim(_.toString(req.body?.projectId)) || `${SUNO_AUTOMATION_CONFIG.RUN_ID_PREFIX}seo_${Date.now()}`;
  const requestId = _.trim(_.toString(req.body?.requestId)) || `${projectId}_regenerate`;
  if (_.isEmpty(songs) || _.isEmpty(style)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: MUSIC_CREATOR_TEXTS.vi.SERVER_VALIDATION_ERROR });
  }

  activeMusicPlanRuns += 1;
  const planningRun = beginChatPlanningRun(requestId, Date.now(), `${SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE}-seo`, provider);
  req.once("aborted", planningRun.cancel);
  try {
    let parsed: any = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const prompt = attempt === 0
        ? SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoRegenerationPrompt(songs, style, requestId, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT)
        : SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt(songs.length, style, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, requestId);
      const response = await generatePlanningWithChatUi({
        provider,
        model: execution.model,
        prompt,
        projectId,
        chromeHeadless: execution.chromeHeadless !== false,
        artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO,
        requestId,
        signal: planningRun.signal,
        closeRoomOnComplete: false,
      });
      parsed = jsonUtils.safeParse(response.text, null);
      if (validateMusicPlaylistSeoContract(parsed, songs)) {
        return res.json({ success: true, playlistSeoOptions: parsed.seoOptions });
      }
    }
    throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
  } catch (error) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: _.toString(_.get(error, "message", MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR)) });
  } finally {
    planningRun.complete();
    await closeChatPlanningRoom({ provider, projectId }).catch(() => undefined);
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) await closeActiveBrowser(true).catch(() => undefined);
  }
});

router.post(ROUTER_PATHS.MUSIC_THUMBNAIL, requireLicense(FeatureType.IMAGE), async (req: Request, res: Response) => {
  const songs = _.castArray(req.body?.songs || []);
  const style = _.trim(_.toString(req.body?.style));
  if (_.isEmpty(songs) || _.isEmpty(style)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, warning: MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR });
  }
  activeMusicPlanRuns += 1;
  try {
    const result = await generateMusicThumbnailAsset({
      songs,
      style,
      description: _.trim(_.toString(req.body?.thumbnailDescription)),
      reference: _.toString(req.body?.thumbnailReference),
      referenceName: _.toString(req.body?.thumbnailReferenceName || SUNO_AUTOMATION_CONFIG.DEFAULT_REFERENCE_THUMBNAIL_NAME),
      chromeHeadless: req.body?.chromeHeadless !== false,
    });
    if (_.isEmpty(result.thumbnail)) return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, warning: result.warning });
    await incrementFeatureUsage(req, FeatureType.IMAGE, SecurityConstants.DEFAULT_AMOUNT);
    return res.json({ success: true, thumbnail: result.thumbnail });
  } finally {
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) await closeActiveBrowser(true).catch(() => undefined);
  }
});

const selectProfessionalSunoTracks = async (
  groups: Array<{ title: string; candidates: string[] }>,
  style: string,
  room: {
    projectId: string;
    workerId: string;
    model?: AiPlanningChatModel;
    signal?: AbortSignal;
  },
): Promise<Array<{ songId: string; title: string; qualityScore: number }>> => {
  if (_.isEmpty(groups) || _.some(groups, (group) => _.size(group.candidates) !== 2)) throw createAppError(SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["selectedTrackIds", "qualityScores"],
    properties: {
      selectedTrackIds: {
        type: "array",
        minItems: groups.length,
        maxItems: groups.length,
        items: { type: "string" },
      },
      qualityScores: {
        type: "array",
        minItems: groups.length,
        maxItems: groups.length,
        items: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
  } as const;
  const allCandidateIds = _.flatMap(groups, "candidates");
  const downloadOrigin = _.trim(process.env.DOWNLOADER_STREAM_ORIGIN || SUNO_AUTOMATION_CONFIG.SUNO_DOWNLOAD_ORIGIN).replace(SUNO_AUTOMATION_PATTERNS.TRAILING_SLASH, "");
  const audioBuffers: Buffer[] = [];
  for (const idChunk of _.chunk(allCandidateIds, SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_CONCURRENCY)) {
    const chunkBuffers = await Promise.all(_.map(idChunk, async (songId) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS; attempt += 1) {
        try {
          const response = await fetch(`${downloadOrigin}/api/file/${encodeURIComponent(songId)}/${SUNO_AUTOMATION_CONFIG.FORMAT_MP3}`, { signal: AbortSignal.timeout(SUNO_AUTOMATION_CONFIG.AUDIO_DOWNLOAD_TIMEOUT_MS) });
          if (!response.ok) throw new Error(SUNO_AUTOMATION_TEXTS.formatDownloadHttpError(response.status));
          return Buffer.from(await response.arrayBuffer());
        } catch (error) {
          lastError = error;
          if (attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS - 1) {
            await delayAsync(SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_RETRY_DELAY_MS * (attempt + 1));
          }
        }
      }
      logger.error(`${SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR} trackId=${songId}`, lastError);
      throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR);
    }));
    audioBuffers.push(...chunkBuffers);
  }
  const attachmentDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), SUNO_AUTOMATION_CONFIG.TEMP_ATTACHMENT_DIR_PREFIX));
  const attachments = await Promise.all(_.map(allCandidateIds, async (songId, index) => {
    const filePath = path.join(attachmentDirectory, `${index + 1}-${songId}.${SUNO_AUTOMATION_CONFIG.FORMAT_MP3}`);
    await fs.promises.writeFile(filePath, audioBuffers[index]);
    return { name: path.basename(filePath), mimeType: SUNO_AUTOMATION_CONFIG.MIME_MP3, path: filePath };
  }));
  try {
    const prompt = SUNO_AUTOMATION_TEXTS.buildTrackBatchEvaluationPrompt(style, groups, JSON.stringify(schema));
    let retryPrompt = prompt;
    let lastError: unknown;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MAX_EVALUATION_ATTEMPTS; attempt++) {
      try {
        const response = await generatePlanningWithChatUi({
          provider: AiPlanningFallbackProvider.GeminiChat,
          model: room.model,
          prompt: retryPrompt,
          projectId: room.projectId,
          workerId: room.workerId,
          chromeHeadless: false,
          signal: room.signal,
          attachments,
          artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_MUSIC_EVALUATION,
          requestId: `${room.projectId}-chunk-${_.kebabCase(groups[0].title)}-${attempt + 1}`,
          closeRoomOnComplete: false,
        });
        const evaluation = parseAiJsonArtifact<{ selectedTrackIds: string[]; qualityScores: number[] }>(response.text, schema, SUNO_AUTOMATION_TEXTS.INVALID_TRACK_SELECTION_ARTIFACT);
        if (_.size(evaluation.selectedTrackIds) !== groups.length || _.size(evaluation.qualityScores) !== groups.length) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
        return _.map(groups, (group, index) => {
          const selectedTrackId = _.trim(_.toString(evaluation.selectedTrackIds[index]));
          const qualityScore = _.toNumber(evaluation.qualityScores[index]);
          if (!_.includes(group.candidates, selectedTrackId)) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
          if (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
          return { songId: selectedTrackId, title: group.title, qualityScore };
        });
      } catch (error) {
        lastError = error;
        retryPrompt = SUNO_AUTOMATION_TEXTS.buildTrackBatchEvaluationRetryPrompt(groups, JSON.stringify(schema));
        await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_RETRY, {
          projectId: room.projectId,
          workerId: room.workerId,
          attempt: attempt + 1,
          error: _.toString(_.get(error, "message", error)),
        });
      }
    }
    throw lastError;
  } finally {
    await fs.promises.rm(attachmentDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
};

const SUNO_CURATED_LOG_PATH = path.join(
  process.env.LOCALAPPDATA || os.tmpdir(),
  SUNO_AUTOMATION_CONFIG.APP_SUBDIR,
  SUNO_AUTOMATION_CONFIG.LOG_SUBDIR,
  SUNO_AUTOMATION_CONFIG.LOG_FILENAME_CURATED,
);
const writeSunoCuratedLog = async (event: string, details: Record<string, unknown> = {}): Promise<void> => {
  try {
    await fs.promises.mkdir(path.dirname(SUNO_CURATED_LOG_PATH), { recursive: true });
    await fs.promises.appendFile(
      SUNO_CURATED_LOG_PATH,
      `${JSON.stringify({ timestamp: new Date().toISOString(), event, ...details })}\n`,
      SUNO_AUTOMATION_CONFIG.ENCODING_UTF8,
    );
  } catch {}
};

router.post(ROUTER_PATHS.MUSIC_SUNO_CREATE, async (req: Request, res: Response) => {
  const songs = _.map(_.castArray(req.body?.songs || []), (song) => ({
    songId: _.trim(_.toString(song?.songId)),
    title: _.trim(_.toString(song?.title)),
    lyrics: _.trim(_.toString(song?.lyrics)),
  }));
  const style = _.trim(_.toString(req.body?.style));
  const inspo = _.trim(_.toString(req.body?.inspo));
  const initialSongIds = _.castArray(req.body?.initialSongIds || []);
  if ((_.isEmpty(songs) && _.isEmpty(initialSongIds)) || _.isEmpty(style) || _.some(songs, (song) => _.isEmpty(song.songId) || _.isEmpty(song.title) || _.isEmpty(song.lyrics))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: SUNO_AUTOMATION_TEXTS.VALIDATION_PLAYLIST_INPUT_ERR });
  }
  try {
    const result = await createSunoPlaylist(songs, style, inspo, req.body?.sunoSettings, initialSongIds, _.trim(_.toString(req.body?.playlistName)));
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error(SUNO_AUTOMATION_TEXTS.LOG_SUNO_AUTOMATION_FAILED, error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: _.toString(_.get(error, "message", SUNO_AUTOMATION_TEXTS.FAILED_COMPLETE_SUNO_ERR)) });
  }
});

router.post(ROUTER_PATHS.MUSIC_SUNO_CANCEL, async (_req: Request, res: Response) => {
  await cancelActiveSunoCreation();
  return res.json({ success: true });
});

router.post(ROUTER_PATHS.MUSIC_SUNO_DOWNLOAD, async (req: Request, res: Response) => {
  const shouldEvaluateTracks = req.body?.evaluateTracks !== false;
  const evaluationProjectId = _.trim(_.toString(req.body?.aiExecution?.projectId));
  const evaluationProvider = req.body?.aiExecution?.provider;
  const evaluationMode = req.body?.aiExecution?.mode;
  const evaluationRunId = evaluationProjectId || `${SUNO_AUTOMATION_CONFIG.EVALUATION_RUN_ID_PREFIX}${Date.now()}`;
  let planningRun: ReturnType<typeof beginChatPlanningRun> | undefined;
  try {
    await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_STARTED, {
      evaluationRunId,
      evaluateTracks: shouldEvaluateTracks,
      format: _.toLower(_.trim(_.toString(req.body?.format))),
      suppliedTrackCount: _.size(_.castArray(req.body?.tracks || [])),
    });
    let tracks = _.map(_.castArray(req.body?.tracks || []), (track) => ({
      songId: _.trim(_.toString(track?.songId)),
      title: _.trim(_.toString(track?.title)),
    }));
    if (_.isEmpty(tracks)) {
      const recoveredSongIds = await getSunoPlaylistSongIds(_.toString(req.body?.playlistUrl));
      const songTitles = _.map(_.castArray(req.body?.songTitles || []), (title) => _.trim(_.toString(title)));
      tracks = _.map(recoveredSongIds, (songId, index) => {
        const songIndex = Math.floor(index / 2);
        const songNumber = songIndex + 1;
        const title = songTitles[songIndex] || `Track ${songNumber}`;
        return { songId, title: SUNO_AUTOMATION_TEXTS.formatSongVariantTitle(songNumber, title, (index % 2) + 1) };
      });
    }
    if (shouldEvaluateTracks) {
      if (
        !_.isEqual(evaluationMode, AiPlanningExecutionMode.RoomOnly) ||
        !_.isEqual(evaluationProvider, AiPlanningFallbackProvider.GeminiChat) ||
        _.isEmpty(evaluationProjectId)
      ) {
        throw createAppError(SUNO_AUTOMATION_TEXTS.TRACK_EVALUATION_ROOM_REQUIRED_ERR);
      }
      planningRun = beginChatPlanningRun(
        evaluationRunId,
        Date.now(),
        SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID,
        AiPlanningFallbackProvider.GeminiChat,
      );
      req.once("aborted", planningRun.cancel);
      const trackPairs = _.chunk(tracks, 2);
      if (_.some(trackPairs, (pair) => _.size(pair) < 2)) throw createAppError(SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR);
      const format = _.toLower(_.trim(_.toString(req.body?.format))) as typeof SUNO_AUTOMATION_CONFIG.FORMAT_MP3 | typeof SUNO_AUTOMATION_CONFIG.FORMAT_WAV;
      const pairChunks = _.chunk(trackPairs, SUNO_AUTOMATION_CONFIG.EVALUATION_SONGS_PER_CHUNK);
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_TRACKS_READY, {
        evaluationRunId,
        trackCount: tracks.length,
        songCount: trackPairs.length,
        chunkCount: pairChunks.length,
      });
      const selectedTrackChunks = await Promise.all(_.map(pairChunks, async (pairChunk, chunkIndex) => {
        const groups = _.map(pairChunk, (pair) => ({
          title: _.trim(pair[0].title.replace(SUNO_AUTOMATION_PATTERNS.TRACK_VARIANT_SUFFIX, "")),
          candidates: _.map(pair, "songId"),
        }));
        const chunkWorkerId = `${SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID}-chunk-${chunkIndex + 1}`;
        try {
          await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_STARTED, {
            evaluationRunId,
            chunk: chunkIndex + 1,
            songs: groups.length,
            candidateTracks: _.sumBy(groups, (group) => group.candidates.length),
          });
          const selectedTracks = await selectProfessionalSunoTracks(groups, _.trim(_.toString(req.body?.style)), {
            projectId: evaluationProjectId,
            workerId: chunkWorkerId,
            model: req.body?.aiExecution?.model,
            signal: planningRun.signal,
          });
          await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_COMPLETED, {
            evaluationRunId,
            chunk: chunkIndex + 1,
            selectedTrackCount: selectedTracks.length,
            selectedTrackIds: _.map(selectedTracks, "songId"),
            qualityScores: _.map(selectedTracks, "qualityScore"),
          });
          return selectedTracks;
        } finally {
          await closeChatPlanningRoom({
            provider: AiPlanningFallbackProvider.GeminiChat,
            projectId: evaluationProjectId,
            workerId: chunkWorkerId,
          }).catch(() => undefined);
        }
      }));
      const evaluatedTracks = _.flatten(selectedTrackChunks);
      const selectedTracksForDownload = _.map(
        _.orderBy(evaluatedTracks, [(track) => track.qualityScore], ["desc"]),
        (track, rank) => ({
          songId: track.songId,
          title: `${_.padStart(_.toString(rank + 1), 2, "0")}. ${_.trim(track.title).replace(SUNO_AUTOMATION_PATTERNS.LEADING_INDEX, "")}`,
          qualityScore: track.qualityScore,
        }),
      );
      if (!_.isEqual(selectedTracksForDownload.length, trackPairs.length)) {
        throw createAppError(SUNO_AUTOMATION_TEXTS.CURATED_EVALUATION_COUNT_MISMATCH_ERR);
      }
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_ALL_EVALS_COMPLETED, {
        evaluationRunId,
        expectedSelectionCount: trackPairs.length,
        selectedTrackCount: selectedTracksForDownload.length,
        selectedTrackIds: _.map(selectedTracksForDownload, "songId"),
        qualityScores: _.map(selectedTracksForDownload, "qualityScore"),
      });
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_DOWNLOAD_STARTED, {
        evaluationRunId,
        trackCount: selectedTracksForDownload.length,
        format,
      });
      const downloadedPaths = await downloadSunoTracksToFolder(selectedTracksForDownload, _.toString(req.body?.folderPath), format);
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_COMPLETED, {
        evaluationRunId,
        expectedDownloadCount: trackPairs.length,
        downloadedCount: downloadedPaths.length,
        success: _.isEqual(downloadedPaths.length, trackPairs.length),
      });
      if (!_.isEqual(downloadedPaths.length, trackPairs.length)) throw createAppError(SUNO_AUTOMATION_TEXTS.CURATED_DOWNLOAD_COUNT_MISMATCH_ERR);
      return res.json({ success: true, downloadedPaths });
    }
    const format = _.toLower(_.trim(_.toString(req.body?.format))) as typeof SUNO_AUTOMATION_CONFIG.FORMAT_MP3 | typeof SUNO_AUTOMATION_CONFIG.FORMAT_WAV;
    const downloadedPaths = await downloadSunoTracksToFolder(tracks, _.toString(req.body?.folderPath), format);
    return res.json({ success: true, downloadedPaths });
  } catch (error) {
    await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_FAILED, {
      evaluationRunId,
      error: _.toString(_.get(error, "message", error)),
    });
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: _.toString(_.get(error, "message", SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR)) });
  } finally {
    planningRun?.complete();
    if (shouldEvaluateTracks && !_.isEmpty(evaluationProjectId)) {
      await closeChatPlanningRoom({
        provider: AiPlanningFallbackProvider.GeminiChat,
        projectId: evaluationProjectId,
        workerId: SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID,
      }).catch(() => undefined);
      await closeActiveBrowser(true).catch(() => undefined);
    }
  }
});

router.post(ROUTER_PATHS.MUSIC_SUNO_LOGIN, async (_req: Request, res: Response) => {
  try { return res.json({ success: true, ...(await launchSunoLoginBrowser()) }); }
  catch (error) { return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: _.toString(_.get(error, "message", SUNO_AUTOMATION_TEXTS.CHROME_LOGIN_FAILED_ERR)) }); }
});

router.post(ROUTER_PATHS.EXTRACT_STYLE, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  try {
    const { visualConfig, style } = req.body;

    const requestedStyle = style || visualConfig?.style || req.body?.stylePreset || req.body?.targetStyle;
    const preset = resolveStylePreset(requestedStyle);
    const styleMedium =
      preset.category === "3d_cinematic" ? "cinematic stylized 3D rendering" : preset.category === "cartoon_2d" ? "stylized 2D illustration" : "custom visual rendering";

    const styleProfile = {
      medium: styleMedium,
      characterType: STYLE_IDENTITY_BOUNDARY,
      characterDna: STYLE_IDENTITY_BOUNDARY,
      lineDna: "clean uniform line art",
      shapeLanguage: "minimal stylized geometric shapes",
      colorDna: "preset coordinated palette",
      colorPhilosophy: "clean visual clarity",
      renderingDna: "clean stylized rendering",
      lightingStyle: "even stylized illumination",
      texture: "digital clean",
      detailLevel: "optimized",
      visualComplexity: "high clarity",
      periodCues: "",
      worldRendering: preset.defaultBackgroundMode === "white" ? "pure solid white background" : "contextual minimal environment",
      compositionLanguage: "centered composition with negative space",
      facialExpressionLanguage: "clear expressive facial features",
      overallMood: "engaging and stylized",
      adaptiveElements: "Script controls character and action",
      negativeStylePrompt: preset.negativePrompt,
      sampleSpecificContent: [],
      lockedStyleElements: ["medium", "renderingDna"],
      flexibleElements: ["character pose", "action", "composition"],
    };

    const result = {
      style: preset.positivePrompt,
      styleProfile,
      profileVersion: STYLE_EXTRACTION_CONFIG.PROFILE_VERSION,
      negativeStylePrompt: preset.negativePrompt,
      fingerprint: createHash("sha256").update(`${preset.id}:${Date.now()}`).digest("hex"),
    };

    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.STYLE_EXTRACTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STYLE_EXTRACTION_ERR", isVi) });
  }
});

router.post(ROUTER_PATHS.REWRITE_PROMPTS, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const { storyboard, newStyle, aspectRatio, visualConfig } = req.body;
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi), retryable: true });
  }

  try {
    const scenesToRewrite = _.filter(
      _.map(storyboard, (s: any) => ({
        id: s.id,
        prompt: s.prompt || s.script || "",
      })),
      (s: any) => s.prompt,
    );

    if (_.isEmpty(scenesToRewrite)) {
      return res.json({ success: true, storyboard });
    }

    const chunkSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_REWRITE;
    const chunks = _.chunk(scenesToRewrite, chunkSize);

    const rewrittenMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunkItem = chunks[i];
      const backgroundDirective = visualConfig?.styleBackgroundMode ? (BACKGROUND_MODE_CONFIG.DIRECTIVES as any)[visualConfig.styleBackgroundMode] : undefined;
      const textDirective = visualConfig?.styleTextInImageMode ? (TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES as any)[visualConfig.styleTextInImageMode] : undefined;
      const focusDirective = visualConfig?.imageFocusMode ? resolveImageFocusDirective(visualConfig.imageFocusMode, visualConfig.styleBackgroundMode) : undefined;
      const prompt = getStyleRewriteBatchPrompt(
        newStyle,
        jsonUtils.safeStringify(chunkItem),
        aspectRatio || AspectRatio.SixteenNine,
        isVi,
        backgroundDirective,
        textDirective,
        focusDirective,
      );

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        const expectedIds = _.map(chunkItem, "id");
        const returnedIds = _.map(_.castArray(parsed), "id");
        if (
          !_.isArray(parsed) ||
          !_.isEqual(_.size(parsed), _.size(chunkItem)) ||
          !_.isEmpty(_.difference(expectedIds, returnedIds)) ||
          !_.isEmpty(_.difference(returnedIds, expectedIds))
        ) {
          throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        }
        for (const item of parsed) {
          if (!item.id || _.isEmpty(_.trim(_.toString(item.prompt)))) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
          rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_STYLE_REWRITE_FAILED_CHUNK, err);
        throw err;
      }

      if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      if (_.isEmpty(_.trim(_.toString(scene.prompt)))) return scene;
      const rewritten = rewrittenMap.get(scene.id);
      if (!rewritten) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
      return { ...scene, prompt: rewritten };
    });

    res.json({ success: true, storyboard: updatedStoryboard });
  } catch (error: any) {
    logger.error(LogEvent.REWRITE_PROMPTS_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.OPTIMIZE_PROMPTS, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const { storyboard, visualConfig, visualBible, aspectRatio } = req.body;
  let planningFailureIssues: string[] = [];
  let planningPartialStoryboard: StoryboardScene[] = [];
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }
  const cachedPrompts = checkCache(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, req.body, Boolean(req.body?.bypassCache));
  if (cachedPrompts) return res.json(cachedPrompts);

  try {
    const sourceScenes = _.filter(storyboard as StoryboardScene[], (scene) => !_.isEmpty(scene.script || scene.subtitle));
    const requestedMasterScenes = _.filter(_.castArray(req.body?.planningMasterStoryboard) as StoryboardScene[], (scene) => !_.isEmpty(scene?.script || scene?.subtitle));
    const planningMasterScenes = _.isEmpty(requestedMasterScenes) ? sourceScenes : requestedMasterScenes;

    if (_.isEmpty(sourceScenes)) throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_INPUT_INVALID);

    const resolvedVisualConfig = visualConfig as VisualConfig;
    const resolvedVisualBible = visualBible as VisualBible;
    const characters = _.defaultTo(resolvedVisualConfig.characters, []);
    const visualStyle = resolvedVisualConfig.style;
    const isCinematicPlanning = isCinematicEpisodeGenre(_.toString(req.body?.genre || req.body?.config?.genre));
    const promptCharacters = isCinematicPlanning ? _.map(characters, (character) => _.omit(character, ["images", "extracted"])) : createPromptCharacterCards(characters);
    const requestedPlanningProvider = _.toString(req.body?.planningFallbackProvider);
    const planningFallbackProvider = _.includes(Object.values(AiPlanningFallbackProvider), requestedPlanningProvider as AiPlanningFallbackProvider)
      ? (requestedPlanningProvider as AiPlanningFallbackProvider)
      : AiPlanningFallbackProvider.GeminiChat;
    const requestedPlanningModel = _.toString(req.body?.planningChatModel);
    const planningChatModel = _.includes(Object.values(AiPlanningChatModel), requestedPlanningModel as AiPlanningChatModel)
      ? (requestedPlanningModel as AiPlanningChatModel)
      : undefined;
    const requestedExecutionMode = _.toString(req.body?.planningExecutionMode);
    const planningExecutionMode = _.includes(Object.values(AiPlanningExecutionMode), requestedExecutionMode as AiPlanningExecutionMode)
      ? (requestedExecutionMode as AiPlanningExecutionMode)
      : _.isEqual(planningFallbackProvider, AiPlanningFallbackProvider.Disabled)
        ? AiPlanningExecutionMode.ApiOnly
        : AiPlanningExecutionMode.RoomOnly;
    const usesChatPlanning = !_.isEqual(planningExecutionMode, AiPlanningExecutionMode.ApiOnly);
    const keepPlanningRoomOpen = req.body?.keepPlanningRoomOpen !== false;
    const planningWorkerId = _.toString(req.body?.planningWorkerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID);
    const planningRun = beginChatPlanningRun(
      _.toString(req.body?.pipelineRunId),
      _.toFinite(req.body?.pipelineStartedAt),
      planningWorkerId,
      usesChatPlanning ? planningFallbackProvider : AiPlanningFallbackProvider.Disabled,
    );
    let planningRoomClosePromise: Promise<void> | undefined;
    const closePlanningRoom = (): Promise<void> => {
      if (!usesChatPlanning || keepPlanningRoomOpen) return Promise.resolve();
      planningRoomClosePromise ||= closeChatPlanningRoom({
        provider: planningFallbackProvider,
        projectId: _.toString(req.body?.projectId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_PROJECT_SCOPE),
        workerId: planningWorkerId,
      });
      return planningRoomClosePromise;
    };
    req.once("aborted", planningRun.cancel);
    res.once("finish", () => {
      planningRun.complete();
      void closePlanningRoom();
    });
    res.once("close", () => {
      if (!res.writableEnded) planningRun.cancel();
    });
    const planningChromeHeadless = _.isBoolean(req.body?.planningChromeHeadless) ? req.body.planningChromeHeadless : req.body?.chromeHeadless;
    const clipDurationSeconds = resolveCinematicClipDuration(resolvedVisualConfig.videoDuration);
    const chunkSize = isCinematicPlanning ? CINEMATIC_PRODUCTION_POLICY.PLANNING_CHUNK_SIZE : PIPELINE_CONFIG.BATCH_CHUNK_SIZE_OPTIMIZE;
    const backgroundDirective = resolvedVisualConfig.styleBackgroundMode ? _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, resolvedVisualConfig.styleBackgroundMode) : undefined;
    const textDirective = resolvedVisualConfig.styleTextInImageMode ? _.get(TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES, resolvedVisualConfig.styleTextInImageMode) : undefined;
    const focusDirective = resolvedVisualConfig.imageFocusMode
      ? resolveImageFocusDirective(resolvedVisualConfig.imageFocusMode, resolvedVisualConfig.styleBackgroundMode)
      : undefined;
    const hasStyleRef = hasValidImages(resolvedVisualConfig.styleReferenceImages);
    const hasSceneRef = hasValidImages(resolvedVisualConfig.sceneReferenceImages) || hasValidImages(resolvedVisualConfig.referenceImages);
    const referenceContext = hasStyleRef
      ? "A style-only reference image will be attached at generation time."
      : hasSceneRef
        ? "One or more scene-context reference images will be attached at generation time."
        : "No reference image will be attached.";
    const targetStyle = hasStyleRef
      ? "Strict visual match: accurately follow the exact art style, character design, medium, and aesthetic of the uploaded reference image."
      : hasSceneRef
        ? `Strict character match: accurately preserve character identity from the reference image in the "${visualStyle}" style.`
        : resolvedVisualBible.visualStyle || visualStyle || "Dynamically craft the visual art style and medium to match the story's emotional tone and genre.";
    let plannedScenes: StoryboardScene[] = _.cloneDeep(sourceScenes);
    const planningPayload = createVisualPlanningPayload(plannedScenes);
    const chunks = isCinematicPlanning ? createCinematicPlanningBatches(planningPayload) : _.chunk(planningPayload, chunkSize);
    const videoPromptsRequestId = createCinematicArtifactRequestId(req.body?.pipelineRunId, CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS);
    const optimizedMap = new Map<string, StoryboardScene>();
    const planningWarnings: string[] = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkItem = chunks[chunkIndex];
      const chunkStartIndex = _.sumBy(_.take(chunks, chunkIndex), (chunk) => chunk.length);
      const sceneIds = _.map(chunkItem, (item) => _.toString(_.get(item, "id")));
      const chunkSourceScenes = _.filter(plannedScenes, (scene) => _.includes(sceneIds, scene.id));
      const chunkCharacterIds = new Set(_.flatMap(chunkSourceScenes, (scene) => scene.characterIds || []));
      const relevantChunkCharacters = _.filter(promptCharacters, (character) => chunkCharacterIds.has(_.toString(character.id)));
      const chunkCharacters = isCinematicPlanning
        ? _.map(_.isEmpty(relevantChunkCharacters) ? promptCharacters : relevantChunkCharacters, (character) => _.pick(character, ["id", "name", "prompt"]))
        : relevantChunkCharacters;
      const chunkCharactersJson = jsonUtils.safeStringify(chunkCharacters);
      const chunkVisualBibleJson = jsonUtils.safeStringify(createScopedVisualBibleContext(resolvedVisualBible, chunkSourceScenes));
      const masterStartIndex = _.findIndex(planningMasterScenes, { id: _.toString(_.get(_.first(chunkItem), "id")) });
      const continuitySource = _.gte(masterStartIndex, 0) ? planningMasterScenes : plannedScenes;
      const continuityStartIndex = _.gte(masterStartIndex, 0) ? masterStartIndex : chunkStartIndex;
      const continuityContext = createBatchContinuityContext(continuitySource, continuityStartIndex, chunkItem.length);
      if (_.lt(masterStartIndex, 0) && _.isEqual(chunkIndex, 0) && req.body?.planningPreviousScene) continuityContext.previousScene = req.body.planningPreviousScene;
      const continuityContextJson = jsonUtils.safeStringify(continuityContext);
      const quickGenerateType = resolvedVisualConfig.generateType || GenerateType.Image;
      const quickVideoPromptRequired = _.includes([GenerateType.Video, GenerateType.Mixed], quickGenerateType);
      const createPlanningPrompt = (correctionIssuesJson: string = "") => {
        const scopedCharactersJson = chunkCharactersJson;
        const scopedVisualBibleJson = chunkVisualBibleJson;
        if (isCinematicPlanning) {
          return getCinematicVideoPlanningPrompt(
            jsonUtils.safeStringify(chunkItem),
            scopedCharactersJson,
            scopedVisualBibleJson,
            continuityContextJson,
            correctionIssuesJson,
            clipDurationSeconds,
            CINEMATIC_DIALOGUE_DIRECTIVES.FOLLOW_SOURCE,
            isVi ? "Vietnamese" : "English",
            videoPromptsRequestId,
          );
        }
        return getQuickVideoPlanningPrompt(
          visualStyle,
          targetStyle,
          jsonUtils.safeStringify(chunkItem),
          aspectRatio || AspectRatio.SixteenNine,
          scopedCharactersJson,
          isVi,
          backgroundDirective,
          textDirective,
          focusDirective,
          resolvedVisualConfig.styleBackgroundMode || "auto",
          resolvedVisualConfig.styleTextInImageMode || "auto",
          resolvedVisualConfig.imageFocusMode || "default",
          referenceContext,
          scopedVisualBibleJson,
          continuityContextJson,
          jsonUtils.safeStringify(resolvedVisualBible.locations || []),
          jsonUtils.safeStringify(resolvedVisualBible.props || []),
          correctionIssuesJson,
          _.toString(req.body?.genre || req.body?.config?.genre),
          quickGenerateType,
        );
      };
      const createRepairPrompt = (items: any[], issues: string[], repairSceneIds: string[] = sceneIds) => {
        if (!isCinematicPlanning) return createPlanningPrompt(jsonUtils.safeStringify(issues));
        const repairSourceScenes = _.filter(chunkItem, (item) => _.includes(repairSceneIds, _.toString(_.get(item, "id"))));
        const previousRepairItems = _.filter(items, (item) => _.includes(repairSceneIds, _.toString(_.get(item, "id"))));
        return getCinematicVideoPlanningRepairPrompt(
          jsonUtils.safeStringify(repairSourceScenes),
          jsonUtils.safeStringify(previousRepairItems),
          jsonUtils.safeStringify(issues),
          continuityContextJson,
          clipDurationSeconds,
          CINEMATIC_DIALOGUE_DIRECTIVES.FOLLOW_SOURCE,
          isVi ? "Vietnamese" : "English",
          videoPromptsRequestId,
        );
      };
      const planningString = { type: "string" } as const;
      const createCinematicPlanningProperties = (expectedSceneIds: string[]) =>
        ({
          id: { type: "string", enum: expectedSceneIds },
          generationPrompt: planningString,
        }) as const;
      const createPlanningItemsSchema = (expectedSceneIds: string[] = sceneIds) =>
        ({
          type: "array",
          minItems: expectedSceneIds.length,
          maxItems: expectedSceneIds.length,
          items: {
            type: "object",
            additionalProperties: false,
            required: isCinematicPlanning
              ? [...CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS]
              : [...QUICK_VISUAL_PLANNING_REQUIRED_FIELDS, ...(quickVideoPromptRequired ? ["generationPrompt"] : [])],
            properties: isCinematicPlanning
              ? createCinematicPlanningProperties(expectedSceneIds)
              : {
                  id: { type: "string", enum: expectedSceneIds },
                  prompt: planningString,
                  generationPrompt: planningString,
                  visualIntent: planningString,
                  visibleAction: planningString,
                  reaction: planningString,
                  storyEvidence: planningString,
                  visualHook: planningString,
                  shotPurpose: { type: "string", enum: [...QUICK_VISUAL_SHOT_PURPOSES] },
                  shotSize: planningString,
                  cameraAngle: planningString,
                  composition: planningString,
                  continuityNotes: planningString,
                  lighting: planningString,
                  characterIds: { type: "array", items: planningString },
                  locationId: planningString,
                  propIds: { type: "array", items: planningString },
                  expectedSubjectCount: { type: "integer", minimum: 0 },
                  allowBackgroundPeople: { type: "boolean" },
                  layout: { type: "string", enum: [...QUICK_VISUAL_LAYOUTS] },
                  textAllowed: { type: "boolean" },
                  textOverlay: planningString,
                  assetStrategy: { type: "string", enum: ["ai_generated"] },
                  archivalSearchQuery: planningString,
                  archivalRationale: planningString,
                },
          },
        }) as const;
      const createPlanningSchema = (expectedSceneIds: string[] = sceneIds) =>
        isCinematicPlanning
          ? ({
              type: "object",
              additionalProperties: false,
              required: ["artifactType", "requestId", "scenes", "completionMarker"],
              properties: {
                artifactType: { type: "string", enum: [CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS] },
                requestId: { type: "string", enum: [videoPromptsRequestId] },
                scenes: createPlanningItemsSchema(expectedSceneIds),
                completionMarker: { type: "string", enum: [CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER] },
              },
            } as const)
          : createPlanningItemsSchema(expectedSceneIds);
      const requestChatUiPlan = async (contents: string, expectedSceneIds: string[] = sceneIds): Promise<any[]> => {
        let lastError: unknown;
        for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_RESPONSE_ATTEMPTS; attempt++) {
          if (planningRun.signal.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
          try {
            const response = await generatePlanningWithChatUi({
              provider: planningFallbackProvider,
              model: planningChatModel,
              prompt: contents,
              projectId: _.toString(req.body?.projectId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_PROJECT_SCOPE),
              workerId: planningWorkerId,
              chromeHeadless: planningChromeHeadless,
              expectedSceneIds,
              completionMarker: isCinematicPlanning ? CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER : undefined,
              artifactType: isCinematicPlanning ? CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS : undefined,
              requestId: isCinematicPlanning ? videoPromptsRequestId : undefined,
              signal: planningRun.signal,
              closeRoomOnComplete: false,
            });
            const parsed = safeParseJSON(response.text, null);
            const parsedScenes = isCinematicPlanning ? (_.isArray(parsed) ? parsed : _.get(parsed, "scenes")) : parsed;
            const returnedArtifactType = _.trim(_.toString(_.get(parsed, "artifactType")));
            const returnedRequestId = normalizeCinematicArtifactIdentity(_.get(parsed, "requestId"));
            const normalizedVideoPromptsRequestId = normalizeCinematicArtifactIdentity(videoPromptsRequestId);
            const returnedCompletionMarker = _.trim(_.toString(_.get(parsed, "completionMarker")));
            const artifactMatches =
              !isCinematicPlanning ||
              (_.isEqual(returnedArtifactType, CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS) &&
                _.isEqual(returnedRequestId, normalizedVideoPromptsRequestId) &&
                _.isEqual(returnedCompletionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER));
            if (artifactMatches && _.isArray(parsedScenes)) return parsedScenes;
            lastError = new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
          } catch (error) {
            if (planningRun.signal.aborted) throw error;
            lastError = error;
          }
        }
        throw lastError instanceof Error ? lastError : new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
      };
      const requestApiPlan = async (contents: string, expectedSceneIds: string[] = sceneIds): Promise<any[]> => {
        const response = await generateContentWithRetry({
          contents,
          config: {
            responseMimeType: CONTENT_TYPES.JSON,
            responseJsonSchema: createPlanningSchema(expectedSceneIds),
          },
          task: { capability: AiTaskCapability.VisualPlanning },
        });
        const parsed = safeParseJSON(response.text, []);
        const parsedScenes = isCinematicPlanning ? _.get(parsed, "scenes") : parsed;
        return _.isArray(parsedScenes) ? parsedScenes : [];
      };
      const requestVisualPlan = async (apiContents: string, chatUiContents: string, preferChatUi = false, expectedSceneIds: string[] = sceneIds): Promise<any[]> => {
        if (_.isEqual(planningExecutionMode, AiPlanningExecutionMode.ApiOnly)) return requestApiPlan(apiContents, expectedSceneIds);
        if (_.isEqual(planningExecutionMode, AiPlanningExecutionMode.RoomOnly)) return requestChatUiPlan(chatUiContents, expectedSceneIds);
        if (preferChatUi) {
          try {
            return await requestChatUiPlan(chatUiContents, expectedSceneIds);
          } catch {
            appWarn(PIPELINE_CONTROLLER_MESSAGES.AI_FALLBACK_CHAT_FAILED);
            return requestApiPlan(apiContents, expectedSceneIds);
          }
        }
        try {
          return await requestApiPlan(apiContents, expectedSceneIds);
        } catch (apiError) {
          appWarn(PIPELINE_CONTROLLER_MESSAGES.API_PLANNING_UNAVAILABLE);
          return requestChatUiPlan(chatUiContents, expectedSceneIds);
        }
      };
      const collectPlanningIssues = (items: any[]): string[] => {
        const issues: string[] = [];
        const returnedIds = _.map(items, (item) => _.toString(_.get(item, "id")));
        const duplicateIds = _.map(
          _.filter(_.groupBy(returnedIds), (group) => _.gt(group.length, 1)),
          (group) => group[0],
        );
        _.forEach(duplicateIds, (id) => issues.push(`${id || "unknown"}:id:duplicate`));
        _.forEach(_.difference(returnedIds, sceneIds), (id) => issues.push(`${id || "unknown"}:id:unexpected`));
        _.forEach(_.difference(sceneIds, returnedIds), (id) => issues.push(`${id}:result:missing_scene`));
        if (!_.isEqual(items.length, chunkItem.length)) issues.push(`result:wrong_scene_count:${items.length}/${chunkItem.length}`);

        if (isCinematicPlanning) {
          _.forEach(items, (item) => {
            const sceneId = _.toString(_.get(item, "id"));
            if (!_.includes(sceneIds, sceneId)) return;
            if (_.isEmpty(_.trim(_.toString(_.get(item, "generationPrompt"))))) issues.push(`${sceneId}:generationPrompt:missing`);
          });
          return _.uniq(issues);
        }

        _.forEach(items, (item) => {
          const sceneId = _.toString(_.get(item, "id"));
          const baseScene = _.find(plannedScenes, { id: sceneId });
          if (!baseScene) return;
          issues.push(...getVisualShotPlanIssues(item, baseScene));
          const optimizedPrompt = _.trim(_.toString(_.get(item, "prompt")));
          if (quickVideoPromptRequired && _.isEmpty(_.trim(_.toString(_.get(item, "generationPrompt"))))) {
            issues.push(`${sceneId}:generationPrompt:missing`);
          }
          const optimizedPromptWordCount = _.size(_.words(optimizedPrompt));
          if (
            _.lt(optimizedPromptWordCount, VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.MIN_PROMPT_WORDS) ||
            _.gt(optimizedPromptWordCount, VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.MAX_PROMPT_WORDS)
          )
            issues.push(`${sceneId}:prompt:incomplete_or_outside_global_length_contract`);
          if (!VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.SENTENCE_END_PATTERN.test(optimizedPrompt) || VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.DANGLING_END_PATTERN.test(optimizedPrompt))
            issues.push(`${sceneId}:prompt:incomplete_sentence`);
          if (VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.COMPILER_FALLBACK_PATTERN.test(optimizedPrompt)) issues.push(`${sceneId}:prompt:compiler_fallback_forbidden`);
          _.forEach(QUICK_VISUAL_PLANNING_ENGLISH_FIELDS, (field) => {
            const value = _.trim(_.toString(_.get(item, field)));
            if (_.isEmpty(value)) issues.push(`${sceneId}:${field}:missing`);
          });
          if (!_.isArray(_.get(item, "characterIds"))) issues.push(`${sceneId}:characterIds:must_be_array`);
          const returnedCharacterIds = _.uniq(_.map(_.castArray(_.get(item, "characterIds", [])), _.toString));
          const validCharacterIds = new Set(_.map(characters, "id"));
          _.forEach(
            _.reject(returnedCharacterIds, (id) => validCharacterIds.has(id)),
            (id) => issues.push(`${sceneId}:characterIds:unknown:${id}`),
          );
          const sourceCharacterIds = _.uniq(_.map(_.defaultTo(baseScene.characterIds, []), _.toString));
          const subjectMayBeOmitted =
            _.some([_.get(item, "shotRole"), _.get(item, "shotPurpose")], (role) => _.includes(VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG.SUBJECT_OPTIONAL_ROLES, _.toString(role))) &&
            _.isEqual(_.get(item, "expectedSubjectCount"), 0);
          if (!subjectMayBeOmitted) _.forEach(_.difference(sourceCharacterIds, returnedCharacterIds), (id) => issues.push(`${sceneId}:characterIds:missing_story_subject:${id}`));
          _.forEach(returnedCharacterIds, (id) => {
            const characterName = _.trim(_.toString(_.find(characters, { id })?.name));
            if (!_.isEmpty(characterName) && !_.includes(_.lowerCase(optimizedPrompt), _.lowerCase(characterName))) issues.push(`${sceneId}:prompt:missing_named_character:${id}`);
          });
          if (!_.isArray(_.get(item, "propIds"))) issues.push(`${sceneId}:propIds:must_be_array`);
          if (!_.isInteger(_.get(item, "expectedSubjectCount")) || _.lt(_.get(item, "expectedSubjectCount"), 0)) {
            issues.push(`${sceneId}:expectedSubjectCount:invalid`);
          }
          if (!_.isBoolean(_.get(item, "allowBackgroundPeople"))) issues.push(`${sceneId}:allowBackgroundPeople:must_be_boolean`);
          if (!_.includes(QUICK_VISUAL_LAYOUTS, _.get(item, "layout") as (typeof QUICK_VISUAL_LAYOUTS)[number])) issues.push(`${sceneId}:layout:invalid`);
          if (!_.includes(QUICK_VISUAL_SHOT_PURPOSES, _.get(item, "shotPurpose") as (typeof QUICK_VISUAL_SHOT_PURPOSES)[number])) issues.push(`${sceneId}:shotPurpose:invalid`);
          if (!_.isBoolean(_.get(item, "textAllowed"))) issues.push(`${sceneId}:textAllowed:must_be_boolean`);
          if (!_.includes(["archival", "ai_generated"], _.get(item, "assetStrategy"))) issues.push(`${sceneId}:assetStrategy:invalid`);
          if (_.isEqual(_.get(item, "assetStrategy"), "archival") && _.isEmpty(_.trim(_.toString(_.get(item, "archivalSearchQuery"))))) {
            issues.push(`${sceneId}:archivalSearchQuery:required_for_archival`);
          }
          const textAllowed = _.get(item, "textAllowed");
          const textOverlay = _.trim(_.toString(_.get(item, "textOverlay")));
          if (_.isEqual(textAllowed, true) && _.isEmpty(textOverlay)) issues.push(`${sceneId}:textOverlay:required_when_text_allowed`);
          if (_.isEqual(textAllowed, false) && !_.isEmpty(textOverlay)) issues.push(`${sceneId}:textOverlay:must_be_empty_when_text_forbidden`);
          if (_.isEqual(resolvedVisualConfig.styleTextInImageMode, TextInImageMode.NoText) && !_.isEqual(textAllowed, false)) {
            issues.push(`${sceneId}:textAllowed:must_be_false_in_no_text_mode`);
          }
        });
        const normalizeSceneMeaning = (item: any): string[] =>
          _.uniq(
            _.words(
              _.deburr(
                _.toLower(
                  _.join(
                    [
                      _.get(item, "visualIntent"),
                      _.get(item, "visibleAction"),
                      _.get(item, "reaction"),
                      _.get(item, "storyEvidence"),
                      _.get(item, "visualHook"),
                      _.get(item, "composition"),
                      _.get(item, "locationId"),
                      _.join(_.castArray(_.get(item, "propIds")), " "),
                    ],
                    " ",
                  ),
                ),
              ),
            ),
          );
        for (let itemIndex = 1; itemIndex < items.length; itemIndex++) {
          const previousItem = items[itemIndex - 1];
          const currentItem = items[itemIndex];
          const previousMeaning = normalizeSceneMeaning(previousItem);
          const currentMeaning = normalizeSceneMeaning(currentItem);
          const union = _.union(previousMeaning, currentMeaning);
          const similarity = _.isEmpty(union) ? 1 : _.divide(_.intersection(previousMeaning, currentMeaning).length, union.length);
          if (_.gte(_.min([previousMeaning.length, currentMeaning.length]) || 0, 8) && _.gte(similarity, 0.78)) {
            issues.push(`${_.toString(_.get(currentItem, "id"))}:scene_meaning:too_similar_to:${_.toString(_.get(previousItem, "id"))}`);
          }
        }
        for (let itemIndex = 2; itemIndex < items.length; itemIndex++) {
          const shotPurposes = _.map(_.slice(items, itemIndex - 2, itemIndex + 1), (item) => _.get(item, "shotPurpose"));
          const shotSizes = _.map(_.slice(items, itemIndex - 2, itemIndex + 1), (item) => _.toLower(_.trim(_.toString(_.get(item, "shotSize")))));
          const cameraAngles = _.map(_.slice(items, itemIndex - 2, itemIndex + 1), (item) => _.toLower(_.trim(_.toString(_.get(item, "cameraAngle")))));
          const sceneId = _.toString(_.get(items[itemIndex], "id"));
          if (_.uniq(shotPurposes).length === 1) issues.push(`${sceneId}:editorial_rhythm:shotPurpose_repeated_three_times`);
          if (_.uniq(shotSizes).length === 1) issues.push(`${sceneId}:editorial_rhythm:shotSize_repeated_three_times`);
          if (_.uniq(cameraAngles).length === 1) issues.push(`${sceneId}:editorial_rhythm:cameraAngle_repeated_three_times`);
        }
        return _.uniq(issues);
      };

      const initialApiPrompt = createPlanningPrompt();
      const initialChatUiPrompt = usesChatPlanning ? createPlanningPrompt() : initialApiPrompt;
      let parsedItems = await requestVisualPlan(initialApiPrompt, initialChatUiPrompt);
      let planningIssues = collectPlanningIssues(parsedItems);
      const getCorrectablePlanningIssues = (issues: string[]): string[] => issues;
      for (
        let correctionAttempt = 0;
        correctionAttempt < CINEMATIC_CHAT_PLANNING_CONFIG.MAX_CORRECTION_ATTEMPTS && !_.isEmpty(getCorrectablePlanningIssues(planningIssues));
        correctionAttempt++
      ) {
        const correctionIssues = getCorrectablePlanningIssues(planningIssues);
        const correctionIssuesJson = jsonUtils.safeStringify(correctionIssues);
        const correctionPrompt = isCinematicPlanning ? createRepairPrompt(parsedItems, correctionIssues, sceneIds) : createPlanningPrompt(correctionIssuesJson);
        const candidateItems = await requestVisualPlan(correctionPrompt, correctionPrompt, isCinematicPlanning, sceneIds);
        parsedItems = candidateItems;
        planningIssues = collectPlanningIssues(parsedItems);
      }
      if (!_.isEmpty(planningIssues)) {
        planningWarnings.push(...planningIssues);
        appWarn(`${PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED}: continuing_after_final_correction: ${_.join(planningIssues, ", ")}`);
      }
      const returnedById = _.keyBy(parsedItems, (item) => _.toString(item.id));
      const blockingPlanningIssues = planningIssues;
      const explicitlyBlockedSceneIds = _.uniq(
        _.compact(
          _.map(blockingPlanningIssues, (issue) => {
            const sceneId = _.head(_.split(issue, ":"));
            return _.includes(sceneIds, sceneId) ? sceneId : undefined;
          }),
        ),
      );
      const blockedSceneIds = !_.isEmpty(blockingPlanningIssues) && _.isEmpty(explicitlyBlockedSceneIds) ? sceneIds : explicitlyBlockedSceneIds;
      _.forEach(chunkItem, (sourceItem) => {
        const sceneId = _.toString(_.get(sourceItem, "id"));
        if (_.includes(blockedSceneIds, sceneId)) return;
        const baseScene = _.find(plannedScenes, { id: sceneId });
        const returnedItem = returnedById[sceneId];
        if (!baseScene || !returnedItem) return;
        const normalizedScene = isCinematicPlanning
          ? ({
              ...baseScene,
              ...returnedItem,
              id: sceneId,
              generationPromptProfileVersion: CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION,
            } as StoryboardScene)
          : ({ ...baseScene, ...returnedItem } as StoryboardScene);
        optimizedMap.set(sceneId, normalizedScene);
        const plannedSceneIndex = _.findIndex(plannedScenes, { id: sceneId });
        if (_.gte(plannedSceneIndex, 0)) plannedScenes[plannedSceneIndex] = normalizedScene;
      });
      planningPartialStoryboard = _.map(plannedScenes, (scene) => optimizedMap.get(scene.id) || scene);
      if (!_.isEmpty(blockingPlanningIssues)) {
        planningFailureIssues = blockingPlanningIssues;
        throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
      }
      if (chunkIndex < _.subtract(chunks.length, 1)) await delayAsync(PIPELINE_CONFIG.DELAY_LONG_CHUNKS_MS);
    }
    plannedScenes = _.map(plannedScenes, (scene) => {
      const optimizedScene = optimizedMap.get(scene.id);
      if (!optimizedScene) throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
      return optimizedScene;
    });
    if (isCinematicPlanning) {
      const projectLanguage = isVi ? ProjectLanguage.VI : ProjectLanguage.EN;
      const unresolvedCinematicIssues = getCinematicStoryboardContractIssues(plannedScenes, clipDurationSeconds, projectLanguage);
      const blockingCinematicIssues = getBlockingCinematicStoryboardContractIssues(plannedScenes, clipDurationSeconds, projectLanguage);
      if (!_.isEmpty(unresolvedCinematicIssues)) {
        appWarn(`${PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED}: unresolved_cinematic_contract: ${_.join(unresolvedCinematicIssues, ", ")}`);
        planningWarnings.push(...unresolvedCinematicIssues);
      }
      if (!_.isEmpty(blockingCinematicIssues)) {
        planningFailureIssues = blockingCinematicIssues;
        throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
      }
    }
    const promptQa = isCinematicPlanning
      ? undefined
      : validateCompiledImagePrompts(plannedScenes, {
          backgroundMode: resolvedVisualConfig.styleBackgroundMode,
          textMode: resolvedVisualConfig.styleTextInImageMode,
          targetStyle,
          characters,
          visualBible: resolvedVisualBible,
          forbidAspectRatio: true,
        });
    const finalizedScenes = isCinematicPlanning
      ? plannedScenes
      : _.map(plannedScenes, (scene) => ({
          ...scene,
          prompt: appendImagePromptAspectRatio(scene.prompt, aspectRatio || AspectRatio.SixteenNine),
        }));
    const scenesById = _.keyBy(finalizedScenes, "id");
    const updatedStoryboard = _.map(storyboard as StoryboardScene[], (scene) => {
      if (_.isEmpty(scene.script || scene.subtitle)) return scene;
      const finalizedScene = scenesById[scene.id];
      if (!finalizedScene) throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
      return finalizedScene;
    });
    const result = { success: true, storyboard: updatedStoryboard, promptQa, planningWarnings: _.uniq(planningWarnings) };
    setCache(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, req.body, result);
    if (promptQa && !promptQa.passed) appWarn(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_QUALITY_REJECTED);
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.OPTIMIZE_PROMPTS_ERROR, error);
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED,
      retryable: false,
      planningIssues: planningFailureIssues,
      storyboard: planningPartialStoryboard,
      rotationLogs: error.rotationLogs,
      diagnostic: _.toString(error?.message),
    });
  }
});

router.post(ROUTER_PATHS.REWRITE_THUMBNAILS, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const { thumbnails, newStyle, aspectRatio, visualConfig } = req.body;
  if (!thumbnails || !_.isArray(thumbnails)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi), retryable: true });
  }

  try {
    const thumbsToRewrite = _.filter(thumbnails, (t: any) => t.prompt);
    const updatedThumbnails = _.map(thumbnails, (t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const backgroundDirective = visualConfig?.thumbnailBackgroundMode ? (BACKGROUND_MODE_CONFIG.DIRECTIVES as any)[visualConfig.thumbnailBackgroundMode] : undefined;
      const textDirective = _.isEqual(visualConfig?.thumbnailTextInImageMode, ThumbnailTextMode.NoText)
        ? TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES.no_text
        : THUMBNAIL_PROMPT_CONFIG.REWRITE_HEADLINE_DIRECTIVE;
      const focusDirective = visualConfig?.thumbnailImageFocusMode
        ? resolveImageFocusDirective(visualConfig.thumbnailImageFocusMode, visualConfig.thumbnailBackgroundMode)
        : undefined;
      const prompt = getStyleRewriteBatchPrompt(
        newStyle,
        jsonUtils.safeStringify(thumbsToRewrite),
        aspectRatio || AspectRatio.SixteenNine,
        isVi,
        backgroundDirective,
        textDirective,
        focusDirective,
        true,
      );

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        const expectedIds = _.map(thumbsToRewrite, "id");
        const returnedIds = _.map(_.castArray(parsed), "id");
        if (
          !_.isArray(parsed) ||
          !_.isEqual(_.size(parsed), _.size(thumbsToRewrite)) ||
          !_.isEmpty(_.difference(expectedIds, returnedIds)) ||
          !_.isEmpty(_.difference(returnedIds, expectedIds))
        ) {
          throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        }
        for (const item of parsed) {
          if (!item.id || _.isEmpty(_.trim(_.toString(item.prompt)))) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
          rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_STYLE_REWRITE_FAILED_THUMBNAILS, err);
        throw err;
      }

      for (let i = 0; i < updatedThumbnails.length; i++) {
        const thumb = updatedThumbnails[i];
        if (_.isEmpty(_.trim(_.toString(thumb.prompt)))) continue;
        const rewritten = rewrittenMap.get(thumb.id);
        if (!rewritten) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        thumb.prompt = rewritten;
      }
    }

    res.json({ success: true, thumbnails: updatedThumbnails });
  } catch (error: any) {
    logger.error(LogEvent.REWRITE_THUMBNAILS_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});
router.post(ROUTER_PATHS.REWRITE_THUMBNAILS_CHARACTER, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const { thumbnails, characters, aspectRatio, visualConfig } = req.body;
  if (!thumbnails || !_.isArray(thumbnails)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }

  let finalCharacters = characters;
  if (!finalCharacters || !_.isArray(finalCharacters) || _.isEmpty(finalCharacters)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("CHARACTER_PROMPT_REQUIRED", isVi) });
  }

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi), retryable: true });
  }

  try {
    const thumbsToRewrite = _.filter(thumbnails, (t: any) => t.prompt);
    const updatedThumbnails = _.map(thumbnails, (t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const backgroundDirective = visualConfig?.thumbnailBackgroundMode ? (BACKGROUND_MODE_CONFIG.DIRECTIVES as any)[visualConfig.thumbnailBackgroundMode] : undefined;
      const textDirective = _.isEqual(visualConfig?.thumbnailTextInImageMode, ThumbnailTextMode.NoText)
        ? TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES.no_text
        : THUMBNAIL_PROMPT_CONFIG.REWRITE_HEADLINE_DIRECTIVE;
      const focusDirective = visualConfig?.thumbnailImageFocusMode
        ? resolveImageFocusDirective(visualConfig.thumbnailImageFocusMode, visualConfig.thumbnailBackgroundMode)
        : undefined;
      const prompt = getCharacterRewriteThumbnailsBatchPrompt(
        jsonUtils.safeStringify(finalCharacters),
        jsonUtils.safeStringify(thumbsToRewrite),
        aspectRatio || AspectRatio.SixteenNine,
        backgroundDirective,
        textDirective,
        focusDirective,
      );

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        const expectedIds = _.map(thumbsToRewrite, "id");
        const returnedIds = _.map(_.castArray(parsed), "id");
        if (
          !_.isArray(parsed) ||
          !_.isEqual(_.size(parsed), _.size(thumbsToRewrite)) ||
          !_.isEmpty(_.difference(expectedIds, returnedIds)) ||
          !_.isEmpty(_.difference(returnedIds, expectedIds))
        ) {
          throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        }
        for (const item of parsed) {
          if (!item?.id || _.isEmpty(_.trim(_.toString(item.prompt)))) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
          rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
        }
      } catch (err: any) {
        logger.error(`Error rewriting batch character thumbnails: ${err.message}`);
        throw err;
      }

      for (const rawThumb of updatedThumbnails) {
        if (_.isEmpty(_.trim(_.toString(rawThumb.prompt)))) continue;
        const rewritten = rewrittenMap.get(rawThumb.id);
        if (!rewritten) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        rawThumb.prompt = rewritten;
      }
    }

    return res.json({ success: true, thumbnails: updatedThumbnails });
  } catch (err: any) {
    logger.error(`Error in /rewrite-thumbnails-character: ${err.message}`);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});
router.post(ROUTER_PATHS.ANALYZE_CHARACTER, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  try {
    const { script, visualStyle, sourceContext, cinematicMode } = req.body;
    if (!script) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("SCRIPT_REQUIRED", isVi) });
    }
    const cachedCharacters = checkCache(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, req.body, Boolean(req.body?.bypassCache));
    if (cachedCharacters) return res.json(cachedCharacters);

    if (!(await isAiProviderAvailable())) {
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const requiresCompleteArtifact = Boolean(cinematicMode);
    const prompt = requiresCompleteArtifact
      ? getCinematicCharacterAnalysisPrompt(script, _.toString(visualStyle), _.toString(sourceContext))
      : getCharacterAnalysisPrompt(script, _.toString(visualStyle), _.toString(sourceContext));
    let result: { characters: any[]; characterAnalysis?: string; characterSpecs?: string; identityContinuityRisks?: string[]; artifactWarnings?: string[] } | undefined;
    let artifactIssues: string[] = [];
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
      try {
        const correctionDirective = _.isEmpty(artifactIssues)
          ? ""
          : `\n\nThe previous response failed these checks: ${jsonUtils.safeStringify(artifactIssues)}. Return the complete character artifact again from the beginning; do not return a patch.`;
        const response = await generateContentWithRetry({
          contents: `${prompt}${correctionDirective}`,
          config: {
            responseMimeType: CONTENT_TYPES.JSON,
            responseJsonSchema: requiresCompleteArtifact ? CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA : QUICK_CHARACTER_ANALYSIS_RESPONSE_SCHEMA,
            includeRoomSchemaContract: false,
          },
          task: { capability: AiTaskCapability.TextPlanning },
        });

        const parsed = parseAiJsonArtifact<any>(
          response.text,
          requiresCompleteArtifact ? CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA : QUICK_CHARACTER_ANALYSIS_RESPONSE_SCHEMA,
          "invalid_character_analysis_response",
        );
        const characters = requiresCompleteArtifact ? parsed.characters : parsed;
        const characterAnalysis = _.trim(_.toString(_.get(parsed, "characterAnalysis")));
        const characterSpecs = _.trim(_.toString(_.get(parsed, "characterSpecs")));
        const ids = _.map(characters, (character) => _.trim(_.toString(character?.id)));
        artifactIssues = _.uniq(
          _.compact([
            _.isEmpty(characters) && "characters:missing",
            characters.length > CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS && "characters:too_many",
            _.uniq(ids).length !== ids.length && "characters:duplicate_id",
            ..._.flatMap(characters, (character, index) =>
              _.map(
                requiresCompleteArtifact ? ["id", "name", "description", "referenceGenerationPrompt"] : QUICK_CHARACTER_FIELDS,
                (field) => _.isEmpty(_.trim(_.toString(character?.[field]))) && `characters:${index}:${field}:missing`,
              ),
            ),
          ]),
        );
        if (_.isEmpty(artifactIssues)) {
          result = {
            characters,
            ...(requiresCompleteArtifact
              ? {
                  characterAnalysis,
                  characterSpecs,
                  identityContinuityRisks: parsed.identityContinuityRisks,
                  artifactWarnings: [],
                }
              : {}),
          };
          break;
        }
      } catch (error) {
        artifactIssues = [error instanceof Error ? error.message : "invalid_character_analysis_response"];
      }
    }

    if (!result) throw createAppError(`cinematic_character_artifact_invalid:${_.join(artifactIssues, ",")}`);
    setCache(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, req.body, result);
    return res.json(result);
  } catch (error: any) {
    const isVi = isVietnameseRequest(req);
    logger.error(LogEvent.CHARACTER_ANALYSIS_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("CHARACTER_ANALYZE_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post(ROUTER_PATHS.EXTRACT_CHARACTER, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  try {
    const { images, characterDescription } = req.body;
    if (!images || !_.isArray(images) || _.isEmpty(images)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    if (!(await isAiProviderAvailable())) {
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const parts: any[] = [];
    for (const imgBase64 of images) {
      let base64Data = imgBase64;
      let mimeType = "image/jpeg";

      if (imgBase64.startsWith("data:")) {
        const match = imgBase64.match(BASE64_DATA_URL_REGEX);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    parts.push({
      text: getCharacterExtractPrompt(characterDescription),
    });

    const response = await generateContentWithRetry({
      contents: parts,
    });

    if (response && response.text) {
      return res.json({ characterPrompt: response.text.trim() });
    } else {
      throw new Error(getBackendMsg("CHARACTER_EXTRACT_FAIL", isVi));
    }
  } catch (error: any) {
    const isVi = isVietnameseRequest(req);
    logger.error(LogEvent.CHARACTER_EXTRACTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("CHARACTER_EXTRACT_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post(ROUTER_PATHS.REWRITE_PROMPTS_CHARACTER, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const { storyboard, characterPrompt, characters, aspectRatio, visualConfig } = req.body;
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_INVALID", isVi) });
  }

  let finalCharacters = characters;
  if (!finalCharacters || !_.isArray(finalCharacters) || _.isEmpty(finalCharacters)) {
    if (characterPrompt) {
      finalCharacters = [{ name: "Main Character", prompt: characterPrompt }];
    } else {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("CHARACTER_PROMPT_REQUIRED", isVi) });
    }
  }

  if (!(await isAiProviderAvailable())) {
    return res.json({ storyboard });
  }

  try {
    const scenesToRewrite = _.filter(
      _.map(storyboard, (s: any) => ({
        id: s.id,
        prompt: s.prompt || s.script || "",
      })),
      (s) => s.prompt,
    );

    if (_.isEmpty(scenesToRewrite)) {
      return res.json({ success: true, storyboard });
    }

    const chunkSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_REWRITE_CHARACTER;
    const chunks = _.chunk(scenesToRewrite, chunkSize);

    const rewrittenMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunkItem = chunks[i];
      const backgroundDirective = visualConfig?.styleBackgroundMode ? (BACKGROUND_MODE_CONFIG.DIRECTIVES as any)[visualConfig.styleBackgroundMode] : undefined;
      const textDirective = visualConfig?.styleTextInImageMode ? (TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES as any)[visualConfig.styleTextInImageMode] : undefined;
      const focusDirective = visualConfig?.imageFocusMode ? resolveImageFocusDirective(visualConfig.imageFocusMode, visualConfig.styleBackgroundMode) : undefined;
      const prompt = getCharacterRewriteBatchPrompt(
        jsonUtils.safeStringify(finalCharacters),
        jsonUtils.safeStringify(chunkItem),
        aspectRatio || AspectRatio.SixteenNine,
        backgroundDirective,
        textDirective,
        focusDirective,
      );

      const response = await generateContentWithRetry({
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      const parsed = safeParseJSON(response.text, []);
      const expectedIds = _.map(chunkItem, "id");
      const returnedIds = _.map(_.castArray(parsed), "id");
      if (
        !_.isArray(parsed) ||
        !_.isEqual(_.size(parsed), _.size(chunkItem)) ||
        !_.isEmpty(_.difference(expectedIds, returnedIds)) ||
        !_.isEmpty(_.difference(returnedIds, expectedIds)) ||
        _.some(parsed, (item) => _.isEmpty(_.trim(_.toString(item?.prompt))))
      ) {
        throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
      }
      for (const item of parsed) rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));

      if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      if (_.isEmpty(_.trim(_.toString(scene.prompt)))) return scene;
      const rewritten = rewrittenMap.get(scene.id);
      if (!rewritten) throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
      return { ...scene, prompt: rewritten };
    });

    res.json({ success: true, storyboard: updatedStoryboard });
  } catch (error: any) {
    logger.error(LogEvent.REWRITE_PROMPTS_CHARACTER_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.HOOKS, async (req: Request, res: Response) => {
  const { originalInput, config = {}, hookType, duration, count, language, bypassCache } = req.body;
  const isVi = language === ProjectLanguage.VI || config?.language === ProjectLanguage.VI;

  const cached = checkCache(API_ROUTES.PIPELINE_HOOKS, req.body, bypassCache);
  const cachedHooksLanguageValid = _.every(_.castArray(cached?.versions), (version) => validateChapterLanguage(_.get(version, "content"), isVi).valid);
  if (cached && cachedHooksLanguageValid) {
    return res.json({ ...cached, cached: true });
  }

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi), retryable: true });
  }

  const multiStepLogs: string[] = [];
  const logStep = (msg: string) => {
    appLogStep(msg, multiStepLogs);
  };

  try {
    logStep(getPipelineLog("HOOK_STEP1", isVi));

    const combinedPrompt = getMultiStepHookPrompt(originalInput, config.genre, hookType, duration, language, count);

    const combinedResponse = await generateContentWithRetry({
      contents: combinedPrompt,
      config: { responseMimeType: "application/json" },
    });

    const combinedResult = parseAiJsonArtifact<any>(combinedResponse.text, HOOK_RESPONSE_SCHEMA, "invalid_hook_response");
    assertResponseContract(combinedResult, ResponseContractName.Hook);

    logStep(`${getPipelineLog("HOOK_STEP1_DONE", isVi)} ${combinedResult.audience || "General Audience"}. Triggers: ${(combinedResult.triggers || []).join(", ")}.`);
    if (combinedResponse.rotationLogs) multiStepLogs.push(...combinedResponse.rotationLogs);

    logStep(getPipelineLog("HOOK_STEP2", isVi));
    logStep(`${getPipelineLog("HOOK_STEP2_DONE", isVi)} ${(combinedResult.versions || []).length || 0} hooks.`);

    logStep(getPipelineLog("HOOK_STEP3", isVi));
    const versions = combinedResult.versions || [];

    logStep(getPipelineLog("HOOK_STEP3_DONE", isVi));
    const usableVersions = resolveUsableHooks(versions, hookType, count, originalInput, isVi);
    if (_.isEmpty(usableVersions)) throw createAppError(REFACTOR_CONSTANTS.ERR_HOOK_QUALITY_REJECTED);
    const output = { versions: usableVersions, rotationLogs: multiStepLogs };
    setCache(API_ROUTES.PIPELINE_HOOKS, req.body, output);
    res.json(output);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_HOOKS, error);
    const errorLogs = error.rotationLogs ? [...multiStepLogs, ...error.rotationLogs] : multiStepLogs;
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING,
      rotationLogs: errorLogs,
      retryable: true,
    });
  }
});

router.post(ROUTER_PATHS.SCRIPT, async (req: Request, res: Response) => {
  const { originalInput, inputType = "idea", config = {}, selectedHookText, bypassCache } = req.body;
  const isVietnameseScript = config.language === ProjectLanguage.VI;
  const isCinematicScript = isCinematicEpisodeGenre(config.genre);

  const cached = checkCache(API_ROUTES.PIPELINE_SCRIPT, req.body, bypassCache);
  const cachedCinematicIssues = isCinematicScript
    ? getCinematicScriptReadinessIssues(cached?.rewrittenScript, _.castArray(cached?.chapters || []), cached?.scriptQa, cached?.contentSafety)
    : [];
  if (cached && (isCinematicScript || validateChapterLanguage(cached.rewrittenScript, isVietnameseScript).valid) && _.isEmpty(cachedCinematicIssues)) {
    return res.json({ ...cached, cached: true });
  }

  if (!(await isAiProviderAvailable())) {
    const isVi = config.language === ProjectLanguage.VI;
    if (_.isEqual(requestContext.getStore()?.aiExecutionMode, AiPlanningExecutionMode.RoomOnly)) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: getRoomOnlyScriptError(requestContext.getStore()?.aiRoomProvider, undefined, isVi), retryable: true });
    }
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
  }

  let activeHookText = selectedHookText || "";
  let generatedHookVersions: any[] = [];

  try {
    const isVi = config.language === ProjectLanguage.VI;
    const rawDurationText = config.duration || "2m";

    const durStr = String(rawDurationText).toLowerCase().trim();
    const durationInfo = getDurationText(isVi, durStr);
    const targetWordCount = durationInfo.targetWordCount;
    const durationText = durationInfo.durationText;

    const targetWordCountMin = Math.floor(targetWordCount * 0.95);

    let genreGuideline = "";
    let styleGuideline = "";
    let audienceGuideline = "";

    if (isVi) {
      genreGuideline = VI_GENRE_GUIDELINES[config.genre] || PROMPT_CONTEXT.VI_GENRE_DEFAULT(config.genre || "Storytelling");
      styleGuideline = VI_STYLE_GUIDELINES[config.writingStyle] || PROMPT_CONTEXT.VI_STYLE_DEFAULT(config.writingStyle || "Default");
      audienceGuideline = VI_AUDIENCE_GUIDELINES[config.audience] || PROMPT_CONTEXT.VI_AUDIENCE_DEFAULT(config.audience || "General");
    } else {
      genreGuideline = EN_GENRE_GUIDELINES[config.genre] || PROMPT_CONTEXT.EN_GENRE_DEFAULT(config.genre || "Storytelling");
      styleGuideline = EN_STYLE_GUIDELINES[config.writingStyle] || PROMPT_CONTEXT.EN_STYLE_DEFAULT(config.writingStyle || "Default");
      audienceGuideline = EN_AUDIENCE_GUIDELINES[config.audience] || PROMPT_CONTEXT.EN_AUDIENCE_DEFAULT(config.audience || "General");
    }

    const multiStepLogs: string[] = [];
    const aiMetrics: any[] = [];
    let contentSafety: ContentSafetyReport | undefined;
    let lastSafetyError: unknown;
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS && !contentSafety; attempt++) {
      try {
        const safetyResponse = await generateContentWithRetry({
          contents: `${getContentSafetyPrompt(originalInput)}${
            attempt > 0
              ? "\n\nThe previous response was not one complete parseable JSON value. Generate the entire safety JSON object again from the beginning; do not continue, patch, quote, or repeat any part of the previous response."
              : ""
          }`,
          config: {
            responseMimeType: CONTENT_TYPES.JSON,
            responseJsonSchema: CONTENT_SAFETY_RESPONSE_SCHEMA,
            includeRoomSchemaContract: false,
            maxOutputTokens: CONTENT_SAFETY_CONFIG.MAX_OUTPUT_TOKENS,
          },
          task: { capability: AiTaskCapability.FactualReview },
        });
        contentSafety = normalizeContentSafety(parseAiJsonArtifact(safetyResponse.text, CONTENT_SAFETY_RESPONSE_SCHEMA, "invalid_content_safety_response"));
        if (safetyResponse.aiMetadata) aiMetrics.push(safetyResponse.aiMetadata);
      } catch (safetyError) {
        lastSafetyError = safetyError;
        appWarn(CONTENT_SAFETY_CONFIG.REVIEW_FAILED_LOG, safetyError);
      }
    }
    if (!contentSafety) throw lastSafetyError instanceof Error ? lastSafetyError : new Error("invalid_content_safety_response");
    if (!contentSafety.allowed) throw new Error(_.join(contentSafety.blockingErrors, ", ") || PIPELINE_SERVER_ERRORS.CONTENT_SAFETY_REJECTED);
    const logStep = (msg: string) => {
      appLogStep(msg, multiStepLogs);
    };

    activeHookText = isCinematicScript ? "" : selectedHookText || "";
    if (!isCinematicScript && !activeHookText && config.hookConfig) {
      logStep(getPipelineLog("HOOK_AUTO_GENERATE", isVi));
      try {
        const hookType = config.hookConfig.type || "Auto";
        const hookDuration = config.hookConfig.duration || 10;
        const hookCount = _.clamp(_.toInteger(config.hookConfig.count) || REFACTOR_CONSTANTS.HOOK_COUNT, 1, 5);
        const hookPrompt = getMultiStepHookPrompt(originalInput, config.genre || "Storytelling", hookType, hookDuration, isVi ? "vi" : "en", hookCount);
        let validHookResult: any;
        let lastHookError: unknown;
        for (let attempt = 0; attempt < TECHNICAL_RESPONSE_RETRY_CONFIG.MAX_ATTEMPTS && !validHookResult; attempt++) {
          try {
            const hookResponse = await generateContentWithRetry({
              contents: `${hookPrompt}${
                attempt > 0
                  ? "\n\nThe previous response was not one complete parseable JSON value. Generate the entire hook JSON object again from the beginning; do not continue, patch, quote, or repeat any part of the previous response."
                  : ""
              }`,
              config: { responseMimeType: "application/json", responseJsonSchema: HOOK_RESPONSE_SCHEMA, includeRoomSchemaContract: false },
              task: { capability: AiTaskCapability.TextPlanning },
            });
            const hookResult = parseAiJsonArtifact<any>(hookResponse.text, HOOK_RESPONSE_SCHEMA, "invalid_hook_response");
            assertResponseContract(hookResult, ResponseContractName.Hook);
            const usableVersions = resolveUsableHooks(hookResult.versions, hookType, hookCount, originalInput, isVi);
            if (_.isEmpty(usableVersions) || !_.some(usableVersions, "selected")) throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_QUALITY_REJECTED);
            validHookResult = { ...hookResult, versions: usableVersions };
            if (hookResponse.aiMetadata) aiMetrics.push(hookResponse.aiMetadata);
          } catch (hookError) {
            lastHookError = hookError;
          }
        }
        if (!validHookResult) throw lastHookError instanceof Error ? lastHookError : new Error("invalid_hook_response");
        generatedHookVersions = validHookResult.versions;
        const selectedHook = _.find(generatedHookVersions, "selected");
        activeHookText = selectedHook.content;
        logStep(`${getPipelineLog("HOOK_EMBEDDED", isVi)}"${activeHookText}"`);
      } catch (hookError: any) {
        logger.error(LogEvent.ERROR_GENERATING_HOOKS, hookError);
        appWarn(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        throw hookError;
      }
    }

    activeHookText = await ensureHookLanguage(activeHookText, isVi);
    logStep(getPipelineLog("SCRIPT_STEP1", isVi));

    const targetChapterCount = resolveScriptPlanChapterCount(targetWordCountMin);

    const contentControlDirective = isCinematicScript
      ? ""
      : `[User content controls]\n- Input type: ${inputType}. Treat a script/draft as source material to preserve; treat an idea as material to develop.\n- Rewrite level: ${_.clamp(_.toNumber(config.rewriteLevel), 0, 100)}%.\n- Creativity: ${_.clamp(_.toNumber(config.creativityLevel), 0, 10)}/10. Creativity may change expression and storytelling, never verified facts.\n- Similarity reduction: ${_.clamp(_.toNumber(config.similarityReduction), 0, 10)}/10. Vary wording and rhythm without changing factual meaning.`;
    const retentionDirective = isCinematicScript ? "" : createViewerRetentionDirective(parseTargetDurationSeconds(rawDurationText), config.genre);
    const combinedScriptPrompt = isCinematicScript
      ? ""
      : `${getCombinedScriptPrompt(originalInput, durationText, targetWordCount, config.genre, config.writingStyle, isVi, activeHookText, genreGuideline, styleGuideline, audienceGuideline, targetChapterCount, config.hookConfig)}\n\n${createGenreEditorialDirective(config.genre)}\n\n${createAudienceMarketDirective(config.language, config.audience)}\n\n${retentionDirective}\n\n${contentControlDirective}`;

    let groundedResearchResponse: any = null;
    if (config.factCheck && contentSafety.trueCase) {
      try {
        groundedResearchResponse = await generateContentWithRetry({
          contents: _.replace(FACT_RESEARCH_CONFIG.PROMPT_TEMPLATE, FACT_RESEARCH_CONFIG.TOPIC_TOKEN, originalInput),
          config: {
            tools: [{ googleSearch: {} }],
            maxOutputTokens: FACT_RESEARCH_CONFIG.MAX_OUTPUT_TOKENS,
          },
          task: { capability: AiTaskCapability.FactualReview },
        });
      } catch (researchError) {
        appWarn(FACT_RESEARCH_CONFIG.FAILED_LOG, researchError);
        throw researchError;
      }
    }
    if (groundedResearchResponse?.aiMetadata) aiMetrics.push(groundedResearchResponse.aiMetadata);
    let cinematicFilmPackage: Record<string, any> | undefined;
    let cinematicCheckpointProject: any = null;
    let cinematicSourceSignature = "";
    let canReuseCinematicCheckpoint = false;
    let scriptResult: any;
    if (isCinematicScript) {
      const clipDurationSeconds = resolveCinematicClipDuration(config?.videoDuration);
      const targetClipCount = Math.max(1, Math.ceil(parseTargetDurationSeconds(rawDurationText) / clipDurationSeconds));
      const filmPackageRequestId = createCinematicArtifactRequestId(req.body?.pipelineRunId, CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE);
      const cinematicSourceSignatureInput = {
        originalInput,
        inputType,
        genre: config.genre,
        language: config.language,
        duration: rawDurationText,
        targetWordCount,
        targetChapterCount,
        writingStyle: config.writingStyle,
        audience: config.audience,
        factCheck: Boolean(config.factCheck),
        rewriteLevel: _.clamp(_.toNumber(config.rewriteLevel), 0, 100),
        creativityLevel: _.clamp(_.toNumber(config.creativityLevel), 0, 10),
        similarityReduction: _.clamp(_.toNumber(config.similarityReduction), 0, 10),
      };
      cinematicSourceSignature = createCinematicScriptSourceSignature({
        ...cinematicSourceSignatureInput,
        artifactSchemas: { filmPackage: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.FILM_PACKAGE_SCHEMA_VERSION },
      });
      const compatibleCinematicSourceSignatures = _.map(CINEMATIC_SCRIPT_ARTIFACT_CONFIG.LEGACY_FILM_PACKAGE_SCHEMA_VERSIONS, (schemaVersion) =>
        createCinematicScriptSourceSignature({
          ...cinematicSourceSignatureInput,
          artifactSchemas: { filmPackage: schemaVersion },
        }),
      );
      const checkpointProjectId = path.basename(_.toString(req.body?.projectId));
      cinematicCheckpointProject = _.isEmpty(checkpointProjectId) ? null : await getProjectDetailFromDb(checkpointProjectId).catch(() => null);
      canReuseCinematicCheckpoint =
        !bypassCache &&
        _.includes([cinematicSourceSignature, ...compatibleCinematicSourceSignatures], _.toString(cinematicCheckpointProject?.cinematicScriptArtifacts?.sourceSignature));
      const getFilmPackageIssues = (value: Record<string, any> | undefined): string[] => {
        const scenes = _.castArray(value?.scenes || []);
        const intro = value?.intro;
        const sceneIds = _.map(scenes, (scene) => _.trim(_.toString(scene?.id)));
        const characters = _.castArray(value?.characters || []);
        const characterIds = _.map(characters, (character) => _.trim(_.toString(character?.id)));
        const knownCharacterIds = new Set(characterIds);
        return _.compact([
          _.isEmpty(_.trim(_.toString(value?.scriptSegment))) && "script:missing",
          !_.isEqual(value?.artifactType, CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE) && "artifact:type_mismatch",
          !_.isEqual(value?.requestId, filmPackageRequestId) && "artifact:request_mismatch",
          _.isEmpty(_.castArray(value?.chapters || [])) && "chapters:missing",
          _.isEmpty(scenes) && "scenes:missing",
          _.isEmpty(intro) && "intro:missing",
          !_.isEmpty(intro) && _.isEmpty(_.trim(_.toString(intro?.script))) && "intro:script_missing",
          !_.isEmpty(intro) && _.isEmpty(_.trim(_.toString(intro?.introTitle))) && "intro:title_missing",
          !_.isEmpty(intro) && _.isEmpty(_.trim(_.toString(intro?.generationPrompt))) && "intro:generationPrompt_missing",
          !_.isEmpty(intro) && !_.isArray(intro?.characterIds) && "intro:characterIds_missing",
          !_.isEmpty(intro) && _.some(intro?.characterIds, (id) => !knownCharacterIds.has(_.trim(_.toString(id)))) && "intro:characterIds_unknown",
          !_.isEqual(_.size(scenes), targetClipCount) &&
            _.replace(
              _.replace(CINEMATIC_SCRIPT_ARTIFACT_CONFIG.SCENE_COUNT_MISMATCH_TEMPLATE, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.ACTUAL_COUNT_TOKEN, _.toString(_.size(scenes))),
              CINEMATIC_SCRIPT_ARTIFACT_CONFIG.TARGET_COUNT_TOKEN,
              _.toString(targetClipCount),
            ),
          _.some(sceneIds, _.isEmpty) && "scenes:id_missing",
          _.uniq(sceneIds).length !== sceneIds.length && "scenes:id_duplicate",
          _.some(characterIds, _.isEmpty) && "characters:id_missing",
          _.uniq(characterIds).length !== characterIds.length && "characters:id_duplicate",
          _.some(scenes, (scene) => _.isEmpty(_.trim(_.toString(scene?.script)))) && "scenes:script_missing",
          _.some(scenes, (scene) => !_.isArray(scene?.characterIds)) && "scenes:characterIds_missing",
          _.some(scenes, (scene) => _.some(scene?.characterIds, (id) => !knownCharacterIds.has(_.trim(_.toString(id))))) && "scenes:characterIds_unknown",
          !_.isEqual(value?.completionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER) && CINEMATIC_SCRIPT_ARTIFACT_CONFIG.FILM_PACKAGE_INCOMPLETE_ERROR,
        ]);
      };
      const savedFilmPackage = canReuseCinematicCheckpoint ? cinematicCheckpointProject?.cinematicScriptArtifacts?.filmPackage : undefined;
      if (_.isEmpty(getFilmPackageIssues(savedFilmPackage))) {
        cinematicFilmPackage = savedFilmPackage;
        await saveCinematicScriptArtifactCheckpoint(req.body?.projectId, "filmPackage", cinematicFilmPackage, cinematicSourceSignature);
        multiStepLogs.push("[cinematic_film_package] reused_valid_checkpoint");
      } else {
        const filmPackagePrompt = getCinematicFilmPackagePrompt(originalInput, config.genre, isVi, targetWordCount, targetClipCount, clipDurationSeconds, filmPackageRequestId, {
          inputType,
          audience: config.audience,
          writingStyle: config.writingStyle,
          rewriteLevel: config.rewriteLevel,
          creativityLevel: config.creativityLevel,
          similarityReduction: config.similarityReduction,
          groundedResearch: _.toString(groundedResearchResponse?.text),
        });
        let latestIssues: string[] = ["film_package:missing"];
        for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
          const filmPackageResponse = await generateContentWithRetry({
            contents: attempt === 0 ? filmPackagePrompt : getCinematicFilmPackageRepairPrompt(filmPackagePrompt, latestIssues),
            config: {
              responseMimeType: CONTENT_TYPES.JSON,
              responseJsonSchema: createCinematicFilmPackageResponseSchema(targetClipCount),
              includeRoomSchemaContract: false,
              maxOutputTokens: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_OUTPUT_TOKENS,
              roomCompletionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
              roomArtifactType: CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE,
              roomRequestId: filmPackageRequestId,
            },
            task: { capability: AiTaskCapability.ScriptWriting, roomWorkerId: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.PRIMARY_WORKER_ID },
          });
          if (filmPackageResponse.aiMetadata) aiMetrics.push(filmPackageResponse.aiMetadata);
          if (filmPackageResponse.rotationLogs) multiStepLogs.push(...filmPackageResponse.rotationLogs);
          const candidate = parseAiJsonArtifact<Record<string, any>>(
            filmPackageResponse.text,
            createCinematicFilmPackageResponseSchema(targetClipCount),
            "invalid_cinematic_film_package_response",
          );
          latestIssues = getFilmPackageIssues(candidate);
          if (_.isEmpty(latestIssues)) {
            cinematicFilmPackage = candidate;
            break;
          }
        }
        if (!cinematicFilmPackage) throw createAppError(`cinematic_film_package_invalid:${_.join(latestIssues, ",")}`);
        await saveCinematicScriptArtifactCheckpoint(req.body?.projectId, "filmPackage", cinematicFilmPackage, cinematicSourceSignature);
      }
      scriptResult = {
        theme: cinematicFilmPackage.theme,
        characterSpecs: cinematicFilmPackage.characterSpecs,
        preferredTerms: [],
        factCheckNotes: "",
        creativeBrief: _.pick(cinematicFilmPackage, ["title", "logline", "theme", "visualDirection"]),
        factPack: { claims: [] },
        narrativePlan: undefined,
        chapters: cinematicFilmPackage.chapters,
      };
    } else {
      const scriptPlanResponse = await requestValidScriptPlan(
        {
          contents: groundedResearchResponse
            ? `${combinedScriptPrompt}\n\n[Grounded research evidence]:\n${groundedResearchResponse.text}`
            : `${combinedScriptPrompt}\n\n[Fact-check mode]: Disabled by the user. Do not invent sources, quotations, studies, or precise factual claims. Mark unverifiable claims unsupported and use cautious qualitative wording.`,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: SCRIPT_PLAN_RESPONSE_SCHEMA,
            includeRoomSchemaContract: false,
            maxOutputTokens: SCRIPT_PLAN_CONFIG.MAX_OUTPUT_TOKENS,
          },
          task: { capability: config.factCheck ? AiTaskCapability.FactualReview : AiTaskCapability.TextPlanning },
        },
        targetChapterCount,
        generateContentWithRetry,
      );
      aiMetrics.push(...scriptPlanResponse.aiMetadata);
      multiStepLogs.push(...scriptPlanResponse.rotationLogs);
      scriptResult = normalizeScriptPlan(scriptPlanResponse.value, originalInput) as any;
    }
    scriptResult.factPack = await validateFactPack(scriptResult.factPack, Boolean(config.factCheck));
    if (!isCinematicScript) assertResponseContract(scriptResult, ResponseContractName.ScriptPlan);

    logStep(
      `${getPipelineLog("SCRIPT_STEP1_DONE", isVi)} ${(scriptResult.preferredTerms || []).join(", ") || "None"}. Spec: ${scriptResult.characterSpecs || "No character reference needed."}`,
    );

    logStep(getPipelineLog("SCRIPT_STEP2A", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2A_DONE", isVi)} ${(scriptResult.chapters || []).length} chapters.`);

    logStep(getPipelineLog("SCRIPT_STEP2B", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2B_DONE", isVi)} ${(scriptResult.chapters || []).length}.`);

    if (isCinematicScript) {
      const finalCleanScript = _.trim(_.toString(cinematicFilmPackage?.scriptSegment));
      const finalChapters = _.map(_.castArray<any>(cinematicFilmPackage?.chapters || []), (chapter: any) => ({
        id: _.toString(chapter.id),
        title: _.toString(chapter.title),
        scriptSegment: _.toString(chapter.scriptSegment),
      }));
      const latestCinematicCheckpoint = _.isEmpty(path.basename(_.toString(req.body?.projectId)))
        ? undefined
        : await getProjectDetailFromDb(path.basename(_.toString(req.body?.projectId))).catch(() => null);
      const parsedData = {
        rewrittenScript: finalCleanScript,
        factCheckNotes: "",
        creativeBrief: scriptResult.creativeBrief || {},
        narrativePlan: undefined,
        chapterPlans: finalChapters,
        factPack: { claims: [] },
        scriptQa: undefined,
        chapters: finalChapters,
        characters: _.castArray(cinematicFilmPackage?.characters || []),
        intro: cinematicFilmPackage?.intro,
        characterAnalysis: _.toString(cinematicFilmPackage?.characterAnalysis),
        characterSpecs: _.toString(cinematicFilmPackage?.characterSpecs),
        identityContinuityRisks: _.castArray(cinematicFilmPackage?.identityContinuityRisks || []),
        productionScenes: _.castArray(cinematicFilmPackage?.scenes || []),
        visualDirection: _.toString(cinematicFilmPackage?.visualDirection),
        hookVersions: [],
        rotationLogs: multiStepLogs,
        aiMetrics,
        contentSafety,
        cinematicScriptArtifacts: latestCinematicCheckpoint?.cinematicScriptArtifacts,
      };
      setCache(API_ROUTES.PIPELINE_SCRIPT, req.body, parsedData);
      return res.json(parsedData);
    }

    logStep(getPipelineLog("SCRIPT_STEP3", isVi));
    const completedChapters: any[] = [];
    let fullScript = activeHookText ? activeHookText + "\n\n" : "";
    let previousChapterSummary = activeHookText;

    const chapters = scriptResult.chapters || [];
    const chapterWordTarget = _.ceil(targetWordCount / (_.max([1, chapters.length]) || 1));
    const requestValidChapterSegment = async (contents: string): Promise<string> => {
      const languageFailureLogs: string[] = [];
      let latestUsableSegment = "";
      for (let attemptIndex = 0; attemptIndex < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_GENERATION_ATTEMPTS; attemptIndex++) {
        const response = await generateContentWithRetry({
          contents: attemptIndex > 0 ? `${contents}\n\n${isVi ? VIETNAMESE_CHAPTER_RETRY_DIRECTIVE : ENGLISH_CHAPTER_RETRY_DIRECTIVE}` : contents,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: CHAPTER_RESPONSE_SCHEMA,
            maxOutputTokens: 2048,
          },
          task: { capability: AiTaskCapability.ScriptWriting },
        });

        if (response.aiMetadata) aiMetrics.push(response.aiMetadata);
        if (response.rotationLogs) multiStepLogs.push(...response.rotationLogs);
        let cleanedSegment = "";
        try {
          cleanedSegment = extractCleanChapterSegment(response.text);
        } catch (responseError) {
          languageFailureLogs.push(RESPONSE_CONTRACT_CONFIG.EMPTY_CHAPTER_SCRIPT_ERROR);
          appWarn(PIPELINE_SERVER_LOGS.INVALID_CHAPTER_RESPONSE_DISCARDED, responseError);
          continue;
        }
        const validation = validateChapterLanguage(cleanedSegment, isVi);
        if (validation.valid) return cleanedSegment;

        latestUsableSegment = cleanedSegment;
        languageFailureLogs.push(...validation.issues);
        appWarn(PIPELINE_SERVER_LOGS.INVALID_CHAPTER_LANGUAGE_DISCARDED, validation.issues);
      }

      if (!_.isEmpty(latestUsableSegment)) {
        if (isVi) {
          const finalCheck = validateChapterLanguage(latestUsableSegment, true);
          if (finalCheck.issues.includes(ChapterLanguageIssue.MissingVietnameseDiacritics)) {
            try {
              const restoreResponse = await generateContentWithRetry({
                contents: getVietnameseDiacriticsRestorationPrompt(latestUsableSegment),
                config: {
                  responseMimeType: "application/json",
                  responseJsonSchema: CHAPTER_RESPONSE_SCHEMA,
                  maxOutputTokens: 2048,
                },
                task: { capability: AiTaskCapability.ScriptWriting },
              });
              const restoredSegment = extractCleanChapterSegment(restoreResponse.text);
              if (validateChapterLanguage(restoredSegment, true).valid) {
                return restoredSegment;
              }
            } catch (restoreErr) {
              appWarn(PIPELINE_CONTROLLER_MESSAGES.VIETNAMESE_ACCENT_RESTORE_FAILED, restoreErr);
            }
          }
        }
      }

      const languageError: any = createAppError(PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID);
      languageError.rotationLogs = languageFailureLogs;
      languageError.noRetry = true;
      throw languageError;
    };

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      logStep(`${getPipelineLog("SCRIPT_STEP3_PROGRESS", isVi)} ${i + 1}/${chapters.length}: ${chapter.title}...`);

      const splitStrategy = config.splitStrategy || SplitStrategy.LONG_SENTENCE;
      const chapterPrompt = getChapterWriterPrompt(
        chapter.title,
        chapter.description,
        config.genre,
        config.writingStyle,
        isVi,
        genreGuideline,
        styleGuideline,
        chapterWordTarget,
        splitStrategy,
        jsonUtils.safeStringify({
          narrativePlan: scriptResult.narrativePlan,
          chapterPlan: chapter,
          completedChapters: _.map(completedChapters, (completedChapter) => _.pick(completedChapter, ["id", "title"])),
          previousChapterSummary,
        }),
      );

      let cleanedSegment = await requestValidChapterSegment(
        `Original Context:\n${originalInput}\n\nConcept Sheet:\n${jsonUtils.safeStringify(scriptResult)}\n\n${contentControlDirective}\n\nChapter Prompt:\n${chapterPrompt}`,
      );
      const chapterMinimumWords = _.floor(chapterWordTarget * (1 - SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));
      const chapterMaximumWords = _.ceil(chapterWordTarget * (1 + SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));
      for (
        let expansionIndex = 0;
        expansionIndex < REFACTOR_CONSTANTS.SCRIPT_CHAPTER_EXPANSION_RETRY_COUNT && _.size(_.words(cleanedSegment)) < chapterMinimumWords;
        expansionIndex++
      ) {
        const replacement = await requestValidChapterSegment(
          getChapterExpansionPrompt(originalInput, chapter.title, cleanedSegment, chapterMinimumWords, chapterMaximumWords, isVi),
        );
        if (_.isEmpty(replacement)) break;
        cleanedSegment = replacement;
      }

      const hasCompleteChapterEnding = (value: string): boolean => /[.!?…][\s"')\]]*$/.test(_.trim(value));
      if (!hasCompleteChapterEnding(cleanedSegment)) {
        const endingRepair = await requestValidChapterSegment(
          `${getChapterExpansionPrompt(originalInput, chapter.title, cleanedSegment, chapterMinimumWords, chapterMaximumWords, isVi)}\n\nThe rejected artifact ended mid-sentence. Return the entire corrected chapter from the beginning and end it with complete punctuation.`,
        );
        if (!_.isEmpty(endingRepair)) cleanedSegment = endingRepair;
      }
      if (_.lt(_.size(_.words(cleanedSegment)), chapterMinimumWords) || !hasCompleteChapterEnding(cleanedSegment)) {
        const incompleteChapterError: any = createAppError(`chapter_incomplete:${chapter.id || i + 1}`);
        incompleteChapterError.retryable = true;
        throw incompleteChapterError;
      }

      completedChapters.push({
        id: chapter.id,
        title: chapter.title,
        scriptSegment: cleanedSegment,
      });
      previousChapterSummary = cleanedSegment;

      fullScript += cleanedSegment + "\n\n";
    }

    logStep(getPipelineLog("SCRIPT_STEP4", isVi));
    logStep(getPipelineLog("SCRIPT_STEP4_DONE", isVi));

    const assembledChapterDraft = fullScript.trim();
    let finalCleanScript = "";
    const targetDurationSeconds = parseTargetDurationSeconds(rawDurationText);
    let editorialQa: Record<string, unknown> = {};
    let editorialIssues: string[] = [];
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
      const correctionDirective = _.isEmpty(editorialIssues)
        ? ""
        : `\n\nThe previous response failed these checks: ${jsonUtils.safeStringify(editorialIssues)}. Return the entire corrected JSON artifact again from the beginning; do not return a patch or partial script.`;
      const editorialResponse = await generateContentWithRetry({
        contents: `${getFinalScriptEditorialPrompt(assembledChapterDraft, config.genre, isVi, targetWordCount)}\n\n${retentionDirective}${correctionDirective}`,
        config: {
          responseMimeType: CONTENT_TYPES.JSON,
          responseJsonSchema: FINAL_SCRIPT_EDIT_RESPONSE_SCHEMA,
          maxOutputTokens: _.clamp(targetWordCount * 4, 2048, 16384),
        },
        task: { capability: AiTaskCapability.ScriptWriting },
      });
      const editorialResult = parseAiJsonArtifact<any>(editorialResponse.text, FINAL_SCRIPT_EDIT_RESPONSE_SCHEMA, "invalid_final_script_edit_response");
      const polishedScript = _.trim(_.toString(editorialResult.scriptSegment));
      const polishedWordRatio = _.size(_.words(polishedScript)) / (_.max([1, targetWordCount]) || 1);
      const languageValidation = validateChapterLanguage(polishedScript, isVi);
      const editorialScoresPass = _.every(["continuityScore", "repetitionScore", "factualityScore", "emotionalArcScore", "conversationalScore", "hookPayoffScore"], (field) =>
        _.gte(_.toNumber(editorialResult[field]), 75),
      );
      editorialIssues = _.compact([
        _.isEmpty(polishedScript) && "scriptSegment:missing",
        !_.inRange(polishedWordRatio, 0.9, 1.100001) && `scriptSegment:word_ratio:${polishedWordRatio.toFixed(2)}`,
        !languageValidation.valid && `scriptSegment:language:${_.join(languageValidation.issues, ",")}`,
        !editorialScoresPass && "quality_scores:below_75",
      ]);
      if (_.isEmpty(editorialIssues)) {
        finalCleanScript = polishedScript;
        editorialQa = editorialResult;
        if (editorialResponse.aiMetadata) aiMetrics.push(editorialResponse.aiMetadata);
        if (editorialResponse.rotationLogs) multiStepLogs.push(...editorialResponse.rotationLogs);
        break;
      }
      multiStepLogs.push(`final_script_editor_output_rejected:${_.join(editorialIssues, ",")}`);
      if (editorialResponse.aiMetadata) aiMetrics.push(editorialResponse.aiMetadata);
      if (editorialResponse.rotationLogs) multiStepLogs.push(...editorialResponse.rotationLogs);
    }
    if (_.isEmpty(finalCleanScript)) {
      const editorialError: any = createAppError(`final_script_editor_rejected:${_.join(editorialIssues, ",")}`);
      editorialError.retryable = true;
      throw editorialError;
    }
    const finalLanguageValidation = validateChapterLanguage(finalCleanScript, isVi);
    if (!finalLanguageValidation.valid) throw new Error(PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID);
    const scriptQaBase = normalizeScriptQualityReport(
      editorialQa,
      _.size(_.words(finalCleanScript)),
      targetDurationSeconds,
      isVi ? SCRIPT_SPEECH_RATE_CONFIG.VIETNAMESE_WORDS_PER_MINUTE : SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE,
    );
    const deterministicStyleWarnings = isVi && isSatiricalVideoGenre(config.genre) ? detectVietnameseNarrationStyleWarnings(finalCleanScript) : [];
    const scriptQa = {
      ...scriptQaBase,
      warnings: _.uniq(
        _.compact([
          ...scriptQaBase.warnings,
          _.isEmpty(editorialQa) && ADVISORY_QA_CONFIG.SCRIPT_SKIPPED_WARNING,
          !scriptQaBase.durationFit && ADVISORY_QA_CONFIG.SCRIPT_DURATION_WARNING,
          ...deterministicStyleWarnings,
        ]),
      ),
      passed: scriptQaBase.passed && _.isEmpty(deterministicStyleWarnings),
    };
    const finalChapters = completedChapters;
    const parsedData = {
      rewrittenScript: finalCleanScript,
      factCheckNotes: scriptResult.factCheckNotes,
      creativeBrief: scriptResult.creativeBrief || {},
      narrativePlan: scriptResult.narrativePlan,
      chapterPlans: scriptResult.chapters,
      factPack: scriptResult.factPack || { claims: [] },
      scriptQa,
      chapters: finalChapters,
      hookVersions: generatedHookVersions,
      rotationLogs: multiStepLogs,
      aiMetrics,
      contentSafety,
    };
    setCache(API_ROUTES.PIPELINE_SCRIPT, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_REWRITING_SCRIPT, error);
    const isVi = config?.language === ProjectLanguage.VI;
    if (_.isEqual(requestContext.getStore()?.aiExecutionMode, AiPlanningExecutionMode.RoomOnly)) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: getRoomOnlyScriptError(requestContext.getStore()?.aiRoomProvider, error, isVi),
        retryable: true,
        diagnostic: {
          message: _.toString(error?.message),
          artifactIssues: _.compact(_.castArray(error?.artifactIssues)),
          rotationLogs: _.compact(_.castArray(error?.rotationLogs)),
        },
      });
    }
    const rotationLogs = _.castArray(error?.rotationLogs);
    const missingFreeAiKeys = _.some(rotationLogs, (log) => _.isEqual(_.toString(log), FREE_AI_PROVIDER_LOGS.NO_KEYS));
    const attemptedFreeAi = _.some(rotationLogs, (log) => _.includes(_.toString(log), "[AI Router]")) && !missingFreeAiKeys;
    const languageIntegrityFailed = _.isEqual(error?.message, PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID);
    const scriptPlanInvalid = Boolean(error?.scriptPlanInvalid);
    const errorMessage = scriptPlanInvalid
      ? isVi
        ? PIPELINE_SERVER_ERRORS.SCRIPT_PLAN_INVALID_VI
        : PIPELINE_SERVER_ERRORS.SCRIPT_PLAN_INVALID_EN
      : languageIntegrityFailed
        ? isVi
          ? PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID_VI
          : PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID_EN
        : missingFreeAiKeys
          ? isVi
            ? PIPELINE_CONTROLLER_MESSAGES.FREE_AI_PROVIDER_UNAVAILABLE
            : "No free Groq or Cerebras key is configured, and the Gemini fallback also failed. Add at least one free key in Settings, then resume the project."
          : attemptedFreeAi
            ? isVi
              ? PIPELINE_CONTROLLER_MESSAGES.FREE_AI_PROVIDER_QUOTA_EXHAUSTED
              : "The free AI providers are temporarily rate-limited or unavailable. All free models were tried before Gemini; resume the project in a few minutes."
            : getGeminiUserMessage(error, isVi);
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: errorMessage,
      retryable: Boolean(error?.retryable) || scriptPlanInvalid || languageIntegrityFailed || attemptedFreeAi || classifyGeminiError(error).retryable,
    });
  } finally {
  }
});

router.post("/detailed-prompt", async (req: Request, res: Response) => {
  const { sceneScript, setting, time, character, costume, camera, style, aspectRatio, characterPrompt, referencePrompt, currentPrompt } = req.body;
  if (!sceneScript) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: ErrorMessage.MISSING_SCENE_SCRIPT });
  }

  try {
    const prompt = getDetailedPromptBuilderPrompt(
      sceneScript,
      setting,
      time,
      character,
      costume,
      camera,
      style,
      aspectRatio || AspectRatio.SixteenNine,
      characterPrompt,
      referencePrompt,
      currentPrompt,
    );

    const response = await generateContentWithRetry({
      contents: prompt,
    });

    const detailedPrompt = response.text?.trim();
    if (!detailedPrompt) throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
    res.json({ success: true, prompt: detailedPrompt });
  } catch (error: any) {
    logger.error(LogEvent.DETAILED_PROMPT_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.SELECT_VIDEO_SCENES, async (req: Request, res: Response) => {
  const scenes = _.get(req.body, REFACTOR_CONSTANTS.AVG_STORYBOARD_KEY, []);
  const requestedMax = _.toInteger(_.get(req.body, REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY, SecurityConstants.DEFAULT_AMOUNT));
  const maxVideos = _.clamp(requestedMax, SecurityConstants.DEFAULT_AMOUNT, _.max([_.size(scenes), SecurityConstants.DEFAULT_AMOUNT])!);

  if (!_.isArray(scenes) || _.isEmpty(scenes)) {
    return res.json({ videoSceneIds: [] });
  }

  try {
    const validSceneIds = _.map(scenes, REFACTOR_CONSTANTS.AVG_ID_KEY);
    let lastIssues: string[] = [];
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
      const correction = _.isEmpty(lastIssues)
        ? ""
        : `\n\nThe previous response was invalid: ${jsonUtils.safeStringify(lastIssues)}. Return the complete JSON object again; do not return a patch.`;
      const response = await generateContentWithRetry({
        contents: `${getVideoSceneSelectionPrompt(jsonUtils.safeStringify(scenes), maxVideos)}${correction}`,
        config: { responseMimeType: CONTENT_TYPES.JSON },
      });
      const parsed = safeParseJSON(response.text, { videoSceneIds: [] });
      const videoSceneIds = _.get(parsed, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY);
      lastIssues = _.compact([
        !_.isPlainObject(parsed) && "response:object_required",
        !_.isArray(videoSceneIds) && "videoSceneIds:array_required",
        _.isArray(videoSceneIds) && _.gt(videoSceneIds.length, maxVideos) && `videoSceneIds:too_many:${videoSceneIds.length}/${maxVideos}`,
        _.isArray(videoSceneIds) && _.uniq(videoSceneIds).length !== videoSceneIds.length && "videoSceneIds:duplicate",
        ..._.map(
          _.reject(_.castArray(videoSceneIds), (sceneId) => _.includes(validSceneIds, sceneId)),
          (sceneId) => `videoSceneIds:unknown:${sceneId}`,
        ),
      ]);
      if (_.isEmpty(lastIssues)) return res.json({ videoSceneIds });
    }
    throw createAppError(`${CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR}:${_.join(lastIssues, ",")}`);
  } catch (error: any) {
    logger.error(LogEvent.VIDEO_SCENE_SELECTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: error.message, retryable: true, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.SEARCH_ARCHIVAL_IMAGE, async (req: Request, res: Response) => {
  const query = _.trim(_.toString(req.body?.query));
  const headless = req.body?.chromeHeadless !== false;
  const excludeSourceUrls = _.take(_.filter(_.castArray(req.body?.excludeSourceUrls), _.isString), 10);
  try {
    if (_.isEmpty(query)) return res.status(400).json({ success: false, warning: "archival_search_query_missing" });
    const browserSession = await getOrLaunchGlobalBrowser(req.body?.chromeHeadless, true);
    const result = await searchArchivalImageWithChrome(query, headless, browserSession.context, excludeSourceUrls);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (sharedBrowserError) {
    appWarn("Shared Chrome archival search failed; retrying in an isolated browser session.", sharedBrowserError);
    try {
      const result = await searchArchivalImageWithChrome(query, headless, undefined, excludeSourceUrls);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (isolatedBrowserError) {
      appWarn("Archival image search failed; scene will use AI generation.", isolatedBrowserError);
      return res.status(503).json({ success: false, warning: "archival_search_unavailable" });
    }
  }
});

router.post(ROUTER_PATHS.VALIDATE_SCENE_IMAGE, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const assetUrl = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY));
  const sceneId = _.toString(_.get(req.body, "sceneId", REFACTOR_CONSTANTS.UNKNOWN_SCENE_ID));
  const sceneScript = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY));
  const imagePrompt = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_PROMPT_KEY));
  const visualIntent = _.toString(_.get(req.body, "visualIntent"));
  const visibleAction = _.toString(_.get(req.body, "visibleAction"));
  const storyEvidence = _.toString(_.get(req.body, "storyEvidence"));
  const archivalSourceUrl = _.toString(_.get(req.body, "archivalSourceUrl"));
  const archivalLicense = _.toString(_.get(req.body, "archivalLicense"));
  const expectedSubjectCount = _.toInteger(_.get(req.body, "expectedSubjectCount", 0)) || undefined;
  const allowBackgroundPeople = Boolean(_.get(req.body, "allowBackgroundPeople"));
  const referenceAssetUrl = _.toString(_.get(req.body, "referenceAssetUrl"));
  const referenceAssetUrls = _.take(_.filter(_.castArray(_.get(req.body, "referenceAssetUrls", [])), _.isString), SCENE_REFERENCE_CONFIG.MAX_IMAGES);
  const requestedQaPurpose = _.get(req.body, "qaPurpose");
  const qaPurpose = _.includes(["thumbnail", "video"], requestedQaPurpose) ? requestedQaPurpose : "scene";
  const expectedHeadline = _.toString(_.get(req.body, "expectedHeadline"));
  const layoutId = _.toString(_.get(req.body, "layoutId"));
  const typographyId = _.toString(_.get(req.body, "typographyId"));
  const adjacentAssetUrls = _.take(_.filter(_.castArray(_.get(req.body, "adjacentAssetUrls", [])), _.isString), 2);

  if (_.isEmpty(assetUrl)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.ERR_VISUAL_QA_ASSET_REQUIRED });
  }

  try {
    const encodedAssets = await readVisualQaAssets(assetUrl);
    if (_.isEmpty(encodedAssets)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.ERR_VISUAL_QA_ASSET_INVALID });

    const qaNarrativeEvidence = _.join(
      _.compact([
        sceneScript,
        visualIntent && `VISUAL INTENT: ${visualIntent}`,
        visibleAction && `VISIBLE ACTION: ${visibleAction}`,
        storyEvidence && `STORY EVIDENCE: ${storyEvidence}`,
        archivalSourceUrl && `AUTHENTIC SOURCE PAGE: ${archivalSourceUrl}`,
        archivalLicense && `DECLARED LICENSE: ${archivalLicense}`,
      ]),
      "\n",
    );
    const parts: any[] = [
      {
        text: getSceneImageQualityPrompt(
          sceneId,
          qaNarrativeEvidence,
          imagePrompt,
          expectedSubjectCount,
          qaPurpose,
          expectedHeadline,
          layoutId,
          typographyId,
          allowBackgroundPeople,
        ),
      },
    ];
    _.forEach(encodedAssets, (encodedImage) => parts.push({ inlineData: encodedImage }));
    const qualityReferences = _.take(_.uniq(_.compact([referenceAssetUrl, ...referenceAssetUrls])), SCENE_REFERENCE_CONFIG.MAX_IMAGES);
    for (const qualityReference of qualityReferences) {
      const encodedReference = readEncodedProjectImage(qualityReference);
      if (encodedReference) {
        parts.push({ text: SCENE_QA_REFERENCE_DIRECTIVE });
        parts.push({ inlineData: encodedReference });
      }
    }
    for (const adjacentAssetUrl of adjacentAssetUrls) {
      const encodedAdjacent = readEncodedProjectImage(adjacentAssetUrl);
      if (encodedAdjacent) {
        parts.push({
          text: "The next image is an adjacent scene supplied only to detect accidental near-duplicate composition. Do not use it as a character or style reference. If the candidate repeats substantially the same subject placement, action, background, camera distance and composition while the narration has changed, add near_duplicate_adjacent_scene to blockingErrors and set usableForVideo=false.",
        });
        parts.push({ inlineData: encodedAdjacent });
      }
    }
    const response = await generateContentWithRetry({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: VISUAL_QA_RESPONSE_SCHEMA },
      task: { capability: AiTaskCapability.VisualQa },
    });
    const quality = parseAiJsonArtifact(response.text, VISUAL_QA_RESPONSE_SCHEMA, "invalid_visual_qa_response");
    const result = { success: true, quality, rotationLogs: response.rotationLogs };
    setCache(API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE, req.body, result);
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.VISUAL_QA_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/storyboard", async (req: Request, res: Response) => {
  const {
    chapters,
    config = {},
    visualStyle,
    referenceStyle,
    referenceCharacter,
    referenceCharacters,
    referenceImages,
    bypassCache,
    voiceDuration,
    cinematicClipCount: requestedCinematicClipCount,
  } = req.body;
  const normalizedRequestedClipCount = _.toInteger(requestedCinematicClipCount);
  const isCinematicStoryboard = _.gt(normalizedRequestedClipCount, 0) || isCinematicEpisodeGenre(config?.genre) || _.includes(["single", "series"], _.toString(config?.filmFormat));
  const rawRewrittenScript = _.toString(req.body.rewrittenScript);
  const rewrittenScript = rawRewrittenScript;

  let syncedChapters = chapters;

  let characterRef: string | undefined = undefined;
  const rawRefChars = referenceCharacters || referenceCharacter;
  if (rawRefChars) {
    if (typeof rawRefChars === "string") characterRef = rawRefChars.trim() || undefined;
    else {
      characterRef = jsonUtils.safeStringify(rawRefChars);
    }
  }
  const parsedReferenceCharacters = _.attempt(JSON.parse, characterRef || "[]");
  const referenceCharacterIds = new Set(_.map(_.isArray(parsedReferenceCharacters) ? parsedReferenceCharacters : [], (character) => _.trim(_.toString(character?.id))));
  const isVi = config?.language === ProjectLanguage.VI;
  const splitStrategy = config?.splitStrategy || SplitStrategy.LONG_SENTENCE;

  let chosenDuration = voiceDuration;
  if (!chosenDuration) {
    const wordCount = _.filter((rewrittenScript || "").split(/\s+/), Boolean).length;
    const speed = config?.speed || STORYBOARD_FALLBACK_CONFIG.DEFAULT_VOICE_SPEED;
    chosenDuration = Math.round(wordCount / STORYBOARD_FALLBACK_CONFIG.ESTIMATED_WORDS_PER_SECOND / speed);
    chosenDuration = _.max([chosenDuration, STORYBOARD_FALLBACK_CONFIG.MIN_TOTAL_DURATION_SECONDS]);
  }

  let activeStyle = referenceStyle || "";
  if (!activeStyle && visualStyle && stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords])
    activeStyle = stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords];

  const cached = checkCache(API_ROUTES.PIPELINE_STORYBOARD, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const aiProviderAvailable = await isAiProviderAvailable();

  try {
    let mappedDensity: SceneDensity = SceneDensity.CAU_DAI;
    if (_.includes([SplitStrategy.WORD, SplitStrategy.ULTRADENSE], splitStrategy as SplitStrategy)) {
      mappedDensity = SceneDensity.THEO_TU;
    } else if (_.includes([SplitStrategy.SHORT_SENTENCE, SplitStrategy.HYPERDENSE, SplitStrategy.HIGHPACED], splitStrategy as SplitStrategy)) {
      mappedDensity = SceneDensity.CAU_NGAN;
    } else if (splitStrategy === SplitStrategy.MIXED_SENTENCES) mappedDensity = SceneDensity.CAU_KET_HOP;
    else if (_.includes([SplitStrategy.SENTENCE, SplitStrategy.LONG_SENTENCE], splitStrategy as SplitStrategy)) {
      mappedDensity = SceneDensity.CAU_DAI;
    } else {
      mappedDensity = SceneDensity.THEO_DOAN;
    }

    const genre = config?.genre || VideoGenre.STORYTELLING;
    if (isCinematicStoryboard) {
      const configuredDurationSeconds = parseTargetDurationSeconds(config?.duration);
      if (_.gt(configuredDurationSeconds, 0)) chosenDuration = configuredDurationSeconds;
    }
    const storyboardClipDurationSeconds = resolveCinematicClipDuration(config?.videoDuration);
    const cinematicClipCount = isCinematicStoryboard
      ? _.gt(normalizedRequestedClipCount, 0)
        ? normalizedRequestedClipCount
        : _.max([1, Math.ceil(_.toNumber(chosenDuration) / storyboardClipDurationSeconds)])
      : undefined;
    let genreVisualGuideline =
      GENRE_VISUAL_GUIDELINES[genre as VideoGenre] ||
      `CRITICAL VISUAL DIRECTIVE - ${genre.toUpperCase()} GENRE:
- Maintain context consistency and ensure the image details align with a ${genre} theme.`;
    genreVisualGuideline = `${genreVisualGuideline}\n${createGenreEditorialDirective(genre)}\n${createAudienceMarketDirective(config?.language, config?.audience)}\n${createStoryboardRetentionDirective(chosenDuration, genre)}`;

    const storyboardLogger = new StepLogger();
    const storyboardLogs = storyboardLogger.getLogs();
    const logStoryboardStep = (msg: string) => storyboardLogger.log(msg);

    logStoryboardStep(getPipelineLog("STORY_STEP1", isVi));
    const visualBiblePrompt = getGlobalVisualBiblePrompt(rewrittenScript, genre, visualStyle, activeStyle, characterRef);

    const bibleParts: any[] = [];
    if (referenceImages && _.isArray(referenceImages) && !_.isEmpty(referenceImages)) {
      for (const imgBase64 of _.take(referenceImages, SCENE_REFERENCE_CONFIG.MAX_IMAGES)) {
        try {
          const { data, mimeType } = await readStyleReferenceImage(imgBase64);
          bibleParts.push({
            inlineData: {
              data,
              mimeType,
            },
          });
        } catch (referenceError) {
          appWarn(STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR, referenceError);
        }
      }
    }

    bibleParts.push({
      text: visualBiblePrompt + (referenceImages && !_.isEmpty(referenceImages) ? VISUAL_BIBLE_REFERENCE_PROMPT : ""),
    });

    let visualBible: VisualBible = {
      characterSpecs: characterRef || "",
      landscapeSpecs: "",
      visualStyle: activeStyle || visualStyle,
      colorPalette: "",
      lightingMood: "",
      lineStyle: "",
      colorMode: "",
      shading: "",
      background: _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, config?.styleBackgroundMode, BACKGROUND_MODE_CONFIG.DIRECTIVES.contextual),
      textPolicy: _.get(TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES, config?.styleTextInImageMode, TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES.auto),
      locations: [],
      props: [],
    };
    if (!isCinematicStoryboard) {
      if (!aiProviderAvailable) throw createAppError(PIPELINE_SERVER_ERRORS.VISUAL_BIBLE_INVALID);
      const bibleResponse = await generateContentWithRetry({
        contents: bibleParts,
        config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: VISUAL_BIBLE_RESPONSE_SCHEMA },
      });
      const parsedVisualBible = parseAiJsonArtifact<VisualBible>(bibleResponse.text, VISUAL_BIBLE_RESPONSE_SCHEMA, "invalid_visual_bible_response");
      const requiredVisualBibleTextFields: Array<keyof VisualBible> = [
        "colorPalette",
        "characterSpecs",
        "landscapeSpecs",
        "lightingMood",
        "visualStyle",
        "background",
        "lineStyle",
        "colorMode",
        "shading",
        "textPolicy",
      ];
      const visualBibleIsComplete =
        _.isPlainObject(parsedVisualBible) &&
        _.every(requiredVisualBibleTextFields, (field) => !_.isEmpty(_.trim(_.toString(parsedVisualBible[field])))) &&
        _.isArray(parsedVisualBible.locations) &&
        !_.isEmpty(parsedVisualBible.locations) &&
        _.isArray(parsedVisualBible.props);
      if (!visualBibleIsComplete) throw createAppError(PIPELINE_SERVER_ERRORS.VISUAL_BIBLE_INVALID);
      visualBible = parsedVisualBible;
      if (bibleResponse.rotationLogs) storyboardLogs.push(...bibleResponse.rotationLogs);
    }
    if (!_.isEmpty(visualBible)) {
      logStoryboardStep(
        `${getPipelineLog("STORY_STEP1_DONE", isVi)} ${visualBible.colorPalette}. Character Spec: ${visualBible.characterSpecs}. Landscape Spec: ${visualBible.landscapeSpecs}`,
      );
    }

    logStoryboardStep(`${getPipelineLog("STORY_STEP2", isVi)} ${mappedDensity}...`);
    let allScenes: any[] = [];
    let splitStoryboardQa: Partial<StoryboardQualityReport> | undefined;

    try {
      logStoryboardStep(getBilingualMessage("STORYBOARD_SPLITTING_GEMINI"));

      const splitPrompt = isCinematicStoryboard
        ? getCinematicStoryboardRecoveryPrompt(
            rewrittenScript,
            jsonUtils.safeStringify(syncedChapters),
            cinematicClipCount || SecurityConstants.DEFAULT_AMOUNT,
            storyboardClipDurationSeconds,
            isVi,
          )
        : getScriptSplitPrompt(rewrittenScript, jsonUtils.safeStringify(syncedChapters), splitStrategy, isVi);

      const cinematicSplitSchema = cinematicClipCount
        ? ({
            type: "object",
            additionalProperties: false,
            required: ["scenes"],
            properties: {
              scenes: {
                type: "array",
                minItems: cinematicClipCount,
                maxItems: cinematicClipCount,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "chapterId", "script", "subtitle"],
                  properties: {
                    id: { type: "string" },
                    chapterId: { type: "string" },
                    script: { type: "string" },
                    subtitle: { type: "string" },
                  },
                },
              },
            },
          } as const)
        : undefined;

      const splitResponse = await generateContentWithRetry({
        contents: splitPrompt,
        config: {
          responseMimeType: "application/json",
          ...(cinematicSplitSchema ? { responseJsonSchema: cinematicSplitSchema } : {}),
        },
      });

      const splitData = safeParseJSON(splitResponse.text, { scenes: [] });
      let splitScenes = splitData.scenes || [];
      splitStoryboardQa = isCinematicStoryboard ? splitData.storyboardQa : undefined;
      if (splitResponse.rotationLogs) storyboardLogs.push(...splitResponse.rotationLogs);
      const validChapterIds = new Set(_.map(_.castArray(syncedChapters), (chapter: any) => _.toString(chapter?.id)));

      if (
        !_.isArray(splitScenes) ||
        _.isEmpty(splitScenes) ||
        !_.every(splitScenes, (s: any) => _.every([s.id, s.chapterId, s.script], (value) => !_.isEmpty(_.trim(_.toString(value))))) ||
        !_.every(splitScenes, (scene: any) => validChapterIds.has(_.toString(scene.chapterId))) ||
        _.uniq(_.map(splitScenes, (scene: any) => _.trim(_.toString(scene.id)))).length !== splitScenes.length ||
        (isCinematicStoryboard && !_.isEqual(splitScenes.length, cinematicClipCount))
      ) {
        throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
      }

      if (isCinematicStoryboard) {
        allScenes = splitScenes;
      } else {
        logStoryboardStep(getBilingualMessage("STORYBOARD_GENERATING_DETAILS_BATCH", splitScenes.length));

        const batchSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_OPTIMIZE;
        const chunks = _.chunk(splitScenes, batchSize);
        const detailedScenesMap = new Map<string, any>();

        for (let i = 0; i < chunks.length; i++) {
          const chunkScenes = chunks[i];
          logStoryboardStep(getBilingualMessage("STORYBOARD_PROCESSING_BATCH", i + 1, chunks.length));

          const minimalScenesJson = jsonUtils.safeStringify(
            _.map(chunkScenes, (s: any) => ({
              id: s.id,
              chapterId: s.chapterId,
              script: s.script,
              subtitle: s.subtitle,
            })),
            null,
            2,
          );

          const hasStyleReference = hasValidImages(config?.styleReferenceImages);
          const hasSceneReference = hasValidImages(referenceImages) || hasValidImages(config?.referenceImages) || hasValidImages(config?.sceneReferenceImages);

          const batchPrompt = getSceneDetailBatchPrompt(
            minimalScenesJson,
            visualStyle,
            activeStyle,
            characterRef,
            visualBible.characterSpecs,
            visualBible.landscapeSpecs,
            isVi,
            genre,
            genreVisualGuideline,
            config?.aspectRatio || AspectRatio.SixteenNine,
            config?.styleBackgroundMode ? (BACKGROUND_MODE_CONFIG.DIRECTIVES as any)[config.styleBackgroundMode] : undefined,
            config?.styleTextInImageMode ? (TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES as any)[config.styleTextInImageMode] : undefined,
            config?.imageFocusMode ? resolveImageFocusDirective(config.imageFocusMode, config.styleBackgroundMode) : undefined,
            hasStyleReference,
            hasSceneReference,
          );

          try {
            const batchResponse = await generateContentWithRetry({
              contents: batchPrompt,
              config: {
                responseMimeType: "application/json",
              },
            });

            const batchData = safeParseJSON(batchResponse.text, { scenes: [] });
            const batchScenes = batchData.scenes || [];
            if (batchResponse.rotationLogs) storyboardLogs.push(...batchResponse.rotationLogs);

            const expectedIds = _.map(chunkScenes, (scene) => _.toString(scene.id));
            const returnedIds = _.map(batchScenes, (scene) => _.toString(scene.id));
            const responseIsComplete =
              _.isArray(batchScenes) &&
              _.isEqual(_.size(batchScenes), _.size(chunkScenes)) &&
              _.isEmpty(_.difference(expectedIds, returnedIds)) &&
              _.isEmpty(_.difference(returnedIds, expectedIds)) &&
              _.every(batchScenes, (scene) => {
                const sourceScene = _.find(chunkScenes, { id: scene.id });
                return (
                  Boolean(sourceScene) &&
                  _.isEqual(scene.chapterId, sourceScene.chapterId) &&
                  _.isEqual(scene.script, sourceScene.script) &&
                  _.isEqual(scene.subtitle, sourceScene.subtitle) &&
                  _.isArray(scene.characterIds) &&
                  _.uniq(_.map(scene.characterIds, _.toString)).length === scene.characterIds.length &&
                  _.every(scene.characterIds, (id) => referenceCharacterIds.has(_.trim(_.toString(id)))) &&
                  _.every(["prompt", "cameraMotion", "effects", "lightingEffect", "transition"], (field) => !_.isEmpty(_.trim(_.toString(_.get(scene, field)))))
                );
              });
            if (!responseIsComplete) throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);

            for (const bs of batchScenes) {
              detailedScenesMap.set(bs.id, bs);
            }
          } catch (batchErr: any) {
            logger.error("STORYBOARD_BATCH_GEN_ERROR", i + 1, batchErr.message);
            if (batchErr.rotationLogs) storyboardLogs.push(...batchErr.rotationLogs);
            throw batchErr;
          }

          if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
        }

        allScenes = _.map(splitScenes, (scene: any) => {
          const details = detailedScenesMap.get(scene.id);
          if (!details) throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
          return details;
        });
      }
    } catch (e: any) {
      logger.error(LogEvent.ERROR_GENERATING_STORYBOARD_CHUNKING, e);
      if (e.rotationLogs) storyboardLogs.push(...e.rotationLogs);
      throw e;
    }

    logStoryboardStep(getPipelineLog("STORY_STEP3", isVi));
    if (allScenes.length > 0) {
      try {
        logStoryboardStep(`${getPipelineLog("STORY_REFINE_SUCCESS", isVi)} ${allScenes.length} prompts.`);
      } catch (refineErr: any) {
        logStoryboardStep(`${getPipelineLog("STORY_REFINE_ERROR", isVi)} ${refineErr.message}.`);
      }
    }

    logStoryboardStep(getPipelineLog("STORY_DONE_ALL", isVi));
    if (_.isEmpty(allScenes)) {
      throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
    }
    let data: any = { scenes: allScenes, visualBible, rotationLogs: storyboardLogs };

    if (!data || !data.scenes || _.isEmpty(data.scenes)) {
      throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
    }

    if (!isCinematicStoryboard && chosenDuration && data.scenes && data.scenes.length > 0) {
      const scenes = data.scenes;
      const wordCounts = _.map(scenes, (s: any) => _.filter((s.script || "").split(/\s+/), Boolean).length);
      const totalWords = _.reduce(wordCounts, (a: number, b: number) => a + b, 0);

      let currentSecs = 0;
      for (let i = 0; i < scenes.length; i++) {
        const wCount = wordCounts[i];
        let duration: number = STORYBOARD_FALLBACK_CONFIG.MIN_SCENE_DURATION_SECONDS;
        if (totalWords > 0) {
          duration = Math.round((wCount / totalWords) * chosenDuration);
          duration = _.max([duration, STORYBOARD_FALLBACK_CONFIG.MIN_SCENE_DURATION_SECONDS]);
        }
        if (i === scenes.length - 1) duration = _.max([STORYBOARD_FALLBACK_CONFIG.MIN_SCENE_DURATION_SECONDS, chosenDuration - currentSecs]);

        const startSecs = currentSecs;
        const endSecs = currentSecs + duration;
        currentSecs = endSecs;

        scenes[i].duration = duration;
        scenes[i].startTime = formatTime(startSecs);
        scenes[i].endTime = formatTime(endSecs);
      }
    }

    const storyboardQaScenes = isCinematicStoryboard ? _.map(data.scenes, (scene) => ({ ...scene, duration: storyboardClipDurationSeconds })) : data.scenes;
    const storyboardQaBase = applyDeterministicStoryboardCoverage(
      normalizeStoryboardQuality(splitStoryboardQa || {}),
      rewrittenScript,
      storyboardQaScenes,
      isVi ? SCRIPT_SPEECH_RATE_CONFIG.VIETNAMESE_WORDS_PER_MINUTE : SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE,
    );
    if (isCinematicStoryboard) {
      const normalizedStoryboardScript = _.replace(
        _.trim(
          _.join(
            _.map(data.scenes, (scene) => _.toString(scene.script)),
            " ",
          ),
        ),
        /\s+/g,
        " ",
      );
      const normalizedSourceScript = _.replace(_.trim(rewrittenScript), /\s+/g, " ");
      const chapterIds = new Set(_.map(_.castArray(syncedChapters), (chapter: any) => _.toString(chapter?.id)));
      const sceneIds = _.map(data.scenes, (scene) => _.trim(_.toString(scene.id)));
      const underfilledSceneIds = getUnderfilledCinematicSceneIds(data.scenes, rewrittenScript, cinematicClipCount);
      const blockingErrors = _.uniq(
        _.compact([
          _.uniq(sceneIds).length !== sceneIds.length && "storyboard_scene_ids_not_unique",
          _.some(data.scenes, (scene) => _.isEmpty(_.trim(_.toString(scene.script)))) && "storyboard_scene_script_missing",
        ]),
      );
      data.storyboardQa = {
        ...storyboardQaBase,
        blockingErrors,
        warnings: _.uniq(
          _.compact([
            ...storyboardQaBase.warnings,
            ..._.map(storyboardQaBase.blockingErrors, (issue) => `storyboard_ai_advisory:${issue}`),
            cinematicClipCount && data.scenes.length !== cinematicClipCount && `storyboard_clip_count_advisory:${data.scenes.length}/${cinematicClipCount}`,
            !_.isEqual(normalizedStoryboardScript, normalizedSourceScript) && "storyboard_script_partition_advisory",
            _.some(data.scenes, (scene) => !chapterIds.has(_.toString(scene.chapterId))) && "storyboard_unknown_chapter_id_advisory",
            !_.isEmpty(underfilledSceneIds) && `storyboard_underfilled_scenes_advisory:${_.join(underfilledSceneIds, ",")}`,
            storyboardQaBase.scriptCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.SCRIPT_COVERAGE_WARNING : "",
            storyboardQaBase.pacingCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.PACING_COVERAGE_WARNING : "",
          ]),
        ),
        passed: _.isEmpty(blockingErrors),
      };
    } else {
      data.storyboardQa = {
        ...storyboardQaBase,
        blockingErrors: [],
        warnings: _.uniq(
          _.compact([
            ADVISORY_QA_CONFIG.STORYBOARD_SKIPPED_WARNING,
            storyboardQaBase.scriptCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.SCRIPT_COVERAGE_WARNING : "",
            storyboardQaBase.pacingCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.PACING_COVERAGE_WARNING : "",
          ]),
        ),
        passed: true,
      };
    }

    setCache(API_ROUTES.PIPELINE_STORYBOARD, req.body, data);
    res.json(data);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_STORYBOARD_GEMINI, error);

    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.STORYBOARD_GENERATION_FAILED,
      retryable: true,
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/seo", async (req: Request, res: Response) => {
  const { config = {}, seoConfig = {}, rewrittenScript, bypassCache } = req.body;

  const cached = checkCache(API_ROUTES.PIPELINE_SEO, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const numTitles = seoConfig.numTitles || 3;
  const numDescriptions = seoConfig.numDescriptions || 2;
  const numHashtags = seoConfig.numHashtags || 5;
  const numTags = seoConfig.numTags || 6;
  const isCinematicSeo = isCinematicEpisodeGenre(config.genre || req.body?.genre || req.body?.project?.config?.genre);

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.SEO_GENERATION_FAILED,
      retryable: true,
    });
  }

  const seoLogger = new StepLogger();
  const seoLogs = seoLogger.getLogs();
  const logSeoStep = (msg: string) => seoLogger.log(msg);

  try {
    const isVi = config.language === ProjectLanguage.VI;
    const seoRequestId = createCinematicArtifactRequestId(req.body?.pipelineRunId, CINEMATIC_ARTIFACT_TYPE.SEO);

    logSeoStep(PIPELINE_LOGS.SEO_STEP1);

    const genre = config.genre || req.body?.genre || req.body?.project?.config?.genre;
    const combinedSeoPrompt = isCinematicSeo
      ? getCinematicSeoPrompt(rewrittenScript, isVi, numTitles, numDescriptions, numHashtags, numTags, genre, config.audience, seoRequestId)
      : `${getSeoOptimizationPrompt(rewrittenScript, isVi, numTitles, numDescriptions, numHashtags, numTags, genre)}\n\n${createAudienceMarketDirective(config.language, config.audience)}`;

    let seoResult: any;
    let seoIssues: string[] = [];
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
      const correctionDirective = _.isEmpty(seoIssues)
        ? ""
        : `\n\nThe previous response failed these checks: ${jsonUtils.safeStringify(seoIssues)}. Return the complete metadata JSON again from the beginning; do not return a patch.`;
      const combinedResponse = await generateContentWithRetry({
        contents: `${combinedSeoPrompt}${correctionDirective}`,
        config: {
          responseMimeType: "application/json",
          roomCompletionMarker: isCinematicSeo ? CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER : undefined,
          roomArtifactType: isCinematicSeo ? CINEMATIC_ARTIFACT_TYPE.SEO : undefined,
          roomRequestId: isCinematicSeo ? seoRequestId : undefined,
        },
        task: { capability: AiTaskCapability.TextPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.THUMBNAIL) },
      });
      const candidate = safeParseJSON(combinedResponse.text, undefined);
      const expectedKeys = isCinematicSeo
        ? ["artifactType", "requestId", "titles", "descriptions", "hashtags", "tags", "completionMarker"]
        : ["keywords", "titles", "descriptions", "hashtags", "tags"];
      seoIssues = _.compact([
        !_.isPlainObject(candidate) && "response:object_required",
        !_.isEqual(_.sortBy(_.keys(candidate)), _.sortBy(expectedKeys)) && "response:exact_keys_required",
        !_.isEqual(_.size(candidate?.titles), numTitles) && `titles:wrong_count:${_.size(candidate?.titles)}/${numTitles}`,
        !_.isEqual(_.size(candidate?.descriptions), numDescriptions) && `descriptions:wrong_count:${_.size(candidate?.descriptions)}/${numDescriptions}`,
        !_.isEqual(_.size(candidate?.hashtags), numHashtags) && `hashtags:wrong_count:${_.size(candidate?.hashtags)}/${numHashtags}`,
        !_.isEqual(_.size(candidate?.tags), numTags) && `tags:wrong_count:${_.size(candidate?.tags)}/${numTags}`,
        _.some(_.castArray(candidate?.titles), (item) => !_.isPlainObject(item) || _.isEmpty(_.trim(_.toString(item?.text)))) && "titles:invalid_item",
        _.some(_.castArray(candidate?.descriptions), (item) => !_.isPlainObject(item) || _.isEmpty(_.trim(_.toString(item?.text)))) && "descriptions:invalid_item",
        _.some(_.castArray(candidate?.hashtags), (item) => !_.isString(item) || _.isEmpty(_.trim(item))) && "hashtags:invalid_item",
        _.some(_.castArray(candidate?.tags), (item) => !_.isString(item) || _.isEmpty(_.trim(item))) && "tags:invalid_item",
        isCinematicSeo && !_.isEqual(candidate?.artifactType, CINEMATIC_ARTIFACT_TYPE.SEO) && "artifact:type_mismatch",
        isCinematicSeo && !_.isEqual(candidate?.requestId, seoRequestId) && "artifact:request_mismatch",
        isCinematicSeo && !_.isEqual(candidate?.completionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER) && "artifact:completion_marker_mismatch",
      ]);
      if (combinedResponse.rotationLogs) seoLogs.push(...combinedResponse.rotationLogs);
      if (_.isEmpty(seoIssues)) {
        seoResult = candidate;
        break;
      }
    }
    if (!seoResult) throw createAppError(`${CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR}:${_.join(seoIssues, ",")}`);

    logSeoStep(`${PIPELINE_LOGS.SEO_STEP1_DONE} ${(seoResult.keywords || []).join(", ") || "None"}`);

    logSeoStep(PIPELINE_LOGS.SEO_STEP2);
    logSeoStep(PIPELINE_LOGS.SEO_STEP2_DONE);

    logSeoStep(PIPELINE_LOGS.SEO_STEP3);
    logSeoStep(PIPELINE_LOGS.SEO_DONE_ALL);

    const parsedData = isCinematicSeo
      ? { ...seoResult, rotationLogs: seoLogs }
      : {
          ...seoResult,
          rotationLogs: seoLogs,
        };

    setCache(API_ROUTES.PIPELINE_SEO, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_SEO, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.SEO_GENERATION_FAILED,
      retryable: true,
      rotationLogs: _.castArray(error.rotationLogs),
    });
  }
});

router.post("/thumbnails", async (req: Request, res: Response) => {
  const { rewrittenScript, config = {}, visualConfig = {}, bypassCache } = req.body;

  const thumbnailCachePayload = { ...req.body, layoutProfileVersion: THUMBNAIL_PROMPT_CONFIG.LAYOUT_PROFILE_VERSION };
  const cached = checkCache(API_ROUTES.PIPELINE_THUMBNAILS, thumbnailCachePayload, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const thumbnailCount = _.toInteger(visualConfig.thumbnailCount) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_COUNT;
  const isCinematicThumbnail = isCinematicEpisodeGenre(config.genre || req.body?.genre);
  const thumbnailTextMode = _.isEqual(visualConfig.thumbnailTextInImageMode, ThumbnailTextMode.NoText) ? ThumbnailTextMode.NoText : ThumbnailTextMode.Headline;
  const hasThumbReference = hasValidImages(visualConfig.thumbnailReferenceImages) || hasValidImages(visualConfig.thumbnailSceneReferenceImages);
  const hasStyleRef = hasValidImages(visualConfig.styleReferenceImages);
  const refImageStr = hasThumbReference
    ? "Strict visual match: accurately follow the exact art style, character design, medium, and aesthetic of the uploaded reference image."
    : hasStyleRef
      ? "Strict visual match: accurately follow the exact art style and aesthetic of the uploaded style reference image."
      : visualConfig.thumbnailReferencePrompt || "Dynamically craft the visual art style and medium to match the story's emotional tone and genre.";

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.THUMBNAIL_PLANNING_FAILED,
      retryable: true,
    });
  }

  const thumbLogger = new StepLogger();
  const thumbLogs = thumbLogger.getLogs();
  const logThumbStep = (msg: string) => thumbLogger.log(msg);

  try {
    const isVi = config.language === ProjectLanguage.VI;
    const thumbnailRequestId = createCinematicArtifactRequestId(req.body?.pipelineRunId, CINEMATIC_ARTIFACT_TYPE.THUMBNAILS);

    logThumbStep(PIPELINE_LOGS.THUMB_STEP1);

    const thumbnailBackgroundDirective = visualConfig?.thumbnailBackgroundMode ? _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, visualConfig.thumbnailBackgroundMode, "") : "";
    const thumbnailFocusDirective = visualConfig?.thumbnailImageFocusMode
      ? resolveImageFocusDirective(visualConfig.thumbnailImageFocusMode, visualConfig.thumbnailBackgroundMode)
      : "";
    const thumbnailCharacters = createPromptCharacterCards(_.defaultTo(visualConfig?.characters, []));
    const combinedThumbnailsPrompt = isCinematicThumbnail
      ? getCinematicThumbnailPrompt({
          requestId: thumbnailRequestId,
          rewrittenScript,
          thumbnailCount,
          referenceDirection: visualConfig.thumbnailReferencePrompt || "",
          isVi,
          aspectRatio: visualConfig.aspectRatio || "16:9",
          textMode: thumbnailTextMode,
          backgroundMode: visualConfig.thumbnailBackgroundMode || "auto",
          focusMode: visualConfig.thumbnailImageFocusMode || "default",
          backgroundDirective: thumbnailBackgroundDirective,
          focusDirective: thumbnailFocusDirective,
          charactersJson: _.isEmpty(thumbnailCharacters) ? "" : jsonUtils.safeStringify(thumbnailCharacters),
          genre: config.genre || "",
          writingStyle: config.writingStyle || "",
          audience: config.audience || "",
          hasThumbnailReference: hasThumbReference,
          hasStyleReference: hasStyleRef,
        })
      : getThumbnailLayoutPrompt(
          rewrittenScript,
          thumbnailCount,
          refImageStr,
          isVi,
          visualConfig.aspectRatio || "16:9",
          thumbnailTextMode,
          visualConfig.thumbnailBackgroundMode || "auto",
          visualConfig.thumbnailImageFocusMode || "default",
          thumbnailBackgroundDirective,
          thumbnailFocusDirective,
          _.isEmpty(thumbnailCharacters) ? "" : jsonUtils.safeStringify(thumbnailCharacters),
          config.genre || "",
          config.writingStyle || "",
          createGenreEditorialDirective(config.genre || ""),
          `${createAudienceMarketDirective(config.language, config.audience)}\n${createViewerRetentionDirective(config.duration || req.body?.duration || 180, config.genre || "")}`,
        );

    const thumbParts: any[] = [];
    const thumbRefList = _.take(_.compact(_.concat(_.castArray(visualConfig.thumbnailReferenceImages || []), _.castArray(visualConfig.thumbnailSceneReferenceImages || []))), 3);
    if (thumbRefList.length > 0) {
      for (const imgBase64 of thumbRefList) {
        const { data, mimeType } = await readStyleReferenceImage(imgBase64);
        thumbParts.push({
          inlineData: {
            data,
            mimeType,
          },
        });
      }
    }

    let thumbsResult: { concepts: unknown[]; thumbnails: Array<Partial<ThumbnailItem>> } = {
      concepts: [],
      thumbnails: [],
    };
    const requestParts = _.concat(thumbParts, [
      {
        text:
          combinedThumbnailsPrompt +
          (!isCinematicThumbnail && visualConfig.thumbnailReferenceImages && visualConfig.thumbnailReferenceImages.length > 0 ? THUMBNAIL_IMAGE_REFERENCE_PROMPT : ""),
      },
    ]);
    const combinedResponse = await generateContentWithRetry({
      contents: requestParts,
      config: {
        responseMimeType: "application/json",
        roomCompletionMarker: isCinematicThumbnail ? CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER : undefined,
        roomArtifactType: isCinematicThumbnail ? CINEMATIC_ARTIFACT_TYPE.THUMBNAILS : undefined,
        roomRequestId: isCinematicThumbnail ? thumbnailRequestId : undefined,
      },
      task: { capability: AiTaskCapability.Thumbnail, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.THUMBNAIL) },
    });
    const parsedResult = safeParseJSON(combinedResponse.text, {
      concepts: [],
      thumbnails: [],
    });
    const returnedThumbnailArtifactType = _.trim(_.toString(parsedResult.artifactType));
    const returnedThumbnailRequestId = _.trim(_.toString(parsedResult.requestId));
    const returnedThumbnailCompletionMarker = _.trim(_.toString(parsedResult.completionMarker));
    if (
      isCinematicThumbnail &&
      (!_.isEqual(returnedThumbnailArtifactType, CINEMATIC_ARTIFACT_TYPE.THUMBNAILS) ||
        !_.isEqual(returnedThumbnailRequestId, thumbnailRequestId) ||
        !_.isEqual(returnedThumbnailCompletionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER))
    ) {
      throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
    }
    thumbsResult = {
      concepts: _.castArray(parsedResult.concepts || []),
      thumbnails: _.castArray(parsedResult.thumbnails || []),
    };
    if (combinedResponse.rotationLogs) thumbLogs.push(...combinedResponse.rotationLogs);
    let planningIssues = isCinematicThumbnail
      ? getThumbnailTechnicalPlanningIssues(thumbsResult.thumbnails, thumbnailCount, thumbnailTextMode)
      : getThumbnailPlanningIssues(thumbsResult.thumbnails, thumbnailTextMode, thumbnailCount, refImageStr);
    if (!_.isEmpty(planningIssues)) {
      thumbLogs.push(`${ADVISORY_QA_CONFIG.THUMBNAIL_PLANNING_WARNING_PREFIX} ${_.join(planningIssues, ", ")}`);
      const repairResponse = await generateContentWithRetry({
        contents: isCinematicThumbnail
          ? getCinematicThumbnailTechnicalRepairPrompt(combinedThumbnailsPrompt, jsonUtils.safeStringify(thumbsResult), planningIssues)
          : getThumbnailContractRepairPrompt(combinedThumbnailsPrompt, jsonUtils.safeStringify(thumbsResult), planningIssues),
        config: {
          responseMimeType: "application/json",
          roomCompletionMarker: isCinematicThumbnail ? CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER : undefined,
          roomArtifactType: isCinematicThumbnail ? CINEMATIC_ARTIFACT_TYPE.THUMBNAILS : undefined,
          roomRequestId: isCinematicThumbnail ? thumbnailRequestId : undefined,
        },
        task: { capability: AiTaskCapability.Thumbnail, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.THUMBNAIL) },
      });
      const repairedResult = safeParseJSON(repairResponse.text, { concepts: [], thumbnails: [] });
      const repairedThumbnails = _.castArray(repairedResult.thumbnails || []);
      const repairedIssues = isCinematicThumbnail
        ? getThumbnailTechnicalPlanningIssues(repairedThumbnails, thumbnailCount, thumbnailTextMode)
        : getThumbnailPlanningIssues(repairedThumbnails, thumbnailTextMode, thumbnailCount, refImageStr);
      if (!_.isEmpty(repairedThumbnails) && _.isEmpty(repairedIssues)) {
        thumbsResult = { concepts: _.castArray(repairedResult.concepts || []), thumbnails: repairedThumbnails };
        planningIssues = repairedIssues;
      }
      if (repairResponse.rotationLogs) thumbLogs.push(...repairResponse.rotationLogs);
    }

    if (!_.isEmpty(planningIssues)) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: PIPELINE_SERVER_ERRORS.THUMBNAIL_PLANNING_FAILED,
        retryable: true,
        planningIssues,
        rotationLogs: thumbLogs,
      });
    }

    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP1_DONE} ${(thumbsResult.concepts || []).length || 0} layouts.`);
    logThumbStep(PIPELINE_LOGS.THUMB_STEP2);
    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP2_DONE} ${(thumbsResult.thumbnails || []).length || 0} thumbnails.`);

    logThumbStep(PIPELINE_LOGS.THUMB_STEP3);
    logThumbStep(PIPELINE_LOGS.THUMB_DONE_ALL);

    const normalizedThumbnails = normalizeThumbnailIdeas(_.castArray(thumbsResult.thumbnails || []), thumbnailCount, thumbnailTextMode);
    const parsedData = { thumbnails: normalizedThumbnails, rotationLogs: thumbLogs };

    setCache(API_ROUTES.PIPELINE_THUMBNAILS, thumbnailCachePayload, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_THUMBNAILS_PROMPTS, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: PIPELINE_SERVER_ERRORS.THUMBNAIL_PLANNING_FAILED,
      retryable: true,
      rotationLogs: _.castArray(error.rotationLogs),
    });
  }
});

router.post("/voice", requireLicense(FeatureType.VOICE), async (req: Request, res: Response) => {
  try {
    let { text, speed, voice_id, voiceURI, provider } = req.body;
    const requestedVoiceId = voice_id || voiceURI || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    const { finalVoiceId } = resolveVoiceRouting({ provider, voiceId: requestedVoiceId });

    if (!text || !text.trim()) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, error: PIPELINE_SERVER_ERRORS.VOICE_TEXT_REQUIRED });
    const keys = await resolveApiKeys();
    const apiKey = _.get(keys, "ai33Key", "");

    if (_.isEmpty(apiKey)) {
      throw createAppError(SecurityMessages.MISSING_AI33_KEY);
    }

    const formData = new FormData();
    formData.append(REFACTOR_CONSTANTS.FORM_KEY_TEXT, text);
    formData.append(REFACTOR_CONSTANTS.FORM_KEY_VOICE_ID, finalVoiceId);
    formData.append(REFACTOR_CONSTANTS.FORM_KEY_SPEED, (speed || 1).toString());
    formData.append(REFACTOR_CONSTANTS.FORM_KEY_WITH_TRANSCRIPT, REFACTOR_CONSTANTS.VALUE_FALSE);

    const ttsRes = await fetch(EXTERNAL_URLS.AI33_TTS, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.XI_API_KEY]: apiKey,
      },
      body: formData,
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      throw new Error(getMessage("TTS_API_ERROR_MSG", undefined, err));
    }

    const ttsData = await ttsRes.json();
    if (!ttsData.success || !ttsData.task_id) throw new Error(getMessage("TTS_NO_TASK_ID", undefined, jsonUtils.safeStringify(ttsData)));

    const taskId = ttsData.task_id;

    let audioUrl = null;
    let attempts = 0;
    while (attempts < TTS_POLLING_CONFIG.MAX_ATTEMPTS) {
      let pollRes;
      try {
        pollRes = await fetch(`${EXTERNAL_URLS.AI33_TASK}/${taskId}`, {
          headers: {
            [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON,
            [HTTP_HEADERS.XI_API_KEY]: apiKey,
          },
        });
      } catch (fetchErr: any) {
        logger.warn(getMessage("TTS_FETCH_POLLING_ERROR", undefined, fetchErr.message));
        attempts++;
        await waitForNextTtsPoll(attempts);
        continue;
      }

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        if (_.includes([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN], pollRes.status)) {
          throw new Error(getMessage("TTS_POLL_FAILED", undefined, errText));
        }
        logger.warn(getMessage("TTS_POLLING_FAILED_RETRYING", undefined, `${pollRes.status} - ${errText}`));
        attempts++;
        await waitForNextTtsPoll(attempts);
        continue;
      }

      const pollData = await pollRes.json();

      if (_.isEqual(pollData.status, TTS_POLLING_CONFIG.STATUS_DONE)) {
        audioUrl = pollData.metadata?.audio_url;
        break;
      } else if (_.isEqual(pollData.status, TTS_POLLING_CONFIG.STATUS_ERROR)) {
        throw new Error(getMessage("TTS_TASK_ERROR_MSG", undefined, pollData.error_message));
      }
      attempts++;
      await waitForNextTtsPoll(attempts);
    }

    if (!audioUrl) throw new Error(getMessage("TTS_TASK_TIMED_OUT"));

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(getMessage("FAILED_DOWNLOAD_AUDIO"));

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const audioBase64 = buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding);
    const mimeType = audioRes.headers.get(SecurityConstants.HEADER_CONTENT_TYPE) || MimeType.MPEG;

    const generatedCharacterCount = _.size(text);
    await incrementFeatureUsage(req, FeatureType.VOICE, generatedCharacterCount);

    res.json({
      success: true,
      audioBase64,
      mimeType,
      audioUrl: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
      provider: REFACTOR_CONSTANTS.PROVIDER_AI33,
    });
  } catch (error: any) {
    logger.error(LogEvent.TTS_PIPELINE_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      rotationLogs: error.rotationLogs,
    });
  }
});
const persistProjectVideo = async (localProjectId: string, sceneId: string, base64: string, variantIndex?: number): Promise<string> => {
  const safeProjectId = path.basename(_.toString(localProjectId));
  const safeSceneId = path.basename(_.toString(sceneId));
  if (_.some([safeProjectId, safeSceneId, base64], _.isEmpty)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, safeProjectId);
  const videoDirectory = path.resolve(projectRoot, PROJECT_ASSET_GROUP.VIDEOS);
  if (!_.startsWith(_.toLower(videoDirectory), _.toLower(`${projectRoot}${path.sep}`))) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
  const videoBuffer = Buffer.from(base64, REFACTOR_CONSTANTS.ENCODING_BASE64);
  if (_.lt(videoBuffer.length, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
  await fs.promises.mkdir(videoDirectory, { recursive: true });
  const variantSuffix = _.isNumber(variantIndex)
    ? `${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}${_.add(variantIndex, FLOW_VIDEO_MEDIA_CONFIG.VARIANT_INDEX_OFFSET)}`
    : SecurityConstants.EMPTY_STRING;
  const videoFilename = `${safeSceneId}${variantSuffix}${FLOW_VIDEO_MEDIA_CONFIG.FILE_EXTENSION}`;
  const videoPath = path.join(videoDirectory, videoFilename);
  const candidateHash = createHash(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ALGORITHM).update(videoBuffer).digest(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ENCODING);
  const existingSceneVideoFiles = _.filter(
    await fs.promises.readdir(videoDirectory),
    (filename) =>
      FLOW_VIDEO_MEDIA_CONFIG.SCENE_VIDEO_FILE_PATTERN.test(filename) &&
      !_.isEqual(filename, videoFilename) &&
      !_.startsWith(filename, `${safeSceneId}${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}`),
  );
  for (const existingFilename of existingSceneVideoFiles) {
    const existingPath = path.join(videoDirectory, existingFilename);
    const existingStats = await fs.promises.stat(existingPath);
    if (!_.isEqual(existingStats.size, videoBuffer.length)) continue;
    const existingBuffer = await fs.promises.readFile(existingPath);
    const existingHash = createHash(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ALGORITHM).update(existingBuffer).digest(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ENCODING);
    if (_.isEqual(existingHash, candidateHash)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ERROR);
  }
  await fs.promises.writeFile(videoPath, videoBuffer);
  const persistedSize = (await fs.promises.stat(videoPath)).size;
  if (_.lt(persistedSize, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
  return `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${safeProjectId}/${PROJECT_ASSET_GROUP.VIDEOS}/${videoFilename}`;
};

const persistProjectVideoVariants = async (localProjectId: string, sceneId: string, base64s: string[]): Promise<string[]> => {
  if (_.lt(_.size(base64s), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INCOMPLETE_OUTPUT_BATCH_ERROR);
  const fallbackUrls: string[] = [];
  for (const [variantIndex, base64] of _.take(base64s, FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT).entries()) {
    fallbackUrls.push(await persistProjectVideo(localProjectId, sceneId, base64, variantIndex));
  }
  return fallbackUrls;
};

const createProjectVideoVariantUrl = (localProjectId: string, sceneId: string, variantIndex: number): string => {
  const safeProjectId = path.basename(_.toString(localProjectId));
  const safeSceneId = path.basename(_.toString(sceneId));
  const variantNumber = _.add(variantIndex, FLOW_VIDEO_MEDIA_CONFIG.VARIANT_INDEX_OFFSET);
  return `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${safeProjectId}/${PROJECT_ASSET_GROUP.VIDEOS}/${safeSceneId}${FLOW_VIDEO_MEDIA_CONFIG.VARIANT_SEPARATOR}${variantNumber}${FLOW_VIDEO_MEDIA_CONFIG.FILE_EXTENSION}`;
};

const getPersistedProjectVideoVariantUrl = (localProjectId: string, sceneId: string, variantIndex: number): string | undefined => {
  const candidateUrl = createProjectVideoVariantUrl(localProjectId, sceneId, variantIndex);
  const candidatePath = resolveLocalProjectAssetPath(candidateUrl);
  if (!candidatePath || !fs.existsSync(candidatePath)) return undefined;
  return _.gte(fs.statSync(candidatePath).size, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES) ? candidateUrl : undefined;
};

const persistRecoveredFlowScene = async (project: any, scene: StoryboardScene, mediaIds: string[], fallbackUrls: string[]): Promise<void> => {
  scene.assetUrl = _.head(fallbackUrls);
  scene.assetUrls = fallbackUrls;
  scene.assetType = GenerateType.Video;
  scene.assetStatus = SceneAssetStatus.Generated;
  scene.assetError = undefined;
  scene.remoteVideoDownloadPending = false;
  scene.remoteVideoMediaId = _.head(mediaIds);
  scene.remoteVideoMediaIds = mediaIds;
  scene.remoteVideoExpectedCount = _.size(mediaIds);
  const completedSceneIds = _.map(
    _.filter(project.storyboard, (candidate) => !_.isEmpty(candidate.assetUrl) || _.some(candidate.assetUrls, (assetUrl) => !_.isEmpty(assetUrl))),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const pendingSceneIds = _.map(
    _.reject(project.storyboard, (candidate) => _.includes(completedSceneIds, candidate.id)),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  const failedSceneIds = _.map(
    _.filter(project.storyboard, (candidate) => _.includes(pendingSceneIds, candidate.id) && _.isEqual(candidate.assetStatus, SceneAssetStatus.Failed)),
    REFACTOR_CONSTANTS.AVG_ID_KEY,
  );
  project.generationCheckpoint = {
    ...project.generationCheckpoint,
    phase: _.isEmpty(pendingSceneIds) ? PIPELINE_COMPLETION_CONFIG.MEDIA_COMPLETED_PHASE : PIPELINE_COMPLETION_CONFIG.MEDIA_REPAIR_PHASE,
    completedSceneIds,
    pendingSceneIds,
    failedSceneIds,
    updatedAt: new Date().toISOString(),
  };
  await saveProjectDetailToDb(project);
};

router.post("/recover-flow-video", requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const localProjectId = path.basename(_.toString(req.body?.projectId));
    const sceneId = path.basename(_.toString(req.body?.sceneId));
    const project = await getProjectDetailFromDb(localProjectId);
    const flowProjectId = _.trim(_.toString(project?.visualConfig?.flowProjectId));
    const scene = _.find(project?.storyboard, { id: sceneId });
    const persistedMediaIds = _.uniq(
      _.compact(_.map(!_.isEmpty(scene?.remoteVideoMediaIds) ? scene?.remoteVideoMediaIds : [scene?.remoteVideoMediaId], (mediaId) => _.trim(_.toString(mediaId)))),
    );
    const requestedMediaIds = _.uniq(
      _.compact(_.map(!_.isEmpty(req.body?.mediaIds) ? _.castArray(req.body.mediaIds) : [req.body?.mediaId], (mediaId) => _.trim(_.toString(mediaId)))),
    );
    const expectedOutputCount = _.defaultTo(
      scene?.remoteVideoExpectedCount,
      !_.isEmpty(scene?.remoteVideoMediaIds) ? FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT : SecurityConstants.DEFAULT_AMOUNT,
    );
    if (_.some([localProjectId, sceneId, flowProjectId], _.isEmpty) || _.isEmpty(requestedMediaIds)) {
      throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    }
    if (!scene || !_.isEqual(requestedMediaIds, persistedMediaIds)) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);

    const fallbackUrls: string[] = [];
    let recoveryWarning: string = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
    for (const [variantIndex, mediaId] of persistedMediaIds.entries()) {
      const existingVariantUrl = _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT)
        ? getPersistedProjectVideoVariantUrl(localProjectId, sceneId, variantIndex)
        : (() => {
            const existingVideoUrl = _.toString(scene.assetUrl);
            return FLOW_VIDEO_MEDIA_CONFIG.PROJECT_ASSET_URL_PATTERN.test(existingVideoUrl) && resolveLocalProjectAssetPath(existingVideoUrl) ? existingVideoUrl : undefined;
          })();
      if (existingVariantUrl) {
        fallbackUrls.push(existingVariantUrl);
        continue;
      }
      const result = await recoverExistingFlowVideo({
        flowProjectId,
        mediaId,
        expectedDuration: _.toString(project?.visualConfig?.videoDuration),
        chromeHeadless: project?.visualConfig?.chromeHeadless,
        retainBrowserSession: true,
      });
      if (!result.success || _.isEmpty(result.base64)) {
        recoveryWarning = _.defaultTo(result.warning, recoveryWarning);
        break;
      }
      fallbackUrls.push(await persistProjectVideo(localProjectId, sceneId, result.base64!, _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT) ? variantIndex : undefined));
    }
    if (_.lt(_.size(fallbackUrls), expectedOutputCount)) {
      const recoveryWasRejected = GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(recoveryWarning);
      const recoveryMediaIsStale = FLOW_VIDEO_MEDIA_CONFIG.STALE_MEDIA_PATTERN.test(recoveryWarning);
      const shouldRegenerate = recoveryWasRejected || recoveryMediaIsStale;
      scene.remoteVideoDownloadPending = !shouldRegenerate;
      scene.remoteVideoExpectedCount = expectedOutputCount;
      scene.assetStatus = SceneAssetStatus.Failed;
      scene.assetError = recoveryWarning;
      if (shouldRegenerate) {
        scene.remoteVideoMediaId = undefined;
        scene.remoteVideoMediaIds = undefined;
      }
      await saveProjectDetailToDb(project);
      return res.json({
        success: false,
        base64: null,
        fallbackUrl: SecurityConstants.EMPTY_STRING,
        fallbackUrls: [],
        warning: recoveryWarning,
        remoteMediaId: shouldRegenerate ? undefined : _.head(persistedMediaIds),
        remoteMediaIds: shouldRegenerate ? [] : persistedMediaIds,
        remoteMediaCreated: !shouldRegenerate,
      });
    }
    await persistRecoveredFlowScene(project, scene, persistedMediaIds, fallbackUrls);
    return res.json({
      success: true,
      base64: null,
      fallbackUrl: _.head(fallbackUrls),
      fallbackUrls,
      remoteMediaId: _.head(persistedMediaIds),
      remoteMediaIds: persistedMediaIds,
      remoteMediaCreated: true,
    });
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({
      success: false,
      base64: null,
      fallbackUrl: "",
      warning: getMessage("SYSTEM_ERROR", undefined, error instanceof Error ? error.message : FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR),
    });
  }
});

const activeVideoSubmissionKeys = new Set<string>();
const activeVideoProjectKeys = new Set<string>();
const completedVideoSubmissionResults = new Map<string, unknown>();

router.post("/generate-flow-video-batch", requireBatchVisualLicense, async (req: Request, res: Response) => {
  let activeVideoProjectKey = "";
  try {
    const requestedItems = _.take(
      _.map(_.castArray(req.body?.items || []), (item) => ({
        sceneId: path.basename(_.toString(item?.sceneId)),
        prompt: _.toString(item?.prompt),
        referenceImages: _.compact(_.castArray(item?.referenceImages || [])),
        referenceImageNames: _.compact(_.castArray(item?.referenceImageNames || [])),
        referenceCharacterNames: _.compact(_.castArray(item?.referenceCharacterNames || [])),
      })),
      FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH,
    );
    if (_.isEmpty(requestedItems) || _.some(requestedItems, (item) => _.isEmpty(item.sceneId) || _.isEmpty(_.trim(item.prompt)))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: BACKEND_MESSAGES.BATCH_GEN_NO_ITEMS });
    }

    const localProjectId = path.basename(_.toString(req.body?.sandboxConfig?.localProjectId));
    const localProject = await getProjectDetailFromDb(localProjectId);
    if (!localProject) return res.status(404).json({ success: false, results: [], warning: PROJECT_ASSET_INVALID_REQUEST });
    activeVideoProjectKey = localProjectId;
    if (activeVideoProjectKeys.has(activeVideoProjectKey)) {
      return res.json({ success: false, results: [], warning: FLOW_VIDEO_MEDIA_CONFIG.SUBMISSION_IN_PROGRESS_ERROR });
    }
    activeVideoProjectKeys.add(activeVideoProjectKey);

    const requestedSceneIds = new Set(_.map(requestedItems, "sceneId"));
    const requestedScenes = _.filter(localProject.storyboard || [], (scene) => requestedSceneIds.has(_.toString(scene.id)));
    if (!_.isEqual(requestedScenes.length, requestedItems.length)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: PROJECT_ASSET_INVALID_REQUEST });
    }

    const knownVideoMediaIds = _.uniq(
      _.compact(
        _.flatMap(localProject.storyboard || [], (scene) =>
          _.map(!_.isEmpty(scene.remoteVideoMediaIds) ? scene.remoteVideoMediaIds : [scene.remoteVideoMediaId], (mediaId) => _.trim(_.toString(mediaId))),
        ),
      ),
    );
    const persistedFlowProjectId = _.toString(localProject.visualConfig?.flowProjectId || req.body?.sandboxConfig?.flowProjectId);
    const results = await generateFlowVideoPromptBatchWithPlaywright({
      items: requestedItems,
      visualConfig: { ...req.body?.visualConfig, generateType: GenerateType.Video },
      sandboxConfig: {
        ...req.body?.sandboxConfig,
        localProjectId,
        flowProjectId: persistedFlowProjectId || undefined,
        knownVideoMediaIds,
      },
      retainBrowserSession: true,
    });
    const resolvedFlowProjectId = _.toString(_.find(results, (result) => !_.isEmpty(result.newProjectId))?.newProjectId || persistedFlowProjectId);
    const assignedMediaIds = new Set<string>();
    for (const result of results) {
      const scene = _.find(localProject.storyboard, { id: result.sceneId });
      const mediaIds = _.uniq(_.compact(_.map(result.remoteMediaIds || [result.remoteMediaId], (mediaId) => _.trim(_.toString(mediaId)))));
      if (!scene || _.some(mediaIds, (mediaId) => assignedMediaIds.has(mediaId) || _.includes(knownVideoMediaIds, mediaId))) {
        result.success = false;
        result.warning = FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ID_ERROR;
        continue;
      }
      _.forEach(mediaIds, (mediaId) => assignedMediaIds.add(mediaId));
      if (result.success && !_.isEmpty(mediaIds)) {
        if (!_.isEmpty(result.base64)) {
          const assetUrl = await persistProjectVideo(localProjectId, result.sceneId, result.base64!);
          scene.assetUrl = assetUrl;
          scene.assetUrls = [assetUrl];
          scene.assetType = GenerateType.Video;
          scene.assetStatus = SceneAssetStatus.Generated;
          scene.assetError = undefined;
          scene.remoteVideoDownloadPending = false;
        } else {
          scene.remoteVideoDownloadPending = true;
          scene.assetStatus = SceneAssetStatus.Generating;
          scene.assetError = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
        }
        scene.remoteVideoMediaId = _.head(mediaIds);
        scene.remoteVideoMediaIds = mediaIds;
        scene.remoteVideoExpectedCount = FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT;
      } else {
        scene.assetStatus = SceneAssetStatus.Failed;
        scene.assetError = _.defaultTo(result.warning, FLOW_DIRECT_VIDEO_CONFIG.GENERATION_REJECTED_ERROR);
      }
    }
    localProject.visualConfig = { ...localProject.visualConfig, flowProjectId: resolvedFlowProjectId || localProject.visualConfig?.flowProjectId };
    await saveProjectDetailToDb(localProject);
    const successfulCount = _.size(_.filter(results, "success"));
    if (_.gt(successfulCount, SecurityConstants.ZERO)) await incrementFeatureUsage(req, FeatureType.VIDEO, successfulCount);
    return res.json({ success: _.gt(successfulCount, SecurityConstants.ZERO), results, newProjectId: resolvedFlowProjectId });
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({ success: false, results: [], warning: error instanceof Error ? error.message : FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR });
  } finally {
    if (!_.isEmpty(activeVideoProjectKey)) activeVideoProjectKeys.delete(activeVideoProjectKey);
  }
});

router.post(ROUTER_PATHS.ENSURE_FLOW_CHARACTERS, requireLicense(FeatureType.IMAGE), async (req: Request, res: Response) => {
  try {
    const localProjectId = path.basename(_.toString(req.body?.projectId));
    const localProject = await getProjectDetailFromDb(localProjectId);
    if (!localProject) return res.status(404).json({ success: false, error: PROJECT_ASSET_INVALID_REQUEST });

    const requestedCharacters = _.map(_.castArray(req.body?.characters || []), (character) => {
      const flowPrompt = _.trim(_.toString(character?.referenceGenerationPrompt));
      const identityPrompt = _.trim(_.toString(character?.prompt || character?.description));
      return {
        id: _.trim(_.toString(character?.id)),
        name: _.trim(_.toString(character?.name)),
        prompt: _.isEmpty(flowPrompt) || FLOW_CHARACTER_CONFIG.LEGACY_REFERENCE_PROMPT_PATTERN.test(flowPrompt) ? identityPrompt || flowPrompt : flowPrompt,
        info: _.trim(_.toString(character?.description || character?.prompt)),
      };
    });
    const result = await ensureFlowCharacters({
      characters: requestedCharacters,
      projectId: localProjectId,
      flowProjectId: _.toString(localProject.visualConfig?.flowProjectId),
      chromeHeadless: _.isBoolean(req.body?.chromeHeadless) ? req.body.chromeHeadless : localProject.visualConfig?.chromeHeadless,
      language: req.body?.language,
      retainBrowserSession: true,
    });
    if (!_.isEmpty(result.newProjectId)) {
      localProject.visualConfig = {
        ...localProject.visualConfig,
        flowProjectId: result.newProjectId,
      };
      await saveProjectDetailToDb(localProject);
    }
    if (result.success) await incrementFeatureUsage(req, FeatureType.IMAGE, result.characters.length);
    return res.json(result);
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({ success: false, characters: [], warning: error instanceof Error ? error.message : PROJECT_ASSET_INVALID_REQUEST });
  }
});

router.post("/generate-image", requireSingleVisualLicense, async (req: Request, res: Response) => {
  let activeVideoSubmissionKey = "";
  let activeVideoProjectKey = "";
  try {
    const { prompt, style, visualConfig, sandboxConfig, sceneId } = req.body;
    const isVideoRequest = _.isEqual(visualConfig?.generateType, GenerateType.Video);
    const requestedIdempotencyKey = _.trim(_.toString(req.body?.idempotencyKey));
    if (isVideoRequest && !_.isEmpty(requestedIdempotencyKey)) {
      const completedSubmission = completedVideoSubmissionResults.get(requestedIdempotencyKey);
      if (completedSubmission && _.get(completedSubmission, "success")) return res.json(completedSubmission);
      if (completedSubmission) completedVideoSubmissionResults.delete(requestedIdempotencyKey);
      if (activeVideoSubmissionKeys.has(requestedIdempotencyKey)) {
        return res.json({
          success: false,
          base64: null,
          fallbackUrl: "",
          warning: FLOW_VIDEO_MEDIA_CONFIG.SUBMISSION_IN_PROGRESS_ERROR,
          remoteSubmissionPending: true,
        });
      }
      activeVideoSubmissionKey = requestedIdempotencyKey;
      activeVideoSubmissionKeys.add(activeVideoSubmissionKey);
    }

    const localProjectId = path.basename(_.toString(sandboxConfig?.localProjectId));
    let localProject: any = null;
    let persistedFlowProjectId = _.toString(sandboxConfig?.flowProjectId);
    if (!_.isEmpty(localProjectId)) {
      localProject = await getProjectDetailFromDb(localProjectId);
      persistedFlowProjectId = _.toString(localProject?.visualConfig?.flowProjectId || persistedFlowProjectId);
    }

    const requestedVideoProjectKey = isVideoRequest ? _.toString(localProjectId || persistedFlowProjectId) : "";
    if (!_.isEmpty(requestedVideoProjectKey)) {
      if (activeVideoProjectKeys.has(requestedVideoProjectKey)) {
        return res.json({
          success: false,
          base64: null,
          fallbackUrl: "",
          warning: FLOW_VIDEO_MEDIA_CONFIG.SUBMISSION_IN_PROGRESS_ERROR,
          remoteSubmissionPending: true,
        });
      }
      activeVideoProjectKey = requestedVideoProjectKey;
      activeVideoProjectKeys.add(activeVideoProjectKey);
    }

    const persistedScene = _.find(localProject?.storyboard, { id: sceneId });
    const persistedRemoteMediaIds = _.uniq(
      _.compact(
        _.map(!_.isEmpty(persistedScene?.remoteVideoMediaIds) ? persistedScene.remoteVideoMediaIds : [persistedScene?.remoteVideoMediaId], (mediaId) =>
          _.trim(_.toString(mediaId)),
        ),
      ),
    );
    const anotherPendingVideoScene = _.find(
      localProject?.storyboard,
      (scene) => !_.isEqual(scene.id, sceneId) && scene.remoteVideoDownloadPending && _.isEmpty(scene.assetUrl) && _.isEmpty(scene.assetUrls),
    );
    if (isVideoRequest && anotherPendingVideoScene) {
      return res.json({
        success: false,
        base64: null,
        fallbackUrl: "",
        warning: FLOW_VIDEO_MEDIA_CONFIG.SUBMISSION_IN_PROGRESS_ERROR,
        remoteSubmissionPending: true,
      });
    }
    if (
      _.isEqual(visualConfig?.generateType, GenerateType.Video) &&
      !_.isEmpty(persistedFlowProjectId) &&
      !_.isEmpty(persistedRemoteMediaIds) &&
      persistedScene?.remoteVideoDownloadPending &&
      _.isEmpty(persistedScene?.assetUrl) &&
      _.isEmpty(persistedScene?.assetUrls)
    ) {
      const expectedOutputCount = _.defaultTo(
        persistedScene.remoteVideoExpectedCount,
        !_.isEmpty(persistedScene.remoteVideoMediaIds) ? FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT : SecurityConstants.DEFAULT_AMOUNT,
      );
      const fallbackUrls: string[] = [];
      let recoveryWarning: string = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
      for (const [variantIndex, mediaId] of persistedRemoteMediaIds.entries()) {
        const existingVariantUrl = _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT)
          ? getPersistedProjectVideoVariantUrl(localProjectId, sceneId, variantIndex)
          : undefined;
        if (existingVariantUrl) {
          fallbackUrls.push(existingVariantUrl);
          continue;
        }
        const recoveredResult = await recoverExistingFlowVideo({
          flowProjectId: persistedFlowProjectId,
          mediaId,
          expectedDuration: _.toString(visualConfig?.videoDuration),
          chromeHeadless: visualConfig?.chromeHeadless,
          retainBrowserSession: true,
        });
        if (!recoveredResult.success || _.isEmpty(recoveredResult.base64)) {
          recoveryWarning = _.defaultTo(recoveredResult.warning, recoveryWarning);
          break;
        }
        fallbackUrls.push(
          await persistProjectVideo(localProjectId, sceneId, recoveredResult.base64!, _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT) ? variantIndex : undefined),
        );
      }
      if (_.lt(_.size(fallbackUrls), expectedOutputCount)) {
        const recoveryWasRejected = GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(recoveryWarning);
        if (recoveryWasRejected && _.isEmpty(fallbackUrls)) {
          persistedScene.remoteVideoMediaId = undefined;
          persistedScene.remoteVideoMediaIds = undefined;
          persistedScene.remoteVideoDownloadPending = false;
        } else {
          persistedScene.remoteVideoDownloadPending = true;
        }
        persistedScene.assetError = recoveryWarning;
        await saveProjectDetailToDb(localProject);
        return res.json({
          success: false,
          base64: null,
          fallbackUrl: SecurityConstants.EMPTY_STRING,
          fallbackUrls: [],
          remoteMediaId: recoveryWasRejected ? undefined : _.head(persistedRemoteMediaIds),
          remoteMediaIds: recoveryWasRejected ? [] : persistedRemoteMediaIds,
          remoteMediaCreated: !recoveryWasRejected,
          warning: recoveryWasRejected ? recoveryWarning : FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR,
        });
      }
      await persistRecoveredFlowScene(localProject, persistedScene, persistedRemoteMediaIds, fallbackUrls);
      const recoveredResponse = {
        success: true,
        base64: null,
        fallbackUrl: _.head(fallbackUrls),
        fallbackUrls,
        remoteMediaId: _.head(persistedRemoteMediaIds),
        remoteMediaIds: persistedRemoteMediaIds,
        remoteMediaCreated: true,
      };
      if (!_.isEmpty(requestedIdempotencyKey)) completedVideoSubmissionResults.set(requestedIdempotencyKey, recoveredResponse);
      return res.json(recoveredResponse);
    }

    const knownVideoMediaIds = _.uniq(
      _.compact(
        _.flatMap(
          _.filter(localProject?.storyboard || [], (scene) => !_.isEqual(scene.id, sceneId)),
          (scene) => _.map(!_.isEmpty(scene.remoteVideoMediaIds) ? scene.remoteVideoMediaIds : [scene.remoteVideoMediaId], (mediaId) => _.trim(_.toString(mediaId))),
        ),
      ),
    );
    const resolvedSandboxConfig = {
      ...sandboxConfig,
      localProjectId,
      flowProjectId: persistedFlowProjectId || undefined,
      projectId: undefined,
      knownVideoMediaIds,
    };

    if (!_.isEmpty(persistedFlowProjectId)) {
      logger.info(`[Google Flow] Reusing shared room ${persistedFlowProjectId} for local project ${localProjectId}.`);
    }

    let result = await generateImageWithPlaywright({
      prompt,
      style,
      visualConfig,
      sandboxConfig: resolvedSandboxConfig,
      retainBrowserSession: !_.isEmpty(localProjectId),
    });

    const generatedFlowProjectId = _.toString(result?.newProjectId || persistedFlowProjectId);
    const generatedRemoteMediaIds = _.uniq(
      _.compact(_.map(!_.isEmpty(result?.remoteMediaIds) ? result.remoteMediaIds : [result?.remoteMediaId], (mediaId) => _.trim(_.toString(mediaId)))),
    );
    const generatedRemoteMediaId = _.head(generatedRemoteMediaIds);
    if (localProject && _.isEqual(visualConfig?.generateType, GenerateType.Video) && _.some(generatedRemoteMediaIds, (mediaId) => _.includes(knownVideoMediaIds, mediaId))) {
      throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ID_ERROR);
    }
    if (localProject && _.isEqual(visualConfig?.generateType, GenerateType.Video) && !_.isEmpty(generatedRemoteMediaIds)) {
      const generatedScene = _.find(localProject.storyboard, { id: sceneId });
      if (generatedScene) {
        const hasCompleteRemoteBatch = _.gte(_.size(generatedRemoteMediaIds), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT);
        generatedScene.remoteVideoMediaId = generatedRemoteMediaId;
        generatedScene.remoteVideoMediaIds = generatedRemoteMediaIds;
        generatedScene.remoteVideoExpectedCount = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT;
        generatedScene.remoteVideoDownloadPending =
          hasCompleteRemoteBatch && (_.isEmpty(result.base64s) || _.lt(_.size(result.base64s), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT));
      }
      localProject.visualConfig = {
        ...localProject.visualConfig,
        flowProjectId: generatedFlowProjectId || localProject.visualConfig?.flowProjectId,
      };
      await saveProjectDetailToDb(localProject);
    }
    if (
      _.isEqual(visualConfig?.generateType, GenerateType.Video) &&
      result?.remoteMediaCreated &&
      _.lt(_.size(result.base64s), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT) &&
      !_.isEmpty(generatedFlowProjectId) &&
      _.gte(_.size(generatedRemoteMediaIds), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT)
    ) {
      const recoveredFallbackUrls: string[] = [];
      let generatedRecoveryWarning: string = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
      for (const [variantIndex, mediaId] of _.take(generatedRemoteMediaIds, FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT).entries()) {
        const existingVariantUrl = getPersistedProjectVideoVariantUrl(localProjectId, sceneId, variantIndex);
        if (existingVariantUrl) {
          recoveredFallbackUrls.push(existingVariantUrl);
          continue;
        }
        const recoveredResult = await recoverExistingFlowVideo({
          flowProjectId: generatedFlowProjectId,
          mediaId,
          expectedDuration: _.toString(visualConfig?.videoDuration),
          chromeHeadless: visualConfig?.chromeHeadless,
          retainBrowserSession: !_.isEmpty(localProjectId),
        });
        if (!recoveredResult.success || _.isEmpty(recoveredResult.base64)) {
          generatedRecoveryWarning = _.defaultTo(recoveredResult.warning, generatedRecoveryWarning);
          break;
        }
        recoveredFallbackUrls.push(await persistProjectVideo(localProjectId, sceneId, recoveredResult.base64!, variantIndex));
      }
      if (_.gte(_.size(recoveredFallbackUrls), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT)) {
        const completedScene = _.find(localProject?.storyboard, { id: sceneId });
        if (completedScene) await persistRecoveredFlowScene(localProject, completedScene, generatedRemoteMediaIds, recoveredFallbackUrls);
        result = {
          ...result,
          success: true,
          base64: null,
          base64s: [],
          fallbackUrl: _.head(recoveredFallbackUrls)!,
          fallbackUrls: recoveredFallbackUrls,
          newProjectId: result.newProjectId,
          remoteMediaId: generatedRemoteMediaId,
          remoteMediaIds: generatedRemoteMediaIds,
          remoteMediaCreated: true,
        };
      } else if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(generatedRecoveryWarning)) {
        const rejectedScene = _.find(localProject?.storyboard, { id: sceneId });
        if (rejectedScene) {
          rejectedScene.remoteVideoMediaId = undefined;
          rejectedScene.remoteVideoMediaIds = undefined;
          rejectedScene.remoteVideoDownloadPending = false;
          rejectedScene.assetError = generatedRecoveryWarning;
          await saveProjectDetailToDb(localProject);
        }
        result = {
          ...result,
          success: false,
          warning: generatedRecoveryWarning,
          remoteMediaId: undefined,
          remoteMediaIds: [],
          remoteMediaCreated: false,
        };
      }
    }

    if (result?.success && _.isEqual(visualConfig?.generateType, GenerateType.Video) && _.gte(_.size(result.base64s), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT)) {
      const fallbackUrls = await persistProjectVideoVariants(localProjectId, sceneId, result.base64s!);
      const fallbackUrl = _.head(fallbackUrls)!;
      result = {
        ...result,
        base64: null,
        base64s: [],
        fallbackUrl,
        fallbackUrls,
      };
      const completedScene = _.find(localProject?.storyboard, { id: sceneId });
      if (completedScene) {
        completedScene.assetUrl = fallbackUrl;
        completedScene.assetUrls = fallbackUrls;
        completedScene.assetType = GenerateType.Video;
        completedScene.assetStatus = SceneAssetStatus.Generated;
        completedScene.remoteVideoMediaId = generatedRemoteMediaId || completedScene.remoteVideoMediaId;
        completedScene.remoteVideoMediaIds = generatedRemoteMediaIds;
        completedScene.remoteVideoExpectedCount = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT;
        completedScene.remoteVideoDownloadPending = false;
        await saveProjectDetailToDb(localProject);
      }
    }

    const resolvedFlowProjectId = _.toString(result?.newProjectId || persistedFlowProjectId);
    if (localProject && !_.isEmpty(resolvedFlowProjectId) && !_.isEqual(localProject?.visualConfig?.flowProjectId, resolvedFlowProjectId)) {
      const replacedExistingRoom = !_.isEmpty(localProject?.visualConfig?.flowProjectId);
      localProject.visualConfig = {
        ...localProject.visualConfig,
        flowProjectId: resolvedFlowProjectId,
      };
      await saveProjectDetailToDb(localProject);
      logger.info(
        replacedExistingRoom
          ? `[Google Flow] Replaced unavailable shared room with ${resolvedFlowProjectId} for local project ${localProjectId}.`
          : `[Google Flow] Created shared room ${resolvedFlowProjectId} for local project ${localProjectId}.`,
      );
    }

    if (result && result.success) {
      const feature = _.isEqual(visualConfig?.generateType, GenerateType.Video) ? FeatureType.VIDEO : FeatureType.IMAGE;
      await incrementFeatureUsage(req, feature, SecurityConstants.DEFAULT_AMOUNT);
    }

    if (!_.isEmpty(requestedIdempotencyKey) && result?.success) {
      completedVideoSubmissionResults.set(requestedIdempotencyKey, result);
      while (_.gt(completedVideoSubmissionResults.size, FLOW_VIDEO_MEDIA_CONFIG.IDEMPOTENCY_CACHE_MAX_ENTRIES)) {
        const oldestKey = completedVideoSubmissionResults.keys().next().value;
        if (_.isString(oldestKey)) completedVideoSubmissionResults.delete(oldestKey);
        else break;
      }
    }
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({
      success: false,
      base64: null,
      fallbackUrl: "",
      warning: getMessage("SYSTEM_ERROR", undefined, error.message),
    });
  } finally {
    if (!_.isEmpty(activeVideoSubmissionKey)) activeVideoSubmissionKeys.delete(activeVideoSubmissionKey);
    if (!_.isEmpty(activeVideoProjectKey)) activeVideoProjectKeys.delete(activeVideoProjectKey);
  }
});

router.post("/generate-batch-images", requireBatchVisualLicense, async (req: Request, res: Response) => {
  try {
    const { items, visualConfig, style, retainBrowserSession } = req.body;

    if (!items || !_.isArray(items) || _.isEmpty(items)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: BACKEND_MESSAGES.BATCH_GEN_NO_ITEMS });
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    const heartbeatId = setInterval(() => {
      if (!res.writableEnded && !res.destroyed) res.write("\n");
    }, SYSTEM_FETCH_CONFIG.STREAM_HEARTBEAT_MS);

    let successfulImageCount = SecurityConstants.ZERO;
    let successfulVideoCount = SecurityConstants.ZERO;
    try {
      await generateBatchImagesWithGeminiChat(
        items,
        visualConfig,
        style,
        (progressResult) => {
          if (_.get(progressResult, SecurityConstants.SUCCESS_KEY)) {
            if (_.isEqual(progressResult.assetType, GenerateType.Video)) {
              successfulVideoCount = _.add(successfulVideoCount, SecurityConstants.DEFAULT_AMOUNT);
            } else {
              successfulImageCount = _.add(successfulImageCount, SecurityConstants.DEFAULT_AMOUNT);
            }
          }
          res.write(jsonUtils.safeStringify(progressResult) + "\n");
        },
        Boolean(retainBrowserSession),
      );
    } finally {
      clearInterval(heartbeatId);
    }

    if (_.gt(successfulImageCount, SecurityConstants.ZERO)) {
      await incrementFeatureUsage(req, FeatureType.IMAGE, successfulImageCount);
    }
    if (_.gt(successfulVideoCount, SecurityConstants.ZERO)) {
      await incrementFeatureUsage(req, FeatureType.VIDEO, successfulVideoCount);
    }
    res.end();
  } catch (error: any) {
    logger.error(LogEvent.GENERATE_BATCH_IMAGES_ROUTE_ERROR, error);
    if (!res.headersSent) {
      return res.json({
        success: false,
        results: [],
        warning: BACKEND_MESSAGES.BATCH_GEN_SYSTEM_ERROR.replace("{0}", error.message),
      });
    } else {
      res.end();
    }
  }
});

router.post("/clean-batch-images", async (_req: Request, res: Response) => {
  try {
    await closeAllBatchPages();
    return res.json({ success: true });
  } catch (error: any) {
    logger.error(LogEvent.CLEAN_BATCH_IMAGES_ROUTE_ERROR, error);
    return res.json({ success: false, error: error.message });
  }
});

router.post("/merge-audio", async (req: Request, res: Response) => {
  try {
    const { chunks } = req.body;
    if (!chunks || !_.isArray(chunks) || _.isEmpty(chunks)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: ErrorMessage.NO_AUDIO_CHUNKS_PROVIDED });
    }

    const tempDir = os.tmpdir();
    const sessionId = randomUUID();
    const filePaths: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkItem = chunks[i];
      if (chunkItem.audioBase64) {
        const buffer = Buffer.from(chunkItem.audioBase64, "base64");
        const filePath = path.join(tempDir, `chunk_${sessionId}_${i}.mp3`);
        fs.writeFileSync(filePath, buffer);
        filePaths.push(filePath);
      }
    }

    if (_.isEmpty(filePaths)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "No valid base64 audio data found in chunks" });
    }

    const listPath = path.join(tempDir, `list_${sessionId}.txt`);
    const fileListContent = _.map(filePaths, (p) => `file '${p.replace(SINGLE_QUOTE_REGEX, "'\\''")}'`).join("\n");
    fs.writeFileSync(listPath, fileListContent, FileEncoding.UTF8);

    const outputPath = path.join(tempDir, `merged_${sessionId}.mp3`);

    ffmpeg()
      .input(listPath)
      .inputOptions(FFMPEG_CONFIG.OPTIONS_CONCAT)
      .outputOptions(FFMPEG_CONFIG.OPTIONS_OUTPUT_MP3)
      .on("end", () => {
        try {
          const mergedBuffer = fs.readFileSync(outputPath);
          const base64Audio = mergedBuffer.toString("base64");

          filePaths.forEach((p) => fs.unlinkSync(p));
          fs.unlinkSync(listPath);
          fs.unlinkSync(outputPath);

          res.json({ success: true, audioBase64: base64Audio });
        } catch (e) {
          logger.error(LogEvent.ERROR_READ_MERGED_AUDIO, e);
          res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: ErrorMessage.FAILED_TO_READ_MERGED_AUDIO_FILE });
        }
      })
      .on("error", (err) => {
        logger.error(LogEvent.ERROR_FFMPEG_MERGE, err);

        filePaths.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
        fs.existsSync(listPath) && fs.unlinkSync(listPath);
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
        res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: "FFmpeg processing error: " + err.message });
      })
      .save(outputPath);
  } catch (err: any) {
    logger.error(LogEvent.UNEXPECTED_ERROR_MERGE_AUDIO, err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: ErrorMessage.INTERNAL_SERVER_ERROR + err.message });
  }
});

router.post(ROUTER_PATHS.VALIDATE_FINAL_VIDEO, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const videoUrl = _.toString(req.body?.videoUrl);
  const relativePath = _.trimStart(_.first(_.split(videoUrl, "?")) || videoUrl, "/\\");
  const dataRoot = path.resolve(getDataDirectory());
  const videoPath = path.resolve(dataRoot, relativePath);
  const isInsideDataRoot = _.startsWith(_.toLower(videoPath), _.toLower(_.join([dataRoot, path.sep], "")));
  if (!isInsideDataRoot || !fs.existsSync(videoPath))
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Rendered video is outside the Vidify data root or missing." });
  const tempDir = path.join(dataRoot, `${FINAL_MULTIMODAL_QA_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const executable = fs.existsSync(ffmpegBinary) ? ffmpegBinary : FINAL_MULTIMODAL_QA_CONFIG.FFMPEG_FALLBACK_COMMAND;
    const durationSeconds = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(videoPath, (error, metadata) => resolve(error ? 0 : _.toNumber(metadata?.format?.duration)));
    });
    const sampleIntervalSeconds =
      _.max([FINAL_MULTIMODAL_QA_CONFIG.MIN_SAMPLE_INTERVAL_SECONDS, durationSeconds / FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT]) ||
      FINAL_MULTIMODAL_QA_CONFIG.DEFAULT_SAMPLE_INTERVAL_SECONDS;
    const frameOutputPattern = path.join(tempDir, FINAL_MULTIMODAL_QA_CONFIG.FRAME_FILE_PATTERN);
    await new Promise<void>((resolve, reject) => {
      const process = spawn(
        executable,
        [
          "-y",
          "-i",
          videoPath,
          "-vf",
          `fps=1/${sampleIntervalSeconds},scale=${FINAL_MULTIMODAL_QA_CONFIG.FRAME_SCALE_WIDTH}:-2`,
          "-frames:v",
          _.toString(FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT),
          frameOutputPattern,
        ],
        { windowsHide: true, stdio: "ignore" },
      );
      process.once("error", reject);
      process.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Final QC frame extraction failed (${code}).`))));
    });
    const audioPath = path.join(tempDir, FINAL_MULTIMODAL_QA_CONFIG.AUDIO_FILE_NAME);
    await new Promise<void>((resolve, reject) => {
      const process = spawn(
        executable,
        [
          "-y",
          "-i",
          videoPath,
          "-vn",
          "-ac",
          _.toString(FINAL_MULTIMODAL_QA_CONFIG.AUDIO_CHANNELS),
          "-b:a",
          FINAL_MULTIMODAL_QA_CONFIG.AUDIO_BITRATE,
          "-t",
          _.toString(FINAL_MULTIMODAL_QA_CONFIG.MAX_AUDIO_REVIEW_SECONDS),
          audioPath,
        ],
        {
          windowsHide: true,
          stdio: "ignore",
        },
      );
      process.once("error", reject);
      process.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(PIPELINE_SERVER_ERRORS.FINAL_QA_AUDIO_MISSING))));
    });
    const frameFiles = _.take(
      _.sortBy(_.filter(fs.readdirSync(tempDir), (file) => _.endsWith(file, FINAL_MULTIMODAL_QA_CONFIG.FRAME_EXTENSION))),
      FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT,
    );
    if (_.isEmpty(frameFiles)) throw new Error(PIPELINE_SERVER_ERRORS.FINAL_QA_FRAMES_MISSING);
    const finalQaPrompt = getCinematicFinalVideoQualityPrompt(_.toString(req.body?.script), _.toString(req.body?.viewerPromise));
    const parts: any[] = [{ text: finalQaPrompt }];
    _.forEach(frameFiles, (file) =>
      parts.push({
        inlineData: {
          mimeType: FINAL_MULTIMODAL_QA_CONFIG.FRAME_MIME_TYPE,
          data: fs.readFileSync(path.join(tempDir, file)).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding),
        },
      }),
    );
    parts.push({
      inlineData: { mimeType: FINAL_MULTIMODAL_QA_CONFIG.AUDIO_MIME_TYPE, data: fs.readFileSync(audioPath).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding) },
    });
    const response = await generateContentWithRetry({
      contents: [{ role: "user", parts }],
      config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: FINAL_VIDEO_QA_RESPONSE_SCHEMA, maxOutputTokens: FINAL_MULTIMODAL_QA_CONFIG.MAX_OUTPUT_TOKENS },
      task: { capability: AiTaskCapability.VisualQa },
    });
    const quality = parseAiJsonArtifact(response.text, FINAL_VIDEO_QA_RESPONSE_SCHEMA, "invalid_final_video_qa_response");
    const result = { success: true, quality, aiMetadata: response.aiMetadata, rotationLogs: response.rotationLogs };
    setCache(API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO, req.body, result);
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.VISUAL_QA_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  } finally {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

router.post(ROUTER_PATHS.REPAIR_VIDEO_PROMPT, async (req: Request, res: Response) => {
  const prompt = _.toString(req.body?.prompt);
  const qaIssues = _.compact(_.map(_.castArray(req.body?.qaIssues), _.toString));
  const sceneContext = req.body?.scene;
  if (_.isEmpty(_.trim(prompt))) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Video prompt is required." });
  try {
    const response = await generateContentWithRetry({
      contents: _.isEmpty(qaIssues) ? getCinematicVideoPromptPolicyRepairPrompt(prompt) : getCinematicVideoPromptRepairPrompt(prompt, qaIssues, sceneContext),
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA,
        maxOutputTokens: CINEMATIC_GENERATION_RECOVERY_CONFIG.POLICY_REPAIR_MAX_OUTPUT_TOKENS,
      },
      task: { capability: AiTaskCapability.VisualPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.PROMPT) },
    });
    const review = parseAiJsonArtifact(response.text, VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA, "invalid_video_prompt_repair_response");
    return res.json({ success: true, review, aiMetadata: response.aiMetadata });
  } catch (error: any) {
    logger.warn(LogEvent.VISUAL_QA_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ success: false, error: error.message });
  }
});

router.post(ROUTER_PATHS.REPAIR_VISUAL_PROMPT, async (req: Request, res: Response) => {
  const prompt = _.toString(req.body?.prompt);
  const qaIssues = _.compact(_.map(_.castArray(req.body?.qaIssues), _.toString));
  if (_.isEmpty(_.trim(prompt))) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: CINEMATIC_GENERATION_RECOVERY_CONFIG.VISUAL_PROMPT_REQUIRED_ERROR });
  }
  try {
    const purpose = _.toString(req.body?.purpose || CINEMATIC_GENERATION_RECOVERY_CONFIG.DEFAULT_VISUAL_PURPOSE);
    const visualContext = req.body?.scene || {};
    const repairPrompt = _.isEqual(purpose, CINEMATIC_GENERATION_RECOVERY_CONFIG.THUMBNAIL_PROVIDER_REJECTION_PURPOSE)
      ? getCinematicThumbnailProviderRepairPrompt(prompt, visualContext)
      : _.isEqual(purpose, CINEMATIC_GENERATION_RECOVERY_CONFIG.SCENE_IMAGE_PROVIDER_REJECTION_PURPOSE)
        ? getCinematicSceneImageProviderRepairPrompt(prompt, visualContext)
        : _.isEqual(purpose, CINEMATIC_GENERATION_RECOVERY_CONFIG.CHARACTER_PROVIDER_REJECTION_PURPOSE)
          ? getCinematicCharacterProviderRepairPrompt(prompt, visualContext)
          : getVisualPromptQaRepairPrompt(prompt, qaIssues, visualContext, purpose);
    const response = await generateContentWithRetry({
      contents: repairPrompt,
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA,
        maxOutputTokens: CINEMATIC_GENERATION_RECOVERY_CONFIG.POLICY_REPAIR_MAX_OUTPUT_TOKENS,
      },
      task: { capability: AiTaskCapability.VisualPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.PROMPT) },
    });
    const review = parseAiJsonArtifact(response.text, VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA, "invalid_visual_prompt_repair_response");
    return res.json({ success: true, review, aiMetadata: response.aiMetadata });
  } catch (error: any) {
    logger.warn(LogEvent.VISUAL_QA_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ success: false, error: error.message });
  }
});

router.post(ROUTER_PATHS.ANALYZE_CINEMATIC_CLIPS, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.body?.projectId));
  const scenes = _.filter(_.castArray(req.body?.scenes), (scene) => _.isEqual(scene?.assetType, GenerateType.Video));
  const dataRoot = path.resolve(getDataDirectory());
  const projectRoot = path.resolve(dataRoot, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  const executable = fs.existsSync(ffmpegBinary) ? ffmpegBinary : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD;
  const analysisDir = path.join(dataRoot, `${CINEMATIC_EDIT_ANALYSIS_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  fs.mkdirSync(analysisDir, { recursive: true });
  const analyzeScene = async (scene: any, includeReviewMedia = false) => {
    const relativePath = _.trimStart(_.first(_.split(_.toString(scene.assetUrl), "?")) || "", "/\\");
    const candidate = path.resolve(dataRoot, relativePath);
    const isSafe = _.startsWith(_.toLower(candidate), _.toLower(`${projectRoot}${path.sep}`)) && fs.existsSync(candidate);
    if (!isSafe) return { sceneId: scene.id, sourcePath: "", warnings: ["clip_missing"], trimStartSeconds: 0, trimEndSeconds: 0, takeDecision: "omit", reason: "clip_missing" };
    const mediaInfo = await new Promise<{ duration: number; width: number; height: number; hasAudio: boolean }>((resolve) =>
      ffmpeg.ffprobe(candidate, (error, metadata) => {
        const videoStream = _.find(metadata?.streams, (stream) => _.isEqual(stream.codec_type, "video"));
        const audioStream = _.find(metadata?.streams, (stream) => _.isEqual(stream.codec_type, "audio"));
        resolve(
          error
            ? { duration: 0, width: 0, height: 0, hasAudio: false }
            : {
                duration: _.toNumber(metadata?.format?.duration),
                width: _.toNumber(videoStream?.width),
                height: _.toNumber(videoStream?.height),
                hasAudio: Boolean(audioStream),
              },
        );
      }),
    );
    const { duration } = mediaInfo;
    const stderr = await new Promise<string>((resolve) => {
      const process = spawn(
        executable,
        ["-hide_banner", "-i", candidate, "-vf", "blackdetect=d=0.12:pix_th=0.08,freezedetect=n=-48dB:d=0.35,cropdetect=limit=24:round=2:reset=0", "-an", "-f", "null", "-"],
        { windowsHide: true },
      );
      let output = "";
      const timeout = setTimeout(() => process.kill(), 30_000);
      process.stderr.on("data", (chunk) => {
        output += _.toString(chunk);
      });
      process.once("error", () => {
        clearTimeout(timeout);
        resolve(output);
      });
      process.once("exit", () => {
        clearTimeout(timeout);
        resolve(output);
      });
    });
    const blackRanges = [...stderr.matchAll(/black_start:([\d.]+)\s+black_end:([\d.]+)/g)].map((match) => [_.toNumber(match[1]), _.toNumber(match[2])]);
    const freezeStarts = [...stderr.matchAll(/freeze_start:\s*([\d.]+)/g)].map((match) => _.toNumber(match[1]));
    const freezeEnds = [...stderr.matchAll(/freeze_end:\s*([\d.]+)/g)].map((match) => _.toNumber(match[1]));
    const cropMatches = [...stderr.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)];
    const significantCropGroups = _.groupBy(
      _.filter(cropMatches, (match) => {
        const width = _.toNumber(match[1]);
        const height = _.toNumber(match[2]);
        return (mediaInfo.width > 0 && width < mediaInfo.width * 0.97) || (mediaInfo.height > 0 && height < mediaInfo.height * 0.97);
      }),
      (match) => `${match[1]}:${match[2]}:${match[3]}:${match[4]}`,
    );
    const dominantBorderGroup = _.maxBy(_.values(significantCropGroups), (group) => group.length);
    const detectedCrop = _.first(dominantBorderGroup);
    const cropWidth = _.toNumber(detectedCrop?.[1]);
    const cropHeight = _.toNumber(detectedCrop?.[2]);
    const hasEmbeddedBorder = Boolean(detectedCrop) && _.gte(_.size(dominantBorderGroup), 5);
    const sourceCrop = hasEmbeddedBorder ? `${cropWidth}:${cropHeight}:${detectedCrop?.[3]}:${detectedCrop?.[4]}` : "";
    const maxEdgeTrim = _.min([1.25, duration * 0.18]) || 0;
    let trimStartSeconds = 0;
    let trimEndSeconds = 0;
    _.forEach(blackRanges, ([start, end]) => {
      if (_.lte(start, 0.2)) trimStartSeconds = _.max([trimStartSeconds, _.min([end, maxEdgeTrim]) || 0]) || 0;
      if (_.gte(end, duration - 0.2)) trimEndSeconds = _.max([trimEndSeconds, _.min([duration - start, maxEdgeTrim]) || 0]) || 0;
    });
    _.forEach(freezeStarts, (start, index) => {
      const end = _.defaultTo(freezeEnds[index], duration);
      if (_.lte(start, 0.2)) trimStartSeconds = _.max([trimStartSeconds, _.min([end, maxEdgeTrim]) || 0]) || 0;
      if (_.gte(end, duration - 0.2)) trimEndSeconds = _.max([trimEndSeconds, _.min([duration - start, maxEdgeTrim]) || 0]) || 0;
    });
    const warnings = _.compact([
      _.isEmpty(blackRanges) ? "" : "black_frames_detected",
      _.isEmpty(freezeStarts) ? "" : "freeze_detected",
      hasEmbeddedBorder ? "embedded_border_detected" : "",
      _.lte(duration, 0) ? "invalid_duration" : "",
    ]);
    const invalidDuration = _.lte(duration, 0);
    const usableDuration = _.max([0, duration - trimStartSeconds - trimEndSeconds]) || 0;
    const destructiveEdgeDamage = _.gt(duration, 0) && _.lt(usableDuration, _.min([4, duration * 0.55]) || 0);
    const takeDecision = invalidDuration || destructiveEdgeDamage ? "omit" : trimStartSeconds > 0 || trimEndSeconds > 0 || hasEmbeddedBorder ? "trim" : "use";
    const reason =
      takeDecision === "omit"
        ? invalidDuration
          ? "invalid_duration"
          : "insufficient_usable_duration_after_edge_cleanup"
        : takeDecision === "trim"
          ? _.join(warnings, ",") || "safe_edge_cleanup"
          : "technical_clip_analysis_passed";
    let contactSheetData = "";
    let contactSheetPath = "";
    if (includeReviewMedia && _.gt(duration, 0)) {
      contactSheetPath = path.join(analysisDir, `${path.basename(_.toString(scene.id))}-${CINEMATIC_EDIT_ANALYSIS_CONFIG.CONTACT_SHEET_FILE_NAME}`);
      const frameRate = CINEMATIC_EDIT_ANALYSIS_CONFIG.FRAME_COUNT / duration;
      const tileRows = Math.ceil(CINEMATIC_EDIT_ANALYSIS_CONFIG.FRAME_COUNT / CINEMATIC_EDIT_ANALYSIS_CONFIG.CONTACT_SHEET_COLUMNS);
      const contactSheetFilter = `fps=${frameRate},scale=${Math.floor(CINEMATIC_EDIT_ANALYSIS_CONFIG.CONTACT_SHEET_WIDTH / CINEMATIC_EDIT_ANALYSIS_CONFIG.CONTACT_SHEET_COLUMNS)}:-2,tile=${CINEMATIC_EDIT_ANALYSIS_CONFIG.CONTACT_SHEET_COLUMNS}x${tileRows}`;
      await new Promise<void>((resolve) => {
        const process = spawn(executable, ["-y", "-i", candidate, "-vf", contactSheetFilter, "-frames:v", "1", contactSheetPath], { windowsHide: true, stdio: "ignore" });
        const timeout = setTimeout(() => process.kill(), CINEMATIC_EDIT_ANALYSIS_CONFIG.FFMPEG_TIMEOUT_MS);
        process.once("error", () => {
          clearTimeout(timeout);
          resolve();
        });
        process.once("exit", () => {
          clearTimeout(timeout);
          if (fs.existsSync(contactSheetPath)) contactSheetData = fs.readFileSync(contactSheetPath).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding);
          resolve();
        });
      });
    }
    return {
      sceneId: scene.id,
      sourcePath: candidate,
      duration,
      trimStartSeconds,
      trimEndSeconds,
      sourceCrop,
      warnings,
      takeDecision,
      reason,
      hasAudio: mediaInfo.hasAudio,
      contactSheetData,
      contactSheetPath,
    };
  };
  const technicalDecisions: any[] = [];
  let analyzedDecisions: any[] = [];
  let libraryAnalysisAvailable = false;
  try {
    for (const batch of _.chunk(scenes, 3)) technicalDecisions.push(...(await Promise.all(_.map(batch, analyzeScene))));
    analyzedDecisions = technicalDecisions;
    const libraryResult = await analyzeCinematicClipsWithLibraries(
      _.map(
        _.filter(technicalDecisions, (decision) => !_.isEmpty(decision.sourcePath)),
        (decision) => {
          const scene = _.find(scenes, { id: decision.sceneId });
          return {
            sceneId: _.toString(decision.sceneId),
            path: _.toString(decision.sourcePath),
            hasAudio: Boolean(decision.hasAudio),
            protectDialogue: hasCinematicSceneDialogue(scene || {}),
            narrativeRole: _.toString(scene?.narrativeRole),
            protectNarrative: Boolean(scene?.isFilmIntro) || _.includes(CINEMATIC_POLICY_CONFIG.NARRATIVE_ANCHOR_ROLES, _.toLower(_.toString(scene?.narrativeRole))),
            expectedDialogue: _.trim(_.toString(scene?.spokenDialogue || scene?.subtitle)),
            dialogueLanguage: _.toString(req.body?.language),
          };
        },
      ),
      executable,
      analysisDir,
    );
    libraryAnalysisAvailable = libraryResult.success && libraryResult.libraryAnalysisAvailable;
    const libraryByScene = _.keyBy(libraryResult.decisions, "sceneId");
    analyzedDecisions = _.map(technicalDecisions, (technical) => {
      const library = libraryByScene[technical.sceneId];
      if (!library) return technical;
      const technicalRejected = _.isEqual(technical.takeDecision, "omit");
      return {
        ...technical,
        ...library,
        sourcePath: technical.sourcePath,
        contactSheetData: technical.contactSheetData,
        contactSheetPath: technical.contactSheetPath,
        trimStartSeconds: technicalRejected ? technical.trimStartSeconds : library.trimStartSeconds,
        trimEndSeconds: technicalRejected ? technical.trimEndSeconds : library.trimEndSeconds,
        takeDecision: technicalRejected ? technical.takeDecision : library.takeDecision,
        warnings: _.uniq([..._.castArray(technical.warnings), ..._.castArray(library.warnings)]),
        reason: _.join(_.compact([library.reason, technical.reason]), ";"),
      };
    });
    if (!libraryAnalysisAvailable || !(await isAiProviderAvailable())) {
      return res.json({
        success: true,
        decisions: _.map(analyzedDecisions, (decision) => _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"])),
        libraryAnalysisAvailable,
        editorialReviewAvailable: false,
        timelineProvenance: libraryAnalysisAvailable ? "library" : "ffmpeg",
      });
    }
    const aiReviewSceneIds = new Set(
      _.map(
        _.filter(analyzedDecisions, (decision) => !_.isEqual(decision.takeDecision, "omit") && !_.isEmpty(decision.candidateSegments)),
        (decision) => _.toString(decision.sceneId),
      ),
    );
    const reviewMediaDecisions: any[] = [];
    for (const batch of _.chunk(
      _.filter(scenes, (scene) => aiReviewSceneIds.has(_.toString(scene.id))),
      CINEMATIC_EDIT_ANALYSIS_CONFIG.MEDIA_WORKERS,
    )) {
      reviewMediaDecisions.push(...(await Promise.all(_.map(batch, (scene) => analyzeScene(scene, true)))));
    }
    const reviewMediaByScene = _.keyBy(reviewMediaDecisions, "sceneId");
    analyzedDecisions = _.map(analyzedDecisions, (decision) => {
      const media = reviewMediaByScene[decision.sceneId];
      return media
        ? {
            ...decision,
            contactSheetData: media.contactSheetData,
            contactSheetPath: media.contactSheetPath,
          }
        : decision;
    });
    const reviewableDecisions = _.filter(analyzedDecisions, (decision) => !_.isEmpty(decision.contactSheetData) && aiReviewSceneIds.has(_.toString(decision.sceneId)));
    if (_.isEmpty(reviewableDecisions)) {
      return res.json({
        success: true,
        decisions: _.map(analyzedDecisions, (decision) => _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"])),
        libraryAnalysisAvailable,
        editorialReviewAvailable: false,
        timelineProvenance: libraryAnalysisAvailable ? "library" : "ffmpeg",
      });
    }
    const metadata = _.map(reviewableDecisions, (decision) => {
      const scene = _.find(scenes, { id: decision.sceneId });
      return {
        ..._.pick(scene, [
          "id",
          "script",
          "visualIntent",
          "narrativeRole",
          "storyQuestion",
          "storyChange",
          "isFilmIntro",
          "introTitle",
          "visibleAction",
          "reaction",
          "storyEvidence",
          "shotPurpose",
          "shotRole",
          "dialogueMode",
          "spokenDialogue",
          "characterBlocking",
          "eyelineDirection",
          "screenDirection",
          "actionStartState",
          "actionEndState",
          "locationState",
          "wardrobeState",
          "propState",
          "cinematicBeats",
          "cinematicContinuityHandoff",
        ]),
        duration: decision.duration,
        technicalTrimStartSeconds: decision.trimStartSeconds,
        technicalTrimEndSeconds: decision.trimEndSeconds,
        technicalWarnings: decision.warnings,
        libraryCandidateSegments: decision.candidateSegments,
        libraryShotBoundaries: decision.shotBoundaries,
        libraryConfidence: decision.libraryConfidence,
        sharpnessScore: decision.sharpnessScore,
        motionScore: decision.motionScore,
        duplicateFrameRatio: decision.duplicateFrameRatio,
        visuallySimilarToSceneId: decision.visuallySimilarToSceneId,
        visualSimilarityScore: decision.visualSimilarityScore,
        speechAnalysisAvailable: decision.speechAnalysisAvailable,
        detectedSpeechRanges: decision.detectedSpeechRanges,
        recognizedTranscript: decision.recognizedTranscript,
        dialogueCoverageRatio: decision.dialogueCoverageRatio,
        dialogueTextMatchScore: decision.dialogueTextMatchScore,
        dialogueMismatch: decision.dialogueMismatch,
        selectedDuration: decision.selectedDuration,
      };
    });
    const libraryObservations = _.map(reviewableDecisions, (decision) =>
      _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
    );
    const globalEditParts: any[] = [{ text: getCinematicGlobalEditDecisionPrompt(metadata, libraryObservations) }];
    _.forEach(reviewableDecisions, (decision) => {
      globalEditParts.push({ text: `${CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_MEDIA_LABEL_PREFIX}: ${decision.sceneId}` });
      globalEditParts.push({
        inlineData: {
          mimeType: CINEMATIC_EDIT_ANALYSIS_CONFIG.IMAGE_MIME_TYPE,
          data: decision.contactSheetData,
        },
      });
    });
    let editorialDecisions: any[] = [];
    let editorialAiMetadata: unknown;
    let editorialValidationError: string = CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_INVALID_RESPONSE_ERROR;
    for (let attempt = 0; attempt < CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_REVIEW_ATTEMPTS; attempt++) {
      const globalEditResponse = await generateContentWithRetry({
        contents: [{ role: "user", parts: globalEditParts }],
        config: {
          responseMimeType: CONTENT_TYPES.JSON,
          responseJsonSchema: CINEMATIC_EDIT_DECISION_RESPONSE_SCHEMA,
          maxOutputTokens: CINEMATIC_EDIT_ANALYSIS_CONFIG.MAX_OUTPUT_TOKENS,
        },
        task: { capability: AiTaskCapability.VisualQa },
      });
      const editArtifact = parseAiJsonArtifact<any>(globalEditResponse.text, CINEMATIC_EDIT_DECISION_RESPONSE_SCHEMA, "invalid_cinematic_edit_response");
      const candidateDecisions = _.castArray(editArtifact.decisions);
      const validation = validateCinematicEditorialDecisions(reviewableDecisions, candidateDecisions);
      if (validation.valid) {
        editorialDecisions = candidateDecisions;
        editorialAiMetadata = globalEditResponse.aiMetadata;
        break;
      }
      editorialValidationError = validation.error || CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_INVALID_RESPONSE_ERROR;
    }
    if (_.isEmpty(editorialDecisions)) {
      return res.json({
        success: true,
        decisions: _.map(analyzedDecisions, (decision) => _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"])),
        libraryAnalysisAvailable,
        editorialReviewAvailable: false,
        editorialReviewError: editorialValidationError,
        timelineProvenance: "library",
      });
    }
    const editorialByScene = _.keyBy(editorialDecisions, "sceneId");
    const decisions = _.map(analyzedDecisions, (technical) => {
      const editorial = editorialByScene[technical.sceneId];
      if (!editorial) return _.omit(technical, ["contactSheetData", "contactSheetPath"]);
      const technicalUsableStart = _.toNumber(technical.trimStartSeconds);
      const technicalUsableEnd = _.max([technicalUsableStart, technical.duration - _.toNumber(technical.trimEndSeconds)]) || technical.duration;
      const librarySegments = _.castArray(technical.candidateSegments || technical.segments);
      const editorialSegments = _.uniqBy(
        _.compact(
          _.map(_.castArray(editorial.segments), (segment, segmentIndex) => {
            const selectedLibrarySegment = _.find(librarySegments, { segmentId: _.toString(segment.segmentId) });
            if (!selectedLibrarySegment) return undefined;
            const inSeconds = _.clamp(_.toNumber(selectedLibrarySegment.inSeconds), technicalUsableStart, technicalUsableEnd);
            const outSeconds = _.clamp(_.toNumber(selectedLibrarySegment.outSeconds), inSeconds, technicalUsableEnd);
            if (_.lt(outSeconds - inSeconds, CINEMATIC_EDIT_ANALYSIS_CONFIG.MIN_USABLE_SECONDS)) return undefined;
            return {
              segmentId: _.trim(_.toString(selectedLibrarySegment.segmentId)) || `${technical.sceneId}_segment_${segmentIndex + 1}`,
              inSeconds,
              outSeconds,
              shotRole: segment.shotRole,
              storyContribution: _.trim(_.toString(segment.storyContribution)),
              transition: segment.transition,
              audioBridgeMode: selectedLibrarySegment.audioBridgeMode,
              containsDialogue: Boolean(selectedLibrarySegment.containsDialogue),
            };
          }),
        ),
        "segmentId",
      );
      const segments = _.isEqual(editorial.takeDecision, "omit") ? [] : editorialSegments;
      const selectedStart = _.minBy(segments, "inSeconds")?.inSeconds;
      const selectedEnd = _.maxBy(segments, "outSeconds")?.outSeconds;
      const validSelection =
        Number.isFinite(selectedStart) &&
        Number.isFinite(selectedEnd) &&
        selectedStart >= technicalUsableStart &&
        selectedEnd <= technicalUsableEnd &&
        selectedEnd - selectedStart >= CINEMATIC_EDIT_ANALYSIS_CONFIG.MIN_USABLE_SECONDS;
      const editorialTakeDecision = _.includes(["use", "trim", "omit"], editorial.takeDecision) ? editorial.takeDecision : technical.takeDecision;
      const takeDecision = _.isEqual(technical.takeDecision, "omit") ? technical.takeDecision : editorialTakeDecision;
      return {
        ..._.omit(technical, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
        trimStartSeconds: validSelection ? selectedStart : technicalUsableStart,
        trimEndSeconds: validSelection ? technical.duration - selectedEnd : technical.duration - technicalUsableEnd,
        takeDecision,
        recommendedTransition: editorial.recommendedTransition,
        continuityScore: editorial.continuityScore,
        storyClarityScore: editorial.storyClarityScore,
        performanceScore: editorial.performanceScore,
        dialogueCoverageScore: _.round(_.toNumber(technical.dialogueCoverageRatio) * 100, 2),
        dialogueDetected: !_.isEmpty(technical.detectedSpeechRanges),
        observedShotCount: editorial.observedShotCount,
        segments,
        supportShotType: editorial.supportShotType,
        entryStateObserved: editorial.entryStateObserved,
        exitStateObserved: editorial.exitStateObserved,
        dominantAction: editorial.dominantAction,
        selectedDuration: _.sumBy(segments, (segment) => _.toNumber(segment.outSeconds) - _.toNumber(segment.inSeconds)),
        warnings: _.uniq([...technical.warnings, ..._.castArray(editorial.warnings)]),
        reason: _.join(_.compact([technical.reason, editorial.reason]), ";"),
      };
    });
    return res.json({
      success: true,
      decisions: _.map(decisions, (decision) => _.omit(decision, ["sourcePath", "contactSheetPath", "contactSheetData", "candidateSegments", "shotBoundaries"])),
      libraryAnalysisAvailable,
      editorialReviewAvailable: true,
      aiReviewedSceneCount: reviewableDecisions.length,
      timelineProvenance: "library_ai_refined",
      aiMetadata: editorialAiMetadata,
    });
  } catch (error) {
    logger.warn(LogEvent.VISUAL_QA_ERROR, error);
    return res.json({
      success: true,
      decisions: _.map(analyzedDecisions, (decision) => _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"])),
      libraryAnalysisAvailable,
      editorialReviewAvailable: false,
      timelineProvenance: libraryAnalysisAvailable ? "library" : "ffmpeg",
    });
  } finally {
    fs.rmSync(analysisDir, { recursive: true, force: true });
  }
});

router.post(ROUTER_PATHS.VALIDATE_AUDIO, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_AUDIO, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const audioBase64 = _.toString(req.body?.audioBase64);
  if (_.isEmpty(audioBase64)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Audio is required for quality validation." });
  try {
    let quality: Record<string, unknown> | undefined;
    const rotationLogs: string[] = [];
    let lastError: unknown;
    for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
      try {
        const response = await generateContentWithRetry({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${getAudioQualityPrompt(_.toString(req.body?.script), _.toNumber(req.body?.targetDurationSeconds))}${
                    attempt > 0 ? "\nThe prior response was invalid. Return the entire raw JSON object again with every required field; no patch or commentary." : ""
                  }`,
                },
                { inlineData: { mimeType: _.startsWith(audioBase64, "UklGR") ? "audio/wav" : "audio/mpeg", data: audioBase64 } },
              ],
            },
          ],
          config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: AUDIO_QUALITY_RESPONSE_SCHEMA },
          task: { capability: AiTaskCapability.AudioQa },
        });
        quality = parseAiJsonArtifact<Record<string, unknown>>(response.text, AUDIO_QUALITY_RESPONSE_SCHEMA, "invalid_audio_quality_response");
        if (response.rotationLogs) rotationLogs.push(...response.rotationLogs);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!quality) throw lastError instanceof Error ? lastError : createAppError("invalid_audio_quality_response");
    const result = { success: true, quality, rotationLogs };
    setCache(API_ROUTES.PIPELINE_VALIDATE_AUDIO, req.body, result);
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.UNEXPECTED_ERROR_MERGE_AUDIO, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.ALIGN_VOICE, async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  try {
    const { audioBase64, scenes, segment, projectId, projectName } = req.body;
    if (!audioBase64) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("VOICE_ALIGN_NO_AUDIO", isVi) });
    }
    if (_.isEmpty(scenes) || !_.isArray(scenes)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("VOICE_ALIGN_NO_SCENES", isVi) });
    }

    const tempDir = path.join(getDataDirectory(), ALIGN_CONFIG.TEMP_DIR);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sessionId = randomUUID();
    const audioPath = path.join(tempDir, `${ALIGN_CONFIG.AUDIO_PREFIX}${sessionId}${ALIGN_CONFIG.WAV_EXT}`);
    const scenesPath = path.join(tempDir, `${ALIGN_CONFIG.SCENES_PREFIX}${sessionId}${ALIGN_CONFIG.JSON_EXT}`);
    const outputPath = path.join(tempDir, `${ALIGN_CONFIG.OUTPUT_PREFIX}${sessionId}${ALIGN_CONFIG.JSON_EXT}`);
    const removeTempAlignDirectoryIfEmpty = () => {
      try {
        if (fs.existsSync(tempDir) && _.isEmpty(fs.readdirSync(tempDir))) fs.rmdirSync(tempDir);
      } catch (error: any) {
        if (!_.includes(["ENOENT", "ENOTEMPTY", "EBUSY"], error?.code)) {
          logger.warn(VOICE_ALIGN_LOGS.ERR_DELETE_TEMP_FILES, error);
        }
      }
    };

    const audioBuffer = Buffer.from(audioBase64, REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding);
    fs.writeFileSync(audioPath, audioBuffer);

    fs.writeFileSync(scenesPath, jsonUtils.safeStringify(scenes, null, 2), ENCODING_UTF8);

    const scriptPath = getStaticResourcePath(ALIGN_CONFIG.SCRIPT_FILE);

    const pyCmd = getPythonCommand();
    const checkCmd = ALIGN_CONFIG.CHECK_FASTER_WHISPER_CMD.replace("{0}", pyCmd);
    logger.log(VOICE_ALIGN_LOGS.CHECK_WHISPER);

    exec(checkCmd, (checkError) => {
      if (checkError) {
        logger.log(VOICE_ALIGN_LOGS.WHISPER_NOT_INSTALLED);
        const installCmd = ALIGN_CONFIG.INSTALL_FASTER_WHISPER_CMD.replace("{0}", pyCmd);

        exec(installCmd, (installError, _installStdout, _installStderr) => {
          if (installError) {
            logger.error(`Failed to install faster-whisper: ${installError.message}`);
            try {
              if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
              if (fs.existsSync(scenesPath)) fs.unlinkSync(scenesPath);
            } catch (cleanupErr) {}
            removeTempAlignDirectoryIfEmpty();
            return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
              success: false,
              error: getBackendMsg("VOICE_ALIGN_INSTALL_ERR", isVi).replace("{0}", installError.message),
            });
          }

          logger.log(VOICE_ALIGN_LOGS.WHISPER_INSTALL_SUCCESS);
          runAligner();
        });
      } else {
        logger.log(VOICE_ALIGN_LOGS.WHISPER_ALREADY_INSTALLED);
        runAligner();
      }
    });

    const runAligner = async () => {
      let folderName = projectId || (projectName ? getSafeFolderName(projectName) : "default_project");

      const pyCmd = getPythonCommand();
      let cmd = `"${pyCmd}" "${scriptPath}" "${audioPath}" "${scenesPath}" "${outputPath}"`;
      if (segment && projectId) {
        const outputDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, folderName, ALIGN_CONFIG.VOICES_DIR);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        _.forEach(
          _.filter(fs.readdirSync(outputDir), (fileName) => {
            if (!ALIGN_CONFIG.LEGACY_SEGMENT_FILE_REGEX.test(fileName)) return false;
            const canonicalFileName = _.replace(fileName, ALIGN_CONFIG.LEGACY_SEGMENT_PREFIX, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
            return fs.existsSync(path.join(outputDir, canonicalFileName));
          }),
          (fileName) => {
            try {
              fs.unlinkSync(path.join(outputDir, fileName));
            } catch (error) {
              logger.error(VOICE_ALIGN_LOGS.ERR_DELETE_TEMP_FILES, error);
            }
          },
        );
      }
      logger.log(`Running voice aligner command: ${cmd}`);

      exec(cmd, async (error, stdout, stderr) => {
        const cleanup = () => {
          try {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            if (fs.existsSync(scenesPath)) fs.unlinkSync(scenesPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (err) {
            logger.error(VOICE_ALIGN_LOGS.ERR_DELETE_TEMP_FILES, err);
          } finally {
            removeTempAlignDirectoryIfEmpty();
          }
        };

        if (error) {
          cleanup();
          logger.error(`${VOICE_ALIGN_LOGS.ERR_RUNNING_SCRIPT}${error.message}`);
          if (stdout) logger.error(`${VOICE_ALIGN_LOGS.PYTHON_STDOUT}${stdout}`);
          if (stderr) logger.error(`${VOICE_ALIGN_LOGS.PYTHON_STDERR}${stderr}`);

          const pythonError = stderr || stdout;
          return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: pythonError ? pythonError : error.message,
          });
        }

        try {
          if (!fs.existsSync(outputPath)) {
            throw new Error(getBackendMsg("VOICE_ALIGN_MISSING_OUTPUT", isVi));
          }

          const rawResult = fs.readFileSync(outputPath, ENCODING_UTF8);
          const result = jsonUtils.safeParse<any>(rawResult, null);
          if (!result) throw new Error(REFACTOR_CONSTANTS.LOG_ERROR_GENERAL);

          fs.unlinkSync(outputPath);

          if (segment && projectId && result.success && _.isArray(result.alignments)) {
            const cutAudioSegment = (src: string, dest: string, start: number, end: number): Promise<void> => {
              return new Promise<void>((resolve) => {
                const ffmpegBinary = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);
                const ffmpegCmd = fs.existsSync(ffmpegBinary) ? `"${ffmpegBinary}"` : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD;
                const cmdRun = `${ffmpegCmd} -y -ss ${start} -to ${end} -i "${src}" "${dest}"`;
                exec(cmdRun, (err) => {
                  if (err) {
                    logger.error(`Error cutting segment: ${cmdRun}`, err);
                  }
                  resolve();
                });
              });
            };

            for (const align of result.alignments) {
              const startVal = align.start;
              const endVal = align.end;
              if (!_.isNil(startVal) && !_.isNil(endVal)) {
                const idStr = String(align.id);
                const cleanId = _.startsWith(idStr, EXPORT_ZIP_CONFIG.SCENE_PREFIX) ? idStr.slice(EXPORT_ZIP_CONFIG.SCENE_PREFIX.length) : idStr;
                const fileName = `${ALIGN_CONFIG.SEGMENT_PREFIX}${sessionId}_${cleanId}${ALIGN_CONFIG.WAV_EXT}`;
                const outPath = path.join(tempDir, fileName);
                await cutAudioSegment(audioPath, outPath, _.toNumber(startVal), _.toNumber(endVal));
                if (fs.existsSync(outPath)) {
                  const slicedBuffer = fs.readFileSync(outPath);
                  align.audioBase64 = slicedBuffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding);
                  fs.unlinkSync(outPath);
                }
              }
            }
          }

          cleanup();
          return res.json(result);
        } catch (err: any) {
          cleanup();
          logger.error(`Error parsing python_scripts/voice_aligner.py output: ${err.message}`);
          if (fs.existsSync(outputPath)) {
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {}
          }
          return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: getBackendMsg("VOICE_ALIGN_PARSE_ERR", isVi).replace("{0}", err.message),
          });
        }
      });
    };
  } catch (err: any) {
    logger.error(VOICE_ALIGN_LOGS.ERR_UNEXPECTED_ALIGN, err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: ErrorMessage.INTERNAL_SERVER_ERROR + err.message });
  }
});

router.post("/run-ultra", async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const {
    filePath,
    geminiApiKey,
    sfxFolder,
    opts,
    isAutoMode,
    templateId,
    parentFolder,
    imagesDir,
    voicesDir,
    projectStyle,
    projectName,
    autoExportVideo,
    videoOutputDir,
    projectId,
  } = req.body;

  if (!isAutoMode && !filePath) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: getBackendMsg("ULTRA_FILE_REQUIRED", isVi),
    });
  }

  if (!isAutoMode && !fs.existsSync(filePath)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: getBackendMsg("ULTRA_FILE_NOT_FOUND", isVi),
    });
  }

  const tempOutputPath = filePath + ".ultra_tmp";
  const uniqueId = randomUUID().substring(0, 8);
  const optsJsonPath = path.join(getDataDirectory(), `ultra_opts_${uniqueId}.json`);

  let finalProjectName = projectName;
  if (_.isEmpty(_.trim(finalProjectName))) {
    const d = new Date();
    const pad = (n: number) => _.padStart(n.toString(), 2, "0");
    finalProjectName = `AI_CAPCUT_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear().toString().substring(2)}`;
  }

  let realTemplateId = templateId || "";
  if (isAutoMode && realTemplateId && fs.existsSync(realTemplateId)) {
    try {
      const rawContent = fs.readFileSync(realTemplateId, FileEncoding.UTF8 as any).toString();
      const templateContent = jsonUtils.safeParse<any>(rawContent, {});
      if (templateContent.folderPath) realTemplateId = path.join(templateContent.folderPath, "draft_content.json");
    } catch (e) {
      logger.error("Error reading template file:", e);
    }
  }

  let finalImagesDir = imagesDir || "";
  let finalVoicesDir = voicesDir || "";

  if (projectId) {
    finalImagesDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "images");
    finalVoicesDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "voices");
  }

  const cmdOpts = {
    ...opts,
    api_key: geminiApiKey || "",
    sfx_folder: sfxFolder || "",
    is_auto_mode: isAutoMode || false,
    template_id: realTemplateId,
    parent_folder: parentFolder || "",
    images_dir: finalImagesDir,
    voices_dir: finalVoicesDir,
    project_style: projectStyle || {},
    project_name: finalProjectName,
    auto_export_video: autoExportVideo || false,
    video_output_dir: videoOutputDir || "",
  };

  try {
    fs.writeFileSync(optsJsonPath, jsonUtils.safeStringify(cmdOpts, null, 2), FileEncoding.UTF8 as any);

    res.setHeader(HTTP_HEADERS.CONTENT_TYPE, CONTENT_TYPES.NDJSON);
    res.setHeader(HTTP_HEADERS.TRANSFER_ENCODING, TRANSFER_ENCODINGS.CHUNKED);

    const pyCmd = getPythonCommand();
    const scriptPath = getStaticResourcePath("python_scripts/capcut_ultra_tool.py");
    const safeFilePath = filePath || CAPCUT_CONFIG.AUTO_MODE_INPUT_PATH;
    logger.log(`${getBackendMsg("ULTRA_SPAWN_LOG", isVi)} "${pyCmd}" -u "${scriptPath}" "${safeFilePath}" "${tempOutputPath}" "${optsJsonPath}"`);
    const pythonProcess = spawn(pyCmd, ["-u", scriptPath, safeFilePath, tempOutputPath, optsJsonPath]);

    pythonProcess.stdout.on("data", (data) => {
      _.forEach(_.split(data.toString(), "\n"), (line) => {
        const trimmed = _.trim(line);
        if (!_.isEmpty(trimmed)) {
          const autoPathMatch = trimmed.match(REGEX_AUTO_MODE_PATH);
          if (autoPathMatch && autoPathMatch[1]) {
          }
          res.write(jsonUtils.safeStringify({ type: UltraStreamLogType.LOG, message: trimmed }) + "\n");
        }
      });
    });

    pythonProcess.stderr.on("data", (data) => {
      _.forEach(_.split(data.toString(), "\n"), (line) => {
        const trimmed = _.trim(line);
        if (!_.isEmpty(trimmed)) {
          res.write(jsonUtils.safeStringify({ type: UltraStreamLogType.ERROR_LOG, message: trimmed }) + "\n");
        }
      });
    });

    pythonProcess.on("close", async (code) => {
      try {
        if (fs.existsSync(optsJsonPath)) fs.unlinkSync(optsJsonPath);
      } catch (cleanupErr) {}

      if (code !== 0) {
        try {
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        } catch (cleanupErr) {}

        logger.error(`CapCut Ultra process failed with exit code ${code}`);
        res.write(
          jsonUtils.safeStringify({
            success: false,
            error: getBackendMsg("ULTRA_EXIT_ERROR", isVi).replace("{0}", code.toString()),
          }) + "\n",
        );
        res.end();
        return;
      }

      try {
        if (fs.existsSync(tempOutputPath)) {
          const dirPath = path.dirname(filePath);
          const bakFilePath = path.join(dirPath, "draft_content.json.bak");
          const lockFilePath = path.join(dirPath, ".locked");
          const metaFilePath = path.join(dirPath, "draft_meta_info.json");

          if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, filePath + ".backup_ultra");
          }

          fs.copyFileSync(tempOutputPath, filePath);
          fs.copyFileSync(tempOutputPath, bakFilePath);
          fs.unlinkSync(tempOutputPath);

          if (fs.existsSync(lockFilePath)) {
            try {
              fs.unlinkSync(lockFilePath);
              logger.log(getBackendMsg("ULTRA_CLEANED_LOCK", isVi));
            } catch (lockErr: any) {
              logger.error(`Failed to delete .locked: ${lockErr.message}`);
            }
          }

          if (fs.existsSync(metaFilePath)) {
            try {
              const metaContent = fs.readFileSync(metaFilePath, FileEncoding.UTF8 as any).toString();
              const metaObj = jsonUtils.safeParse<any>(metaContent, {});
              const now = Date.now();
              metaObj.modify_time = now;
              metaObj.tm_draft_modified = Math.floor(now / 1000);

              fs.writeFileSync(metaFilePath, jsonUtils.safeStringify(metaObj), FileEncoding.UTF8 as any);
              logger.log(getBackendMsg("ULTRA_UPDATED_META", isVi));
            } catch (metaErr: any) {
              logger.error(`Failed to update draft_meta_info.json: ${metaErr.message}`);
            }
          }
        }
        res.write(
          jsonUtils.safeStringify({
            success: true,
            message: getBackendMsg("ULTRA_SUCCESS", isVi),
          }) + "\n",
        );
      } catch (fsErr: any) {
        logger.error(`File copy/rename/update failed: ${fsErr.message}`);
        res.write(
          jsonUtils.safeStringify({
            success: false,
            error: fsErr.message,
          }) + "\n",
        );
      }
      res.end();
    });
  } catch (err: any) {
    try {
      if (fs.existsSync(optsJsonPath)) fs.unlinkSync(optsJsonPath);
    } catch (cleanupErr) {}
    try {
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanupErr) {}
    logger.error(getBackendMsg("ULTRA_UNEXPECTED_ERR", isVi).replace("{0}", err.message));
    res.write(
      jsonUtils.safeStringify({
        success: false,
        error: err.message,
      }) + "\n",
    );
    res.end();
  }
});

router.post("/select-file", async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const pyCmd = getPythonCommand();
  const scriptPath = getStaticResourcePath("python_scripts/capcut_ultra_tool.py");
  const cmd = `"${pyCmd}" "${scriptPath}" select-file`;
  logger.log(getBackendMsg("ULTRA_RUN_SELECT_FILE", isVi).replace("{0}", cmd));

  exec(cmd, (error, stdout, _stderr) => {
    if (error) {
      logger.error(getBackendMsg("ULTRA_SELECT_FILE_FAIL", isVi).replace("{0}", error.message));
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: getBackendMsg("SELECT_FILE_FAILED", isVi) });
    }
    return res.json({ success: true, filePath: stdout.trim() });
  });
});

router.post("/select-folder", async (req: Request, res: Response) => {
  const isVi = isVietnameseRequest(req);
  const pyCmd = getPythonCommand();
  const scriptPath = getStaticResourcePath("python_scripts/capcut_ultra_tool.py");
  const cmd = `"${pyCmd}" "${scriptPath}" select-folder`;
  logger.log(getBackendMsg("ULTRA_RUN_SELECT_FOLDER", isVi).replace("{0}", cmd));

  exec(cmd, (error, stdout, _stderr) => {
    if (error) {
      logger.error(getBackendMsg("ULTRA_SELECT_FOLDER_FAIL", isVi).replace("{0}", error.message));
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: getBackendMsg("SELECT_FOLDER_FAILED", isVi) });
    }
    return res.json({ success: true, folderPath: stdout.trim() });
  });
});

router.post(ROUTER_PATHS.SAVE_FILE, async (req: Request, res: Response) => {
  const suggestedName = path.basename(_.trim(_.toString(req.body?.suggestedName)) || SUNO_AUTOMATION_CONFIG.DEFAULT_SAVE_FILE_NAME);
  const extension = path.extname(suggestedName) || SUNO_AUTOMATION_CONFIG.TXT_EXTENSION;
  const dataMatch = _.toString(req.body?.dataUrl).match(SUNO_AUTOMATION_PATTERNS.DATA_URL_BASE64);
  if (!dataMatch) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, error: SUNO_AUTOMATION_TEXTS.INVALID_FILE_DATA_ERR });
  const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), SUNO_AUTOMATION_CONFIG.SAVE_FILE_TEMP_PREFIX));
  const temporaryPath = path.join(temporaryDirectory, `${SUNO_AUTOMATION_CONFIG.SAVE_FILE_PAYLOAD_NAME}${extension}`);
  try {
    await fs.promises.writeFile(temporaryPath, Buffer.from(dataMatch[2], SUNO_AUTOMATION_CONFIG.ENCODING_BASE64 as BufferEncoding));
    const savedPath = await new Promise<string>((resolve, reject) => {
      execFile(getPythonCommand(), [getStaticResourcePath(SUNO_AUTOMATION_CONFIG.CAPCUT_ULTRA_TOOL_SCRIPT), SUNO_AUTOMATION_CONFIG.CMD_SAVE_FILE, temporaryPath, suggestedName, extension], { windowsHide: true }, (error, stdout) => {
        if (error) reject(error);
        else resolve(_.trim(stdout));
      });
    });
    return res.json({ success: true, cancelled: _.isEmpty(savedPath), filePath: savedPath });
  } catch (error) {
    logger.error(SUNO_AUTOMATION_TEXTS.SAVE_FILE_DIALOG_FAILED_LOG, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: SUNO_AUTOMATION_TEXTS.SAVE_FILE_DIALOG_FAILED_ERR });
  } finally {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
});

router.post("/export-zip", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_MISSING_PROJECT });
    }

    const project = await getProjectDetailFromDb(projectId);
    if (!project) {
      return res.status(404).json({ error: EXPORT_ZIP_CONFIG.ERR_PROJECT_NOT_FOUND });
    }

    const scenes = _.get(project, "storyboard", []);
    const voiceUrl = _.get(project, "voiceConfig.audioUrl");
    const sceneAssetPaths = _.map(scenes, (scene) => resolveLocalProjectAssetPath(_.toString(scene.assetUrl)));
    if (_.isEmpty(scenes) || _.some(scenes, (scene, index) => scene.assetStatus !== SceneAssetStatus.Approved || _.isEmpty(sceneAssetPaths[index]))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_SCENE_ASSETS_REQUIRED });
    }
    const fullAudioPath = resolveLocalProjectAssetPath(_.toString(voiceUrl));
    if (!fullAudioPath) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_VOICE_REQUIRED });
    }
    const approvedCover = _.find(
      project.thumbnails,
      (thumbnail) => !_.isEmpty(thumbnail.imageUrl) && (thumbnail.approved || _.includes([AssetAcceptance.Approved, AssetAcceptance.AcceptedWithWarning], thumbnail.acceptance)),
    );
    const coverPath = resolveLocalProjectAssetPath(_.toString(approvedCover?.imageUrl));
    if (!coverPath) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_COVER_REQUIRED });
    }

    if (!_.isEmpty(scenes)) {
      const voicesDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, EXPORT_ZIP_CONFIG.VOICES_DIR);

      if (!fs.existsSync(voicesDir)) {
        fs.mkdirSync(voicesDir, { recursive: true });
      }

      const cutAudioSegment = (src: string, dest: string, start: number, end: number): Promise<void> =>
        new Promise((resolve, reject) => {
          const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");
          const ffmpegCmd = fs.existsSync(ffmpegBinary) ? `"${ffmpegBinary}"` : "ffmpeg";
          const cmd = `${ffmpegCmd} -y -ss ${start} -to ${end} -i "${src}" "${dest}"`;
          exec(cmd, (err) => {
            if (err) {
              logger.error(`Error cutting segment for ZIP: ${cmd}`, err);
              reject(new Error(EXPORT_ZIP_CONFIG.ERR_AUDIO_SPLIT_FAILED));
              return;
            }
            resolve();
          });
        });

      for (const sc of scenes) {
        const startVal = _.get(sc, "_start");
        const endVal = _.get(sc, "_end");
        if (_.isNil(startVal) || _.isNil(endVal)) {
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_AUDIO_SPLIT_FAILED });
        }
        const scIdStr = String(sc.id);
        const cleanId = _.startsWith(scIdStr, EXPORT_ZIP_CONFIG.SCENE_PREFIX) ? scIdStr.slice(EXPORT_ZIP_CONFIG.SCENE_PREFIX.length) : scIdStr;
        const outPath = path.join(voicesDir, `${EXPORT_ZIP_CONFIG.SCENE_PREFIX}${cleanId}${EXPORT_ZIP_CONFIG.WAV_EXT}`);
        const slash = COMMON_STRINGS.SLASH_PREFIX;
        sc.audioUrl = `${slash}${ASSETS_DIR_NAME}${slash}${PROJECTS_DIR_NAME}${slash}${projectId}${slash}${EXPORT_ZIP_CONFIG.VOICES_DIR}${slash}${EXPORT_ZIP_CONFIG.SCENE_PREFIX}${cleanId}${EXPORT_ZIP_CONFIG.WAV_EXT}`;
        await cutAudioSegment(fullAudioPath, outPath, _.toNumber(startVal), _.toNumber(endVal));
      }
    }

    const zip = new JSZip();
    const folderKey = `{${CAPCUT_CONFIG.ACTIVE_FOLDER_UUID}}`;

    zip.folder(folderKey);
    zip.folder(`${folderKey}/adjust_mask`);
    zip.folder(`${folderKey}/common_attachment`);
    zip.folder(`${folderKey}/matting`);
    zip.folder(`${folderKey}/qr_upload`);
    zip.folder(`${folderKey}/Resources`);
    zip.folder(`${folderKey}/Resources/voices`);
    zip.folder(`${folderKey}/${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}`);
    zip.folder(`${folderKey}/Resources/voice_images`);
    zip.folder(`${folderKey}/Resources/original_voices`);
    zip.folder(`${folderKey}/smart_crop`);
    zip.folder(`${folderKey}/subdraft`);
    zip.folder(`${folderKey}/Timelines`);

    const coverBuffer = fs.readFileSync(coverPath);
    zip.file(CAPCUT_CONFIG.COVER_FILENAME, coverBuffer);
    zip.file(`${folderKey}/${CAPCUT_CONFIG.COVER_FILENAME}`, coverBuffer);

    _.forEach(sceneAssetPaths, (sceneAssetPath, index) => {
      const filename = `${index + 1}_image.jpg`;
      const imgBuffer = fs.readFileSync(sceneAssetPath!);
      zip.file(`${folderKey}/${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}/${filename}`, imgBuffer);
      zip.file(`${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}/${filename}`, imgBuffer);
      zip.file(`${folderKey}/Resources/voice_images/${filename}`, imgBuffer);
      zip.file(`Resources/voice_images/${filename}`, imgBuffer);
    });

    _.forEach(scenes, (sc, index) => {
      const filename = `${index + 1}_voice.wav`;
      if (sc.audioUrl) {
        const relativePath = _.startsWith(sc.audioUrl, "/") ? sc.audioUrl.slice(1) : sc.audioUrl;
        const fullPath = path.join(getDataDirectory(), relativePath);
        if (fs.existsSync(fullPath)) {
          const audioBuffer = fs.readFileSync(fullPath);
          zip.file(`${folderKey}/Resources/voices/${filename}`, audioBuffer);
          zip.file(`Resources/voices/${filename}`, audioBuffer);
          zip.file(`${folderKey}/Resources/voice_images/${filename}`, audioBuffer);
          zip.file(`Resources/voice_images/${filename}`, audioBuffer);
        }
      }
    });

    const fullAudioBuffer = fs.readFileSync(fullAudioPath);
    zip.file(`${folderKey}/${CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME}`, fullAudioBuffer);
    zip.file(CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME, fullAudioBuffer);
    zip.file(`${folderKey}/Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, fullAudioBuffer);
    zip.file(`Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, fullAudioBuffer);

    const capcutMaterials: any = {
      audios: [],
      beats: [],
      canvases: [],
      chromas: [],
      colors: [],
      drafts: [],
      effects: [],
      flowers: [],
      images: [],
      keyframes: [],
      manual_deformations: [],
      masks: [],
      sound_channel_mappings: [],
      speeds: [],
      stickers: [],
      tail_leaders: [],
      texts: [],
      transitions: [],
      video_effects: [],
      videos: [],
      vocal_separations: [],
    };

    const videoTrackSegments: any[] = [];
    const subtitleTrackSegments: any[] = [];
    const audioTrackSegments: any[] = [];

    const parseTimeToSecondsHelper = (timeStr: string | undefined): number => {
      if (!timeStr) return 0;
      const parts = _.split(timeStr.trim(), ":");
      let secs = 0;
      if (parts.length === 3) secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      else if (parts.length === 2) secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      else if (parts.length === 1) secs = parseFloat(parts[0]);
      return isNaN(secs) ? 0 : secs;
    };

    let elapsed = 0;
    const sceneRanges = _.map(scenes, (sc) => {
      const startSec = parseTimeToSecondsHelper(sc.startTime);
      const endSec = parseTimeToSecondsHelper(sc.endTime);
      const start = sc.startTime && startSec >= 0 ? startSec : elapsed;
      const duration = sc.duration || 5;
      const end = sc.endTime && endSec > start ? endSec : start + duration;
      const actualDuration = end - start;
      elapsed = end;
      return { id: sc.id, start, end, duration: actualDuration, cameraMotion: sc.cameraMotion, transition: sc.transition, subtitle: sc.subtitle || sc.script || "" };
    });

    const totalDurationUs = !_.isEmpty(sceneRanges) ? Math.round(sceneRanges[sceneRanges.length - 1].end * 1000000) : 0;

    _.forEach(sceneRanges, (scRange, idx) => {
      const startUs = Math.round(scRange.start * 1000000);
      const durationUs = Math.round(scRange.duration * 1000000);
      const filename = `${idx + 1}_voice.wav`;
      const materialId = `material_audio_scene_${scRange.id}`;

      capcutMaterials.audios.push({
        id: materialId,
        type: "audio",
        duration: durationUs,
        source_platform: CAPCUT_CONFIG.SOURCE_PLATFORM_TTS,
        local_material_path: `${CAPCUT_CONFIG.LOCAL_DRAFT_PATH_PREFIX}/${folderKey}/Resources/voices/${filename}`,
      });

      audioTrackSegments.push({
        id: `seg_audio_scene_${scRange.id}`,
        material_id: materialId,
        source_timerange: {
          duration: durationUs,
          start: 0,
        },
        target_timerange: {
          duration: durationUs,
          start: startUs,
        },
        speed: 1.0,
        volume: project.voiceConfig?.volume || 1.0,
      });
    });

    _.forEach(sceneRanges, (timing, index) => {
      const imgMatId = `material_image_${timing.id}`;
      const timingDurationUs = Math.round(timing.duration * 1000000);
      const timingStartUs = Math.round(timing.start * 1000000);

      capcutMaterials.images.push({
        id: imgMatId,
        type: "image",
        duration: timingDurationUs,
        local_material_path: `${CAPCUT_CONFIG.LOCAL_DRAFT_PATH_PREFIX}/${folderKey}/${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}/${index + 1}_image.jpg`,
      });

      videoTrackSegments.push({
        id: `seg_backup_video_slide_${timing.id}`,
        material_id: imgMatId,
        source_timerange: {
          duration: timingDurationUs,
          start: 0,
        },
        target_timerange: {
          duration: timingDurationUs,
          start: timingStartUs,
        },
        extra_info: {
          camera_motion: timing.cameraMotion,
          transition_effect: timing.transition,
        },
      });

      const textMatId = `material_text_${timing.id}`;
      capcutMaterials.texts.push({
        id: textMatId,
        type: "text",
        content: jsonUtils.safeStringify({
          text: timing.subtitle,
          styles: {
            font_size: 15.0,
            text_color: "#ffff00",
            stroke: true,
            stroke_color: "#000000",
          },
        }),
      });

      subtitleTrackSegments.push({
        id: `seg_subtitle_${timing.id}`,
        material_id: textMatId,
        source_timerange: null,
        target_timerange: {
          duration: timingDurationUs,
          start: timingStartUs,
        },
      });
    });

    const draftContentObj = {
      canvas_config: {
        height: CAPCUT_CONFIG.CANVAS_HEIGHT,
        width: CAPCUT_CONFIG.CANVAS_WIDTH,
        ratio: CAPCUT_CONFIG.CANVAS_RATIO,
      },
      duration: totalDurationUs,
      id: "draft_root_timeline",
      materials: capcutMaterials,
      tracks: [
        {
          id: "track_video_timeline",
          type: "video",
          segments: videoTrackSegments,
        },
        {
          id: "track_audio_timeline",
          type: "audio",
          segments: audioTrackSegments,
        },
        {
          id: "track_subtitle_timeline",
          type: "text",
          segments: subtitleTrackSegments,
        },
      ],
    };

    const draftContentStr = jsonUtils.safeStringify(draftContentObj, null, 2);

    const writeDraftFile = (name: string, content: string) => {
      zip.file(name, content);
      zip.file(`${folderKey}/${name}`, content);
    };

    writeDraftFile(CAPCUT_CONFIG.DRAFT_CONTENT_FILENAME, draftContentStr);
    writeDraftFile(CAPCUT_CONFIG.DRAFT_CONTENT_BAK_FILENAME, draftContentStr);

    writeDraftFile(CAPCUT_CONFIG.ATTACHMENT_EDITING_FILENAME, jsonUtils.safeStringify({ editing_items: [], version: 1 }, null, 2));
    writeDraftFile(
      CAPCUT_CONFIG.ATTACHMENT_PC_COMMON_FILENAME,
      jsonUtils.safeStringify({ device_id: CAPCUT_CONFIG.DEVICE_ID, client_version: CAPCUT_CONFIG.CLIENT_VERSION, system_info: CAPCUT_CONFIG.SYSTEM_INFO }, null, 2),
    );
    writeDraftFile(
      CAPCUT_CONFIG.DRAFT_EXTRA_FILENAME,
      jsonUtils.safeStringify({ client_os: "win", author: CAPCUT_CONFIG.AUTHOR, sync_time: Math.floor(Date.now() / 1000) }, null, 2),
    );
    writeDraftFile(CAPCUT_CONFIG.DRAFT_AGENCY_CONFIG_FILENAME, jsonUtils.safeStringify({ agency_id: "", org_id: "", user_id: CAPCUT_CONFIG.USER_ID }, null, 2));
    writeDraftFile(CAPCUT_CONFIG.DRAFT_BIZ_CONFIG_FILENAME, jsonUtils.safeStringify({ commercial_use: false, music_copyright_check: true }, null, 2));

    const draftMetaInfoObj = {
      draft_id: CAPCUT_CONFIG.ACTIVE_FOLDER_UUID,
      draft_name: project.name || "AI_Video_Draft",
      draft_type: "video",
      create_time: Date.now(),
      modify_time: Date.now(),
      draft_duration: totalDurationUs,
      tm_draft_modified: Math.floor(Date.now() / 1000),
      draft_cover_path: CAPCUT_CONFIG.COVER_FILENAME,
      draft_fold_path: "",
    };
    writeDraftFile(CAPCUT_CONFIG.DRAFT_META_INFO_FILENAME, jsonUtils.safeStringify(draftMetaInfoObj, null, 2));

    const draftSettings = {
      project_setting: {
        fps: CAPCUT_CONFIG.FPS,
        ratio: CAPCUT_CONFIG.CANVAS_RATIO,
        width: CAPCUT_CONFIG.CANVAS_WIDTH,
        height: CAPCUT_CONFIG.CANVAS_HEIGHT,
      },
      export_setting: {
        resolution: CAPCUT_CONFIG.RESOLUTION,
        fps: CAPCUT_CONFIG.FPS,
        rate_control: CAPCUT_CONFIG.RATE_CONTROL,
        bit_rate: CAPCUT_CONFIG.BIT_RATE,
      },
    };
    writeDraftFile(CAPCUT_CONFIG.DRAFT_SETTINGS_FILENAME, jsonUtils.safeStringify(draftSettings, null, 2));
    writeDraftFile(CAPCUT_CONFIG.DRAFT_VIRTUAL_STORE_FILENAME, jsonUtils.safeStringify({ cache_items: [], local_res_map: [] }, null, 2));
    writeDraftFile(CAPCUT_CONFIG.KEY_VALUE_FILENAME, jsonUtils.safeStringify({ draft_opened_count: 1, last_open_time: Math.floor(Date.now() / 1000) }, null, 2));
    writeDraftFile(CAPCUT_CONFIG.PERFORMANCE_OPT_FILENAME, jsonUtils.safeStringify({ enable_proxy: false, render_quality: 100 }, null, 2));
    writeDraftFile(CAPCUT_CONFIG.TEMPLATE_TMP_FILENAME, TEMPLATE_TMP_CONTENT(project.name));
    writeDraftFile(CAPCUT_CONFIG.TIMELINE_LAYOUT_FILENAME, jsonUtils.safeStringify({ track_scale: 1.0, timeline_scroll_x: 0.0, ruler_offset: 0 }, null, 2));

    const content = await zip.generateAsync({
      type: "nodebuffer",
      compression: "STORE",
    });

    res.setHeader("Content-Type", "application/zip");
    const safeFileName = encodeURIComponent(project.name.replace(WHITESPACE_REGEX, "_"));
    res.setHeader("Content-Disposition", `attachment; filename=${safeFileName}_CapCut_Project_Bundle.zip`);
    return res.send(content);
  } catch (error: any) {
    logger.error(EXPORT_ZIP_CONFIG.LOG_EXPORT_FAILED, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: EXPORT_ZIP_CONFIG.ERR_EXPORT_FAILED });
  }
});

router.get("/templates", (req: Request, res: Response) => {
  const isVi = req.query?.lang !== ProjectLanguage.EN;
  try {
    const templates = listTemplates();
    res.json(templates);
  } catch (error: any) {
    logger.error(getBackendMsg("TEMPLATE_LIST_FAILED", isVi), error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("TEMPLATE_LIST_FAILED", isVi) });
  }
});

router.post("/templates", express.json({ limit: TEMPLATE_CONFIG.PAYLOAD_LIMIT }), (req: Request, res: Response) => {
  const isVi = req.query?.lang !== ProjectLanguage.EN;
  try {
    const { name, folderPath } = req.body;
    if (_.isEmpty(_.trim(name)) || _.isEmpty(_.trim(folderPath))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("TEMPLATE_NAME_REQUIRED", isVi) });
    }
    const template = saveTemplate(name, folderPath);
    res.json(template);
  } catch (error: any) {
    logger.error(getBackendMsg("TEMPLATE_SAVE_FAILED", isVi), error);
    let errorMsg = getBackendMsg("TEMPLATE_SAVE_FAILED", isVi);
    if (error.message === "EXCEED_MAX_TEMPLATES") errorMsg = PIPELINE_CONTROLLER_MESSAGES.TEMPLATE_LIMIT_REACHED[isVi ? "vi" : "en"];
    else if (error.message === "INVALID_CAPCUT_TEMPLATE") errorMsg = PIPELINE_CONTROLLER_MESSAGES.TEMPLATE_INVALID_FOLDER[isVi ? "vi" : "en"];
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: errorMsg });
  }
});

router.delete("/templates/:id", (req: Request, res: Response) => {
  const isVi = req.query?.lang !== ProjectLanguage.EN;
  try {
    const { id } = req.params;
    const deleted = deleteTemplate(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: getBackendMsg("TEMPLATE_NOT_FOUND", isVi) });
    }
  } catch (error: any) {
    logger.error(getBackendMsg("TEMPLATE_DELETE_FAILED", isVi), error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("TEMPLATE_DELETE_FAILED", isVi) });
  }
});

router.put("/templates/:id", express.json(), (req: Request, res: Response) => {
  const isVi = req.query?.lang !== ProjectLanguage.EN;
  try {
    const { id } = req.params;
    const { newName } = req.body;
    if (_.isEmpty(_.trim(newName))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("TEMPLATE_RENAME_REQUIRED", isVi) });
    }
    const updated = renameTemplate(id, newName);
    if (updated) res.json(updated);
    else {
      res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: getBackendMsg("TEMPLATE_RENAME_NOT_FOUND", isVi) });
    }
  } catch (error: any) {
    logger.error(getBackendMsg("TEMPLATE_RENAME_FAILED", isVi), error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("TEMPLATE_RENAME_FAILED", isVi) });
  }
});

router.post(ROUTER_PATHS.REFERENCE_ASSETS, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.params.projectId));
  const group = _.toString(req.params.group);
  const allowed = _.values(REFERENCE_ASSET_GROUP);
  if (!_.includes(allowed, group) || _.isEmpty(projectId)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  const directory = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "references", group);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  if (!_.startsWith(_.toLower(directory), _.toLower(_.join([projectRoot, path.sep], ""))))
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  fs.mkdirSync(directory, { recursive: true });
  const assets: string[] = [];
  try {
    _.forEach(_.take(_.castArray(req.body?.images), 10), (image, index) => {
      const match = _.toString(image).match(REFACTOR_CONSTANTS.IMAGE_DATA_URL_CAPTURE_REGEX);
      if (!match) {
        if (_.startsWith(_.toString(image), `/${ASSETS_DIR_NAME}/`)) assets.push(_.toString(image));
        return;
      }
      const extension = _.includes(match[1], "png") ? "png" : _.includes(match[1], "webp") ? "webp" : "jpg";
      const filename = `ref_${index + 1}_${createHash("sha256").update(match[2]).digest("hex").slice(0, 12)}.${extension}`;
      const filePath = path.join(directory, filename);
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
      assets.push(`/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/references/${group}/${filename}`);
    });
    return res.json({ success: true, assets });
  } catch (error: any) {
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.post("/delete-asset-file", async (req: Request, res: Response) => {
  const assetUrl = _.toString(req.body?.assetUrl);
  const projectId = path.basename(_.toString(req.body?.projectId));
  if (_.isEmpty(assetUrl) || _.isEmpty(projectId)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  let cleanAssetPath = assetUrl;
  const projectPrefix = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/`;
  if (_.startsWith(cleanAssetPath, projectPrefix)) {
    cleanAssetPath = cleanAssetPath.slice(projectPrefix.length);
  } else if (_.includes(cleanAssetPath, `${projectId}/`)) {
    cleanAssetPath = cleanAssetPath.slice(cleanAssetPath.indexOf(`${projectId}/`) + projectId.length + 1);
  }
  const targetPath = path.resolve(projectRoot, cleanAssetPath);
  if (_.startsWith(_.toLower(targetPath), _.toLower(`${projectRoot}${path.sep}`))) {
    try {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        logger.info(`[Asset Cleanup] Deleted asset file: ${targetPath}`);
      }
    } catch (e: any) {
      logger.warn(`[Asset Cleanup] Failed to unlink file ${targetPath}:`, e?.message);
    }
  }

  try {
    const project = await getProjectDetailFromDb(projectId);
    if (project && project.visualConfig) {
      let changed = false;
      const filterOut = (arr?: string[]) => {
        if (!_.isArray(arr)) return arr;
        const next = _.filter(arr, (u) => !_.includes(u, cleanAssetPath) && u !== assetUrl);
        if (next.length !== arr.length) {
          changed = true;
          return next;
        }
        return arr;
      };

      project.visualConfig.referenceImages = filterOut(project.visualConfig.referenceImages) || [];
      project.visualConfig.styleReferenceImages = filterOut(project.visualConfig.styleReferenceImages) || [];
      project.visualConfig.sceneReferenceImages = filterOut(project.visualConfig.sceneReferenceImages) || [];
      project.visualConfig.thumbnailReferenceImages = filterOut(project.visualConfig.thumbnailReferenceImages) || [];
      project.visualConfig.thumbnailSceneReferenceImages = filterOut(project.visualConfig.thumbnailSceneReferenceImages) || [];

      if (changed) {
        await saveProjectDetailToDb(project);
        logger.info(`[Asset Cleanup] Cleaned up deleted reference image from DB for project ${projectId}`);
      }
    }
    return res.json({ success: true });
  } catch (error: any) {
    logger.error(`[Asset Cleanup] Error updating DB for project ${projectId}:`, error);
    return res.json({ success: true, warning: error.message });
  }
});

router.delete(`${ROUTER_PATHS.REFERENCE_ASSETS}/:projectId/:group/:filename`, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.params.projectId));
  const group = _.toString(req.params.group);
  const filename = path.basename(_.toString(req.params.filename));
  const allowed = _.values(REFERENCE_ASSET_GROUP);
  if (!_.includes(allowed, group) || _.isEmpty(projectId) || _.isEmpty(filename)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }
  const filePath = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "references", group, filename);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  if (!_.startsWith(_.toLower(filePath), _.toLower(`${projectRoot}${path.sep}`))) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[Reference Asset] Deleted file: ${filePath}`);
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.delete(PROJECT_ASSET_ROUTE, requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  const { projectId, group } = req.params;
  const sceneId = _.trim(_.toString(req.query[PROJECT_ASSET_QUERY.SCENE_ID]));
  const allowedGroups = _.values(PROJECT_ASSET_GROUP);
  if (!_.includes(allowedGroups, group) || (!_.isEmpty(sceneId) && !_.isEqual(group, PROJECT_ASSET_GROUP.VIDEOS))) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }

  const projectsRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
  const projectRoot = path.resolve(projectsRoot, projectId);
  const assetDirectory = path.resolve(projectRoot, group);
  if (!_.isEqual(path.dirname(projectRoot), projectsRoot) || !_.isEqual(path.dirname(assetDirectory), projectRoot)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }

  try {
    if (!_.isEmpty(sceneId)) {
      const project = await getProjectDetailFromDb(projectId);
      const targetScene = _.find(project?.storyboard, { id: sceneId });
      if (!project || !targetScene) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });

      const videoDirectory = path.resolve(projectRoot, PROJECT_ASSET_GROUP.VIDEOS);
      const assetUrls = _.uniq(_.compact([targetScene.assetUrl, ..._.defaultTo(targetScene.assetUrls, []), ..._.map(_.defaultTo(targetScene.assetRevisions, []), "assetUrl")]));
      _.forEach(assetUrls, (assetUrl) => {
        const assetPath = resolveLocalProjectAssetPath(assetUrl);
        if (!assetPath || !_.startsWith(_.toLower(assetPath), _.toLower(`${videoDirectory}${path.sep}`))) return;
        fs.rmSync(assetPath, { force: true });
      });
      await saveProjectDetailToDb(clearProjectSceneOutput(project, sceneId));
      return res.json({ success: true });
    }

    const targetGroups = _.isEqual(group, PROJECT_ASSET_GROUP.VISUALS)
      ? [
          PROJECT_ASSET_GROUP.IMAGES,
          PROJECT_VISUAL_ASSET_CONFIG.THUMBNAILS_DIRECTORY,
          PROJECT_ASSET_GROUP.VIDEOS,
          path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER),
          path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.UPSCALED),
        ]
      : [group];
    _.forEach(targetGroups, (targetGroup) => {
      const targetDirectory = path.resolve(projectRoot, targetGroup);
      if (!_.startsWith(_.toLower(targetDirectory), _.toLower(`${projectRoot}${path.sep}`))) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
      fs.rmSync(targetDirectory, { recursive: true, force: true });
      if (
        !_.includes(
          [
            path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER),
            path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.UPSCALED),
          ],
          targetGroup,
        )
      ) {
        fs.mkdirSync(targetDirectory, { recursive: true });
      }
    });

    let project = await getProjectDetailFromDb(projectId);
    if (project) {
      let changed = false;
      if (_.isEqual(group, PROJECT_ASSET_GROUP.VISUALS)) {
        project = clearProjectVideoOutputs(clearProjectImageOutputs(project));
        changed = true;
      } else if (_.isEqual(group, PROJECT_ASSET_GROUP.IMAGES)) {
        project = clearProjectImageOutputs(project);
        changed = true;
      } else if (_.isEqual(group, PROJECT_ASSET_GROUP.VIDEOS)) {
        project = clearProjectVideoOutputs(project);
        changed = true;
      } else if (_.isEqual(group, PROJECT_ASSET_GROUP.VOICES) && !_.isEmpty(project.voiceConfig)) {
        _.set(project.voiceConfig, "audioBase64", REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        _.set(project.voiceConfig, "audioUrl", REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        changed = true;
      }

      if (changed) await saveProjectDetailToDb(project);
    }

    return res.json({ success: true });
  } catch (error: any) {
    logger.error(getBackendMsg("SQLITE_DELETE_ERR", true), error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("SQLITE_DELETE_ERR", true) });
  }
});

router.post("/ffmpeg-render", express.json({ limit: SecurityConstants.LIMIT_500MB }), requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const {
      scenes,
      globalAudioUrl,
      globalAudioBase64,
      quality,
      aspectRatio,
      projectId,
      subtitleMode,
      audioTracks,
      autoMusicProfile,
      preserveVideoAudio,
      expectedSourceSceneIds,
      expectedDurationSeconds,
    } = req.body;
    const jobId = randomUUID();
    const safeProjectId = path.basename(_.toString(projectId));
    const dataRoot = path.resolve(getDataDirectory());
    const projectRoot = path.resolve(dataRoot, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, safeProjectId);
    const resolveExistingAsset = (assetUrl: unknown): string => {
      const value = _.trim(_.toString(assetUrl));
      if (_.isEmpty(value) || _.startsWith(value, "data:")) return value;
      const relativePath = _.trimStart(_.split(value, "?")[0], "/\\");
      const candidate = path.resolve(dataRoot, relativePath);
      return _.startsWith(_.toLower(candidate), _.toLower(`${projectRoot}${path.sep}`)) && fs.existsSync(candidate) ? value : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    };
    const recoverSceneAsset = (scene: any): any => {
      if (!_.isEmpty(resolveExistingAsset(scene?.imageUrl)) || !_.isEmpty(scene?.imageBase64)) return scene;
      const sceneId = path.basename(_.toString(scene?.id));
      const assetType = _.toString(scene?.assetType);
      const candidateDirectories = _.isEqual(assetType, GenerateType.Video) ? ["videos", "images"] : ["images", "videos"];
      const candidateExtensions = _.isEqual(assetType, GenerateType.Video)
        ? ["mp4", "webm", "mov", "jpg", "jpeg", "png", "webp"]
        : ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"];
      const recoveredPath = _.find(
        _.flatMap(candidateDirectories, (directory) => _.map(candidateExtensions, (extension) => path.join(projectRoot, directory, `${sceneId}.${extension}`))),
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (_.isEmpty(recoveredPath)) return scene;
      const recoveredUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${safeProjectId}/${path.relative(projectRoot, recoveredPath!).replace(/\\/g, "/")}`;
      logger.warn(`[Render] Recovered missing visual asset for ${sceneId}: ${recoveredUrl}`);
      return { ...scene, imageUrl: recoveredUrl };
    };
    const recoveredScenes = _.map(_.castArray(scenes), recoverSceneAsset);
    const persistedRenderProject = safeProjectId ? await getProjectDetailFromDb(safeProjectId) : undefined;
    const requiredSourceSceneIds = !_.isEmpty(expectedSourceSceneIds)
      ? _.map(_.castArray(expectedSourceSceneIds), _.toString)
      : _.map(_.defaultTo(persistedRenderProject?.storyboard, []), "id");
    const requiredDurationSeconds = _.gt(_.toNumber(expectedDurationSeconds), 0)
      ? _.toNumber(expectedDurationSeconds)
      : parseTargetDurationSeconds(persistedRenderProject?.config?.duration);
    const renderPayload = {
      scenes: recoveredScenes,
      globalAudioUrl,
      globalAudioBase64,
      quality: quality as VideoQuality,
      aspectRatio: aspectRatio as string,
      projectId: projectId as string,
      subtitleMode,
      audioTracks,
      autoMusicProfile,
      preserveVideoAudio: Boolean(preserveVideoAudio),
      expectedSourceSceneIds: requiredSourceSceneIds,
      expectedDurationSeconds: requiredDurationSeconds,
    };
    const preflight = validateFFmpegRenderOptions(renderPayload);
    if (!preflight.ready) {
      logger.warn(`[Render preflight] Rejected ${safeProjectId || "unknown_project"}: ${preflight.issues.join(",")}`);
      return res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY).json({
        success: false,
        error: "render_preflight_failed",
        issues: preflight.issues,
        retryable: true,
      });
    }

    const licenseKey = (_.get(req.headers, SecurityConstants.HEADER_LICENSE_KEY) as string) || (_.get(requestContext.getStore(), SecurityConstants.STORE_LICENSE_KEY) as string);

    await renderQueueService.addJob(jobId, renderPayload, licenseKey);

    res.json({ success: true, jobId });
  } catch (error: any) {
    const isVi = req.headers[SecurityConstants.HEADER_ACCEPT_LANGUAGE]?.includes(COMMON_STRINGS.VI);
    logger.error(getBackendMsg("FFMPEG_RENDER_ERROR", isVi), error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.get("/ffmpeg-render/status/:jobId", async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = await renderQueueService.getJob(jobId);

  if (!job) {
    return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: REFACTOR_CONSTANTS.RENDER_JOB_NOT_FOUND });
  }

  res.json({
    success: true,
    status: job.status,
    progress: job.progress,
    url: job.url,
    error: job.error,
  });
});

router.post(ROUTER_PATHS.REFERENCE_AUDIO, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.params.projectId));
  const match = _.toString(req.body?.audio).match(REFACTOR_CONSTANTS.AUDIO_DATA_URL_CAPTURE_REGEX);
  if (_.isEmpty(projectId) || !match) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  const directory = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "references", REFERENCE_ASSET_GROUP.AUDIO);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  if (!_.startsWith(_.toLower(directory), _.toLower(_.join([projectRoot, path.sep], ""))))
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  fs.mkdirSync(directory, { recursive: true });
  const extension = _.includes(match[1], "wav") ? "wav" : _.includes(match[1], "ogg") ? "ogg" : "mp3";
  const filename = `music_${createHash("sha256").update(match[2]).digest("hex").slice(0, 12)}.${extension}`;
  const filePath = path.join(directory, filename);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
  return res.json({ success: true, assetUrl: `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/references/${REFERENCE_ASSET_GROUP.AUDIO}/${filename}` });
});

router.post(RENDER_QUEUE_CONFIG.CANCEL_ROUTE, async (req: Request, res: Response) => {
  const cancelled = await renderQueueService.cancelJob(req.params.jobId);
  if (!cancelled) return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: REFACTOR_CONSTANTS.RENDER_JOB_NOT_FOUND });
  return res.json({ success: true });
});

router.post(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN.replace(API_ROUTES.PIPELINE, ""), async (req: Request, res: Response) => {
  const pipelineRunId = _.trim(_.toString(req.body?.pipelineRunId));
  const renderJobId = _.trim(_.toString(req.body?.renderJobId));
  cancelChatPlanningRun(pipelineRunId);
  const cleanupTasks: Promise<unknown>[] = [cancelAllActiveMediaGeneration()];
  if (!_.isEmpty(renderJobId)) cleanupTasks.push(renderQueueService.cancelJob(renderJobId));
  await Promise.allSettled(cleanupTasks);
  return res.json({ success: true });
});

router.post(API_ROUTES.PIPELINE_CLEAR_CHAT_ROOMS.replace(API_ROUTES.PIPELINE, ""), async (req: Request, res: Response) => {
  const provider = _.toString(req.body?.provider) as AiPlanningFallbackProvider;
  const supportedProviders = [AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.GrokChat, AiPlanningFallbackProvider.ChatGptUi];
  if (!_.includes(supportedProviders, provider)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false });
  try {
    const cleanupResult = await clearChatPlanningRooms(provider);
    return res.json({ success: true, ...cleanupResult });
  } catch (error) {
    logger.error(LogEvent.OPTIMIZE_PROMPTS_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ success: false });
  }
});

router.post(API_ROUTES.PIPELINE_CLOSE_CHAT_PLANNING_ROOMS.replace(API_ROUTES.PIPELINE, ""), async (req: Request, res: Response) => {
  const provider = _.toString(req.body?.provider) as AiPlanningFallbackProvider;
  const projectId = _.toString(req.body?.projectId);
  const workerIds = _.uniq(_.compact(_.map(_.castArray(req.body?.workerIds || []), _.toString)));
  const supportedProviders = [AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.GrokChat, AiPlanningFallbackProvider.ChatGptUi];
  if (!_.includes(supportedProviders, provider) || _.isEmpty(projectId)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false });
  await Promise.allSettled(_.map(workerIds, (workerId) => closeChatPlanningRoom({ provider, projectId, workerId })));
  return res.json({ success: true, closedRoomCount: workerIds.length });
});

router.get("/profiles", (_req: Request, res: Response) => {
  try {
    const list = getProfiles();
    res.json({ success: true, profiles: list });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.post(REFACTOR_CONSTANTS.ROUTE_PROFILES_LOGIN, async (req: Request, res: Response) => {
  const { profileId } = req.body;
  if (_.isEmpty(profileId)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.MSG_PROFILE_ID_REQ });
  }
  try {
    await launchLoginBrowser(profileId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.delete(REFACTOR_CONSTANTS.ROUTE_PROFILES_ID, (req: Request, res: Response) => {
  const { profileId } = req.params;
  if (_.isEmpty(profileId)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.MSG_PROFILE_ID_REQ });
  }
  try {
    deleteProfile(profileId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.get(REFACTOR_CONSTANTS.ROUTE_ACCOUNTS, (_req: Request, res: Response) => {
  try {
    const list = getLocalAccounts();
    res.json({ success: true, accounts: list });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

router.post(REFACTOR_CONSTANTS.ROUTE_ACCOUNTS, (req: Request, res: Response) => {
  const { accounts } = req.body;
  if (!_.isArray(accounts)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.MSG_ACC_LIST_ARRAY });
  }
  try {
    saveLocalAccounts(accounts);
    res.json({ success: true });
  } catch (error: any) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

export default router;
