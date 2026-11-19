import fs from "fs";
import path from "path";
import _ from "lodash";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { deleteOutputEntries, type OutputDeleteResult } from "../../../../server/utils/outputFiles.js";
import { logger } from "../../../../lib/logger.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { REUP_DIR, REUP_LIMITS, REUP_STEPS } from "../../constants/reupConfig.js";
import { reupPresetDefaults, reupPresetRules } from "../../constants/reupPresets.js";
import { reupStripToolNotes } from "../../lib/reupSeo.js";
import { reupMusicChoice } from "../../lib/reupSettings.js";
import { REUP_LOG } from "../../constants/reupServerText.js";
import type { ReupJob, ReupLog, ReupStepId, ReupStepState } from "../../types/reup.js";
interface Entry {
  job: ReupJob;
  controller?: AbortController;
  timer?: ReturnType<typeof setTimeout>;
}
const entries = new Map<string, Entry>();
const ID_RE = /^[a-z0-9-]{8,64}$/i;
export const reupRoot = (): string => path.join(getDataDirectory(), REUP_DIR.OUTPUT, REUP_DIR.ROOT);
export const reupJobDir = (id: string, ...parts: string[]): string => {
  if (!ID_RE.test(id)) throw new Error(id);
  const dir = path.join(reupRoot(), id, ...parts);
  fs.mkdirSync(parts.length && path.extname(_.last(parts) || "") ? path.dirname(dir) : dir, { recursive: true });
  return dir;
};
export const reupFileUrl = (file: string): string => REUP_DIR.ASSETS_URL + path.relative(reupRoot(), file).split(path.sep).map(encodeURIComponent).join("/");
export const reupEmptySteps = (): Record<ReupStepId, ReupStepState> => Object.fromEntries(REUP_STEPS.map((id) => [id, { status: "idle", progress: 0, message: "" }])) as Record<ReupStepId, ReupStepState>;
const writeNow = (entry: Entry): void => {
  clearTimeout(entry.timer);
  entry.timer = undefined;
  try {
    const file = reupJobDir(entry.job.id, REUP_DIR.JOB_FILE);
    fs.writeFileSync(file + ".tmp", stringifyJson(entry.job));
    fs.renameSync(file + ".tmp", file);
  } catch (error) {
    logger.warn(String((error as Error)?.message || error));
  }
};
export const saveReupJob = (job: ReupJob, now = false): void => {
  const entry = entries.get(job.id) || { job };
  entries.set(job.id, entry);
  entry.job = job;
  job.updatedAt = Date.now();
  if (now) writeNow(entry);
  else entry.timer ||= setTimeout(() => writeNow(entry), 800);
};
export const getReupJob = (id: string): ReupJob | undefined => {
  if (!ID_RE.test(id)) return undefined;
  const live = entries.get(id);
  if (live) return live.job;
  const file = path.join(reupRoot(), id, REUP_DIR.JOB_FILE);
  if (!fs.existsSync(file)) return undefined;
  const job = parseJson(fs.readFileSync(file, "utf8")) as ReupJob | null;
  if (!job?.id) return undefined;
  if ((job.status as string) === "waiting-package") job.status = "done";
  if (job.package && !job.package.options) job.package = undefined;
  for (const option of job.package?.options || []) option.description = reupStripToolNotes(option.description || "");
  job.rights ||= "licensed";
  job.settings = { ...reupPresetRules(job.preset), ...job.settings, angle: job.settings.angle ?? "", encoder: job.settings.encoder ?? "auto", highlights: job.settings.highlights ?? reupPresetDefaults(job.preset).highlights, music: reupMusicChoice(job.settings.music, (job.settings as { musicMood?: string }).musicMood, "off") };
  if (job.status === "running") {
    for (const step of REUP_STEPS) if (job.steps[step]?.status === "running") job.steps[step] = { ...job.steps[step], status: "error", message: REUP_LOG.INTERRUPTED };
    job.status = "error";
    job.error = REUP_LOG.INTERRUPTED;
  }
  entries.set(id, { job });
  return job;
};
export const reupLog = (job: ReupJob, text: string, level: ReupLog["level"] = "info"): void => {
  const step = REUP_STEPS.find((id) => job.steps[id]?.status === "running");
  job.logs.push({ at: Date.now(), text, level, ...(step ? { step } : {}) });
  if (job.logs.length > REUP_LIMITS.LOGS) job.logs.splice(0, job.logs.length - REUP_LIMITS.LOGS);
  if (level === "warn" && !job.warnings.includes(text)) job.warnings.push(text);
  saveReupJob(job);
};
export const reupStep = (job: ReupJob, step: ReupStepId, patch: Partial<ReupStepState>): void => {
  job.steps[step] = { ...job.steps[step], ...patch };
  saveReupJob(job);
};
export const reupController = (id: string): AbortController | undefined => entries.get(id)?.controller;
export const setReupController = (id: string, controller?: AbortController): void => {
  const entry = entries.get(id);
  if (entry) entry.controller = controller;
};
const limitFile = (): string => path.join(reupRoot(), REUP_DIR.LIMIT_FILE);
export const readReupUploadLimits = (): Record<string, number> => {
  try {
    return (parseJson(fs.readFileSync(limitFile(), "utf8")) as Record<string, number>) || {};
  } catch {
    return {};
  }
};
export const learnReupUploadLimit = (provider: string, limit: number): void => {
  fs.mkdirSync(reupRoot(), { recursive: true });
  fs.writeFileSync(limitFile(), stringifyJson({ ...readReupUploadLimits(), [provider]: limit }));
};
export const deleteReupJobs = async (ids: unknown): Promise<OutputDeleteResult> => {
  const list = _.uniq(_.castArray(ids ?? []).map((id) => _.toString(id))).filter((id) => ID_RE.test(id));
  const running = list.filter((id) => entries.get(id)?.job.status === "running");
  const gone = _.difference(list, running);
  for (const id of gone) {
    clearTimeout(entries.get(id)?.timer);
    entries.delete(id);
  }
  const result = await deleteOutputEntries(reupRoot(), gone);
  return { freedBytes: result.freedBytes, failed: [...running, ...result.failed] };
};
export const listReupJobs = (limit = Infinity): ReupJob[] => {
  const root = reupRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && ID_RE.test(d.name) && fs.existsSync(path.join(root, d.name, REUP_DIR.JOB_FILE)))
    .map((d) => getReupJob(d.name))
    .filter((job): job is ReupJob => !!job)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
};
