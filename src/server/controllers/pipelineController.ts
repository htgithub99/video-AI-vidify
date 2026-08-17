import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import _ from 'lodash';
import { renderQueueService } from "../services/renderQueueService.js";
import { getProfiles, launchLoginBrowser, deleteProfile } from "../services/profileManagerService.js";
import { getLocalAccounts, saveLocalAccounts } from "../services/accountRotatorService.js";

import { jsonUtils } from "../../lib/json.js";
import { generateContentWithRetry, isAiProviderAvailable, isGeminiProviderAvailable } from "../services/geminiService.js";
import { classifyGeminiError, getGeminiUserMessage } from "../services/geminiErrorClassifier.js";
import { assertResponseContract, ResponseContractName } from "../services/responseContractService.js";
import { checkCache, setCache } from "../services/cacheService.js";
import { getProjectDetailFromDb, saveProjectDetailToDb } from "../utils/db.js";
import { getSafeFolderName } from "./projectController.js";
import JSZip from "jszip";
import { safeParseJSON, formatTime } from "../utils/helpers.js";
import { resolveImageFocusDirective } from "../../lib/imagePromptDirectives.js";
import { listTemplates, saveTemplate, deleteTemplate, renameTemplate } from "../utils/capcutTemplateManager.js";
import { PIPELINE_CONFIG, FFMPEG_RENDER_CONSTANTS, PROJECT_ASSET_GROUP, PROJECT_VISUAL_ASSET_CONFIG, REFERENCE_ASSET_GROUP, PROJECT_ASSET_ROUTE, PROJECT_ASSET_INVALID_REQUEST, BACKGROUND_MODE_CONFIG, TEXT_IN_IMAGE_MODE_CONFIG, FREE_AI_PROVIDER_LOGS, STYLE_EXTRACTION_CONFIG, PIPELINE_SERVER_ERRORS, PIPELINE_SERVER_LOGS, STORYBOARD_FALLBACK_CONFIG, RENDER_QUEUE_CONFIG, CONTENT_SAFETY_CONFIG, FINAL_MULTIMODAL_QA_CONFIG, FACT_RESEARCH_CONFIG, SCRIPT_PLAN_CONFIG, SEO_FALLBACK_CONFIG, ADVISORY_QA_CONFIG, STORYBOARD_QUALITY_CONFIG } from "../../constants/config.js";
import { resolveStoryboardCharacterIds, SCENE_REFERENCE_CONFIG } from "../../services/sceneReferenceService.js";
import { createSoftStyleDirective, normalizeExtractedStyle, normalizeVisualStyleProfile, resolveNegativeStylePrompt } from "../../services/styleReferenceService.js";
import { hasValidImages } from "../services/imageAssetService.js";
import { createSourceGroundedThumbnailIdeas, getThumbnailPlanningIssues, normalizeThumbnailIdeas } from "../../services/thumbnailPromptService.js";
import { clearProjectImageOutputs, clearProjectVideoOutputs } from "../../services/projectRegenerationService.js";
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
  VOICE_ALIGN_LOGS,
  VI_GENRE_GUIDELINES,
  VI_STYLE_GUIDELINES,
  VI_AUDIENCE_GUIDELINES,
  EN_GENRE_GUIDELINES,
  EN_STYLE_GUIDELINES,
  EN_AUDIENCE_GUIDELINES,
  PROMPT_CONTEXT,
  getStyleRewriteBatchPrompt,
  getOptimizePromptsBatchPrompt,
  getChapterWriterPrompt,
  getChapterExpansionPrompt,
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
  STYLE_EXTRACTION_PROMPT,
  THUMBNAIL_STYLE_EXTRACTION_PROMPT,
  getMultiStepHookPrompt,
  getCombinedScriptPrompt,
  getAudioQualityPrompt,
  getFinalVideoQualityPrompt,
  getContentSafetyPrompt,
  REGEX_AUTO_MODE_PATH,
  LogEvent,
  ErrorMessage,
  getDurationText,
  getThumbnailLayoutPrompt,
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
  VISUAL_QA_RESPONSE_SCHEMA,
  VISUAL_STYLE_PROFILE_RESPONSE_SCHEMA,
  VISUAL_BIBLE_RESPONSE_SCHEMA,
  FINAL_VIDEO_QA_RESPONSE_SCHEMA,
  SCRIPT_PROMPT_CONFIG,
  VIETNAMESE_CHAPTER_RETRY_DIRECTIVE,
  ENGLISH_CHAPTER_RETRY_DIRECTIVE,
  getVietnameseDiacriticsRestorationPrompt,
  RESPONSE_CONTRACT_CONFIG,
  SYSTEM_FETCH_CONFIG,
} from "../../constants";

import { logger, getMessage, appLogStep, getBilingualMessage, appWarn, createAppError, appError } from "../../lib/logger.js";
import { SecurityMessages } from "../../constants/security.js";

