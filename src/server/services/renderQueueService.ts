import _ from "lodash";
import { FFMPEG_RENDER_CONSTANTS, RENDER_QUEUE_CONFIG, REFACTOR_CONSTANTS } from "../../constants/index.js";
import { logger } from "../../lib/logger.js";
import { getRenderJobFromDb, getRenderJobsFromDb, saveRenderJobToDb } from "../utils/db.js";
import { FFmpegRenderOptions, renderFFmpegVideo } from "../utils/ffmpegRender.js";
import { LicenseService } from "./licenseService.js";
import { FeatureType, SecurityConstants, SecurityMessages } from "../../constants/security.js";

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface RenderJob {
  id: string;
  payload: FFmpegRenderOptions;
  status: JobStatus;
  progress: number;
  url?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  heartbeatAt?: Date;
  licenseKey?: string;
}

type StoredRenderJob = Omit<RenderJob, "createdAt" | "updatedAt" | "startedAt" | "completedAt" | "heartbeatAt"> & {
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  heartbeatAt?: string;
};

const MAX_STALE_JOB_AGE_MS = 10 * 60 * 1000;

const isPersistableAssetUrl = (value: unknown): boolean => {
  const source = _.trim(_.toString(value));
  return !_.isEmpty(source) && !_.startsWith(source, "data:") && !/^[A-Za-z0-9+/]{256,}={0,2}$/.test(source);
};

const createLightweightPayload = (payload: FFmpegRenderOptions): FFmpegRenderOptions => ({
  ..._.pick(payload, ["projectId", "quality", "aspectRatio", "subtitleMode", "autoMusicProfile", "preserveVideoAudio"]),
  globalAudioUrl: isPersistableAssetUrl(payload.globalAudioUrl) ? payload.globalAudioUrl : undefined,
  scenes: _.map(payload.scenes, (scene) => ({
    ..._.pick(scene, ["id", "duration", "text", "subtitle", "subtitleCues", "assetType", "cameraMotion", "effects", "lightingEffect", "transition", "shotPurpose", "sourceTrimStartSeconds", "sourceTrimEndSeconds"]),
    imageUrl: isPersistableAssetUrl(scene.imageUrl) ? scene.imageUrl : undefined,
    audioUrl: isPersistableAssetUrl(scene.audioUrl) ? scene.audioUrl : undefined,
  })),
  audioTracks: _.map(payload.audioTracks, (track) => _.pick(track, ["id", "type", "assetUrl", "startSeconds", "durationSeconds", "volumeDb", "fadeInSeconds", "fadeOutSeconds", "loop"])),
});

const hasRecoverablePersistedPayload = (job: RenderJob): boolean => _.every(job.payload?.scenes, (scene) => isPersistableAssetUrl(scene.imageUrl));

const hydrateRenderJob = (job: StoredRenderJob): RenderJob => ({
  ...job,
  createdAt: new Date(job.createdAt),
  updatedAt: new Date(job.updatedAt),
  startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
  completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
  heartbeatAt: job.heartbeatAt ? new Date(job.heartbeatAt) : undefined,
});

const createPublicRenderError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : _.toString(error);
  const sceneId = _.get(message.match(RENDER_QUEUE_CONFIG.SCENE_ID_PATTERN), SecurityConstants.DEFAULT_AMOUNT, RENDER_QUEUE_CONFIG.UNKNOWN_SCENE_ID);
  return RENDER_QUEUE_CONFIG.PUBLIC_ERROR_TEMPLATE.replace("{sceneId}", sceneId);
};

class RenderQueueService {
  private queue: RenderJob[] = [];
  private isProcessing = false;
  private jobsMap = new Map<string, RenderJob>();
  private initialized = false;
  private abortControllers = new Map<string, AbortController>();

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const storedJobs = await getRenderJobsFromDb<StoredRenderJob>();
    const now = Date.now();

