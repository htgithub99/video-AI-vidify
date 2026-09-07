import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { renderQueueService } from "../services/renderQueueService.js";
import { validateFFmpegRenderOptions } from "../utils/ffmpegRender.js";
import { getProfiles, launchLoginBrowser, deleteProfile } from "../services/profileManagerService.js";
import { getLocalAccounts, saveLocalAccounts } from "../services/accountRotatorService.js";

import { jsonUtils } from "../../lib/json.js";
import { closeCurrentRoomExecution, generateContentWithRetry, isAiProviderAvailable } from "../services/geminiService.js";
import { beginChatPlanningRun, cancelChatPlanningRun, clearChatPlanningRooms, closeChatPlanningRoom, generatePlanningWithChatUi } from "../services/chatUiPlanningService.js";
import { classifyGeminiError, getGeminiUserMessage } from "../services/geminiErrorClassifier.js";
import { assertResponseContract, ResponseContractName } from "../services/responseContractService.js";
import { checkCache, setCache } from "../services/cacheService.js";
import { getProjectDetailFromDb, saveProjectDetailToDb } from "../utils/db.js";
import { getSafeFolderName } from "./projectController.js";
import JSZip from "jszip";
import { safeParseJSON, formatTime, extractCharacterListFromParsedJSON } from "../utils/helpers.js";
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
  CINEMATIC_SCRIPT_ARTIFACT_CONFIG,
  SEO_FALLBACK_CONFIG,
  ADVISORY_QA_CONFIG,
  STORYBOARD_QUALITY_CONFIG,
  CINEMATIC_GENERATION_RECOVERY_CONFIG,
  VISUAL_PROMPT_GLOBAL_CONTRACT_CONFIG,
  SCRIPT_SPEECH_RATE_CONFIG,
  FLOW_VIDEO_MEDIA_CONFIG,
} from "../../constants/config.js";
import { resolveStoryboardCharacterIds, SCENE_REFERENCE_CONFIG } from "../../services/sceneReferenceService.js";
import { hasValidImages } from "../services/imageAssetService.js";
import {
  createSourceGroundedThumbnailIdeas,
  getThumbnailPlanningIssues,
  getThumbnailTechnicalPlanningIssues,
  normalizeThumbnailIdeas,
} from "../../services/thumbnailPromptService.js";
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
  THUMBNAILS_DIR_NAME,
  API_ROUTES,
  BACKEND_MESSAGES,
  getBackendMsg,
  getPipelineLog,
  PIPELINE_LOGS,
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
  ALPHANUMERIC_ONLY_REGEX,
  SINGLE_QUOTE_REGEX,
  HTTP_HEADERS,
  CONTENT_TYPES,
  TRANSFER_ENCODINGS,
  UltraStreamLogType,
  DEFAULT_SCENE_CAMERA_MOTION,
  DEFAULT_SCENE_EFFECTS,
  DEFAULT_SCENE_LIGHTING_EFFECT,
  DEFAULT_SCENE_TRANSITION,
  stylePresetsKeywords,
  BASE64_DATA_URL_REGEX,
  CONTENT_TYPE_HEADER,
  HTTP_METHODS,
  HTTP_STATUS_CODES,
  TEMPLATE_CONFIG,
  TTS_POLLING_CONFIG,
  HTTP_STATUS,
  CAMERA_ANGLES,
  BORDERLESS_KEYWORD,
  getDuplicateScenePromptDirective,
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
  getCinematicThumbnailPrompt,
  getCinematicThumbnailTechnicalRepairPrompt,
  getCinematicVideoPlanningPrompt,
  getCinematicVideoPlanningRepairPrompt,
  getCinematicVideoPromptPolicyRepairPrompt,
  getCinematicVideoPromptRepairPrompt,
  CINEMATIC_DIALOGUE_DIRECTIVES,
} from "../../constants/cinematicPrompts.js";

import { logger, getMessage, appLogStep, getBilingualMessage, appWarn, createAppError, appError } from "../../lib/logger.js";
import { SecurityMessages } from "../../constants/security.js";

