import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pickMotionSaveFile } from "../../../motion/server/controllers/motionVideoController.js";
import { BORNAS_ERROR } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasJobSummary, BornasStepId } from "../../types/bornas.js";
import { annotateLibrary, approveBornas, bornasLibraryAnnotation, cancelBornas, inspectBornasSource, rerunBornas, startBornas } from "../services/bornasPipeline.js";
import { deleteBornasJobs, getBornasJob, listBornasJobs } from "../services/bornasStore.js";
const fail = (res: Response, status: number, error: unknown): void => void res.status(status).json({ success: false, error: String((error as Error)?.message || error) });
const view = (job: BornasJob) => ({ ...job, analysis: job.analysis ? { ...job.analysis, transcript: "" } : undefined, videos: job.videos.map(({ words: _words, lineStarts: _starts, ...v }) => v) });
export const bornasSourceController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, sample: await inspectBornasSource(String(req.body?.path || "")) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasStartController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, job: view(await startBornas({ path: req.body?.path, channel: req.body?.channel, ai: req.body?.ai })) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasStatusController = (req: Request, res: Response): void => {
  const job = getBornasJob(String(req.params.jobId || ""));
  if (!job) return fail(res, 404, BORNAS_ERROR.NO_JOB);
  res.json({ success: true, job: view(job) });
};
export const bornasApproveController = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, job: view(approveBornas(String(req.body?.jobId || ""), req.body?.scripts)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasRerunController = (req: Request, res: Response): void => {
  try {
    const video = req.body?.video === undefined || req.body?.video === null ? undefined : Number(req.body.video);
    res.json({ success: true, job: view(rerunBornas(String(req.body?.jobId || ""), req.body?.step as BornasStepId, Number.isFinite(video) ? video : undefined, req.body?.ai)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasCancelController = (req: Request, res: Response): void => {
  const job = cancelBornas(String(req.body?.jobId || ""));
  res.json({ success: true, job: job ? view(job) : null });
};
export const bornasJobsController = (_req: Request, res: Response): void => {
  const jobs: BornasJobSummary[] = listBornasJobs().map((job) => ({ id: job.id, channelId: job.channel.id, channelName: job.channel.name, status: job.status, updatedAt: job.updatedAt, videos: job.videos.map(({ index, title, status, seconds, outputUrl, previewUrl, sheetUrl }) => ({ index, title, status, seconds, outputUrl, previewUrl, sheetUrl })) }));
  res.json({ success: true, jobs });
};
export const bornasDeleteController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, ...(await deleteBornasJobs(req.body?.ids)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasSaveVideoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = getBornasJob(String(req.body?.jobId || ""));
    const video = job?.videos.find((v) => v.index === Number(req.body?.video));
    if (!video?.outputFile || !fs.existsSync(video.outputFile)) throw new Error(BORNAS_ERROR.NO_OUTPUT);
    const target = await pickMotionSaveFile(
      `${
        video.title
          .replace(/[\\/:*?"<>|]+/g, " ")
          .trim()
          .slice(0, 80) || path.basename(video.outputFile, ".mp4")
      }.mp4`,
    );
    if (!target) return void res.json({ success: true, cancelled: true });
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(video.outputFile, target);
    res.json({ success: true, savedPath: target });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const bornasAnnotateController = (req: Request, res: Response): void => {
  const lib = String(req.body?.lib || req.query.lib || "");
  if (!/^[a-z0-9_-]+$/.test(lib)) return fail(res, 400, BORNAS_ERROR.BAD_REQUEST);
  if (req.method === "GET") return void res.json({ success: true, run: bornasLibraryAnnotation(lib) });
  res.json({ success: true, started: annotateLibrary(lib, req.body?.ai) });
};
