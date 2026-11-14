import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import _ from "lodash";
import { parseGeminiChatModel } from "../../../../constants/geminiChatModels.js";
import { cancelAllActiveMediaGeneration, generateImageWithPlaywright } from "../../../../server/services/imageGeneratorService.js";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { logger } from "../../../../lib/logger.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, GenerateType, ImageGenerationMode, ImageGeneratorEngine, PromptInputMethod } from "../../../../types.js";
import { probeMediaDurationSeconds } from "./videoExportFfmpegService.js";
import { VIDEO_EXPORT_CONSTANTS } from "../../constants/videoExport.js";
import { VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_GEMINI_ASPECT, VIDEO_EXPORT_AI_CLIP_LOG, VIDEO_EXPORT_AI_CLIP_PROMPTS, VIDEO_EXPORT_AI_CLIP_REGEX, VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS } from "../../constants/videoExportAiClip.js";
import { VideoExportAiClip, VideoExportAiClipInput, VideoExportAiClipJobState, VideoExportAiClipJobStatus, VideoExportAspectRatio } from "../../types/videoExport.js";
type AiClipJob = VideoExportAiClipJobState & { cancelRequested: boolean };
export type StartAiClipJobParams = {
  inputs: VideoExportAiClipInput[];
  note: string;
  aspectRatio: VideoExportAspectRatio;
  provider?: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  executionMode?: AiPlanningExecutionMode;
  chromeHeadless?: boolean;
};
const resolveAiClipEngine = (provider?: AiPlanningFallbackProvider, model?: AiPlanningChatModel): ImageGeneratorEngine => {
  if (provider === AiPlanningFallbackProvider.GrokChat) return ImageGeneratorEngine.GrokImagine;
  const baseModel = parseGeminiChatModel(model)?.model ?? model;
  if (baseModel === AiPlanningChatModel.GeminiFlashLite) return ImageGeneratorEngine.Veo3Lite;
  if (baseModel === AiPlanningChatModel.GeminiPro || baseModel === AiPlanningChatModel.GeminiThinking || baseModel === AiPlanningChatModel.GeminiDeepThink || baseModel === AiPlanningChatModel.GeminiArgon) {
    return ImageGeneratorEngine.Veo3Quality;
  }
  return ImageGeneratorEngine.Veo3;
};
const aiClipJobs = new Map<string, AiClipJob>();
let activeAiClipJobId: string | null = null;
export const getAiClipDirectory = (): string => path.join(getDataDirectory(), VIDEO_EXPORT_CONSTANTS.OUTPUT_FOLDER, VIDEO_EXPORT_CONSTANTS.EXPORT_FOLDER, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FOLDER);
const getAiClipPath = (clipId: string): string => path.join(getAiClipDirectory(), `${clipId}${VIDEO_EXPORT_AI_CLIP_CONSTANTS.EXT_MP4}`);
export const buildAiClipPrompt = (note: string): string => {
  const cleanNote = _.trim(note);
  return cleanNote ? VIDEO_EXPORT_AI_CLIP_PROMPTS.WITH_NOTE(cleanNote) : VIDEO_EXPORT_AI_CLIP_PROMPTS.AUTO;
};
export const sanitizeAiClipInputs = (raw: unknown): VideoExportAiClipInput[] =>
  _.chain(_.isArray(raw) ? raw : [])
    .map((item) => {
      const id = _.trim(_.toString(_.get(item, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_ID)));
      return { ...(id ? { id } : {}), name: path.basename(_.toString(_.get(item, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_NAME))), dataUrl: _.toString(_.get(item, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_DATA_URL)) };
    })
    .filter((item) => VIDEO_EXPORT_AI_CLIP_REGEX.IMAGE_DATA_URL.test(item.dataUrl) && item.dataUrl.length <= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGE_BYTES * 2)
    .take(VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES)
    .value();