    _.forEach(storedJobs, (storedJob) => {
      const job = hydrateRenderJob(storedJob);
      const isRecoverable = _.some(RENDER_QUEUE_CONFIG.RECOVERABLE_STATUSES, (status) => _.isEqual(status, job.status));
      if (isRecoverable) {
        const jobAge = _.subtract(now, job.createdAt.getTime());
        if (_.gt(jobAge, MAX_STALE_JOB_AGE_MS) || _.isEqual(job.status, JobStatus.PROCESSING) || !hasRecoverablePersistedPayload(job)) {
          job.status = JobStatus.CANCELLED;
          job.error = RENDER_QUEUE_CONFIG.CANCELLED_ERROR;
          void this.persist(job);
        } else {
          job.status = JobStatus.PENDING;
          job.error = undefined;
          this.queue.push(job);
        }
      }
      this.jobsMap.set(job.id, job);
    });
    this.initialized = true;
    void this.processQueue();
  }

  public async addJob(jobId: string, payload: FFmpegRenderOptions, licenseKey?: string): Promise<RenderJob> {
    await this.initialize();
    for (const [activeJobId, controller] of this.abortControllers) {
      const activeJob = this.jobsMap.get(activeJobId);
      if (activeJob && _.isEqual(activeJob.status, JobStatus.PROCESSING)) {
        activeJob.status = JobStatus.CANCELLED;
        activeJob.error = RENDER_QUEUE_CONFIG.CANCELLED_ERROR;
        activeJob.completedAt = new Date();
        activeJob.updatedAt = activeJob.completedAt;
        controller.abort();
        await this.persist(activeJob);
      }
    }
    this.queue = _.reject(this.queue, (pendingJob) => {
      pendingJob.status = JobStatus.CANCELLED;
      pendingJob.error = RENDER_QUEUE_CONFIG.CANCELLED_ERROR;
      pendingJob.completedAt = new Date();
      pendingJob.updatedAt = pendingJob.completedAt;
      void this.persist(pendingJob);
      return true;
    });
    const targetProjectId = payload.projectId;
    if (targetProjectId) {
      this.queue = _.reject(this.queue, (pendingJob) => {
        if (_.isEqual(pendingJob.payload.projectId, targetProjectId)) {
          pendingJob.status = JobStatus.CANCELLED;
          pendingJob.error = RENDER_QUEUE_CONFIG.CANCELLED_ERROR;
          void this.persist(pendingJob);
          return true;
        }
        return false;
      });
    }

    const now = new Date();
    const job: RenderJob = {
      id: jobId,
      payload,
      status: JobStatus.PENDING,
      progress: SecurityConstants.ZERO,
      createdAt: now,
      updatedAt: now,
      licenseKey,
    };
    this.queue.push(job);
    this.jobsMap.set(jobId, job);
    await this.persist(job);
    logger.info(REFACTOR_CONSTANTS.RENDER_LOG_ADDED.replace(SecurityConstants.PLACEHOLDER_0, jobId).replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.size(this.queue))));
    void this.processQueue();
    return job;
  }

  public async getJob(jobId: string): Promise<RenderJob | undefined> {
    await this.initialize();
    const memoryJob = this.jobsMap.get(jobId);
    if (memoryJob) return memoryJob;
    const storedJob = await getRenderJobFromDb<StoredRenderJob>(jobId);
    if (!storedJob) return undefined;
    const job = hydrateRenderJob(storedJob);
    this.jobsMap.set(jobId, job);
    return job;
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || _.includes([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED], job.status)) return false;
    job.status = JobStatus.CANCELLED;
    job.error = RENDER_QUEUE_CONFIG.CANCELLED_ERROR;
    job.completedAt = new Date();
    job.updatedAt = job.completedAt;
    this.abortControllers.get(jobId)?.abort();
    this.queue = _.reject(this.queue, { id: jobId });
    await this.persist(job);
    return true;
  }

  private async persist(job: RenderJob): Promise<void> {
    await saveRenderJobToDb({ ...job, payload: createLightweightPayload(job.payload) });
  }

  private async executeRenderWithRetries(job: RenderJob, abortSignal: AbortSignal, onProgressUpdate: (progress: number) => void): Promise<string> {
    let lastError: unknown;
    for (let attempt = SecurityConstants.ZERO; attempt < FFMPEG_RENDER_CONSTANTS.MAX_RENDER_ATTEMPTS; attempt = _.add(attempt, SecurityConstants.DEFAULT_AMOUNT)) {
      try {
        return await renderFFmpegVideo(
          {
            ...job.payload,
            safeProfile: _.isEqual(attempt, FFMPEG_RENDER_CONSTANTS.SAFE_PROFILE_ATTEMPT),
          },
          onProgressUpdate,
          abortSignal,
        );
      } catch (error) {
        lastError = error;
        if (_.lt(attempt, FFMPEG_RENDER_CONSTANTS.SAFE_PROFILE_ATTEMPT)) {
          logger.warn(RENDER_QUEUE_CONFIG.RETRY_WARNING, error);
        }
      }
    }
    throw lastError;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || _.isEmpty(this.queue)) return;
    this.isProcessing = true;
    const job = this.queue.shift()!;
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.updatedAt = job.startedAt;
    job.heartbeatAt = job.startedAt;
    await this.persist(job);
    let lastPersistedAt = Date.now();
    const abortController = new AbortController();
    this.abortControllers.set(job.id, abortController);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const renderPromise = this.executeRenderWithRetries(job, abortController.signal, (progress) => {
        if (_.isEqual(job.status, JobStatus.CANCELLED)) return;
        job.progress = progress;
        job.heartbeatAt = new Date();
        job.updatedAt = job.heartbeatAt;
        if (_.gte(_.subtract(Date.now(), lastPersistedAt), RENDER_QUEUE_CONFIG.PROGRESS_PERSIST_INTERVAL_MS)) {
          lastPersistedAt = Date.now();
          void this.persist(job);
        }
      });

      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error(RENDER_QUEUE_CONFIG.TIMEOUT_ERROR));
        }, RENDER_QUEUE_CONFIG.JOB_TIMEOUT_MS);
      });

      const url = await Promise.race([renderPromise, timeoutPromise]);
      if (_.isEqual(job.status, JobStatus.CANCELLED)) return;
      job.url = url;
      if (!_.isEmpty(job.licenseKey)) {
        try {
          await LicenseService.incrementUsage(job.licenseKey, FeatureType.VIDEO, SecurityConstants.DEFAULT_AMOUNT);
        } catch (error) {
          logger.error(SecurityMessages.USAGE_UPDATE_ERROR, error);
        }
      }
      job.status = JobStatus.COMPLETED;
      job.progress = REFACTOR_CONSTANTS.RENDER_PROGRESS_COMPLETE;
      job.completedAt = new Date();
      job.updatedAt = job.completedAt;
      await this.persist(job);
    } catch (error: unknown) {
      if (!_.isEqual(job.status, JobStatus.CANCELLED)) {
        job.status = JobStatus.FAILED;
        job.error = createPublicRenderError(error);
        job.completedAt = new Date();
        job.updatedAt = job.completedAt;
        await this.persist(job);
        logger.error(REFACTOR_CONSTANTS.RENDER_LOG_FAILED.replace(SecurityConstants.PLACEHOLDER_0, job.id).replace(SecurityConstants.PLACEHOLDER_1, job.error), error);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      this.abortControllers.delete(job.id);
      this.isProcessing = false;
      void this.processQueue();
    }
  }
}

export const renderQueueService = new RenderQueueService();
