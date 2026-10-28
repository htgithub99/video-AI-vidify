import { VIDEO_EXPORT_TEMPLATE_SYMBOL_6, VIDEO_EXPORT_TEMPLATE_SYMBOL_7, VIDEO_EXPORT_TEXT_ABORTCONTROLLER, VIDEO_EXPORT_TEXT_CAPCUT_MUSIC_VIDEO, VIDEO_EXPORT_TEXT_KHONG_TAI_DUOC_DANH_MUC_HIEU, VIDEO_EXPORT_TEXT_MESSAGE, VIDEO_EXPORT_TEXT_SYMBOL_11, VIDEO_EXPORT_TEXT_XUAT_PROJECT_CAPCUT_THAT_BAI } from "../../../../constants/videoExportText";
import { pickVideoExportEnum as pickEnum, resolveVideoExportConfig } from "../../lib/videoExportConfig";
import { SOURCE_TEXT_SELECT_SAVE_FILE } from "../../../../constants/sourceText";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import _ from "lodash";
import { getVideoExportSource, pickVideoExportFolder, resolveVideoExportMediaPath, scanVideoExportFolder } from "../services/videoExportScanService.js";
import { renderVideoExport, renderVideoExportMultiPreviews, VideoExportQuality } from "../services/videoExportRenderService.js";
import { isAbortError } from "../services/videoExportFfmpegService.js";
import { getDataDirectory, getPythonCommand, getStaticResourcePath } from "../../../../server/utils/paths.js";
import { getCapcutResourceCatalog } from "../services/capcutResourceService.js";
import { exportCapcutProject } from "../services/videoExportCapcutService.js";
import { logger } from "../../../../lib/logger.js";
import { SUNO_AUTOMATION_CONFIG } from "../../../../constants/sunoAutomation.js";
import { VIDEO_EXPORT_CONSTANTS, VIDEO_EXPORT_LOG_MESSAGES, VIDEO_EXPORT_REGEX, VIDEO_EXPORT_SERVER_TEXTS } from "../../constants/videoExport.js";
import { VideoExportAspectRatio, VideoExportCancelTarget, VideoExportConfig, VideoExportJobStage, VideoExportJobState, VideoExportJobStatus, VideoExportResultItem } from "../../types/videoExport.js";
type RenderJob = VideoExportJobState & { abortController: AbortController };
type SelectionResult = { audioPaths: string[]; imagePaths: string[] };
const renderJobs = new Map<string, RenderJob>();
const saveDestinations = new Map<string, string>();
let activeRenderJobId: string | null = null;
let activePreviewController: AbortController | null = null;
const getExportDirectory = (): string => path.join(getDataDirectory(), VIDEO_EXPORT_CONSTANTS.OUTPUT_FOLDER, VIDEO_EXPORT_CONSTANTS.EXPORT_FOLDER);
const getPreviewDirectory = (): string => path.join(getExportDirectory(), VIDEO_EXPORT_CONSTANTS.PREVIEW_FOLDER);
const getTempDirectory = (id: string): string => path.join(getExportDirectory(), VIDEO_EXPORT_CONSTANTS.TEMP_FOLDER, id);
const parseConfig = (body: any): VideoExportConfig => resolveVideoExportConfig(body, { coerceNumbers: true });
const resolveSelection = async (body: any): Promise<SelectionResult> => {
  const source = getVideoExportSource(_.toString(body?.token));
  if (!source) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_SOURCE_MISSING);
  const audioIndexes = _.isArray(body?.audioIndexes) ? body.audioIndexes : [];
  const imageIndexes = _.isArray(body?.imageIndexes) ? body.imageIndexes : [];
  const audioPaths = _.map(audioIndexes, (index: unknown) => source.audios[_.toNumber(index)]?.sourcePath);
  const imagePaths = _.map(imageIndexes, (index: unknown) => source.images[_.toNumber(index)]?.sourcePath);
  if (_.isEmpty(audioPaths) || _.isEmpty(imagePaths) || _.some([...audioPaths, ...imagePaths], (filePath) => !filePath)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_INVALID_SELECTION);
  const exists = await Promise.all(
    _.map([...audioPaths, ...imagePaths], (filePath: string) =>
      fs.promises.access(filePath).then(
        () => true,
        () => false,
      ),
    ),
  );
  if (!_.every(exists)) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_SOURCE_MISSING);
  return { audioPaths: audioPaths as string[], imagePaths: imagePaths as string[] };
};
const buildSafeFileStem = (title: unknown): string => {
  const cleaned = _.replace(_.replace(_.deburr(_.toString(title)), VIDEO_EXPORT_REGEX.UNSAFE_FILENAME, VIDEO_EXPORT_TEXT_SYMBOL_11), VIDEO_EXPORT_REGEX.TRIM_UNDERSCORE, "");
  return _.truncate(cleaned || VIDEO_EXPORT_CONSTANTS.DEFAULT_TITLE, { length: 60, omission: "" });
};
const toJobState = (job: RenderJob): VideoExportJobState => _.omit(job, [VIDEO_EXPORT_TEXT_ABORTCONTROLLER]);
const scheduleJobCleanup = (jobId: string): void => {
  setTimeout(() => renderJobs.delete(jobId), VIDEO_EXPORT_CONSTANTS.JOB_TTL_MS).unref();
};
const clearOldPreviews = async (): Promise<void> => {
  const previewDir = getPreviewDirectory();
  const files = await fs.promises.readdir(previewDir).catch(() => [] as string[]);
  await Promise.all(_.map(files, (file) => fs.promises.rm(path.join(previewDir, file), { force: true }).catch(() => undefined)));
};
const sendError = (res: Response, status: number, error: unknown, fallback: string): void => {
  if (res.headersSent) return;
  res.status(status).json({ success: false, error: _.get(error, VIDEO_EXPORT_TEXT_MESSAGE) || fallback });
};
export const selectVideoExportSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const providedFolderPath = _.trim(_.toString(req.body?.folderPath));
    const folderPath = providedFolderPath || (await pickVideoExportFolder());
    if (!folderPath) {
      res.json({ success: true, cancelled: true });
      return;
    }
    const source = await scanVideoExportFolder(folderPath);
    res.json({ success: true, source });
  } catch (error) {
    sendError(res, 500, error, VIDEO_EXPORT_SERVER_TEXTS.ERR_PICKER_FAILED);
  }
};
export const streamVideoExportMedia = (req: Request, res: Response): void => {
  const filePath = resolveVideoExportMediaPath(req.params.token, req.params.kind, _.toNumber(req.params.index));
  if (!filePath) {
    res.sendStatus(404);
    return;
  }
  res.sendFile(path.resolve(filePath), (error) => {
    if (error && !res.headersSent) res.sendStatus(404);
  });
};
export const createVideoExportPreview = async (req: Request, res: Response): Promise<void> => {
  activePreviewController?.abort();
  const abortController = new AbortController();
  activePreviewController = abortController;
  const previewId = randomUUID();
  try {
    const { audioPaths, imagePaths } = await resolveSelection(req.body);
    await clearOldPreviews();
    const aspectRatios = [VideoExportAspectRatio.HORIZONTAL_16_9, VideoExportAspectRatio.VERTICAL_9_16, VideoExportAspectRatio.SQUARE_1_1];
    const timestamp = Date.now();
    const outputs = _.map(aspectRatios, (aspectRatio) => {
      const tag = _.replace(aspectRatio, /[:/\\]/g, VIDEO_EXPORT_TEXT_SYMBOL_11);
      const fileName = VIDEO_EXPORT_TEMPLATE_SYMBOL_6(`${VIDEO_EXPORT_CONSTANTS.PREVIEW_PREFIX}`, `${timestamp}`, `${tag}`, `${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
      return { aspectRatio, fileName, outputPath: path.join(getPreviewDirectory(), fileName) };
    });
    const parsedConfig = parseConfig(req.body);
    const results = await renderVideoExportMultiPreviews({ audioPaths, imagePaths, config: parsedConfig, outputs: _.map(outputs, (o) => ({ aspectRatio: o.aspectRatio, outputPath: o.outputPath })), tempDir: getTempDirectory(`${VIDEO_EXPORT_CONSTANTS.PREVIEW_PREFIX}${previewId}`), signal: abortController.signal });
    const previews: Record<string, { previewUrl: string; durationSeconds: number }> = {};
    for (const item of outputs) {
      const durationSeconds = results[item.aspectRatio]?.durationSeconds || VIDEO_EXPORT_CONSTANTS.PREVIEW_MAX_SECONDS;
      previews[item.aspectRatio] = { previewUrl: `${VIDEO_EXPORT_CONSTANTS.PREVIEW_URL_PREFIX}${item.fileName}`, durationSeconds };
    }
    const currentPreview = previews[parsedConfig.aspectRatio] ?? previews[VideoExportAspectRatio.HORIZONTAL_16_9];
    res.json({ success: true, preview: currentPreview, previews });
  } catch (error: any) {
    if (isAbortError(error)) {
      sendError(res, 499, error, VIDEO_EXPORT_SERVER_TEXTS.MSG_CANCELLED);
      return;
    }
    logger.error(VIDEO_EXPORT_LOG_MESSAGES.PREVIEW_ERROR(error?.message || ""));
    sendError(res, 500, error, VIDEO_EXPORT_SERVER_TEXTS.ERR_PREVIEW_FAILED);
  } finally {
    if (activePreviewController === abortController) activePreviewController = null;
  }
};
const runRenderJob = async (job: RenderJob, selection: SelectionResult, config: VideoExportConfig, title: string): Promise<void> => {
  const fileName = VIDEO_EXPORT_TEMPLATE_SYMBOL_7(`${buildSafeFileStem(title)}`, `${Date.now()}`, `${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
  const outputPath = path.join(getExportDirectory(), fileName);
  logger.log(VIDEO_EXPORT_LOG_MESSAGES.RENDER_START(job.jobId, selection.audioPaths.length, selection.imagePaths.length));
  try {
    const { durationSeconds } = await renderVideoExport({
      ...selection,
      config,
      outputPath,
      tempDir: getTempDirectory(job.jobId),
      quality: VideoExportQuality.FINAL,
      signal: job.abortController.signal,
      onProgress: (stage, percent, message) => {
        if (job.status !== VideoExportJobStatus.RENDERING) return;
        _.assign(job, { stage, percent: Math.max(job.percent, percent), message });
      },
    });
    const sizeBytes = (await fs.promises.stat(outputPath)).size;
    const result: VideoExportResultItem = {
      id: job.jobId,
      title: _.trim(title) || VIDEO_EXPORT_CONSTANTS.DEFAULT_TITLE,
      fileName,
      outputVideoPath: outputPath,
      videoUrl: `${VIDEO_EXPORT_CONSTANTS.ASSETS_URL_PREFIX}${fileName}`,
      durationSeconds,
      sizeBytes,
      trackCount: selection.audioPaths.length,
      imageCount: selection.imagePaths.length,
      aspectRatio: config.aspectRatio,
      createdAt: new Date().toISOString(),
    };
    _.assign(job, { status: VideoExportJobStatus.COMPLETED, stage: VideoExportJobStage.DONE, percent: 100, message: VIDEO_EXPORT_SERVER_TEXTS.MSG_DONE, result });
    logger.log(VIDEO_EXPORT_LOG_MESSAGES.RENDER_DONE(job.jobId, outputPath));
  } catch (error: any) {
    if (isAbortError(error) || job.abortController.signal.aborted) {
      _.assign(job, { status: VideoExportJobStatus.CANCELLED, message: VIDEO_EXPORT_SERVER_TEXTS.MSG_CANCELLED });
      return;
    }
    logger.error(VIDEO_EXPORT_LOG_MESSAGES.RENDER_ERROR(job.jobId, error?.message || ""));
    _.assign(job, { status: VideoExportJobStatus.ERROR, message: VIDEO_EXPORT_SERVER_TEXTS.ERR_RENDER_FAILED, error: error?.message || VIDEO_EXPORT_SERVER_TEXTS.ERR_RENDER_FAILED });
  } finally {
    if (activeRenderJobId === job.jobId) activeRenderJobId = null;
    scheduleJobCleanup(job.jobId);
  }
};
export const startVideoExportRender = async (req: Request, res: Response): Promise<void> => {
  if (activeRenderJobId) {
    res.status(409).json({ success: false, error: VIDEO_EXPORT_SERVER_TEXTS.ERR_RENDER_BUSY });
    return;
  }
  try {
    const selection = await resolveSelection(req.body);
    if (activeRenderJobId) {
      res.status(409).json({ success: false, error: VIDEO_EXPORT_SERVER_TEXTS.ERR_RENDER_BUSY });
      return;
    }
    const jobId = randomUUID();
    const job: RenderJob = { jobId, status: VideoExportJobStatus.RENDERING, stage: VideoExportJobStage.PREPARING, percent: 0, message: VIDEO_EXPORT_SERVER_TEXTS.MSG_PREPARING, abortController: new AbortController() };
    renderJobs.set(jobId, job);
    activeRenderJobId = jobId;
    void runRenderJob(job, selection, parseConfig(req.body), _.toString(req.body?.title));
    res.json({ success: true, jobId });
  } catch (error) {
    sendError(res, 400, error, VIDEO_EXPORT_SERVER_TEXTS.ERR_INVALID_SELECTION);
  }
};
export const getVideoExportStatus = (req: Request, res: Response): void => {
  const job = renderJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ success: false, error: VIDEO_EXPORT_SERVER_TEXTS.ERR_JOB_NOT_FOUND });
    return;
  }
  res.json({ success: true, job: toJobState(job) });
};
export const cancelVideoExport = (req: Request, res: Response): void => {
  const target = pickEnum(VideoExportCancelTarget, req.body?.target, VideoExportCancelTarget.RENDER);
  if (target === VideoExportCancelTarget.PREVIEW) {
    activePreviewController?.abort();
    activePreviewController = null;
    res.json({ success: true });
    return;
  }
  const jobId = _.toString(req.body?.jobId) || activeRenderJobId || "";
  const job = renderJobs.get(jobId);
  if (job && job.status === VideoExportJobStatus.RENDERING) {
    _.assign(job, { status: VideoExportJobStatus.CANCELLED, message: VIDEO_EXPORT_SERVER_TEXTS.MSG_CANCELLED });
    job.abortController.abort();
  }
  res.json({ success: true, message: VIDEO_EXPORT_SERVER_TEXTS.MSG_CANCELLED });
};
export const selectVideoExportSaveDestination = (req: Request, res: Response): void => {
  const suggestedName = path.basename(_.toString(req.body?.suggestedName) || `${VIDEO_EXPORT_CONSTANTS.DEFAULT_TITLE}${VIDEO_EXPORT_CONSTANTS.EXT_MP4}`);
  execFile(getPythonCommand(), [getStaticResourcePath(SUNO_AUTOMATION_CONFIG.CAPCUT_ULTRA_TOOL_SCRIPT), SOURCE_TEXT_SELECT_SAVE_FILE, suggestedName, VIDEO_EXPORT_CONSTANTS.EXT_MP4], { windowsHide: true }, (error, stdout) => {
    if (error) {
      logger.error(VIDEO_EXPORT_LOG_MESSAGES.SAVE_ERROR(error.message));
      sendError(res, 500, error, VIDEO_EXPORT_SERVER_TEXTS.ERR_SAVE_TOKEN);
      return;
    }
    const target = _.trim(stdout);
    if (!target) {
      res.json({ success: true, cancelled: true });
      return;
    }
    const token = randomUUID();
    saveDestinations.set(token, target);
    setTimeout(() => saveDestinations.delete(token), VIDEO_EXPORT_CONSTANTS.SAVE_TOKEN_TTL_MS).unref();
    res.json({ success: true, token, targetPath: target });
  });
};
export const saveVideoExportVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = _.toString(req.body?.token);
    const target = saveDestinations.get(token);
    if (!target) {
      res.status(400).json({ success: false, error: VIDEO_EXPORT_SERVER_TEXTS.ERR_SAVE_TOKEN });
      return;
    }
    saveDestinations.delete(token);
    const sourcePath = path.join(getExportDirectory(), path.basename(_.toString(req.body?.fileName)));
    if (!fs.existsSync(sourcePath)) {
      res.status(404).json({ success: false, error: VIDEO_EXPORT_SERVER_TEXTS.ERR_FILE_NOT_FOUND });
      return;
    }
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(sourcePath, target);
    res.json({ success: true, savedPath: target });
  } catch (error: any) {
    logger.error(VIDEO_EXPORT_LOG_MESSAGES.SAVE_ERROR(error?.message || ""));
    sendError(res, 500, error, VIDEO_EXPORT_SERVER_TEXTS.ERR_FILE_NOT_FOUND);
  }
};
export const getCapcutResourceCatalogController = (_req: Request, res: Response): void => {
  try {
    const catalog = getCapcutResourceCatalog();
    res.json({ success: true, catalog });
  } catch (error: any) {
    sendError(res, 500, error, VIDEO_EXPORT_TEXT_KHONG_TAI_DUOC_DANH_MUC_HIEU);
  }
};
export const createCapcutProjectController = async (req: Request, res: Response): Promise<void> => {
  try {
    const selection = await resolveSelection(req.body);
    const result = await exportCapcutProject({ projectName: _.toString(req.body?.title) || VIDEO_EXPORT_TEXT_CAPCUT_MUSIC_VIDEO, audioPaths: selection.audioPaths, imagePaths: selection.imagePaths, config: parseConfig(req.body), capcutEffectId: _.toString(req.body?.capcutEffectId), capcutTransitionId: _.toString(req.body?.capcutTransitionId) });
    res.json({ success: true, result });
  } catch (error: any) {
    sendError(res, 500, error, VIDEO_EXPORT_TEXT_XUAT_PROJECT_CAPCUT_THAT_BAI);
  }
};
