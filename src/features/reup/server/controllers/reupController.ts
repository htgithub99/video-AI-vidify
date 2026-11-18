import type { Request, Response } from "express";
import _ from "lodash";
import { pickVideoExportFolder } from "../../../video-export/server/services/videoExportScanService.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
import type { ReupJob, ReupStepId } from "../../types/reup.js";
import { getReupJob, listReupJobs } from "../services/reupJobStore.js";
import { inspectReupSource, reupFrame } from "../services/reupMediaService.js";
import { approveReupScript, cancelReup, rerunReup, startReup } from "../services/reupPipeline.js";
const fail = (res: Response, status: number, error: unknown): void => void res.status(status).json({ success: false, error: String((error as Error)?.message || error) });
/** The client needs everything except local file paths of intermediate files. */
const view = (job: ReupJob) => ({ ...job, sheets: job.sheets.map(({ file: _file, ...sheet }) => sheet), voices: undefined, transcript: job.transcript ? { text: job.transcript.text, words: [], phrases: [] } : undefined });
export const inspectReupSourceController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, source: await inspectReupSource(String(req.body?.path || "")) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const startReupController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, job: view(await startReup({ path: String(req.body?.path || ""), preset: req.body?.preset, settings: req.body?.settings, licensed: req.body?.licensed === true })) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const reupStatusController = (req: Request, res: Response): void => {
  const job = getReupJob(String(req.params.jobId || ""));
  if (!job) return fail(res, 404, REUP_ERROR.NO_JOB);
  res.json({ success: true, job: view(job) });
};
export const approveReupScriptController = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, job: view(approveReupScript(String(req.body?.jobId || ""), req.body?.script)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const rerunReupController = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, job: view(rerunReup(String(req.body?.jobId || ""), req.body?.step as ReupStepId, req.body?.settings)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const cancelReupController = (req: Request, res: Response): void => {
  const job = cancelReup(String(req.body?.jobId || ""));
  res.json({ success: true, job: job ? view(job) : null });
};
export const reupFrameController = async (req: Request, res: Response): Promise<void> => {
  const job = getReupJob(String(req.params.jobId || ""));
  const time = Number(req.query.t);
  if (!job || !Number.isFinite(time)) return fail(res, 404, REUP_ERROR.NO_JOB);
  try {
    res.sendFile(await reupFrame(job.id, job.source, _.clamp(time, 0, Math.max(0, job.source.duration - 0.1)), Number(req.query.w) === 1280 ? 1280 : 480));
  } catch (error) {
    fail(res, 500, error);
  }
};
export const pickReupFolderController = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, folderPath: await pickVideoExportFolder() });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const listReupJobsController = (_req: Request, res: Response): void => {
  res.json({ success: true, jobs: listReupJobs().map((job) => ({ id: job.id, name: job.source.name, preset: job.preset, status: job.status, updatedAt: job.updatedAt, outputs: job.outputs.map(({ id, url, duration, width, height }) => ({ id, url, duration, width, height })), packageDir: job.packageDir })) });
};
