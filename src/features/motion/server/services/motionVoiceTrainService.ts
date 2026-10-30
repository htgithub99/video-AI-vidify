import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { createInterface } from "readline";
import { MOTION_VOICE_TRAIN as T } from "../../../../constants/motionVoiceTrain.js";
import { MOTION_VOICE_SPEED as V } from "../../../../constants/motionVoice.js";
import { getPythonCommand } from "../../../../server/utils/paths.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
import { decodeVoicePcm, voicePauses } from "./motionVoicePaceService.js";
import { closeVieneuWorker, transcribeVieneuAudio, vieneuRoot } from "../../../../server/services/vieneuTtsService.js";
export interface MotionTrainedVoice {
  id: string;
  name: string;
  gender: string;
  description: string;
  model: string;
  minutes: number;
  clips: number;
  createdAt: number;
}
export interface MotionTrainInput {
  name: string;
  gender: string;
  description: string;
  consent: boolean;
  files: { name: string; base64: string }[];
}
interface TrainCtx {
  signal: AbortSignal;
  log: (s: string) => void;
  progress: (p: number, stage?: string) => void;
}
const envPython = (): string => path.join(vieneuRoot(), T.ENV_DIR, process.platform === T.WIN32 ? T.PY_WIN : T.PY_NIX);
const repoDir = (): string => path.join(vieneuRoot(), T.REPO_DIR);
const registryFile = (): string => path.join(vieneuRoot(), T.REGISTRY);
export const listTrainedVoices = (): MotionTrainedVoice[] => {
  try {
    const list = parseJson(fs.readFileSync(registryFile(), T.UTF8)) as MotionTrainedVoice[];
    return _.filter(list, (v) => fs.existsSync(v.model));
  } catch {
    return [];
  }
};
export const trainedVoiceTarget = (v: MotionTrainedVoice): { model: string; python: string } => ({ model: v.model, python: envPython() });
export const trainedVoice = (id: string): MotionTrainedVoice | undefined => _.find(listTrainedVoices(), { id });
export const deleteTrainedVoice = async (id: string): Promise<MotionTrainedVoice[]> => {
  const all = listTrainedVoices();
  const v = _.find(all, { id });
  if (!v) throw new Error(T.ERR.NOT_FOUND);
  closeVieneuWorker();
  await fs.promises.rm(path.dirname(path.dirname(path.dirname(v.model))), { recursive: true, force: true }).catch(_.noop);
  const rest = _.reject(all, { id });
  writeMotionJsonAtomic(registryFile(), rest);
  return rest;
};
const run = (cmd: string, args: string[], ctx: TrainCtx, opts: { cwd?: string; onLine?: (line: string) => void } = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    if (ctx.signal.aborted) return reject(new Error(T.CANCELLED));
    const child = spawn(cmd, args, { cwd: opts.cwd, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: T.UTF8, PYTHONUTF8: T.ONE, HF_HOME: path.join(vieneuRoot(), T.MODELS) } });
    let tail: string = T.EMPTY;
    const keep = (line: string) => {
      tail = (tail + T.NL + line).slice(-3000);
      opts.onLine?.(line);
    };
    createInterface({ input: child.stdout }).on(T.EV.LINE, keep);
    createInterface({ input: child.stderr }).on(T.EV.LINE, keep);
    const abort = () => child.kill();
    ctx.signal.addEventListener(T.EV.ABORT, abort, { once: true });
    child.on(T.EV.ERROR, (e) => {
      ctx.signal.removeEventListener(T.EV.ABORT, abort);
      reject(e);
    });
    child.on(T.EV.CLOSE, (code) => {
      ctx.signal.removeEventListener(T.EV.ABORT, abort);
      code === 0 && !ctx.signal.aborted ? resolve() : reject(new Error(tail.trim().split(T.NL).slice(-6).join(T.NL) || String(code)));
    });
  });