export const resolveAiClipPaths = async (rawIds: unknown): Promise<string[]> => {
  const clipIds = _.filter(_.map(_.isArray(rawIds) ? rawIds : [], _.toString), (clipId) => VIDEO_EXPORT_AI_CLIP_REGEX.CLIP_ID.test(clipId));
  const clipPaths = _.map(clipIds, getAiClipPath);
  const exists = await Promise.all(
    _.map(clipPaths, (clipPath) =>
      fs.promises.access(clipPath).then(
        () => true,
        () => false,
      ),
    ),
  );
  if (!_.every(exists)) throw new Error(VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_CLIP_MISSING);
  return clipPaths;
};
export const resolveAiClipAudioFlags = (rawIds: unknown, rawAudioIds: unknown): boolean[] => {
  const clipIds = _.filter(_.map(_.isArray(rawIds) ? rawIds : [], _.toString), (clipId) => VIDEO_EXPORT_AI_CLIP_REGEX.CLIP_ID.test(clipId));
  const audioIdSet = new Set(_.filter(_.map(_.isArray(rawAudioIds) ? rawAudioIds : [], _.toString), (clipId) => VIDEO_EXPORT_AI_CLIP_REGEX.CLIP_ID.test(clipId)));
  return _.map(clipIds, (clipId) => audioIdSet.has(clipId));
};
const toJobState = (job: AiClipJob): VideoExportAiClipJobState => ({ ..._.omit(job, [VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_CANCEL_REQUESTED]), stopping: job.cancelRequested && job.status === VideoExportAiClipJobStatus.RUNNING });
const generateClip = async (job: AiClipJob, input: VideoExportAiClipInput, prompt: string, params: StartAiClipJobParams): Promise<VideoExportAiClip> => {
  let lastError: string = VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_INVALID_VIDEO;
  for (const attempt of _.range(1, VIDEO_EXPORT_AI_CLIP_CONSTANTS.ATTEMPTS + 1)) {
    if (job.cancelRequested) break;
    const result = await generateImageWithPlaywright({
      prompt,
      retainBrowserSession: true,
      forceNewPage: false,
      visualConfig: {
        chromeHeadless: params.chromeHeadless,
        generateType: GenerateType.Video,
        aspectRatio: VIDEO_EXPORT_AI_CLIP_GEMINI_ASPECT[params.aspectRatio],
        generateCount: 1,
        imageGeneratorEngine: resolveAiClipEngine(params.provider, params.model),
        planningChatModel: params.model,
        generationMode: ImageGenerationMode.GeminiChat,
        promptInputMethod: PromptInputMethod.Paste,
        preserveVideoAudio: true,
        referenceImages: [input.dataUrl],
      },
    }).catch((error: unknown) => ({ success: false, base64: null, warning: _.toString(_.get(error, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_MESSAGE)) }));
    const buffer = result.success && result.base64 ? Buffer.from(_.replace(result.base64, VIDEO_EXPORT_AI_CLIP_REGEX.DATA_URL_PREFIX, ""), VIDEO_EXPORT_AI_CLIP_CONSTANTS.BASE64) : null;
    if (buffer && buffer.length >= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MIN_VIDEO_BYTES) {
      const clipId = randomUUID();
      const clipPath = getAiClipPath(clipId);
      await fs.promises.mkdir(path.dirname(clipPath), { recursive: true });
      await fs.promises.writeFile(clipPath, buffer);
      const durationSeconds = await probeMediaDurationSeconds(clipPath);
      if (durationSeconds > 0) {
        logger.log(VIDEO_EXPORT_AI_CLIP_LOG.ITEM_DONE(job.jobId, input.name, clipPath));
        return { id: clipId, ...(input.id ? { sourceImageId: input.id } : {}), name: input.name, url: `${VIDEO_EXPORT_AI_CLIP_CONSTANTS.URL_PREFIX}${clipId}${VIDEO_EXPORT_AI_CLIP_CONSTANTS.EXT_MP4}`, durationSeconds, keepAudio: false };
      }
      await fs.promises.rm(clipPath, { force: true }).catch(() => undefined);
      lastError = VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_INVALID_VIDEO;
    } else {
      lastError = _.toString(result.warning) || VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_INVALID_VIDEO;
    }
    logger.warn(VIDEO_EXPORT_AI_CLIP_LOG.ITEM_FAILED(job.jobId, input.name, attempt, lastError));
  }
  throw new Error(lastError);
};
const runAiClipJob = async (job: AiClipJob, params: StartAiClipJobParams): Promise<void> => {
  const prompt = buildAiClipPrompt(params.note);
  try {
    for (const [index, input] of params.inputs.entries()) {
      if (job.cancelRequested) break;
      job.message = VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_GENERATING(index + 1, job.total, input.name);
      try {
        const clip = await generateClip(job, input, prompt, params);
        if (job.cancelRequested) break;
        job.clips = [...job.clips, clip];
      } catch (error) {
        if (job.cancelRequested) break;
        const reason = _.toString(_.get(error, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_MESSAGE)) || VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_INVALID_VIDEO;
        job.errors = [...job.errors, VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.FAILED_ITEM(input.name, reason)];
        job.itemErrors = [...(job.itemErrors ?? []), { ...(input.id ? { imageId: input.id } : {}), name: input.name, reason }];
      }
      job.done = index + 1;
    }
    if (job.cancelRequested) _.assign(job, { status: VideoExportAiClipJobStatus.CANCELLED, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_CANCELLED });
    else if (_.isEmpty(job.clips)) _.assign(job, { status: VideoExportAiClipJobStatus.ERROR, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_ALL_FAILED });
    else if (!_.isEmpty(job.errors)) _.assign(job, { status: VideoExportAiClipJobStatus.COMPLETED, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_PARTIAL(job.clips.length, job.total, job.errors.length) });
    else _.assign(job, { status: VideoExportAiClipJobStatus.COMPLETED, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_DONE(job.clips.length, job.total) });
    logger.log(VIDEO_EXPORT_AI_CLIP_LOG.DONE(job.jobId, job.clips.length, job.total));
  } finally {
    if (activeAiClipJobId === job.jobId) activeAiClipJobId = null;
    setTimeout(() => aiClipJobs.delete(job.jobId), VIDEO_EXPORT_AI_CLIP_CONSTANTS.JOB_TTL_MS).unref();
  }
};
export const startAiClipJob = (params: StartAiClipJobParams): string => {
  if (activeAiClipJobId) throw new Error(VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_BUSY);
  if (_.isEmpty(params.inputs)) throw new Error(VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.ERR_NO_IMAGES);
  const jobId = randomUUID();
  const job: AiClipJob = { jobId, status: VideoExportAiClipJobStatus.RUNNING, done: 0, total: params.inputs.length, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_GENERATING(1, params.inputs.length, _.head(params.inputs)?.name || ""), clips: [], errors: [], cancelRequested: false };
  aiClipJobs.set(jobId, job);
  activeAiClipJobId = jobId;
  logger.log(VIDEO_EXPORT_AI_CLIP_LOG.START(jobId, params.inputs.length, !_.isEmpty(_.trim(params.note))));
  void runAiClipJob(job, params);
  return jobId;
};
export const getAiClipJobState = (jobId: string): VideoExportAiClipJobState | null => {
  const job = aiClipJobs.get(jobId);
  return job ? toJobState(job) : null;
};
export const cancelAiClipJob = (jobId: string): VideoExportAiClipJobState | null => {
  const job = aiClipJobs.get(jobId || activeAiClipJobId || "");
  if (!job) return null;
  if (job.status === VideoExportAiClipJobStatus.RUNNING) {
    _.assign(job, { cancelRequested: true, status: VideoExportAiClipJobStatus.CANCELLED, message: VIDEO_EXPORT_AI_CLIP_SERVER_TEXTS.MSG_CANCELLED });
    if (activeAiClipJobId === job.jobId) activeAiClipJobId = null;
    void cancelAllActiveMediaGeneration().catch(() => undefined);
  }
  return toJobState(job);
};
