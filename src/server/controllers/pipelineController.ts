import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { generateContentWithRetry, isGeminiApiKeyAvailable } from "../services/geminiService.js";
import { checkCache, setCache } from "../services/cacheService.js";
import { safeParseJSON, formatTime } from "../utils/helpers.js";
import { generateScenesWithChunking, SceneDensity } from "../../utils/sceneGeneratorHelper.js";
import {
  EXTERNAL_URLS,
  ALIGN_CONFIG,
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
  getVideoDirectorSceneSplitPrompt,
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
} from "../../constants";

import { logger, getMessage, appLogStep } from "../../lib/logger.js";

import { generateImageWithPlaywright, generateBatchImagesWithGeminiChat, closeAllBatchPages } from "../services/imageGeneratorService.js";
import { requestContext } from "../utils/requestContext.js";

import { AspectRatio, ProjectLanguage } from "../../types.js";

import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import os from "os";
import { exec } from "child_process";
import { StepLogger } from "@/src/lib/stepLogger.js";
import { generateMockStoryboard } from "@/src/lib/textProcessor.js";

const router = express.Router();

router.post("/extract-style", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
      return res.status(500).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const parts: any[] = [];
    for (const imgBase64 of images) {
      let base64Data = imgBase64;
      let mimeType = "image/jpeg";

      if (imgBase64.startsWith("data:")) {
        const match = imgBase64.match(/^data:([^;]+);base64,(.+)$/);
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
      text: STYLE_EXTRACTION_PROMPT,
    });

    const response = await generateContentWithRetry({
      contents: parts,
    });

    if (response && response.text) {
      let extracted = response.text.trim();

      const lower = extracted.toLowerCase();
      if (STICKMAN_KEYWORDS.some((kw) => lower.includes(kw))) {
        extracted = STICKMAN_STYLE_MODIFIERS;
      }
      return res.json({ style: extracted });
    } else {
      throw new Error(getBackendMsg("STYLE_EXTRACTION_ERR", isVi));
    }
  } catch (error: any) {
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.STYLE_EXTRACTION_ERROR, error);
    return res.status(500).json({
      error: error.message || getBackendMsg("STYLE_EXTRACTION_ERR", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/rewrite-prompts", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, newStyle, aspectRatio } = req.body;
  if (!storyboard || !Array.isArray(storyboard)) {
    return res.status(400).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(400).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ storyboard });
  }

  try {
    const scenesToRewrite = storyboard
      .map((s: any) => ({
        id: s.id,
        prompt: s.prompt || s.script || "",
      }))
      .filter((s: any) => s.prompt);

    if (scenesToRewrite.length === 0) {
      return res.json({ success: true, storyboard });
    }

    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < scenesToRewrite.length; i += chunkSize) {
      chunks.push(scenesToRewrite.slice(i, i + chunkSize));
    }

    const rewrittenMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = getStyleRewriteBatchPrompt(newStyle, JSON.stringify(chunk), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (Array.isArray(parsed)) {
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
        await new Promise((res) => setTimeout(res, 1500));
      }
    }

    const updatedStoryboard = storyboard.map((scene: any) => {
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
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post("/optimize-prompts", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, visualConfig, aspectRatio } = req.body;
  if (!storyboard || !Array.isArray(storyboard)) {
    return res.status(400).json({ error: getBackendMsg("STORYBOARD_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ storyboard });
  }

  try {
    const scenesToOptimize = storyboard
      .map((s: any) => ({
        id: s.id,
        prompt: s.prompt || "",
        script: s.script || s.subtitle || "",
      }))
      .filter((s: any) => s.prompt || s.script);

    if (scenesToOptimize.length === 0) {
      return res.json({ success: true, storyboard });
    }

    const visualStyle = visualConfig?.style || "Cinematic";
    const referenceStyle = visualConfig?.referencePrompt || "";
    const charactersJson = visualConfig?.characters && visualConfig.characters.length > 0 ? JSON.stringify(visualConfig.characters) : undefined;

    const chunkSize = 8;
    const chunks = [];
    for (let i = 0; i < scenesToOptimize.length; i += chunkSize) {
      chunks.push(scenesToOptimize.slice(i, i + chunkSize));
    }

    const optimizedMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = getOptimizePromptsBatchPrompt(visualStyle, referenceStyle, JSON.stringify(chunk), aspectRatio || AspectRatio.SixteenNine, charactersJson);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (Array.isArray(parsed)) {
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
        await new Promise((res) => setTimeout(res, 3000));
      }
    }

    const updatedStoryboard = storyboard.map((scene: any) => {
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
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post("/rewrite-thumbnails", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { thumbnails, newStyle, aspectRatio } = req.body;
  if (!thumbnails || !Array.isArray(thumbnails)) {
    return res.status(400).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }
  if (!newStyle) {
    return res.status(400).json({ error: getBackendMsg("NEW_STYLE_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ thumbnails });
  }

  try {
    const thumbsToRewrite = thumbnails.filter((t: any) => t.prompt);
    const updatedThumbnails = thumbnails.map((t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const prompt = getStyleRewriteBatchPrompt(newStyle, JSON.stringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (Array.isArray(parsed)) {
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
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});
router.post("/rewrite-thumbnails-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { thumbnails, characters, aspectRatio } = req.body;
  if (!thumbnails || !Array.isArray(thumbnails)) {
    return res.status(400).json({ error: getBackendMsg("THUMBNAILS_REQUIRED", isVi) });
  }

  let finalCharacters = characters;
  if (!finalCharacters || !Array.isArray(finalCharacters) || finalCharacters.length === 0) {
    return res.status(400).json({ error: getBackendMsg("CHARACTER_PROMPT_REQUIRED", isVi) });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ thumbnails });
  }

  try {
    const thumbsToRewrite = thumbnails.filter((t: any) => t.prompt);
    const updatedThumbnails = thumbnails.map((t: any) => ({ ...t }));

    if (thumbsToRewrite.length > 0) {
      const rewrittenMap = new Map<string, string>();
      const prompt = getCharacterRewriteThumbnailsBatchPrompt(JSON.stringify(finalCharacters), JSON.stringify(thumbsToRewrite), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (Array.isArray(parsed)) {
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
    return res.status(500).json({ error: err.message });
  }
});
router.post("/analyze-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ error: getBackendMsg("SCRIPT_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
      return res.status(500).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const prompt = getCharacterAnalysisPrompt(script);

    const response = await generateContentWithRetry({
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = safeParseJSON(response.text, []);
    const characters = (Array.isArray(parsed) ? parsed : []).slice(0, 3);
    return res.json({ characters });
  } catch (error: any) {
    const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
    logger.error(LogEvent.CHARACTER_ANALYSIS_ERROR, error);
    return res.status(500).json({
      error: error.message || getBackendMsg("CHARACTER_ANALYZE_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/extract-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { images, characterDescription } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: getBackendMsg("IMAGES_REQUIRED", isVi) });
    }

    if (!isGeminiApiKeyAvailable()) {
      return res.status(500).json({ error: getBackendMsg("GEMINI_NOT_INIT", isVi) });
    }

    const parts: any[] = [];
    for (const imgBase64 of images) {
      let base64Data = imgBase64;
      let mimeType = "image/jpeg";

      if (imgBase64.startsWith("data:")) {
        const match = imgBase64.match(/^data:([^;]+);base64,(.+)$/);
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
    return res.status(500).json({
      error: error.message || getBackendMsg("CHARACTER_EXTRACT_FAIL", isVi),
      rotationLogs: error.rotationLogs,
    });
  }
});

router.post("/rewrite-prompts-character", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { storyboard, characterPrompt, characters, aspectRatio } = req.body;
  if (!storyboard || !Array.isArray(storyboard)) {
    return res.status(400).json({ error: getBackendMsg("STORYBOARD_INVALID", isVi) });
  }

  let finalCharacters = characters;
  if (!finalCharacters || !Array.isArray(finalCharacters) || finalCharacters.length === 0) {
    if (characterPrompt) {
      finalCharacters = [{ name: "Main Character", prompt: characterPrompt }];
    } else {
      return res.status(400).json({ error: getBackendMsg("CHARACTER_PROMPT_REQUIRED", isVi) });
    }
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json({ storyboard });
  }

  try {
    const scenesToRewrite = storyboard
      .map((s: any) => ({
        id: s.id,
        prompt: s.prompt || s.script || "",
      }))
      .filter((s) => s.prompt);

    if (scenesToRewrite.length === 0) {
      return res.json({ success: true, storyboard });
    }

    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < scenesToRewrite.length; i += chunkSize) {
      chunks.push(scenesToRewrite.slice(i, i + chunkSize));
    }

    const rewrittenMap = new Map<string, string>();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = getCharacterRewriteBatchPrompt(JSON.stringify(finalCharacters), JSON.stringify(chunk), aspectRatio || AspectRatio.SixteenNine);

      try {
        const response = await generateContentWithRetry({
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = safeParseJSON(response.text, []);
        if (Array.isArray(parsed)) {
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
        await new Promise((res) => setTimeout(res, 1500));
      }
    }

    const updatedStoryboard = storyboard.map((scene: any) => {
      const rewritten = rewrittenMap.get(scene.id);
      if (rewritten) {
        return { ...scene, prompt: rewritten };
      }
      if (scene.prompt) {
        const combinedPrompt = finalCharacters
          .map((c: any) => c.prompt)
          .filter(Boolean)
          .join(", ");
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
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
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
    if (Array.isArray(versions)) {
      versions = versions.map((v: any, idx: number) => ({
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

    const targetChapterCount = Math.max(3, Math.floor(targetWordCountMin / 100));

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
    const chapterWordTarget = Math.ceil(targetWordCount / Math.max(1, chapters.length));

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      logStep(`${getPipelineLog("SCRIPT_STEP3_PROGRESS", isVi)} ${i + 1}/${chapters.length}: ${chapter.title}...`);

      const chapterPrompt = getChapterWriterPrompt(chapter.title, chapter.description || "Write detailed story elements for this segment", config.genre, config.writingStyle, isVi, genreGuideline, styleGuideline, chapterWordTarget);

      const chapterResponse = await generateContentWithRetry({
        contents: `Original Context:\n${originalInput}\n\nConcept Sheet:\n${JSON.stringify(scriptResult)}\n\nChapter Prompt:\n${chapterPrompt}`,
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

function diversifyDuplicatePrompts(scenes: any[]): any[] {
  if (!scenes || scenes.length <= 1) return scenes;

  const cameraAngles = ["low-angle shot, looking up", "high-angle shot, looking down", "close-up portrait shot focusing on expression", "wide-angle panoramic view establishing the environment", "medium shot from side profile", "dramatic over-the-shoulder shot", "extreme close-up shot focusing on details", "three-quarter angle shot showing action"];

  for (let i = 1; i < scenes.length; i++) {
    const currentPrompt = scenes[i].prompt?.trim();
    const prevPrompt = scenes[i - 1].prompt?.trim();

    if (currentPrompt && prevPrompt) {
      const normCurrent = currentPrompt.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normPrev = prevPrompt.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (normCurrent === normPrev) {
        const selectedAngle = cameraAngles[i % cameraAngles.length];
        const borderlessKeyword = "borderless, no frame, no borders";
        const lowerPrompt = currentPrompt.toLowerCase();

        if (lowerPrompt.includes(borderlessKeyword)) {
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
    return res.status(400).json({ error: ErrorMessage.MISSING_SCENE_SCRIPT });
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
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
});

router.post("/storyboard", async (req: Request, res: Response) => {
  const { rewrittenScript, chapters, config = {}, visualStyle, referenceStyle, referenceCharacter, referenceCharacters, referenceImages, visualDensity, bypassCache, voiceDuration } = req.body;
  let characterRef: string | undefined = undefined;
  const rawRefChars = referenceCharacters || referenceCharacter;
  if (rawRefChars) {
    if (typeof rawRefChars === "string") {
      characterRef = rawRefChars.trim() || undefined;
    } else {
      characterRef = JSON.stringify(rawRefChars);
    }
  }
  const isVi = config?.language === ProjectLanguage.VI;
  const density = visualDensity || 5;
  const splitStrategy = config?.splitStrategy || "sentence";
  const customSplitRules = config?.customSplitRules || "";

  let chosenDuration = voiceDuration;
  if (!chosenDuration) {
    const wordCount = (rewrittenScript || "").split(/\s+/).filter(Boolean).length;
    const speed = config?.speed || 1.0;
    chosenDuration = Math.round(wordCount / 2.5 / speed);
    if (chosenDuration < 10) chosenDuration = 10;
  }

  const cached = checkCache(API_ROUTES.PIPELINE_STORYBOARD, req.body, bypassCache);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  if (!isGeminiApiKeyAvailable()) {
    return res.json(generateMockStoryboard(rewrittenScript, chapters, isVi, visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine));
  }

  try {
    let mappedDensity: SceneDensity = "CAU_DAI";
    if (splitStrategy === SplitStrategy.WORD || splitStrategy === SplitStrategy.ULTRADENSE) mappedDensity = "THEO_TU";
    else if (splitStrategy === SplitStrategy.SHORT_SENTENCE || splitStrategy === SplitStrategy.HYPERDENSE || splitStrategy === SplitStrategy.HIGHPACED) mappedDensity = "CAU_NGAN";
    else if (splitStrategy === SplitStrategy.MULTI_PROMPT) mappedDensity = "DA_PHAN_CANH";
    else if (splitStrategy === SplitStrategy.SENTENCE || splitStrategy === SplitStrategy.LONG_SENTENCE) mappedDensity = "CAU_DAI";
    else mappedDensity = "THEO_DOAN";

    const genre = config?.genre || VideoGenre.STORYTELLING;
    let genreVisualGuideline =
      GENRE_VISUAL_GUIDELINES[genre as VideoGenre] ||
      `CRITICAL VISUAL DIRECTIVE - ${genre.toUpperCase()} GENRE:
- Maintain context consistency and ensure the image details align with a ${genre} theme.`;

    const storyboardLogger = new StepLogger();
    const storyboardLogs = storyboardLogger.getLogs();
    const logStoryboardStep = (msg: string) => storyboardLogger.log(msg);

    logStoryboardStep(getPipelineLog("STORY_STEP1", isVi));
    const visualBiblePrompt = getGlobalVisualBiblePrompt(rewrittenScript, genre, visualStyle, referenceStyle, characterRef);

    const bibleParts: any[] = [];
    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const imgBase64 of referenceImages.slice(0, 3)) {
        let base64Data = imgBase64;
        let mimeType = "image/jpeg";

        if (imgBase64.startsWith("data:")) {
          const match = imgBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        bibleParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
    }

    bibleParts.push({
      text: visualBiblePrompt + (referenceImages && referenceImages.length > 0 ? "\n\nCRITICAL MULTIMODAL STYLE REFERENCE DIRECTIVE:\nWe have provided the actual style reference image(s) above. Inspect their color palette, textures, lighting, character details, and visual atmosphere. Incorporate these elements deeply into the character specs, color palette, and lighting mood you return." : ""),
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
      allScenes = await generateScenesWithChunking(rewrittenScript, mappedDensity, async (chunkText, targetPrompt, chunkIndex, totalChunks) => {
        let splitInstruction = ``;
        if (splitStrategy === SplitStrategy.ULTRADENSE || splitStrategy === SplitStrategy.WORD) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Divide the script into short scenes corresponding to spoken phrases or clauses. MANDATORY SEMANTIC INTEGRITY: Regardless of density, every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments, individual words, or tiny dangling phrases (e.g., do NOT output 'and then', 'she is', 'in the', 'however'). Each scene's narration must stand alone as a coherent statement so that the generated image perfectly matches the scene.`;
        } else if (splitStrategy === SplitStrategy.HYPERDENSE || splitStrategy === SplitStrategy.SHORT_SENTENCE) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Split the script into scene chunks corresponding to short sentences or complete clauses. MANDATORY SEMANTIC INTEGRITY: Every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments or tiny dangling phrases. The narration text for each scene must make complete grammatical and logical sense on its own.`;
        } else if (splitStrategy === SplitStrategy.MULTI_PROMPT) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: You MUST split the script by sentences. For each sentence, generate AT LEAST ONE scene and prompt. If a sentence is long, complex, contains multiple clauses, split the sentence into 2 to 3 separate sub-scenes, but ensure each sub-scene's narration is a grammatically complete, semantically meaningful clause with its own subject and verb. Never split a sentence into meaningless fragments.`;
        } else if (splitStrategy === SplitStrategy.HIGHPACED) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep a swift, modern pacing. Cut precisely at punctuation boundaries or complete short clause blocks. Every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence.`;
        } else if (splitStrategy === SplitStrategy.SENTENCE || splitStrategy === SplitStrategy.LONG_SENTENCE) {
          splitInstruction = `CRITICAL STYLING / SPLITTING MANDATE: To make the video exceptionally dynamic, engaging, and highly visual, you MUST split the script extremely finely. Every single sentence, spoken clause, or individual thought in the script MUST correspond to EXACTLY ONE scene. NEVER combine multiple sentences or long paragraphs into a single scene! Each scene must be approx 6-8 seconds. DO NOT summarize or skip any part of the script. MANDATORY: Never combine multiple sentences into a single scene. Combining sentences will ruin the pacing and rhythm.`;
        } else if (splitStrategy === SplitStrategy.DRAMATIC) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep a punchy, dramatic pacing of 8-10 seconds per scene. Focus heavily on suspenseful chapter transitions and key narrative beats.`;
        } else if (splitStrategy === SplitStrategy.PARAGRAPH) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Subdivide the script cleanly by entire paragraphs or main thoughts. Keep visual pacing slow and steady. Each scene will be longer (approx 10-15 seconds). Maintain absolute contextual continuity. DO NOT summarize or skip any part. MANDATORY: The visual design MUST strictly align with the exact content of that paragraph.`;
        } else if (splitStrategy === SplitStrategy.EPIC) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep an epic, wide pacing of 12-18 seconds per scene. Each scene corresponds to a grand chapter development or emotional crescendo.`;
        } else if (splitStrategy === SplitStrategy.CINEMATIC) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Subdivide by main cinematic segments (roughly 15-20 seconds each) to build deep visual atmospheric focus.`;
        } else if (splitStrategy === SplitStrategy.ARTISTIC) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep an artistic, poetic visual rhythm of 20-25 seconds per scene. Focus heavily on details and aesthetic continuity.`;
        } else if (splitStrategy === SplitStrategy.SLOWPACED) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Subdivide by slow-paced narrative blocks (roughly 25-30 seconds each) for documentary or storytelling.`;
        } else if (splitStrategy === SplitStrategy.SUPER_SLOW) {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep a super-slow, monumental pacing of over 30 seconds per scene. Ideal for slow atmospheric documentaries and deep-focus landscape layouts.`;
        } else {
          splitInstruction = `CRITICAL SPLITTING MANDATE: Keep an even, steady pacing. Cut scenes roughly every 5-8 seconds. DO NOT summarize or skip any part of the script.`;
        }

        const combinedInstruction = `${targetPrompt}\n\n${splitInstruction}`;
        const visualStyleCombined = `${visualStyle || "Cinematic"}. Visual Bible constraints: Color palette is ${visualBible.colorPalette}. Lighting mood: ${visualBible.lightingMood}`;
        const prompt = getVideoDirectorSceneSplitPrompt(chunkIndex, totalChunks, genre, genreVisualGuideline, combinedInstruction, visualStyleCombined, referenceStyle, customSplitRules, isVi, chunkText, JSON.stringify(chapters), characterRef, config?.aspectRatio || AspectRatio.SixteenNine, visualBible.characterSpecs, visualBible.landscapeSpecs);

        const response = await generateContentWithRetry({
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const data = safeParseJSON(response.text, {});
        if ((response as any).rotationLogs) {
          storyboardLogs.push(...(response as any).rotationLogs);
        }
        return data.scenes || [];
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

    if (!data || !data.scenes || data.scenes.length === 0) {
      console.warn("Gemini returned malformed or incomplete storyboard JSON. Using robust programmatic sentence splitter fallback to guarantee high-density scenes.");
      const oldLogs = data?.rotationLogs;
      data = generateMockStoryboard(rewrittenScript, chapters, isVi, visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine);
      if (oldLogs) data.rotationLogs = oldLogs;
    }

    if (data?.scenes?.length) {
      data.scenes = diversifyDuplicatePrompts(data.scenes);
    }

    if (chosenDuration && data.scenes && data.scenes.length > 0) {
      const scenes = data.scenes;
      const wordCounts = scenes.map((s: any) => (s.script || "").split(/\s+/).filter(Boolean).length);
      const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);

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

    const fallbackData: any = generateMockStoryboard(rewrittenScript, chapters, isVi, visualStyle, density, chosenDuration, splitStrategy, config?.aspectRatio || AspectRatio.SixteenNine);
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

    const combinedSeoPrompt = `You are a high-impact viral CTR professional SEO analyst and marketing copywriter.
Your task is to analyze this video script and generate fully optimized search and click metadata:
---
${rewrittenScript}
---

Your process MUST complete all of these steps internally:
1. Keyword Analysis: Analyze the content and identify the top 10 search terms (including highly searched long-tail keywords) in ${isVi ? "Vietnamese" : "English"}.
2. Draft SEO Generation: Generate exactly ${numTitles} click-worthy video titles and exactly ${numDescriptions} descriptions. Provide metrics for each title and description (searchScore, ctrScore, compScore, seoScore) on a scale of 0-100. Generate exactly ${numHashtags} hashtags and exactly ${numTags} search tags.
3. SEO Optimization & Refinement: Polish the results so that the keywords are naturally integrated into the text. Avoid dry or clinical styles; optimize titles specifically for high CTR on modern media platforms (e.g. YouTube, TikTok).

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps or backticks:
{
  "keywords": ["keyword1", "keyword2"],
  "titles": [
    { "text": "Optimized Title", "searchScore": 95, "ctrScore": 95, "compScore": 25, "seoScore": 96 }
  ],
  "descriptions": [
    { "text": "Optimized description naturally integrating keywords...", "searchScore": 92, "ctrScore": 90, "compScore": 30, "seoScore": 91 }
  ],
  "hashtags": ["hashtag1", "hashtag2"],
  "tags": ["tag1", "tag2"]
}`;

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
      hashtags: seoResult.hashtags || [],
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
  const refImageStr = visualConfig.thumbnailReferencePrompt || visualConfig.thumbnailReferenceImage ? `CRITICAL DIRECTIVE: You MUST create prompts that strictly and exactly follow this extracted style reference: "${visualConfig.thumbnailReferencePrompt || visualConfig.thumbnailReferenceImage}". Deeply integrate these aesthetic keywords into the thumbnail prompt.` : "";

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
    if (visualConfig.thumbnailReferenceImages && Array.isArray(visualConfig.thumbnailReferenceImages) && visualConfig.thumbnailReferenceImages.length > 0) {
      for (const imgBase64 of visualConfig.thumbnailReferenceImages.slice(0, 3)) {
        let base64Data = imgBase64;
        let mimeType = "image/jpeg";

        if (imgBase64.startsWith("data:")) {
          const match = imgBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        thumbParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
    }

    thumbParts.push({
      text:
        combinedThumbnailsPrompt +
        (visualConfig.thumbnailReferenceImages && visualConfig.thumbnailReferenceImages.length > 0 ? "\n\nCRITICAL MULTIMODAL STYLE REFERENCE DIRECTIVE:\nWe have provided the actual style reference image(s) for the thumbnails above. Inspect their color palette, typography vibe, lighting contrast, and composition. Strictly apply these elements to your output prompts." : ""),
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

    console.log(`${BACKEND_MESSAGES.TTS_START}${finalVoiceId}`);
    const ttsRes = await fetch(EXTERNAL_URLS.AI33_TTS, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      throw new Error(getMessage("TTS_API_ERROR_MSG", undefined, err));
    }

    const ttsData = await ttsRes.json();
    if (!ttsData.success || !ttsData.task_id) {
      throw new Error(getMessage("TTS_NO_TASK_ID", undefined, JSON.stringify(ttsData)));
    }

    const taskId = ttsData.task_id;
    console.log(`${BACKEND_MESSAGES.TTS_TASK_ID}${taskId}${BACKEND_MESSAGES.TTS_POLLING}`);

    let audioUrl = null;
    let attempts = 0;
    while (attempts < 60) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${EXTERNAL_URLS.AI33_TASK}/${taskId}`, {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
      });

      if (!pollRes.ok) throw new Error(getMessage("TTS_POLL_FAILED", undefined, await pollRes.text()));
      const pollData = await pollRes.json();

      if (pollData.status === "done") {
        audioUrl = pollData.metadata?.audio_url;
        break;
      } else if (pollData.status === "error") {
        throw new Error(getMessage("TTS_TASK_ERROR_MSG", undefined, pollData.error_message));
      }
      attempts++;
    }

    if (!audioUrl) {
      throw new Error(getMessage("TTS_TASK_TIMED_OUT"));
    }

    console.log(`${BACKEND_MESSAGES.TTS_COMPLETE}${audioUrl}`);
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(getMessage("FAILED_DOWNLOAD_AUDIO"));

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    const mimeType = audioRes.headers.get("content-type") || "audio/mpeg";

    res.json({
      success: true,
      audioBase64,
      mimeType,
      audioUrl,
      provider: "AI33",
    });
  } catch (error: any) {
    logger.error(LogEvent.TTS_PIPELINE_ERROR, error);
    res.status(500).json({
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, results: [], warning: BACKEND_MESSAGES.BATCH_GEN_NO_ITEMS });
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    await generateBatchImagesWithGeminiChat(items, visualConfig, style, (progressResult) => {
      res.write(JSON.stringify(progressResult) + "\n");
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
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: ErrorMessage.NO_AUDIO_CHUNKS_PROVIDED });
    }

    const tempDir = os.tmpdir();
    const sessionId = randomUUID();
    const filePaths: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.audioBase64) {
        const buffer = Buffer.from(chunk.audioBase64, "base64");
        const filePath = path.join(tempDir, `chunk_${sessionId}_${i}.mp3`);
        fs.writeFileSync(filePath, buffer);
        filePaths.push(filePath);
      }
    }

    if (filePaths.length === 0) {
      return res.status(400).json({ error: "No valid base64 audio data found in chunks" });
    }

    const listPath = path.join(tempDir, `list_${sessionId}.txt`);
    const fileListContent = filePaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listPath, fileListContent);

    const outputPath = path.join(tempDir, `merged_${sessionId}.mp3`);

    ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c:a", "libmp3lame", "-b:a", "128k", "-y"])
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
          res.status(500).json({ error: ErrorMessage.FAILED_TO_READ_MERGED_AUDIO_FILE });
        }
      })
      .on("error", (err) => {
        logger.error(LogEvent.ERROR_FFMPEG_MERGE, err);

        filePaths.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
        fs.existsSync(listPath) && fs.unlinkSync(listPath);
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
        res.status(500).json({ error: "FFmpeg processing error: " + err.message });
      })
      .save(outputPath);
  } catch (err: any) {
    logger.error(LogEvent.UNEXPECTED_ERROR_MERGE_AUDIO, err);
    res.status(500).json({ error: ErrorMessage.INTERNAL_SERVER_ERROR + err.message });
  }
});

router.post("/align-voice", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  try {
    const { audioBase64, scenes } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: getBackendMsg("VOICE_ALIGN_NO_AUDIO", isVi) });
    }
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: getBackendMsg("VOICE_ALIGN_NO_SCENES", isVi) });
    }

    const tempDir = path.join(process.cwd(), ALIGN_CONFIG.TEMP_DIR);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sessionId = randomUUID();
    const audioPath = path.join(tempDir, `audio_${sessionId}.wav`);
    const scenesPath = path.join(tempDir, `scenes_${sessionId}.json`);
    const outputPath = path.join(tempDir, `output_${sessionId}.json`);

    const audioBuffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(audioPath, audioBuffer);

    fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2), "utf-8");

    const scriptPath = path.join(process.cwd(), ALIGN_CONFIG.SCRIPT_FILE);

    const checkCmd = `python3 -c "import whisper"`;
    logger.log(VOICE_ALIGN_LOGS.CHECK_WHISPER);

    exec(checkCmd, (checkError) => {
      if (checkError) {
        logger.log(VOICE_ALIGN_LOGS.WHISPER_NOT_INSTALLED);
        const installCmd = `python3 -m pip install openai-whisper`;

        exec(installCmd, (installError, installStdout, installStderr) => {
          if (installError) {
            logger.error(`Failed to install openai-whisper: ${installError.message}`);
            try {
              if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
              if (fs.existsSync(scenesPath)) fs.unlinkSync(scenesPath);
            } catch (cleanupErr) { }
            return res.status(500).json({
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
      const cmd = `python3 "${scriptPath}" "${audioPath}" "${scenesPath}" "${outputPath}"`;
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
          return res.status(500).json({
            success: false,
            error: pythonError ? pythonError : error.message,
          });
        }

        try {
          if (!fs.existsSync(outputPath)) {
            throw new Error(getBackendMsg("VOICE_ALIGN_MISSING_OUTPUT", isVi));
          }

          const rawResult = fs.readFileSync(outputPath, "utf-8");
          const result = JSON.parse(rawResult);

          fs.unlinkSync(outputPath);

          return res.json(result);
        } catch (err: any) {
          logger.error(`Error parsing voice_aligner.py output: ${err.message}`);
          if (fs.existsSync(outputPath)) {
            try {
              fs.unlinkSync(outputPath);
            } catch (e) { }
          }
          return res.status(500).json({
            success: false,
            error: getBackendMsg("VOICE_ALIGN_PARSE_ERR", isVi).replace("{0}", err.message),
          });
        }
      });
    }
  } catch (err: any) {
    logger.error(VOICE_ALIGN_LOGS.ERR_UNEXPECTED_ALIGN, err);
    res.status(500).json({ error: ErrorMessage.INTERNAL_SERVER_ERROR + err.message });
  }
});

router.post("/run-ultra", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const { filePath, geminiApiKey, sfxFolder, opts } = req.body;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      error: getBackendMsg("ULTRA_FILE_REQUIRED", isVi),
    });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({
      success: false,
      error: getBackendMsg("ULTRA_FILE_NOT_FOUND", isVi),
    });
  }

  const tempOutputPath = filePath + ".ultra_tmp";
  const uniqueId = randomUUID().substring(0, 8);
  const optsJsonPath = path.join(process.cwd(), `ultra_opts_${uniqueId}.json`);

  const cmdOpts = {
    ...opts,
    api_key: geminiApiKey || "",
    sfx_folder: sfxFolder || "",
  };

  try {
    fs.writeFileSync(optsJsonPath, JSON.stringify(cmdOpts, null, 2), "utf-8");

    const cmd = `python3 capcut_ultra_tool.py "${filePath}" "${tempOutputPath}" "${optsJsonPath}"`;
    logger.log(`Running capcut ultra command: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      try {
        if (fs.existsSync(optsJsonPath)) fs.unlinkSync(optsJsonPath);
      } catch (cleanupErr) { }

      if (error) {
        try {
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        } catch (cleanupErr) { }

        logger.error(`CapCut Ultra process failed with exit code ${error.code}: ${error.message}`);
        if (stdout) logger.error(`Python stdout: ${stdout}`);
        if (stderr) logger.error(`Python stderr: ${stderr}`);

        const pythonError = stderr || stdout || error.message;
        return res.status(500).json({
          success: false,
          error: pythonError.replace("ERROR: ", "").trim(),
        });
      }

      try {
        if (fs.existsSync(tempOutputPath)) {
          if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, filePath + ".backup_ultra");
            fs.unlinkSync(filePath);
          }
          fs.renameSync(tempOutputPath, filePath);
        }
      } catch (fsErr: any) {
        logger.error(`File copy/rename failed: ${fsErr.message}`);
        return res.status(500).json({
          success: false,
          error: fsErr.message,
        });
      }

      return res.json({
        success: true,
        message: getBackendMsg("ULTRA_SUCCESS", isVi),
      });
    });
  } catch (err: any) {
    try {
      if (fs.existsSync(optsJsonPath)) fs.unlinkSync(optsJsonPath);
    } catch (cleanupErr) { }
    try {
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanupErr) { }
    logger.error(`Unexpected error running CapCut Ultra: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post("/select-file", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const cmd = `python3 capcut_ultra_tool.py select-file`;
  logger.log(`Running select-file command: ${cmd}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Select file dialog failed: ${error.message}`);
      return res.status(500).json({ success: false, error: getBackendMsg("SELECT_FILE_FAILED", isVi) });
    }
    return res.json({ success: true, filePath: stdout.trim() });
  });
});

router.post("/select-folder", async (req: Request, res: Response) => {
  const isVi = req.body?.language === ProjectLanguage.VI || req.query?.lang !== ProjectLanguage.EN;
  const cmd = `python3 capcut_ultra_tool.py select-folder`;
  logger.log(`Running select-folder command: ${cmd}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Select folder dialog failed: ${error.message}`);
      return res.status(500).json({ success: false, error: getBackendMsg("SELECT_FOLDER_FAILED", isVi) });
    }
    return res.json({ success: true, folderPath: stdout.trim() });
  });
});

export default router;