import { generateImageWithPlaywright, generateBatchImagesWithGeminiChat, closeAllBatchPages } from "../services/imageGeneratorService.js";
import { resolveApiKeys, getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { resolveVoiceRouting } from "../../lib/voiceRouting.js";
import { validateFactPack } from "../services/factPackValidationService.js";
import { readEncodedProjectImage, readStyleReferenceImage, resolveLocalProjectAssetPath } from "../services/imageAssetService.js";
import { readVisualQaAssets } from "../services/visualQaMediaService.js";

import { AspectRatio, AssetAcceptance, ContentSafetyReport, GenerateType, HookVersion, ProjectLanguage, SceneAssetStatus, StoryboardScene, StyleReferencePurpose, ThumbnailItem, ThumbnailTextMode, VisualBible, VisualConfig } from "../../types.js";
import { VideoQuality } from "../../constants/enums.js";
import { AiTaskCapability } from "../services/taskRouterService.js";
import { applyDeterministicStoryboardCoverage, normalizeStoryboardQuality } from "../../services/storyboardQualityService.js";
import { createUnavailableContentSafetyReport, normalizeContentSafety } from "../../services/contentSafetyService.js";
import { normalizeScriptQualityReport, parseTargetDurationSeconds, rankHookVersions } from "../../services/scriptQualityService.js";
import { resolveUsableHooks } from "../../services/hookResilienceService.js";
import { CHAPTER_LANGUAGE_VALIDATION_CONFIG, ChapterLanguageIssue, validateChapterLanguage } from "../../services/chapterLanguageValidationService.js";
import { extractCleanChapterSegment } from "../services/chapterResponseService.js";
import { normalizeScriptPlan, requestValidScriptPlan, resolveScriptPlanChapterCount } from "../services/scriptPlanResponseService.js";
import { createBatchContinuityContext, createPromptCharacterCards, createVisualPlanningPayload, normalizeVisualShotPlan } from "../services/imagePromptPlanningService.js";
import { appendImagePromptAspectRatio } from "../../services/imagePromptQualityService.js";
import { validateCompiledImagePrompts } from "../../services/imagePromptValidationService.js";
import { createScriptGroundedStoryboard, ensureScriptGroundedSceneDetails, ensureStoryboardScriptCoverage } from "../../services/storyboardFallbackService.js";
import { createSourceGroundedSeo } from "../../services/seoFallbackService.js";

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

const waitForNextTtsPoll = async (attempts: number): Promise<void> => {
  if (_.lt(attempts, TTS_POLLING_CONFIG.MAX_ATTEMPTS)) {
    await delayAsync(TTS_POLLING_CONFIG.INTERVAL_MS);
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
  const features = _.compact([
    hasImageItems ? FeatureType.IMAGE : undefined,
    hasVideoItems ? FeatureType.VIDEO : undefined,
  ]);
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
  const feature = _.isEqual(generateType, GenerateType.Video)
    ? FeatureType.VIDEO
    : FeatureType.IMAGE;
  requireLicense(feature)(req, res, next);
};

router.post(ROUTER_PATHS.EXTRACT_STYLE, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { images } = req.body;
    if (!images || !_.isArray(images) || _.isEmpty(images)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    const parts: any[] = [];
    const contentHashes: string[] = [];
    for (const imgBase64 of images) {
      const { data, mimeType } = await readStyleReferenceImage(imgBase64);
      contentHashes.push(createHash("sha256").update(data).digest("hex"));
      parts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    const purpose = _.isEqual(req.body.purpose, StyleReferencePurpose.Thumbnail)
      ? StyleReferencePurpose.Thumbnail
      : StyleReferencePurpose.Scene;
    const cachePayload = {
      purpose,
      profileVersion: STYLE_EXTRACTION_CONFIG.PROFILE_VERSION,
      contentHashes: _.sortBy(_.uniq(contentHashes)),
    };
    const cachedStyle = checkCache(API_ROUTES.PIPELINE_EXTRACT_STYLE, cachePayload, Boolean(req.body?.bypassCache));
    if (cachedStyle) return res.json(cachedStyle);

    if (!(await isGeminiProviderAvailable())) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR, retryable: true });
    }

    parts.push({
      text: _.isEqual(purpose, StyleReferencePurpose.Thumbnail)
        ? THUMBNAIL_STYLE_EXTRACTION_PROMPT
        : STYLE_EXTRACTION_PROMPT,
    });

    const response = await generateContentWithRetry({
      contents: parts,
      config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: VISUAL_STYLE_PROFILE_RESPONSE_SCHEMA },
      task: { capability: AiTaskCapability.StyleExtraction },
    }, 0);

    if (response && response.text) {
      const backgroundMode = req.body?.backgroundMode || req.body?.visualConfig?.styleBackgroundMode;
      const styleProfile = normalizeVisualStyleProfile(safeParseJSON(response.text, {}));
      const extracted = createSoftStyleDirective(styleProfile, backgroundMode) || normalizeExtractedStyle(response.text);
      const negativeStylePrompt = resolveNegativeStylePrompt(styleProfile);
      const result = {
        style: extracted,
        styleProfile,
        negativeStylePrompt,
        fingerprint: createHash("sha256").update(_.join([STYLE_EXTRACTION_CONFIG.PROFILE_VERSION, purpose, ..._.sortBy(_.uniq(contentHashes))], ":")).digest("hex"),
      };
      setCache(API_ROUTES.PIPELINE_EXTRACT_STYLE, cachePayload, result);
      return res.json(result);
    } else {
      throw new Error(getBackendMsg("STYLE_EXTRACTION_ERR", isVi));
    }
  } catch (error: any) {
    logger.error(LogEvent.STYLE_EXTRACTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR, retryable: true, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.REWRITE_PROMPTS, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
      (s: any) => s.prompt
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
      const prompt = getStyleRewriteBatchPrompt(newStyle, jsonUtils.safeStringify(chunkItem), aspectRatio || AspectRatio.SixteenNine, isVi, backgroundDirective, textDirective, focusDirective);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
            }
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_STYLE_REWRITE_FAILED_CHUNK, err);
      }

      if (i < chunks.length - 1) {
        await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
      }
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      const rewritten = rewrittenMap.get(scene.id);
      if (rewritten) {
        return { ...scene, prompt: rewritten };
      }
      return {
        ...scene,
        prompt: scene.prompt || "",
      };
    });

    res.json({ success: true, storyboard: updatedStoryboard });
  } catch (error: any) {
    logger.error(LogEvent.REWRITE_PROMPTS_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.OPTIMIZE_PROMPTS, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, visualConfig, visualBible, aspectRatio } = req.body;
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }
  const cachedPrompts = checkCache(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, req.body, Boolean(req.body?.bypassCache));
  if (cachedPrompts) return res.json(cachedPrompts);

  if (!(await isAiProviderAvailable())) {
    return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_PLANNING_UNAVAILABLE, retryable: true });
  }

  try {
    const sourceScenes = _.filter(storyboard as StoryboardScene[], scene => !_.isEmpty(scene.script || scene.subtitle));

    if (_.isEmpty(sourceScenes)) throw createAppError(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_INPUT_INVALID);

    const resolvedVisualConfig = visualConfig as VisualConfig;
    const resolvedVisualBible = visualBible as VisualBible;
    const characters = _.defaultTo(resolvedVisualConfig.characters, []);
    const visualStyle = resolvedVisualConfig.style;
    const promptCharacters = createPromptCharacterCards(characters);
    const charactersJson = !_.isEmpty(promptCharacters)
      ? jsonUtils.safeStringify(promptCharacters)
      : undefined;
    const chunkSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_OPTIMIZE;
    const backgroundDirective = resolvedVisualConfig.styleBackgroundMode ? _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, resolvedVisualConfig.styleBackgroundMode) : undefined;
    const textDirective = resolvedVisualConfig.styleTextInImageMode ? _.get(TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES, resolvedVisualConfig.styleTextInImageMode) : undefined;
    const focusDirective = resolvedVisualConfig.imageFocusMode ? resolveImageFocusDirective(resolvedVisualConfig.imageFocusMode, resolvedVisualConfig.styleBackgroundMode) : undefined;
    const hasStyleRef = hasValidImages(resolvedVisualConfig.styleReferenceImages);
    const hasSceneRef = hasValidImages(resolvedVisualConfig.sceneReferenceImages) || hasValidImages(resolvedVisualConfig.referenceImages);
    const referenceContext = hasStyleRef
      ? "A style-only reference image will be attached at generation time."
      : (hasSceneRef
        ? "One or more scene-context reference images will be attached at generation time."
        : "No reference image will be attached.");
    const targetStyle = hasStyleRef
      ? "Strict visual match: accurately follow the exact art style, character design, medium, and aesthetic of the uploaded reference image."
      : (hasSceneRef
        ? `Strict character match: accurately preserve character identity from the reference image in the "${visualStyle}" style.`
        : (resolvedVisualBible.visualStyle || visualStyle || "Dynamically craft the visual art style and medium to match the story's emotional tone and genre."));
    let plannedScenes: StoryboardScene[] = resolveStoryboardCharacterIds(_.cloneDeep(sourceScenes), characters);
    const planningPayload = createVisualPlanningPayload(plannedScenes);
    const chunks = _.chunk(planningPayload, chunkSize);
    const optimizedMap = new Map<string, StoryboardScene>();
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkItem = chunks[chunkIndex];
      const chunkStartIndex = _.multiply(chunkIndex, chunkSize);
      const prompt = getOptimizePromptsBatchPrompt(
        visualStyle,
        targetStyle,
        jsonUtils.safeStringify(chunkItem),
        aspectRatio || AspectRatio.SixteenNine,
        charactersJson,
        isVi,
        backgroundDirective,
        textDirective,
        focusDirective,
        resolvedVisualConfig.styleBackgroundMode || "auto",
        resolvedVisualConfig.styleTextInImageMode || "auto",
        resolvedVisualConfig.imageFocusMode || "default",
        referenceContext,
        jsonUtils.safeStringify(resolvedVisualBible),
        jsonUtils.safeStringify(createBatchContinuityContext(plannedScenes, chunkStartIndex, chunkItem.length)),
        jsonUtils.safeStringify(resolvedVisualBible.locations || []),
        jsonUtils.safeStringify(resolvedVisualBible.props || []),
        jsonUtils.safeStringify([]),
      );
      const response = await generateContentWithRetry({
        contents: prompt,
        config: { responseMimeType: CONTENT_TYPES.JSON },
        task: { capability: AiTaskCapability.VisualPlanning },
      });
      const parsed = safeParseJSON(response.text, []);
      _.forEach(_.isArray(parsed) ? parsed : [], item => {
        const baseScene = _.find(plannedScenes, { id: item.id });
        if (baseScene) optimizedMap.set(item.id, normalizeVisualShotPlan(item, baseScene, {
          characters,
          visualBible: resolvedVisualBible,
          textMode: resolvedVisualConfig.styleTextInImageMode,
        }));
      });
      if (chunkIndex < _.subtract(chunks.length, 1)) await delayAsync(PIPELINE_CONFIG.DELAY_LONG_CHUNKS_MS);
    }
    plannedScenes = _.map(plannedScenes, scene => optimizedMap.get(scene.id) || scene);
    const promptQa = validateCompiledImagePrompts(plannedScenes, {
      backgroundMode: resolvedVisualConfig.styleBackgroundMode,
      textMode: resolvedVisualConfig.styleTextInImageMode,
      targetStyle,
      characters,
      visualBible: resolvedVisualBible,
      forbidAspectRatio: true,
    });
    const finalizedScenes = _.map(plannedScenes, scene => ({
      ...scene,
      prompt: appendImagePromptAspectRatio(scene.prompt, aspectRatio || AspectRatio.SixteenNine),
    }));
    const scenesById = _.keyBy(finalizedScenes, "id");
    const updatedStoryboard = _.map(storyboard as StoryboardScene[], scene => scenesById[scene.id] || scene);
    const result = { success: true, storyboard: updatedStoryboard, promptQa };
    setCache(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, req.body, result);
    if (!promptQa.passed) appWarn(PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_QUALITY_REJECTED);
    return res.json(result);
  } catch (error: any) {
    logger.error(LogEvent.OPTIMIZE_PROMPTS_ERROR, error);
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({ error: PIPELINE_SERVER_ERRORS.IMAGE_PROMPT_GENERATION_FAILED, retryable: true, rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.REWRITE_THUMBNAILS, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
      const focusDirective = visualConfig?.thumbnailImageFocusMode ? resolveImageFocusDirective(visualConfig.thumbnailImageFocusMode, visualConfig.thumbnailBackgroundMode) : undefined;
      const prompt = getStyleRewriteBatchPrompt(newStyle, jsonUtils.safeStringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine, isVi, backgroundDirective, textDirective, focusDirective, true);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
            }
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
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
      const focusDirective = visualConfig?.thumbnailImageFocusMode ? resolveImageFocusDirective(visualConfig.thumbnailImageFocusMode, visualConfig.thumbnailBackgroundMode) : undefined;
      const prompt = getCharacterRewriteThumbnailsBatchPrompt(jsonUtils.safeStringify(finalCharacters), jsonUtils.safeStringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine, backgroundDirective, textDirective, focusDirective);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && item.prompt) {
              rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
            }
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
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { script, visualStyle } = req.body;
    if (!script) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("SCRIPT_REQUIRED", isVi) });
    }
    const cachedCharacters = checkCache(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, req.body, Boolean(req.body?.bypassCache));
    if (cachedCharacters) return res.json(cachedCharacters);

  if (!(await isAiProviderAvailable())) {
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const prompt = getCharacterAnalysisPrompt(script, _.toString(visualStyle));

    const response = await generateContentWithRetry({
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = safeParseJSON(response.text, []);
    const characters = _.take(_.isArray(parsed) ? parsed : [], REFACTOR_CONSTANTS.HOOK_COUNT);
    const result = { characters };
    setCache(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, req.body, result);
    return res.json(result);
  } catch (error: any) {
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.CHARACTER_ANALYSIS_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("CHARACTER_ANALYZE_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post(ROUTER_PATHS.EXTRACT_CHARACTER, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.CHARACTER_EXTRACTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("CHARACTER_EXTRACT_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post(ROUTER_PATHS.REWRITE_PROMPTS_CHARACTER, async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
      (s) => s.prompt
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
      const prompt = getCharacterRewriteBatchPrompt(jsonUtils.safeStringify(finalCharacters), jsonUtils.safeStringify(chunkItem), aspectRatio || AspectRatio.SixteenNine, backgroundDirective, textDirective, focusDirective);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, appendImagePromptAspectRatio(item.prompt, aspectRatio || AspectRatio.SixteenNine));
            }
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_CHARACTER_REWRITE_FAILED_CHUNK, err);
      }

      if (i < chunks.length - 1) {
        await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
      }
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      const rewritten = rewrittenMap.get(scene.id);
      if (rewritten) {
        return { ...scene, prompt: rewritten };
      }
      if (scene.prompt) {
        const combinedPrompt = _.join(
          _.filter(_.map(finalCharacters, (c: any) => c.prompt), Boolean),
          ", "
        );
        if (combinedPrompt) {
          return {
            ...scene,
            prompt: scene.prompt,
          };
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
  if (cached) {
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
      versions = rankHookVersions(_.map(versions, (v: any, idx: number): HookVersion => ({
        id: v.id || `hk_${idx + 1}`,
        content: v.content || "",
        type: v.type || hookType || "StyleName",
        selected: idx === 0,
        score: v.score,
      })));
    }

    logStep(getPipelineLog("HOOK_STEP3_DONE", isVi));
    const usableVersions = resolveUsableHooks(versions, hookType, count, originalInput);
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

  const cached = checkCache(API_ROUTES.PIPELINE_SCRIPT, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  if (!(await isAiProviderAvailable())) {
    const isVi = config.language === ProjectLanguage.VI;
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
    if (!contentSafety.allowed) {
      throw new Error(_.join(contentSafety.blockingErrors, ", ") || PIPELINE_SERVER_ERRORS.CONTENT_SAFETY_REJECTED);
    }
    const logStep = (msg: string) => {
      appLogStep(msg, multiStepLogs);
    };

    activeHookText = selectedHookText || "";
    if (!activeHookText && config.hookConfig) {
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
          generatedHookVersions = resolveUsableHooks(_.map(
            _.take(hookResult.versions, hookCount),
            (version: any, index: number): HookVersion => ({
              id: version.id || `hk_${index + 1}`,
              content: version.content || "",
              type: version.type || hookType,
              selected: false,
              score: version.score,
            }),
          ), hookType, hookCount, originalInput);
          const selectedHook = _.find(generatedHookVersions, "selected");
          if (!selectedHook) throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_QUALITY_REJECTED);
          activeHookText = selectedHook.content;
          logStep(`${getPipelineLog("HOOK_EMBEDDED", isVi)}"${activeHookText}"`);
        }
      } catch (hookError: any) {
        logger.error(LogEvent.ERROR_GENERATING_HOOKS, hookError);
        appWarn(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        generatedHookVersions = resolveUsableHooks([], config.hookConfig.type, config.hookConfig.count, originalInput);
        activeHookText = _.toString(_.get(_.find(generatedHookVersions, "selected"), "content"));
      }
    }

    logStep(getPipelineLog("SCRIPT_STEP1", isVi));

    const targetChapterCount = resolveScriptPlanChapterCount(targetWordCountMin);

    const contentControlDirective = `[User content controls]\n- Input type: ${inputType}. Treat a script/draft as source material to preserve; treat an idea as material to develop.\n- Rewrite level: ${_.clamp(_.toNumber(config.rewriteLevel), 0, 100)}%.\n- Creativity: ${_.clamp(_.toNumber(config.creativityLevel), 0, 10)}/10. Creativity may change expression and storytelling, never verified facts.\n- Similarity reduction: ${_.clamp(_.toNumber(config.similarityReduction), 0, 10)}/10. Vary wording and rhythm without changing factual meaning.`;
    const combinedScriptPrompt = `${getCombinedScriptPrompt(originalInput, durationText, targetWordCount, config.genre, config.writingStyle, isVi, activeHookText, genreGuideline, styleGuideline, audienceGuideline, targetChapterCount, config.hookConfig)}\n\n${contentControlDirective}`;

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
        groundedResearchResponse = null;
      }
    }
    if(groundedResearchResponse?.aiMetadata)aiMetrics.push(groundedResearchResponse.aiMetadata);
    const scriptPlanResponse = await requestValidScriptPlan({
      contents: groundedResearchResponse
        ? `${combinedScriptPrompt}\n\n[Grounded research evidence]:\n${groundedResearchResponse.text}`
        : `${combinedScriptPrompt}\n\n[Fact-check mode]: Disabled by the user. Do not invent sources, quotations, studies, or precise factual claims. Mark unverifiable claims unsupported and use cautious qualitative wording.`,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: SCRIPT_PLAN_RESPONSE_SCHEMA,
        maxOutputTokens: SCRIPT_PLAN_CONFIG.MAX_OUTPUT_TOKENS,
      },
      task: { capability: config.factCheck ? AiTaskCapability.FactualReview : AiTaskCapability.TextPlanning },
    }, targetChapterCount, generateContentWithRetry, originalInput);

    aiMetrics.push(...scriptPlanResponse.aiMetadata);
    multiStepLogs.push(...scriptPlanResponse.rotationLogs);
    const scriptResult = normalizeScriptPlan(scriptPlanResponse.value, originalInput) as any;
    scriptResult.factPack = await validateFactPack(scriptResult.factPack, Boolean(config.factCheck));
    assertResponseContract(scriptResult, ResponseContractName.ScriptPlan);

    logStep(`${getPipelineLog("SCRIPT_STEP1_DONE", isVi)} ${(scriptResult.preferredTerms || []).join(", ") || "None"}. Spec: ${scriptResult.characterSpecs || "No character reference needed."}`);

    logStep(getPipelineLog("SCRIPT_STEP2A", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2A_DONE", isVi)} ${(scriptResult.chapters || []).length} chapters.`);

    logStep(getPipelineLog("SCRIPT_STEP2B", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2B_DONE", isVi)} ${(scriptResult.chapters || []).length}.`);

    logStep(getPipelineLog("SCRIPT_STEP3", isVi));
    const completedChapters: any[] = [];
    let fullScript = activeHookText ? activeHookText + "\n\n" : "";
    let previousChapterSummary = activeHookText;

    const chapters = scriptResult.chapters || [];
    const chapterWordTarget = _.ceil(targetWordCount / (_.max([1, chapters.length]) || 1));
    const requestValidChapterSegment = async (contents: string): Promise<string> => {
      const languageFailureLogs: string[] = [];
      let latestUsableSegment = "";
      for (
        let attemptIndex = 0;
        attemptIndex < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_GENERATION_ATTEMPTS;
        attemptIndex++
      ) {
        const response = await generateContentWithRetry({
          contents: attemptIndex > 0
            ? `${contents}\n\n${isVi ? VIETNAMESE_CHAPTER_RETRY_DIRECTIVE : ENGLISH_CHAPTER_RETRY_DIRECTIVE}`
            : contents,
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
          completedChapters: _.map(completedChapters, completedChapter => _.pick(completedChapter, ["id", "title"])),
          previousChapterSummary,
        }),
      );

      let cleanedSegment = await requestValidChapterSegment(
        `Original Context:\n${originalInput}\n\nConcept Sheet:\n${jsonUtils.safeStringify(scriptResult)}\n\n${contentControlDirective}\n\nChapter Prompt:\n${chapterPrompt}`,
      );
      const chapterMinimumWords = _.floor(chapterWordTarget * (1 - SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));const chapterMaximumWords = _.ceil(chapterWordTarget * (1 + SCRIPT_PROMPT_CONFIG.CHAPTER_WORD_TOLERANCE_RATIO));
      for (let expansionIndex = 0; expansionIndex < REFACTOR_CONSTANTS.SCRIPT_CHAPTER_EXPANSION_RETRY_COUNT && _.size(_.words(cleanedSegment)) < chapterMinimumWords; expansionIndex++) {
        const currentWordCount = _.size(_.words(cleanedSegment));
        const continuation = await requestValidChapterSegment(
          getChapterExpansionPrompt(
            originalInput,
            chapter.title,
            cleanedSegment,
            chapterMinimumWords - currentWordCount,
            chapterMaximumWords - currentWordCount,
            isVi,
          ),
        );
        if (_.isEmpty(continuation)) break;
        cleanedSegment = _.trim(`${cleanedSegment} ${continuation}`);
      }

      completedChapters.push({
        id: chapter.id || `ch_${i + 1}`,
        title: chapter.title,
        scriptSegment: cleanedSegment,
      });
      previousChapterSummary = _.truncate(cleanedSegment, { length: SCRIPT_PROMPT_CONFIG.PREVIOUS_CHAPTER_SUMMARY_LENGTH });

      fullScript += cleanedSegment + "\n\n";
    }

    logStep(getPipelineLog("SCRIPT_STEP4", isVi));
    logStep(getPipelineLog("SCRIPT_STEP4_DONE", isVi));

    const finalCleanScript = fullScript.trim();
    const targetDurationSeconds = parseTargetDurationSeconds(rawDurationText);
    const scriptQaBase = normalizeScriptQualityReport({}, _.size(_.words(finalCleanScript)), targetDurationSeconds);
    const scriptQa = {
      ...scriptQaBase,
      blockingErrors: [],
      warnings: _.compact([
        ADVISORY_QA_CONFIG.SCRIPT_SKIPPED_WARNING,
        !scriptQaBase.durationFit && ADVISORY_QA_CONFIG.SCRIPT_DURATION_WARNING,
      ]),
      passed: true,
    };
    const finalChapters = syncChaptersWithScript(finalCleanScript, completedChapters);
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
    const rotationLogs = _.castArray(error?.rotationLogs);
    const missingFreeAiKeys = _.some(rotationLogs, log => _.isEqual(_.toString(log), FREE_AI_PROVIDER_LOGS.NO_KEYS));
    const attemptedFreeAi = _.some(rotationLogs, log => _.includes(_.toString(log), "[AI Router]")) && !missingFreeAiKeys;
    const languageIntegrityFailed = _.isEqual(error?.message, PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID);
    const scriptPlanInvalid = Boolean(error?.scriptPlanInvalid);
    const errorMessage = scriptPlanInvalid
      ? (isVi ? PIPELINE_SERVER_ERRORS.SCRIPT_PLAN_INVALID_VI : PIPELINE_SERVER_ERRORS.SCRIPT_PLAN_INVALID_EN)
      : languageIntegrityFailed
      ? (isVi ? PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID_VI : PIPELINE_SERVER_ERRORS.SCRIPT_LANGUAGE_INVALID_EN)
      : missingFreeAiKeys
      ? (isVi ? "Chưa có khóa Groq hoặc Cerebras miễn phí; Gemini dự phòng cũng không phản hồi. Hãy thêm ít nhất một khóa free trong Cài đặt rồi tiếp tục dự án." : "No free Groq or Cerebras key is configured, and the Gemini fallback also failed. Add at least one free key in Settings, then resume the project.")
      : attemptedFreeAi
        ? (isVi ? "Các AI miễn phí đang tạm hết hạn mức hoặc không phản hồi. Hệ thống đã thử toàn bộ model miễn phí trước Gemini; hãy tiếp tục lại dự án sau ít phút." : "The free AI providers are temporarily rate-limited or unavailable. All free models were tried before Gemini; resume the project in a few minutes.")
        : getGeminiUserMessage(error, isVi);
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      error: errorMessage,
      retryable: scriptPlanInvalid || languageIntegrityFailed || attemptedFreeAi || classifyGeminiError(error).retryable,
    });
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

  const allFound = _.every(segmentsFound, s => s.index !== -1);
  if (allFound) {
    for (let i = 0; i < syncedChapters.length; i++) {
      const start = (i === 0) ? 0 : segmentsFound[i].index;
      const end = (i === syncedChapters.length - 1) ? rewrittenScript.length : segmentsFound[i + 1].index;
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
    if (i === syncedChapters.length - 1) {
      targetCount = totalSentences - sentenceCursor;
    }
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
    const prompt = getDetailedPromptBuilderPrompt(sceneScript, setting, time, character, costume, camera, style, aspectRatio || AspectRatio.SixteenNine, characterPrompt, referencePrompt, currentPrompt);

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
  const requestedMax = _.toInteger(_.get(
    req.body,
    REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY,
    SecurityConstants.DEFAULT_AMOUNT,
  ));
  const maxVideos = _.clamp(
    requestedMax,
    SecurityConstants.DEFAULT_AMOUNT,
    _.max([_.size(scenes), SecurityConstants.DEFAULT_AMOUNT])!,
  );

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
    const videoSceneIds = _.take(
      _.uniq(_.filter(
        _.get(parsed, REFACTOR_CONSTANTS.VIDEO_SCENE_IDS_KEY, []),
        (sceneId) => _.includes(validSceneIds, sceneId),
      )),
      maxVideos,
    );
    return res.json({ videoSceneIds });
  } catch (error: any) {
    logger.error(LogEvent.VIDEO_SCENE_SELECTION_ERROR, error);
    return res.json({ videoSceneIds: [], rotationLogs: error.rotationLogs });
  }
});

router.post(ROUTER_PATHS.VALIDATE_SCENE_IMAGE, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const assetUrl = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY));
  const sceneId = _.toString(_.get(req.body, "sceneId", REFACTOR_CONSTANTS.UNKNOWN_SCENE_ID));
  const sceneScript = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY));
  const imagePrompt = _.toString(_.get(req.body, REFACTOR_CONSTANTS.AVG_PROMPT_KEY));
  const expectedSubjectCount = _.toInteger(_.get(req.body, "expectedSubjectCount", 0)) || undefined;
  const referenceAssetUrl = _.toString(_.get(req.body, "referenceAssetUrl"));
  const referenceAssetUrls = _.take(_.filter(_.castArray(_.get(req.body, "referenceAssetUrls", [])), _.isString), SCENE_REFERENCE_CONFIG.MAX_IMAGES);
  const qaPurpose = _.isEqual(_.get(req.body, "qaPurpose"), "thumbnail") ? "thumbnail" : "scene";
  const expectedHeadline = _.toString(_.get(req.body, "expectedHeadline"));
  const layoutId = _.toString(_.get(req.body, "layoutId"));
  const typographyId = _.toString(_.get(req.body, "typographyId"));

  if (_.isEmpty(assetUrl)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.ERR_VISUAL_QA_ASSET_REQUIRED });
  }

  try {
    const encodedAssets = await readVisualQaAssets(assetUrl);
    if (_.isEmpty(encodedAssets)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: REFACTOR_CONSTANTS.ERR_VISUAL_QA_ASSET_INVALID });

    const parts: any[] = [
      { text: getSceneImageQualityPrompt(sceneId, sceneScript, imagePrompt, expectedSubjectCount, qaPurpose, expectedHeadline, layoutId, typographyId) },
    ];
    _.forEach(encodedAssets, encodedImage => parts.push({ inlineData: encodedImage }));
    const qualityReferences = _.take(_.uniq(_.compact([referenceAssetUrl, ...referenceAssetUrls])), SCENE_REFERENCE_CONFIG.MAX_IMAGES);
    for (const qualityReference of qualityReferences) {
      const encodedReference = readEncodedProjectImage(qualityReference);
      if (encodedReference) {
        parts.push({ text: SCENE_QA_REFERENCE_DIRECTIVE });
        parts.push({ inlineData: encodedReference });
      }
    }
    const response = await generateContentWithRetry({
      contents: [{
        role: "user",
        parts,
      }],
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
  const { rewrittenScript, chapters, config = {}, visualStyle, referenceStyle, referenceCharacter, referenceCharacters, referenceImages, bypassCache, voiceDuration } = req.body;

  let syncedChapters = chapters;
  if (chapters && chapters.length > 0 && rewrittenScript) {
    syncedChapters = syncChaptersWithScript(rewrittenScript, chapters);
  }

  let characterRef: string | undefined = undefined;
  const rawRefChars = referenceCharacters || referenceCharacter;
  if (rawRefChars) {
    if (typeof rawRefChars === "string") {
      characterRef = rawRefChars.trim() || undefined;
    } else {
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
  if (!activeStyle && visualStyle && stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords]) {
    activeStyle = stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords];
  }

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
    } else if (splitStrategy === SplitStrategy.MIXED_SENTENCES) {
      mappedDensity = SceneDensity.CAU_KET_HOP;
    } else if (_.includes([SplitStrategy.SENTENCE, SplitStrategy.LONG_SENTENCE], splitStrategy as SplitStrategy)) {
      mappedDensity = SceneDensity.CAU_DAI;
    } else {
      mappedDensity = SceneDensity.THEO_DOAN;
    }

    const genre = config?.genre || VideoGenre.STORYTELLING;
    let genreVisualGuideline =
      GENRE_VISUAL_GUIDELINES[genre as VideoGenre] ||
      `CRITICAL VISUAL DIRECTIVE - ${genre.toUpperCase()} GENRE:
- Maintain context consistency and ensure the image details align with a ${genre} theme.`;

    const storyboardLogger = new StepLogger();
    const storyboardLogs = storyboardLogger.getLogs();
    const logStoryboardStep = (msg: string) => storyboardLogger.log(msg);

    logStoryboardStep(getPipelineLog("STORY_STEP1", isVi));
    const visualBiblePrompt = getGlobalVisualBiblePrompt(rewrittenScript, genre, visualStyle, activeStyle, characterRef);

    const bibleParts: any[] = [];
    if (referenceImages && _.isArray(referenceImages) && (!_.isEmpty(referenceImages))) {
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
      text: visualBiblePrompt + (referenceImages && (!_.isEmpty(referenceImages)) ? VISUAL_BIBLE_REFERENCE_PROMPT : ""),
    });

    let visualBible: VisualBible = {
      characterSpecs: characterRef || "Preserve recurring identity anchors",
      landscapeSpecs: "Preserve story-grounded environments and geography",
      visualStyle: activeStyle || visualStyle,
      colorPalette: "Use a restrained scene-appropriate palette compatible with the selected visual language",
      lightingMood: "Let each narrated scene determine its lighting and mood",
      lineStyle: "Follow the selected visual language without adding unrelated rendering traits",
      colorMode: "Keep coloring coherent while adapting contrast to each scene",
      shading: "Use only style-compatible shading needed for readable forms",
      background: _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, config?.styleBackgroundMode, BACKGROUND_MODE_CONFIG.DIRECTIVES.contextual),
      textPolicy: _.get(TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES, config?.styleTextInImageMode, TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES.auto),
      locations: [],
      props: [],
    };
    if (aiProviderAvailable) {
      try {
        const bibleResponse = await generateContentWithRetry({
          contents: bibleParts,
          config: { responseMimeType: CONTENT_TYPES.JSON, responseJsonSchema: VISUAL_BIBLE_RESPONSE_SCHEMA },
        });
        const parsedVisualBible = safeParseJSON(bibleResponse.text, {}) as VisualBible;
        const hasRequiredVisualBibleFields = !_.isEmpty(parsedVisualBible.locations) && _.every([
          parsedVisualBible.colorPalette,
          parsedVisualBible.characterSpecs,
          parsedVisualBible.landscapeSpecs,
          parsedVisualBible.lightingMood,
          parsedVisualBible.visualStyle,
        ], value => !_.isEmpty(_.trim(_.toString(value))));
        if (hasRequiredVisualBibleFields) visualBible = parsedVisualBible;
        else storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
        if (bibleResponse.rotationLogs) storyboardLogs.push(...bibleResponse.rotationLogs);
      } catch (visualBibleError) {
        appWarn(PIPELINE_SERVER_ERRORS.VISUAL_BIBLE_INVALID, visualBibleError);
        storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
      }
    } else {
      storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.VISUAL_BIBLE_WARNING);
    }
    if (!_.isEmpty(visualBible)) {
      logStoryboardStep(`${getPipelineLog("STORY_STEP1_DONE", isVi)} ${visualBible.colorPalette}. Character Spec: ${visualBible.characterSpecs}. Landscape Spec: ${visualBible.landscapeSpecs}`);
    }

    logStoryboardStep(`${getPipelineLog("STORY_STEP2", isVi)} ${mappedDensity}...`);
    let allScenes: any[] = [];

    try {
      logStoryboardStep(getBilingualMessage("STORYBOARD_SPLITTING_GEMINI"));

      const splitPrompt = getScriptSplitPrompt(
        rewrittenScript,
        jsonUtils.safeStringify(syncedChapters),
        splitStrategy,
        isVi
      );

      const splitResponse = await generateContentWithRetry({
        contents: splitPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const splitData = safeParseJSON(splitResponse.text, { scenes: [] });
      let splitScenes = splitData.scenes || [];
      if (splitResponse.rotationLogs) {
        storyboardLogs.push(...splitResponse.rotationLogs);
      }

      if (!_.isArray(splitScenes) || _.isEmpty(splitScenes) || !_.every(splitScenes, (s: any) => s.script)) {
        throw createAppError(PIPELINE_SERVER_ERRORS.STORYBOARD_STRUCTURE_INVALID);
      } else {
        splitScenes = _.map(splitScenes, (scene: any, idx: number) => ({
          ...scene,
          id: _.join([STORYBOARD_FALLBACK_CONFIG.SCENE_ID_PREFIX, _.add(idx, SecurityConstants.DEFAULT_AMOUNT)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          script: scene.script || scene.subtitle || "",
          subtitle: scene.subtitle || scene.script || "",
        }));
      }

      logStoryboardStep(getBilingualMessage("STORYBOARD_GENERATING_DETAILS_BATCH", splitScenes.length));

      const batchSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_OPTIMIZE;
      const chunks = _.chunk(splitScenes, batchSize);
      const detailedScenesMap = new Map<string, any>();

      for (let i = 0; i < chunks.length; i++) {
        const chunkScenes = chunks[i];
        logStoryboardStep(getBilingualMessage("STORYBOARD_PROCESSING_BATCH", i + 1, chunks.length));

        const minimalScenesJson = jsonUtils.safeStringify(_.map(chunkScenes, (s: any) => ({
          id: s.id,
          script: s.script,
          subtitle: s.subtitle
        })), null, 2);

        const hasStyleReference = hasValidImages(config?.styleReferenceImages);
        const hasSceneReference = hasValidImages(referenceImages) ||
          hasValidImages(config?.referenceImages) ||
          hasValidImages(config?.sceneReferenceImages);

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
          if (batchResponse.rotationLogs) {
            storyboardLogs.push(...batchResponse.rotationLogs);
          }

          for (const bs of batchScenes) {
            if (bs.id) {
              detailedScenesMap.set(bs.id, bs);
            }
          }
        } catch (batchErr: any) {
          logger.error("STORYBOARD_BATCH_GEN_ERROR", i + 1, batchErr.message);
          if (batchErr.rotationLogs) {
            storyboardLogs.push(...batchErr.rotationLogs);
          }
        }

        if (i < chunks.length - 1) {
          await delayAsync(PIPELINE_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
        }
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
      allScenes = createScriptGroundedStoryboard({
        rewrittenScript,
        chapters: syncedChapters,
        splitStrategy,
        aspectRatio: config?.aspectRatio || AspectRatio.SixteenNine,
        targetStyle: activeStyle || visualStyle,
        visualBible,
      });
      storyboardLogs.push(STORYBOARD_FALLBACK_CONFIG.FALLBACK_WARNING);
    } else {
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
      data.scenes = ensureStoryboardScriptCoverage(diversifyDuplicatePrompts(data.scenes), {
        rewrittenScript,
        chapters: syncedChapters,
        splitStrategy,
        aspectRatio: config?.aspectRatio || AspectRatio.SixteenNine,
        targetStyle: activeStyle || visualStyle,
        visualBible,
      });
      data.scenes = assignStoryboardChapterIds(data.scenes, syncedChapters);
    }

    if (chosenDuration && data.scenes && data.scenes.length > 0) {
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
        if (i === scenes.length - 1) {
          duration = _.max([STORYBOARD_FALLBACK_CONFIG.MIN_SCENE_DURATION_SECONDS, chosenDuration - currentSecs]);
        }

        const startSecs = currentSecs;
        const endSecs = currentSecs + duration;
        currentSecs = endSecs;

        scenes[i].duration = duration;
        scenes[i].startTime = formatTime(startSecs);
        scenes[i].endTime = formatTime(endSecs);
      }
    }

    const storyboardQaBase = applyDeterministicStoryboardCoverage(
      normalizeStoryboardQuality({}),
      rewrittenScript,
      data.scenes,
    );
    data.storyboardQa = {
      ...storyboardQaBase,
      blockingErrors: [],
      warnings: _.uniq(_.compact([
        ADVISORY_QA_CONFIG.STORYBOARD_SKIPPED_WARNING,
        storyboardQaBase.scriptCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE
          ? STORYBOARD_QUALITY_CONFIG.SCRIPT_COVERAGE_WARNING
          : "",
        storyboardQaBase.pacingCoverageScore! < STORYBOARD_QUALITY_CONFIG.MIN_SCORE
          ? STORYBOARD_QUALITY_CONFIG.PACING_COVERAGE_WARNING
          : "",
      ])),
      passed: true,
    };

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

  if (!(await isAiProviderAvailable())) {
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

    logSeoStep(PIPELINE_LOGS.SEO_STEP1);

    const genre = config.genre || req.body?.genre || req.body?.project?.config?.genre;
    const combinedSeoPrompt = getSeoOptimizationPrompt(rewrittenScript, isVi, numTitles, numDescriptions, numHashtags, numTags, genre);

    const combinedResponse = await generateContentWithRetry({
      contents: combinedSeoPrompt,
      config: { responseMimeType: "application/json" },
    });

    const seoResult = safeParseJSON(combinedResponse.text, {
      keywords: [],
      titles: [],
      descriptions: [],
      hashtags: [],
      tags: [],
    });

    logSeoStep(`${PIPELINE_LOGS.SEO_STEP1_DONE} ${(seoResult.keywords || []).join(", ") || "None"}`);
    if (combinedResponse.rotationLogs) seoLogs.push(...combinedResponse.rotationLogs);

    logSeoStep(PIPELINE_LOGS.SEO_STEP2);
    logSeoStep(PIPELINE_LOGS.SEO_STEP2_DONE);

    logSeoStep(PIPELINE_LOGS.SEO_STEP3);
    logSeoStep(PIPELINE_LOGS.SEO_DONE_ALL);

    const parsedData = {
      titles: seoResult.titles || [],
      descriptions: seoResult.descriptions || [],
      hashtags: _.map(seoResult.hashtags || [], (tag: string) => tag.replace(/^#+/, "")),
      tags: seoResult.tags || [],
      rotationLogs: seoLogs,
    };

    setCache(API_ROUTES.PIPELINE_SEO, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_SEO, error);
    res.json({
      ...createSourceGroundedSeo(rewrittenScript, { numTitles, numDescriptions, numHashtags, numTags }),
      rotationLogs: _.uniq(_.compact([..._.castArray(error.rotationLogs), SEO_FALLBACK_CONFIG.WARNING])),
    });
  }
});

router.post("/thumbnails", async (req: Request, res: Response) => {
  const { rewrittenScript, config = {}, visualConfig = {}, bypassCache } = req.body;

  const thumbnailCachePayload = {
    ...req.body,
    layoutProfileVersion: THUMBNAIL_PROMPT_CONFIG.LAYOUT_PROFILE_VERSION,
  };
  const cached = checkCache(API_ROUTES.PIPELINE_THUMBNAILS, thumbnailCachePayload, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const thumbnailCount = _.toInteger(visualConfig.thumbnailCount) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_COUNT;
  const thumbnailTextMode = _.isEqual(visualConfig.thumbnailTextInImageMode, ThumbnailTextMode.NoText)
    ? ThumbnailTextMode.NoText
    : ThumbnailTextMode.Headline;
  const hasThumbReference = hasValidImages(visualConfig.thumbnailReferenceImages) ||
    hasValidImages(visualConfig.thumbnailSceneReferenceImages);
  const hasStyleRef = hasValidImages(visualConfig.styleReferenceImages);
  const refImageStr = hasThumbReference
    ? "Strict visual match: accurately follow the exact art style, character design, medium, and aesthetic of the uploaded reference image."
    : (hasStyleRef
      ? "Strict visual match: accurately follow the exact art style and aesthetic of the uploaded style reference image."
      : (visualConfig.thumbnailReferencePrompt || "Dynamically craft the visual art style and medium to match the story's emotional tone and genre."));

  if (!(await isAiProviderAvailable())) {
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

    logThumbStep(PIPELINE_LOGS.THUMB_STEP1);

    const thumbnailBackgroundDirective = visualConfig?.thumbnailBackgroundMode
      ? _.get(BACKGROUND_MODE_CONFIG.DIRECTIVES, visualConfig.thumbnailBackgroundMode, "")
      : "";
    const thumbnailFocusDirective = visualConfig?.thumbnailImageFocusMode
      ? resolveImageFocusDirective(
        visualConfig.thumbnailImageFocusMode,
        visualConfig.thumbnailBackgroundMode,
      )
      : "";
    const thumbnailCharacters = createPromptCharacterCards(
      _.defaultTo(visualConfig?.characters, []),
    );
    const combinedThumbnailsPrompt = getThumbnailLayoutPrompt(
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
    );

    const thumbParts: any[] = [];
    const thumbRefList = _.take(
      _.compact(
        _.concat(
          _.castArray(visualConfig.thumbnailReferenceImages || []),
          _.castArray(visualConfig.thumbnailSceneReferenceImages || []),
        ),
      ),
      3,
    );
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
    const requestParts = _.concat(thumbParts, [{
      text: combinedThumbnailsPrompt
        + (visualConfig.thumbnailReferenceImages && visualConfig.thumbnailReferenceImages.length > 0 ? THUMBNAIL_IMAGE_REFERENCE_PROMPT : ""),
    }]);
    const combinedResponse = await generateContentWithRetry({
      contents: requestParts,
      config: { responseMimeType: "application/json" },
      task: { capability: AiTaskCapability.Thumbnail },
    });
    const parsedResult = safeParseJSON(combinedResponse.text, {
      concepts: [],
      thumbnails: [],
    });
    thumbsResult = {
      concepts: _.castArray(parsedResult.concepts || []),
      thumbnails: _.castArray(parsedResult.thumbnails || []),
    };
    if (combinedResponse.rotationLogs) thumbLogs.push(...combinedResponse.rotationLogs);
    const planningIssues = getThumbnailPlanningIssues(thumbsResult.thumbnails, thumbnailTextMode, thumbnailCount, refImageStr);
    if (!_.isEmpty(planningIssues)) {
      thumbLogs.push(`${ADVISORY_QA_CONFIG.THUMBNAIL_PLANNING_WARNING_PREFIX} ${_.join(planningIssues, ", ")}`);
    }

    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP1_DONE} ${(thumbsResult.concepts || []).length || 0} layouts.`);
    logThumbStep(PIPELINE_LOGS.THUMB_STEP2);
    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP2_DONE} ${(thumbsResult.thumbnails || []).length || 0} thumbnails.`);

    logThumbStep(PIPELINE_LOGS.THUMB_STEP3);
    logThumbStep(PIPELINE_LOGS.THUMB_DONE_ALL);

    let normalizedThumbnails = normalizeThumbnailIdeas(
      _.castArray(thumbsResult.thumbnails || []),
      thumbnailCount,
      thumbnailTextMode,
    );
    if (_.lt(_.size(normalizedThumbnails), thumbnailCount)) {
      const sourceFallbacks = createSourceGroundedThumbnailIdeas(rewrittenScript, thumbnailCount, visualConfig.thumbnailReferencePrompt || visualConfig.style, thumbnailTextMode);
      normalizedThumbnails = normalizeThumbnailIdeas(_.concat(normalizedThumbnails, _.drop(sourceFallbacks, _.size(normalizedThumbnails))), thumbnailCount, thumbnailTextMode);
      thumbLogs.push(THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_WARNING);
    }
    const parsedData = {
      thumbnails: normalizedThumbnails,
      rotationLogs: thumbLogs,
    };

    setCache(API_ROUTES.PIPELINE_THUMBNAILS, thumbnailCachePayload, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_THUMBNAILS_PROMPTS, error);
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

    const keys = await resolveApiKeys();
    const apiKey = _.get(keys, 'ai33Key', '');

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
    if (!ttsData.success || !ttsData.task_id) {
      throw new Error(getMessage("TTS_NO_TASK_ID", undefined, jsonUtils.safeStringify(ttsData)));
    }

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

    if (!audioUrl) {
      throw new Error(getMessage("TTS_TASK_TIMED_OUT"));
    }

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
router.post("/generate-image", requireSingleVisualLicense, async (req: Request, res: Response) => {
  try {
    const { prompt, style, visualConfig, sandboxConfig } = req.body;

    const result = await generateImageWithPlaywright({
      prompt,
      style,
      visualConfig,
      sandboxConfig,
    });

    if (result && result.success) {
      const feature = _.isEqual(visualConfig?.generateType, GenerateType.Video)
        ? FeatureType.VIDEO
        : FeatureType.IMAGE;
      await incrementFeatureUsage(req, feature, SecurityConstants.DEFAULT_AMOUNT);
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
  }
});

router.post("/generate-batch-images", requireBatchVisualLicense, async (req: Request, res: Response) => {
  try {
    const { items, visualConfig, style } = req.body;

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
      await generateBatchImagesWithGeminiChat(items, visualConfig, style, (progressResult) => {
        if (_.get(progressResult, SecurityConstants.SUCCESS_KEY)) {
          if (_.isEqual(progressResult.assetType, GenerateType.Video)) {
            successfulVideoCount = _.add(successfulVideoCount, SecurityConstants.DEFAULT_AMOUNT);
          } else {
            successfulImageCount = _.add(successfulImageCount, SecurityConstants.DEFAULT_AMOUNT);
          }
        }
        res.write(jsonUtils.safeStringify(progressResult) + "\n");
      });
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
  if (!isInsideDataRoot || !fs.existsSync(videoPath)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Rendered video is outside the Vidify data root or missing." });
  const tempDir = path.join(dataRoot, `${FINAL_MULTIMODAL_QA_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const executable = fs.existsSync(ffmpegBinary) ? ffmpegBinary : FINAL_MULTIMODAL_QA_CONFIG.FFMPEG_FALLBACK_COMMAND;
    const durationSeconds = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(videoPath, (error, metadata) => resolve(error ? 0 : _.toNumber(metadata?.format?.duration)));
    });
    const sampleIntervalSeconds = _.max([
      FINAL_MULTIMODAL_QA_CONFIG.MIN_SAMPLE_INTERVAL_SECONDS,
      durationSeconds / FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT,
    ]) || FINAL_MULTIMODAL_QA_CONFIG.DEFAULT_SAMPLE_INTERVAL_SECONDS;
    const frameOutputPattern = path.join(tempDir, FINAL_MULTIMODAL_QA_CONFIG.FRAME_FILE_PATTERN);
    await new Promise<void>((resolve, reject) => {
      const process = spawn(executable, ["-y", "-i", videoPath, "-vf", `fps=1/${sampleIntervalSeconds},scale=${FINAL_MULTIMODAL_QA_CONFIG.FRAME_SCALE_WIDTH}:-2`, "-frames:v", _.toString(FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT), frameOutputPattern], { windowsHide: true, stdio: "ignore" });
      process.once("error", reject);
      process.once("exit", code => code === 0 ? resolve() : reject(new Error(`Final QC frame extraction failed (${code}).`)));
    });
    const audioPath = path.join(tempDir, FINAL_MULTIMODAL_QA_CONFIG.AUDIO_FILE_NAME);
    await new Promise<void>((resolve, reject) => {
      const process = spawn(executable, [
        "-y", "-i", videoPath,
        "-vn", "-ac", _.toString(FINAL_MULTIMODAL_QA_CONFIG.AUDIO_CHANNELS),
        "-b:a", FINAL_MULTIMODAL_QA_CONFIG.AUDIO_BITRATE,
        "-t", _.toString(FINAL_MULTIMODAL_QA_CONFIG.MAX_AUDIO_REVIEW_SECONDS),
        audioPath,
      ], { windowsHide: true, stdio: "ignore" });
      process.once("error", reject);
      process.once("exit", code => code === 0 ? resolve() : reject(new Error(PIPELINE_SERVER_ERRORS.FINAL_QA_AUDIO_MISSING)));
    });
    const frameFiles = _.take(
      _.sortBy(_.filter(fs.readdirSync(tempDir), file => _.endsWith(file, FINAL_MULTIMODAL_QA_CONFIG.FRAME_EXTENSION))),
      FINAL_MULTIMODAL_QA_CONFIG.FRAME_COUNT,
    );
    if (_.isEmpty(frameFiles)) throw new Error(PIPELINE_SERVER_ERRORS.FINAL_QA_FRAMES_MISSING);
    const parts:any[]=[{text:getFinalVideoQualityPrompt(_.toString(req.body?.script),_.toString(req.body?.viewerPromise))}];
    _.forEach(frameFiles,file=>parts.push({inlineData:{mimeType:FINAL_MULTIMODAL_QA_CONFIG.FRAME_MIME_TYPE,data:fs.readFileSync(path.join(tempDir,file)).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding)}}));
    parts.push({inlineData:{mimeType:FINAL_MULTIMODAL_QA_CONFIG.AUDIO_MIME_TYPE,data:fs.readFileSync(audioPath).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding)}});
    const response=await generateContentWithRetry({contents:[{role:"user",parts}],config:{responseMimeType:CONTENT_TYPES.JSON,responseJsonSchema:FINAL_VIDEO_QA_RESPONSE_SCHEMA,maxOutputTokens:FINAL_MULTIMODAL_QA_CONFIG.MAX_OUTPUT_TOKENS},task:{capability:AiTaskCapability.VisualQa}});
    const result={success:true,quality:safeParseJSON(response.text,{}),aiMetadata:response.aiMetadata,rotationLogs:response.rotationLogs};
    setCache(API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO,req.body,result);
    return res.json(result);
  } catch(error:any) {
    logger.error(LogEvent.VISUAL_QA_ERROR,error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:error.message});
  } finally {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir,{recursive:true,force:true});
  }
});

router.post(ROUTER_PATHS.VALIDATE_AUDIO, async (req: Request, res: Response) => {
  const cachedQuality = checkCache(API_ROUTES.PIPELINE_VALIDATE_AUDIO, req.body, Boolean(req.body?.bypassCache));
  if (cachedQuality) return res.json(cachedQuality);
  const audioBase64 = _.toString(req.body?.audioBase64);
  if (_.isEmpty(audioBase64)) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: "Audio is required for quality validation." });
  try {
    const response = await generateContentWithRetry({
      contents: [{ role: "user", parts: [
        { text: getAudioQualityPrompt(_.toString(req.body?.script), _.toNumber(req.body?.targetDurationSeconds)) },
        { inlineData: { mimeType: _.startsWith(audioBase64, "UklGR") ? "audio/wav" : "audio/mpeg", data: audioBase64 } },
      ] }],
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
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
            } catch (cleanupErr) { }
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
          _.filter(
            fs.readdirSync(outputDir),
            (fileName) => {
              if (!ALIGN_CONFIG.LEGACY_SEGMENT_FILE_REGEX.test(fileName)) return false;
              const canonicalFileName = _.replace(
                fileName,
                ALIGN_CONFIG.LEGACY_SEGMENT_PREFIX,
                REFACTOR_CONSTANTS.VD_EMPTY_STRING,
              );
              return fs.existsSync(path.join(outputDir, canonicalFileName));
            },
          ),
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
          } catch (err) {
            logger.error(VOICE_ALIGN_LOGS.ERR_DELETE_TEMP_FILES, err);
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
            } catch (e) { }
          }
          return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: getBackendMsg("VOICE_ALIGN_PARSE_ERR", isVi).replace("{0}", err.message),
          });
        }
      });
    }
  } catch (err: any) {
    logger.error(VOICE_ALIGN_LOGS.ERR_UNEXPECTED_ALIGN, err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: ErrorMessage.INTERNAL_SERVER_ERROR + err.message });
  }
});

router.post("/run-ultra", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { filePath, geminiApiKey, sfxFolder, opts, isAutoMode, templateId, parentFolder, imagesDir, voicesDir, projectStyle, projectName, autoExportVideo, videoOutputDir, projectId } = req.body;

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
    const pad = (n: number) => _.padStart(n.toString(), 2, '0');
    finalProjectName = `AI_CAPCUT_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear().toString().substring(2)}`;
  }

  let realTemplateId = templateId || "";
  if (isAutoMode && realTemplateId && fs.existsSync(realTemplateId)) {
    try {
      const rawContent = fs.readFileSync(realTemplateId, FileEncoding.UTF8 as any).toString();
      const templateContent = jsonUtils.safeParse<any>(rawContent, {});
      if (templateContent.folderPath) {
        realTemplateId = path.join(templateContent.folderPath, "draft_content.json");
      }
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
    video_output_dir: videoOutputDir || ""
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
      } catch (cleanupErr) { }

      if (code !== 0) {
        try {
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        } catch (cleanupErr) { }

        logger.error(`CapCut Ultra process failed with exit code ${code}`);
        res.write(jsonUtils.safeStringify({
          success: false,
          error: getBackendMsg("ULTRA_EXIT_ERROR", isVi).replace("{0}", code.toString()),
        }) + "\n");
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
        res.write(jsonUtils.safeStringify({
          success: true,
          message: getBackendMsg("ULTRA_SUCCESS", isVi),
        }) + "\n");
      } catch (fsErr: any) {
        logger.error(`File copy/rename/update failed: ${fsErr.message}`);
        res.write(jsonUtils.safeStringify({
          success: false,
          error: fsErr.message,
        }) + "\n");
      }
      res.end();
    });
  } catch (err: any) {
    try {
      if (fs.existsSync(optsJsonPath)) fs.unlinkSync(optsJsonPath);
    } catch (cleanupErr) { }
    try {
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanupErr) { }
    logger.error(getBackendMsg("ULTRA_UNEXPECTED_ERR", isVi).replace("{0}", err.message));
    res.write(jsonUtils.safeStringify({
      success: false,
      error: err.message,
    }) + "\n");
    res.end();
  }
});

router.post("/select-file", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
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

    const scenes = _.get(project, 'storyboard', []);
    const voiceUrl = _.get(project, 'voiceConfig.audioUrl');
    const sceneAssetPaths = _.map(scenes, scene => resolveLocalProjectAssetPath(_.toString(scene.assetUrl)));
    if (_.isEmpty(scenes) || _.some(scenes, (scene, index) => (
      scene.assetStatus !== SceneAssetStatus.Approved || _.isEmpty(sceneAssetPaths[index])
    ))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_SCENE_ASSETS_REQUIRED });
    }
    const fullAudioPath = resolveLocalProjectAssetPath(_.toString(voiceUrl));
    if (!fullAudioPath) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_VOICE_REQUIRED });
    }
    const approvedCover = _.find(project.thumbnails, thumbnail => (
      !_.isEmpty(thumbnail.imageUrl)
      && (thumbnail.approved || _.includes([AssetAcceptance.Approved, AssetAcceptance.AcceptedWithWarning], thumbnail.acceptance))
    ));
    const coverPath = resolveLocalProjectAssetPath(_.toString(approvedCover?.imageUrl));
    if (!coverPath) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: EXPORT_ZIP_CONFIG.ERR_COVER_REQUIRED });
    }

    if (!_.isEmpty(scenes)) {
      const voicesDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, EXPORT_ZIP_CONFIG.VOICES_DIR);

      if (!fs.existsSync(voicesDir)) {
        fs.mkdirSync(voicesDir, { recursive: true });
      }

      const cutAudioSegment = (src: string, dest: string, start: number, end: number): Promise<void> => (
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
        })
      );

      for (const sc of scenes) {
        const startVal = _.get(sc, '_start');
        const endVal = _.get(sc, '_end');
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
        const relativePath = _.startsWith(sc.audioUrl, '/') ? sc.audioUrl.slice(1) : sc.audioUrl;
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
      if (parts.length === 3) {
        secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      } else if (parts.length === 1) {
        secs = parseFloat(parts[0]);
      }
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
      return {
        id: sc.id,
        start,
        end,
        duration: actualDuration,
        cameraMotion: sc.cameraMotion,
        transition: sc.transition,
        subtitle: sc.subtitle || sc.script || "",
      };
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
    writeDraftFile(CAPCUT_CONFIG.ATTACHMENT_PC_COMMON_FILENAME, jsonUtils.safeStringify({ device_id: CAPCUT_CONFIG.DEVICE_ID, client_version: CAPCUT_CONFIG.CLIENT_VERSION, system_info: CAPCUT_CONFIG.SYSTEM_INFO }, null, 2));
    writeDraftFile(CAPCUT_CONFIG.DRAFT_EXTRA_FILENAME, jsonUtils.safeStringify({ client_os: "win", author: CAPCUT_CONFIG.AUTHOR, sync_time: Math.floor(Date.now() / 1000) }, null, 2));
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
    if (error.message === "EXCEED_MAX_TEMPLATES") {
      errorMsg = isVi ? "Bạn chỉ được lưu tối đa 2 dự án mẫu. Vui lòng xoá bớt để thêm mới." : "Maximum 2 templates allowed. Please delete one to add a new template.";
    } else if (error.message === "INVALID_CAPCUT_TEMPLATE") {
      errorMsg = isVi ? "Thư mục bạn chọn không phải là dự án Capcut hợp lệ (Thiếu file draft_content.json)." : "The selected folder is not a valid Capcut project (Missing draft_content.json).";
    }
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
    if (updated) {
      res.json(updated);
    } else {
      res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: getBackendMsg("TEMPLATE_RENAME_NOT_FOUND", isVi) });
    }
  } catch (error: any) {
    logger.error(getBackendMsg("TEMPLATE_RENAME_FAILED", isVi), error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("TEMPLATE_RENAME_FAILED", isVi) });
  }
});

router.post(ROUTER_PATHS.REFERENCE_ASSETS, async (req: Request, res: Response) => {
  const projectId=path.basename(_.toString(req.params.projectId));const group=_.toString(req.params.group);const allowed=_.values(REFERENCE_ASSET_GROUP);
  if(!_.includes(allowed,group)||_.isEmpty(projectId))return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({error:PROJECT_ASSET_INVALID_REQUEST});
  const directory=path.resolve(getDataDirectory(),ASSETS_DIR_NAME,PROJECTS_DIR_NAME,projectId,"references",group);const projectRoot=path.resolve(getDataDirectory(),ASSETS_DIR_NAME,PROJECTS_DIR_NAME,projectId);
  if(!_.startsWith(_.toLower(directory),_.toLower(_.join([projectRoot,path.sep],""))))return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({error:PROJECT_ASSET_INVALID_REQUEST});
  fs.mkdirSync(directory,{recursive:true});const assets:string[]=[];
  try{_.forEach(_.take(_.castArray(req.body?.images),10),(image,index)=>{const match=_.toString(image).match(REFACTOR_CONSTANTS.IMAGE_DATA_URL_CAPTURE_REGEX);if(!match){if(_.startsWith(_.toString(image),`/${ASSETS_DIR_NAME}/`))assets.push(_.toString(image));return}const extension=_.includes(match[1],"png")?"png":_.includes(match[1],"webp")?"webp":"jpg";const filename=`ref_${index+1}_${createHash("sha256").update(match[2]).digest("hex").slice(0,12)}.${extension}`;const filePath=path.join(directory,filename);if(!fs.existsSync(filePath))fs.writeFileSync(filePath,Buffer.from(match[2],"base64"));assets.push(`/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/references/${group}/${filename}`)});return res.json({success:true,assets})}catch(error:any){return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:error.message})}
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
  const allowedGroups = _.values(PROJECT_ASSET_GROUP);
  if (!_.includes(allowedGroups, group)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }

  const projectsRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
  const projectRoot = path.resolve(projectsRoot, projectId);
  const assetDirectory = path.resolve(projectRoot, group);
  if (!_.isEqual(path.dirname(projectRoot), projectsRoot) || !_.isEqual(path.dirname(assetDirectory), projectRoot)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  }

  try {
    const targetGroups = _.isEqual(group, PROJECT_ASSET_GROUP.VISUALS)
      ? [
        PROJECT_ASSET_GROUP.IMAGES,
        PROJECT_VISUAL_ASSET_CONFIG.THUMBNAILS_DIRECTORY,
        PROJECT_ASSET_GROUP.VIDEOS,
        path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER),
        path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.UPSCALED),
      ]
      : [group];
    _.forEach(targetGroups, targetGroup => {
      const targetDirectory = path.resolve(projectRoot, targetGroup);
      if (!_.startsWith(_.toLower(targetDirectory), _.toLower(`${projectRoot}${path.sep}`))) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
      fs.rmSync(targetDirectory, { recursive: true, force: true });
      if (!_.includes([
        path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER),
        path.join(PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.UPSCALED),
      ], targetGroup)) {
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

      if (changed) {
        await saveProjectDetailToDb(project);
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    logger.error(getBackendMsg("SQLITE_DELETE_ERR", true), error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("SQLITE_DELETE_ERR", true) });
  }
});

router.post("/ffmpeg-render", express.json({ limit: SecurityConstants.LIMIT_500MB }), requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const { scenes, globalAudioUrl, globalAudioBase64, quality, aspectRatio, projectId, subtitleMode, audioTracks } = req.body;
    const jobId = randomUUID();

    const licenseKey = (_.get(req.headers, SecurityConstants.HEADER_LICENSE_KEY) as string) || (_.get(requestContext.getStore(), SecurityConstants.STORE_LICENSE_KEY) as string);

    await renderQueueService.addJob(
      jobId,
      {
        scenes,
        globalAudioUrl,
        globalAudioBase64,
        quality: quality as VideoQuality,
        aspectRatio: aspectRatio as string,
        projectId: projectId as string,
        subtitleMode,
        audioTracks
      },
      licenseKey
    );

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
    error: job.error
  });
});

router.post(ROUTER_PATHS.REFERENCE_AUDIO, async (req: Request, res: Response) => {
  const projectId = path.basename(_.toString(req.params.projectId));
  const match = _.toString(req.body?.audio).match(REFACTOR_CONSTANTS.AUDIO_DATA_URL_CAPTURE_REGEX);
  if (_.isEmpty(projectId) || !match) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
  const directory = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, "references", REFERENCE_ASSET_GROUP.AUDIO);
  const projectRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId);
  if (!_.startsWith(_.toLower(directory), _.toLower(_.join([projectRoot, path.sep], "")))) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: PROJECT_ASSET_INVALID_REQUEST });
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
