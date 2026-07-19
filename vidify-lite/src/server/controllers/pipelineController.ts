import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import _ from 'lodash';

import { jsonUtils } from "../../lib/json.js";
import { generateContentWithRetry, isGeminiApiKeyAvailable } from "../services/geminiService.js";
import { checkCache, setCache } from "../services/cacheService.js";
import { getProjectDetailFromDb } from "../utils/db.js";
import JSZip from "jszip";
import { safeParseJSON, formatTime } from "../utils/helpers.js";
import { listTemplates, saveTemplate, deleteTemplate, renameTemplate } from "../utils/capcutTemplateManager.js";
import { PIPELINE_CONFIG } from "../../constants/config.js";

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
  getScriptSplitPrompt,
  getSceneDetailBatchPrompt,
  getDetailedPromptBuilderPrompt,
  getGlobalVisualBiblePrompt,
  getCharacterAnalysisPrompt,
  getCharacterExtractPrompt,
  getCharacterRewriteBatchPrompt,
  getCharacterRewriteThumbnailsBatchPrompt,
  STYLE_EXTRACTION_PROMPT,
  STICKMAN_STYLE_MODIFIERS,
  getMultiStepHookPrompt,
  getCombinedScriptPrompt,
  STICKMAN_KEYWORDS,
  MARKDOWN_REGEX,
  EMOJI_REGEX,
  REGEX_AUTO_MODE_PATH,
  LogEvent,
  ErrorMessage,
  getDummyHooks,
  getDummyScript,
  getDummyHookTitle,
  getDurationText,
  getDummySeoData,
  getThumbnailLayoutPrompt,
  getDummyThumbs,
  VOICE_PRESET_MAP,
  DEFAULT_AI33_API_KEY,
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
  DEFAULT_SCENE_TRANSITION,
  DEFAULT_SCENE_PROMPT_PREFIX,
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
  VISUAL_BIBLE_REFERENCE_PROMPT,
  getSeoOptimizationPrompt,
  THUMBNAIL_REFERENCE_PROMPT,
  THUMBNAIL_IMAGE_REFERENCE_PROMPT,
  FileEncoding,
  MimeType,
  TEMPLATE_TMP_CONTENT,
  FFMPEG_CONFIG,
} from "../../constants";

import { logger, getMessage, appLogStep, getBilingualMessage, appWarn, appLog } from "../../lib/logger.js";

import { generateImageWithPlaywright, generateBatchImagesWithGeminiChat, closeAllBatchPages } from "../services/imageGeneratorService.js";
import { requestContext } from "../utils/requestContext.js";

import { AspectRatio, ProjectLanguage } from "../../types.js";

import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import os from "os";
import { exec, spawn } from "child_process";
import { StepLogger } from "@/src/lib/stepLogger.js";
import { generateMockStoryboard, smartSplitSentences } from "@/src/lib/textProcessor.js";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "../utils/paths.js";
import { delayAsync } from "../../lib/shared-utils.js";

const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");
if (fs.existsSync(ffmpegBinary)) {
  ffmpeg.setFfmpegPath(ffmpegBinary);
}

const router = express.Router();

function parseBase64Image(imgBase64: string): { data: string; mimeType: string } {
  let base64Data = imgBase64;
  let mimeType = CONTENT_TYPES.JPEG || "image/jpeg"; 

  if (imgBase64.startsWith("data:")) {
    const match = imgBase64.match(BASE64_DATA_URL_REGEX);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
  }
  return { data: base64Data, mimeType };
}

