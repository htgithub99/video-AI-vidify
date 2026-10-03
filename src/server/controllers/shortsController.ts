import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import _ from "lodash";
import { inspectVideoFile, extractAudioFromVideo } from "../services/shortsPreprocessService.js";
import { analyzeVideoHighlights } from "../services/aiHighlightService.js";
import { renderSingleShortClip } from "../services/ffmpegShortsCutter.js";
import { closeChatPlanningRoomsForProject, closeChatBrowserIfIdle } from "../services/chatUiPlanningService.js";
import { HighlightClipItem, ShortsAspectRatio, ShortsDurationOption, ShortsReframeMode } from "../../types/shorts.js";
import { AiPlanningFallbackProvider } from "../../types.js";
import {
  SHORTS_CONSTANTS,
  SHORTS_LOG_MESSAGES,
  SHORTS_MIME_TYPES,
  SHORTS_REGEX,
  SHORTS_TEXTS,
} from "../../constants/shorts.js";
import { SUNO_AUTOMATION_CONFIG } from "../../constants/sunoAutomation.js";
import { logger } from "../../lib/logger.js";
import { getDataDirectory, getPythonCommand, getStaticResourcePath } from "../utils/paths.js";

const shortsSaveDestinations = new Map<string, string>();
let currentShortsAbortController: AbortController | null = null;

export const cancelShortsPipeline = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (currentShortsAbortController) {
      currentShortsAbortController.abort();
      currentShortsAbortController = null;
    }
    try {
      await closeChatPlanningRoomsForProject({ provider: AiPlanningFallbackProvider.GeminiChat, projectId: SHORTS_CONSTANTS.PROJECT_ID_PREFIX });
      await closeChatBrowserIfIdle();
    } catch (_) {}
    res.json({ success: true, message: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_PROCESS_FAILED });
  }
};

export const inspectShortsVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoPath } = req.body;
    if (!videoPath || !fs.existsSync(videoPath)) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_NO_VIDEO_SELECTED });
      return;
    }

    const metadata = await inspectVideoFile(videoPath);
    res.json({ success: true, metadata });
  } catch (error: any) {
    logger.error(SHORTS_LOG_MESSAGES.ERROR_INSPECT, error?.message);
    res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_PROCESS_FAILED });
  }
};

const cleanPreviousShortsOutputs = async (): Promise<void> => {
  try {
    const shortsDir = path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER, SHORTS_CONSTANTS.SHORTS_FOLDER);
    if (fs.existsSync(shortsDir)) {
      const files = await fs.promises.readdir(shortsDir);
      const videoFiles = _.filter(files, (file) =>
        _.some([".mp4", ".jpg", ".jpeg", ".png", ".webp", ".webm"], (ext) => _.endsWith(_.toLower(file), ext))
      );
      for (const file of videoFiles) {
        const filePath = path.join(shortsDir, file);
        try {
          await fs.promises.unlink(filePath);
        } catch (_) {}
      }
    }

    const outputDir = path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER);
    if (fs.existsSync(outputDir)) {
      const outputFiles = await fs.promises.readdir(outputDir);
      const oldZips = _.filter(outputFiles, (file) =>
        _.startsWith(file, "shorts_export_") && _.endsWith(file, SHORTS_CONSTANTS.EXT_ZIP)
      );
      for (const zipFile of oldZips) {
        try {
          await fs.promises.unlink(path.join(outputDir, zipFile));
        } catch (_) {}
      }
    }
  } catch (error: any) {
    logger.warn(SHORTS_LOG_MESSAGES.CLEANUP_WARN(error?.message || ""));
  }
};