import {
  generateImageWithPlaywright,
  generateBatchImagesWithGeminiChat,
  closeAllBatchPages,
  cancelAllActiveMediaGeneration,
  getOrLaunchGlobalBrowser,
  recoverExistingFlowVideo,
} from "../services/imageGeneratorService.js";
import { resolveApiKeys, getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { resolveVoiceRouting } from "../../lib/voiceRouting.js";
import { validateFactPack } from "../services/factPackValidationService.js";
import { readEncodedProjectImage, readStyleReferenceImage, resolveLocalProjectAssetPath } from "../services/imageAssetService.js";
import { readVisualQaAssets } from "../services/visualQaMediaService.js";
import { analyzeCinematicClipsWithLibraries } from "../services/cinematicClipAnalyzerService.js";

import {
  AspectRatio,
  AiPlanningChatModel,
  AiPlanningExecutionMode,
  AiPlanningFallbackProvider,
  AssetAcceptance,
  ContentSafetyReport,
  GenerateType,
  HookVersion,
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
import { VideoQuality } from "../../constants/enums.js";
import { AiTaskCapability } from "../services/taskRouterService.js";
import {
  applyDeterministicStoryboardCoverage,
  getUnderfilledCinematicSceneIds,
  normalizeStoryboardQuality,
} from "../../services/storyboardQualityService.js";
import { createUnavailableContentSafetyReport, normalizeContentSafety } from "../../services/contentSafetyService.js";
import {
  detectVietnameseNarrationStyleWarnings,
  isSatiricalVideoGenre,
  normalizeScriptQualityReport,
  parseTargetDurationSeconds,
  rankHookVersions,
} from "../../services/scriptQualityService.js";
import { removeAdjacentRepeatedNarrationSentences, removeAdjacentRepeatedStoryboardScenes, removeRepeatedNarrationOpening } from "../../services/scriptContinuityService.js";
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
  normalizeVisualShotPlan,
} from "../services/imagePromptPlanningService.js";
import {
  CINEMATIC_PRODUCTION_POLICY,
  getBlockingCinematicPlanningIssues,
  getBlockingCinematicStoryboardContractIssues,
  getCinematicScriptReadinessIssues,
  getCinematicStoryboardContractIssues,
  isCinematicEpisodeGenre,
} from "../../services/cinematicProductionPolicyService.js";
import {
  CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS,
  CINEMATIC_ARTIFACT_TYPE,
  normalizeCinematicArtifactIdentity,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  CINEMATIC_ROOM_STAGE,
  CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION,
  createCinematicArtifactRequestId,
  resolveCinematicClipDuration,
} from "../../constants/cinematicConstants.js";
import { appendImagePromptAspectRatio } from "../../services/imagePromptQualityService.js";
import { validateCompiledImagePrompts } from "../../services/imagePromptValidationService.js";
import { createScriptGroundedStoryboard, ensureScriptGroundedSceneDetails, ensureStoryboardScriptCoverage } from "../../services/storyboardFallbackService.js";
import { createSourceGroundedSeo } from "../../services/seoFallbackService.js";
import { getRoomOnlyScriptError } from "../services/roomOnlyErrorService.js";

import ffmpeg from "fluent-ffmpeg";
import { createHash, randomUUID } from "crypto";
import os from "os";
import { exec, spawn } from "child_process";
import { StepLogger } from "../../lib/stepLogger.js";
import { smartSplitSentences } from "../../lib/textProcessor.js";
import { assignStoryboardChapterIds } from "../../utils/storyboardChapterUtils.js";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "../utils/paths.js";
import { delayAsync } from "../../lib/shared-utils.js";

const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");
if (fs.existsSync(ffmpegBinary)) {
  ffmpeg.setFfmpegPath(ffmpegBinary);
}

const isVietnameseRequest = (req: Request): boolean =>
  !_.isEqual(_.toString(req.body?.language || req.query?.lang || ProjectLanguage.VI), ProjectLanguage.EN);

type CinematicScriptArtifactKey = "filmPackage";

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

const repairHookVersionsLanguage = async (versions: HookVersion[], isVietnamese: boolean): Promise<HookVersion[]> =>
  _.compact(
    await Promise.all(
      _.map(versions, async (version) => {
        const content = await ensureHookLanguage(version.content, isVietnamese);
        return _.isEmpty(content) ? null : { ...version, content };
      }),
    ),
  );

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
    return res.json({ storyboard });
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
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_STYLE_REWRITE_FAILED_CHUNK, err);
      }

      if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      const rewritten = rewrittenMap.get(scene.id);
      if (rewritten) {
        return { ...scene, prompt: rewritten };
      }
      return { ...scene, prompt: scene.prompt || "" };
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
    const promptCharacters = isCinematicPlanning
      ? _.map(characters, (character) => _.omit(character, ["images", "extracted"]))
      : createPromptCharacterCards(characters);
    const charactersJson = !_.isEmpty(promptCharacters) ? jsonUtils.safeStringify(promptCharacters) : undefined;
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
    const keepPlanningRoomOpen = Boolean(req.body?.keepPlanningRoomOpen);
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
      void closePlanningRoom();
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
    let plannedScenes: StoryboardScene[] = isCinematicPlanning
      ? _.cloneDeep(sourceScenes)
      : resolveStoryboardCharacterIds(_.cloneDeep(sourceScenes), characters);
    const planningPayload = createVisualPlanningPayload(plannedScenes);
    const chunks = isCinematicPlanning ? [planningPayload] : _.chunk(planningPayload, chunkSize);
    const videoPromptsRequestId = createCinematicArtifactRequestId(req.body?.pipelineRunId, CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS);
    const optimizedMap = new Map<string, StoryboardScene>();
    const planningWarnings: string[] = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkItem = chunks[chunkIndex];
      const chunkStartIndex = _.multiply(chunkIndex, chunkSize);
      const sceneIds = _.map(chunkItem, (item) => _.toString(_.get(item, "id")));
      const chunkSourceScenes = _.filter(plannedScenes, (scene) => _.includes(sceneIds, scene.id));
      const chunkCharacterIds = new Set(_.flatMap(chunkSourceScenes, (scene) => scene.characterIds || []));
      const chunkCharactersJson = jsonUtils.safeStringify(
        isCinematicPlanning ? promptCharacters : _.filter(promptCharacters, (character) => chunkCharacterIds.has(_.toString(character.id))),
      );
      const chunkVisualBibleJson = jsonUtils.safeStringify(createScopedVisualBibleContext(resolvedVisualBible, chunkSourceScenes));
      const masterStartIndex = _.findIndex(planningMasterScenes, { id: _.toString(_.get(_.first(chunkItem), "id")) });
      const continuitySource = _.gte(masterStartIndex, 0) ? planningMasterScenes : plannedScenes;
      const continuityStartIndex = _.gte(masterStartIndex, 0) ? masterStartIndex : chunkStartIndex;
      const continuityContext = createBatchContinuityContext(continuitySource, continuityStartIndex, chunkItem.length);
      if (_.lt(masterStartIndex, 0) && _.isEqual(chunkIndex, 0) && req.body?.planningPreviousScene) continuityContext.previousScene = req.body.planningPreviousScene;
      if (isCinematicPlanning) {
        continuityContext.masterSequence = _.map(planningMasterScenes, (scene) =>
          _.pick(scene, [
            "id",
            "chapterId",
            "script",
            "characterIds",
            "locationId",
            "propIds",
            "sequenceId",
            "shotPurpose",
            "dialogueMode",
            "spokenDialogue",
            "speakerCharacterId",
            "actionStartState",
            "actionEndState",
            "screenDirection",
            "locationState",
            "wardrobeState",
            "propState",
          ]),
        );
      }
      const continuityContextJson = jsonUtils.safeStringify(continuityContext);
      const quickGenerateType = resolvedVisualConfig.generateType || GenerateType.Image;
      const quickVideoPromptRequired = _.includes([GenerateType.Video, GenerateType.Mixed], quickGenerateType);
      const createPlanningPrompt = (correctionIssuesJson: string = "", forChatUi = false) => {
        const scopedCharactersJson = forChatUi ? chunkCharactersJson : charactersJson;
        const scopedVisualBibleJson = forChatUi ? chunkVisualBibleJson : jsonUtils.safeStringify(resolvedVisualBible);
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
        if (!isCinematicPlanning) return createPlanningPrompt(jsonUtils.safeStringify(issues), true);
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
      const createCinematicPlanningProperties = (expectedSceneIds: string[]) => ({
        id: { type: "string", enum: expectedSceneIds },
        generationPrompt: planningString,
      }) as const;
      const createPlanningItemsSchema = (expectedSceneIds: string[] = sceneIds) => ({
        type: "array",
        minItems: expectedSceneIds.length,
        maxItems: expectedSceneIds.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: isCinematicPlanning
            ? [...CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS]
            : [
              "id",
              "prompt",
              ...(quickVideoPromptRequired ? ["generationPrompt"] : []),
              "visualIntent",
              "visibleAction",
              "reaction",
              "storyEvidence",
              "visualHook",
              "characterIds",
              "expectedSubjectCount",
              "allowBackgroundPeople",
              "layout",
              "textAllowed",
              "textOverlay",
              "shotPurpose",
              "shotSize",
              "cameraAngle",
              "composition",
              "locationId",
              "propIds",
              "continuityFrom",
              "continuityNotes",
              "lighting",
              "assetStrategy",
              "archivalSearchQuery",
              "archivalRationale",
            ],
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
            characterIds: { type: "array", items: planningString },
            expectedSubjectCount: { type: "integer", minimum: 0 },
            allowBackgroundPeople: { type: "boolean" },
            layout: planningString,
            textAllowed: { type: "boolean" },
            textOverlay: planningString,
            shotPurpose: {
              type: "string",
              enum: [
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
              ],
            },
            shotSize: planningString,
            cameraAngle: planningString,
            composition: planningString,
            locationId: planningString,
            propIds: { type: "array", items: planningString },
            continuityFrom: planningString,
            continuityNotes: planningString,
            lighting: planningString,
            soundDesignCues: {
              type: "array",
              maxItems: CINEMATIC_CHAT_PLANNING_CONFIG.API_MAX_SOUND_DESIGN_CUES,
              items: planningString,
            },
            assetStrategy: { type: "string", enum: ["archival", "ai_generated"] },
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
              ((_.isEmpty(returnedArtifactType) || _.isEqual(returnedArtifactType, CINEMATIC_ARTIFACT_TYPE.VIDEO_PROMPTS)) &&
                (_.isEmpty(returnedRequestId) || _.isEqual(returnedRequestId, normalizedVideoPromptsRequestId)) &&
                (_.isEmpty(returnedCompletionMarker) || _.isEqual(returnedCompletionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER)));
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
            appWarn("AI Chat dự phòng chưa trả được kế hoạch; hệ thống quay lại tuyến API.");
            return requestApiPlan(apiContents, expectedSceneIds);
          }
        }
        try {
          return await requestApiPlan(apiContents, expectedSceneIds);
        } catch (apiError) {
          appWarn("API lập kế hoạch chưa khả dụng; chuyển sang AI Chat trong Chrome.");
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

        const englishRequiredFields = [
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
          ];
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
          _.forEach(englishRequiredFields, (field) => {
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
          if (!_.includes(["single_frame", "split_screen", "collage"], _.get(item, "layout"))) issues.push(`${sceneId}:layout:invalid`);
          if (
            !_.includes(
              [
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
              ],
              _.get(item, "shotPurpose"),
            )
          )
            issues.push(`${sceneId}:shotPurpose:invalid`);
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
      const initialChatUiPrompt = usesChatPlanning ? createPlanningPrompt("", true) : initialApiPrompt;
      let parsedItems = await requestVisualPlan(initialApiPrompt, initialChatUiPrompt);
      let planningIssues = collectPlanningIssues(parsedItems);
      const getQuickPlanningBlockers = (issues: string[]): string[] =>
        _.filter(issues, (issue) =>
          /(?:^result:|:id:(?:duplicate|unexpected)$|:result:missing_scene$|:generationPrompt:missing$)/.test(issue),
        );
      const getCorrectablePlanningIssues = (issues: string[]): string[] =>
        isCinematicPlanning ? getBlockingCinematicPlanningIssues(issues) : getQuickPlanningBlockers(issues);
      for (
        let correctionAttempt = 0;
        !isCinematicPlanning &&
        correctionAttempt < CINEMATIC_CHAT_PLANNING_CONFIG.MAX_CORRECTION_ATTEMPTS &&
        !_.isEmpty(getCorrectablePlanningIssues(planningIssues));
        correctionAttempt++
      ) {
        const correctionIssues = getCorrectablePlanningIssues(planningIssues);
        const correctionIssuesJson = jsonUtils.safeStringify(correctionIssues);
        const repairSceneIds = _.uniq(
          _.compact(
            _.map(correctionIssues, (issue) => {
              const sceneId = _.head(_.split(issue, ":"));
              return _.includes(sceneIds, sceneId) ? sceneId : undefined;
            }),
          ),
        );
        const targetRepairSceneIds = isCinematicPlanning && !_.isEmpty(repairSceneIds) ? repairSceneIds : sceneIds;
        const correctionPrompt = isCinematicPlanning
          ? createRepairPrompt(parsedItems, correctionIssues, targetRepairSceneIds)
          : createPlanningPrompt(correctionIssuesJson, true);
        const candidateItems = await requestVisualPlan(correctionPrompt, correctionPrompt, isCinematicPlanning, targetRepairSceneIds);
        const currentById = _.keyBy(parsedItems, (item) => _.toString(item.id));
        const candidateById = _.keyBy(candidateItems, (item) => _.toString(item.id));
        const mergedCandidateItems = _.compact(_.map(sceneIds, (sceneId) => candidateById[sceneId] || currentById[sceneId]));
        const candidatePlanningIssues = collectPlanningIssues(mergedCandidateItems);
        parsedItems = _.compact(
          _.map(sceneIds, (sceneId) => {
            const currentItem = currentById[sceneId];
            const candidateItem = candidateById[sceneId];
            if (!candidateItem) return currentItem;
            if (!currentItem) return candidateItem;
            const belongsToScene = (issue: string) => _.startsWith(issue, `${sceneId}:`) || _.startsWith(issue, "chunk:") || _.startsWith(issue, "result:");
            const currentSceneIssues = _.filter(planningIssues, belongsToScene);
            const candidateSceneIssues = _.filter(candidatePlanningIssues, belongsToScene);
            const currentBlockingCount = getCorrectablePlanningIssues(currentSceneIssues).length;
            const candidateBlockingCount = getCorrectablePlanningIssues(candidateSceneIssues).length;
            if (!_.isEqual(candidateBlockingCount, currentBlockingCount)) return _.lt(candidateBlockingCount, currentBlockingCount) ? candidateItem : currentItem;
            return _.lte(candidateSceneIssues.length, currentSceneIssues.length) ? candidateItem : currentItem;
          }),
        );
        planningIssues = collectPlanningIssues(parsedItems);
      }
      if (!_.isEmpty(planningIssues)) {
        planningWarnings.push(...planningIssues);
        appWarn(`${PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED}: continuing_after_final_correction: ${_.join(planningIssues, ", ")}`);
      }
      const returnedById = _.keyBy(parsedItems, (item) => _.toString(item.id));
      const blockingPlanningIssues = isCinematicPlanning ? getBlockingCinematicPlanningIssues(planningIssues) : getQuickPlanningBlockers(planningIssues);
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
          : normalizeVisualShotPlan(returnedItem, baseScene, {
              characters,
              visualBible: resolvedVisualBible,
              textMode: resolvedVisualConfig.styleTextInImageMode,
            });
        optimizedMap.set(sceneId, normalizedScene);
        const plannedSceneIndex = _.findIndex(plannedScenes, { id: sceneId });
        if (_.gte(plannedSceneIndex, 0)) plannedScenes[plannedSceneIndex] = normalizedScene;
      });
      planningPartialStoryboard = _.map(plannedScenes, (scene) => optimizedMap.get(scene.id) || scene);
      if (
        !_.isEmpty(blockingPlanningIssues) &&
        (!isCinematicPlanning || !_.isEqual(planningExecutionMode, AiPlanningExecutionMode.ApiOnly))
      ) {
        planningFailureIssues = blockingPlanningIssues;
        throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED);
      }
      if (chunkIndex < _.subtract(chunks.length, 1)) await delayAsync(PIPELINE_CONFIG.DELAY_LONG_CHUNKS_MS);
    }
    plannedScenes = _.map(plannedScenes, (scene) => optimizedMap.get(scene.id) || scene);
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
    const updatedStoryboard = _.map(storyboard as StoryboardScene[], (scene) => scenesById[scene.id] || scene);
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
    return res.json({ thumbnails });
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
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_STYLE_REWRITE_FAILED_THUMBNAILS, err);
      }

      for (let i = 0; i < updatedThumbnails.length; i++) {
        const thumb = updatedThumbnails[i];
        if (rewrittenMap.has(thumb.id)) {
          thumb.prompt = rewrittenMap.get(thumb.id);
        }
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
    return res.json({ thumbnails });
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
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && item.prompt) rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
          }
        }
      } catch (err: any) {
        logger.error(`Error rewriting batch character thumbnails: ${err.message}`);
      }

      for (const rawThumb of updatedThumbnails) {
        if (rewrittenMap.has(rawThumb.id)) {
          rawThumb.prompt = rewrittenMap.get(rawThumb.id);
        }
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
    let result:
      | { characters: any[]; characterAnalysis?: string; characterSpecs?: string; identityContinuityRisks?: string[]; artifactWarnings?: string[] }
      | undefined;
    let artifactIssues: string[] = [];
    for (let attempt = 0; attempt < SecurityConstants.DEFAULT_AMOUNT; attempt++) {
      const response = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: CONTENT_TYPES.JSON,
          ...(requiresCompleteArtifact ? { responseJsonSchema: CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA } : {}),
        },
        task: { capability: AiTaskCapability.TextPlanning },
      });

      const parsed = safeParseJSON(response.text, requiresCompleteArtifact ? {} : []);
      const characters = extractCharacterListFromParsedJSON(parsed, REFACTOR_CONSTANTS.HOOK_COUNT);
      if (!requiresCompleteArtifact) {
        result = { characters };
        break;
      }

      const characterAnalysis = _.trim(_.toString(_.get(parsed, "characterAnalysis")));
      const characterSpecs = _.trim(_.toString(_.get(parsed, "characterSpecs")));
      const ids = _.map(characters, (character) => _.trim(_.toString(character?.id)));
      artifactIssues = _.uniq(
        _.compact([
          !_.isPlainObject(parsed) && !_.isArray(parsed) && "character_artifact:object_or_array_required",
          _.isEmpty(characters) && "characters:missing",
          characters.length > REFACTOR_CONSTANTS.HOOK_COUNT && "characters:too_many",
          _.uniq(ids).length !== ids.length && "characters:duplicate_id",
          ..._.flatMap(characters, (character, index) => [
            _.isEmpty(_.trim(_.toString(character?.id))) && `characters:${index}:id:missing`,
            _.isEmpty(_.trim(_.toString(character?.name))) && `characters:${index}:name:missing`,
            _.isEmpty(_.trim(_.toString(character?.prompt))) && _.isEmpty(_.trim(_.toString(character?.referenceGenerationPrompt))) &&
              `characters:${index}:identity_prompt:missing`,
          ]),
        ]),
      );
      if (_.isEmpty(artifactIssues)) {
        result = {
          characters,
          characterAnalysis,
          characterSpecs,
          identityContinuityRisks: _.castArray(_.get(parsed, "identityContinuityRisks") || []),
          artifactWarnings: [],
        };
        break;
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

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_CHARACTER_REWRITE_FAILED_CHUNK, err);
      }

      if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      const rewritten = rewrittenMap.get(scene.id);
      if (rewritten) {
        return { ...scene, prompt: rewritten };
      }
      if (scene.prompt) {
        const combinedPrompt = _.join(
          _.filter(
            _.map(finalCharacters, (c: any) => c.prompt),
            Boolean,
          ),
          ", ",
        );
        if (combinedPrompt) {
          return { ...scene, prompt: scene.prompt };
        }
      }
      return scene;
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

    const combinedResult = safeParseJSON(combinedResponse.text, {
      audience: "",
      triggers: [],
      angles: [],
      versions: [],
    });

    logStep(`${getPipelineLog("HOOK_STEP1_DONE", isVi)} ${combinedResult.audience || "General Audience"}. Triggers: ${(combinedResult.triggers || []).join(", ")}.`);
    if (combinedResponse.rotationLogs) multiStepLogs.push(...combinedResponse.rotationLogs);

    logStep(getPipelineLog("HOOK_STEP2", isVi));
    logStep(`${getPipelineLog("HOOK_STEP2_DONE", isVi)} ${(combinedResult.versions || []).length || 0} hooks.`);

    logStep(getPipelineLog("HOOK_STEP3", isVi));
    let versions = combinedResult.versions || [];
    if (_.isArray(versions)) {
      versions = rankHookVersions(
        _.map(versions, (v: any, idx: number): HookVersion => ({
          id: v.id || `hk_${idx + 1}`,
          content: v.content || "",
          type: v.type || hookType || "StyleName",
          selected: idx === 0,
          score: v.score,
        })),
      );
    }

    logStep(getPipelineLog("HOOK_STEP3_DONE", isVi));
    versions = await repairHookVersionsLanguage(versions, isVi);
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
      return res
        .status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE)
        .json({ error: getRoomOnlyScriptError(requestContext.getStore()?.aiRoomProvider, undefined, isVi), retryable: true });
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
    let contentSafety: ContentSafetyReport;
    if (isCinematicScript) {
      contentSafety = { ...createUnavailableContentSafetyReport(), warnings: [] };
    } else {
      try {
        const safetyResponse = await generateContentWithRetry({
          contents: getContentSafetyPrompt(originalInput),
          config: {
            responseMimeType: CONTENT_TYPES.JSON,
            responseJsonSchema: CONTENT_SAFETY_RESPONSE_SCHEMA,
            maxOutputTokens: CONTENT_SAFETY_CONFIG.MAX_OUTPUT_TOKENS,
          },
          task: { capability: AiTaskCapability.FactualReview },
        });
        contentSafety = normalizeContentSafety(safeParseJSON(safetyResponse.text, {}));
        if (safetyResponse.aiMetadata) aiMetrics.push(safetyResponse.aiMetadata);
      } catch (safetyError) {
        appWarn(CONTENT_SAFETY_CONFIG.REVIEW_FAILED_LOG, safetyError);
        contentSafety = createUnavailableContentSafetyReport();
      }
    }
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
        const hookResponse = await generateContentWithRetry({
          contents: hookPrompt,
          config: { responseMimeType: "application/json", responseJsonSchema: HOOK_RESPONSE_SCHEMA },
          task: { capability: AiTaskCapability.TextPlanning },
        });
        const hookResult = safeParseJSON(hookResponse.text, { versions: [] });
        assertResponseContract(hookResult, ResponseContractName.Hook);
        if (hookResponse.aiMetadata) aiMetrics.push(hookResponse.aiMetadata);
        if (hookResult.versions && hookResult.versions.length > 0) {
          const rawGeneratedHookVersions = _.map(_.take(hookResult.versions, hookCount), (version: any, index: number): HookVersion => ({
            id: version.id || `hk_${index + 1}`,
            content: version.content || "",
            type: version.type || hookType,
            selected: false,
            score: version.score,
          }));
          generatedHookVersions = resolveUsableHooks(await repairHookVersionsLanguage(rawGeneratedHookVersions, isVi), hookType, hookCount, originalInput, isVi);
          const selectedHook = _.find(generatedHookVersions, "selected");
          if (!selectedHook) throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_QUALITY_REJECTED);
          activeHookText = selectedHook.content;
          logStep(`${getPipelineLog("HOOK_EMBEDDED", isVi)}"${activeHookText}"`);
        }
      } catch (hookError: any) {
        logger.error(LogEvent.ERROR_GENERATING_HOOKS, hookError);
        appWarn(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        generatedHookVersions = resolveUsableHooks([], config.hookConfig.type, config.hookConfig.count, originalInput, isVi);
        activeHookText = _.toString(_.get(_.find(generatedHookVersions, "selected"), "content"));
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
    if (config.factCheck) {
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
        if (isCinematicScript) throw researchError;
        groundedResearchResponse = null;
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
        _.includes(
          [cinematicSourceSignature, ...compatibleCinematicSourceSignatures],
          _.toString(cinematicCheckpointProject?.cinematicScriptArtifacts?.sourceSignature),
        );
      const getFilmPackageIssues = (value: Record<string, any> | undefined, requireRequestIdentity: boolean = true): string[] => {
        const scenes = _.castArray(value?.scenes || []);
        const sceneIds = _.map(scenes, (scene) => _.trim(_.toString(scene?.id)));
        return _.compact([
          _.isEmpty(_.trim(_.toString(value?.scriptSegment))) && "script:missing",
          !_.isEmpty(_.trim(_.toString(value?.artifactType))) && !_.isEqual(value?.artifactType, CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE) && "artifact:type_mismatch",
          requireRequestIdentity &&
            !_.isEmpty(_.trim(_.toString(value?.requestId))) &&
            !_.isEqual(value?.requestId, filmPackageRequestId) &&
            "artifact:request_mismatch",
          _.isEmpty(_.castArray(value?.chapters || [])) && "chapters:missing",
          _.isEmpty(scenes) && "scenes:missing",
          !_.isEqual(_.size(scenes), targetClipCount) &&
            _.replace(
              _.replace(CINEMATIC_SCRIPT_ARTIFACT_CONFIG.SCENE_COUNT_MISMATCH_TEMPLATE, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.ACTUAL_COUNT_TOKEN, _.toString(_.size(scenes))),
              CINEMATIC_SCRIPT_ARTIFACT_CONFIG.TARGET_COUNT_TOKEN,
              _.toString(targetClipCount),
            ),
          _.some(sceneIds, _.isEmpty) && "scenes:id_missing",
          _.uniq(sceneIds).length !== sceneIds.length && "scenes:id_duplicate",
          _.some(scenes, (scene) => _.isEmpty(_.trim(_.toString(scene?.script)))) && "scenes:script_missing",
          !_.isEmpty(_.trim(_.toString(value?.completionMarker))) &&
            !_.isEqual(value?.completionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER) &&
            CINEMATIC_SCRIPT_ARTIFACT_CONFIG.FILM_PACKAGE_INCOMPLETE_ERROR,
        ]);
      };
      const savedFilmPackage = canReuseCinematicCheckpoint ? cinematicCheckpointProject?.cinematicScriptArtifacts?.filmPackage : undefined;
      if (_.isEmpty(getFilmPackageIssues(savedFilmPackage, false))) {
        cinematicFilmPackage = {
          artifactType: CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE,
          requestId: filmPackageRequestId,
          completionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
          ...savedFilmPackage,
        };
        await saveCinematicScriptArtifactCheckpoint(req.body?.projectId, "filmPackage", cinematicFilmPackage, cinematicSourceSignature);
        multiStepLogs.push("[cinematic_film_package] reused_valid_checkpoint");
      } else {
        const filmPackagePrompt = getCinematicFilmPackagePrompt(
          originalInput,
          config.genre,
          isVi,
          targetWordCount,
          targetClipCount,
          clipDurationSeconds,
          filmPackageRequestId,
          {
            inputType,
            audience: config.audience,
            writingStyle: config.writingStyle,
            rewriteLevel: config.rewriteLevel,
            creativityLevel: config.creativityLevel,
            similarityReduction: config.similarityReduction,
            groundedResearch: _.toString(groundedResearchResponse?.text),
          },
        );
        let latestIssues: string[] = ["film_package:missing"];
        for (let attempt = 0; attempt < CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_RESPONSE_ATTEMPTS; attempt++) {
          const filmPackageResponse = await generateContentWithRetry({
            contents:
              attempt === 0
                ? filmPackagePrompt
                : getCinematicFilmPackageRepairPrompt(filmPackagePrompt, latestIssues),
            config: {
              responseMimeType: CONTENT_TYPES.JSON,
              responseJsonSchema: createCinematicFilmPackageResponseSchema(targetClipCount),
              maxOutputTokens: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.MAX_OUTPUT_TOKENS,
              roomCompletionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
              roomArtifactType: CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE,
              roomRequestId: filmPackageRequestId,
            },
            task: { capability: AiTaskCapability.ScriptWriting, roomWorkerId: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.PRIMARY_WORKER_ID },
          });
          if (filmPackageResponse.aiMetadata) aiMetrics.push(filmPackageResponse.aiMetadata);
          if (filmPackageResponse.rotationLogs) multiStepLogs.push(...filmPackageResponse.rotationLogs);
          const parsedCandidate = safeParseJSON(filmPackageResponse.text, {}) as Record<string, any>;
          const candidate = {
            artifactType: CINEMATIC_ARTIFACT_TYPE.FILM_PACKAGE,
            requestId: filmPackageRequestId,
            completionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
            ...parsedCandidate,
          };
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
            maxOutputTokens: SCRIPT_PLAN_CONFIG.MAX_OUTPUT_TOKENS,
          },
          task: { capability: config.factCheck ? AiTaskCapability.FactualReview : AiTaskCapability.TextPlanning },
        },
        targetChapterCount,
        generateContentWithRetry,
        originalInput,
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
              if (!_.isEmpty(restoredSegment)) {
                return restoredSegment;
              }
            } catch (restoreErr) {
              appWarn("Không thể tự động khôi phục dấu tiếng Việt, sử dụng bản segment hiện tại.", restoreErr);
            }
          }
        }
        multiStepLogs.push(...languageFailureLogs);
        return latestUsableSegment;
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
      if (!isCinematicScript) cleanedSegment = removeRepeatedNarrationOpening(cleanedSegment, fullScript);
      const chapterMinimumWords = _.floor(chapterWordTarget * (1 - SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));
      const chapterMaximumWords = _.ceil(chapterWordTarget * (1 + SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));
      for (
        let expansionIndex = 0;
        expansionIndex < REFACTOR_CONSTANTS.SCRIPT_CHAPTER_EXPANSION_RETRY_COUNT && _.size(_.words(cleanedSegment)) < chapterMinimumWords;
        expansionIndex++
      ) {
        const currentWordCount = _.size(_.words(cleanedSegment));
        const continuation = await requestValidChapterSegment(
          getChapterExpansionPrompt(originalInput, chapter.title, cleanedSegment, chapterMinimumWords - currentWordCount, chapterMaximumWords - currentWordCount, isVi),
        );
        if (_.isEmpty(continuation)) break;
        const deduplicatedContinuation = isCinematicScript ? continuation : removeRepeatedNarrationOpening(continuation, `${fullScript} ${cleanedSegment}`);
        cleanedSegment = _.trim(`${cleanedSegment} ${deduplicatedContinuation}`);
      }

      const hasCompleteChapterEnding = (value: string): boolean => /[.!?…][\s"')\]]*$/.test(_.trim(value));
      if (!hasCompleteChapterEnding(cleanedSegment)) {
        const endingRepair = await requestValidChapterSegment(
          `${getChapterExpansionPrompt(originalInput, chapter.title, cleanedSegment, Math.max(12, chapterMinimumWords - _.size(_.words(cleanedSegment))), Math.max(30, chapterMaximumWords - _.size(_.words(cleanedSegment))), isVi)}\n\nThe previous text ended mid-sentence. Continue from its exact final words, finish the current event, and end with complete punctuation. Do not restart or summarize the chapter.`,
        );
        if (!_.isEmpty(endingRepair)) cleanedSegment = _.trim(`${cleanedSegment} ${endingRepair}`);
      }
      if (_.lt(_.size(_.words(cleanedSegment)), chapterMinimumWords) || !hasCompleteChapterEnding(cleanedSegment)) {
        const incompleteChapterError: any = createAppError(`chapter_incomplete:${chapter.id || i + 1}`);
        incompleteChapterError.retryable = true;
        throw incompleteChapterError;
      }

      completedChapters.push({
        id: chapter.id || `ch_${i + 1}`,
        title: chapter.title,
        scriptSegment: cleanedSegment,
      });
      previousChapterSummary = cleanedSegment;

      fullScript += cleanedSegment + "\n\n";
    }

    logStep(getPipelineLog("SCRIPT_STEP4", isVi));
    logStep(getPipelineLog("SCRIPT_STEP4_DONE", isVi));

    let finalCleanScript = isCinematicScript ? fullScript.trim() : removeAdjacentRepeatedNarrationSentences(fullScript.trim());
    const targetDurationSeconds = parseTargetDurationSeconds(rawDurationText);
    let editorialQa: Record<string, unknown> = {};
    try {
      const editorialResponse = await generateContentWithRetry({
        contents: `${getFinalScriptEditorialPrompt(finalCleanScript, config.genre, isVi, targetWordCount)}\n\n${retentionDirective}`,
        config: {
          responseMimeType: CONTENT_TYPES.JSON,
          responseJsonSchema: FINAL_SCRIPT_EDIT_RESPONSE_SCHEMA,
          maxOutputTokens: _.clamp(targetWordCount * 4, 2048, 16384),
        },
        task: { capability: AiTaskCapability.ScriptWriting },
      });
      const editorialResult = safeParseJSON(editorialResponse.text, {});
      const polishedScript = _.trim(_.toString(editorialResult.scriptSegment));
      const polishedWordRatio = _.size(_.words(polishedScript)) / (_.max([1, targetWordCount]) || 1);
      const languageValidation = validateChapterLanguage(polishedScript, isVi);
      const editorialScoresPass = _.every(
        ["continuityScore", "repetitionScore", "factualityScore", "emotionalArcScore", "conversationalScore", "hookPayoffScore"],
        (field) => _.gte(_.toNumber(editorialResult[field]), 75),
      );
      if (!_.isEmpty(polishedScript) && _.inRange(polishedWordRatio, 0.9, 1.100001) && languageValidation.valid && (!isCinematicScript || editorialScoresPass)) {
        finalCleanScript = isCinematicScript ? polishedScript : removeAdjacentRepeatedNarrationSentences(polishedScript);
        editorialQa = editorialResult;
      } else {
        multiStepLogs.push("final_script_editor_output_rejected");
        if (isCinematicScript) throw createAppError("cinematic_final_screenplay_editor_rejected");
      }
      if (editorialResponse.aiMetadata) aiMetrics.push(editorialResponse.aiMetadata);
      if (editorialResponse.rotationLogs) multiStepLogs.push(...editorialResponse.rotationLogs);
    } catch (editorialError) {
      if (isCinematicScript) throw editorialError;
      appWarn("Final script editorial review unavailable; using validated chapter output.", editorialError);
      multiStepLogs.push(ADVISORY_QA_CONFIG.SCRIPT_SKIPPED_WARNING);
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
    const finalChapters = isCinematicScript ? completedChapters : syncChaptersWithScript(finalCleanScript, completedChapters);
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
            ? "Chưa có khóa Groq hoặc Cerebras miễn phí và Gemini dự phòng không phản hồi. Vui lòng thêm ít nhất một khóa miễn phí trong phần cài đặt rồi tiếp tục dự án."
            : "No free Groq or Cerebras key is configured, and the Gemini fallback also failed. Add at least one free key in Settings, then resume the project."
          : attemptedFreeAi
            ? isVi
              ? "Các dịch vụ AI miễn phí đang tạm hết hạn mức hoặc không phản hồi. Hệ thống đã thử toàn bộ mô hình trước Gemini, vui lòng tiếp tục lại dự án sau ít phút."
              : "The free AI providers are temporarily rate-limited or unavailable. All free models were tried before Gemini; resume the project in a few minutes."
            : getGeminiUserMessage(error, isVi);
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: errorMessage,
      retryable: Boolean(error?.retryable) || scriptPlanInvalid || languageIntegrityFailed || attemptedFreeAi || classifyGeminiError(error).retryable,
    });
  } finally {
    if (!isCinematicScript) await closeCurrentRoomExecution(CINEMATIC_ROOM_STAGE.SCRIPT);
  }
});

