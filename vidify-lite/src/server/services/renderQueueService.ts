import { renderFFmpegVideo, FFmpegRenderOptions } from "../utils/ffmpegRender.js";
import { logger } from "../../lib/logger.js";
import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../../constants/index.js";
import { LicenseService } from "./licenseService.js";
import { FeatureType, SecurityConstants, SecurityMessages } from "../../constants/security.js";

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface RenderJob {
  id: string;
  payload: FFmpegRenderOptions;
  status: JobStatus;
  progress: number;
  url?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  licenseKey?: string;
}

class RenderQueueService {
  private queue: RenderJob[] = [];
  private isProcessing = false;
  private jobsMap = new Map<string, RenderJob>();

  public addJob(jobId: string, payload: FFmpegRenderOptions, licenseKey?: string): RenderJob {
    const job: RenderJob = {
      id: jobId,
      payload,
      status: JobStatus.PENDING,
      progress: _.get(REFACTOR_CONSTANTS, 'ZERO', 0),
      createdAt: new Date(),
      licenseKey,
    };
    this.queue.push(job);
    this.jobsMap.set(jobId, job);
    
    logger.info(
      REFACTOR_CONSTANTS.RENDER_LOG_ADDED
        .replace("{0}", jobId)
        .replace("{1}", String(this.queue.length))
    );
    this.processQueue();
    return job;
  }

  public getJob(jobId: string): RenderJob | undefined {
    return this.jobsMap.get(jobId);
  }

  private async processQueue() {
    if (this.isProcessing) return;
    if (_.isEmpty(this.queue)) return;

    this.isProcessing = true;
    const job = this.queue.shift()!;
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    
    logger.info(
      REFACTOR_CONSTANTS.RENDER_LOG_PROCESSING
        .replace("{0}", job.id)
    );

    let progressTimer: NodeJS.Timeout | null = null;
    const MAX_PROGRESS = 95;
    const PROGRESS_STEP = 5;

    try {
      progressTimer = setInterval(() => {
        if (_.eq(job.status, JobStatus.PROCESSING) && _.lt(job.progress, MAX_PROGRESS)) {
          job.progress += PROGRESS_STEP;
        }
      }, REFACTOR_CONSTANTS.POLLING_INTERVAL_MS);

      const url = await renderFFmpegVideo(job.payload);
      
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      job.status = JobStatus.COMPLETED;
      job.progress = 100;
      job.url = url;
      job.completedAt = new Date();

      if (!_.isEmpty(job.licenseKey)) {
        try {
          await LicenseService.incrementUsage(job.licenseKey, FeatureType.VIDEO, SecurityConstants.DEFAULT_AMOUNT);
        } catch (e) {
          logger.error(SecurityMessages.USAGE_UPDATE_ERROR, e);
        }
      }
      
      logger.info(
        REFACTOR_CONSTANTS.RENDER_LOG_COMPLETED
          .replace("{0}", job.id)
          .replace("{1}", url)
      );
    } catch (error: any) {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
      job.status = JobStatus.FAILED;
      job.error = error?.message || REFACTOR_CONSTANTS.RENDER_ERR_DEFAULT;
      job.completedAt = new Date();
      
      logger.error(
        REFACTOR_CONSTANTS.RENDER_LOG_FAILED
          .replace("{0}", job.id)
          .replace("{1}", job.error),
        error
      );
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}

export const renderQueueService = new RenderQueueService();
