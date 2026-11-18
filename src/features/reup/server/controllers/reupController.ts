import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { pickMotionSaveFile } from "../../../motion/server/controllers/motionVideoController.js";
import { pickVideoExportFolder } from "../../../video-export/server/services/videoExportScanService.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
import type { ReupJob, ReupPresetId, ReupStepId } from "../../types/reup.js";
import { REUP_PRESETS } from "../../constants/reupPresets.js";
import { reupMusicDir, reupTracks } from "../services/reupMusicService.js";
import { deleteReupJobs, getReupJob, listReupJobs } from "../services/reupJobStore.js";
import { inspectReupSource, reupFrame } from "../services/reupMediaService.js";
import { approveReupScript, cancelReup, exportReup, rerunReup, startReup } from "../services/reupPipeline.js";
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
    res.json({ success: true, job: view(await startReup({ path: String(req.body?.path || ""), preset: req.body?.preset, settings: req.body?.settings, rights: req.body?.rights })) });
  } catch (error) {
    fail(res, 400, error);
  }
};
/** The music library: its folder and the tracks of one video type (names only; files play through reupTrackFileController). */
export const reupTracksController = (req: Request, res: Response): void => {
  const preset = String(req.query.preset || "");
  res.json({ success: true, dir: reupMusicDir(), tracks: reupTracks(REUP_PRESETS.some((p) => p.id === preset) ? (preset as ReupPresetId) : undefined).map((t) => ({ name: t.name, preset: t.preset })) });
};
/** Play one library track (only names the library lists). */
export const reupTrackFileController = (req: Request, res: Response): void => {
  const track = reupTracks().find((t) => t.name === String(req.query.name || ""));
  if (!track) return fail(res, 404, REUP_ERROR.NO_TRACK);
  res.sendFile(track.file);
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
export const exportReupController = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, job: view(exportReup(String(req.body?.jobId || ""), req.body?.settings)) });
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
/** Delete runs and their files (Results tab). */
export const deleteReupJobsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, ...(await deleteReupJobs(req.body?.ids)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
/** Save an edited video where the user picks, through Video Motion's "Save as" dialog. */
export const saveReupVideoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = getReupJob(String(req.body?.jobId || ""));
    const output = job?.outputs.find((o) => o.id === String(req.body?.outputId || ""));
    if (!output || !fs.existsSync(output.file)) throw new Error(REUP_ERROR.NO_OUTPUT);
    const target = await pickMotionSaveFile(path.basename(output.file));
    if (!target) return void res.json({ success: true, cancelled: true });
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(output.file, target);
    res.json({ success: true, savedPath: target });
  } catch (error) {
    fail(res, 400, error);
  }
};