function syncChaptersWithScript(rewrittenScript: string, chapters: any[]): any[] {
  if (!chapters || _.isEmpty(chapters)) return [];

  const syncedChapters = _.map(chapters, (c: any) => ({ ...c }));

  let lastIndex = 0;
  const segmentsFound: { index: number; length: number }[] = [];

  for (let i = 0; i < syncedChapters.length; i++) {
    const seg = syncedChapters[i].scriptSegment || "";
    if (!seg.trim()) {
      segmentsFound.push({ index: -1, length: 0 });
      continue;
    }
    const idx = rewrittenScript.indexOf(seg, lastIndex);
    if (idx !== -1) {
      segmentsFound.push({ index: idx, length: seg.length });
      lastIndex = idx + seg.length;
    } else {
      segmentsFound.push({ index: -1, length: 0 });
    }
  }

  const allFound = _.every(segmentsFound, (s) => s.index !== -1);
  if (allFound) {
    for (let i = 0; i < syncedChapters.length; i++) {
      const start = i === 0 ? 0 : segmentsFound[i].index;
      const end = i === syncedChapters.length - 1 ? rewrittenScript.length : segmentsFound[i + 1].index;
      syncedChapters[i].scriptSegment = rewrittenScript.substring(start, end).trim();
    }
    return syncedChapters;
  }

  const sentences = smartSplitSentences(rewrittenScript);
  const totalSentences = sentences.length;
  if (totalSentences === 0) return syncedChapters;

  const originalLengths = _.map(chapters, (c: any) => (c.scriptSegment || "").length);
  const totalOriginalLength = _.reduce(originalLengths, (a: number, b: number) => a + b, 0) || 1;

  let sentenceCursor = 0;
  for (let i = 0; i < syncedChapters.length; i++) {
    const ratio = originalLengths[i] / totalOriginalLength;
    let targetCount = Math.round(ratio * totalSentences);
    if (i === syncedChapters.length - 1) targetCount = totalSentences - sentenceCursor;
    targetCount = Math.max(1, targetCount);

    const slice = sentences.slice(sentenceCursor, sentenceCursor + targetCount);
    syncedChapters[i].scriptSegment = slice.join(" ");
    sentenceCursor += targetCount;
  }

  return syncedChapters;
}