export const generateShortsPipeline = async (req: Request, res: Response): Promise<void> => {
  const abortController = new AbortController();
  currentShortsAbortController = abortController;

  const handleClose = () => {
    abortController.abort();
    try {
      closeChatPlanningRoomsForProject({ provider: AiPlanningFallbackProvider.GeminiChat, projectId: SHORTS_CONSTANTS.PROJECT_ID_PREFIX }).catch(() => undefined);
      closeChatBrowserIfIdle().catch(() => undefined);
    } catch (_) {}
  };

  req.on("close", handleClose);

  try {
    const {
      sourceVideoPath,
      aspectRatio = ShortsAspectRatio.VERTICAL_9_16,
      reframeMode = ShortsReframeMode.BLUR_BACKGROUND,
      clipCount = SHORTS_CONSTANTS.DEFAULT_CLIP_COUNT,
      durationMode = ShortsDurationOption.AUTO,
    } = req.body;

    if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_NO_VIDEO_SELECTED });
      return;
    }

    if (abortController.signal.aborted) {
      res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      return;
    }

    logger.log(SHORTS_LOG_MESSAGES.START_PROCESSING(sourceVideoPath));

    await cleanPreviousShortsOutputs();
    
    const metadata = await inspectVideoFile(sourceVideoPath);

    if (abortController.signal.aborted) {
      res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      return;
    }

    let audioPath = "";
    try {
      audioPath = await extractAudioFromVideo(sourceVideoPath);
    } catch (err: any) {
      logger.warn(SHORTS_LOG_MESSAGES.AUDIO_EXTRACT_WARN(err?.message || ""));
    }

    if (abortController.signal.aborted) {
      res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      return;
    }

    const safeClipCount = _.clamp(_.toNumber(clipCount) || SHORTS_CONSTANTS.DEFAULT_CLIP_COUNT, SHORTS_CONSTANTS.MIN_CLIP_COUNT, SHORTS_CONSTANTS.MAX_CLIP_COUNT);
    logger.log(SHORTS_LOG_MESSAGES.CALLING_AI(safeClipCount));
    const clips = await analyzeVideoHighlights({
      metadata,
      clipCount: safeClipCount,
      durationMode,
      audioPath,
      aiExecution: req.body?.aiExecution,
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      return;
    }

    const renderedClips: HighlightClipItem[] = [];
    for (const clip of clips) {
      if (abortController.signal.aborted) {
        break;
      }

      logger.log(SHORTS_LOG_MESSAGES.RENDERING_CLIP(clip.index, clip.startTime, clip.endTime));
      
      const { videoPath, thumbnailPath } = await renderSingleShortClip({
        sourceVideoPath,
        clip,
        aspectRatio,
        reframeMode,
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        break;
      }

      const relativeThumbPath = thumbnailPath ? _.replace(path.relative(process.cwd(), thumbnailPath), SHORTS_REGEX.BACKSLASH, "/") : "";

      renderedClips.push({
        ...clip,
        outputVideoPath: videoPath,
        videoUrl: `${SHORTS_CONSTANTS.ASSETS_URL_PREFIX}${path.basename(videoPath)}`,
        thumbnailUrl: relativeThumbPath ? `${SHORTS_CONSTANTS.ASSETS_URL_PREFIX}${path.basename(thumbnailPath)}` : undefined,
      });
    }

    if (audioPath && fs.existsSync(audioPath)) {
      try {
        await fs.promises.unlink(audioPath);
      } catch (_) {}
    }

    if (abortController.signal.aborted) {
      if (!res.headersSent) {
        res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      }
      return;
    }

    logger.log(SHORTS_LOG_MESSAGES.COMPLETE_ALL(_.size(renderedClips)));
    res.json({
      success: true,
      sourceMetadata: metadata,
      clips: renderedClips,
    });
  } catch (error: any) {
    if (abortController.signal.aborted || error?.message === "PROCESS_ABORTED") {
      if (!res.headersSent) {
        res.status(499).json({ success: false, error: SHORTS_TEXTS.PROGRESS_MSG_CANCELLED });
      }
      return;
    }
    logger.error(SHORTS_LOG_MESSAGES.ERROR_PIPELINE, error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_PROCESS_FAILED });
    }
  } finally {
    req.off("close", handleClose);
    if (currentShortsAbortController === abortController) {
      currentShortsAbortController = null;
    }
  }
};

export const exportShortsZip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoPaths } = req.body;
    if (!_.isArray(videoPaths) || _.isEmpty(videoPaths)) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_ZIP_NO_CLIPS });
      return;
    }

    const zip = new JSZip();
    for (const vPath of videoPaths) {
      if (fs.existsSync(vPath)) {
        const fileBuffer = await fs.promises.readFile(vPath);
        zip.file(path.basename(vPath), fileBuffer);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: SHORTS_CONSTANTS.ZIP_COMPRESSION,
      compressionOptions: { level: SHORTS_CONSTANTS.ZIP_COMPRESSION_LEVEL },
    });

    const zipFileName = `shorts_export_${Date.now()}${SHORTS_CONSTANTS.EXT_ZIP}`;
    const zipFilePath = path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER, zipFileName);
    await fs.promises.mkdir(path.dirname(zipFilePath), { recursive: true });
    await fs.promises.writeFile(zipFilePath, zipBuffer);

    res.json({
      success: true,
      zipPath: zipFilePath,
      zipUrl: `${SHORTS_CONSTANTS.ASSETS_URL_PREFIX}${zipFileName}`,
      totalBytes: zipBuffer.length,
    });
  } catch (error: any) {
    logger.error(SHORTS_LOG_MESSAGES.ERROR_EXPORT_ZIP, error);
    res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_ZIP_FAILED });
  }
};