router.post("/extract-style", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { images } = req.body;
    if (!images || !_.isArray(images) || _.isEmpty(images)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const parts: any[] = [];
    for (const imgBase64 of images) {
      const { data, mimeType } = parseBase64Image(imgBase64);
      parts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    parts.push({
      text: STYLE_EXTRACTION_PROMPT,
    });

    const response = await generateContentWithRetry({
      contents: parts,
    });

    if (response && response.text) {
      let extracted = response.text.trim();

      const lower = extracted.toLowerCase();
      if (_.some(STICKMAN_KEYWORDS, (kw) => _.includes(lower, kw))) {
        extracted = STICKMAN_STYLE_MODIFIERS;
      }
      return res.json({ style: extracted });
    } else {
      throw new Error(getBackendMsg("STYLE_EXTRACTION_ERR", isVi));
    }
  } catch (error: any) {
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.STYLE_EXTRACTION_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("STYLE_EXTRACTION_ERR", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/rewrite-prompts", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, newStyle, aspectRatio } = req.body;
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
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
      const prompt = getStyleRewriteBatchPrompt(newStyle, jsonUtils.safeStringify(chunkItem), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, item.prompt);
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

router.post("/optimize-prompts", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, visualConfig, aspectRatio } = req.body;
  if (!storyboard || !_.isArray(storyboard)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ storyboard });
  }

  try {
    const scenesToOptimize = _.filter(
      _.map(storyboard, (s: any) => ({
        id: s.id,
        prompt: s.prompt || "",
        script: s.script || s.subtitle || "",
      })),
      (s: any) => s.prompt || s.script
    );

    if (_.isEmpty(scenesToOptimize)) {
      return res.json({ success: true, storyboard });
    }

    const visualStyle = visualConfig?.style || "Cinematic";
    const referenceStyle = visualConfig?.referencePrompt || "";
    const charactersJson = visualConfig?.characters && visualConfig.characters.length > 0 ? jsonUtils.safeStringify(visualConfig.characters) : undefined;

    const chunkSize = PIPELINE_CONFIG.BATCH_CHUNK_SIZE_OPTIMIZE;
    const chunks = _.chunk(scenesToOptimize, chunkSize);

    const optimizedMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunkItem = chunks[i];
      const prompt = getOptimizePromptsBatchPrompt(visualStyle, referenceStyle, jsonUtils.safeStringify(chunkItem), aspectRatio || AspectRatio.SixteenNine, charactersJson);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              optimizedMap.set(item.id, item.prompt);
            }
          }
        }
      } catch (err) {
        logger.error(LogEvent.BATCH_PROMPT_OPTIMIZE_FAILED_CHUNK, err);
      }

      if (i < chunks.length - 1) {
        await delayAsync(PIPELINE_CONFIG.DELAY_LONG_CHUNKS_MS);
      }
    }

    const updatedStoryboard = _.map(storyboard, (scene: any) => {
      const optimized = optimizedMap.get(scene.id);
      if (optimized) {
        return { ...scene, prompt: optimized };
      }
      return {
        ...scene,
        prompt: scene.prompt || "",
      };
    });

    res.json({ success: true, storyboard: updatedStoryboard });
  } catch (error: any) {
    logger.error(LogEvent.OPTIMIZE_PROMPTS_ERROR, error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post("/rewrite-thumbnails", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { thumbnails, newStyle, aspectRatio } = req.body;
  if (!thumbnails || !_.isArray(thumbnails)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ thumbnails });
  }

  try {
    const thumbsToRewrite = _.filter(thumbnails, (t: any) => t.prompt);
    const updatedThumbnails = _.map(thumbnails, (t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const prompt = getStyleRewriteBatchPrompt(newStyle, jsonUtils.safeStringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, item.prompt);
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
router.post("/rewrite-thumbnails-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { thumbnails, characters, aspectRatio } = req.body;
  if (!thumbnails || !_.isArray(thumbnails)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }

  let finalCharacters = characters;
  if (!finalCharacters || !_.isArray(finalCharacters) || _.isEmpty(finalCharacters)) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("CHARACTER_PROMPT_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ thumbnails });
  }

  try {
    const thumbsToRewrite = _.filter(thumbnails, (t: any) => t.prompt);
    const updatedThumbnails = _.map(thumbnails, (t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const prompt = getCharacterRewriteThumbnailsBatchPrompt(jsonUtils.safeStringify(finalCharacters), jsonUtils.safeStringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && item.prompt) {
              rewrittenMap.set(item.id, item.prompt);
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
router.post("/analyze-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("SCRIPT_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const prompt = getCharacterAnalysisPrompt(script);

    const response = await generateContentWithRetry({
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = safeParseJSON(response.text, []);
    const characters = _.take(_.isArray(parsed) ? parsed : [], 3);
    return res.json({ characters });
  } catch (error: any) {
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.CHARACTER_ANALYSIS_ERROR, error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: error.message || getBackendMsg("CHARACTER_ANALYZE_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/extract-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { images, characterDescription } = req.body;
    if (!images || !_.isArray(images) || _.isEmpty(images)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
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

router.post("/rewrite-prompts-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, characterPrompt, characters, aspectRatio } = req.body;
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

  if (!isGeminiApiKeyAvailable()) {
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

    const chunkSize = 25;
    const chunks = _.chunk(scenesToRewrite, chunkSize);

    const rewrittenMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunkItem = chunks[i];
      const prompt = getCharacterRewriteBatchPrompt(jsonUtils.safeStringify(finalCharacters), jsonUtils.safeStringify(chunkItem), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (_.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.prompt) {
              rewrittenMap.set(item.id, item.prompt);
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

router.post("/hooks", async (req: Request, res: Response) => {
  const { originalInput, config = {}, hookType, duration, count, language, bypassCache } = req.body;

  const cached = checkCache(API_ROUTES.PIPELINE_HOOKS, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({
      versions: getDummyHooks(language === ProjectLanguage.VI, false, hookType),
    });
  }

  const multiStepLogs: string[] = [];
  const isVi = language === ProjectLanguage.VI || config?.language === ProjectLanguage.VI;
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
      versions = _.map(versions, (v: any, idx: number) => ({
        id: v.id || `hk_${idx + 1}`,
        content: v.content || "",
        type: v.type || hookType || "StyleName",
        selected: idx === 0,
      }));
    }

    logStep(getPipelineLog("HOOK_STEP3_DONE", isVi));
    const output = { versions, rotationLogs: multiStepLogs };
    setCache(API_ROUTES.PIPELINE_HOOKS, req.body, output);
    res.json(output);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_HOOKS, error);
    const isVi = language === ProjectLanguage.VI || config?.language === ProjectLanguage.VI;
    const errorLogs = error.rotationLogs ? [...multiStepLogs, ...error.rotationLogs] : multiStepLogs;
    res.json({
      warning: error.message || BACKEND_MESSAGES.API_RATE_LIMITS_TRIGGERED,
      rotationLogs: errorLogs,
      versions: getDummyHooks(isVi, true, hookType),
    });
  }
});

router.post("/script", async (req: Request, res: Response) => {
  const { originalInput, config = {}, selectedHookText, bypassCache } = req.body;

  const cached = checkCache(API_ROUTES.PIPELINE_SCRIPT, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  if (!isGeminiApiKeyAvailable()) {
    const isVi = config.language === ProjectLanguage.VI;
    let fallbackHook = selectedHookText || "";
    if (!fallbackHook && config.hookConfig) {
      const type = config.hookConfig.type || "Auto";
      fallbackHook = getDummyHookTitle(isVi, type, false);
    }
    return res.json({
      ...getDummyScript(isVi, fallbackHook, config, false),
    });
  }

  let activeHookText = selectedHookText || "";

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
    const logStep = (msg: string) => {
      appLogStep(msg, multiStepLogs);
    };

    activeHookText = selectedHookText || "";
    if (!activeHookText && config.hookConfig) {
      logStep(getPipelineLog("HOOK_AUTO_GENERATE", isVi));
      try {
        const hookType = config.hookConfig.type || "Auto";
        const hookDuration = config.hookConfig.duration || 10;
        const hookPrompt = getMultiStepHookPrompt(originalInput, config.genre || "Storytelling", hookType, hookDuration, isVi ? "vi" : "en", 1);
        const hookResponse = await generateContentWithRetry({
          contents: hookPrompt,
          config: { responseMimeType: "application/json" },
        });
        const hookResult = safeParseJSON(hookResponse.text, { versions: [] });
        if (hookResult.versions && hookResult.versions.length > 0) {
          activeHookText = hookResult.versions[0].content || "";
          logStep(`${getPipelineLog("HOOK_EMBEDDED", isVi)}"${activeHookText}"`);
        }
      } catch (hookErr: any) {
        logger.error(LogEvent.AUTO_HOOK_GENERATION_FAILED_FALLING_BACK, hookErr);
      }
    }

    logStep(getPipelineLog("SCRIPT_STEP1", isVi));

    const targetChapterCount = _.max([3, _.floor(targetWordCountMin / 100)]) || 3;

    const combinedScriptPrompt = getCombinedScriptPrompt(originalInput, durationText, targetWordCount, config.genre, config.writingStyle, isVi, activeHookText, genreGuideline, styleGuideline, audienceGuideline, targetChapterCount, config.hookConfig);

    const combinedResponse = await generateContentWithRetry({
      contents: combinedScriptPrompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });

    const scriptResult = safeParseJSON(combinedResponse.text, {
      theme: "",
      characterSpecs: "",
      preferredTerms: [],
      factCheckNotes: "",
      chapters: [],
    });

    logStep(`${getPipelineLog("SCRIPT_STEP1_DONE", isVi)} ${(scriptResult.preferredTerms || []).join(", ") || "None"}. Spec: ${scriptResult.characterSpecs || "No character reference needed."}`);
    if (combinedResponse.rotationLogs) multiStepLogs.push(...combinedResponse.rotationLogs);

    logStep(getPipelineLog("SCRIPT_STEP2A", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2A_DONE", isVi)} ${(scriptResult.chapters || []).length} chapters.`);

    logStep(getPipelineLog("SCRIPT_STEP2B", isVi));
    logStep(`${getPipelineLog("SCRIPT_STEP2B_DONE", isVi)} ${(scriptResult.chapters || []).length}.`);

    logStep(getPipelineLog("SCRIPT_STEP3", isVi));
    const completedChapters: any[] = [];
    let fullScript = activeHookText ? activeHookText + "\n\n" : "";

    const chapters = scriptResult.chapters || [];
    const chapterWordTarget = _.ceil(targetWordCount / (_.max([1, chapters.length]) || 1));

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
        splitStrategy
      );

      const chapterResponse = await generateContentWithRetry({
        contents: `Original Context:\n${originalInput}\n\nConcept Sheet:\n${jsonUtils.safeStringify(scriptResult)}\n\nChapter Prompt:\n${chapterPrompt}`,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
        },
      });

      const chapterData = safeParseJSON(chapterResponse.text, {
        scriptSegment: "",
      });

      let cleanedSegment = chapterData.scriptSegment || "";
      cleanedSegment = cleanedSegment.replace(MARKDOWN_REGEX, "").replace(EMOJI_REGEX, "");

      completedChapters.push({
        id: chapter.id || `ch_${i + 1}`,
        title: chapter.title,
        scriptSegment: cleanedSegment,
      });

      fullScript += cleanedSegment + "\n\n";
      if (chapterResponse.rotationLogs) multiStepLogs.push(...chapterResponse.rotationLogs);
    }

    logStep(getPipelineLog("SCRIPT_STEP4", isVi));
    logStep(getPipelineLog("SCRIPT_STEP4_DONE", isVi));

    const finalCleanScript = fullScript.trim();

    const parsedData = {
      rewrittenScript: finalCleanScript,
      factCheckNotes: scriptResult.factCheckNotes || "✓ Verified: Content is consistent.",
      chapters: completedChapters,
      rotationLogs: multiStepLogs,
    };
    setCache(API_ROUTES.PIPELINE_SCRIPT, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_REWRITING_SCRIPT, error);
    const isVi = config?.language === ProjectLanguage.VI;
    let finalHook = activeHookText || selectedHookText || "";
    if (!finalHook && config?.hookConfig) {
      const type = config.hookConfig.type || "Auto";
      finalHook = getDummyHookTitle(isVi, type, true);
    }
    res.json({
      warning: error.message || BACKEND_MESSAGES.API_RATE_LIMITS_TRIGGERED,
      ...getDummyScript(isVi, finalHook, config, true),
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

  for (let i = 1; i < scenes.length; i++) {
    const currentPrompt = scenes[i].prompt?.trim();
    const prevPrompt = scenes[i - 1].prompt?.trim();

    if (currentPrompt && prevPrompt) {
      const normCurrent = currentPrompt.toLowerCase().replace(ALPHANUMERIC_ONLY_REGEX, "");
      const normPrev = prevPrompt.toLowerCase().replace(ALPHANUMERIC_ONLY_REGEX, "");

      if (normCurrent === normPrev) {
        const selectedAngle = cameraAngles[i % cameraAngles.length];
        const borderlessKeyword = BORDERLESS_KEYWORD;
        const lowerPrompt = currentPrompt.toLowerCase();

        if (_.includes(lowerPrompt, borderlessKeyword)) {
          const index = lowerPrompt.lastIndexOf(borderlessKeyword);
          const basePart = currentPrompt.substring(0, index).trim().replace(/,+$/, "");
          const endPart = currentPrompt.substring(index);
          scenes[i].prompt = `${basePart}, alternate camera shot: ${selectedAngle}, distinct scene progression, ${endPart}`;
        } else {
          scenes[i].prompt = `${currentPrompt}, alternate camera shot: ${selectedAngle}, distinct scene progression`;
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

router.post("/storyboard", async (req: Request, res: Response) => {
  const { rewrittenScript, chapters, config = {}, visualStyle, referenceStyle, referenceCharacter, referenceCharacters, referenceImages, visualDensity, bypassCache, voiceDuration } = req.body;

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
  const density = visualDensity || 5;
  const splitStrategy = config?.splitStrategy || SplitStrategy.LONG_SENTENCE;

  let chosenDuration = voiceDuration;
  if (!chosenDuration) {
    const wordCount = _.filter((rewrittenScript || "").split(/\s+/), Boolean).length;
    const speed = config?.speed || 1.0;
    chosenDuration = Math.round(wordCount / 2.5 / speed);
    if (chosenDuration < 10) chosenDuration = 10;
  }

  let activeStyle = referenceStyle || "";
  if (!activeStyle && visualStyle && stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords]) {
    activeStyle = stylePresetsKeywords[visualStyle as keyof typeof stylePresetsKeywords];
  }

  const cached = checkCache(API_ROUTES.PIPELINE_STORYBOARD, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json(generateMockStoryboard(rewrittenScript, syncedChapters, isVi, activeStyle || visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine));
  }

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
      for (const imgBase64 of referenceImages.slice(0, 3)) {
        const { data, mimeType } = parseBase64Image(imgBase64);
        bibleParts.push({
          inlineData: {
            data,
            mimeType,
          },
        });
      }
    }

    bibleParts.push({
      text: visualBiblePrompt + (referenceImages && (!_.isEmpty(referenceImages)) ? VISUAL_BIBLE_REFERENCE_PROMPT : ""),
    });

    const bibleResponse = await generateContentWithRetry({
      contents: bibleParts,
      config: { responseMimeType: "application/json" },
    });
    const visualBible = safeParseJSON(bibleResponse.text, {
      colorPalette: "",
      characterSpecs: "",
      landscapeSpecs: "",
      lightingMood: "",
    });
    logStoryboardStep(`${getPipelineLog("STORY_STEP1_DONE", isVi)} ${visualBible.colorPalette}. Character Spec: ${visualBible.characterSpecs}. Landscape Spec: ${visualBible.landscapeSpecs}`);
    if (bibleResponse.rotationLogs) storyboardLogs.push(...bibleResponse.rotationLogs);

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
        appWarn("STORYBOARD_GEMINI_SPLIT_FALLBACK");
        logStoryboardStep(getBilingualMessage("STORYBOARD_GEMINI_SPLIT_FALLBACK"));
        const fallbackRes = generateMockStoryboard(
          rewrittenScript,
          syncedChapters,
          isVi,
          activeStyle || visualStyle,
          density,
          chosenDuration,
          splitStrategy,
          config?.aspectRatio || AspectRatio.SixteenNine
        );
        splitScenes = fallbackRes.scenes || [];
      } else {
        splitScenes = _.map(splitScenes, (scene: any, idx: number) => ({
          ...scene,
          id: `sc_${idx + 1}`,
          script: scene.script || scene.subtitle || "",
          subtitle: scene.subtitle || scene.script || "",
        }));
      }

      logStoryboardStep(getBilingualMessage("STORYBOARD_GENERATING_DETAILS_BATCH", splitScenes.length));

      const batchSize = 8;
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
          config?.aspectRatio || AspectRatio.SixteenNine
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
          await delayAsync(1500);
        }
      }

      allScenes = _.map(splitScenes, (scene: any) => {
        const details = detailedScenesMap.get(scene.id) || {};
        return {
          ...scene,
          prompt: details.prompt || `${DEFAULT_SCENE_PROMPT_PREFIX}${scene.script}. --ar ${config?.aspectRatio || AspectRatio.SixteenNine}`,
          cameraMotion: details.cameraMotion || DEFAULT_SCENE_CAMERA_MOTION,
          effects: details.effects || DEFAULT_SCENE_EFFECTS,
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
    let data: any = { scenes: allScenes, rotationLogs: storyboardLogs };

    if (!data || !data.scenes || _.isEmpty(data.scenes)) {
      appWarn("STORYBOARD_GEMINI_SPLIT_FALLBACK");
      const oldLogs = data?.rotationLogs;
      data = generateMockStoryboard(rewrittenScript, syncedChapters, isVi, activeStyle || visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine);
      if (oldLogs) data.rotationLogs = oldLogs;
    }

    if (data?.scenes?.length) {
      data.scenes = diversifyDuplicatePrompts(data.scenes);
    }

    if (chosenDuration && data.scenes && data.scenes.length > 0) {
      const scenes = data.scenes;
      const wordCounts = _.map(scenes, (s: any) => _.filter((s.script || "").split(/\s+/), Boolean).length);
      const totalWords = _.reduce(wordCounts, (a: number, b: number) => a + b, 0);

      let currentSecs = 0;
      for (let i = 0; i < scenes.length; i++) {
        const wCount = wordCounts[i];
        let duration = 3;
        if (totalWords > 0) {
          duration = Math.round((wCount / totalWords) * chosenDuration);
          if (duration < 3) duration = 3;
        }
        if (i === scenes.length - 1) {
          duration = Math.max(3, chosenDuration - currentSecs);
        }

        const startSecs = currentSecs;
        const endSecs = currentSecs + duration;
        currentSecs = endSecs;

        scenes[i].duration = duration;
        scenes[i].startTime = formatTime(startSecs);
        scenes[i].endTime = formatTime(endSecs);
      }
    }

    setCache(API_ROUTES.PIPELINE_STORYBOARD, req.body, data);
    res.json(data);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_STORYBOARD_GEMINI, error);

    const fallbackData: any = generateMockStoryboard(rewrittenScript, syncedChapters, isVi, activeStyle || visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine);
    if (fallbackData?.scenes?.length) {
      fallbackData.scenes = diversifyDuplicatePrompts(fallbackData.scenes);
    }
    if (error.rotationLogs) {
      fallbackData.rotationLogs = error.rotationLogs;
    }
    res.json(fallbackData);
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

  if (!isGeminiApiKeyAvailable()) {
    return res.json({
      ...getDummySeoData(config?.language === ProjectLanguage.VI, false),
    });
  }

  const seoLogger = new StepLogger();
  const seoLogs = seoLogger.getLogs();
  const logSeoStep = (msg: string) => seoLogger.log(msg);

  try {
    const isVi = config.language === ProjectLanguage.VI;

    logSeoStep(PIPELINE_LOGS.SEO_STEP1);

    const combinedSeoPrompt = getSeoOptimizationPrompt(rewrittenScript, isVi, numTitles, numDescriptions, numHashtags, numTags);

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
    const isVi = config?.language === ProjectLanguage.VI;
    res.json({
      warning: error.message || BACKEND_MESSAGES.API_RATE_LIMITS_TRIGGERED,
      ...getDummySeoData(isVi, true),
    });
  }
});

router.post("/thumbnails", async (req: Request, res: Response) => {
  const { rewrittenScript, config = {}, visualConfig = {}, bypassCache } = req.body;

  const cached = checkCache(API_ROUTES.PIPELINE_THUMBNAILS, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const thumbnailCount = visualConfig.thumbnailCount || 2;
  const refImageStr = visualConfig.thumbnailReferencePrompt || visualConfig.thumbnailReferenceImage ? THUMBNAIL_REFERENCE_PROMPT(visualConfig.thumbnailReferencePrompt || visualConfig.thumbnailReferenceImage) : "";

  if (!isGeminiApiKeyAvailable()) {
    const dummyThumbs = getDummyThumbs(config.language === ProjectLanguage.VI, false);
    return res.json({
      thumbnails: Array.from({ length: thumbnailCount }).map((_, i) => ({
        ...dummyThumbs[i % dummyThumbs.length],
        id: `th_${i}`,
      })),
    });
  }

  const thumbLogger = new StepLogger();
  const thumbLogs = thumbLogger.getLogs();
  const logThumbStep = (msg: string) => thumbLogger.log(msg);

  try {
    const isVi = config.language === ProjectLanguage.VI;

    logThumbStep(PIPELINE_LOGS.THUMB_STEP1);

    const combinedThumbnailsPrompt = getThumbnailLayoutPrompt(rewrittenScript, thumbnailCount, refImageStr, isVi, visualConfig.aspectRatio || "16:9");

    const thumbParts: any[] = [];
    if (visualConfig.thumbnailReferenceImages && _.isArray(visualConfig.thumbnailReferenceImages) && visualConfig.thumbnailReferenceImages.length > 0) {
      for (const imgBase64 of visualConfig.thumbnailReferenceImages.slice(0, 3)) {
        const { data, mimeType } = parseBase64Image(imgBase64);
        thumbParts.push({
          inlineData: {
            data,
            mimeType,
          },
        });
      }
    }

    thumbParts.push({
      text:
        combinedThumbnailsPrompt +
        (visualConfig.thumbnailReferenceImages && visualConfig.thumbnailReferenceImages.length > 0 ? THUMBNAIL_IMAGE_REFERENCE_PROMPT : ""),
    });

    const combinedResponse = await generateContentWithRetry({
      contents: thumbParts,
      config: { responseMimeType: "application/json" },
    });

    const thumbsResult = safeParseJSON(combinedResponse.text, {
      concepts: [],
      thumbnails: [],
    });

    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP1_DONE} ${(thumbsResult.concepts || []).length || 0} layouts.`);
    if (combinedResponse.rotationLogs) thumbLogs.push(...combinedResponse.rotationLogs);

    logThumbStep(PIPELINE_LOGS.THUMB_STEP2);
    logThumbStep(`${PIPELINE_LOGS.THUMB_STEP2_DONE} ${(thumbsResult.thumbnails || []).length || 0} thumbnails.`);

    logThumbStep(PIPELINE_LOGS.THUMB_STEP3);
    logThumbStep(PIPELINE_LOGS.THUMB_DONE_ALL);

    const parsedData = {
      thumbnails: thumbsResult.thumbnails || [],
      rotationLogs: thumbLogs,
    };

    setCache(API_ROUTES.PIPELINE_THUMBNAILS, req.body, parsedData);
    res.json(parsedData);
  } catch (error: any) {
    logger.error(LogEvent.ERROR_GENERATING_THUMBNAILS_PROMPTS, error);
    const isVi = config?.language === ProjectLanguage.VI;
    res.json({
      warning: error.message || BACKEND_MESSAGES.API_RATE_LIMITS_TRIGGERED,
      thumbnails: getDummyThumbs(isVi, true),
    });
  }
});

router.post("/voice", async (req: Request, res: Response) => {
  try {
    let { text, speed, voice_id, voiceURI } = req.body;
    let finalVoiceId = voice_id || voiceURI;

    if (finalVoiceId && VOICE_PRESET_MAP[finalVoiceId]) {
      finalVoiceId = VOICE_PRESET_MAP[finalVoiceId];
    }

    if (!text || !text.trim()) {
      text = BACKEND_MESSAGES.TTS_DEFAULT_TEST;
    }

    if (!finalVoiceId) {
      finalVoiceId = VOICE_PRESET_MAP["preset-vi-bac-female"] || "edge_vi-VN-HoaiMyNeural";
    }

    const store = requestContext.getStore();
    const apiKey = store?.ai33Key || process.env.AI33_API_KEY || DEFAULT_AI33_API_KEY;

    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice_id", finalVoiceId);
    formData.append("speed", (speed || 1).toString());
    formData.append("with_transcript", "false");

    appLog(`${BACKEND_MESSAGES.TTS_START}${finalVoiceId}`);
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
    appLog(`${BACKEND_MESSAGES.TTS_TASK_ID}${taskId}${BACKEND_MESSAGES.TTS_POLLING}`);

    let audioUrl = null;
    let attempts = 0;
    while (attempts < TTS_POLLING_CONFIG.MAX_ATTEMPTS) {
      await delayAsync(TTS_POLLING_CONFIG.INTERVAL_MS);
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
        continue;
      }

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        if (_.includes([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN], pollRes.status)) {
          throw new Error(getMessage("TTS_POLL_FAILED", undefined, errText));
        }
        logger.warn(getMessage("TTS_POLLING_FAILED_RETRYING", undefined, `${pollRes.status} - ${errText}`));
        attempts++;
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
    }

    if (!audioUrl) {
      throw new Error(getMessage("TTS_TASK_TIMED_OUT"));
    }

    appLog(`${BACKEND_MESSAGES.TTS_COMPLETE}${audioUrl}`);
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(getMessage("FAILED_DOWNLOAD_AUDIO"));

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString(FileEncoding.BASE64 as any);
    const mimeType = audioRes.headers.get("content-type") || MimeType.MPEG;

    res.json({
      success: true,
      audioBase64,
      mimeType,
      audioUrl,
      provider: "AI33",
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
router.post("/generate-image", async (req: Request, res: Response) => {
  try {
    const { prompt, style, bypassCache, visualConfig, sandboxConfig } = req.body;

    const cached = checkCache(API_ROUTES.PIPELINE_GENERATE_IMAGE, req.body, bypassCache);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const result = await generateImageWithPlaywright({
      prompt,
      style,
      visualConfig,
      sandboxConfig,
    });

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

router.post("/generate-batch-images", async (req: Request, res: Response) => {
  try {
    const { items, visualConfig, style } = req.body;

    if (!items || !_.isArray(items) || _.isEmpty(items)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: BACKEND_MESSAGES.BATCH_GEN_NO_ITEMS });
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    await generateBatchImagesWithGeminiChat(items, visualConfig, style, (progressResult) => {
      res.write(jsonUtils.safeStringify(progressResult) + "\n");
    });

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

router.post("/clean-batch-images", async (req: Request, res: Response) => {
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

router.post("/align-voice", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { audioBase64, scenes, segment, projectId } = req.body;
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

    const audioBuffer = Buffer.from(audioBase64, "base64");
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

        exec(installCmd, (installError, installStdout, installStderr) => {
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

    const runAligner = () => {
      const pyCmd = getPythonCommand();
      let cmd = `"${pyCmd}" "${scriptPath}" "${audioPath}" "${scenesPath}" "${outputPath}"`;
      if (segment && projectId) {
        const outputDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, ALIGN_CONFIG.VOICES_DIR);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const urlPrefix = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/${ALIGN_CONFIG.VOICES_DIR}`;
        cmd += ` "${outputDir}" "${urlPrefix}"`;
      }
      logger.log(`Running voice aligner command: ${cmd}`);

      exec(cmd, (error, stdout, stderr) => {
        try {
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          if (fs.existsSync(scenesPath)) fs.unlinkSync(scenesPath);
        } catch (err) {
          logger.error(VOICE_ALIGN_LOGS.ERR_DELETE_TEMP_FILES, err);
        }

        if (error) {
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
          if (!result) throw new Error("JSON Parse failed");

          fs.unlinkSync(outputPath);

          return res.json(result);
        } catch (err: any) {
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
    const safeFilePath = filePath || "AUTO_MODE_PLACEHOLDER";
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

  exec(cmd, (error, stdout, stderr) => {
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

  exec(cmd, (error, stdout, stderr) => {
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

    if (!_.isEmpty(voiceUrl) && !_.isEmpty(scenes)) {
      const relativeAudioPath = _.startsWith(voiceUrl, '/') ? voiceUrl.slice(1) : voiceUrl;
      const fullAudioPath = path.join(getDataDirectory(), relativeAudioPath);
      const voicesDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, projectId, EXPORT_ZIP_CONFIG.VOICES_DIR);

      if (!fs.existsSync(voicesDir)) {
        fs.mkdirSync(voicesDir, { recursive: true });
      }

      if (fs.existsSync(fullAudioPath)) {
        const cutAudioSegment = (src: string, dest: string, start: number, end: number): Promise<void> => {
          return new Promise((resolve) => {
            const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");
            const ffmpegCmd = fs.existsSync(ffmpegBinary) ? `"${ffmpegBinary}"` : "ffmpeg";
            const cmd = `${ffmpegCmd} -y -ss ${start} -to ${end} -i "${src}" "${dest}"`;
            exec(cmd, (err) => {
              if (err) {
                logger.error(`Error cutting segment for ZIP: ${cmd}`, err);
              }
              resolve();
            });
          });
        };

        for (const sc of scenes) {
          const startVal = _.get(sc, '_start');
          const endVal = _.get(sc, '_end');
          if (!_.isNil(startVal) && !_.isNil(endVal)) {
            const outPath = path.join(voicesDir, `${EXPORT_ZIP_CONFIG.SCENE_PREFIX}${sc.id}${EXPORT_ZIP_CONFIG.WAV_EXT}`);
            sc.audioUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectId}/${EXPORT_ZIP_CONFIG.VOICES_DIR}/${EXPORT_ZIP_CONFIG.SCENE_PREFIX}${sc.id}${EXPORT_ZIP_CONFIG.WAV_EXT}`;
            await cutAudioSegment(fullAudioPath, outPath, _.toNumber(startVal), _.toNumber(endVal));
          }
        }
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

    zip.file(CAPCUT_CONFIG.COVER_FILENAME, CAPCUT_CONFIG.COVER_MOCK_CONTENT);
    zip.file(`${folderKey}/${CAPCUT_CONFIG.COVER_FILENAME}`, CAPCUT_CONFIG.COVER_MOCK_CONTENT);

    _.forEach(scenes, (sc, index) => {
      const filename = `${index + 1}_image.jpg`;
      if (sc.assetUrl) {
        const relativePath = _.startsWith(sc.assetUrl, '/') ? sc.assetUrl.slice(1) : sc.assetUrl;
        const fullPath = path.join(getDataDirectory(), relativePath);
        if (fs.existsSync(fullPath)) {
          const imgBuffer = fs.readFileSync(fullPath);
          zip.file(`${folderKey}/${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}/${filename}`, imgBuffer);
          zip.file(`${CAPCUT_CONFIG.RESOURCES_IMAGES_DIR}/${filename}`, imgBuffer);
          zip.file(`${folderKey}/Resources/voice_images/${filename}`, imgBuffer);
          zip.file(`Resources/voice_images/${filename}`, imgBuffer);
        }
      }
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

    if (voiceUrl) {
      const relativePath = _.startsWith(voiceUrl, '/') ? voiceUrl.slice(1) : voiceUrl;
      const fullPath = path.join(getDataDirectory(), relativePath);
      if (fs.existsSync(fullPath)) {
        const fullAudioBuffer = fs.readFileSync(fullPath);
        zip.file(`${folderKey}/${CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME}`, fullAudioBuffer);
        zip.file(CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME, fullAudioBuffer);
        zip.file(`${folderKey}/Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, fullAudioBuffer);
        zip.file(`Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, fullAudioBuffer);
      }
    } else {
      zip.file(`${folderKey}/${CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME}`, CAPCUT_CONFIG.AUDIO_NARRATION_MOCK_CONTENT);
      zip.file(CAPCUT_CONFIG.AUDIO_NARRATION_FILENAME, CAPCUT_CONFIG.AUDIO_NARRATION_MOCK_CONTENT);
      zip.file(`${folderKey}/Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, CAPCUT_CONFIG.AUDIO_NARRATION_MOCK_CONTENT);
      zip.file(`Resources/original_voices/${CAPCUT_CONFIG.ORIGINAL_VOICE_FILENAME}`, CAPCUT_CONFIG.AUDIO_NARRATION_MOCK_CONTENT);
    }

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

    writeDraftFile(CAPCUT_CONFIG.DRAFT_SETTINGS_FILENAME, jsonUtils.safeStringify({ project_setting: { fps: CAPCUT_CONFIG.FPS, ratio: CAPCUT_CONFIG.CANVAS_RATIO, width: CAPCUT_CONFIG.CANVAS_WIDTH, height: CAPCUT_CONFIG.CANVAS_HEIGHT }, export_setting: { resolution: CAPCUT_CONFIG.RESOLUTION, fps: CAPCUT_CONFIG.FPS, rate_control: CAPCUT_CONFIG.RATE_CONTROL, bit_rate: CAPCUT_CONFIG.BIT_RATE } }, null, 2));
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
    logger.error("Lỗi xuất CapCut ZIP ở server:", error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: error.message });
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

export default router;