function diversifyDuplicatePrompts(scenes: any[]): any[] {
  if (!scenes || scenes.length <= 1) return scenes;

  const cameraAngles = CAMERA_ANGLES;
  const promptOccurrences = new Map<string, number>();

  for (let i = 0; i < scenes.length; i++) {
    const currentPrompt = scenes[i].prompt?.trim();
    if (currentPrompt) {
      const normCurrent = currentPrompt.toLowerCase().replace(ALPHANUMERIC_ONLY_REGEX, "");
      const occurrenceCount = promptOccurrences.get(normCurrent) || 0;
      promptOccurrences.set(normCurrent, occurrenceCount + 1);
      if (occurrenceCount > 0) {
        const selectedAngle = cameraAngles[i % cameraAngles.length];
        const duplicateDirective = getDuplicateScenePromptDirective(scenes[i].script || scenes[i].subtitle || "", selectedAngle);
        const borderlessKeyword = BORDERLESS_KEYWORD;
        const lowerPrompt = currentPrompt.toLowerCase();

        if (_.includes(lowerPrompt, borderlessKeyword)) {
          const index = lowerPrompt.lastIndexOf(borderlessKeyword);
          const basePart = currentPrompt.substring(0, index).trim().replace(/,+$/, "");
          const endPart = currentPrompt.substring(index);
          scenes[i].prompt = `${basePart}, ${duplicateDirective}, ${endPart}`;
        } else {
          scenes[i].prompt = `${currentPrompt}, ${duplicateDirective}`;
        }
      }
    }
  }
  return scenes;
}

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

    const detailedPrompt = response.text?.trim() || sceneScript;
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
    const response = await generateContentWithRetry({
      contents: getVideoSceneSelectionPrompt(jsonUtils.safeStringify(scenes), maxVideos),
      config: { responseMimeType: CONTENT_TYPES.JSON },
    });
    const parsed = safeParseJSON(response.text, { videoSceneIds: [] });
    const validSceneIds = _.map(scenes, REFACTOR_CONSTANTS.AVG_ID_KEY);
    const videoSceneIds = _.take(_.uniq(_.filter(_.get(parsed, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, []), (sceneId) => _.includes(validSceneIds, sceneId))), maxVideos);
    return res.json({ videoSceneIds });
  } catch (error: any) {
    logger.error(LogEvent.VIDEO_SCENE_SELECTION_ERROR, error);
    return res.json({ videoSceneIds: [], rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.SEARCH_ARCHIVAL_IMAGE, async (req: Request, res: Response) => {
  const query = _.trim(_.toString(req.body?.query));
  const headless = req.body?.chromeHeadless !== false;
  const excludeSourceUrls = _.take(_.filter(_.castArray(req.body?.excludeSourceUrls), _.isString), 10);
  try {
    if (_.isEmpty(query)) return res.status(400).json({ success: false, warning: "archival_search_query_missing" });
    const browserSession = await getOrLaunchGlobalBrowser(req.body?.chromeHeadless);
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
    const quality = safeParseJSON(response.text, {});
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
  const isCinematicStoryboard =
    _.gt(normalizedRequestedClipCount, 0) || isCinematicEpisodeGenre(config?.genre) || _.includes(["single", "series"], _.toString(config?.filmFormat));
  const rawRewrittenScript = _.toString(req.body.rewrittenScript);
  const rewrittenScript = isCinematicStoryboard ? rawRewrittenScript : removeAdjacentRepeatedNarrationSentences(rawRewrittenScript);

  let syncedChapters = chapters;
  if (!isCinematicStoryboard && chapters && chapters.length > 0 && rewrittenScript) syncedChapters = syncChaptersWithScript(rewrittenScript, chapters);

  let characterRef: string | undefined = undefined;
  const rawRefChars = referenceCharacters || referenceCharacter;
  if (rawRefChars) {
    if (typeof rawRefChars === "string") characterRef = rawRefChars.trim() || undefined;
    else {
      characterRef = jsonUtils.safeStringify(rawRefChars);
    }
  }
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
    if (aiProviderAvailable && !isCinematicStoryboard) {
      try {
        const bibleResponse = await generateContentWithRetry({
          contents: bibleParts,
          config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: VISUAL_BIBLE_RESPONSE_SCHEMA },
        });
        const parsedVisualBible = safeParseJSON(bibleResponse.text, {}) as VisualBible;
        const hasRequiredVisualBibleFields = _.isPlainObject(parsedVisualBible) && !_.isEmpty(parsedVisualBible);
        if (hasRequiredVisualBibleFields) visualBible = parsedVisualBible;
        else if (isCinematicStoryboard) throw createAppError(PIPELINE_SERVER_ERRORS.VISUAL_BIBLE_INVALID);
        else storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
        if (bibleResponse.rotationLogs) storyboardLogs.push(...bibleResponse.rotationLogs);
      } catch (visualBibleError) {
        if (isCinematicStoryboard) throw visualBibleError;
        appWarn(PIPELINE_SERVER_ERRORS.VISUAL_BIBLE_INVALID, visualBibleError);
        storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
      }
    } else if (!isCinematicStoryboard) {
      storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
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

      if (
        !_.isArray(splitScenes) ||
        _.isEmpty(splitScenes) ||
        !_.every(splitScenes, (s: any) =>
          _.every([s.id, s.chapterId, s.script], (value) => !_.isEmpty(_.trim(_.toString(value)))),
        ) ||
        _.uniq(_.map(splitScenes, (scene: any) => _.trim(_.toString(scene.id)))).length !== splitScenes.length ||
        (isCinematicStoryboard && !_.isEqual(splitScenes.length, cinematicClipCount))
      ) {
        throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
      } else {
        splitScenes = isCinematicStoryboard
          ? splitScenes
          : _.map(splitScenes, (scene: any, idx: number) => ({
              ...scene,
              id: _.join([STORYBOARD_FALLBACK_CONFIG.SCENE_ID_PREFIX, _.add(idx, SecurityConstants.DEFAULT_AMOUNT)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              script: scene.script || scene.subtitle || "",
              subtitle: scene.subtitle || scene.script || "",
            }));
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

            for (const bs of batchScenes) {
              if (bs.id) detailedScenesMap.set(bs.id, bs);
            }
          } catch (batchErr: any) {
            logger.error("STORYBOARD_BATCH_GEN_ERROR", i + 1, batchErr.message);
            if (batchErr.rotationLogs) storyboardLogs.push(...batchErr.rotationLogs);
          }

          if (i < chunks.length - 1) await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
        }

        allScenes = _.map(splitScenes, (scene: any) => {
          const details = detailedScenesMap.get(scene.id) || {};
          return {
            ...scene,
            prompt: _.trim(_.toString(details.prompt)),
            cameraMotion: details.cameraMotion || DEFAULT_SCENE_CAMERA_MOTION,
            effects: details.effects || DEFAULT_SCENE_EFFECTS,
            lightingEffect: details.lightingEffect || DEFAULT_SCENE_LIGHTING_EFFECT,
            transition: details.transition || DEFAULT_SCENE_TRANSITION,
          };
        });
      }
    } catch (e: any) {
      logger.error(LogEvent.ERROR_GENERATING_STORYBOARD_CHUNKING, e);
      if (e.rotationLogs) storyboardLogs.push(...e.rotationLogs);
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
      if (cinematicClipCount) {
        throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
      } else {
        allScenes = createScriptGroundedStoryboard({
          rewrittenScript,
          chapters: syncedChapters,
          splitStrategy,
          aspectRatio: config?.aspectRatio || AspectRatio.SixteenNine,
          targetStyle: activeStyle || visualStyle,
          visualBible,
        });
      }
      storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.FALLBACK_WARNING);
    } else if (!isCinematicStoryboard) {
      allScenes = ensureScriptGroundedSceneDetails(allScenes, {
        aspectRatio: config?.aspectRatio || AspectRatio.SixteenNine,
        targetStyle: activeStyle || visualStyle,
        visualBible,
      });
    }
    let data: any = { scenes: allScenes, visualBible, rotationLogs: storyboardLogs };

    if (!data || !data.scenes || _.isEmpty(data.scenes)) {
      throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
    }

    if (data?.scenes?.length) {
      if (!isCinematicStoryboard) {
        const diversifiedScenes = diversifyDuplicatePrompts(data.scenes);
        data.scenes = ensureStoryboardScriptCoverage(diversifiedScenes, {
            rewrittenScript,
            chapters: syncedChapters,
            splitStrategy,
            aspectRatio: config?.aspectRatio || AspectRatio.SixteenNine,
            targetStyle: activeStyle || visualStyle,
            visualBible,
          });
        data.scenes = removeAdjacentRepeatedStoryboardScenes(data.scenes);
      }
      if (!isCinematicStoryboard) data.scenes = assignStoryboardChapterIds(data.scenes, syncedChapters);
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

    const storyboardQaScenes = isCinematicStoryboard
      ? _.map(data.scenes, (scene) => ({ ...scene, duration: storyboardClipDurationSeconds }))
      : data.scenes;
    const storyboardQaBase = applyDeterministicStoryboardCoverage(
      normalizeStoryboardQuality(splitStoryboardQa || {}),
      rewrittenScript,
      storyboardQaScenes,
      isVi ? SCRIPT_SPEECH_RATE_CONFIG.VIETNAMESE_WORDS_PER_MINUTE : SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE,
    );
    if (isCinematicStoryboard) {
      const normalizedStoryboardScript = _.replace(_.trim(_.join(_.map(data.scenes, (scene) => _.toString(scene.script)), " ")), /\s+/g, " ");
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
    if (isCinematicSeo) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: PIPELINE_SERVER_ERRORS.SEO_GENERATION_FAILED,
        retryable: true,
      });
    }
    return res.json({
      ...createSourceGroundedSeo(rewrittenScript, { numTitles, numDescriptions, numHashtags, numTags }),
      rotationLogs: [SEO_FALLBACK_CONFIG.WARNING],
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

    const combinedResponse = await generateContentWithRetry({
      contents: combinedSeoPrompt,
      config: {
        responseMimeType: "application/json",
        roomCompletionMarker: isCinematicSeo ? CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER : undefined,
        roomArtifactType: isCinematicSeo ? CINEMATIC_ARTIFACT_TYPE.SEO : undefined,
        roomRequestId: isCinematicSeo ? seoRequestId : undefined,
      },
      task: { capability: AiTaskCapability.TextPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.THUMBNAIL) },
    });

    const seoResult = safeParseJSON(combinedResponse.text, {
      keywords: [],
      titles: [],
      descriptions: [],
      hashtags: [],
      tags: [],
    });
    const returnedSeoArtifactType = _.trim(_.toString(seoResult.artifactType));
    const returnedSeoRequestId = _.trim(_.toString(seoResult.requestId));
    const returnedSeoCompletionMarker = _.trim(_.toString(seoResult.completionMarker));
    if (
      isCinematicSeo &&
      ((!_.isEmpty(returnedSeoArtifactType) && !_.isEqual(returnedSeoArtifactType, CINEMATIC_ARTIFACT_TYPE.SEO)) ||
        (!_.isEmpty(returnedSeoRequestId) && !_.isEqual(returnedSeoRequestId, seoRequestId)) ||
        (!_.isEmpty(returnedSeoCompletionMarker) &&
          !_.isEqual(returnedSeoCompletionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER)))
    ) {
      throw createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
    }

    logSeoStep(`${PIPELINE_LOGS.SEO_STEP1_DONE} ${(seoResult.keywords || []).join(", ") || "None"}`);
    if (combinedResponse.rotationLogs) seoLogs.push(...combinedResponse.rotationLogs);

    logSeoStep(PIPELINE_LOGS.SEO_STEP2);
    logSeoStep(PIPELINE_LOGS.SEO_STEP2_DONE);

    logSeoStep(PIPELINE_LOGS.SEO_STEP3);
    logSeoStep(PIPELINE_LOGS.SEO_DONE_ALL);

    const normalizeSeoMetadata = (item: any) => ({
      ...item,
      searchScore: _.isFinite(item?.searchScore) ? _.toNumber(item.searchScore) : SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
      ctrScore: _.isFinite(item?.ctrScore) ? _.toNumber(item.ctrScore) : SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
      compScore: _.isFinite(item?.compScore) ? _.toNumber(item.compScore) : SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
      seoScore: _.isFinite(item?.seoScore) ? _.toNumber(item.seoScore) : SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
    });
    const parsedData = isCinematicSeo
      ? { ...seoResult, rotationLogs: seoLogs }
      : {
          titles: _.map(seoResult.titles || [], normalizeSeoMetadata),
          descriptions: _.map(seoResult.descriptions || [], normalizeSeoMetadata),
          hashtags: _.map(seoResult.hashtags || [], (tag: string) => tag.replace(/^#+/, "")),
          tags: seoResult.tags || [],
          rotationLogs: seoLogs,
        };

    setCache(API_ROUTES.PIPELINE_SEO, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_SEO, error);
    if (isCinematicSeo) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: PIPELINE_SERVER_ERRORS.SEO_GENERATION_FAILED,
        retryable: true,
        rotationLogs: _.castArray(error.rotationLogs),
      });
    }
    res.json({
      ...createSourceGroundedSeo(rewrittenScript, { numTitles, numDescriptions, numHashtags, numTags }),
      rotationLogs: _.uniq(_.compact([..._.castArray(error.rotationLogs), SEO_FALLBACK_CONFIG.WARNING])),
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
    if (isCinematicThumbnail) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: PIPELINE_SERVER_ERRORS.THUMBNAIL_PLANNING_FAILED,
        retryable: true,
      });
    }
    return res.json({
      thumbnails: createSourceGroundedThumbnailIdeas(rewrittenScript, thumbnailCount, refImageStr, thumbnailTextMode),
      rotationLogs: [THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_WARNING],
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
      ((!_.isEmpty(returnedThumbnailArtifactType) && !_.isEqual(returnedThumbnailArtifactType, CINEMATIC_ARTIFACT_TYPE.THUMBNAILS)) ||
        (!_.isEmpty(returnedThumbnailRequestId) && !_.isEqual(returnedThumbnailRequestId, thumbnailRequestId)) ||
        (!_.isEmpty(returnedThumbnailCompletionMarker) &&
          !_.isEqual(returnedThumbnailCompletionMarker, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER)))
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
      if (!_.isEmpty(repairedThumbnails) && _.size(repairedIssues) < _.size(planningIssues)) {
        thumbsResult = { concepts: _.castArray(repairedResult.concepts || []), thumbnails: repairedThumbnails };
        planningIssues = repairedIssues;
      }
      if (repairResponse.rotationLogs) thumbLogs.push(...repairResponse.rotationLogs);
    }

    if (isCinematicThumbnail && !_.isEmpty(planningIssues)) {
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

    let normalizedThumbnails = normalizeThumbnailIdeas(_.castArray(thumbsResult.thumbnails || []), thumbnailCount, thumbnailTextMode);
    if (!isCinematicThumbnail && _.lt(_.size(normalizedThumbnails), thumbnailCount)) {
      const sourceFallbacks = createSourceGroundedThumbnailIdeas(rewrittenScript, thumbnailCount, visualConfig.thumbnailReferencePrompt || visualConfig.style, thumbnailTextMode);
      normalizedThumbnails = normalizeThumbnailIdeas(_.concat(normalizedThumbnails, _.drop(sourceFallbacks, _.size(normalizedThumbnails))), thumbnailCount, thumbnailTextMode);
      thumbLogs.push(THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_WARNING);
    }
    const parsedData = { thumbnails: normalizedThumbnails, rotationLogs: thumbLogs };

    setCache(API_ROUTES.PIPELINE_THUMBNAILS, thumbnailCachePayload, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_THUMBNAILS_PROMPTS, error);
    if (isCinematicThumbnail) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        error: PIPELINE_SERVER_ERRORS.THUMBNAIL_PLANNING_FAILED,
        retryable: true,
        rotationLogs: _.castArray(error.rotationLogs),
      });
    }
    res.json({
      thumbnails: createSourceGroundedThumbnailIdeas(rewrittenScript, thumbnailCount, visualConfig.thumbnailReferencePrompt || visualConfig.style, thumbnailTextMode),
      rotationLogs: _.uniq(_.compact([..._.castArray(error.rotationLogs), THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_WARNING])),
    });
  }
});

