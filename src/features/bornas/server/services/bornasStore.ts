import fs from "fs";
import path from "path";
import _ from "lodash";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { deleteOutputEntries, type OutputDeleteResult } from "../../../../server/utils/outputFiles.js";
import { logger } from "../../../../lib/logger.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { motionLanguageCode } from "../../../../lib/motionLanguage.js";
import { BORNAS_DIR, BORNAS_LIMITS, BORNAS_STATE, BORNAS_STEPS, bornasAiSettings, bornasDoneList, bornasGenre, bornasHeroName, bornasMusicChoice } from "../../constants/bornasConfig.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasChannel, BornasJob, BornasLog, BornasState, BornasStepId, BornasStepState } from "../../types/bornas.js";
interface Entry {
  job: BornasJob;
  controller?: AbortController;
  timer?: ReturnType<typeof setTimeout>;
}
const entries = new Map<string, Entry>();
const ID_RE = /^[a-z0-9-]{8,64}$/i;
export const bornasRoot = (): string => path.join(getDataDirectory(), BORNAS_DIR.OUTPUT, BORNAS_DIR.ROOT);
export const bornasDir = (id: string, ...parts: string[]): string => {
  if (!ID_RE.test(id) && id !== BORNAS_DIR.SAMPLES) throw new Error(id);
  const dir = path.join(bornasRoot(), id, ...parts);
  fs.mkdirSync(parts.length && path.extname(_.last(parts) || "") ? path.dirname(dir) : dir, { recursive: true });
  return dir;
};
export const bornasUrl = (file: string): string => BORNAS_DIR.ASSETS_URL + path.relative(bornasRoot(), file).split(path.sep).map(encodeURIComponent).join("/");
export const bornasEmptySteps = (): Record<BornasStepId, BornasStepState> => Object.fromEntries(BORNAS_STEPS.map((id) => [id, { status: "idle", progress: 0, message: "" }])) as Record<BornasStepId, BornasStepState>;
const writeNow = (entry: Entry): void => {
  clearTimeout(entry.timer);
  entry.timer = undefined;
  try {
    const file = bornasDir(entry.job.id, BORNAS_DIR.JOB_FILE);
    fs.writeFileSync(file + ".tmp", stringifyJson(entry.job));
    fs.renameSync(file + ".tmp", file);
  } catch (error) {
    logger.warn(String((error as Error)?.message || error));
  }
};
export const saveBornasJob = (job: BornasJob, now = false): void => {
  const entry = entries.get(job.id) || { job };
  entries.set(job.id, entry);
  entry.job = job;
  job.updatedAt = Date.now();
  if (now) writeNow(entry);
  else entry.timer ||= setTimeout(() => writeNow(entry), 800);
};
export const getBornasJob = (id: string): BornasJob | undefined => {
  if (!ID_RE.test(id)) return undefined;
  const live = entries.get(id);
  if (live) return live.job;
  const file = path.join(bornasRoot(), id, BORNAS_DIR.JOB_FILE);
  if (!fs.existsSync(file)) return undefined;
  const job = parseJson(fs.readFileSync(file, "utf8")) as BornasJob | null;
  if (!job?.id) return undefined;
  job.ai = bornasAiSettings(job.ai);
  job.steps = { ...bornasEmptySteps(), ...job.steps };
  if (job.status === "running") {
    job.resumeStep = BORNAS_STEPS.find((step) => job.steps[step]?.status === "running");
    for (const step of BORNAS_STEPS) if (job.steps[step]?.status === "running") job.steps[step] = { ...job.steps[step], status: "error", message: BORNAS_LOG.INTERRUPTED };
    for (const video of job.videos) if (video.status === "running") video.status = "error";
    job.status = "error";
    job.error = BORNAS_LOG.INTERRUPTED;
  }
  entries.set(id, { job });
  return job;
};
export const bornasLog = (job: BornasJob, text: string, level: BornasLog["level"] = "info", video?: number): void => {
  const step = BORNAS_STEPS.find((id) => job.steps[id]?.status === "running");
  job.logs.push({ at: Date.now(), text, level, ...(step ? { step } : {}), ...(video !== undefined ? { video } : {}) });
  if (job.logs.length > BORNAS_LIMITS.LOGS) job.logs.splice(0, job.logs.length - BORNAS_LIMITS.LOGS);
  if (level === "warn" && !job.warnings.includes(text)) job.warnings.push(text);
  saveBornasJob(job);
};
export const bornasStep = (job: BornasJob, step: BornasStepId, patch: Partial<BornasStepState>): void => {
  job.steps[step] = { ...job.steps[step], ...patch };
  saveBornasJob(job);
};
export const bornasController = (id: string): AbortController | undefined => entries.get(id)?.controller;
export const setBornasController = (id: string, controller?: AbortController): void => {
  const entry = entries.get(id);
  if (entry) entry.controller = controller;
};
export const listBornasJobs = (limit = Infinity): BornasJob[] => {
  const root = bornasRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && ID_RE.test(d.name) && fs.existsSync(path.join(root, d.name, BORNAS_DIR.JOB_FILE)))
    .map((d) => getBornasJob(d.name))
    .filter((job): job is BornasJob => !!job)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
};
export const deleteBornasJobs = async (ids: unknown): Promise<OutputDeleteResult> => {
  const list = _.uniq(_.castArray(ids ?? []).map((id) => _.toString(id))).filter((id) => ID_RE.test(id));
  const running = list.filter((id) => entries.get(id)?.job.status === "running");
  const gone = _.difference(list, running);
  for (const id of gone) {
    clearTimeout(entries.get(id)?.timer);
    entries.delete(id);
  }
  const result = await deleteOutputEntries(bornasRoot(), gone);
  return { freedBytes: result.freedBytes, failed: [...running, ...result.failed] };
};
export const deleteBornasVideos = async (items: unknown): Promise<OutputDeleteResult> => {
  const list = (Array.isArray(items) ? items : []).map((it) => ({ jobId: _.toString(_.get(it, "jobId")), video: Number(_.get(it, "video")) })).filter((it) => ID_RE.test(it.jobId) && Number.isInteger(it.video));
  const failed: string[] = [];
  const emptyJobs: string[] = [];
  let freedBytes = 0;
  for (const [jobId, group] of Object.entries(_.groupBy(list, "jobId"))) {
    const job = getBornasJob(jobId);
    if (!job || job.status === "running") {
      failed.push(...group.map((it) => `${jobId}:${it.video}`));
      continue;
    }
    for (const it of group) {
      const video = job.videos.find((v) => v.index === it.video);
      if (!video) continue;
      for (const file of _.compact([video.outputFile, video.outputFile && path.join(path.dirname(video.outputFile), BORNAS_DIR.PREVIEW)])) {
        try {
          if (fs.existsSync(file)) {
            freedBytes += fs.statSync(file).size;
            fs.rmSync(file, { force: true });
          }
        } catch {
          failed.push(`${jobId}:${it.video}`);
        }
      }
      Object.assign(video, { outputFile: undefined, outputUrl: undefined, previewUrl: undefined });
    }
    if (!job.videos.some((v) => v.outputUrl)) emptyJobs.push(jobId);
    else saveBornasJob(job);
  }
  if (emptyJobs.length) {
    const res = await deleteBornasJobs(emptyJobs);
    freedBytes += res.freedBytes || 0;
  }
  return { freedBytes, failed };
};
export const cleanBornasChannel = (raw: Partial<BornasChannel> | undefined): BornasChannel => {
  if (!raw?.id) throw new Error(BORNAS_ERROR.NO_CHANNEL);
  return {
    id: String(raw.id),
    name: String(raw.name || raw.id).slice(0, 80),
    topic: raw.topic || "world",
    voiceChannel: String(raw.voiceChannel || ""),
    language: motionLanguageCode(raw.language),
    genre: bornasGenre(raw.genre),
    music: bornasMusicChoice(raw.music),
    count: _.clamp(Math.round(Number(raw.count) || 1), 1, 10),
    seconds: _.clamp(Math.round(Number(raw.seconds) || 120), 30, 1200),
    review: raw.review === true,
    short: raw.short !== false,
    done: bornasDoneList(raw.done),
    ...(raw.sample ? { sample: String(raw.sample) } : {}),
  };
};
const stateFile = (): string => path.join(getDataDirectory(), BORNAS_STATE.FILE);
const writeState = (raw: Partial<BornasState>, save = true): BornasState => {
  const channels = (Array.isArray(raw.channels) ? raw.channels : []).filter((c) => c?.id).slice(0, BORNAS_STATE.CHANNELS_MAX).map(cleanBornasChannel);
  const state: BornasState = { channels, channelId: channels.some((c) => c.id === raw.channelId) ? String(raw.channelId) : channels[0]?.id || "", ai: bornasAiSettings(raw.ai), ...(raw.jobId ? { jobId: String(raw.jobId) } : {}) };
  if (save) {
    const file = stateFile();
    fs.writeFileSync(file + ".tmp", stringifyJson(state));
    fs.renameSync(file + ".tmp", file);
  }
  return state;
};
export const readBornasState = (): BornasState | null => {
  const file = stateFile();
  if (!fs.existsSync(file)) return null;
  const raw = parseJson(fs.readFileSync(file, "utf8")) as Partial<BornasState> | null;
  return raw ? writeState(raw, false) : null;
};
export const saveBornasState = (raw: unknown): BornasState => writeState((raw || {}) as Partial<BornasState>);
export const addBornasDone = (channelId: string, hero: string, channelName = ""): void => {
  try {
    const state = readBornasState();
    const name = bornasHeroName(hero);
    // jobs started before the channels moved to the server carry an old local id: match by name then
    const channel = state?.channels.find((c) => c.id === channelId) || state?.channels.find((c) => !!channelName && c.name.trim().toLowerCase() === channelName.trim().toLowerCase());
    if (!state || !channel || !name || channel.done.some((d) => d.toLowerCase() === name.toLowerCase())) return;
    channel.done = bornasDoneList([...channel.done, name]);
    writeState(state);
  } catch (error) {
    logger.warn(String((error as Error)?.message || error));
  }
};
