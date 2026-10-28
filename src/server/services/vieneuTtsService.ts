import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { randomUUID } from "crypto";
import { createInterface } from "readline";
import { MOTION_VOICE as C } from "../../constants/motionVoice.js";
import type { MotionVoicePreset } from "../../types/motionVideo.js";
import { getDataDirectory, getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
let setup: Promise<string> | undefined;
interface WorkerSlot {
  child?: ChildProcessWithoutNullStreams;
  queue: Promise<unknown>;
  idle?: ReturnType<typeof setTimeout>;
  requests: Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>;
}
export interface VieneuModelTarget {
  model: string;
  python: string;
}
const slots = new Map<string, WorkerSlot>();
const slotOf = (key: string): WorkerSlot => {
  let slot = slots.get(key);
  if (!slot) slots.set(key, (slot = { queue: Promise.resolve(), requests: new Map() }));
  return slot;
};
export const vieneuRoot = (): string => path.join(getDataDirectory(), C.ROOT);
const execute = (python: string, args: string[], signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error(C.CANCELLED));
    const child = spawn(python, args, { windowsHide: true });
    let errors: string = MR.MOTION_TEXT_EMPTY;
    const abort = () => child.kill();
    const timer = setTimeout(abort, C.TIMEOUT);
    signal?.addEventListener(MR.MOTION_TEXT_ABORT, abort, { once: true });
    child.stderr.on(MR.MOTION_TEXT_DATA, (data) => {
      errors = (errors + data).slice(-2500);
    });
    const clear = () => {
      clearTimeout(timer);
      signal?.removeEventListener(MR.MOTION_TEXT_ABORT, abort);
    };
    child.on(MR.MOTION_TEXT_ERROR, (error) => {
      clear();
      reject(error);
    });
    child.on(MR.MOTION_TEXT_CLOSE, (code) => {
      clear();
      code === 0 && !signal?.aborted ? resolve() : reject(new Error(signal?.aborted ? C.CANCELLED : errors || C.FAILED));
    });
  });