const ensureRepo = async (ctx: TrainCtx): Promise<void> => {
  const dir = repoDir();
  if (fs.existsSync(path.join(dir, T.SCRIPTS.TRAIN))) return;
  await fs.promises.rm(dir, { recursive: true, force: true }).catch(_.noop);
  try {
    await run(T.GIT, [...T.GIT_ARGS, T.REPO_URL, dir], ctx);
    return;
  } catch {
    _.noop();
  }
  try {
    const res = await fetch(T.REPO_ZIP_URL, { signal: ctx.signal });
    if (!res.ok) throw new Error(String(res.status));
    const zip = path.join(vieneuRoot(), T.ZIP_NAME);
    await fs.promises.writeFile(zip, Buffer.from(await res.arrayBuffer()));
    await run(T.TAR, [T.TAR_ARGS, zip], ctx, { cwd: vieneuRoot() });
    await fs.promises.rename(path.join(vieneuRoot(), T.REPO_ZIP_DIR), dir);
    await fs.promises.rm(zip, { force: true });
  } catch {
    throw new Error(T.ERR.REPO);
  }
};
const ensureEnv = async (ctx: TrainCtx): Promise<string> => {
  fs.mkdirSync(vieneuRoot(), { recursive: true });
  await ensureRepo(ctx);
  const python = envPython();
  const marker = path.join(vieneuRoot(), T.ENV_DIR, T.MARKER);
  if (fs.existsSync(python) && fs.existsSync(marker) && parseJson(fs.readFileSync(marker, T.UTF8)).v === T.MARKER_VERSION) return python;
  ctx.log(T.LOG.SETUP);
  if (!fs.existsSync(python)) await run(getPythonCommand(), [...T.VENV, path.join(vieneuRoot(), T.ENV_DIR)], ctx);
  await run(python, [...T.PIP, ...T.TORCH], ctx);
  await run(python, [...T.PIP, T.EDITABLE, repoDir() + T.EXTRAS], ctx);
  fs.writeFileSync(marker, stringifyJson({ v: T.MARKER_VERSION }));
  return python;
};
const checkGpu = async (python: string, ctx: TrainCtx): Promise<void> => {
  let out: string = T.EMPTY;
  await run(python, [...T.GPU_CHECK], ctx, { onLine: (l) => (out = l) }).catch(() => {
    throw new Error(T.ERR.NO_GPU);
  });
  const gpu = parseJson(out || T.EMPTY_JSON) as { ok?: boolean; name?: string; gb?: number };
  if (!gpu.ok) throw new Error(T.ERR.NO_GPU);
  if ((gpu.gb || 0) < T.MIN_GPU_GB) throw new Error(T.ERR.LOW_GPU(gpu.gb || 0));
  ctx.log(T.LOG.GPU(gpu.name || T.EMPTY, gpu.gb || 0));
};
const splitFile = async (file: string, outDir: string, start: number, ctx: TrainCtx): Promise<{ file: string; seconds: number }[]> => {
  const { seconds, pauses } = voicePauses(await decodeVoicePcm(file, ctx.signal), T.CLIP.CUT_PAUSE);
  const speech: [number, number][] = [];
  let cursor = 0;
  for (const p of pauses) {
    if (p.at > cursor) speech.push([cursor, p.at]);
    cursor = p.at + p.d;
  }
  if (cursor < seconds) speech.push([cursor, seconds]);
  const clips: [number, number][] = [];
  let cur: [number, number] | null = null;
  for (const [a, b] of speech) {
    if (!cur) cur = [a, b];
    else if (b - cur[0] <= T.CLIP.MAX && cur[1] - cur[0] < T.CLIP.TARGET) cur[1] = b;
    else {
      clips.push(cur);
      cur = [a, b];
    }
  }
  if (cur) clips.push(cur);
  const out: { file: string; seconds: number }[] = [];
  for (const [a, b] of clips) {
    const d = b - a;
    if (d < T.CLIP.MIN || d > T.CLIP.MAX + 5) continue;
    const name = T.CLIP_PREFIX + _.padStart(String(start + out.length), T.PAD, T.ZERO) + T.WAV;
    const target = path.join(outDir, name);
    await runMotionAudioProcess([T.FF.SS, Math.max(0, a - T.CLIP.PAD_BEFORE).toFixed(3), T.FF.TO, (b + T.CLIP.PAD_AFTER).toFixed(3), T.FF.I, file, T.FF.AC, T.ONE, T.FF.AR, T.CLIP_RATE, target], ctx.signal);
    out.push({ file: target, seconds: d });
  }
  return out;
};
export const trainVieneuVoice = async (input: MotionTrainInput, ctx: TrainCtx): Promise<MotionTrainedVoice> => {
  if (!input.consent) throw new Error(T.ERR.CONSENT);
  const name = _.trim(input.name);
  if (!name) throw new Error(T.ERR.NAME);
  if (!input.files?.length) throw new Error(T.ERR.NO_FILES);
  if (input.files.length > T.MAX_FILES) throw new Error(T.ERR.TOO_MANY);
  const buffers = _.map(input.files, (f) => ({ name: path.basename(f.name), buf: Buffer.from(String(f.base64 || T.EMPTY).replace(T.DATA_URL_RE, T.EMPTY), T.BASE64) }));
  if (_.sumBy(buffers, (b) => b.buf.length) > T.MAX_BYTES) throw new Error(T.ERR.TOO_BIG);
  if (_.some(buffers, (b) => !_.includes(V.AUDIO.EXTS as readonly string[], _.toLower(path.extname(b.name))))) throw new Error(T.ERR.FORMAT);
  const id = T.ID_PREFIX + (_.deburr(name).toLowerCase().replace(T.SLUG_RE, T.UNDERSCORE).slice(0, 24) || T.RUN) + T.UNDERSCORE + randomUUID().slice(0, 6);
  const dir = path.join(vieneuRoot(), T.TRAIN_DIR, id);
  const source = path.join(dir, T.SOURCE),
    dataset = path.join(dir, T.DATASET),
    raw = path.join(dataset, T.RAW);
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(raw, { recursive: true });
  try {
    const python = await ensureEnv(ctx);
    await checkGpu(python, ctx);
    ctx.progress(T.PROGRESS.SETUP);
    const files: string[] = [];
    for (const [i, b] of buffers.entries()) {
      const f = path.join(source, i + T.UNDERSCORE + b.name.replace(T.FILE_RE, T.UNDERSCORE));
      await fs.promises.writeFile(f, b.buf);
      files.push(f);
    }
    ctx.log(T.LOG.SPLIT(files.length));
    const clips: { file: string; seconds: number }[] = [];
    for (const f of files) clips.push(...(await splitFile(f, raw, clips.length, ctx)));
    const total = _.sumBy(clips, RT_SERVER.SECONDS);
    ctx.log(T.LOG.CLIPS(clips.length, _.round(total / 60, 1)));
    if (total < T.MIN_SECONDS) throw new Error(T.ERR.TOO_SHORT(_.round(total / 60, 1)));
    if (total < T.GOOD_SECONDS) ctx.log(T.LOG.WARN_SHORT(_.round(total / 60, 1)));
    ctx.progress(T.PROGRESS.SPLIT);
    ctx.log(T.LOG.ASR(clips.length));
    const rows: string[] = [];
    const kept: { file: string; seconds: number }[] = [];
    for (const [i, c] of clips.entries()) {
      const r = await transcribeVieneuAudio(c.file, T.LANG, ctx.signal, ctx.log).catch(() => null);
      const text = _.trim(String(r?.text || T.EMPTY).replace(T.PIPE_RE, T.SPACE));
      if (text.split(T.SPACE).length >= 2) {
        rows.push(path.basename(c.file) + T.CSV_SEP + text);
        kept.push(c);
      } else await fs.promises.rm(c.file, { force: true }).catch(_.noop);
      ctx.progress(T.PROGRESS.SPLIT + ((T.PROGRESS.ASR - T.PROGRESS.SPLIT) * (i + 1)) / clips.length);
    }
    ctx.log(T.LOG.ASR_DONE(kept.length, clips.length - kept.length));
    if (_.sumBy(kept, RT_SERVER.SECONDS) < T.MIN_SECONDS) throw new Error(T.ERR.TOO_SHORT(_.round(_.sumBy(kept, RT_SERVER.SECONDS) / 60, 1)));
    await fs.promises.writeFile(path.join(dataset, T.METADATA), rows.join(T.NL) + T.NL, T.UTF8);
    closeVieneuWorker();
    ctx.log(T.LOG.PREPARE);
    await run(python, [T.SCRIPTS.PREPARE, T.ARG.DATASET, dataset], ctx, { cwd: repoDir() });
    ctx.progress(T.PROGRESS.PREPARE);
    ctx.log(T.LOG.TRAIN);
    let lastLog = 0;
    await run(python, [T.SCRIPTS.TRAIN, T.ARG.DATA, path.join(dataset, T.PARQUET), T.ARG.RUN, T.RUN, T.ARG.OUTPUT, path.join(dir, T.OUTPUT), T.ARG.EPOCHS, T.EPOCHS, ...T.TRAIN_ARGS], ctx, {
      cwd: repoDir(),
      onLine: (line) => {
        const m = line.match(T.STEP_RE);
        if (!m) return;
        const step = Number(m[1]),
          totalSteps = Math.max(1, Number(m[2]));
        ctx.progress(T.PROGRESS.TRAIN + ((T.PROGRESS.TRAIN_END - T.PROGRESS.TRAIN) * step) / totalSteps);
        if (Date.now() - lastLog > T.LOG_EVERY_MS) {
          lastLog = Date.now();
          ctx.log(T.LOG.STEP(step, totalSteps));
        }
      },
    });
    const merged = path.join(dir, T.OUTPUT, T.RUN, T.MERGED);
    ctx.log(T.LOG.VOICE);
    const ref = _.minBy(
      _.filter(kept, (c) => c.seconds >= T.CLIP.REF_MIN && c.seconds <= T.CLIP.REF_MAX),
      (c) => Math.abs(c.seconds - T.CLIP.REF_BEST),
    );
    if (!ref) throw new Error(T.ERR.NO_REF);
    await run(python, [T.SCRIPTS.VOICE, T.ARG.AUDIO, ref.file, T.ARG.NAME, name, T.ARG.DESCRIPTION, _.trim(input.description) || name, T.ARG.GENDER, input.gender, T.ARG.OUT, merged, T.ARG.DEFAULT], ctx, { cwd: repoDir() });
    ctx.progress(T.PROGRESS.VOICE);
    const voice: MotionTrainedVoice = { id, name, gender: input.gender, description: _.trim(input.description), model: merged, minutes: _.round(_.sumBy(kept, RT_SERVER.SECONDS) / 60, 1), clips: kept.length, createdAt: Date.now() };
    writeMotionJsonAtomic(registryFile(), [..._.reject(listTrainedVoices(), { id }), voice]);
    await fs.promises.rm(source, { recursive: true, force: true }).catch(_.noop);
    for (const d of await fs.promises.readdir(path.join(dir, T.OUTPUT, T.RUN)).catch(() => [] as string[])) if (d.startsWith(T.CHECKPOINT)) await fs.promises.rm(path.join(dir, T.OUTPUT, T.RUN, d), { recursive: true, force: true }).catch(_.noop);
    ctx.log(T.LOG.DONE(name));
    ctx.progress(1);
    return voice;
  } catch (e) {
    await fs.promises.rm(source, { recursive: true, force: true }).catch(_.noop);
    throw e;
  }
};