router.post("/voice", requireLicense(FeatureType.VOICE), async (req: Request, res: Response) => {
  try {
    let { text, speed, voice_id, voiceURI, provider } = req.body;
    const requestedVoiceId = voice_id || voiceURI || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    const { finalVoiceId } = resolveVoiceRouting({ provider, voiceId: requestedVoiceId });

    if (!text || !text.trim()) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, error: PIPELINE_SERVER_ERRORS.VOICE_TEXT_REQUIRED });
    text = removeAdjacentRepeatedNarrationSentences(text);

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
const persistProjectVideo = async (localProjectId: string, sceneId: string, base64: string): Promise<string> => {
  const safeProjectId = path.basename(_.toString(localProjectId));
  const safeSceneId = path.basename(_.toString(sceneId));
  if (_.some([safeProjectId, safeSceneId, base64], _.isEmpty)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, safeProjectId);
  const videoDirectory = path.resolve(projectRoot, PROJECT_ASSET_GROUP.VIDEOS);
  if (!_.startsWith(_.toLower(videoDirectory), _.toLower(`${projectRoot}${path.sep}`))) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
  const videoBuffer = Buffer.from(base64, REFACTOR_CONSTANTS.ENCODING_BASE64);
  if (_.lt(videoBuffer.length, FLOW_VIDEO_MEDIA_CONFIG.MIN_FILE_BYTES)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
  await fs.promises.mkdir(videoDirectory, { recursive: true });
  const videoFilename = `${safeSceneId}${FLOW_VIDEO_MEDIA_CONFIG.FILE_EXTENSION}`;
  const videoPath = path.join(videoDirectory, videoFilename);
  const candidateHash = createHash(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ALGORITHM).update(videoBuffer).digest(FLOW_VIDEO_MEDIA_CONFIG.CONTENT_HASH_ENCODING);
  const existingSceneVideoFiles = _.filter(
    await fs.promises.readdir(videoDirectory),
    (filename) => FLOW_VIDEO_MEDIA_CONFIG.SCENE_VIDEO_FILE_PATTERN.test(filename) && !_.isEqual(filename, videoFilename),
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

router.post("/recover-flow-video", requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const localProjectId = path.basename(_.toString(req.body?.projectId));
    const sceneId = path.basename(_.toString(req.body?.sceneId));
    const mediaId = _.trim(_.toString(req.body?.mediaId));
    const project = await getProjectDetailFromDb(localProjectId);
    const flowProjectId = _.trim(_.toString(project?.visualConfig?.flowProjectId));
    if (_.some([localProjectId, sceneId, mediaId, flowProjectId], _.isEmpty)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    const scene = _.find(project?.storyboard, { id: sceneId });
    if (!scene || !_.isEqual(scene.remoteVideoMediaId, mediaId)) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);

    const result = await recoverExistingFlowVideo({
      flowProjectId,
      mediaId,
      expectedDuration: _.toString(project?.visualConfig?.videoDuration),
      retainBrowserSession: true,
    });
    if (!result.success || _.isEmpty(result.base64)) return res.json(result);
    const fallbackUrl = await persistProjectVideo(localProjectId, sceneId, result.base64!);
    return res.json({ ...result, base64: null, fallbackUrl });
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
const completedVideoSubmissionResults = new Map<string, unknown>();

router.post("/generate-image", requireSingleVisualLicense, async (req: Request, res: Response) => {
  let activeVideoSubmissionKey = "";
  try {
    const { prompt, style, visualConfig, sandboxConfig, sceneId } = req.body;
    const requestedIdempotencyKey = _.trim(_.toString(req.body?.idempotencyKey));
    if (_.isEqual(visualConfig?.generateType, GenerateType.Video) && !_.isEmpty(requestedIdempotencyKey)) {
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

    const persistedScene = _.find(localProject?.storyboard, { id: sceneId });
    if (
      _.isEqual(visualConfig?.generateType, GenerateType.Video) &&
      !_.isEmpty(persistedFlowProjectId) &&
      !_.isEmpty(persistedScene?.remoteVideoMediaId) &&
      _.isEmpty(persistedScene?.assetUrl) &&
      _.isEmpty(persistedScene?.assetUrls)
    ) {
      const recoveredResult = await recoverExistingFlowVideo({
        flowProjectId: persistedFlowProjectId,
        mediaId: persistedScene.remoteVideoMediaId,
        expectedDuration: _.toString(visualConfig?.videoDuration),
        retainBrowserSession: true,
      });
      if (!recoveredResult.success || _.isEmpty(recoveredResult.base64)) {
        return res.json({
          ...recoveredResult,
          success: false,
          remoteMediaId: persistedScene.remoteVideoMediaId,
          remoteMediaCreated: true,
          warning: FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR,
        });
      }
      const fallbackUrl = await persistProjectVideo(localProjectId, sceneId, recoveredResult.base64!);
      persistedScene.assetUrl = fallbackUrl;
      persistedScene.assetUrls = [fallbackUrl];
      persistedScene.assetType = GenerateType.Video;
      persistedScene.assetStatus = SceneAssetStatus.Generated;
      persistedScene.remoteVideoDownloadPending = false;
      await saveProjectDetailToDb(localProject);
      const recoveredResponse = {
        ...recoveredResult,
        success: true,
        base64: null,
        fallbackUrl,
        remoteMediaId: persistedScene.remoteVideoMediaId,
        remoteMediaCreated: true,
      };
      if (!_.isEmpty(requestedIdempotencyKey)) completedVideoSubmissionResults.set(requestedIdempotencyKey, recoveredResponse);
      return res.json(recoveredResponse);
    }

    const knownVideoMediaIds = _.uniq(
      _.compact(
        _.map(
          _.filter(localProject?.storyboard || [], (scene) => !_.isEqual(scene.id, sceneId)),
          (scene) => _.trim(_.toString(scene.remoteVideoMediaId)),
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
    const generatedRemoteMediaId = _.trim(_.toString(result?.remoteMediaId));
    if (
      localProject &&
      _.isEqual(visualConfig?.generateType, GenerateType.Video) &&
      !_.isEmpty(generatedRemoteMediaId) &&
      _.includes(knownVideoMediaIds, generatedRemoteMediaId)
    ) {
      throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ID_ERROR);
    }
    if (localProject && _.isEqual(visualConfig?.generateType, GenerateType.Video) && !_.isEmpty(generatedRemoteMediaId)) {
      const generatedScene = _.find(localProject.storyboard, { id: sceneId });
      if (generatedScene && _.isEmpty(result.base64)) {
        generatedScene.remoteVideoMediaId = generatedRemoteMediaId;
        generatedScene.remoteVideoDownloadPending = true;
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
      _.isEmpty(result.base64) &&
      !_.isEmpty(generatedFlowProjectId) &&
      !_.isEmpty(generatedRemoteMediaId)
    ) {
      const recoveredResult = await recoverExistingFlowVideo({
        flowProjectId: generatedFlowProjectId,
        mediaId: generatedRemoteMediaId,
        expectedDuration: _.toString(visualConfig?.videoDuration),
        retainBrowserSession: !_.isEmpty(localProjectId),
      });
      if (recoveredResult.success && !_.isEmpty(recoveredResult.base64)) {
        result = {
          ...result,
          ...recoveredResult,
          success: true,
          newProjectId: result.newProjectId,
          remoteMediaId: generatedRemoteMediaId,
          remoteMediaCreated: true,
        };
      }
    }

    if (result?.success && _.isEqual(visualConfig?.generateType, GenerateType.Video) && !_.isEmpty(result.base64)) {
      const fallbackUrl = await persistProjectVideo(localProjectId, sceneId, result.base64);
      result = {
        ...result,
        base64: null,
        fallbackUrl,
      };
      const completedScene = _.find(localProject?.storyboard, { id: sceneId });
      if (completedScene) {
        completedScene.assetUrl = fallbackUrl;
        completedScene.assetUrls = [fallbackUrl];
        completedScene.assetType = GenerateType.Video;
        completedScene.assetStatus = SceneAssetStatus.Generated;
        completedScene.remoteVideoMediaId = generatedRemoteMediaId || completedScene.remoteVideoMediaId;
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
    const result = { success: true, quality: safeParseJSON(response.text, {}), aiMetadata: response.aiMetadata, rotationLogs: response.rotationLogs };
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
      contents: _.isEmpty(qaIssues)
        ? getCinematicVideoPromptPolicyRepairPrompt(prompt)
        : getCinematicVideoPromptRepairPrompt(prompt, qaIssues, sceneContext),
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA,
        maxOutputTokens: CINEMATIC_GENERATION_RECOVERY_CONFIG.POLICY_REPAIR_MAX_OUTPUT_TOKENS,
      },
      task: { capability: AiTaskCapability.VisualPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.PROMPT) },
    });
    return res.json({ success: true, review: safeParseJSON(response.text, {}), aiMetadata: response.aiMetadata });
  } catch (error: any) {
    logger.warn(LogEvent.VISUAL_QA_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ success: false, error: error.message });
  }
});

router.post(ROUTER_PATHS.REPAIR_VISUAL_PROMPT, async (req: Request, res: Response) => {
  const prompt = _.toString(req.body?.prompt);
  const qaIssues = _.compact(_.map(_.castArray(req.body?.qaIssues), _.toString));
  if (_.isEmpty(_.trim(prompt))) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Visual prompt is required." });
  try {
    const response = await generateContentWithRetry({
      contents: getVisualPromptQaRepairPrompt(prompt, qaIssues, req.body?.scene || {}, _.toString(req.body?.purpose || "scene image")),
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA,
        maxOutputTokens: CINEMATIC_GENERATION_RECOVERY_CONFIG.POLICY_REPAIR_MAX_OUTPUT_TOKENS,
      },
      task: { capability: AiTaskCapability.VisualPlanning, roomWorkerId: _.toString(req.body?.roomWorkerId || CINEMATIC_ROOM_STAGE.PROMPT) },
    });
    return res.json({ success: true, review: safeParseJSON(response.text, {}), aiMetadata: response.aiMetadata });
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
    if (!isSafe)
      return { sceneId: scene.id, sourcePath: "", warnings: ["clip_missing"], trimStartSeconds: 0, trimEndSeconds: 0, takeDecision: "omit", reason: "clip_missing" };
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
            protectDialogue:
              _.includes(["on_screen_dialogue", "off_screen_dialogue"], _.toString(scene?.dialogueMode)) && !_.isEmpty(_.trim(_.toString(scene?.spokenDialogue))),
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
      return {
        ...technical,
        ...library,
        sourcePath: technical.sourcePath,
        contactSheetData: technical.contactSheetData,
        contactSheetPath: technical.contactSheetPath,
        warnings: _.uniq([..._.castArray(technical.warnings), ..._.castArray(library.warnings)]),
        reason: _.join(_.compact([library.reason, technical.reason]), ";"),
      };
    });
    if (!libraryAnalysisAvailable || !(await isAiProviderAvailable())) {
      return res.json({
        success: true,
        decisions: _.map(analyzedDecisions, (decision) =>
          _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
        ),
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
    for (const batch of _.chunk(_.filter(scenes, (scene) => aiReviewSceneIds.has(_.toString(scene.id))), CINEMATIC_EDIT_ANALYSIS_CONFIG.MEDIA_WORKERS)) {
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
    const reviewableDecisions = _.filter(
      analyzedDecisions,
      (decision) => !_.isEmpty(decision.contactSheetData) && aiReviewSceneIds.has(_.toString(decision.sceneId)),
    );
    if (_.isEmpty(reviewableDecisions)) {
      return res.json({
        success: true,
        decisions: _.map(analyzedDecisions, (decision) =>
          _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
        ),
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
      };
    });
    const overviewPath = path.join(analysisDir, CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_FILE_NAME);
    const overviewSources = _.filter(reviewableDecisions, (decision) => !_.isEmpty(decision.contactSheetPath) && fs.existsSync(decision.contactSheetPath));
    const overviewInputs = _.flatMap(overviewSources, (decision) => ["-i", decision.contactSheetPath]);
    const overviewFilterParts = _.map(overviewSources, (_decision, index) =>
      `[${index}:v]scale=${CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_ITEM_WIDTH}:${CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_ITEM_HEIGHT}[scene${index}]`,
    );
    const overviewLayout = _.join(
      _.map(overviewSources, (_decision, index) => {
        const column = index % CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_COLUMNS;
        const row = Math.floor(index / CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_COLUMNS);
        return `${column * CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_ITEM_WIDTH}_${row * CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_ITEM_HEIGHT}`;
      }),
      "|",
    );
    const overviewLabels = _.join(_.map(overviewSources, (_decision, index) => `[scene${index}]`), "");
    const overviewFilter = `${_.join(overviewFilterParts, ";")};${overviewLabels}xstack=inputs=${overviewSources.length}:layout=${overviewLayout}`;
    await new Promise<void>((resolve) => {
      const process = spawn(executable, ["-y", ...overviewInputs, "-filter_complex", overviewFilter, "-frames:v", "1", overviewPath], {
        windowsHide: true,
        stdio: "ignore",
      });
      const timeout = setTimeout(() => process.kill(), CINEMATIC_EDIT_ANALYSIS_CONFIG.FFMPEG_TIMEOUT_MS);
      process.once("error", () => {
        clearTimeout(timeout);
        resolve();
      });
      process.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    const libraryObservations = _.map(reviewableDecisions, (decision) =>
      _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
    );
    const globalEditParts: any[] = [{ text: getCinematicGlobalEditDecisionPrompt(metadata, libraryObservations) }];
    if (fs.existsSync(overviewPath)) {
      globalEditParts.push({ text: CINEMATIC_EDIT_ANALYSIS_CONFIG.GLOBAL_CONTACT_SHEET_LABEL });
      globalEditParts.push({
        inlineData: {
          mimeType: CINEMATIC_EDIT_ANALYSIS_CONFIG.IMAGE_MIME_TYPE,
          data: fs.readFileSync(overviewPath).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding),
        },
      });
    }
    const globalEditResponse = await generateContentWithRetry({
      contents: [{ role: "user", parts: globalEditParts }],
      config: {
        responseMimeType: CONTENT_TYPES.JSON,
        responseJsonSchema: CINEMATIC_EDIT_DECISION_RESPONSE_SCHEMA,
        maxOutputTokens: CINEMATIC_EDIT_ANALYSIS_CONFIG.MAX_OUTPUT_TOKENS,
      },
      task: { capability: AiTaskCapability.VisualQa },
    });
    const editorialDecisions = _.castArray(safeParseJSON(globalEditResponse.text, {})?.decisions);
    const editorialAiMetadata = globalEditResponse.aiMetadata;
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
          const selectedLibrarySegment = _.minBy(
            librarySegments,
            (candidate) =>
              Math.abs(_.toNumber(candidate.inSeconds) - _.toNumber(segment.inSeconds)) +
              Math.abs(_.toNumber(candidate.outSeconds) - _.toNumber(segment.outSeconds)),
          );
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
      const segments = _.isEmpty(editorialSegments) ? librarySegments : editorialSegments;
      const editorialStart = _.min(_.map(segments, (segment) => _.toNumber(segment.inSeconds))) ?? technicalUsableStart;
      const editorialOut = _.max(_.map(segments, (segment) => _.toNumber(segment.outSeconds))) ?? technicalUsableEnd;
      const trimStartSeconds = _.max([technical.trimStartSeconds, editorialStart]) || 0;
      const trimEndSeconds = _.max([technical.trimEndSeconds, technical.duration - editorialOut]) || 0;
      const usableDuration = technical.duration - trimStartSeconds - trimEndSeconds;
      const editorialTakeDecision = _.lt(usableDuration, CINEMATIC_EDIT_ANALYSIS_CONFIG.MIN_USABLE_SECONDS) ? technical.takeDecision : editorial.takeDecision;
      return {
        ..._.omit(technical, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
        trimStartSeconds,
        trimEndSeconds,
        takeDecision: _.isEqual(technical.takeDecision, "omit") ? "omit" : editorialTakeDecision,
        recommendedTransition: editorial.recommendedTransition,
        continuityScore: editorial.continuityScore,
        storyClarityScore: editorial.storyClarityScore,
        performanceScore: editorial.performanceScore,
        observedShotCount: editorial.observedShotCount,
        segments,
        supportShotType: editorial.supportShotType,
        entryStateObserved: editorial.entryStateObserved,
        exitStateObserved: editorial.exitStateObserved,
        dominantAction: editorial.dominantAction,
        warnings: _.uniq([...technical.warnings, ..._.castArray(editorial.warnings)]),
        reason: _.join(_.compact([technical.reason, editorial.reason]), ";"),
      };
    });
    return res.json({
      success: true,
      decisions: _.map(decisions, (decision) =>
        _.omit(decision, ["sourcePath", "contactSheetPath", "contactSheetData", "candidateSegments", "shotBoundaries"]),
      ),
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
      decisions: _.map(analyzedDecisions, (decision) =>
        _.omit(decision, ["sourcePath", "contactSheetData", "contactSheetPath", "candidateSegments", "shotBoundaries"]),
      ),
      libraryAnalysisAvailable,
      editorialReviewAvailable: false,
      timelineProvenance: libraryAnalysisAvailable ? "library" : "ffmpeg",
    });
  } finally {
    fs.rmSync(analysisDir, { recursive: true, force: true });
  }
});

router.post(ROUTER_PATHS.EXTRACT_THUMBNAIL_FRAME, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.body?.projectId));
  const thumbnailId = path.basename(_.toString(req.body?.thumbnailId));
  const assetUrl = _.trim(_.toString(req.body?.assetUrl));
  const dataRoot = path.resolve(getDataDirectory());
  const projectRoot = path.resolve(dataRoot, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  const sourcePath = path.resolve(dataRoot, _.trimStart(_.first(_.split(assetUrl, "?")) || "", "/\\"));
  if (!_.startsWith(_.toLower(sourcePath), _.toLower(`${projectRoot}${path.sep}`)) || !fs.existsSync(sourcePath)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Thumbnail source clip is missing." });
  }
  const outputDir = path.join(projectRoot, THUMBNAILS_DIR_NAME);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${thumbnailId}.jpg`);
  const executable = fs.existsSync(ffmpegBinary) ? ffmpegBinary : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD;
  const duration = await new Promise<number>((resolve) => ffmpeg.ffprobe(sourcePath, (error, metadata) => resolve(error ? 0 : _.toNumber(metadata?.format?.duration))));
  const seekSeconds = _.clamp(duration * 0.42, 0.1, _.max([0.1, duration - 0.1]) || 0.1);
  await new Promise<void>((resolve, reject) => {
    const process = spawn(executable, ["-y", "-ss", _.toString(seekSeconds), "-i", sourcePath, "-frames:v", "1", "-q:v", "2", outputPath], { windowsHide: true, stdio: "ignore" });
    process.once("error", reject);
    process.once("exit", (code) => (code === 0 && fs.existsSync(outputPath) ? resolve() : reject(new Error("Could not extract thumbnail frame."))));
  });
  return res.json({ success: true, imageUrl: `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/${THUMBNAILS_DIR_NAME}/${thumbnailId}.jpg` });
});

router.post(ROUTER_PATHS.VALIDATE_AUDIO, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_AUDIO, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const audioBase64 = _.toString(req.body?.audioBase64);
  if (_.isEmpty(audioBase64)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Audio is required for quality validation." });
  try {
    const response = await generateContentWithRetry({
      contents: [
        {
          role: "user",
          parts: [
            { text: getAudioQualityPrompt(_.toString(req.body?.script), _.toNumber(req.body?.targetDurationSeconds)) },
            { inlineData: { mimeType: _.startsWith(audioBase64, "UklGR") ? "audio/wav" : "audio/mpeg", data: audioBase64 } },
          ],
        },
      ],
      config: { responseMimeType: CONTENT_TYPES.JSON },
      task: { capability: AiTaskCapability.AudioQa },
    });
    const result = { success: true, quality: safeParseJSON(response.text, {}), rotationLogs: response.rotationLogs };
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
    if (error.message === "EXCEED_MAX_TEMPLATES")
      errorMsg = isVi ? "Bạn chỉ được lưu tối đa 2 dự án mẫu. Vui lòng xoá bớt để thêm mới." : "Maximum 2 templates allowed. Please delete one to add a new template.";
    else if (error.message === "INVALID_CAPCUT_TEMPLATE")
      errorMsg = isVi
        ? "Thư mục bạn chọn không phải là dự án Capcut hợp lệ (Thiếu file draft_content.json)."
        : "The selected folder is not a valid Capcut project (Missing draft_content.json).";
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
      const assetUrls = _.uniq(
        _.compact([
          targetScene.assetUrl,
          ..._.defaultTo(targetScene.assetUrls, []),
          ..._.map(_.defaultTo(targetScene.assetRevisions, []), "assetUrl"),
        ]),
      );
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