export const ensureVieneuRuntime = async (signal?: AbortSignal, log?: (value: string) => void): Promise<string> => {
  const configured = process.env[C.PYTHON_ENV];
  if (configured) return configured;
  if (!setup)
    setup = (async () => {
      const root = vieneuRoot(),
        runtime = path.join(root, C.RUNTIME),
        python = path.join(runtime, process.platform === MR.MOTION_TEXT_WIN32 ? MR.MOTION_TEXT_SCRIPTS_PYTHON_EXE : MR.MOTION_TEXT_BIN_PYTHON),
        ready = path.join(runtime, MR.MOTION_TEXT_VIENEU_VERSION_JSON);
      fs.mkdirSync(root, { recursive: true });
      if (fs.existsSync(python) && fs.existsSync(ready)) {
        const version = parseJson(fs.readFileSync(ready, MR.MOTION_TEXT_UTF8));
        if (version.package === C.PACKAGE && version.onnx === C.ONNX) return python;
      }
      log?.(C.SETUP);
      if (!fs.existsSync(python)) await execute(getPythonCommand(), [MR.MOTION_TEXT_M, MR.MOTION_TEXT_VENV, runtime], signal);
      await execute(python, [MR.MOTION_TEXT_M, MR.MOTION_TEXT_PIP, MR.MOTION_TEXT_INSTALL, MR.MOTION_TEXT_DISABLE_PIP_VERSION_CHECK, C.PACKAGE, C.ONNX], signal);
      fs.writeFileSync(ready, stringifyJson({ package: C.PACKAGE, onnx: C.ONNX }));
      return python;
    })().catch((error) => {
      setup = undefined;
      throw error;
    });
  return setup;
};
let asrSetup: Promise<void> | undefined;
export const ensureVieneuAsr = (signal?: AbortSignal, log?: (value: string) => void): Promise<void> => {
  if (!asrSetup)
    asrSetup = (async () => {
      const python = await ensureVieneuRuntime(signal, log),
        marker = path.join(vieneuRoot(), C.RUNTIME, C.ASR.MARKER);
      if (fs.existsSync(marker) && parseJson(fs.readFileSync(marker, MR.MOTION_TEXT_UTF8)).package === C.ASR.PACKAGE) return;
      log?.(C.ASR.SETUP);
      await execute(python, [MR.MOTION_TEXT_M, MR.MOTION_TEXT_PIP, MR.MOTION_TEXT_INSTALL, MR.MOTION_TEXT_DISABLE_PIP_VERSION_CHECK, C.ASR.PACKAGE], signal);
      fs.writeFileSync(marker, stringifyJson({ package: C.ASR.PACKAGE }));
    })().catch((error) => {
      asrSetup = undefined;
      throw error;
    });
  return asrSetup;
};
const closeSlot = (slot: WorkerSlot): void => {
  clearTimeout(slot.idle);
  const child = slot.child;
  slot.child = undefined;
  child?.kill();
  for (const pending of slot.requests.values()) pending.reject(new Error(C.CANCELLED));
  slot.requests.clear();
};
export const closeVieneuWorker = (): void => {
  for (const slot of slots.values()) closeSlot(slot);
};
const request = async <T>(command: Record<string, unknown>, signal?: AbortSignal, log?: (value: string) => void, target?: VieneuModelTarget): Promise<T> => {
  const slot = slotOf(target ? target.model : MR.MOTION_TEXT_EMPTY);
  const work = async (): Promise<T> => {
    if (signal?.aborted) throw new Error(C.CANCELLED);
    clearTimeout(slot.idle);
    if (!slot.child) {
      const python = target ? target.python : await ensureVieneuRuntime(signal, log);
      if (signal?.aborted) throw new Error(C.CANCELLED);
      const child = spawn(python, [MR.MOTION_TEXT_U, getStaticResourcePath(C.WORKER), vieneuRoot(), ...(target ? [target.model] : [])], { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: MR.MOTION_TEXT_UTF_8 } });
      slot.child = child;
      let errors: string = MR.MOTION_TEXT_EMPTY;
      child.stderr.on(MR.MOTION_TEXT_DATA, (chunk) => {
        errors = (errors + String(chunk)).slice(-2000);
      });
      createInterface({ input: child.stdout }).on(MR.MOTION_TEXT_LINE, (line) => {
        try {
          const response = parseJson(line),
            pending = slot.requests.get(response.id);
          if (pending) {
            slot.requests.delete(response.id);
            response.error ? pending.reject(new Error(response.error)) : pending.resolve(response.result);
          }
        } catch {}
      });
      const failed = () => {
        if (slot.child !== child) return;
        slot.child = undefined;
        for (const pending of slot.requests.values()) pending.reject(new Error(errors || C.FAILED));
        slot.requests.clear();
      };
      child.on(MR.MOTION_TEXT_ERROR, failed);
      child.on(MR.MOTION_TEXT_CLOSE, failed);
      child.stdin.on(MR.MOTION_TEXT_ERROR, failed);
    }
    return new Promise<T>((resolve, reject) => {
      const id = randomUUID(),
        abort = () => closeSlot(slot);
      const timer = setTimeout(abort, C.TIMEOUT);
      signal?.addEventListener(MR.MOTION_TEXT_ABORT, abort, { once: true });
      const clear = () => {
        clearTimeout(timer);
        signal?.removeEventListener(MR.MOTION_TEXT_ABORT, abort);
        slot.idle = setTimeout(() => closeSlot(slot), C.IDLE);
        slot.idle.unref();
      };
      slot.requests.set(id, {
        resolve: (value) => {
          clear();
          resolve(value);
        },
        reject: (error) => {
          clear();
          reject(error);
        },
      });
      slot.child!.stdin.write(stringifyJson({ ...command, id }) + MR.MOTION_TEXT_SYMBOL_27);
    });
  };
  const pending = slot.queue.then(work, work);
  slot.queue = pending.catch(() => {});
  if (!signal) return pending;
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new Error(C.CANCELLED));
    signal.addEventListener(MR.MOTION_TEXT_ABORT, aborted, { once: true });
    if (signal.aborted) aborted();
    pending.then(resolve, reject).finally(() => signal.removeEventListener(MR.MOTION_TEXT_ABORT, aborted));
  });
};
export const listVieneuVoices = (signal?: AbortSignal, log?: (value: string) => void): Promise<MotionVoicePreset[]> => request({ command: MR.MOTION_TEXT_VOICES }, signal, log);
export interface VieneuDelivery {
  temperature?: number;
  silence?: number;
  pauses?: { clause?: number; sentence?: number; beat?: number };
}
type SpeechResult = { seconds: number; sampleRate: number; backend: string };
interface SpeechEntry {
  text: string;
  voice: string;
  file: string;
  delivery: VieneuDelivery;
  signal?: AbortSignal;
  log?: (value: string) => void;
  resolve: (value: SpeechResult) => void;
  reject: (error: Error) => void;
}
const speechPending = new Map<string, SpeechEntry[]>();
const speechDraining = new Set<string>();
const backendLogged = new Set<string>();
const speechGroup = (entry: SpeechEntry): string => [entry.voice, entry.delivery.temperature ?? MR.MOTION_TEXT_EMPTY, entry.delivery.silence ?? MR.MOTION_TEXT_EMPTY, stringifyJson(entry.delivery.pauses)].join(C.BATCH_SEP);
const takeSpeech = (key: string): SpeechEntry[] => {
  const list = speechPending.get(key) || [];
  for (const entry of list.filter((item) => item.signal?.aborted)) entry.reject(new Error(C.CANCELLED));
  const live = list.filter((item) => !item.signal?.aborted);
  if (!live.length) {
    speechPending.delete(key);
    return [];
  }
  const group = speechGroup(live[0]);
  const taken = live.filter((item) => speechGroup(item) === group).slice(0, C.BATCH_MAX);
  speechPending.set(
    key,
    live.filter((item) => !taken.includes(item)),
  );
  return taken;
};
const drainSpeech = (key: string, target?: VieneuModelTarget): void => {
  if (speechDraining.has(key)) return;
  speechDraining.add(key);
  void slotOf(key).queue.then(async () => {
    speechDraining.delete(key);
    const taken = takeSpeech(key);
    if (!taken.length) return;
    const head = taken[0];
    const logBackend = (result: SpeechResult) => {
      if (!result?.backend || backendLogged.has(key)) return;
      backendLogged.add(key);
      head.log?.(C.BACKEND_LOG(String(result.backend)));
    };
    try {
      if (taken.length === 1) {
        const result = await request<SpeechResult>({ command: MR.MOTION_TEXT_SYNTHESIZE, text: head.text, voice: head.voice, file: head.file, ...head.delivery }, head.signal, head.log, target);
        logBackend(result);
        head.resolve(result);
      } else {
        const results = await request<({ error?: string } & SpeechResult)[]>({ command: C.BATCH_COMMAND, voice: head.voice, ...head.delivery, items: taken.map((item) => ({ text: item.text, file: item.file })) }, head.signal, head.log, target);
        taken.forEach((item, index) => {
          const result = results?.[index];
          if (!result || result.error) item.reject(new Error(result?.error || C.FAILED));
          else {
            logBackend(result);
            item.resolve(result);
          }
        });
      }
    } catch (error) {
      for (const item of taken) item.reject(error as Error);
    }
    if (speechPending.get(key)?.length) drainSpeech(key, target);
  });
};
export const synthesizeVieneuSpeech = (text: string, voice: string, file: string, signal?: AbortSignal, log?: (value: string) => void, delivery: VieneuDelivery = {}, target?: VieneuModelTarget): Promise<SpeechResult> =>
  new Promise<SpeechResult>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error(C.CANCELLED));
    const key = target ? target.model : MR.MOTION_TEXT_EMPTY;
    const list = speechPending.get(key) || [];
    list.push({ text, voice, file, delivery, signal, log, resolve, reject });
    speechPending.set(key, list);
    drainSpeech(key, target);
  });
export const registerVieneuVoice = (voice: string, name: string, gender: string, file: string, signal?: AbortSignal, options?: { denoise?: boolean }): Promise<MotionVoicePreset> => request({ command: MR.MOTION_TEXT_REGISTER, voice, name, gender, file, ...(options?.denoise === undefined ? {} : { denoise: options.denoise }) }, signal);
export const transcribeVieneuAudio = async (file: string, language: string, signal?: AbortSignal, log?: (value: string) => void): Promise<{ text: string; words: { w: string; s: number; e: number }[] }> => {
  await ensureVieneuAsr(signal, log);
  return request({ command: C.ASR.COMMAND, file, language, model: C.ASR.MODEL }, signal, log);
};
process.once(MR.MOTION_TEXT_EXIT, closeVieneuWorker);
