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
      progress: SecurityConstants.ZERO,
      createdAt: new Date(),
      licenseKey,
    };
    this.queue.push(job);
    this.jobsMap.set(jobId, job);
    
    logger.info(
      REFACTOR_CONSTANTS.RENDER_LOG_ADDED
        .replace(SecurityConstants.PLACEHOLDER_0, jobId)
        .replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.size(this.queue)))
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
        .replace(SecurityConstants.PLACEHOLDER_0, job.id)
    );

    try {
      const url = await renderFFmpegVideo(job.payload, (progress) => {
        job.progress = progress;
      });

      job.url = url;

      if (!_.isEmpty(job.licenseKey)) {
        try {
          await LicenseService.incrementUsage(job.licenseKey, FeatureType.VIDEO, SecurityConstants.DEFAULT_AMOUNT);
        } catch (e) {
          logger.error(SecurityMessages.USAGE_UPDATE_ERROR, e);
        }
      }

      job.status = JobStatus.COMPLETED;
      job.progress = REFACTOR_CONSTANTS.RENDER_PROGRESS_COMPLETE;
      job.completedAt = new Date();
      
      logger.info(
        REFACTOR_CONSTANTS.RENDER_LOG_COMPLETED
          .replace(SecurityConstants.PLACEHOLDER_0, job.id)
          .replace(SecurityConstants.PLACEHOLDER_1, url)
      );
    } catch (error: any) {
      job.status = JobStatus.FAILED;
      job.error = _.defaultTo(error?.message, REFACTOR_CONSTANTS.RENDER_ERR_DEFAULT);
      job.completedAt = new Date();
      
      logger.error(
        REFACTOR_CONSTANTS.RENDER_LOG_FAILED
          .replace(SecurityConstants.PLACEHOLDER_0, job.id)
          .replace(SecurityConstants.PLACEHOLDER_1, job.error),
        error
      );
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}

export const renderQueueService = new RenderQueueService();