export const selectShortsSaveDestination = (req: Request, res: Response): void => {
  const suggestedName = path.basename(String(req.body?.suggestedName || SHORTS_CONSTANTS.DEFAULT_SUGGESTED_MP4));
  const extension = String(req.body?.extension || SHORTS_CONSTANTS.EXT_MP4);

  execFile(
    getPythonCommand(),
    [getStaticResourcePath(SUNO_AUTOMATION_CONFIG.CAPCUT_ULTRA_TOOL_SCRIPT), "select-save-file", suggestedName, extension],
    { windowsHide: true },
    (error, stdout) => {
      if (error) {
        logger.error(SHORTS_LOG_MESSAGES.ERROR_PIPELINE, error);
        return res.status(500).json({ success: false, error: error.message });
      }
      const target = stdout.trim();
      if (!target) {
        return res.json({ success: true, cancelled: true });
      }
      const token = randomUUID();
      shortsSaveDestinations.set(token, target);
      setTimeout(() => shortsSaveDestinations.delete(token), SHORTS_CONSTANTS.DEFAULT_EXPIRATION_MS).unref();
      return res.json({ success: true, token, targetPath: target });
    }
  );
};

export const saveSingleShortVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const sourceVideoPath = typeof req.body?.sourceVideoPath === "string" ? req.body.sourceVideoPath : "";

    const target = shortsSaveDestinations.get(token);
    if (!target) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_ZIP_FAILED });
      return;
    }
    shortsSaveDestinations.delete(token);

    if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_FILE_NOT_FOUND });
      return;
    }

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(sourceVideoPath, target);

    res.json({ success: true, savedPath: target });
  } catch (error: any) {
    logger.error(SHORTS_LOG_MESSAGES.ERROR_PIPELINE, error);
    res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_PROCESS_FAILED });
  }
};

export const buildShortsZipDirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const videoPaths = Array.isArray(req.body?.videoPaths) ? req.body.videoPaths : [];

    const target = shortsSaveDestinations.get(token);
    if (!target) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_ZIP_FAILED });
      return;
    }
    shortsSaveDestinations.delete(token);

    if (_.isEmpty(videoPaths)) {
      res.status(400).json({ success: false, error: SHORTS_TEXTS.ERR_ZIP_NO_CLIPS });
      return;
    }

    const zip = new JSZip();
    for (const vPath of videoPaths) {
      if (fs.existsSync(vPath)) {
        const fileBuffer = await fs.promises.readFile(vPath);
        zip.file(path.basename(vPath), fileBuffer);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: SHORTS_CONSTANTS.ZIP_COMPRESSION,
      compressionOptions: { level: SHORTS_CONSTANTS.ZIP_COMPRESSION_LEVEL },
    });

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, zipBuffer);

    res.json({
      success: true,
      zipPath: target,
      totalBytes: zipBuffer.length,
    });
  } catch (error: any) {
    logger.error(SHORTS_LOG_MESSAGES.ERROR_EXPORT_ZIP, error);
    res.status(500).json({ success: false, error: error?.message || SHORTS_TEXTS.ERR_ZIP_FAILED });
  }
};

export const streamSourceVideo = (req: Request, res: Response): void => {
  try {
    const videoPath = String(req.query.path || req.body?.path || "");
    if (!videoPath || !fs.existsSync(videoPath)) {
      res.status(404).send(SHORTS_TEXTS.ERR_FILE_NOT_FOUND);
      return;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = _.toLower(path.extname(videoPath));
    const contentType = SHORTS_MIME_TYPES[ext] || SHORTS_MIME_TYPES[".mp4"];

    if (range) {
      const parts = range.replace(SHORTS_REGEX.RANGE_BYTES, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error: any) {
    logger.error(SHORTS_LOG_MESSAGES.ERROR_PIPELINE, error?.message);
    if (!res.headersSent) {
      res.status(500).send(SHORTS_TEXTS.ERR_PROCESS_FAILED);
    }
  }
};
